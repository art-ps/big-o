/* Interactive growth chart: toggleable complexity curves, log/linear scale,
   crosshair tooltip, and a table view of the same data. */

(function () {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const N_MAX = 20;

  const factorial = (n) => {
    let f = 1;
    for (let i = 2; i <= n; i++) f *= i;
    return f;
  };

  /* Colors validated for CVD separation and contrast on this surface
     (dataviz six-checks, dark mode, surface #0b0e14). */
  const SERIES = [
    { key: "1", label: "O(1)", color: "#17a750", fn: () => 1 },
    { key: "logn", label: "O(log n)", color: "#774bcb", fn: (n) => Math.max(Math.log2(n), 0.0001) },
    { key: "n", label: "O(n)", color: "#259ed6", fn: (n) => n },
    { key: "nlogn", label: "O(n log n)", color: "#00886f", fn: (n) => n * Math.max(Math.log2(n), 0.0001) },
    { key: "n2", label: "O(n²)", color: "#e652a3", fn: (n) => n * n },
    { key: "2n", label: "O(2ⁿ)", color: "#9c5a00", fn: (n) => Math.pow(2, n) },
    { key: "nfact", label: "O(n!)", color: "#ec515d", fn: factorial },
  ];

  SERIES.forEach((s) => {
    s.on = true;
    s.values = Array.from({ length: N_MAX }, (_, i) => s.fn(i + 1));
  });

  const svg = document.getElementById("chart");
  const wrap = document.getElementById("chart-wrap");
  const tooltip = document.getElementById("tooltip");
  const legendEl = document.getElementById("legend");

  const W = 900, H = 420;
  const M = { t: 24, r: 118, b: 42, l: 64 };
  const PW = W - M.l - M.r;
  const PH = H - M.t - M.b;

  let scaleMode = "log";

  svg.setAttribute("viewBox", "0 0 " + W + " " + H);

  const SUP = { 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const sup = (n) => String(n).split("").map((d) => SUP[d]).join("");

  function fmt(v) {
    if (v < 1000) return v % 1 === 0 ? String(v) : v.toFixed(1);
    if (v < 1e6) return Math.round(v).toLocaleString("en-US");
    const e = Math.floor(Math.log10(v));
    return (v / Math.pow(10, e)).toFixed(1) + "×10" + sup(e);
  }

  const x = (n) => M.l + ((n - 1) / (N_MAX - 1)) * PW;

  function makeY() {
    if (scaleMode === "log") {
      const top = 19; /* log10 of n! at 20 ≈ 18.4 */
      return (v) => M.t + PH - (Math.log10(Math.max(v, 0.8)) / top) * PH;
    }
    const top = 420; /* keeps n² fully visible; 2ⁿ and n! blow through the roof */
    return (v) => M.t + PH - (Math.min(v, top * 1.15) / top) * PH;
  }

  function el(tag, attrs, text) {
    const node = document.createElementNS(NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (text != null) node.textContent = text;
    return node;
  }

  function draw() {
    svg.textContent = "";
    const y = makeY();

    const defs = el("defs", {});
    const clip = el("clipPath", { id: "plot-clip" });
    clip.appendChild(el("rect", { x: M.l, y: M.t - 6, width: PW + 8, height: PH + 6 }));
    defs.appendChild(clip);
    svg.appendChild(defs);

    /* gridlines + y labels */
    if (scaleMode === "log") {
      for (let e = 0; e <= 18; e += 3) {
        const gy = y(Math.pow(10, e));
        svg.appendChild(el("line", { x1: M.l, x2: M.l + PW, y1: gy, y2: gy, class: "grid-line" }));
        svg.appendChild(el("text", { x: M.l - 8, y: gy + 4, "text-anchor": "end" }, e === 0 ? "1" : "10" + sup(e)));
      }
    } else {
      for (let v = 0; v <= 400; v += 100) {
        const gy = y(v);
        svg.appendChild(el("line", { x1: M.l, x2: M.l + PW, y1: gy, y2: gy, class: "grid-line" }));
        svg.appendChild(el("text", { x: M.l - 8, y: gy + 4, "text-anchor": "end" }, String(v)));
      }
    }

    /* x axis */
    svg.appendChild(el("line", { x1: M.l, x2: M.l + PW, y1: M.t + PH, y2: M.t + PH, class: "axis-line" }));
    for (let n = 0; n <= N_MAX; n += 5) {
      const n2 = Math.max(n, 1);
      svg.appendChild(el("text", { x: x(n2), y: M.t + PH + 20, "text-anchor": "middle" }, String(n2)));
    }
    svg.appendChild(el("text", { x: M.l + PW / 2, y: H - 6, "text-anchor": "middle" }, "input size n"));
    svg.appendChild(el("text", {
      x: 14, y: M.t + PH / 2, "text-anchor": "middle",
      transform: "rotate(-90 14 " + (M.t + PH / 2) + ")",
    }, "operations"));

    /* series lines */
    const lines = el("g", { "clip-path": "url(#plot-clip)" });
    const active = SERIES.filter((s) => s.on);
    active.forEach((s) => {
      const pts = s.values.map((v, i) => x(i + 1).toFixed(1) + "," + y(v).toFixed(1)).join(" ");
      lines.appendChild(el("polyline", { points: pts, class: "series", stroke: s.color }));
    });
    svg.appendChild(lines);

    /* direct labels at line ends, nudged apart so they never collide */
    const labels = active.map((s) => ({
      s,
      ly: Math.max(M.t + 8, Math.min(M.t + PH - 2, y(s.values[N_MAX - 1]))),
    })).sort((a, b) => a.ly - b.ly);
    for (let i = 1; i < labels.length; i++) {
      if (labels[i].ly - labels[i - 1].ly < 15) labels[i].ly = labels[i - 1].ly + 15;
    }
    labels.forEach(({ s, ly }) => {
      svg.appendChild(el("circle", { cx: M.l + PW + 8, cy: ly - 4, r: 3.5, fill: s.color }));
      svg.appendChild(el("text", {
        x: M.l + PW + 15, y: ly, class: "direct-label", fill: "#e8ecf3",
      }, s.label));
    });

    /* hover layer */
    buildHover(y, active);
  }

  function buildHover(y, active) {
    const cross = el("line", { y1: M.t, y2: M.t + PH, class: "crosshair", visibility: "hidden" });
    svg.appendChild(cross);
    const dots = el("g", {});
    svg.appendChild(dots);
    const hit = el("rect", { x: M.l, y: M.t, width: PW, height: PH, fill: "transparent" });
    svg.appendChild(hit);

    function onMove(clientX, clientY) {
      const box = svg.getBoundingClientRect();
      const sx = ((clientX - box.left) / box.width) * W;
      const n = Math.round(((sx - M.l) / PW) * (N_MAX - 1)) + 1;
      if (n < 1 || n > N_MAX) return onLeave();

      const cx = x(n);
      cross.setAttribute("x1", cx);
      cross.setAttribute("x2", cx);
      cross.setAttribute("visibility", "visible");

      dots.textContent = "";
      active.forEach((s) => {
        const dy = y(s.values[n - 1]);
        if (dy >= M.t - 4) {
          dots.appendChild(el("circle", { cx, cy: dy, r: 4, fill: s.color, stroke: "#0b0e14", "stroke-width": 2 }));
        }
      });

      tooltip.innerHTML =
        '<div class="tt-n">n = ' + n + "</div>" +
        active.map((s) =>
          '<div class="tt-row"><span class="tt-key"><span class="dot" style="background:' + s.color + '"></span>' +
          s.label + "</span><b>" + fmt(s.values[n - 1]) + "</b></div>"
        ).join("");
      tooltip.hidden = false;

      const wb = wrap.getBoundingClientRect();
      let tx = clientX - wb.left + 16;
      const ty = Math.max(8, Math.min(clientY - wb.top - 20, wb.height - tooltip.offsetHeight - 8));
      if (tx + tooltip.offsetWidth > wb.width - 8) tx = clientX - wb.left - tooltip.offsetWidth - 16;
      tooltip.style.left = tx + "px";
      tooltip.style.top = ty + "px";
    }

    function onLeave() {
      cross.setAttribute("visibility", "hidden");
      dots.textContent = "";
      tooltip.hidden = true;
    }

    hit.addEventListener("mousemove", (e) => onMove(e.clientX, e.clientY));
    hit.addEventListener("mouseleave", onLeave);
    hit.addEventListener("touchmove", (e) => {
      onMove(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    }, { passive: false });
    hit.addEventListener("touchend", onLeave);
  }

  /* legend chips */
  SERIES.forEach((s) => {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.style.setProperty("--c", s.color);
    chip.setAttribute("aria-pressed", "true");
    chip.innerHTML = '<span class="dot"></span>' + s.label;
    chip.addEventListener("click", () => {
      s.on = !s.on;
      chip.setAttribute("aria-pressed", String(s.on));
      draw();
    });
    legendEl.appendChild(chip);
  });

  /* scale toggle */
  const btnLog = document.getElementById("scale-log");
  const btnLin = document.getElementById("scale-lin");

  function setScale(mode) {
    scaleMode = mode;
    btnLog.classList.toggle("active", mode === "log");
    btnLin.classList.toggle("active", mode === "lin");
    btnLog.setAttribute("aria-pressed", String(mode === "log"));
    btnLin.setAttribute("aria-pressed", String(mode === "lin"));
    draw();
  }

  btnLog.addEventListener("click", () => setScale("log"));
  btnLin.addEventListener("click", () => setScale("lin"));

  /* table view */
  const tableBtn = document.getElementById("table-toggle");
  const tableWrap = document.getElementById("data-table");
  const table = document.getElementById("values-table");
  let tableBuilt = false;

  tableBtn.addEventListener("click", () => {
    const open = tableWrap.hidden;
    tableWrap.hidden = !open;
    tableBtn.setAttribute("aria-pressed", String(open));
    if (open && !tableBuilt) {
      const head = "<tr><th>n</th>" + SERIES.map((s) => "<th>" + s.label + "</th>").join("") + "</tr>";
      const rows = Array.from({ length: N_MAX }, (_, i) =>
        "<tr><td>" + (i + 1) + "</td>" +
        SERIES.map((s) => "<td>" + fmt(s.values[i]) + "</td>").join("") + "</tr>"
      ).join("");
      table.insertAdjacentHTML("beforeend", "<thead>" + head + "</thead><tbody>" + rows + "</tbody>");
      tableBuilt = true;
    }
  });

  draw();
})();
