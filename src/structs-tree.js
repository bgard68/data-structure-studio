'use strict';
/* ============ Binary search tree + AVL ============ */

function tNode(v) { return { id: nid(), v, l: null, r: null, h: 1 }; }

class BST extends Struct {
  constructor() { super(); this.root = null; this.n = 0; }
  static label = 'BST';
  max = 21;
  showTag() { return ''; }
  bigo() {
    const h = this.heightEdges();
    return [['search / insert / delete', `O(h) — h is ${h} now`], ['no balancing', `h can reach n−1 = ${Math.max(this.n - 1, 0)}`], ['balanced ideal', `⌈log₂(n+1)⌉−1 = ${Math.max(Math.ceil(Math.log2(this.n + 1)) - 1, 0)}`]];
  }
  height(nd = this.root) { if (!nd || nd === this.NIL) return 0; return 1 + Math.max(this.height(nd.l), this.height(nd.r)); }
  heightEdges() { return Math.max(this.height() - 1, 0); }
  sizeInfo() { return `n = ${this.n}, height = ${this.heightEdges()} edges`; }
  scene() {
    const ns = [], edges = [];
    let ix = 0;
    const place = (nd, depth) => {
      if (!nd) return;
      place(nd.l, depth + 1);
      nd._x = ix++ * 54; nd._y = depth * 80;
      place(nd.r, depth + 1);
    };
    place(this.root, 0);
    const visit = nd => {
      if (!nd) return;
      ns.push({ id: nd.id, v: nd.v, shape: 'circ', x: nd._x, y: nd._y, cls: this.nodeCls(nd.id, this.colorCls(nd)), tag: this.showTag(nd) });
      for (const ch of [nd.l, nd.r]) if (ch) edges.push({ from: nd.id, to: ch.id, shape: 'circ', cls: this.edgeCls(nd.id, ch.id) });
      visit(nd.l); visit(nd.r);
    };
    visit(this.root);
    const ptrs = this.root ? [{ name: 'root', at: this.root.id, side: 'n', shape: 'circ' }] : [];
    const frames = ns.length ? [] : [{ t: 'text', x: 0, y: 40, label: 'empty tree — insert a value', w: 0, h: 0 }];
    const sc = { nodes: ns, edges, ptrs, frames, ...sceneBounds(ns, frames) };
    if (!ns.length) { sc.x0 = -200; sc.y0 = 0; sc.w = 400; sc.h = 100; }
    sc.y0 -= 46; sc.h += 70; sc.x0 -= 30; sc.w += 60;
    return sc;
  }
  colorCls() { return ''; }
  full(R) { if (this.n >= this.max) { R.note(`Stage is full (max ${this.max} nodes).`); return true; } return false; }
  insert(R, v) {
    if (this.full(R)) return;
    if (!this.root) {
      this.root = tNode(v); this.n++;
      R.tick(); R.note(`Tree is empty — <b>${esc(v)}</b> becomes the root`);
      this.fx.hit.add(this.root.id); this.snapFx(R);
      R.done('Insert', 'O(1)'); return;
    }
    let c = this.root, p = null, side = null;
    while (c) {
      R.cur(c.id); R.tick();
      const d = cmp(v, c.v);
      if (d === 0) {
        this.fx.hit.add(c.id); R.note(`<b>${esc(v)}</b> is already in the tree — BST keeps values unique.`);
        this.snapFx(R); R.done('Insert', 'O(h)'); return;
      }
      R.note(d < 0 ? `<b>${esc(v)}</b> &lt; <b>${esc(c.v)}</b> → go left` : `<b>${esc(v)}</b> &gt; <b>${esc(c.v)}</b> → go right`);
      p = c; side = d < 0 ? 'l' : 'r'; c = c[side];
    }
    const nd = tNode(v);
    p[side] = nd; this.n++;
    this.fx.hit.add(nd.id); this.fx.fresh.add(p.id + '>' + nd.id);
    R.tick(); R.note(`Attach <b>${esc(v)}</b> as ${side === 'l' ? 'left' : 'right'} child of <b>${esc(p.v)}</b>`);
    this.snapFx(R);
    R.done('Insert', 'O(h)');
  }
  search(R, v) {
    let c = this.root;
    if (!c) { R.note('Tree is empty.'); return; }
    while (c) {
      R.cur(c.id); R.tick();
      const d = cmp(v, c.v);
      if (d === 0) {
        this.fx.hit.add(c.id); R.note(`Found <b>${esc(v)}</b> — one comparison per level`); this.snapFx(R);
        R.done('Search', 'O(h)'); return;
      }
      R.note(d < 0 ? `<b>${esc(v)}</b> &lt; <b>${esc(c.v)}</b> → left` : `<b>${esc(v)}</b> &gt; <b>${esc(c.v)}</b> → right`);
      c = d < 0 ? c.l : c.r;
    }
    R.note(`Hit a null branch — <b>${esc(v)}</b> is not in the tree.`);
    R.done('Search', 'O(h)');
  }
  delValue(R, v) {
    let c = this.root, p = null;
    while (c && cmp(v, c.v) !== 0) {
      R.cur(c.id); R.tick();
      p = c; c = cmp(v, c.v) < 0 ? c.l : c.r;
    }
    if (!c) { R.note(`<b>${esc(v)}</b> is not in the tree.`); R.done('Delete', 'O(h)'); return; }
    R.cur(c.id); R.tick();
    if (c.l && c.r) {
      this.fx.hl.add(c.id);
      R.note(`<b>${esc(v)}</b> has two children → find its <b>in-order successor</b> (smallest in right subtree)`);
      this.snapFx(R);
      let sp = c, s = c.r;
      R.cur(s.id); R.tick();
      while (s.l) { sp = s; s = s.l; R.cur(s.id); R.tick(); }
      this.fx.hit.add(s.id);
      R.note(`Successor is <b>${esc(s.v)}</b> — copy its value into <b>${esc(c.v)}</b>`); this.snapFx(R);
      c.v = s.v;
      this.fx.hit.add(c.id); this.snapFx(R);
      p = sp; c = s;
      R.note(`Now delete the successor node (it has at most one child)`);
    }
    const child = c.l || c.r;
    this.fx.doom.add(c.id);
    if (p) this.fx.dying.add(p.id + '>' + c.id);
    if (child) this.fx.dying.add(c.id + '>' + child.id);
    R.note(child
      ? (p ? `Splice out — its child is adopted by the parent` : `Splice out the root — its child becomes the new root`)
      : `Leaf node — simply remove it`);
    this.snapFx(R);
    if (!p) this.root = child;
    else if (p.l === c) p.l = child; else p.r = child;
    if (p && child) this.fx.fresh.add(p.id + '>' + child.id);
    this.n--;
    R.tick(); this.snapFx(R);
    R.done('Delete', 'O(h)');
  }
  clear(R) {
    if (!this.root) { R.note('Already empty.'); return; }
    const mark = nd => { if (nd) { this.fx.doom.add(nd.id); mark(nd.l); mark(nd.r); } };
    mark(this.root);
    R.tick(); R.note('Drop the <b>root</b> reference — the whole tree is garbage-collected'); this.snapFx(R);
    this.root = null; this.n = 0; this.snapFx(R);
    R.done('Delete all', 'O(1)');
  }
  genValues(k) {
    const out = new Set();
    while (out.size < k) out.add(randToken());
    return [...out];
  }
  quickInsert(v) { // silent build for generate
    if (!this.root) { this.root = tNode(v); this.n++; return; }
    let c = this.root;
    for (;;) {
      const d = cmp(v, c.v);
      if (d === 0) return;
      const side = d < 0 ? 'l' : 'r';
      if (!c[side]) { c[side] = tNode(v); this.n++; return; }
      c = c[side];
    }
  }
  generate(R) {
    this.root = null; this.n = 0;
    const vals = this.genValues(7 + Math.floor(Math.random() * 3));
    R.note(`Inserting ${vals.length} random values…`);
    for (const v of vals) { this.quickInsert(v); R.tick(); this.snapFx(R); }
    R.done('Generate', 'O(n log n)');
  }
  opDefs() {
    return [
      { id: 'ins', label: '+ Insert', grp: 'add', val: 1, run: (R, v) => this.insert(R, v) },
      { id: 'del', label: 'Value', grp: 'del', val: 1, danger: 1, run: (R, v) => this.delValue(R, v) },
      { id: 'clear', label: 'All', grp: 'del', danger: 1, run: R => this.clear(R) },
      { id: 'search', label: 'Search', grp: 'etc', val: 1, run: (R, v) => this.search(R, v) },
      { id: 'gen', label: '🎲 Generate', grp: 'data', run: R => this.generate(R) },
    ];
  }
}

/* ---------------- AVL (self-balancing BST) ---------------- */
class AVL extends BST {
  static label = 'AVL Tree';
  bigo() {
    const h = this.heightEdges();
    return [['search / insert / delete', `O(log n) — h is ${h} for n = ${this.n}`], ['ideal', `⌈log₂(n+1)⌉−1 = ${Math.max(Math.ceil(Math.log2(this.n + 1)) - 1, 0)}`], ['rotations', 'O(1) each']];
  }
  showTag(nd) { const b = this.bf(nd); return 'bf ' + (b > 0 ? '+' + b : b); }
  h(nd) { return nd ? nd.h : 0; }
  // W3Schools convention: BF = height(right) − height(left); positive = right-heavy
  bf(nd) { return this.h(nd.r) - this.h(nd.l); }
  upd(nd) { nd.h = 1 + Math.max(this.h(nd.l), this.h(nd.r)); }
  rotR(R, y) {
    const x = y.l;
    R.note(`<b>Right rotation</b> at <b>${esc(y.v)}</b> — its left child <b>${esc(x.v)}</b> becomes the subtree root`);
    y.l = x.r; x.r = y;
    this.upd(y); this.upd(x);
    return x;
  }
  rotL(R, x) {
    const y = x.r;
    R.note(`<b>Left rotation</b> at <b>${esc(x.v)}</b> — its right child <b>${esc(y.v)}</b> becomes the subtree root`);
    x.r = y.l; y.l = x;
    this.upd(x); this.upd(y);
    return y;
  }
  rebalance(R, nd) {
    this.upd(nd);
    const b = this.bf(nd);
    if (b < -1) {
      this.fx.hl.add(nd.id);
      R.tick(); R.note(`<b>${esc(nd.v)}</b> is unbalanced: bf = ${b} (left-heavy)`); this.snapFx(R, { slow: 1 });
      if (this.bf(nd.l) > 0) {
        R.tick(); nd.l = this.rotL(R, nd.l); this.snapFx(R, { slow: 1 }); // LR case
      }
      R.tick(); const r = this.rotR(R, nd); this.snapFx(R, { slow: 1 });
      return r;
    }
    if (b > 1) {
      this.fx.hl.add(nd.id);
      R.tick(); R.note(`<b>${esc(nd.v)}</b> is unbalanced: bf = +${b} (right-heavy)`); this.snapFx(R, { slow: 1 });
      if (this.bf(nd.r) < 0) {
        R.tick(); nd.r = this.rotR(R, nd.r); this.snapFx(R, { slow: 1 }); // RL case
      }
      R.tick(); const r = this.rotL(R, nd); this.snapFx(R, { slow: 1 });
      return r;
    }
    return nd;
  }
  insRec(R, nd, v, out) {
    if (!nd) {
      const fresh = tNode(v); this.n++; out.node = fresh;
      return fresh;
    }
    R.cur(nd.id); R.tick();
    const d = cmp(v, nd.v);
    if (d === 0) { out.dup = nd; return nd; }
    R.note(d < 0 ? `<b>${esc(v)}</b> &lt; <b>${esc(nd.v)}</b> → left` : `<b>${esc(v)}</b> &gt; <b>${esc(nd.v)}</b> → right`);
    if (d < 0) nd.l = this.insRec(R, nd.l, v, out);
    else nd.r = this.insRec(R, nd.r, v, out);
    if (out.dup) return nd;
    return this.rebalance(R, nd);
  }
  insert(R, v) {
    if (this.full(R)) return;
    const out = {};
    this.root = this.insRec(R, this.root, v, out);
    if (out.dup) {
      this.fx.hit.add(out.dup.id); R.note(`<b>${esc(v)}</b> is already here — no duplicates.`); this.snapFx(R);
    } else {
      this.fx.hit.add(out.node.id);
      R.tick(); R.note(`Attached <b>${esc(v)}</b>; heights updated on the way back up`); this.snapFx(R);
    }
    R.done('Insert', 'O(log n)');
  }
  minNode(nd) { while (nd.l) nd = nd.l; return nd; }
  delRec(R, nd, v, out) {
    if (!nd) { out.missing = true; return null; }
    R.cur(nd.id); R.tick();
    const d = cmp(v, nd.v);
    if (d < 0) nd.l = this.delRec(R, nd.l, v, out);
    else if (d > 0) nd.r = this.delRec(R, nd.r, v, out);
    else {
      out.found = true;
      if (nd.l && nd.r) {
        this.fx.hl.add(nd.id);
        R.note(`Two children → replace with in-order successor`); this.snapFx(R);
        const s = this.minNode(nd.r);
        this.fx.hit.add(s.id); R.note(`Successor: <b>${esc(s.v)}</b>`); this.snapFx(R);
        nd.v = s.v;
        nd.r = this.delRec(R, nd.r, s.v, {});
      } else {
        const child = nd.l || nd.r;
        this.fx.doom.add(nd.id);
        R.note(child ? `One child — splice out <b>${esc(nd.v)}</b>` : `Leaf — remove <b>${esc(nd.v)}</b>`);
        this.snapFx(R);
        this.n--; R.tick();
        return child;
      }
    }
    if (out.missing) return nd;
    return this.rebalance(R, nd);
  }
  delValue(R, v) {
    if (!this.root) { R.note('Tree is empty.'); return; }
    const out = {};
    this.root = this.delRec(R, this.root, v, out);
    if (out.missing) R.note(`<b>${esc(v)}</b> is not in the tree.`);
    else { this.snapFx(R); }
    R.done('Delete', 'O(log n)');
  }
  quickInsert(v) {
    const rec = (nd) => {
      if (!nd) { this.n++; return tNode(v); }
      const d = cmp(v, nd.v);
      if (d === 0) return nd;
      if (d < 0) nd.l = rec(nd.l); else nd.r = rec(nd.r);
      this.upd(nd);
      const b = this.bf(nd);
      if (b < -1) { if (this.bf(nd.l) > 0) nd.l = this.qRotL(nd.l); return this.qRotR(nd); }
      if (b > 1) { if (this.bf(nd.r) < 0) nd.r = this.qRotR(nd.r); return this.qRotL(nd); }
      return nd;
    };
    this.root = rec(this.root);
  }
  qRotR(y) { const x = y.l; y.l = x.r; x.r = y; this.upd(y); this.upd(x); return x; }
  qRotL(x) { const y = x.r; x.r = y.l; y.l = x; this.upd(x); this.upd(y); return y; }
}
