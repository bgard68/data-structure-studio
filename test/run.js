// Headless test suite: loads the real structure classes (no DOM needed for the
// model layer) and fuzz-tests every invariant the animations claim to show.
// Run: node test/run.js
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = f => readFileSync(join(root, 'src', f), 'utf8').replace(/\r\n/g, '\n');

// Deterministic randomness so CI failures reproduce
let seed = 0xC0FFEE;
Math.random = () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rnd = n => Math.floor(Math.random() * n);

const code = ['core.js', 'structs-linear.js', 'structs-linear2.js', 'structs-hash.js', 'structs-tree.js', 'structs-rb.js']
  .map(src).join('\n');
const S = new Function(code + `
  return { SinglyList, DoublyList, StackLIFO, QueueFIFO, CircularQueue, CircularDoubly,
           HashTable, BST, AVL, RBTree, Rec, cmp, randToken };`)();

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('FAIL:', msg);
}
const R = () => new S.Rec();
const vals = list => list.toArray().map(n => n.v);

/* ---------- cmp: total order, distinct strings never equal ---------- */
{
  const { cmp } = S;
  ok(cmp('2', '10') === -1, 'cmp numeric ordering: 2 < 10');
  ok(cmp('2', '02') !== 0 && cmp('2', '02') === -cmp('02', '2'), 'cmp: 2 vs 02 distinct + antisymmetric');
  ok(cmp('7', '007') !== 0, 'cmp: 7 vs 007 distinct');
  const sample = ['2', '02', '10', '9', '9e', '99', '1e2', 'a', 'A', '#1', '$', 'z9', '007', '7', ''];
  for (const a of sample) for (const b of sample) {
    ok((cmp(a, b) === 0) === (a === b), `cmp equality iff identical: ${a} vs ${b}`);
    ok(cmp(a, b) === -cmp(b, a), `cmp antisymmetric: ${a} vs ${b}`);
  }
  const sorted = [...sample].sort((a, b) => S.cmp(a, b));
  for (let i = 0; i < 200; i++) {
    const [a, b, c] = [sorted[rnd(sample.length)], sorted[rnd(sample.length)], sorted[rnd(sample.length)]].sort((x, y) => S.cmp(x, y));
    ok(S.cmp(a, b) <= 0 && S.cmp(b, c) <= 0 && S.cmp(a, c) <= 0, `cmp transitive: ${a},${b},${c}`);
  }
}

/* ---------- Singly list: fuzz vs array mirror + exact step counts ---------- */
{
  const list = new S.SinglyList();
  let mirror = [];
  const tok = i => 'v' + i;
  let counter = 0;
  for (let op = 0; op < 400; op++) {
    const r = new S.Rec();
    const choice = rnd(8);
    if (choice === 0) { if (mirror.length < list.max) mirror.unshift(tok(counter)); list.addHead(r, tok(counter++)); }
    else if (choice === 1) { if (mirror.length < list.max) mirror.push(tok(counter)); list.addTail(r, tok(counter++)); }
    else if (choice === 2) {
      const i = rnd(mirror.length + 2);
      if (i <= mirror.length && mirror.length < list.max) mirror.splice(i, 0, tok(counter));
      list.insertAt(r, tok(counter++), i);
    }
    else if (choice === 3) { if (mirror.length) mirror.shift(); list.delHead(r); }
    else if (choice === 4) { if (mirror.length) mirror.pop(); list.delTail(r); }
    else if (choice === 5) {
      const i = rnd(mirror.length + 2);
      if (i < mirror.length) mirror.splice(i, 1);
      list.delAt(r, i);
    }
    else if (choice === 6) {
      const target = mirror.length && rnd(2) ? mirror[rnd(mirror.length)] : 'missing';
      const ix = mirror.indexOf(target);
      if (ix >= 0) mirror.splice(ix, 1);
      list.delValue(r, target);
    }
    else { const i = rnd(mirror.length + 1); if (i < mirror.length) mirror[i] = 'e' + op; list.editAt(r, 'e' + op, i); }
    list.clearFx(); list.staged = null;
    ok(vals(list).join(',') === mirror.join(','), `sll fuzz op${op}: ${vals(list)} vs ${mirror}`);
    ok(list.n === mirror.length, `sll fuzz op${op} n`);
    const last = list.toArray().at(-1) ?? null;
    ok(list.tail === last && (!list.tail || list.tail.next === null), `sll fuzz op${op} tail integrity`);
  }
  // exact step counts the README brags about
  const fresh = new S.SinglyList();
  for (const v of ['A', 'B', 'C', 'D', 'E', 'F']) fresh.addTail(R(), v);
  let r = R(); fresh.delTail(r);
  ok(r.count === 7, `sll delTail on n=6 costs 7 steps (walk n-1 + cut + move), got ${r.count}`);
  r = R(); fresh.delValue(r, 'D');   // index 3 of [A..E]
  ok(r.count === 5, `sll one-pass delValue at index 3 costs 5 steps, got ${r.count}`);
}

/* ---------- Doubly list: fuzz + symmetry ---------- */
{
  const list = new S.DoublyList();
  let mirror = [], counter = 0;
  const sym = l => l.toArray().every(n => (!n.next || n.next.prev === n) && (!n.prev || n.prev.next === n))
    && (!l.head || l.head.prev === null) && (!l.tail || l.tail.next === null);
  for (let op = 0; op < 400; op++) {
    const r = new S.Rec();
    const choice = rnd(7);
    if (choice === 0) { if (mirror.length < list.max) mirror.unshift('v' + counter); list.addHead(r, 'v' + counter++); }
    else if (choice === 1) { if (mirror.length < list.max) mirror.push('v' + counter); list.addTail(r, 'v' + counter++); }
    else if (choice === 2) {
      const i = rnd(mirror.length + 2);
      if (i <= mirror.length && mirror.length < list.max) mirror.splice(i, 0, 'v' + counter);
      list.insertAt(r, 'v' + counter++, i);
    }
    else if (choice === 3) { if (mirror.length) mirror.shift(); list.delHead(r); }
    else if (choice === 4) { if (mirror.length) mirror.pop(); list.delTail(r); }
    else if (choice === 5) {
      const i = rnd(mirror.length + 2);
      if (i < mirror.length) mirror.splice(i, 1);
      list.delAt(r, i);
    }
    else {
      const target = mirror.length && rnd(2) ? mirror[rnd(mirror.length)] : 'missing';
      const ix = mirror.indexOf(target);
      if (ix >= 0) mirror.splice(ix, 1);
      list.delValue(r, target);
    }
    list.clearFx(); list.staged = null;
    ok(vals(list).join(',') === mirror.join(','), `dll fuzz op${op}: ${vals(list)} vs ${mirror}`);
    ok(sym(list), `dll fuzz op${op} prev/next symmetric`);
  }
  const fresh = new S.DoublyList();
  for (const v of ['A', 'B', 'C', 'D', 'E', 'F']) fresh.addTail(R(), v);
  const r = R(); fresh.delTail(r);
  ok(r.count === 2, `dll delTail is O(1): 2 steps, got ${r.count}`);
}

/* ---------- Stack + queue ---------- */
{
  const st = new S.StackLIFO(); const mirror = [];
  for (let i = 0; i < 200; i++) {
    if (rnd(2) && mirror.length < st.max) { mirror.unshift('s' + i); st.push(R(), 's' + i); }
    else { mirror.shift(); st.pop(R()); }
    ok(vals(st).join(',') === mirror.join(','), `stack fuzz ${i}`);
  }
  const q = new S.QueueFIFO(); const qm = [];
  for (let i = 0; i < 200; i++) {
    if (rnd(2) && qm.length < q.max) { qm.push('q' + i); q.enqueue(R(), 'q' + i); }
    else { qm.shift(); q.dequeue(R()); }
    ok(vals(q).join(',') === qm.join(','), `queue fuzz ${i}`);
    ok((q.head?.v ?? null) === (qm[0] ?? null) && (q.tail?.v ?? null) === (qm.at(-1) ?? null), `queue fuzz ${i} front/rear`);
  }
}

/* ---------- Circular rings: closure after every op ---------- */
{
  const ring = new S.CircularQueue(); const m = [];
  const closed = rr => !rr.head || (rr.tail.next === rr.head && rr.toArray().length === rr.n);
  for (let i = 0; i < 300; i++) {
    const c = rnd(4);
    if (c === 0) { if (m.length < ring.max) m.push('r' + i); ring.enqueue(R(), 'r' + i); }
    else if (c === 1) { m.shift(); ring.dequeue(R()); }
    else if (c === 2) { m.pop(); ring.delTail(R()); }
    else ring.search(R(), m.length ? m[rnd(m.length)] : 'zz');
    ring.clearFx(); ring.staged = null;
    ok(vals(ring).join(',') === m.join(','), `ring fuzz ${i}: ${vals(ring)} vs ${m}`);
    ok(closed(ring), `ring fuzz ${i} closed`);
  }
  const dr = new S.CircularDoubly(); const dm = [];
  const dclosed = rr => !rr.head || (rr.tail.next === rr.head && rr.head.prev === rr.tail
    && rr.toArray().every(n => n.next.prev === n && n.prev.next === n));
  for (let i = 0; i < 300; i++) {
    const c = rnd(5);
    if (c === 0) { if (dm.length < dr.max) dm.push('d' + i); dr.enqueue(R(), 'd' + i); }
    else if (c === 1) { dm.shift(); dr.dequeue(R()); }
    else if (c === 2) { dm.pop(); dr.delTail(R()); }
    else if (c === 3) {
      const ix = rnd(dm.length + 2);
      if (dm.length < dr.max && ix <= dm.length) dm.splice(ix === dm.length ? dm.length : ix, 0, 'd' + i);
      dr.insertAt(R(), 'd' + i, ix);
    }
    else dr.search(R(), dm.length ? dm[rnd(dm.length)] : 'zz');
    dr.clearFx(); dr.staged = null;
    ok(vals(dr).join(',') === dm.join(','), `dring fuzz ${i}: ${vals(dr)} vs ${dm}`);
    ok(dclosed(dr), `dring fuzz ${i} closed both ways`);
  }
}

/* ---------- Hash table: placement + membership ---------- */
{
  const h = new S.HashTable(); const m = new Set();
  const keys = ['A', 'I', 'Q', 'a', 'b', '#1', '$2', '10', '2', '02', 'x', 'yz', 'Q9', '7'];
  for (let i = 0; i < 300; i++) {
    const k = keys[rnd(keys.length)];
    const c = rnd(3);
    if (c === 0) { if (m.size < h.max || m.has(k)) { h.insert(R(), k); m.add(k); } }
    else if (c === 1) { h.delValue(R(), k); m.delete(k); }
    else h.search(R(), k);
    h.clearFx(); h.stagedNode = null;
    let total = 0, placed = true;
    for (let b = 0; b < h.B; b++) for (const nd of h.chain(b)) { total++; if (h.hash(nd.v) !== b) placed = false; }
    ok(placed, `hash fuzz ${i} every node in its own bucket`);
    ok(total === h.n && total === m.size, `hash fuzz ${i} count: ${total} vs ${m.size}`);
    for (const k2 of m) ok(h.chain(h.hash(k2)).some(nd => nd.v === k2), `hash fuzz ${i} membership ${k2}`);
  }
}

/* ---------- BST / AVL / RB: structural invariants after every op ---------- */
function inorder(t, nd = t.root, out = []) {
  if (!nd || nd === t.NIL) return out;
  inorder(t, nd.l, out); out.push(nd.v); inorder(t, nd.r, out);
  return out;
}
const strictlySorted = a => a.every((v, i) => i === 0 || S.cmp(a[i - 1], v) < 0);
const treeVals = ['1', '2', '3', '02', '007', '10', '9', 'a', 'B', '#4', 'z', 'Q1', '5', '7', '77', '070', 'm', '$'];

{
  const t = new S.BST(); const m = new Set();
  for (let i = 0; i < 400; i++) {
    const v = treeVals[rnd(treeVals.length)];
    if (rnd(2)) { if (m.size < t.max || m.has(v)) { t.insert(R(), v); m.add(v); } }
    else { t.delValue(R(), v); m.delete(v); }
    t.clearFx();
    const io = inorder(t);
    ok(strictlySorted(io), `bst fuzz ${i} sorted`);
    ok(io.length === m.size && io.every(x => m.has(x)), `bst fuzz ${i} membership`);
  }
}
{
  const t = new S.AVL(); const m = new Set();
  const check = nd => {   // returns height, asserts stored h + balance
    if (!nd) return 0;
    const hl = check(nd.l), hr = check(nd.r);
    ok(nd.h === 1 + Math.max(hl, hr), 'avl stored height correct');
    ok(Math.abs(hl - hr) <= 1, 'avl balanced');
    return 1 + Math.max(hl, hr);
  };
  for (let i = 0; i < 450; i++) {
    const v = treeVals[rnd(treeVals.length)];
    if (rnd(2)) { if (m.size < t.max || m.has(v)) { t.insert(R(), v); m.add(v); } }
    else { t.delValue(R(), v); m.delete(v); }
    t.clearFx();
    check(t.root);
    ok(strictlySorted(inorder(t)) && inorder(t).length === m.size, `avl fuzz ${i} sorted + membership`);
  }
}
{
  const t = new S.RBTree(); const m = new Set();
  const rbCheck = () => {
    if (t.root !== t.NIL) ok(t.root.c === 'B', 'rb root black');
    const bh = nd => {
      if (nd === t.NIL) return 1;
      if (nd.c === 'R') ok(nd.l.c !== 'R' && nd.r.c !== 'R', `rb no red-red at ${nd.v}`);
      const bl = bh(nd.l), br = bh(nd.r);
      ok(bl === br, `rb black-height equal at ${nd.v}`);
      return bl + (nd.c === 'B' ? 1 : 0);
    };
    bh(t.root);
  };
  for (let i = 0; i < 550; i++) {
    const v = treeVals[rnd(treeVals.length)];
    if (rnd(2)) { if (m.size < t.max || m.has(v)) { t.insert(R(), v); m.add(v); } }
    else { t.delValue(R(), v); m.delete(v); }
    t.clearFx();
    rbCheck();
    ok(strictlySorted(inorder(t)) && inorder(t).length === m.size, `rb fuzz ${i} sorted + membership`);
  }
}

/* ---------- verdict ---------- */
console.log(`\n${pass} assertions passed, ${fail} failed`);
if (fail) process.exit(1);
console.log('OK — the animation still cannot lie.');
