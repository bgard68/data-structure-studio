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
  document.querySelectorAll('#ops button, #tabs button, #finish').forEach(b => {
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
