'use strict';
/* ============ App: registry, tabs, controls ============ */

const REGISTRY = [
  ['sll', SinglyList], ['dll', DoublyList], ['stack', StackLIFO], ['queue', QueueFIFO],
  ['cq', CircularQueue], ['cdq', CircularDoubly], ['hash', HashTable],
  ['bst', BST], ['avl', AVL], ['rb', RBTree],
];
const instances = new Map();
let active = null, renderer, player;

function setOpsEnabled(on) {
  if (window.__exp) on = false;   // guided experiment in progress: controls stay locked
  document.querySelectorAll('#ops button, #tabs button, #finish, #tryit').forEach(b => {
    if (b.id === 'finish') { b.disabled = on; return; }   // finish only enabled while playing
    b.disabled = !on || b.dataset.hardOff === '1';
  });
}

function getStruct(key) {
  if (!instances.has(key)) {
    const Cls = REGISTRY.find(r => r[0] === key)[1];
    const s = new Cls();
    const seedR = new Rec();     // seed with a small dataset, applied instantly
    s.generate(seedR);
    s.clearFx();
    instances.set(key, s);
  }
  return instances.get(key);
}

const GRP_LABELS = { add: 'ADD', del: 'DELETE', etc: 'MORE', data: 'DATA' };

function renderOps(s) {
  const wrap = $('#ops');
  wrap.innerHTML = '';
  const groups = new Map();
  for (const op of s.opDefs()) {
    if (!groups.has(op.grp)) groups.set(op.grp, []);
    groups.get(op.grp).push(op);
  }
  for (const [g, ops] of groups) {
    const div = document.createElement('div');
    div.className = 'opgrp';
    div.dataset.grp = g;
    const lab = document.createElement('span');
    lab.className = 'glabel'; lab.textContent = GRP_LABELS[g] || '';
    div.appendChild(lab);
    for (const op of ops) {
      const b = document.createElement('button');
      b.textContent = op.label;
      if (op.danger) b.className = 'danger';
      b.addEventListener('click', () => runOp(op));
      div.appendChild(b);
    }
    wrap.appendChild(div);
  }
}

function renderChips(s) {
  $('#bigo').innerHTML = s.bigo().map(([k, v]) => `<span>${k} <b>${v}</b></span>`).join('');
}

function runOp(op) {
  if (player.busy) return;
  const s = active;
  let v = $('#val').value.trim();
  if (op.val && !v) { v = randToken(); $('#val').value = v; }
  v = v.slice(0, 4);
  let i = parseInt($('#idx').value, 10);
  if (isNaN(i) || i < 0) i = 0;
  const R = new Rec();
  s.clearFx();
  s.staged = null; s.stagedNode = null;
  // pre-op snapshot: structuredClone preserves the pointer graph (incl. cycles & sentinels)
  const FIELDS = ['head', 'tail', 'root', 'NIL', 'buckets', 'n', 'staged', 'stagedNode'];
  const snap = {};
  for (const f of FIELDS) if (f in s) snap[f] = s[f];
  const backup = structuredClone(snap);
  try {
    op.run(R, v, i);
  } catch (err) {
    console.error(err);
    Object.assign(s, backup);
    s.clearFx();
    R.steps.length = 0;
    R.note('That operation hit an internal error — the structure was rolled back, nothing changed.');
  }
  R.steps.push({ t: 'scene', scene: s.scene(), count: R.count }); // guaranteed final sync frame
  player.play(R.steps, s.sizeInfo()).then(() => renderChips(s));  // chips pick up live n / h / load
}

function selectTab(key) {
  if (player.busy) return;
  active = getStruct(key);
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.key === key));
  renderOps(active);
  renderChips(active);
  renderer.setCur(null);
  renderer.applyScene(active.scene(), true);
  $('#msg').textContent = REGISTRY.find(r => r[0] === key)[1].label + ' — ready.';
  $('#count').textContent = 'steps: 0';
}

/* ---------------- Guided experiments (⚗ Try this) ---------------- */
const EXPERIMENTS = {
  tails: async x => {
    await x.banner('Deleting the TAIL — same operation, two list designs. Watch the step counter.');
    await x.op('sll', 'clear');
    for (const v of ['A', 'B', 'C', 'D', 'E', 'F']) await x.op('sll', 'addTail', v);
    await x.banner('Singly list: no back-links, so it must WALK to the node before tail…');
    const c1 = await x.op('sll', 'delTail');
    await x.banner(`Singly list: <b>${c1} steps</b>. Now the exact same delete on a doubly list…`);
    await x.op('dll', 'clear');
    for (const v of ['A', 'B', 'C', 'D', 'E', 'F']) await x.op('dll', 'addTail', v);
    const c2 = await x.op('dll', 'delTail');
    await x.banner(`Singly: ${c1} steps · Doubly: <b>${c2} steps</b> — the prev pointer is what the extra memory bought`);
  },
  trees: async x => {
    await x.banner('Insert 1–7 IN ORDER into a plain BST — watch it degenerate into a chain');
    await x.op('bst', 'clear');
    for (const v of ['1', '2', '3', '4', '5', '6', '7']) await x.op('bst', 'ins', v);
    const c1 = await x.op('bst', 'search', '7');
    await x.banner(`BST search for 7: <b>${c1} steps</b> — one per level of the chain. Same values into the AVL…`);
    await x.op('avl', 'clear');
    for (const v of ['1', '2', '3', '4', '5', '6', '7']) await x.op('avl', 'ins', v);
    const c2 = await x.op('avl', 'search', '7');
    await x.banner(`BST: ${c1} steps · AVL: <b>${c2} steps</b> — same data, same operation. The SHAPE is the difference`);
  },
  dist: async x => {
    await x.banner('Insert At — inside O(n), the cost is the walk, not the list size');
    await x.op('sll', 'clear');
    for (const v of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) await x.op('sll', 'addTail', v);
    const c1 = await x.op('sll', 'insertAt', 'X', 1);
    await x.banner(`Insert at index 1: <b>${c1} steps</b>. Same insert, further along…`);
    const c2 = await x.op('sll', 'insertAt', 'Y', 6);
    await x.banner(`Index 1: ${c1} steps · index 6: <b>${c2} steps</b> — distance is everything`);
  },
  hash: async x => {
    await x.banner('A(65), I(73) and Q(81) all hash to bucket 1 — mod 8 wipes the difference. Collisions ahead');
    await x.op('hash', 'clear');
    await x.op('hash', 'ins', 'A');
    await x.op('hash', 'ins', 'I');
    await x.op('hash', 'ins', 'Q');
    const c = await x.op('hash', 'search', 'Q');
    await x.banner(`Search Q: <b>${c} steps</b> — one hash, then walking the collision chain. O(1) average still has a worst case`);
  },
};

async function runExperiment(key) {
  if (window.__exp || player.busy || !EXPERIMENTS[key]) return;
  window.__exp = true;
  setOpsEnabled(false);
  const idle = () => new Promise(r => { const t = setInterval(() => { if (!player.busy) { clearInterval(t); r(); } }, 30); });
  const x = {
    banner: async text => {
      $('#msg').innerHTML = '<b>⚗ ' + text + '</b>';
      player.logEntry('⚗', text, true);
      await player.delay(1800);
    },
    op: async (tabKey, opId, v, i) => {
      await idle();
      window.__exp = false; selectTab(tabKey); window.__exp = true;   // selectTab is guarded only by player.busy
      setOpsEnabled(false);
      const d = active.opDefs().find(o => o.id === opId);
      if (v !== undefined) $('#val').value = v;
      if (i !== undefined) $('#idx').value = i;
      runOp(d);
      await idle();
      return parseInt($('#count').textContent.replace(/\D/g, ''), 10) || 0;
    },
  };
  try { await EXPERIMENTS[key](x); }
  catch (err) { console.error(err); }
  finally {
    window.__exp = false;
    $('#tryit').value = '';
    setOpsEnabled(true);
  }
}

function init() {
  renderer = new Renderer($('#svg'));
  player = new Player(renderer);
  const tabs = $('#tabs');
  for (const [key, Cls] of REGISTRY) {
    const b = document.createElement('button');
    b.textContent = Cls.label; b.dataset.key = key;
    b.addEventListener('click', () => selectTab(key));
    tabs.appendChild(b);
  }
  $('#finish').addEventListener('click', () => { player.skip = true; });
  $('#finish').disabled = true;
  $('#tryit').addEventListener('change', e => { if (e.target.value) runExperiment(e.target.value); });
  if (window.innerWidth >= 1100) document.body.classList.add('logopen');
  $('#logbtn').addEventListener('click', () => document.body.classList.toggle('logopen'));
  $('#logx').addEventListener('click', () => document.body.classList.remove('logopen'));
  $('#val').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !player.busy) {
      const first = active.opDefs().find(o => o.grp === 'add');
      if (first) runOp(first);
    }
  });
  selectTab('sll');
}
init();
