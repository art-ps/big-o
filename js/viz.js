/* Ten animated time-complexity patterns. Each pattern owns a small step
   function driven by its own interval; IntersectionObserver pauses rows that
   are offscreen, and prefers-reduced-motion freezes them on a readable frame. */

(function () {
  "use strict";

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PATTERNS = [
    {
      name: "1. Hash Lookup",
      color: "var(--green)",
      code: 'value = map.<span class="fn">get</span>(key)',
      bigO: "O(1)",
      sub: "one jump, any n",
      build: buildHash,
    },
    {
      name: "2. Halving Loop",
      color: "var(--purple)",
      code: '<span class="kw">while</span> (n &gt; <span class="num">1</span>)\n    n = n / <span class="num">2</span>',
      bigO: "O(log n)",
      sub: "halves every step",
      build: buildHalving,
    },
    {
      name: "3. Single Loop",
      color: "var(--blue)",
      code: '<span class="kw">for</span> (i = <span class="num">0</span>; i &lt; n; i++)\n    sum += a[i]',
      bigO: "O(n)",
      sub: "touch each once",
      build: buildSingle,
    },
    {
      name: "4. Sequential Loops",
      color: "var(--indigo)",
      code: '<span class="kw">for</span> (i = <span class="num">0</span>; i &lt; n; i++) { }\n<span class="kw">for</span> (j = <span class="num">0</span>; j &lt; m; j++) { }',
      bigO: "O(n + m)",
      sub: "one pass over each",
      build: buildSequential,
    },
    {
      name: "5. Loop + Binary Search",
      color: "var(--teal)",
      code: '<span class="kw">for</span> (i = <span class="num">0</span>; i &lt; n; i++)\n    <span class="fn">binarySearch</span>(a, x)',
      bigO: "O(n log n)",
      sub: "n × log n work",
      build: buildLoopBinary,
    },
    {
      name: "6. Divide & Conquer",
      color: "var(--emerald)",
      code: 'T(n) = <span class="num">2</span>T(n/<span class="num">2</span>) + n',
      bigO: "O(n log n)",
      sub: "log n levels × n",
      build: buildDivide,
    },
    {
      name: "7. Nested Loop",
      color: "var(--magenta)",
      code: '<span class="kw">for</span> (i = <span class="num">0</span>; i &lt; n; i++)\n    <span class="kw">for</span> (j = <span class="num">0</span>; j &lt; n; j++)',
      bigO: "O(n²)",
      sub: "all n × n pairs",
      build: buildNested,
    },
    {
      name: "8. Triangular Loop",
      color: "var(--pink)",
      code: '<span class="kw">for</span> (i = <span class="num">0</span>; i &lt; n; i++)\n    <span class="kw">for</span> (j = <span class="num">0</span>; j &lt; i; j++)',
      bigO: "O(n²)",
      sub: "n(n−1)/2 pairs",
      build: buildTriangular,
    },
    {
      name: "9. Branching Recursion",
      color: "var(--orange)",
      code: 'T(n) = T(n-<span class="num">1</span>) + T(n-<span class="num">2</span>)',
      bigO: "O(2ⁿ)",
      sub: "doubles per level",
      build: buildBranching,
    },
    {
      name: "10. Permutations",
      color: "var(--red)",
      code: '<span class="kw">for</span> (c : choices)\n    <span class="fn">permute</span>(rest)',
      bigO: "O(n!)",
      sub: "n × (n−1) × … × 1",
      build: buildPermutations,
    },
  ];

  const rowsEl = document.getElementById("rows");
  const animations = [];

  PATTERNS.forEach((p) => {
    const row = document.createElement("article");
    row.className = "row";
    row.style.setProperty("--c", p.color);
    row.innerHTML =
      '<div class="pattern"><div class="p-name">' + p.name + "</div>" +
      '<pre class="p-code">' + p.code + "</pre></div>" +
      '<div class="viz"></div>' +
      '<div class="bigo"><div class="bigo-label">' + p.bigO + "</div>" +
      '<div class="bigo-sub">' + p.sub + "</div></div>";
    rowsEl.appendChild(row);

    const anim = p.build(row.querySelector(".viz"));
    anim.row = row;
    animations.push(anim);
  });

  /* Reveal rows and run only the visible animations. */
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const anim = animations.find((a) => a.row === entry.target);
        if (!anim) return;
        if (entry.isIntersecting) {
          entry.target.classList.add("seen");
          startAnim(anim);
        } else {
          stopAnim(anim);
        }
      });
    },
    { threshold: 0.15 }
  );
  animations.forEach((a) => io.observe(a.row));

  function startAnim(anim) {
    if (REDUCED) {
      anim.freeze();
      return;
    }
    if (anim.timer) return;
    anim.timer = setInterval(() => anim.step(), anim.ms);
  }

  function stopAnim(anim) {
    if (anim.timer) {
      clearInterval(anim.timer);
      anim.timer = null;
    }
  }

  function makeCells(n, cls) {
    const wrap = document.createElement("div");
    wrap.className = "cells" + (cls ? " " + cls : "");
    for (let i = 0; i < n; i++) wrap.appendChild(document.createElement("div")).className = "cell";
    return wrap;
  }

  function caption(text) {
    const el = document.createElement("div");
    el.className = "viz-caption";
    el.textContent = text;
    return el;
  }

  /* 1 ── Hash lookup: the key jumps straight to its bucket. */
  function buildHash(viz) {
    const N = 8;
    const wrap = document.createElement("div");
    wrap.className = "hash-wrap";
    const chip = document.createElement("span");
    chip.className = "key-chip";
    chip.textContent = "key";
    const cells = makeCells(N);
    wrap.append(chip, cells);
    viz.append(wrap, caption("any key → its slot"));

    const cellEls = cells.children;
    let phase = 0;
    let target = 5;

    function step() {
      if (phase === 0) {
        target = Math.floor(Math.random() * N);
        const cell = cellEls[target];
        chip.style.left = cell.offsetLeft + (cell.offsetWidth - chip.offsetWidth) / 2 + "px";
        for (const c of cellEls) c.classList.remove("on");
      } else if (phase === 1) {
        cellEls[target].classList.add("on");
      }
      phase = (phase + 1) % 3;
    }

    return { ms: 550, step, freeze() { cellEls[5].classList.add("on"); chip.style.left = "62%"; } };
  }

  /* 2 ── Halving loop: the bar halves until one element is left. */
  function buildHalving(viz) {
    const STEPS = 7;
    const label = document.createElement("div");
    label.className = "bar-label";
    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    track.appendChild(fill);
    const cap = caption("");
    viz.append(label, track, cap);

    let k = 0;

    function render() {
      fill.style.width = 100 / Math.pow(2, k) + "%";
      label.textContent = k === 0 ? "n" : k === 1 ? "n/2" : "n/" + Math.pow(2, k);
      cap.textContent = k + (k === 1 ? " step" : " steps");
    }

    function step() {
      k = (k + 1) % (STEPS + 1);
      render();
    }

    render();
    return { ms: 650, step, freeze() { k = 3; render(); } };
  }

  /* 3 ── Single loop: touch each cell once. */
  function buildSingle(viz) {
    const N = 12;
    const lane = document.createElement("div");
    lane.className = "pointer-lane";
    const ptr = document.createElement("span");
    ptr.className = "pointer";
    ptr.textContent = "▼";
    lane.appendChild(ptr);
    const cells = makeCells(N);
    viz.append(lane, cells, caption("n steps"));

    const cellEls = cells.children;
    let i = -1;

    function render() {
      for (let j = 0; j < N; j++) {
        cellEls[j].classList.toggle("on", j <= i && i >= 0);
        cellEls[j].classList.toggle("hot", j === i);
      }
      if (i >= 0) {
        const cell = cellEls[i];
        ptr.style.left = cell.offsetLeft + cell.offsetWidth / 2 - 5 + "px";
        ptr.style.opacity = 1;
      } else {
        ptr.style.opacity = 0;
      }
    }

    function step() {
      i = i >= N - 1 ? -1 : i + 1;
      render();
    }

    return { ms: 260, step, freeze() { i = 4; render(); } };
  }

  /* 4 ── Sequential loops: finish the n pass, then the m pass. */
  function buildSequential(viz) {
    const N = 12, M = 8;
    const laneN = document.createElement("div");
    laneN.className = "dual-lane";
    laneN.innerHTML = '<span class="lane-tag">n</span>';
    const cellsN = makeCells(N);
    cellsN.style.setProperty("--c", "var(--blue)");
    laneN.appendChild(cellsN);

    const laneM = document.createElement("div");
    laneM.className = "dual-lane";
    laneM.innerHTML = '<span class="lane-tag">m</span>';
    const cellsM = makeCells(M);
    cellsM.style.setProperty("--c", "var(--purple)");
    laneM.appendChild(cellsM);

    viz.append(laneN, laneM, caption("n first, then m"));

    const els = [...cellsN.children, ...cellsM.children];
    let i = -1;

    function render() {
      els.forEach((c, j) => {
        c.classList.toggle("on", j <= i);
        c.classList.toggle("hot", j === i);
      });
    }

    function step() {
      i = i >= els.length - 1 ? -1 : i + 1;
      render();
    }

    return { ms: 190, step, freeze() { i = N + 2; render(); } };
  }

  /* 5 ── Loop + binary search: each outer step pays log n below. */
  function buildLoopBinary(viz) {
    const N = 12, INNER = 4;
    const cells = makeCells(N);
    const track = document.createElement("div");
    track.className = "bar-track";
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    track.appendChild(fill);
    viz.append(cells, track, caption("log n search per element"));

    const cellEls = cells.children;
    let outer = 0, inner = 0;

    function render() {
      for (let j = 0; j < N; j++) {
        cellEls[j].classList.toggle("on", j < outer || (j === outer && inner > 0));
        cellEls[j].classList.toggle("hot", j === outer && inner > 0);
      }
      /* halve toward one side, alternating per element */
      const w = 100 / Math.pow(2, inner);
      fill.style.width = w + "%";
      fill.style.left = outer % 2 ? 100 - w + "%" : "0%";
    }

    function step() {
      inner++;
      if (inner > INNER) {
        inner = 0;
        outer = (outer + 1) % (N + 1);
      }
      render();
    }

    return { ms: 200, step, freeze() { outer = 5; inner = 2; render(); } };
  }

  /* 6 ── Divide & conquer: every level re-does n work. */
  function buildDivide(viz) {
    const LEVELS = 4;
    const dnc = document.createElement("div");
    dnc.className = "dnc";
    const levels = [];
    for (let l = 0; l < LEVELS; l++) {
      const lvl = document.createElement("div");
      lvl.className = "dnc-level";
      for (let b = 0; b < Math.pow(2, l); b++) {
        lvl.appendChild(document.createElement("div")).className = "dnc-bar";
      }
      dnc.appendChild(lvl);
      levels.push(lvl);
    }
    viz.append(dnc, caption("each level = n work"));

    let shown = 0;

    function render() {
      levels.forEach((lvl, l) => lvl.classList.toggle("show", l < shown));
    }

    function step() {
      shown = shown >= LEVELS ? 0 : shown + 1;
      render();
    }

    return { ms: 620, step, freeze() { shown = LEVELS; render(); } };
  }

  /* 7 ── Nested loop: sweep the full n × n grid. */
  function buildNested(viz) {
    const N = 7;
    const flex = document.createElement("div");
    flex.className = "viz-flex";
    const grid = document.createElement("div");
    grid.className = "grid7";
    for (let i = 0; i < N * N; i++) grid.appendChild(document.createElement("div")).className = "cell";
    const note = document.createElement("div");
    note.className = "viz-note";
    note.textContent = "n rows\n× n cols";
    flex.append(grid, note);
    viz.append(flex);

    const cellEls = grid.children;
    let i = -1;

    function render() {
      for (let j = 0; j < N * N; j++) {
        cellEls[j].classList.toggle("on", j <= i);
        cellEls[j].classList.toggle("hot", j === i);
      }
    }

    function step() {
      i = i >= N * N - 1 ? -1 : i + 1;
      render();
    }

    return { ms: 55, step, freeze() { i = 24; render(); } };
  }

  /* 8 ── Triangular loop: only half the grid gets visited. */
  function buildTriangular(viz) {
    const N = 6;
    const flex = document.createElement("div");
    flex.className = "viz-flex";
    const tri = document.createElement("div");
    tri.className = "tri-rows";
    const cellEls = [];
    for (let r = 0; r < N; r++) {
      const rowC = document.createElement("div");
      rowC.className = "cells";
      for (let c = 0; c <= r; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        rowC.appendChild(cell);
        cellEls.push(cell);
      }
      tri.appendChild(rowC);
    }
    const note = document.createElement("div");
    note.className = "viz-note";
    note.textContent = "half the\ngrid";
    flex.append(tri, note);
    viz.append(flex);

    let i = -1;

    function render() {
      cellEls.forEach((c, j) => {
        c.classList.toggle("on", j <= i);
        c.classList.toggle("hot", j === i);
      });
    }

    function step() {
      i = i >= cellEls.length - 1 ? -1 : i + 1;
      render();
    }

    return { ms: 110, step, freeze() { i = 9; render(); } };
  }

  function svgEl(tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  /* 9 ── Branching recursion: calls double every level. */
  function buildBranching(viz) {
    const W = 260, H = 92, LEVELS = 4;
    const svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, class: "tree-svg" });
    const byLevel = [];

    const pos = (l, i) => {
      const count = Math.pow(2, l);
      return { x: 30 + ((i + 0.5) * (W - 40)) / count, y: 12 + l * 23 };
    };

    for (let l = 0; l < LEVELS; l++) {
      const group = [];
      for (let i = 0; i < Math.pow(2, l); i++) {
        const p = pos(l, i);
        if (l > 0) {
          const par = pos(l - 1, Math.floor(i / 2));
          const edge = svgEl("line", { x1: par.x, y1: par.y, x2: p.x, y2: p.y, class: "edge" });
          svg.appendChild(edge);
          group.push(edge);
        }
        const node = svgEl("circle", { cx: p.x, cy: p.y, r: 4.5, class: "node" });
        svg.appendChild(node);
        group.push(node);
      }
      const lbl = svgEl("text", { x: 2, y: pos(l, 0).y + 3, class: "tlabel" });
      lbl.textContent = String(Math.pow(2, l));
      svg.appendChild(lbl);
      group.push(lbl);
      byLevel.push(group);
    }
    viz.append(svg, caption("2 branches each call"));

    let shown = 0;

    function render() {
      byLevel.forEach((group, l) => group.forEach((el) => el.classList.toggle("show", l < shown)));
    }

    function step() {
      shown = shown >= LEVELS ? 0 : shown + 1;
      render();
    }

    return { ms: 620, step, freeze() { shown = LEVELS; render(); } };
  }

  /* 10 ── Permutations: 3 choices, then 2, then 1 → 3! leaves. */
  function buildPermutations(viz) {
    const W = 260, H = 92;
    const svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, class: "tree-svg" });
    const byLevel = [[], [], []];

    const root = { x: W / 2, y: 10 };
    const l1 = [0, 1, 2].map((i) => ({ x: 45 + i * ((W - 90) / 2), y: 44 }));
    const l2 = [];
    l1.forEach((p, i) => {
      [-14, 14].forEach((dx) => l2.push({ x: p.x + dx, y: 80, parent: i }));
    });

    byLevel[0].push(svg.appendChild(svgEl("circle", { cx: root.x, cy: root.y, r: 4.5, class: "node" })));

    l1.forEach((p) => {
      byLevel[1].push(svg.appendChild(svgEl("line", { x1: root.x, y1: root.y, x2: p.x, y2: p.y, class: "edge" })));
      byLevel[1].push(svg.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 4.5, class: "node" })));
    });
    const t1 = svgEl("text", { x: 6, y: 47, class: "tlabel" });
    t1.textContent = "×3";
    byLevel[1].push(svg.appendChild(t1));

    l2.forEach((p) => {
      const par = l1[p.parent];
      byLevel[2].push(svg.appendChild(svgEl("line", { x1: par.x, y1: par.y, x2: p.x, y2: p.y, class: "edge" })));
      byLevel[2].push(svg.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 4, class: "node" })));
    });
    const t2 = svgEl("text", { x: 6, y: 83, class: "tlabel" });
    t2.textContent = "×2";
    byLevel[2].push(svg.appendChild(t2));
    const t3 = svgEl("text", { x: W - 52, y: 83, class: "tlabel" });
    t3.textContent = "3! paths";
    byLevel[2].push(svg.appendChild(t3));

    viz.append(svg, caption("every ordering"));

    let shown = 0;

    function render() {
      byLevel.forEach((group, l) => group.forEach((el) => el.classList.toggle("show", l < shown)));
    }

    function step() {
      shown = shown >= 3 ? 0 : shown + 1;
      render();
    }

    return { ms: 700, step, freeze() { shown = 3; render(); } };
  }
})();
