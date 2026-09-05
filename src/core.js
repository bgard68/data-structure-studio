'use strict';
/* ============ Structura core: recorder, renderer, player, UI ============ */

const SVGNS = 'http://www.w3.org/2000/svg';
const $ = s => document.querySelector(s);
let uid = 1;
const nid = () => 'n' + (uid++);

const SYMS = '#@$%&*+?!';
const ALNUM = 'ABCDEFGHJKMNPQRSTUVWXYZ0123456789';
function randToken() {
  const r = Math.random();
  if (r < 0.25) return ALNUM[Math.floor(Math.random() * ALNUM.length)] + SYMS[Math.floor(Math.random() * SYMS.length)];
  if (r < 0.6) return ALNUM[Math.floor(Math.random() * ALNUM.length)] + ALNUM[Math.floor(Math.random() * ALNUM.length)];
  return String(Math.floor(Math.random() * 99));
}
const COLL = new Intl.Collator(undefined, { numeric: true, sensitivity: 'variant' });
function cmp(a, b) {
  // single collation = guaranteed total order ("2" < "10" still holds via numeric:true)
  const c = COLL.compare(String(a), String(b));
  return c < 0 ? -1 : c > 0 ? 1 : 0;
}
const esc = v => String(v).slice(0, 4).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const shortVal = v => String(v).slice(0, 4);

/* ---------------- Recorder ---------------- */
class Rec {
  constructor() { this.steps = []; this.count = 0; }
  note(text) { this.steps.push({ t: 'note', text, count: this.count }); }
  tick(n = 1) { this.count += n; }
  cur(id) { this.steps.push({ t: 'cur', id, count: this.count }); }
  snap(struct, opts) { this.steps.push({ t: 'scene', scene: struct.scene(), count: this.count, slow: opts && opts.slow }); }
  done(opName, big) { this.steps.push({ t: 'done', text: `${opName} — ${this.count} step${this.count === 1 ? '' : 's'} · ${big}`, count: this.count }); }
}

/* ---------------- Base structure ---------------- */
class Struct {
  constructor() { this.fx = { hl: new Set(), hit: new Set(), doom: new Set(), fresh: new Set(), dying: new Set() }; }
  sizeInfo() { return `n = ${this.n || 0}`; }
  clearFx() { for (const k in this.fx) this.fx[k].clear(); }
  snapFx(R, opts) { R.snap(this, opts); this.clearFx(); }
  scene() { return { w: 100, h: 100, nodes: [], edges: [], ptrs: [], frames: [] }; }
  edgeCls(a, b) {
    const k = a + '>' + b;
    if (this.fx.fresh.has(k)) return 'fresh';
    if (this.fx.dying.has(k)) return 'dying';
    return '';
  }
  nodeCls(id, base) {
    let c = base || '';
    if (this.fx.hl.has(id)) c += ' hl';
    if (this.fx.hit.has(id)) c += ' hit';
    if (this.fx.doom.has(id)) c += ' doom';
    return c.trim();
  }
}

/* ---------------- Renderer ---------------- */
class Renderer {
  constructor(svg) {
    this.svg = svg;
    this.defs();
    this.gFrames = this.layer(); this.gEdges = this.layer(); this.gNodes = this.layer(); this.gPtrs = this.layer();
    this.nodes = new Map();   // id -> {x,y,tx,ty,alpha,talpha,el,txt,shapeEl,tagEl,scene}
    this.edges = new Map();   // key -> {el, spec}
    this.curId = null;
    this.vb = { x: 0, y: 0, w: 400, h: 300 }; this.tvb = { ...this.vb };
    this.sceneMeta = { w: 400, h: 300, frames: [], ptrs: [] };
    this.hint = null;
    this.rm = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    this._raf = this.frame.bind(this);
    requestAnimationFrame(this._raf);
  }
  layer() { const g = document.createElementNS(SVGNS, 'g'); this.svg.appendChild(g); return g; }
  defs() {
    const d = document.createElementNS(SVGNS, 'defs');
    d.innerHTML = ['', 'fresh', 'dying'].map(c => {
      const id = 'arr' + (c || 'std');
      return `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" class="mk-${c || 'std'}"></path></marker>`;
    }).join('');
    this.svg.appendChild(d);
    const st = document.createElement('style');
    st.textContent = '.mk-std{fill:var(--node-edge)} .mk-fresh{fill:var(--fresh)} .mk-dying{fill:var(--cut)}';
    document.head ? document.head.appendChild(st) : document.body.appendChild(st);
  }
  applyScene(scene, instant) {
    this.sceneMeta = scene;
    const seen = new Set();
    for (const n of scene.nodes) {
      seen.add(n.id);
      let vn = this.nodes.get(n.id);
      if (!vn) {
        const el = document.createElementNS(SVGNS, 'g');
        const shapeEl = n.shape === 'circ'
          ? document.createElementNS(SVGNS, 'circle')
          : document.createElementNS(SVGNS, 'rect');
        if (n.shape === 'circ') { shapeEl.setAttribute('r', 21); }
        else { shapeEl.setAttribute('x', -29); shapeEl.setAttribute('y', -18); shapeEl.setAttribute('width', 58); shapeEl.setAttribute('height', 36); shapeEl.setAttribute('rx', 5); }
        const txt = document.createElementNS(SVGNS, 'text');
        const tagEl = document.createElementNS(SVGNS, 'text');
        tagEl.setAttribute('class', 'tag'); tagEl.setAttribute('text-anchor', 'middle'); tagEl.setAttribute('y', n.shape === 'circ' ? 36 : 32);
        el.appendChild(shapeEl); el.appendChild(txt); el.appendChild(tagEl);
        this.gNodes.appendChild(el);
        vn = { x: n.x, y: n.y, tx: n.x, ty: n.y, alpha: 0, talpha: 1, el, txt, tagEl, shapeEl };
        this.nodes.set(n.id, vn);
      }
      vn.tx = n.x; vn.ty = n.y; vn.talpha = 1; vn.dead = false;
      if (instant) { vn.x = n.x; vn.y = n.y; vn.alpha = 1; }
      vn.el.setAttribute('class', ('node ' + (n.cls || '')).trim());
      vn.txt.textContent = shortVal(n.v);
      vn.tagEl.textContent = n.tag || '';
    }
    for (const [id, vn] of this.nodes) {
      if (!seen.has(id)) { vn.talpha = 0; vn.dead = true; if (instant) vn.alpha = 0; }
    }
    // edges: rebuild key set
    const ekeys = new Set();
    for (const e of scene.edges) {
      const key = e.from + '>' + e.to + ':' + (e.kind || '') + ':' + (e.lane || '');
      ekeys.add(key);
      let ve = this.edges.get(key);
      if (!ve) {
        const el = document.createElementNS(SVGNS, 'path');
        this.gEdges.appendChild(el);
        ve = { el }; this.edges.set(key, ve);
      }
      ve.spec = e;
      ve.el.setAttribute('class', ('edge ' + (e.cls || '') + (e.lane === 'prev' ? ' prevlane' : '')).trim());
      ve.el.setAttribute('marker-end', `url(#arr${e.cls || 'std'})`);
    }
    for (const [key, ve] of this.edges) if (!ekeys.has(key)) { ve.el.remove(); this.edges.delete(key); }
    // frames (static furniture)
    this.gFrames.innerHTML = '';
    for (const f of scene.frames || []) {
      if (f.t === 'rect') {
        const g = document.createElementNS(SVGNS, 'g'); g.setAttribute('class', 'bucket');
        g.innerHTML = `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="4"></rect><text x="${f.x + f.w / 2}" y="${f.y + f.h / 2}">${f.label}</text>`;
        this.gFrames.appendChild(g);
      } else if (f.t === 'text') {
        const t = document.createElementNS(SVGNS, 'text');
        t.setAttribute('class', 'emptyhint'); t.setAttribute('x', f.x); t.setAttribute('y', f.y);
        t.textContent = f.label; this.gFrames.appendChild(t);
      }
    }
    // viewBox target
    const pad = 56;
    this.tvb = { x: scene.x0 - pad, y: scene.y0 - pad, w: scene.w + pad * 2, h: scene.h + pad * 2 };
    if (instant) this.vb = { ...this.tvb };
  }
  setCur(id) { this.curId = id; }
  frame() {
    try { this.frameBody(); }
    catch (err) { console.error(err); }
    finally { requestAnimationFrame(this._raf); }  // the render loop must survive anything
  }
  frameBody() {
    const k = this.rm && this.rm.matches ? 1 : 0.16;
    for (const [id, vn] of this.nodes) {
      vn.x += (vn.tx - vn.x) * k; vn.y += (vn.ty - vn.y) * k;
      vn.alpha += (vn.talpha - vn.alpha) * k;
      if (Math.abs(vn.tx - vn.x) < .4) vn.x = vn.tx;
      if (Math.abs(vn.ty - vn.y) < .4) vn.y = vn.ty;
      if (Math.abs(vn.talpha - vn.alpha) < .02) vn.alpha = vn.talpha;
      if (vn.dead && vn.alpha <= 0) { vn.el.remove(); this.nodes.delete(id); continue; }
      vn.el.setAttribute('transform', `translate(${vn.x},${vn.y})`);
      vn.el.setAttribute('opacity', vn.alpha.toFixed(3));
    }
    for (const [, ve] of this.edges) this.drawEdge(ve);
    this.drawPtrs();
    for (const p of ['x', 'y', 'w', 'h']) {
      this.vb[p] += (this.tvb[p] - this.vb[p]) * k;
      if (Math.abs(this.tvb[p] - this.vb[p]) < .5) this.vb[p] = this.tvb[p];
    }
    this.svg.setAttribute('viewBox', `${this.vb.x} ${this.vb.y} ${this.vb.w} ${this.vb.h}`);
  }
  anchor(vn, other, shape) {
    // point on node boundary toward other node
    const dx = other.x - vn.x, dy = other.y - vn.y;
    const d = Math.hypot(dx, dy) || 1;
    if (shape === 'circ') return { x: vn.x + dx / d * 23, y: vn.y + dy / d * 23 };
    // rect 58x36
    const rx = 31, ry = 20;
    const sx = Math.abs(dx / d) < 1e-6 ? Infinity : rx / Math.abs(dx / d);
    const sy = Math.abs(dy / d) < 1e-6 ? Infinity : ry / Math.abs(dy / d);
    const s = Math.min(sx, sy);
    return { x: vn.x + dx / d * s, y: vn.y + dy / d * s };
  }
  drawEdge(ve) {
    const e = ve.spec;
    const a = this.nodes.get(e.from), b = this.nodes.get(e.to);
    if (!a || !b) { ve.el.setAttribute('d', ''); return; }
    if (e.from === e.to) {
      // self-loop (single-node ring): a visible loop below the node
      const x = a.x, y = a.y + 18;
      ve.el.setAttribute('opacity', a.alpha.toFixed(3));
      ve.el.setAttribute('d', `M ${x - 12} ${y} C ${x - 36} ${y + 46}, ${x + 36} ${y + 46}, ${x + 12} ${y}`);
      return;
    }
    const shA = e.shape || 'rect', shB = e.shape || 'rect';
    let p1 = this.anchor(a, b, shA), p2 = this.anchor(b, a, shB);
    ve.el.setAttribute('opacity', Math.min(a.alpha, b.alpha).toFixed(3));
    if (e.lane) {
      // offset perpendicular for two-lane (doubly) edges
      const dx = p2.x - p1.x, dy = p2.y - p1.y, d = Math.hypot(dx, dy) || 1;
      const ox = -dy / d * 7, oy = dx / d * 7;
      p1 = { x: p1.x + ox, y: p1.y + oy }; p2 = { x: p2.x + ox, y: p2.y + oy };
      ve.el.setAttribute('d', `M${p1.x} ${p1.y} L${p2.x} ${p2.y}`);
      return;
    }
    if (e.kind === 'arc') {
      // long wrap-around link: bow it away from the centroid
      const mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x, dy = p2.y - p1.y, d = Math.hypot(dx, dy) || 1;
      const bow = e.bow || 60;
      const cx = mx - dy / d * bow, cy = my + dx / d * bow;
      ve.el.setAttribute('d', `M${p1.x} ${p1.y} Q${cx} ${cy} ${p2.x} ${p2.y}`);
      return;
    }
    ve.el.setAttribute('d', `M${p1.x} ${p1.y} L${p2.x} ${p2.y}`);
  }
  drawPtrs() {
    this.gPtrs.innerHTML = '';
    const groups = new Map(); // nodeId+side -> [labels]
    const list = [...(this.sceneMeta.ptrs || [])];
    if (this.curId && this.nodes.has(this.curId)) list.push({ name: 'cur', at: this.curId, side: 's', cur: true });
    for (const p of list) {
      const key = p.at + '|' + (p.side || 'n');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }
    for (const [key, ps] of groups) {
      const [id, side] = key.split('|');
      const vn = this.nodes.get(id);
      if (!vn) continue;
      const up = side === 'n';
      const isCirc = ps[0].shape === 'circ';
      const base = isCirc ? 24 : 21;
      ps.forEach((p, i) => {
        const g = document.createElementNS(SVGNS, 'g');
        g.setAttribute('class', 'ptr ' + (p.cur ? 'pcur' : 'pbadge'));
        const gap = 16, y0 = up ? vn.y - base - 8 : vn.y + base + 8;
        const ty = up ? y0 - i * gap - 6 : y0 + i * gap + 8;
        const ly1 = up ? vn.y - base : vn.y + base;
        const ly2 = up ? y0 - i * gap : y0 + i * gap;
        g.innerHTML = `<line x1="${vn.x}" y1="${ly1}" x2="${vn.x}" y2="${ly2}"></line><text x="${vn.x}" y="${ty}">${p.name}</text>`;
        g.setAttribute('opacity', vn.alpha.toFixed(3));
        this.gPtrs.appendChild(g);
      });
    }
  }
}

/* ---------------- Player ---------------- */
class Player {
  constructor(renderer) { this.R = renderer; this.busy = false; this.skip = false; }
  speedMult() { return Number($('#speed').value) / 10; }
  delay(ms) {
    if (this.skip) return Promise.resolve();
    return new Promise(res => setTimeout(res, ms / this.speedMult()));
  }
  logEntry(step, text, done) {
    const body = $('#logbody');
    const div = document.createElement('div');
    div.className = 'lentry' + (done ? ' ldone' : '');
    const num = document.createElement('span');
    num.className = 'lstep'; num.textContent = step;
    const p = document.createElement('p'); p.innerHTML = text;
    div.appendChild(num); div.appendChild(p);
    body.appendChild(div);
    while (body.children.length > 90) body.removeChild(body.firstChild);
    body.scrollTop = body.scrollHeight;
  }
  async play(steps, ctx) {
    this.busy = true; this.skip = false;
    document.body.classList.add('busy');
    setOpsEnabled(false);
    try {
      const msg = $('#msg'), cnt = $('#count');
      $('#logbody').innerHTML = '';
      for (const s of steps) {
        cnt.textContent = 'steps: ' + s.count;
        if (s.t === 'note') { msg.innerHTML = s.text; this.logEntry(s.count, s.text); await this.delay(420); }
        else if (s.t === 'cur') { this.R.setCur(s.id); await this.delay(400); }
        else if (s.t === 'scene') { this.R.applyScene(s.scene, this.skip); await this.delay(s.slow ? 700 : 520); }
        else if (s.t === 'done') {
          this.R.setCur(null);
          const line = s.text + (ctx ? ' · ' + ctx : '');
          msg.innerHTML = '<b>' + line + '</b>';
          this.logEntry(s.count, line, true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      // the player must always release the controls, whatever happened mid-run
      this.R.setCur(null);
      this.busy = false; this.skip = false;
      document.body.classList.remove('busy');
      setOpsEnabled(true);
    }
  }
}
