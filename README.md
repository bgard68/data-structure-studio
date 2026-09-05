# Data Structure Studio

[![tests](https://github.com/bgard68/data-structure-studio/actions/workflows/test.yml/badge.svg)](https://github.com/bgard68/data-structure-studio/actions/workflows/test.yml)

A one-screen, animated data-structure lab for students. Every operation animates **exactly** what the algorithm does — pointer by pointer, link by link — with a live step counter tied to Big-O.

**▶ Try it: [bgard68.github.io/data-structure-studio](https://bgard68.github.io/data-structure-studio/)**

Built following the [W3Schools DSA tutorial](https://www.w3schools.com/dsa/dsa_intro.php) conventions.

---

## Run it

No install, no build, no server:

- Open the [live site](https://bgard68.github.io/data-structure-studio/), **or**
- Download `preview.html` and double-click it (fully offline), **or**
- Serve this folder with any static server.

---

## Using the studio

1. **Pick a structure** from the tab bar (10 available, listed below).
2. **Type a value** — up to 4 characters, letters/digits/symbols all work (`A1#`, `42`, `x$`). Leave it blank and the studio picks a random one.
3. For positional operations, set **Index** (0-based — the first node is index 0).
4. Press an operation button. The buttons are grouped:

| Group | Buttons | What they do |
|---|---|---|
| **ADD** | `+ Head` · `+ Tail` · `+ At i` | Insert at the front, the back, or a specific index |
| **DELETE** | `Head` · `Tail` · `At i` · `Value` · `All` | Remove from the front/back/index, search-and-remove a value, or clear everything |
| **MORE** | `Edit at i` · `Search` · `Peek` | Overwrite a value in place, find a value, read the front/top without removing |
| **DATA** | `🎲 Generate` | Build a fresh random structure |

Buttons change per structure — a stack shows `Push`/`Pop`, a queue shows `Enqueue`/`Dequeue`, and operations that don't make sense for a structure (like index inserts on a stack, or edit-in-place on a search tree) simply aren't offered.

**While it animates:** the amber **cur** badge is the traversal pointer; **green links** are being wired; **red dashed links** are being cut; violet badges track `head`/`tail`/`front`/`rear`/`top`/`root`. The **Operation Log** panel (☰ Log) narrates every pointer write in code form — `new.next = head`, `rear.next = front` — with a running step number. Use the **Speed** slider or **⏭ Finish** to control playback.

**New to Big-O?** Open the **⚗ Try this…** menu — it auto-runs four guided experiments (listed in the [O(n) section](#understanding-the-on-counter) below) and reports the step-count comparison when each finishes.

---

## The structures

### Linked List (singly)
Nodes hold a value and a `next` pointer; the list keeps `head` and `tail` pointers. Adding at either end is O(1), but *deleting* the tail is O(n) — a singly list has no back-links, so the animation walks to the node *before* tail (`while (cur.next != tail)`), and the step counter makes you pay for every hop.
📖 [W3Schools: Linked Lists](https://www.w3schools.com/dsa/dsa_theory_linkedlists.php) · [Operations](https://www.w3schools.com/dsa/dsa_algo_linkedlists_operations.php)

| Operation | Cost | Why |
|---|---|---|
| Add at head / tail | O(1) | `head` and `tail` are already known |
| Insert / delete / edit at index i | O(n) | Walk i hops from `head` first |
| Delete at tail | **O(n)** | Must find the node *before* tail |
| Search / delete by value | O(n) | Compare node by node |

### Doubly Linked List
Every node adds a `prev` pointer (drawn as a second lane of arrows). Now `tail.prev` is known, so deleting the tail is O(1) — run it side by side with the singly list and watch the counter drop from *n* steps to 2. Index operations walk from whichever end is nearer.
📖 [W3Schools: Linked List Types](https://www.w3schools.com/dsa/dsa_data_linkedlists_types.php)

| Operation | Cost |
|---|---|
| Add / delete at head or tail | O(1) |
| Insert / delete / edit at index i | O(n) — ≤ n/2 hops from the nearer end |
| Search | O(n) |

### Stack (LIFO)
Last in, first out — like a pile of plates. Only the **top** is ever touched: `Push` makes the new node the top, `Pop` removes it, `Peek` reads it. All O(1).
📖 [W3Schools: Stacks](https://www.w3schools.com/dsa/dsa_data_stacks.php)

### Queue (FIFO)
First in, first out — like a line at a register. `Enqueue` joins at the **rear**, `Dequeue` leaves from the **front**, `Peek` reads the front. All O(1) with front/rear pointers.
📖 [W3Schools: Queues](https://www.w3schools.com/dsa/dsa_data_queues.php)

### Circular Queue
A singly ring: the rear node's `next` wraps around to the front, closing the circle (a lone node points to itself). Enqueue/dequeue are O(1), but watch the wrap link — every operation at the seam must cut and re-wire it. The search animation also shows *why circular lists need a stop condition*: it walks the full circle exactly once.
📖 [W3Schools: Circular Linked Lists](https://www.w3schools.com/dsa/dsa_data_linkedlists_types.php)

### Circular Doubly
The ring wired in both directions: `rear.next → front` *and* `front.prev → rear`. Deleting the rear is O(1) here (vs O(n) on the singly ring) because `rear.prev` is known — another counter comparison worth running yourself.

### Hash Table
8 buckets with **separate chaining**. The hash is the W3Schools formula: sum of the value's character codes, mod 8 — and the animation shows the arithmetic (`hash("AB") = (65 + 66) mod 8 = 3`). Collisions append to the bucket's chain. Insert/search/delete are **O(1) on average**; the "longest chain" chip shows your actual worst case as the table fills.
📖 [W3Schools: Hash Tables](https://www.w3schools.com/dsa/dsa_theory_hashtables.php)

### BST (Binary Search Tree)
Left child lower, right child higher, duplicates rejected. Every operation costs **O(h)** — one comparison per level — and *h* is the whole story: insert `1,2,3,4,5,6,7` in order and the "tree" degenerates into a chain with h = n−1. Delete shows all three textbook cases, including the two-children case solved with the **in-order successor** (smallest value in the right subtree).
📖 [W3Schools: Binary Search Trees](https://www.w3schools.com/dsa/dsa_data_binarysearchtrees.php)

### AVL Tree
A BST that refuses to degenerate. Every node shows its **balance factor** (height(right) − height(left)); when an insert or delete pushes one past ±1, the tree animates the fix — all four rotation cases (LL, RR, LR, RL). Insert `1…8` in order and watch it stay at h = 3 while the plain BST would hit h = 7. All operations O(log n), each rotation O(1).
📖 [W3Schools: AVL Trees](https://www.w3schools.com/dsa/dsa_data_avltrees.php)

### Red-Black Tree
The other classic self-balancer, following the standard CLRS algorithm (this one goes beyond W3Schools' scope). Nodes are colored red or black under three rules: the root is black, red nodes never have red children, and every path to a leaf crosses the same number of black nodes. Inserts and deletes repair violations with recolorings and rotations — the animation names each case as it happens (red uncle → recolor; black uncle → triangle/line rotation). Height is guaranteed ≤ 2·log₂(n+1), and the chip shows your tree's actual height against that bound.

---

## Understanding the O(n) counter

Big-O describes how work grows with input size *n*. The studio doesn't just label operations — the **steps counter** counts the real work as it happens: **one tick per pointer hop, comparison, or link write**. Every finished operation reports both: `Insert at 5 — 8 steps · O(n) · n = 9`.
📖 [W3Schools: Time Complexity](https://www.w3schools.com/dsa/dsa_timecomplexity_theory.php)

Experiments that make Big-O click — each one is in the **⚗ Try this…** menu, which runs it for you and reports the comparison:

- **O(1) vs O(n), same operation:** delete the tail of a singly list (counter ≈ n) then a doubly list (counter = 2). The `prev` pointer is what you bought with the extra memory.
- **Distance matters inside O(n):** `Insert at 1` vs `Insert at 5` on the same list — the counter grows with the walk, not the list.
- **O(h) is only fast when h is small:** insert `1,2,3,4,5,6,7` into the BST, then search `7` — 7 steps. Same values in the AVL tree — 3 steps. Same data, same operation; the shape is the difference.
- **O(1) average, O(n) worst:** fill the hash table and watch the "longest chain" chip — a lookup costs one hash plus that chain walk.

| | Access/Search | Insert | Delete |
|---|---|---|---|
| Linked list | O(n) | O(1) head/tail, O(n) at i | O(1) head, O(n) tail/at i |
| Doubly linked | O(n) | O(1) head/tail, O(n) at i | O(1) head/tail, O(n) at i |
| Stack / Queue | O(n) search, O(1) peek | O(1) | O(1) |
| Circular queue | O(n) | O(1) | O(1) front, O(n) rear (singly) / O(1) (doubly) |
| Hash table | O(1) avg, O(n) worst | O(1) avg | O(1) avg |
| BST | O(h) → O(n) worst | O(h) | O(h) |
| AVL / Red-black | O(log n) | O(log n) | O(log n) |

---

## Why the animation can't lie

The data-structure classes mutate **real pointer structures** (`node.next`, `node.prev`, parent/left/right) while recording animation steps. Every frame renders from an authoritative snapshot of the actual model, edges are redrawn each frame from live node positions, and every operation ends with a forced final sync frame. The step counter was audited to match the executed pointer writes exactly.

And it's machine-checked: `test/run.js` loads the same classes the page runs and fuzzes them against mirror models — ~24,000 assertions covering list order and tail integrity after every random operation, ring closure in both directions, hash bucket placement, BST ordering, AVL balance factors and stored heights, and all three red-black invariants after every insert and delete. CI runs the suite on every push (`node test/run.js` locally) and also verifies the committed build output is byte-identical to a fresh build.

## Conventions

Aligned with the W3Schools DSA tutorial:

- AVL balance factor = height(right) − height(left); positive = right-heavy
- Tree heights displayed in **edges** (leaf = 0)
- Hash: sum of character code points mod 8, collisions chain by appending
- BST delete uses the in-order successor
- List indices are **0-based** (deliberate divergence from W3Schools' 1-based examples)
- Red-black tree follows CLRS (beyond W3Schools' scope)

## Develop

Sources live in `src/` (one file per structure family plus the `core.js` animation engine). Never edit the generated files directly:

```
node build.mjs   # regenerates app.html, preview.html
cp preview.html index.html   # index.html is what GitHub Pages serves
```

Plain vanilla JavaScript + SVG + CSS. Zero dependencies.
