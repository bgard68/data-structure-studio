'use strict';
/* ============ Stack, Queue, Circular rings ============ */

class StackLIFO extends SinglyList {
  static label = 'Stack · LIFO';
  max = 9;
  bigo() { return [['push / pop / peek', 'O(1)'], ['search', `O(n) — up to ${this.n} now`]]; }
  scene() {
    const arr = this.toArray(); const gap = 54;
    const ns = arr.map((nd, i) => ({ id: nd.id, v: nd.v, shape: 'rect', x: 0, y: i * gap, cls: this.nodeCls(nd.id) }));
    if (this.staged) ns.push({ id: this.staged.id, v: this.staged.v, shape: 'rect', x: -140, y: 0, cls: this.nodeCls(this.staged.id) });
    const edges = [];
    const all = this.staged ? arr.concat([this.staged]) : arr;
    for (const nd of all) if (nd.next) edges.push({ from: nd.id, to: nd.next.id, cls: this.edgeCls(nd.id, nd.next.id) });
    for (const k of this.fx.dying) { const [f, t] = k.split('>'); if (!edges.some(e => e.from === f && e.to === t)) edges.push({ from: f, to: t, cls: 'dying' }); }
    const ptrs = this.head ? [{ name: 'top', at: this.head.id, side: 'n' }] : [];
    const frames = ns.length ? [] : [{ t: 'text', x: 0, y: 40, label: 'empty stack — push a value', w: 0, h: 0 }];
    const sc = { nodes: ns, edges, ptrs, frames, ...sceneBounds(ns, frames) };
    if (!ns.length) { sc.x0 = -200; sc.y0 = 0; sc.w = 400; sc.h = 80; }
    sc.y0 -= 42; sc.h += 62; sc.x0 -= 60; sc.w += 120;
    return sc;
  }
  push(R, v) {
    if (this.full(R)) return;
    const nd = this.stage(R, v, 0, `Create node <b>${esc(v)}</b> — LIFO: last in, first out`);
    if (this.head) {
      nd.next = this.head; this.fx.fresh.add(nd.id + '>' + this.head.id);
      R.tick(); R.note(`Stack the new node on the pile <code>new.next = top</code> — <b>new → ${esc(this.head.v)}</b>`); this.snapFx(R);
    }
    this.land(nd); this.head = nd; if (!this.tail) this.tail = nd; this.n++;
    R.tick(); R.note('Move the top pointer <code>top = new</code> — the stack only ever touches its top'); this.snapFx(R);
    R.done('Push', 'O(1)');
  }
  pop(R) {
    if (!this.head) { R.note('Stack is empty — nothing to pop.'); return; }
    const h = this.head;
    this.fx.doom.add(h.id);
    if (h.next) this.fx.dying.add(h.id + '>' + h.next.id);
    R.tick(); R.note(`Pop <b>${esc(h.v)}</b> <code>top = top.next</code> — last in, first out`); this.snapFx(R);
    this.head = h.next; if (!this.head) this.tail = null; this.n--;
    R.tick(); this.snapFx(R);
    R.done('Pop', 'O(1)');
  }
  peek(R) {
    if (!this.head) { R.note('Stack is empty.'); return; }
    this.fx.hit.add(this.head.id);
    R.tick(); R.note(`Peek: <b>top</b> holds <b>${esc(this.head.v)}</b> — read without removing`); this.snapFx(R);
    R.done('Peek', 'O(1)');
  }
  generate(R) {
    this.head = this.tail = null; this.n = 0; this.staged = null;
    const k = 4 + Math.floor(Math.random() * 3);
    R.note(`Pushing ${k} random values…`);
    for (let j = 0; j < k; j++) {
      const nd = mkNode(randToken());
      nd.next = this.head; this.head = nd; if (!this.tail) this.tail = nd;
      this.n++; R.tick(); this.snapFx(R);
    }
    R.done('Generate', 'O(n)');
  }
  opDefs() {
    return [
      { id: 'push', label: 'Push', grp: 'add', val: 1, run: (R, v) => this.push(R, v) },
      { id: 'pop', label: 'Pop', grp: 'del', danger: 1, run: R => this.pop(R) },
      { id: 'clear', label: 'All', grp: 'del', danger: 1, run: R => this.clear(R) },
      { id: 'peek', label: 'Peek', grp: 'etc', run: R => this.peek(R) },
      { id: 'search', label: 'Search', grp: 'etc', val: 1, run: (R, v) => this.search(R, v) },
      { id: 'gen', label: '🎲 Generate', grp: 'data', run: R => this.generate(R) },
    ];
  }
}

class QueueFIFO extends SinglyList {
  static label = 'Queue · FIFO';
  bigo() { return [['enqueue / dequeue', 'O(1)'], ['search', `O(n) — up to ${this.n} now`]]; }
  scene() {
    const sc = super.scene();
    sc.ptrs = [];
    if (this.head) sc.ptrs.push({ name: 'front', at: this.head.id, side: 'n' });
    if (this.tail) sc.ptrs.push({ name: 'rear', at: this.tail.id, side: 'n' });
    return sc;
  }
  enqueue(R, v) {
    if (this.full(R)) return;
    if (!this.head) {
      const nd = this.stage(R, v, 0, `Create node <b>${esc(v)}</b> — queue is empty, it becomes front and rear`);
      this.land(nd); this.head = this.tail = nd; this.n++;
      R.tick(); this.snapFx(R); R.done('Enqueue', 'O(1)'); return;
    }
    const nd = this.stage(R, v, this.n, `Create node <b>${esc(v)}</b> — FIFO: join at the <b>rear</b>`);
    this.tail.next = nd; this.fx.fresh.add(this.tail.id + '>' + nd.id);
    R.tick(); R.note('Link it behind the last rider <code>rear.next = new</code>'); this.snapFx(R);
    this.land(nd); this.tail = nd; this.n++;
    R.tick(); R.note('Move the rear pointer <code>rear = new</code>'); this.snapFx(R);
    R.done('Enqueue', 'O(1)');
  }
  dequeue(R) {
    if (!this.head) { R.note('Queue is empty — nothing to dequeue.'); return; }
    const h = this.head;
    this.fx.doom.add(h.id);
    if (h.next) this.fx.dying.add(h.id + '>' + h.next.id);
    R.tick(); R.note(`Dequeue <b>${esc(h.v)}</b> <code>front = front.next</code> — first in, first out`); this.snapFx(R);
    this.head = h.next; if (!this.head) this.tail = null; this.n--;
    R.tick(); this.snapFx(R);
    R.done('Dequeue', 'O(1)');
  }
  peek(R) {
    if (!this.head) { R.note('Queue is empty.'); return; }
    this.fx.hit.add(this.head.id);
    R.tick(); R.note(`Peek: <b>front</b> holds <b>${esc(this.head.v)}</b> — read without removing`); this.snapFx(R);
    R.done('Peek', 'O(1)');
  }
  opDefs() {
    return [
      { id: 'enq', label: 'Enqueue', grp: 'add', val: 1, run: (R, v) => this.enqueue(R, v) },
      { id: 'deq', label: 'Dequeue', grp: 'del', danger: 1, run: R => this.dequeue(R) },
      { id: 'clear', label: 'All', grp: 'del', danger: 1, run: R => this.clear(R) },
      { id: 'peek', label: 'Peek', grp: 'etc', run: R => this.peek(R) },
      { id: 'search', label: 'Search', grp: 'etc', val: 1, run: (R, v) => this.search(R, v) },
      { id: 'gen', label: '🎲 Generate', grp: 'data', run: R => this.generate(R) },
    ];
  }
}

/* ---------------- Circular ring base (ellipse layout) ---------------- */
class RingBase extends SinglyList {
  max = 10;
  ringScene(doubly) {
    const arr = this.toArray(); // toArray must terminate on rings — overridden below
    const n = arr.length;
    const rx = Math.max(150, n * 34), ry = rx * 0.52;
    const ns = arr.map((nd, i) => {
      const a = -Math.PI / 2 + (i / Math.max(n, 1)) * Math.PI * 2;
      return { id: nd.id, v: nd.v, shape: 'rect', x: Math.cos(a) * rx, y: Math.sin(a) * ry, cls: this.nodeCls(nd.id) };
    });
    if (this.staged) ns.push({ id: this.staged.id, v: this.staged.v, shape: 'rect', x: 0, y: 0, cls: this.nodeCls(this.staged.id) });
    const edges = [];
    const all = this.staged ? arr.concat([this.staged]) : arr;
    for (const nd of all) {
      if (nd.next) edges.push({ from: nd.id, to: nd.next.id, cls: this.edgeCls(nd.id, nd.next.id), self: nd.next === nd });
      if (doubly && nd.prev) edges.push({ from: nd.id, to: nd.prev.id, lane: 'prev', cls: this.edgeCls(nd.id, nd.prev.id) });
    }
    for (const k of this.fx.dying) { const [f, t] = k.split('>'); if (!edges.some(e => e.from === f && e.to === t)) edges.push({ from: f, to: t, cls: 'dying' }); }
    const ptrs = [];
    if (this.head) ptrs.push({ name: 'front', at: this.head.id, side: 'n' });
    if (this.tail && this.tail !== this.head) ptrs.push({ name: 'rear', at: this.tail.id, side: 's' });
    else if (this.tail) ptrs.push({ name: 'rear', at: this.tail.id, side: 'n' });
    const frames = ns.length ? [] : [{ t: 'text', x: 0, y: 0, label: 'empty ring — enqueue a value', w: 0, h: 0 }];
    const sc = { nodes: ns, edges, ptrs, frames, ...sceneBounds(ns, frames) };
    if (!ns.length) { sc.x0 = -200; sc.y0 = -60; sc.w = 400; sc.h = 120; }
    sc.x0 -= 46; sc.w += 92; sc.y0 -= 52; sc.h += 104;
    return sc;
  }
  toArray() {
    const a = []; let c = this.head;
    while (c) { a.push(c); c = c.next; if (c === this.head) break; }
    return a;
  }
  walk(R, hops, from) {
    let c = from || this.head;
    R.cur(c.id); R.tick();
    for (let i = 0; i < hops; i++) { c = c.next; R.tick(); R.cur(c.id); }
    return c;
  }
}

class CircularQueue extends RingBase {
  static label = 'Circular Queue';
  bigo() { return [['enqueue / dequeue', 'O(1)'], ['del rear', `O(n) — up to ${this.n} now`], ['search', `O(n) — up to ${this.n}`]]; }
  scene() { return this.ringScene(false); }
  enqueue(R, v) {
    if (this.full(R)) return;
    if (!this.head) {
      const nd = this.stage(R, v, 0, `Create node <b>${esc(v)}</b> — alone in the ring, its next points to <b>itself</b>`);
      nd.next = nd; this.land(nd); this.head = this.tail = nd; this.n++;
      R.tick(2); this.snapFx(R); R.done('Enqueue', 'O(1)'); return;
    }
    const nd = this.stage(R, v, 0, `Create node <b>${esc(v)}</b> — it will join between <b>rear</b> and <b>front</b>`);
    nd.next = this.head; this.fx.fresh.add(nd.id + '>' + this.head.id);
    R.tick(); R.note('Aim the new node at the front <code>new.next = front</code> — this becomes the wrap-around link'); this.snapFx(R);
    this.fx.dying.add(this.tail.id + '>' + this.head.id);
    R.note('The old wrap link <b>rear → front</b> is cut — for a moment the circle is open'); this.snapFx(R);
    this.tail.next = nd; this.fx.fresh.add(this.tail.id + '>' + nd.id);
    this.land(nd); this.tail = nd; this.n++;
    R.tick(2); R.note('Close the circle behind it <code>rear.next = new; rear = new</code> — 2 link writes, no traversal'); this.snapFx(R);
    R.done('Enqueue', 'O(1)');
  }
  dequeue(R) {
    if (!this.head) { R.note('Ring is empty.'); return; }
    const h = this.head;
    if (this.n === 1) {
      this.fx.doom.add(h.id); this.fx.dying.add(h.id + '>' + h.id);
      R.tick(); R.note(`Remove the only node <b>${esc(h.v)}</b>`); this.snapFx(R);
      this.head = this.tail = null; this.n = 0; this.snapFx(R);
      R.done('Dequeue', 'O(1)'); return;
    }
    this.fx.doom.add(h.id);
    this.fx.dying.add(h.id + '>' + h.next.id); this.fx.dying.add(this.tail.id + '>' + h.id);
    R.tick(); R.note(`Dequeue <b>${esc(h.v)}</b>: both the front pointer <i>and</i> rear's wrap link must move`); this.snapFx(R);
    this.head = h.next; this.tail.next = this.head;
    this.fx.fresh.add(this.tail.id + '>' + this.head.id);
    this.n--;
    R.tick(2); R.note('Re-close the ring <code>front = front.next; rear.next = front</code> — circle intact'); this.snapFx(R);
    R.done('Dequeue', 'O(1)');
  }
  delTail(R) {
    if (!this.head) { R.note('Ring is empty.'); return; }
    if (this.n === 1) return this.dequeue(R);
    R.note('A singly ring has no back-links: walk from <b>front</b> to the node before <b>rear</b> <code>while (cur.next != rear)</code>');
    const p = this.walk(R, this.n - 2);
    this.fx.doom.add(this.tail.id);
    this.fx.dying.add(p.id + '>' + this.tail.id); this.fx.dying.add(this.tail.id + '>' + this.head.id);
    R.note(`Unlink rear <b>${esc(this.tail.v)}</b> and re-close the circle <code>cur.next = front; rear = cur</code>`); this.snapFx(R);
    p.next = this.head; this.tail = p; this.n--;
    this.fx.fresh.add(p.id + '>' + this.head.id);
    R.tick(2); this.snapFx(R);
    R.done('Delete rear', 'O(n)');
  }
  search(R, v) {
    if (!this.head) { R.note('Ring is empty.'); return; }
    let c = this.head, i = 0;
    do {
      R.cur(c.id); R.tick();
      if (cmp(c.v, v) === 0) {
        this.fx.hit.add(c.id); R.note(`Found <b>${esc(v)}</b> at position ${i}`); this.snapFx(R);
        R.done('Search', 'O(n)'); return;
      }
      c = c.next; i++;
    } while (c !== this.head);
    R.note(`Walked the full circle — <b>${esc(v)}</b> is not here. Circular lists need a stop condition!`);
    R.done('Search', 'O(n)');
  }
  clear(R) {
    if (!this.head) { R.note('Already empty.'); return; }
    for (const nd of this.toArray()) this.fx.doom.add(nd.id);
    R.tick(); R.note('Break the ring <code>front = null; rear = null</code> — every node becomes unreachable'); this.snapFx(R);
    this.head = this.tail = null; this.n = 0; this.snapFx(R);
    R.done('Delete all', 'O(1)');
  }
  generate(R) {
    this.head = this.tail = null; this.n = 0; this.staged = null;
    const k = 5 + Math.floor(Math.random() * 3);
    R.note(`Building a ring of ${k}…`);
    for (let j = 0; j < k; j++) {
      const nd = mkNode(randToken());
      if (!this.head) { this.head = this.tail = nd; nd.next = nd; }
      else { nd.next = this.head; this.tail.next = nd; this.tail = nd; }
      this.n++; R.tick(); this.snapFx(R);
    }
    R.done('Generate', 'O(n)');
  }
  opDefs() {
    return [
      { id: 'enq', label: 'Enqueue', grp: 'add', val: 1, run: (R, v) => this.enqueue(R, v) },
      { id: 'deq', label: 'Front', grp: 'del', danger: 1, run: R => this.dequeue(R) },
      { id: 'delTail', label: 'Rear', grp: 'del', danger: 1, run: R => this.delTail(R) },
      { id: 'clear', label: 'All', grp: 'del', danger: 1, run: R => this.clear(R) },
      { id: 'search', label: 'Search', grp: 'etc', val: 1, run: (R, v) => this.search(R, v) },
      { id: 'gen', label: '🎲 Generate', grp: 'data', run: R => this.generate(R) },
    ];
  }
}

class CircularDoubly extends RingBase {
  static label = 'Circular Doubly';
  bigo() { return [['enq / deq / del rear', 'O(1)'], ['insert at', `O(n) — up to ${this.n} now`], ['search', `O(n) — up to ${this.n}`]]; }
  scene() { return this.ringScene(true); }
  enqueue(R, v) {
    if (this.full(R)) return;
    if (!this.head) {
      const nd = this.stage(R, v, 0, `Create node <b>${esc(v)}</b> — its next <i>and</i> prev point to itself`);
      nd.next = nd; nd.prev = nd; this.land(nd); this.head = this.tail = nd; this.n++;
      R.tick(2); this.snapFx(R); R.done('Enqueue', 'O(1)'); return;
    }
    const nd = this.stage(R, v, 0, `Create node <b>${esc(v)}</b> — splice between <b>rear</b> and <b>front</b>`);
    this.fx.dying.add(this.tail.id + '>' + this.head.id); this.fx.dying.add(this.head.id + '>' + this.tail.id);
    R.note('Cut both wrap links <b>rear ⇄ front</b> — the seam is open in both directions'); this.snapFx(R);
    nd.next = this.head; nd.prev = this.tail;
    this.tail.next = nd; this.head.prev = nd;
    this.fx.fresh.add(this.tail.id + '>' + nd.id); this.fx.fresh.add(nd.id + '>' + this.head.id);
    this.fx.fresh.add(nd.id + '>' + this.tail.id); this.fx.fresh.add(this.head.id + '>' + nd.id);
    this.land(nd); this.tail = nd; this.n++;
    R.tick(5); R.note('Wire 4 links <code>new.prev = rear; new.next = front; rear.next = new; front.prev = new</code>, then <code>rear = new</code> — 5 writes'); this.snapFx(R);
    R.done('Enqueue', 'O(1)');
  }
  dequeue(R) {
    if (!this.head) { R.note('Ring is empty.'); return; }
    if (this.n === 1) {
      const h = this.head;
      this.fx.doom.add(h.id); R.tick(); R.note(`Remove the only node <b>${esc(h.v)}</b>`); this.snapFx(R);
      this.head = this.tail = null; this.n = 0; this.snapFx(R);
      R.done('Dequeue', 'O(1)'); return;
    }
    const h = this.head;
    this.fx.doom.add(h.id);
    this.fx.dying.add(this.tail.id + '>' + h.id); this.fx.dying.add(h.id + '>' + h.next.id);
    this.fx.dying.add(h.id + '>' + this.tail.id); this.fx.dying.add(h.next.id + '>' + h.id);
    R.tick(); R.note(`Dequeue <b>${esc(h.v)}</b> — 4 links touch it, both directions must be re-wired`); this.snapFx(R);
    this.head = h.next; this.head.prev = this.tail; this.tail.next = this.head;
    this.fx.fresh.add(this.tail.id + '>' + this.head.id); this.fx.fresh.add(this.head.id + '>' + this.tail.id);
    this.n--;
    R.tick(2); this.snapFx(R);
    R.done('Dequeue', 'O(1)');
  }
  delTail(R) {
    if (!this.tail) { R.note('Ring is empty.'); return; }
    if (this.n === 1) return this.dequeue(R);
    const t = this.tail;
    this.fx.doom.add(t.id);
    this.fx.dying.add(t.prev.id + '>' + t.id); this.fx.dying.add(t.id + '>' + this.head.id);
    this.fx.dying.add(t.id + '>' + t.prev.id); this.fx.dying.add(this.head.id + '>' + t.id);
    R.note(`<b>rear.prev</b> is known — no walk needed, unlike the singly ring. All 4 links touching <b>${esc(t.v)}</b> are cut`); this.snapFx(R);
    this.tail = t.prev; this.tail.next = this.head; this.head.prev = this.tail;
    this.fx.fresh.add(this.tail.id + '>' + this.head.id); this.fx.fresh.add(this.head.id + '>' + this.tail.id);
    this.n--;
    R.tick(3); R.note(`Re-close the ring <code>rear = rear.prev; rear.next = front; front.prev = rear</code> — 3 writes`); this.snapFx(R);
    R.done('Delete rear', 'O(1)');
  }
  insertFront(R, v) {
    const nd = this.stage(R, v, 0, `Create node <b>${esc(v)}</b> — same splice as rear, but <b>front</b> will move`);
    this.fx.dying.add(this.tail.id + '>' + this.head.id); this.fx.dying.add(this.head.id + '>' + this.tail.id);
    R.note('Cut both wrap links <b>rear ⇄ front</b>'); this.snapFx(R);
    nd.next = this.head; nd.prev = this.tail;
    this.tail.next = nd; this.head.prev = nd;
    this.fx.fresh.add(this.tail.id + '>' + nd.id); this.fx.fresh.add(nd.id + '>' + this.head.id);
    this.fx.fresh.add(nd.id + '>' + this.tail.id); this.fx.fresh.add(this.head.id + '>' + nd.id);
    this.land(nd); this.head = nd; this.n++;
    R.tick(5); R.note('Wire 4 links <code>new.prev = rear; new.next = front; rear.next = new; front.prev = new</code>, then <code>front = new</code> — 5 writes'); this.snapFx(R);
    R.done('Insert at 0', 'O(1)');
  }
  insertAt(R, v, i) {
    if (this.full(R)) return;
    if (i < 0 || i > this.n) { R.note(`Index ${i} is out of range 0…${this.n}.`); return; }
    if (!this.head || i === this.n) { R.note(`Index ${i} = length → enqueue at the rear.`); return this.enqueue(R, v); }
    if (i === 0) return this.insertFront(R, v);
    R.note(`Traverse to index <b>${i - 1}</b>`);
    const p = this.walk(R, i - 1);
    const q = p.next;
    const nd = this.stage(R, v, 0);
    this.fx.dying.add(p.id + '>' + q.id); this.fx.dying.add(q.id + '>' + p.id);
    R.note(`Cut both links <b>${esc(p.v)} ⇄ ${esc(q.v)}</b>`); this.snapFx(R);
    nd.next = q; nd.prev = p; p.next = nd; q.prev = nd;
    this.fx.fresh.add(p.id + '>' + nd.id); this.fx.fresh.add(nd.id + '>' + q.id);
    this.fx.fresh.add(nd.id + '>' + p.id); this.fx.fresh.add(q.id + '>' + nd.id);
    this.land(nd); this.n++;
    R.tick(4); R.note('Wire 4 links <code>new.prev = before; new.next = after; before.next = new; after.prev = new</code>'); this.snapFx(R);
    R.done(`Insert at ${i}`, 'O(n)');
  }
  search(R, v) { CircularQueue.prototype.search.call(this, R, v); }
  clear(R) { CircularQueue.prototype.clear.call(this, R); }
  generate(R) {
    this.head = this.tail = null; this.n = 0; this.staged = null;
    const k = 5 + Math.floor(Math.random() * 3);
    R.note(`Building a doubly ring of ${k}…`);
    for (let j = 0; j < k; j++) {
      const nd = mkNode(randToken());
      if (!this.head) { this.head = this.tail = nd; nd.next = nd; nd.prev = nd; }
      else { nd.next = this.head; nd.prev = this.tail; this.tail.next = nd; this.head.prev = nd; this.tail = nd; }
      this.n++; R.tick(); this.snapFx(R);
    }
    R.done('Generate', 'O(n)');
  }
  opDefs() {
    return [
      { id: 'enq', label: 'Enqueue', grp: 'add', val: 1, run: (R, v) => this.enqueue(R, v) },
      { id: 'insAt', label: '+ At i', grp: 'add', val: 1, idx: 1, run: (R, v, i) => this.insertAt(R, v, i) },
      { id: 'deq', label: 'Front', grp: 'del', danger: 1, run: R => this.dequeue(R) },
      { id: 'delTail', label: 'Rear', grp: 'del', danger: 1, run: R => this.delTail(R) },
      { id: 'clear', label: 'All', grp: 'del', danger: 1, run: R => this.clear(R) },
      { id: 'search', label: 'Search', grp: 'etc', val: 1, run: (R, v) => this.search(R, v) },
      { id: 'gen', label: '🎲 Generate', grp: 'data', run: R => this.generate(R) },
    ];
  }
}
