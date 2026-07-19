# Big-O Visualizer

An animated, dark-neon website that makes time complexity visible:

- **10 Must-Know Time Complexity Patterns** — each pattern (hash lookup, halving
  loop, single loop, sequential loops, loop + binary search, divide & conquer,
  nested loop, triangular loop, branching recursion, permutations) runs a looping
  visualization next to its code snippet and Big-O label.
- **Growth at a glance** — an interactive chart comparing O(1) through O(n!):
  toggleable curves, log/linear scale, crosshair tooltip, and a table view.

## Run it

No build step — plain HTML/CSS/JS. Open `index.html` in a browser, or serve the
folder:

```bash
python3 -m http.server
```

Works as-is on GitHub Pages.
