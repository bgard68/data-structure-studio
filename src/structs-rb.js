'use strict';
/* ============ Red-black tree (CLRS, NIL sentinel) ============ */

class RBTree extends BST {
  constructor() {
    super();
    this.NIL = { id: 'NIL', v: '', c: 'B', l: null, r: null, p: null };
    this.NIL.l = this.NIL.r = this.NIL.p = this.NIL;
    this.root = this.NIL;
  }
  static label = 'Red-Black';
  bigo() {
    const h = this.heightEdges();
    return [['search / insert / delete', `O(log n) — h is ${h} for n = ${this.n}`], ['red-black bound', `h ≤ 2·log₂(n+1) = ${(2 * Math.log2(this.n + 1)).toFixed(1)}`]];
  }
  colorCls(nd) { return nd.c === 'R' ? 'rb-r' : 'rb-b'; }
  showTag() { return ''; }
  scene() {
    const ns = [], edges = [];
    let ix = 0;
    const place = nd => {
      if (nd === this.NIL) return;
      place(nd.l);
      nd._x = ix++ * 54; nd._y = this.depth(nd) * 80;
      place(nd.r);
    };
    place(this.root);
    const visit = nd => {
      if (nd === this.NIL) return;
      ns.push({ id: nd.id, v: nd.v, shape: 'circ', x: nd._x, y: nd._y, cls: this.nodeCls(nd.id, this.colorCls(nd)) });
      for (const ch of [nd.l, nd.r]) if (ch !== this.NIL) edges.push({ from: nd.id, to: ch.id, shape: 'circ', cls: this.edgeCls(nd.id, ch.id) });
      visit(nd.l); visit(nd.r);
    };
    visit(this.root);
    const ptrs = this.root !== this.NIL ? [{ name: 'root', at: this.root.id, side: 'n', shape: 'circ' }] : [];
    const frames = ns.length ? [] : [{ t: 'text', x: 0, y: 40, label: 'empty tree — insert a value', w: 0, h: 0 }];
    const sc = { nodes: ns, edges, ptrs, frames, ...sceneBounds(ns, frames) };
    if (!ns.length) { sc.x0 = -200; sc.y0 = 0; sc.w = 400; sc.h = 100; }
    sc.y0 -= 46; sc.h += 70; sc.x0 -= 30; sc.w += 60;
    return sc;
  }
  depth(nd) { let d = 0, c = nd; while (c.p !== this.NIL && c.p) { d++; c = c.p; } return d; }
  rotL(R, x, quiet) {
    const y = x.r;
    if (!quiet) R.note(`<b>Left rotation</b> at <b>${esc(x.v)}</b>`);
    x.r = y.l; if (y.l !== this.NIL) y.l.p = x;
    y.p = x.p;
    if (x.p === this.NIL) this.root = y;
    else if (x === x.p.l) x.p.l = y; else x.p.r = y;
    y.l = x; x.p = y;
  }
  rotR(R, x, quiet) {
    const y = x.l;
    if (!quiet) R.note(`<b>Right rotation</b> at <b>${esc(x.v)}</b>`);
    x.l = y.r; if (y.r !== this.NIL) y.r.p = x;
    y.p = x.p;
    if (x.p === this.NIL) this.root = y;
    else if (x === x.p.r) x.p.r = y; else x.p.l = y;
    y.r = x; x.p = y;
  }
  insert(R, v) {
    if (this.full(R)) return;
    let y = this.NIL, x = this.root;
    while (x !== this.NIL) {
      R.cur(x.id); R.tick();
      const d = cmp(v, x.v);
      if (d === 0) {
        this.fx.hit.add(x.id); R.note(`<b>${esc(v)}</b> is already in the tree.`); this.snapFx(R);
        R.done('Insert', 'O(log n)'); return;
      }
      R.note(d < 0 ? `<b>${esc(v)}</b> &lt; <b>${esc(x.v)}</b> → left` : `<b>${esc(v)}</b> &gt; <b>${esc(x.v)}</b> → right`);
      y = x; x = d < 0 ? x.l : x.r;
    }
    const z = { id: nid(), v, c: 'R', l: this.NIL, r: this.NIL, p: y };
    if (y === this.NIL) this.root = z;
    else if (cmp(v, y.v) < 0) y.l = z; else y.r = z;
    this.n++;
    this.fx.hit.add(z.id);
    if (y !== this.NIL) this.fx.fresh.add(y.id + '>' + z.id);
    R.tick(); R.note(`Attach <b>${esc(v)}</b> as a <b>red</b> node (red never changes black-height)`);
    this.snapFx(R);
    this.insFix(R, z);
    R.done('Insert', 'O(log n)');
  }
  insFix(R, z) {
    while (z.p.c === 'R') {
      R.tick();
      const gp = z.p.p;
      if (z.p === gp.l) {
        const u = gp.r;
        if (u.c === 'R') {
          this.fx.hl.add(z.p.id); this.fx.hl.add(u.id);
          R.note(`Red parent <b>${esc(z.p.v)}</b> and red uncle <b>${esc(u.v)}</b> → <b>recolor</b> both black, grandparent red`);
          z.p.c = 'B'; u.c = 'B'; gp.c = 'R';
          this.snapFx(R, { slow: 1 });
          z = gp;
        } else {
          if (z === z.p.r) {
            R.note(`Uncle is black, <b>${esc(z.v)}</b> is an inner child (triangle) → rotate parent first`);
            z = z.p; this.rotL(R, z, true); this.snapFx(R, { slow: 1 });
          }
          z.p.c = 'B'; gp.c = 'R';
          R.note(`Line case: recolor, then <b>right-rotate</b> grandparent <b>${esc(gp.v)}</b>`);
          this.rotR(R, gp, true);
          this.snapFx(R, { slow: 1 });
        }
      } else {
        const u = gp.l;
        if (u.c === 'R') {
          this.fx.hl.add(z.p.id); this.fx.hl.add(u.id);
          R.note(`Red parent <b>${esc(z.p.v)}</b> and red uncle <b>${esc(u.v)}</b> → <b>recolor</b>`);
          z.p.c = 'B'; u.c = 'B'; gp.c = 'R';
          this.snapFx(R, { slow: 1 });
          z = gp;
        } else {
          if (z === z.p.l) {
            R.note(`Uncle is black, triangle case → rotate parent first`);
            z = z.p; this.rotR(R, z, true); this.snapFx(R, { slow: 1 });
          }
          z.p.c = 'B'; gp.c = 'R';
          R.note(`Line case: recolor, then <b>left-rotate</b> grandparent <b>${esc(gp.v)}</b>`);
          this.rotL(R, gp, true);
          this.snapFx(R, { slow: 1 });
        }
      }
    }
    if (this.root.c !== 'B') {
      this.root.c = 'B';
      R.tick(); R.note('Rule: the <b>root is always black</b>'); this.snapFx(R);
    }
  }
  transplant(u, vv) {
    if (u.p === this.NIL) this.root = vv;
    else if (u === u.p.l) u.p.l = vv; else u.p.r = vv;
    vv.p = u.p;
  }
  minN(nd) { while (nd.l !== this.NIL) nd = nd.l; return nd; }
  delValue(R, v) {
    let z = this.root;
    if (z === this.NIL) { R.note('Tree is empty.'); return; }
    while (z !== this.NIL && cmp(v, z.v) !== 0) {
      R.cur(z.id); R.tick();
      z = cmp(v, z.v) < 0 ? z.l : z.r;
    }
    if (z === this.NIL) { R.note(`<b>${esc(v)}</b> is not in the tree.`); R.done('Delete', 'O(log n)'); return; }
    R.cur(z.id); R.tick();
    this.fx.doom.add(z.id);
    R.note(`Found <b>${esc(v)}</b> — remove it, then repair the red-black rules`);
    this.snapFx(R);
    let y = z, yc = y.c, x;
    if (z.l === this.NIL) { x = z.r; this.transplant(z, z.r); }
    else if (z.r === this.NIL) { x = z.l; this.transplant(z, z.l); }
    else {
      y = this.minN(z.r); yc = y.c; x = y.r;
      this.fx.hit.add(y.id);
      R.note(`Two children → in-order successor <b>${esc(y.v)}</b> takes its place`);
      this.snapFx(R);
      if (y.p === z) { x.p = y; }
      else { this.transplant(y, y.r); y.r = z.r; y.r.p = y; }
      this.transplant(z, y);
      y.l = z.l; y.l.p = y; y.c = z.c;
    }
    this.n--;
    R.tick(); this.snapFx(R);
    if (yc === 'B') {
      R.note(`A <b>black</b> node was removed — black-height is broken, fix up`);
      this.delFix(R, x);
    } else {
      R.note(`A <b>red</b> node was removed — no rules broken`);
    }
    this.snapFx(R);
    R.done('Delete', 'O(log n)');
  }
  delFix(R, x) {
    while (x !== this.root && x.c === 'B') {
      R.tick();
      if (x === x.p.l) {
        let w = x.p.r;
        if (w.c === 'R') {
          R.note(`Sibling <b>${esc(w.v)}</b> is red → recolor + left-rotate parent`);
          w.c = 'B'; x.p.c = 'R'; this.rotL(R, x.p, true); this.snapFx(R, { slow: 1 });
          w = x.p.r;
        }
        if (w.l.c === 'B' && w.r.c === 'B') {
          if (w !== this.NIL) { this.fx.hl.add(w.id); R.note(`Sibling's children are black → recolor sibling red, move the problem up`); }
          w.c = 'R'; this.snapFx(R, { slow: 1 });
          x = x.p;
        } else {
          if (w.r.c === 'B') {
            R.note(`Sibling's far child is black → rotate sibling right`);
            w.l.c = 'B'; w.c = 'R'; this.rotR(R, w, true); this.snapFx(R, { slow: 1 });
            w = x.p.r;
          }
          R.note(`Far child is red → final recolor + left-rotate parent`);
          w.c = x.p.c; x.p.c = 'B'; w.r.c = 'B';
          this.rotL(R, x.p, true); this.snapFx(R, { slow: 1 });
          x = this.root;
        }
      } else {
        let w = x.p.l;
        if (w.c === 'R') {
          R.note(`Sibling <b>${esc(w.v)}</b> is red → recolor + right-rotate parent`);
          w.c = 'B'; x.p.c = 'R'; this.rotR(R, x.p, true); this.snapFx(R, { slow: 1 });
          w = x.p.l;
        }
        if (w.r.c === 'B' && w.l.c === 'B') {
          if (w !== this.NIL) { this.fx.hl.add(w.id); R.note(`Sibling's children are black → recolor sibling red, move up`); }
          w.c = 'R'; this.snapFx(R, { slow: 1 });
          x = x.p;
        } else {
          if (w.l.c === 'B') {
            R.note(`Mirror case → rotate sibling left`);
            w.r.c = 'B'; w.c = 'R'; this.rotL(R, w, true); this.snapFx(R, { slow: 1 });
            w = x.p.l;
          }
          R.note(`Final recolor + right-rotate parent`);
          w.c = x.p.c; x.p.c = 'B'; w.l.c = 'B';
          this.rotR(R, x.p, true); this.snapFx(R, { slow: 1 });
          x = this.root;
        }
      }
    }
    if (x.c !== 'B') { x.c = 'B'; this.snapFx(R); }
    this.NIL.c = 'B'; this.NIL.p = this.NIL; // keep sentinel pristine
  }
  search(R, v) {
    let c = this.root;
    if (c === this.NIL) { R.note('Tree is empty.'); return; }
    while (c !== this.NIL) {
      R.cur(c.id); R.tick();
      const d = cmp(v, c.v);
      if (d === 0) {
        this.fx.hit.add(c.id); R.note(`Found <b>${esc(v)}</b>`); this.snapFx(R);
        R.done('Search', 'O(log n)'); return;
      }
      R.note(d < 0 ? `<b>${esc(v)}</b> &lt; <b>${esc(c.v)}</b> → left` : `<b>${esc(v)}</b> &gt; <b>${esc(c.v)}</b> → right`);
      c = d < 0 ? c.l : c.r;
    }
    R.note(`<b>${esc(v)}</b> is not in the tree.`);
    R.done('Search', 'O(log n)');
  }
  clear(R) {
    if (this.root === this.NIL) { R.note('Already empty.'); return; }
    const mark = nd => { if (nd !== this.NIL) { this.fx.doom.add(nd.id); mark(nd.l); mark(nd.r); } };
    mark(this.root);
    R.tick(); R.note('Drop the <b>root</b> reference'); this.snapFx(R);
    this.root = this.NIL; this.n = 0; this.snapFx(R);
    R.done('Delete all', 'O(1)');
  }
  quickInsert(v) {
    let y = this.NIL, x = this.root;
    while (x !== this.NIL) {
      const d = cmp(v, x.v);
      if (d === 0) return;
      y = x; x = d < 0 ? x.l : x.r;
    }
    const z = { id: nid(), v, c: 'R', l: this.NIL, r: this.NIL, p: y };
    if (y === this.NIL) this.root = z;
    else if (cmp(v, y.v) < 0) y.l = z; else y.r = z;
    this.n++;
    // silent fixup
    let zz = z;
    while (zz.p.c === 'R') {
      const gp = zz.p.p;
      if (zz.p === gp.l) {
        const u = gp.r;
        if (u.c === 'R') { zz.p.c = 'B'; u.c = 'B'; gp.c = 'R'; zz = gp; }
        else {
          if (zz === zz.p.r) { zz = zz.p; this.rotL(null, zz, true); }
          zz.p.c = 'B'; gp.c = 'R'; this.rotR(null, gp, true);
        }
      } else {
        const u = gp.l;
        if (u.c === 'R') { zz.p.c = 'B'; u.c = 'B'; gp.c = 'R'; zz = gp; }
        else {
          if (zz === zz.p.l) { zz = zz.p; this.rotR(null, zz, true); }
          zz.p.c = 'B'; gp.c = 'R'; this.rotL(null, gp, true);
        }
      }
    }
    this.root.c = 'B';
  }
  generate(R) {
    this.root = this.NIL; this.n = 0;
    const vals = this.genValues(8 + Math.floor(Math.random() * 3));
    R.note(`Inserting ${vals.length} random values with silent fix-ups…`);
    for (const v of vals) { this.quickInsert(v); R.tick(); this.snapFx(R); }
    R.done('Generate', 'O(n log n)');
  }
}
