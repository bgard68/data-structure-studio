'use strict';
/* ============ Hash table with separate chaining ============ */

class HashTable extends Struct {
  constructor() {
    super();
    this.B = 8;
    this.buckets = Array.from({ length: this.B }, () => null); // chains of {id,v,next}
    this.n = 0;
  }
  static label = 'Hash Table';
  max = 24;
  bigo() {
    let longest = 0; for (let b = 0; b < this.B; b++) longest = Math.max(longest, this.chain(b).length);
    return [['insert / search / delete', 'O(1) avg'], ['load', `${this.n} keys / ${this.B} buckets`], ['longest chain', `${longest} — worst lookup ≈ ${longest + 1} steps`]];
  }
  sizeInfo() { return `n = ${this.n} in ${this.B} buckets`; }
  hash(v) { let s = 0; for (const ch of String(v)) s += ch.codePointAt(0); return s % this.B; }
  hashText(v) {
    const codes = [...String(v)].map(c => c.codePointAt(0));
    return `hash(<b>${esc(v)}</b>) = (${codes.join(' + ')}) mod ${this.B} = <b>${this.hash(v)}</b>`;
  }
  chain(b) { const a = []; let c = this.buckets[b]; while (c) { a.push(c); c = c.next; } return a; }
  scene() {
    const ns = [], edges = [], frames = [];
    const gapY = 56, gapX = 100, bx = -120;
    for (let b = 0; b < this.B; b++) {
      frames.push({ t: 'rect', x: bx, y: b * gapY - 18, w: 46, h: 36, label: String(b) });
      this.chain(b).forEach((nd, j) => {
        ns.push({ id: nd.id, v: nd.v, shape: 'rect', x: j * gapX, y: b * gapY, cls: this.nodeCls(nd.id) });
        if (nd.next) edges.push({ from: nd.id, to: nd.next.id, cls: this.edgeCls(nd.id, nd.next.id) });
      });
    }
    if (this.stagedNode) ns.push({ id: this.stagedNode.id, v: this.stagedNode.v, shape: 'rect', x: 260, y: -70, cls: this.nodeCls(this.stagedNode.id) });
    for (const k of this.fx.dying) { const [f, t] = k.split('>'); if (!edges.some(e => e.from === f && e.to === t)) edges.push({ from: f, to: t, cls: 'dying' }); }
    const sc = { nodes: ns, edges, ptrs: [], frames, ...sceneBounds(ns.concat([{ x: bx, y: -18 }, { x: bx + 46, y: (this.B - 1) * gapY + 18 }]), frames) };
    sc.x0 -= 30; sc.w += 60; sc.y0 -= 55; sc.h += 75;
    return sc;
  }
  insert(R, v) {
    if (this.n >= this.max) { R.note(`Table is full for this demo (max ${this.max}).`); return; }
    R.tick(); R.note(this.hashText(v));
    this.stagedNode = { id: nid(), v, next: null };
    this.snapFx(R);
    const b = this.hash(v);
    let c = this.buckets[b], last = null;
    while (c) {
      R.cur(c.id); R.tick();
      if (String(c.v) === String(v)) {
        this.fx.hit.add(c.id); R.note(`<b>${esc(v)}</b> already lives in bucket ${b} — no duplicates.`);
        this.stagedNode = null; this.snapFx(R); R.done('Insert', 'O(1) avg'); return;
      }
      last = c; c = c.next;
    }
    const nd = this.stagedNode; this.stagedNode = null;
    if (last) { last.next = nd; this.fx.fresh.add(last.id + '>' + nd.id); }
    else this.buckets[b] = nd;
    this.n++;
    R.tick();
    R.note(last
      ? `Bucket ${b} already has a chain — <b>collision!</b> Append to the end of the chain`
      : `Bucket ${b} is empty — place <b>${esc(v)}</b> directly`);
    this.fx.hit.add(nd.id);
    this.snapFx(R);
    R.done('Insert', 'O(1) avg');
  }
  search(R, v) {
    R.tick(); R.note(this.hashText(v)); this.snapFx(R);
    const b = this.hash(v);
    let c = this.buckets[b];
    if (!c) { R.note(`Bucket ${b} is empty — <b>${esc(v)}</b> is not in the table.`); R.done('Search', 'O(1) avg'); return; }
    while (c) {
      R.cur(c.id); R.tick();
      if (String(c.v) === String(v)) {
        this.fx.hit.add(c.id); R.note(`Found <b>${esc(v)}</b> in bucket ${b} — one hash + short chain walk`); this.snapFx(R);
        R.done('Search', 'O(1) avg'); return;
      }
      c = c.next;
    }
    R.note(`Walked bucket ${b}'s chain — <b>${esc(v)}</b> is not here.`); R.done('Search', 'O(1) avg');
  }
  delValue(R, v) {
    R.tick(); R.note(this.hashText(v)); this.snapFx(R);
    const b = this.hash(v);
    let c = this.buckets[b], p = null;
    while (c) {
      R.cur(c.id); R.tick();
      if (String(c.v) === String(v)) {
        this.fx.doom.add(c.id);
        if (p) this.fx.dying.add(p.id + '>' + c.id);
        if (c.next) this.fx.dying.add(c.id + '>' + c.next.id);
        R.note(`Unlink <b>${esc(v)}</b> from bucket ${b}'s chain`); this.snapFx(R);
        if (p) { p.next = c.next; if (c.next) this.fx.fresh.add(p.id + '>' + c.next.id); }
        else this.buckets[b] = c.next;
        this.n--; R.tick(); this.snapFx(R);
        R.done('Delete', 'O(1) avg'); return;
      }
      p = c; c = c.next;
    }
    R.note(`<b>${esc(v)}</b> is not in bucket ${b}.`); R.done('Delete', 'O(1) avg');
  }
  clear(R) {
    if (!this.n) { R.note('Table is already empty.'); return; }
    for (let b = 0; b < this.B; b++) for (const nd of this.chain(b)) this.fx.doom.add(nd.id);
    R.tick(this.B); R.note(`Reset all ${this.B} buckets to <b>null</b> — one write each`); this.snapFx(R);
    this.buckets = Array.from({ length: this.B }, () => null); this.n = 0;
    this.snapFx(R);
    R.done('Delete all', 'O(b)');
  }
  generate(R) {
    this.buckets = Array.from({ length: this.B }, () => null); this.n = 0;
    const k = 8 + Math.floor(Math.random() * 4);
    R.note(`Hashing ${k} random keys…`);
    const seen = new Set();
    while (seen.size < k) seen.add(String(randToken()));
    for (const v of seen) {
      const b = this.hash(v);
      const nd = { id: nid(), v, next: null };
      if (!this.buckets[b]) this.buckets[b] = nd;
      else { let e = this.buckets[b]; while (e.next) e = e.next; e.next = nd; }
      this.n++;
      R.tick(); this.snapFx(R);
    }
    R.done('Generate', 'O(n)');
  }
  opDefs() {
    return [
      { id: 'ins', label: 'Insert key', grp: 'add', val: 1, run: (R, v) => this.insert(R, v) },
      { id: 'del', label: 'Key', grp: 'del', val: 1, danger: 1, run: (R, v) => this.delValue(R, v) },
      { id: 'clear', label: 'All', grp: 'del', danger: 1, run: R => this.clear(R) },
      { id: 'search', label: 'Search', grp: 'etc', val: 1, run: (R, v) => this.search(R, v) },
      { id: 'gen', label: '🎲 Generate', grp: 'data', run: R => this.generate(R) },
    ];
  }
}
