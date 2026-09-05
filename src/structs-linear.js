'use strict';
/* ============ Linear structures: lists, stack, queue, rings ============ */

function mkNode(v) { return { id: nid(), v, next: null, prev: null, staged: false }; }

function sceneBounds(nodes, extra) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const n of nodes) { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x); y1 = Math.max(y1, n.y); }
  for (const f of extra || []) {
    x0 = Math.min(x0, f.x); y0 = Math.min(y0, f.y);
    x1 = Math.max(x1, f.x + (f.w || 0)); y1 = Math.max(y1, f.y + (f.h || 0));
  }
  if (!isFinite(x0)) { x0 = 0; y0 = 0; x1 = 400; y1 = 200; }
  return { x0, y0, w: x1 - x0, h: y1 - y0 };
}

/* ---------------- Singly linked list ---------------- */
class SinglyList extends Struct {
  constructor() { super(); this.head = null; this.tail = null; this.n = 0; this.staged = null; this.stagedAt = 0; }
  static label = 'Linked List';
  max = 12;
  bigo() { return [['search', `O(n) — up to ${this.n} steps now`], ['add head/tail', 'O(1)'], ['del tail', `O(n) — up to ${this.n} steps`]]; }
  toArray() { const a = []; let c = this.head; while (c) { a.push(c); c = c.next; } return a; }
  scene() {
    const arr = this.toArray(); const gap = 96;
    const ns = arr.map((nd, i) => ({ id: nd.id, v: nd.v, shape: 'rect', x: i * gap, y: 0, cls: this.nodeCls(nd.id) }));
    if (this.staged) ns.push({ id: this.staged.id, v: this.staged.v, shape: 'rect', x: this.stagedAt * gap - 48, y: -100, cls: this.nodeCls(this.staged.id) });
    const edges = [];
    const all = this.staged ? arr.concat([this.staged]) : arr;
    for (const nd of all) if (nd.next) edges.push({ from: nd.id, to: nd.next.id, cls: this.edgeCls(nd.id, nd.next.id) });
    for (const k of this.fx.dying) { const [f, t] = k.split('>'); if (!edges.some(e => e.from === f && e.to === t)) edges.push({ from: f, to: t, cls: 'dying' }); }
    const ptrs = [];
    if (this.head) ptrs.push({ name: 'head', at: this.head.id, side: 'n' });
    if (this.tail) ptrs.push({ name: 'tail', at: this.tail.id, side: 'n' });
    const frames = arr.length || this.staged ? [] : [{ t: 'text', x: 200, y: 40, label: 'empty list — add a node', w: 0, h: 0 }];
    const sc = { nodes: ns, edges, ptrs, frames, ...sceneBounds(ns, frames) };
    if (!ns.length) { sc.x0 = 0; sc.y0 = 0; sc.w = 400; sc.h = 80; }
    sc.y0 -= 40; sc.h += 60; // headroom for badges & staged lane
    return sc;
  }
  full(R) { if (this.n >= this.max) { R.note(`Stage is full (max ${this.max} nodes) — delete some first.`); return true; } return false; }
  stage(R, v, at, txt) {
    this.staged = mkNode(v); this.stagedAt = at;
    R.tick(); R.note(txt || `Create new node <b>${esc(v)}</b> <code>new = Node("${esc(v)}")</code>`); this.snapFx(R);
    return this.staged;
  }
  land(node) { node.staged = false; this.staged = null; }

  addHead(R, v) {
    if (this.full(R)) return;
    const nd = this.stage(R, v, 0);
    if (this.head) {
      nd.next = this.head; this.fx.fresh.add(nd.id + '>' + this.head.id);
      R.tick(); R.note(`Point the new node at the old head <code>new.next = head</code> — <b>new → ${esc(this.head.v)}</b>`); this.snapFx(R);
    }
    this.land(nd); this.head = nd; if (!this.tail) this.tail = nd; this.n++;
    R.tick(); R.note('Move the head pointer <code>head = new</code> — no traversal needed'); this.snapFx(R);
    R.done('Add at head', 'O(1)');
  }
  addTail(R, v) {
    if (this.full(R)) return;
    if (!this.head) return this.addHead(R, v);
    const nd = this.stage(R, v, this.n);
    nd.prevLink = null;
    this.tail.next = nd; this.fx.fresh.add(this.tail.id + '>' + nd.id);
    R.tick(); R.note(`<b>tail</b> is already known — link it forward <code>tail.next = new</code> (no traversal)`); this.snapFx(R);
    this.land(nd); this.tail = nd; this.n++;
    R.tick(); R.note('Move the tail pointer <code>tail = new</code>'); this.snapFx(R);
    R.done('Add at tail', 'O(1)');
  }
  walk(R, hops, from) {
    let c = from || this.head;
    R.cur(c.id); R.tick();
    for (let i = 0; i < hops; i++) { c = c.next; R.tick(); R.cur(c.id); }
    return c;
  }
  insertAt(R, v, i) {
    if (this.full(R)) return;
    if (i < 0 || i > this.n) { R.note(`Index ${i} is out of range 0…${this.n}.`); return; }
    if (i === 0) return this.addHead(R, v);
    if (i === this.n) { R.note(`Index ${i} = length → this is a tail insert.`); return this.addTail(R, v); }
    R.note(`Traverse to index <b>${i - 1}</b>, the node before the slot <code>cur = cur.next</code> × ${i - 1}`);
    const p = this.walk(R, i - 1);
    const nd = this.stage(R, v, i, `Create new node <b>${esc(v)}</b> above the gap`);
    nd.next = p.next; this.fx.fresh.add(nd.id + '>' + p.next.id);
    R.tick(); R.note(`Link the new node into the chain <code>new.next = cur.next</code> — <b>new → ${esc(p.next.v)}</b>`); this.snapFx(R);
    this.fx.dying.add(p.id + '>' + nd.next.id);
    R.note(`The old link <b>${esc(p.v)} → ${esc(nd.next.v)}</b> is about to be cut — nothing may point past the new node`); this.snapFx(R);
    p.next = nd; this.fx.fresh.add(p.id + '>' + nd.id);
    this.land(nd); this.n++;
    R.tick(); R.note(`Repoint the previous node <code>cur.next = new</code> — <b>${esc(p.v)} → ${esc(nd.v)}</b>. Two link writes total`); this.snapFx(R);
    R.done(`Insert at ${i}`, 'O(n)');
  }
  delHead(R) {
    if (!this.head) { R.note('List is empty.'); return; }
    const h = this.head;
    this.fx.doom.add(h.id);
    if (h.next) this.fx.dying.add(h.id + '>' + h.next.id);
    R.tick(); R.note(`Unlink <b>${esc(h.v)}</b>: step the head pointer over it <code>head = head.next</code>`); this.snapFx(R);
    this.head = h.next; if (!this.head) this.tail = null; this.n--;
    this.snapFx(R);
    R.done('Delete at head', 'O(1)');
  }
  delTail(R) {
    if (!this.head) { R.note('List is empty.'); return; }
    if (this.n === 1) { R.note('Single node — it is both head and tail.'); return this.delHead(R); }
    R.note('A singly list has no back-links, so we must walk to the node <i>before</i> tail <code>while (cur.next != tail)</code>');
    const p = this.walk(R, this.n - 2);
    this.fx.doom.add(this.tail.id); this.fx.dying.add(p.id + '>' + this.tail.id);
    R.tick(); R.note(`Cut the last link <code>cur.next = null</code> — old tail <b>${esc(this.tail.v)}</b> is now unreachable`); this.snapFx(R);
    p.next = null; this.tail = p; this.n--;
    R.tick(); R.note('Move the tail pointer back <code>tail = cur</code>'); this.snapFx(R);
    R.done('Delete at tail', 'O(n)');
  }
  delAt(R, i) {
    if (i < 0 || i >= this.n) { R.note(`Index ${i} is out of range 0…${this.n - 1}.`); return; }
    if (i === 0) return this.delHead(R);
    if (i === this.n - 1) return this.delTail(R);
    R.note(`Traverse to index <b>${i - 1}</b>`);
    const p = this.walk(R, i - 1);
    const vic = p.next;
    this.fx.doom.add(vic.id); this.fx.dying.add(p.id + '>' + vic.id);
    if (vic.next) this.fx.dying.add(vic.id + '>' + vic.next.id);
    R.note(`Bypass <b>${esc(vic.v)}</b> with one write <code>prev.next = cur.next</code> — <b>${esc(p.v)} → ${esc(vic.next.v)}</b>; nothing points at <b>${esc(vic.v)}</b> anymore`); this.snapFx(R);
    p.next = vic.next; this.fx.fresh.add(p.id + '>' + vic.next.id);
    this.n--;
    R.tick(); this.snapFx(R);
    R.done(`Delete at ${i}`, 'O(n)');
  }
  delValue(R, v) {
    if (!this.head) { R.note('List is empty.'); return; }
    let i = 0, c = this.head;
    while (c) {
      R.cur(c.id); R.tick();
      if (cmp(c.v, v) === 0) { R.note(`Found <b>${esc(v)}</b> at index ${i}`); return this.delAt(R, i); }
      c = c.next; i++;
    }
    R.note(`<b>${esc(v)}</b> not found after ${R.count} steps.`); R.done('Delete value', 'O(n)');
  }
  editAt(R, v, i) {
    if (i < 0 || i >= this.n) { R.note(`Index ${i} is out of range 0…${this.n - 1}.`); return; }
    R.note(`Traverse to index <b>${i}</b> <code>cur = cur.next</code> × ${i}`);
    const c = this.walk(R, i);
    const old = c.v; c.v = v; this.fx.hit.add(c.id);
    R.tick(); R.note(`Overwrite the value in place <code>cur.value = "${esc(v)}"</code> — <b>${esc(old)}</b> becomes <b>${esc(v)}</b>; no links change`); this.snapFx(R);
    R.done(`Edit at ${i}`, 'O(n)');
  }
  search(R, v) {
    let c = this.head, i = 0;
    while (c) {
      R.cur(c.id); R.tick();
      if (cmp(c.v, v) === 0) {
        this.fx.hit.add(c.id); R.note(`Found <b>${esc(v)}</b> at index ${i}`); this.snapFx(R);
        R.done('Search', 'O(n)'); return;
      }
      c = c.next; i++;
    }
    R.note(`<b>${esc(v)}</b> is not in the list.`); R.done('Search', 'O(n)');
  }
  clear(R) {
    if (!this.head) { R.note('Already empty.'); return; }
    for (const nd of this.toArray()) this.fx.doom.add(nd.id);
    R.tick(); R.note('Drop the entry pointers <code>head = null; tail = null</code> — every node becomes unreachable at once'); this.snapFx(R);
    this.head = this.tail = null; this.n = 0;
    this.snapFx(R);
    R.done('Delete all', 'O(1)');
  }
  generate(R) {
    this.head = this.tail = null; this.n = 0; this.staged = null;
    const k = 5 + Math.floor(Math.random() * 3);
    R.note(`Building ${k} random nodes at the tail…`);
    for (let j = 0; j < k; j++) {
      const nd = mkNode(randToken());
      if (!this.head) { this.head = this.tail = nd; } else { this.tail.next = nd; this.tail = nd; }
      this.n++; R.tick(); this.snapFx(R);
    }
    R.done('Generate', 'O(n)');
  }
  opDefs() {
    return [
      { id: 'addHead', label: '+ Head', grp: 'add', val: 1, run: (R, v) => this.addHead(R, v) },
      { id: 'addTail', label: '+ Tail', grp: 'add', val: 1, run: (R, v) => this.addTail(R, v) },
      { id: 'insertAt', label: '+ At i', grp: 'add', val: 1, idx: 1, run: (R, v, i) => this.insertAt(R, v, i) },
      { id: 'delHead', label: 'Head', grp: 'del', danger: 1, run: R => this.delHead(R) },
      { id: 'delTail', label: 'Tail', grp: 'del', danger: 1, run: R => this.delTail(R) },
      { id: 'delAt', label: 'At i', grp: 'del', idx: 1, danger: 1, run: (R, v, i) => this.delAt(R, i) },
      { id: 'delVal', label: 'Value', grp: 'del', val: 1, danger: 1, run: (R, v) => this.delValue(R, v) },
      { id: 'clear', label: 'All', grp: 'del', danger: 1, run: R => this.clear(R) },
      { id: 'editAt', label: 'Edit at i', grp: 'etc', val: 1, idx: 1, run: (R, v, i) => this.editAt(R, v, i) },
      { id: 'search', label: 'Search', grp: 'etc', val: 1, run: (R, v) => this.search(R, v) },
      { id: 'gen', label: '🎲 Generate', grp: 'data', run: R => this.generate(R) },
    ];
  }
}

/* ---------------- Doubly linked list ---------------- */
class DoublyList extends SinglyList {
  static label = 'Doubly Linked';
  bigo() { return [['search', `O(n) — up to ${this.n} now`], ['add/del head+tail', 'O(1)'], ['insert at', `O(n) — up to ${Math.ceil(this.n / 2)} from nearer end`]]; }
  scene() {
    const sc = super.scene();
    const arr = this.toArray();
    const all = this.staged ? arr.concat([this.staged]) : arr;
    for (const nd of all) if (nd.prev && nd.prev.next === nd || nd.prev && nd.staged === false)
      sc.edges.push({ from: nd.id, to: nd.prev.id, lane: 'prev', cls: this.edgeCls(nd.id, nd.prev.id) });
    return sc;
  }
  addHead(R, v) {
    if (this.full(R)) return;
    const nd = this.stage(R, v, 0);
    if (this.head) {
      nd.next = this.head; this.head.prev = nd;
      this.fx.fresh.add(nd.id + '>' + this.head.id); this.fx.fresh.add(this.head.id + '>' + nd.id);
      R.tick(2); R.note(`Wire both directions <code>new.next = head; head.prev = new</code> — 2 link writes`); this.snapFx(R);
    }
    this.land(nd); this.head = nd; if (!this.tail) this.tail = nd; this.n++;
    R.tick(); R.note('Move the head pointer <code>head = new</code>'); this.snapFx(R);
    R.done('Add at head', 'O(1)');
  }
  addTail(R, v) {
    if (this.full(R)) return;
    if (!this.head) return this.addHead(R, v);
    const nd = this.stage(R, v, this.n);
    nd.prev = this.tail; this.tail.next = nd;
    this.fx.fresh.add(this.tail.id + '>' + nd.id); this.fx.fresh.add(nd.id + '>' + this.tail.id);
    R.tick(2); R.note(`Wire both directions at the tail <code>tail.next = new; new.prev = tail</code> — no traversal`); this.snapFx(R);
    this.land(nd); this.tail = nd; this.n++;
    R.tick(); R.note('Move the tail pointer <code>tail = new</code>'); this.snapFx(R);
    R.done('Add at tail', 'O(1)');
  }
  walkFromTail(R, hopsBack) {
    let c = this.tail;
    R.cur(c.id); R.tick();
    for (let i = 0; i < hopsBack; i++) { c = c.prev; R.tick(); R.cur(c.id); }
    return c;
  }
  insertAt(R, v, i) {
    if (this.full(R)) return;
    if (i < 0 || i > this.n) { R.note(`Index ${i} is out of range 0…${this.n}.`); return; }
    if (i === 0) return this.addHead(R, v);
    if (i === this.n) { R.note(`Index ${i} = length → tail insert.`); return this.addTail(R, v); }
    let p;
    if (i - 1 <= this.n - 1 - i) {
      R.note(`Index ${i} is in the first half → traverse forward from <b>head</b>`);
      p = this.walk(R, i - 1);
    } else {
      R.note(`Index ${i} is in the second half → traverse backward from <b>tail</b> via <b>prev</b>`);
      p = this.walkFromTail(R, this.n - i);
    }
    const nd = this.stage(R, v, i);
    const q = p.next;
    this.fx.dying.add(p.id + '>' + q.id); this.fx.dying.add(q.id + '>' + p.id);
    R.note(`Cut both old links between <b>${esc(p.v)}</b> and <b>${esc(q.v)}</b> — the gap is open in both directions`); this.snapFx(R);
    nd.next = q; nd.prev = p; p.next = nd; q.prev = nd;
    this.fx.fresh.add(p.id + '>' + nd.id); this.fx.fresh.add(nd.id + '>' + q.id);
    this.fx.fresh.add(nd.id + '>' + p.id); this.fx.fresh.add(q.id + '>' + nd.id);
    this.land(nd); this.n++;
    R.tick(4); R.note('Wire 4 new links <code>new.prev = before; new.next = after; before.next = new; after.prev = new</code>'); this.snapFx(R);
    R.done(`Insert at ${i}`, 'O(n)');
  }
  delHead(R) {
    if (!this.head) { R.note('List is empty.'); return; }
    const h = this.head;
    this.fx.doom.add(h.id);
    if (h.next) { this.fx.dying.add(h.id + '>' + h.next.id); this.fx.dying.add(h.next.id + '>' + h.id); }
    R.tick(); R.note(`Unlink head <b>${esc(h.v)}</b>; clear <b>${h.next ? esc(h.next.v) + '.prev' : 'tail'}</b>`); this.snapFx(R);
    this.head = h.next; if (this.head) this.head.prev = null; else this.tail = null; this.n--;
    R.tick(); this.snapFx(R);
    R.done('Delete at head', 'O(1)');
  }
  delTail(R) {
    if (!this.tail) { R.note('List is empty.'); return; }
    if (this.n === 1) return this.delHead(R);
    const t = this.tail;
    this.fx.doom.add(t.id);
    this.fx.dying.add(t.prev.id + '>' + t.id); this.fx.dying.add(t.id + '>' + t.prev.id);
    R.note(`<b>tail.prev</b> is known — no traversal. Cut both links to <b>${esc(t.v)}</b>`); this.snapFx(R);
    this.tail = t.prev; this.tail.next = null; this.n--;
    R.tick(2); R.note('Step the tail back <code>tail = tail.prev; tail.next = null</code>'); this.snapFx(R);
    R.done('Delete at tail', 'O(1)');
  }
  delAt(R, i) {
    if (i < 0 || i >= this.n) { R.note(`Index ${i} is out of range 0…${this.n - 1}.`); return; }
    if (i === 0) return this.delHead(R);
    if (i === this.n - 1) return this.delTail(R);
    let vic;
    if (i <= this.n - 1 - i) { R.note(`Traverse forward to index <b>${i}</b>`); vic = this.walk(R, i); }
    else { R.note(`Traverse backward to index <b>${i}</b>`); vic = this.walkFromTail(R, this.n - 1 - i); }
    this.fx.doom.add(vic.id);
    this.fx.dying.add(vic.prev.id + '>' + vic.id); this.fx.dying.add(vic.id + '>' + vic.prev.id);
    this.fx.dying.add(vic.id + '>' + vic.next.id); this.fx.dying.add(vic.next.id + '>' + vic.id);
    R.note(`Bypass <b>${esc(vic.v)}</b> in both directions <code>prev.next = cur.next; next.prev = cur.prev</code>`); this.snapFx(R);
    vic.prev.next = vic.next; vic.next.prev = vic.prev;
    this.fx.fresh.add(vic.prev.id + '>' + vic.next.id); this.fx.fresh.add(vic.next.id + '>' + vic.prev.id);
    this.n--;
    R.tick(2); this.snapFx(R);
    R.done(`Delete at ${i}`, 'O(n)');
  }
  generate(R) {
    this.head = this.tail = null; this.n = 0; this.staged = null;
    const k = 5 + Math.floor(Math.random() * 3);
    R.note(`Building ${k} random nodes…`);
    for (let j = 0; j < k; j++) {
      const nd = mkNode(randToken());
      if (!this.head) this.head = this.tail = nd;
      else { nd.prev = this.tail; this.tail.next = nd; this.tail = nd; }
      this.n++; R.tick(); this.snapFx(R);
    }
    R.done('Generate', 'O(n)');
  }
}
