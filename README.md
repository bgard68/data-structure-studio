# Data Structure Studio

A one-screen, animated data-structure lab for students. Every operation animates **exactly** what the algorithm does — pointer by pointer, link by link — with a live step counter tied to Big-O.

**10 structures:** singly linked list · doubly linked list · stack (LIFO) · queue (FIFO) · circular queue · circular doubly ring · hash table (chaining) · BST · AVL tree · red-black tree

**Operations:** add at head / tail / index · delete at head / tail / index / by value / all · edit at index · search · peek · generate random data. Values are generic (alphanumeric + symbols).

## Run it

No install, no build, no server needed:

- Open `preview.html` in any browser (double-click works, fully offline), **or**
- Serve the folder with any static server.

## Why the animation can't lie

The data-structure classes mutate **real pointer structures** (`node.next`, `node.prev`, parent/left/right) while recording animation steps. Every frame renders from an authoritative snapshot of the actual model, edges are redrawn each frame from live node positions, and every operation ends with a forced final sync frame. The operation log narrates each pointer write in code form (`new.next = head`, `rear.next = front`, …) and the step counter ticks once per pointer hop/write — audited to match the executed logic exactly.

## Conventions

Aligned with the [W3Schools DSA tutorial](https://www.w3schools.com/dsa/dsa_intro.php):

- AVL balance factor = height(right) − height(left); positive = right-heavy
- Tree heights displayed in **edges** (leaf = 0)
- Hash: sum of character code points mod 8, collisions chain by appending
- BST delete uses the in-order successor
- List indices are **0-based** (deliberate divergence from W3Schools' 1-based examples)
- Red-black tree follows CLRS (beyond W3Schools' scope)

## Develop

Sources live in `src/` (one file per structure family plus the `core.js` animation engine). Never edit the generated files directly:

```
node build.mjs   # regenerates app.html (artifact format) and preview.html (standalone)
```

Plain vanilla JavaScript + SVG + CSS. Zero dependencies.
