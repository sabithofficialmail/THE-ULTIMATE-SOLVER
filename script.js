const $ = (s) => document.querySelector(s),
  sv = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  },
  ld = (k, d) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : d;
    } catch (e) {
      return d;
    }
  };
// theme
const root = document.documentElement;
function theme(t) {
  root.dataset.theme = t;
  $("#th").textContent = t === "dark" ? "☀️ Light" : "🌙 Dark";
  sv("theme", t);
}
theme(
  ld(
    "theme",
    matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light",
  ),
);
$("#th").onclick = () =>
  theme(root.dataset.theme === "dark" ? "light" : "dark");
// tabs
function tab(t) {
  document
    .querySelectorAll("nav button")
    .forEach((b) => b.classList.toggle("on", b.dataset.t === t));
  document
    .querySelectorAll("section")
    .forEach((s) => s.classList.toggle("on", s.id === t));
}
document
  .querySelectorAll("nav button")
  .forEach((b) => (b.onclick = () => go(b.dataset.t)));
// cube model
const FD = {
  U: [
    [0, 1, 0],
    [1, 0, 0],
    [0, 0, 1],
  ],
  F: [
    [0, 0, 1],
    [1, 0, 0],
    [0, -1, 0],
  ],
  R: [
    [1, 0, 0],
    [0, 0, -1],
    [0, -1, 0],
  ],
  B: [
    [0, 0, -1],
    [-1, 0, 0],
    [0, -1, 0],
  ],
  L: [
    [-1, 0, 0],
    [0, 0, 1],
    [0, -1, 0],
  ],
  D: [
    [0, -1, 0],
    [1, 0, 0],
    [0, 0, -1],
  ],
};
const FACES = ["U", "L", "F", "R", "B", "D"],
  ST = [];
FACES.forEach((f) => {
  const [n, r, d] = FD[f];
  [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ].forEach(([a, b]) =>
    ST.push({ f, n, p: [0, 1, 2].map((k) => n[k] + a * r[k] + b * d[k]) }),
  );
});
const idx = {};
ST.forEach((s, i) => (idx[s.p + "|" + s.n] = i));
const ROT = [
    ([x, y, z]) => [-z, y, x],
    ([x, y, z]) => [x, z, -y],
    ([x, y, z]) => [y, -x, z],
  ],
  IN = [(p) => p[1] == 1, (p) => p[0] == 1, (p) => p[2] == 1],
  PERM = [];
for (let a = 0; a < 3; a++) {
  const b = ST.map((s, i) =>
      IN[a](s.p) ? idx[ROT[a](s.p) + "|" + ROT[a](s.n)] : i,
    ),
    p2 = b.map((i) => b[i]),
    p3 = b.map((i) => p2[i]);
  PERM.push(b, p2, p3);
}
const MV = [];
["U", "R", "F"].forEach((f) => MV.push(f, f + "2", f + "'"));
ROT.push(
  ([x, y, z]) => [z, y, -x],
  ([x, y, z]) => [x, -z, y],
  ([x, y, z]) => [-y, x, z],
);
IN.push(
  (p) => p[1] == -1,
  (p) => p[0] == -1,
  (p) => p[2] == -1,
);
for (let a = 3; a < 6; a++) {
  const b = ST.map((s, i) =>
      IN[a](s.p) ? idx[ROT[a](s.p) + "|" + ROT[a](s.n)] : i,
    ),
    p2 = b.map((i) => b[i]),
    p3 = b.map((i) => p2[i]);
  PERM.push(b, p2, p3);
}
["D", "L", "B"].forEach((f) => MV.push(f, f + "2", f + "'"));
const ap = (s, m) => {
  const p = PERM[m],
    n = new Array(24);
  for (let i = 0; i < 24; i++) n[p[i]] = s[i];
  return n.join("");
};
const inv = (m) => m - (m % 3) + 2 - (m % 3),
  SOLVED = ST.map((s) => s.f).join("");
const COL = {
  "-": "var(--card)",
  U: "#f5f5f5",
  R: "#d32f2f",
  F: "#2e9d4f",
  D: "#f4d03f",
  L: "#f57c20",
  B: "#1e63d6",
};
// solver
let table = null;
function build() {
  if (table) return;
  table = new Map([[SOLVED, []]]);
  let fr = [SOLVED];
  for (let d = 0; d < 6; d++) {
    const nx = [];
    for (const s of fr)
      for (let m = 0; m < 9; m++) {
        const t = ap(s, m);
        if (!table.has(t)) {
          table.set(t, table.get(s).concat(m));
          nx.push(t);
        }
      }
    fr = nx;
  }
}
function norm(c) {
  const cnt = {};
  for (const ch of c) cnt[ch] = (cnt[ch] || 0) + 1;
  const cols = Object.keys(cnt);
  if (cols.length != 6 || cols.some((k) => cnt[k] != 4)) return null;
  const g = {};
  ST.forEach((s, i) => (g[s.p] = g[s.p] || []).push(i));
  const m = {};
  g["-1,-1,-1"].forEach((i) => (m[c[i]] = ST[i].f));
  const base = Object.keys(m);
  if (base.length != 3) return null;
  for (const col of base) {
    const co = new Set();
    Object.values(g).forEach((cs) => {
      const cc = cs.map((i) => c[i]);
      if (cc.includes(col)) cc.forEach((x) => co.add(x));
    });
    const o = cols.filter((x) => !co.has(x));
    if (o.length != 1 || m[o[0]]) return null;
    m[o[0]] = { D: "U", L: "R", B: "F" }[m[col]];
  }
  return Object.keys(m).length == 6
    ? c
        .split("")
        .map((x) => m[x])
        .join("")
    : null;
}
function solve(c) {
  const s = norm(c);
  if (!s) return null;
  build();
  if (table.has(s)) return table.get(s).slice().reverse().map(inv);
  const seen = new Map([[s, []]]);
  let fr = [s];
  for (let d = 0; d < 6; d++) {
    const nx = [];
    for (const x of fr)
      for (let m = 0; m < 9; m++) {
        const t = ap(x, m);
        if (seen.has(t)) continue;
        const p = seen.get(x).concat(m);
        seen.set(t, p);
        if (table.has(t))
          return p.concat(table.get(t).slice().reverse().map(inv));
        nx.push(t);
      }
    fr = nx;
  }
  return null;
}
const fmt = (a) => a.map((m) => MV[m]).join(" ");
// net UI
let net = "-".repeat(24),
  pick = "U";
const pos = [
  [1, 0],
  [0, 1],
  [1, 1],
  [2, 1],
  [3, 1],
  [1, 2],
];
function drawNet() {
  const el = $("#net");
  el.innerHTML = "";
  FACES.forEach((f, fi) => {
    const d = document.createElement("div");
    d.className = "face";
    d.style.gridColumn = pos[fi][0] + 1;
    d.style.gridRow = pos[fi][1] + 1;
    for (let k = 0; k < 4; k++) {
      const i = fi * 4 + k,
        c = document.createElement("i");
      c.style.background = COL[net[i]];
      c.onclick = () => {
        net = net.slice(0, i) + pick + net.slice(i + 1);
        drawNet();
      };
      d.appendChild(c);
    }
    el.appendChild(d);
  });
  const cn = {};
  for (const ch of net) cn[ch] = (cn[ch] || 0) + 1;
  $("#cnt").textContent =
    "Counts: " +
    "URFDLB"
      .split("")
      .map((k) => (cn[k] || 0) + "/4")
      .join("  ") +
    "   Blank: " +
    (cn["-"] || 0);
  if (typeof svRender === "function") svRender();
}
function drawPal() {
  $("#pal").innerHTML = "";
  "URFDLB".split("").forEach((k) => {
    const i = document.createElement("i");
    i.style.background = COL[k];
    i.className = k === pick ? "on" : "";
    i.onclick = () => {
      pick = k;
      drawPal();
    };
    $("#pal").appendChild(i);
  });
}
function scrState(a) {
  let s = SOLVED;
  a.forEach((m) => (s = ap(s, m)));
  return s;
}
function rscr() {
  const o = [];
  let l = -1;
  while (o.length < 10) {
    const f = (Math.random() * 3) | 0;
    if (f == l) continue;
    l = f;
    o.push(f * 3 + ((Math.random() * 3) | 0));
  }
  return o;
}
$("#go").onclick = () => {
  const o = $("#out");
  const e = net.split("-").length - 1;
  if (e) {
    o.className = "err";
    o.textContent = "Fill in every sticker first (" + e + " still blank).";
    $("#cs").hidden = true;
    return;
  }
  o.className = "mut";
  o.textContent = "Solving…";
  $("#cs").hidden = true;
  setTimeout(() => {
    const r = solve(net);
    if (!r) {
      o.className = "err";
      o.textContent =
        "No solution found. Check the colors: each color must appear 4 times and the cube must be a legal 2x2 (no single twisted corner or swapped pair).";
    } else if (!r.length) {
      o.className = "";
      o.textContent = "Already solved! 🎉";
    } else {
      o.className = "";
      o.textContent = fmt(r) + "   (" + r.length + " moves)";
      $("#cs").hidden = false;
    }
  }, 30);
};
$("#cs").onclick = () =>
  navigator.clipboard &&
  navigator.clipboard.writeText($("#out").textContent.split("   ")[0]);
$("#bl").onclick = () => {
  net = "-".repeat(24);
  $("#out").className = "mut";
  $("#out").textContent = "Nothing yet.";
  $("#cs").hidden = true;
  drawNet();
};
$("#rs").onclick = () => {
  net = SOLVED;
  drawNet();
};
$("#rn").onclick = () => {
  net = scrState(rscr());
  drawNet();
};
// timer
let times = ld("times", []).map((e) => ({ d: Date.now(), ...e })),
  cur = rscr(),
  state = "idle",
  t0 = 0,
  raf = 0,
  hold = 0;
const ms = (t) => (t == null ? "DNF" : (t / 1000).toFixed(2)),
  avg = (a, n) => {
    if (a.length < n) return null;
    const x = a
      .slice(-n)
      .map((e) => e.t)
      .sort((p, q) => p - q)
      .slice(1, -1);
    return x.reduce((p, q) => p + q, 0) / x.length;
  };
function newScr() {
  cur = rscr();
  $("#scr").textContent = fmt(cur);
}
function render() {
  const v = times.map((e) => e.t),
    b = v.length ? Math.min(...v) : null,
    mean = v.length ? v.reduce((p, q) => p + q, 0) / v.length : null,
    a5 = avg(times, 5),
    a12 = avg(times, 12);
  $("#st").innerHTML =
    [
      ["Best", b],
      ["Mean", mean],
      ["ao5", a5],
      ["ao12", a12],
    ]
      .map(
        ([k, x]) =>
          `<div><span>${k}</span><b>${x == null ? "–" : ms(x)}</b></div>`,
      )
      .join("") + `<div><span>Solves</span><b>${v.length}</b></div>`;
  $("#list").innerHTML =
    times
      .map((e, i) => [i + 1, e.t, (e.k === "3d" ? "🧊 " : "") + e.s])
      .reverse()
      .map(
        ([i, t, s]) =>
          `<div><span>${i}.</span><b>${ms(t)}</b><span class="mut">${s}</span></div>`,
      )
      .join("") || '<span class="mut">No solves yet.</span>';
  sv("times", times);
}
function tick() {
  $("#tm").textContent = ms(performance.now() - t0);
  raf = requestAnimationFrame(tick);
}
function press() {
  if (state === "run") {
    cancelAnimationFrame(raf);
    const t = Math.round(performance.now() - t0);
    $("#tm").textContent = ms(t);
    const pbk = times.length && t < Math.min(...times.map((e) => e.t));
    times.push({ t, s: fmt(cur), d: Date.now() });
    if (pbk) toast("🎉 New personal best!");
    state = "idle";
    newScr();
    render();
    return 1;
  }
  if (state === "idle") {
    state = "hold";
    $("#tm").className = "hold";
    hold = setTimeout(() => {
      if (state === "hold") {
        state = "ready";
        $("#tm").className = "ready";
      }
    }, 300);
  }
}
function release() {
  clearTimeout(hold);
  if (state === "ready") {
    state = "run";
    $("#tm").className = "";
    t0 = performance.now();
    tick();
  } else if (state === "hold") {
    state = "idle";
    $("#tm").className = "";
  }
}
let stopped = false;
addEventListener("keydown", (e) => {
  if (
    e.code === "Space" &&
    $("#timer").classList.contains("on") &&
    e.target.tagName !== "INPUT"
  ) {
    e.preventDefault();
    if (e.repeat) return;
    stopped = press();
  } else if (state === "run") {
    press();
  }
});
addEventListener("keyup", (e) => {
  if (e.code === "Space") {
    if (stopped) {
      stopped = false;
      return;
    }
    release();
  }
});
$("#tm").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  stopped = press();
});
addEventListener("pointerup", () => {
  if (stopped) {
    stopped = false;
    return;
  }
  release();
});
$("#ns").onclick = newScr;
$("#ss").onclick = () => {
  net = scrState(cur);
  drawNet();
  tab("solver");
};
$("#del").onclick = () => {
  times.pop();
  render();
};
$("#dnf").onclick = () => {
  if (times.length) {
    times[times.length - 1].t += 2000;
    render();
  }
};
let ct = 0;
$("#clr").onclick = () => {
  const b = $("#clr");
  if (!ct) {
    b.textContent = "Tap again to confirm";
    ct = setTimeout(() => {
      ct = 0;
      b.textContent = "Clear all";
    }, 3000);
  } else {
    clearTimeout(ct);
    ct = 0;
    b.textContent = "Clear all";
    times = [];
    sv("times", []);
    render();
    $("#tm").textContent = "0.00";
  }
};
$("#rt").onclick = () => {
  cancelAnimationFrame(raf);
  clearTimeout(hold);
  state = "idle";
  stopped = false;
  $("#tm").className = "";
  $("#tm").textContent = "0.00";
};
$("#cp").onclick = () =>
  navigator.clipboard &&
  navigator.clipboard.writeText(
    times.map((e) => ms(e.t) + "\t" + e.s).join("\n"),
  );
// algorithms
const ALGS = [
  ["OLL", "Sune", "R U R' U R U2 R'", "One corner oriented, twist the rest"],
  ["OLL", "Anti-Sune", "R U2 R' U' R U' R'", "Mirror of Sune"],
  [
    "OLL",
    "H",
    "F R U R' U' R U R' U' R U R' U' F'",
    "No corners oriented, two pairs of side stickers facing back and front",
  ],
  [
    "OLL",
    "Pi",
    "F R U R' U' R U R' U' F'",
    "No corners oriented, side stickers in a Pi shape",
  ],
  [
    "OLL",
    "U",
    "F R U R' U' F'",
    "Two adjacent corners oriented, twisted stickers on the same side",
  ],
  [
    "OLL",
    "T",
    "R U R' U' R' F R F'",
    "Two adjacent corners oriented, twisted stickers on opposite sides",
  ],
  ["OLL", "L", "F R' F' R U R U' R'", "Two diagonal corners oriented"],
  [
    "PBL",
    "Adjacent swap (T-perm)",
    "R U R' U' R' F R2 U' R' U' R U R' F'",
    "Top: adjacent swap · bottom: solved",
  ],
  [
    "PBL",
    "Diagonal swap (Y-perm)",
    "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    "Top: diagonal swap · bottom: solved",
  ],
  [
    "PBL",
    "Solved / Adjacent",
    "U R F' R F2 R' U F R2 F2",
    "Top: solved · bottom: adjacent swap (front)",
  ],
  [
    "PBL",
    "Solved / Diagonal",
    "R U' R U R' F2 R' U' R' U F2",
    "Top: solved · bottom: diagonal swap",
  ],
  [
    "PBL",
    "Adjacent / Adjacent (same side)",
    "F2 U' R2 U2 F2 U' F2",
    "Both layers swap on the same side",
  ],
  [
    "PBL",
    "Adjacent / Adjacent (opposite sides)",
    "U2 R2 U F2 U2 R2 U R2 U2",
    "Top swap at the back, bottom swap at the front",
  ],
  [
    "PBL",
    "Adjacent / Adjacent (side by side)",
    "U F2 U F2 U2 R2 U F2 U'",
    "Top swap at the back, bottom swap on the right",
  ],
  [
    "PBL",
    "Adjacent / Diagonal",
    "R U' R F2 R' U R'",
    "Top: adjacent swap · bottom: diagonal swap",
  ],
  [
    "PBL",
    "Diagonal / Adjacent",
    "R U' F U2 F' U R'",
    "Top: diagonal swap · bottom: adjacent swap",
  ],
  ["PBL", "Diagonal / Diagonal", "R2 F2 R2", "Both layers swap diagonally"],
  [
    "CLL",
    "Sune (CLL case)",
    "R U R' U R U2 R'",
    "Solves corners fully when the permutation already fits",
  ],
  [
    "CLL",
    "Anti-Sune (CLL case)",
    "R U2 R' U' R U' R'",
    "Mirror of the Sune case",
  ],
  [
    "Basics",
    "Sexy move",
    "R U R' U'",
    "The core trigger, repeat 6 times to return to solved",
  ],
  [
    "Basics",
    "Sledgehammer",
    "R' F R F'",
    "Inserts a corner or fixes a twist, also a 6-repeat trigger",
  ],
  [
    "Basics",
    "Corner insert (right)",
    "R U R'",
    "Insert a first-layer corner from above",
  ],
];
const TK = {};
["U", "R", "F"].forEach((f, a) => {
  TK[f] = a * 3;
  TK[f + "2"] = a * 3 + 1;
  TK[f + "'"] = a * 3 + 2;
});
function svgFor(alg, L = 1) {
  let s = SOLVED;
  invAlg(alg)
    .split(" ")
    .forEach((t) => {
      if (TK[t] != null) s = ap(s, TK[t]);
    });
  const r = (x, y, w, h, c) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${COL[c]}" stroke="#000" stroke-opacity=".5"/>`;
  let o =
    '<svg width="84" height="84" viewBox="0 0 84 84" role="img" aria-label="Case diagram">';
  ST.forEach((k, i) => {
    if (k.p[1] != L) return;
    const cx = 14 + ((k.p[0] + 1) / 2) * 28,
      cz = 14 + ((L * k.p[2] + 1) / 2) * 28,
      c = s[i];
    if (k.n[1] == L) o += r(cx, cz, 26, 26, c);
    else if (k.n[2] == 1) o += r(cx, L == 1 ? 71 : 4, 26, 9, c);
    else if (k.n[2] == -1) o += r(cx, L == 1 ? 4 : 71, 26, 9, c);
    else if (k.n[0] == 1) o += r(71, cz, 9, 26, c);
    else if (k.n[0] == -1) o += r(4, cz, 9, 26, c);
  });
  return o + "</svg>";
}
const pics = (g, a) => svgFor(a) + (g === "PBL" ? svgFor(a, -1) : "");
let grp = "All";
{
  const DROP = new Set([
    "Solved / Adjacent",
    "Solved / Diagonal",
    "Adjacent / Adjacent (opposite sides)",
    "Adjacent / Adjacent (side by side)",
    "Diagonal / Adjacent",
    "Sune (CLL case)",
    "Anti-Sune (CLL case)",
  ]);
  for (let i = ALGS.length - 1; i >= 0; i--)
    if (DROP.has(ALGS[i][1])) ALGS.splice(i, 1);
  ALGS.forEach((a) => {
    if (a[1] === "Adjacent / Adjacent (same side)") {
      a[1] = "Adjacent / Adjacent";
      a[3] =
        "Both layers swap two adjacent corners. Turn U and D first so it matches the diagram";
    }
    if (a[0] === "PBL" && a[1].startsWith("Adjacent swap"))
      a[3] =
        "Top: adjacent swap, bottom solved. If it is the other way round, flip the cube (x2) first";
    if (a[0] === "PBL" && a[1].startsWith("Diagonal swap"))
      a[3] =
        "Top: diagonal swap, bottom solved. If it is the other way round, flip the cube (x2) first";
  });
  const CLLD = `Oriented: adjacent swap|R2 F2 R U R' F2 R F' R
Oriented: diagonal swap|R2 U' R U F R2 F U' R' U F'
Sune 1|R' U2 R U R' U R
Sune 2|F U' F' R U' R' F
Sune 3|F U' F' R F2 R F2 R'
Sune 4|F' U2 F U2 F R' F' R
Sune 5|R2 F R F2 U F2 R' F' R2
Sune 6|F2 U' R' F2 R U' F2 U F'
Anti-Sune 1|F' U' F2 U F2 U' F'
Anti-Sune 2|F' U F R' F R F'
Anti-Sune 3|F U2 F' U2 F' R U R'
Anti-Sune 4|F' U F R' U2 R' U2 R
Anti-Sune 5|R2 F R U2 F' U2 R' F' R2
Anti-Sune 6|R F' U2 F R' U2 R U R2
H 1|F2 U2 F U2 F2
H 2|R2 F' U2 F2 R2 F' R2
H 3|F R U2 R U2 R F U2 R2
H 4|F2 U F U R' U2 F2 U R' F
Pi 1|R U2 R2 U' R2 U R2 U2 R'
Pi 2|R2 U2 F R U2 R F2 R F
Pi 3|F2 U F2 R' F2 R F2 U' F2
Pi 4|R' U2 R F2 U' F R2 F' R' F
Pi 5|F R' F U2 F2 R' U F U F2
Pi 6|R F2 R' U2 F U' F2 U R F'
U 1|F R U R' U' F'
U 2|F2 R2 U' R' F R' F U' F
U 3|R2 U R' F2 R F' R' F2 R'
U 4|F2 R2 F' U2 F R2 F' R2 F'
U 5|R2 U' R U R2 U F R2 F'
U 6|R U R' F2 U' R U' R' U F2
T 1|F U F' U' R' F' R
T 2|F' U' F U R U R'
T 3|R F2 U2 R' U' F R' F R'
T 4|R F' U F R2 U2 R U R'
T 5|R' U2 R' F2 R F2 R' F2 R2
T 6|R U F R' F' R U2 R' U2 R2
L 1|R' F R U F U' F'
L 2|R U' R' U' F' U F
L 3|R2 U' R U2 R' U2 R U' R2
L 4|R' U2 R U F2 U R U' F2
L 5|R F2 R' F' R2 F' R' U F2
L 6|F U2 F2 R U R' F U2 F'`
    .split("\n")
    .map((l) => l.split("|"));
  ALGS.push(
    ...CLLD.map(([n, a]) => ["CLL", n, a, a.split(" ").length + " moves"]),
  );
}
const invAlg = (a) =>
  a
    .split(" ")
    .reverse()
    .map((m) =>
      m.endsWith("'") ? m.slice(0, -1) : m.endsWith("2") ? m : m + "'",
    )
    .join(" ");
function drawAlgs() {
  const q = $("#q").value.toLowerCase(),
    gs = ["All", "Ortega", "OLL", "PBL", "CLL", "Basics"];
  $("#chips").innerHTML = "";
  gs.forEach((g) => {
    const b = document.createElement("button");
    b.textContent = g;
    b.className = g === grp ? "on" : "";
    b.onclick = () => {
      grp = g;
      drawAlgs();
    };
    $("#chips").appendChild(b);
  });
  const el = $("#al");
  el.innerHTML =
    grp === "Ortega"
      ? '<div class="alg"><div><b>The Ortega method</b><br><small>1) Build one full face (any colour) and ignore the other layer. 2) OLL: orient the last layer so both layers each show a single colour (7 cases). 3) PBL: permute both layers with one algorithm (5 cases), then align with U and D turns. If a case is the other way round, for example a solved top and an adjacent swap on the bottom, flip the cube over (x2) and use the same algorithm.</small></div></div>'
      : "";
  ALGS.filter(
    (a) =>
      (grp === "All" ||
        a[0] === grp ||
        (grp === "Ortega" && (a[0] === "OLL" || a[0] === "PBL"))) &&
      a.join(" ").toLowerCase().includes(q),
  ).forEach(([g, n, a, d]) => {
    const r = document.createElement("div");
    r.className = "alg";
    r.innerHTML = `<div style="display:flex;gap:12px;align-items:center">${g === "Basics" ? "" : `<span class="pic">${pics(g, a)}</span>`}<div><b>${n}</b> <small>${g} · ${d}</small><code>${a}</code></div></div><div><button>Copy</button> <button>Inverse</button></div>`;
    const [c, i] = r.querySelectorAll("button"),
      code = r.querySelector("code");
    c.onclick = () =>
      navigator.clipboard && navigator.clipboard.writeText(code.textContent);
    i.onclick = () => {
      code.textContent = invAlg(code.textContent);
      const pc = r.querySelector(".pic");
      if (pc) pc.innerHTML = pics(g, code.textContent);
    };
    el.appendChild(r);
  });
  if (!el.children.length)
    el.innerHTML = '<span class="mut">No matches.</span>';
}
$("#q").oninput = drawAlgs;
let rg = "7";
const DAY = 864e5,
  dk = (d) =>
    new Date(d).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
function toast(m) {
  const t = $("#toast");
  t.textContent = m;
  t.classList.add("on");
  setTimeout(() => t.classList.remove("on"), 2500);
}
function roll(a, n) {
  let b = null,
    bi = -1;
  for (let i = n - 1; i < a.length; i++) {
    const v = avg(a.slice(i - n + 1, i + 1), n);
    if (v != null && (b == null || v < b)) {
      b = v;
      bi = i;
    }
  }
  return b == null ? null : [b, a[bi].d];
}
function drawProg() {
  [
    ["1", "Today"],
    ["7", "7 days"],
    ["30", "30 days"],
    ["0", "All"],
  ].forEach(() => 0);
  $("#rng").innerHTML = "";
  [
    ["1", "Today"],
    ["7", "7 days"],
    ["30", "30 days"],
    ["0", "All time"],
  ].forEach(([k, l]) => {
    const b = document.createElement("button");
    b.textContent = l;
    b.className = k === rg ? "on" : "";
    b.onclick = () => {
      rg = k;
      drawProg();
    };
    $("#rng").appendChild(b);
  });
  [
    ["all", "All solves"],
    ["t", "Timer"],
    ["3", "3D cube"],
  ].forEach(([k, l]) => {
    const b = document.createElement("button");
    b.textContent = l;
    b.className = k === sr ? "on" : "";
    b.onclick = () => {
      sr = k;
      drawProg();
    };
    $("#rng").appendChild(b);
  });
  const st = new Date();
  st.setHours(0, 0, 0, 0);
  const cut = rg === "0" ? 0 : st.getTime() - (rg - 1) * DAY,
    v = times.filter(
      (e) =>
        e.d >= cut &&
        (sr === "all" || (sr === "3" ? e.k === "3d" : e.k !== "3d")),
    );
  if (v.length < 2)
    $("#gr").innerHTML =
      '<p class="mut">Do at least 2 solves in this range to see the graph.</p>';
  else {
    const W = 640,
      H = 220,
      P = 40,
      ys = v.map((e) => e.t / 1000),
      mx = Math.max(...ys),
      mn = Math.min(...ys),
      sp = mx - mn || 1,
      X = (i) => P + (i * (W - P - 8)) / (v.length - 1),
      Y = (y) => H - 20 - ((y - mn) / sp) * (H - 40),
      a5 = [];
    v.forEach((_, i) => {
      if (i >= 4) a5.push(X(i) + "," + Y(avg(v.slice(i - 4, i + 1), 5) / 1000));
    });
    $("#gr").innerHTML =
      `<svg viewBox="0 0 ${W} ${H}"><text x="2" y="${Y(mx) + 4}" style="fill:var(--mut);font-size:11px">${mx.toFixed(1)}s</text><text x="2" y="${Y(mn) + 4}" style="fill:var(--mut);font-size:11px">${mn.toFixed(1)}s</text><line x1="${P}" x2="${W - 8}" y1="${H - 8}" y2="${H - 8}" style="stroke:var(--bd)"/><polyline points="${ys.map((y, i) => X(i) + "," + Y(y)).join(" ")}" style="fill:none;stroke:var(--mut);stroke-width:1.5;opacity:.6"/>${v.length > 300 ? "" : ys.map((y, i) => `<circle cx="${X(i)}" cy="${Y(y)}" r="3" style="fill:${v[i].k === "3d" ? "var(--ok)" : "var(--mut)"}"/>`).join("")}<polyline points="${a5.join(" ")}" style="fill:none;stroke:var(--ac);stroke-width:3"/></svg><div class="mut">Grey dots = timer solves · green dots = 3D cube solves · purple line = ao5 · ${v.length} solves</div>`;
  }
  const all = times,
    b = all.length ? all.reduce((m, e) => (e.t < m.t ? e : m)) : null,
    r5 = roll(all, 5),
    r12 = roll(all, 12),
    dys = new Set(all.map((e) => new Date(e.d).toDateString())),
    td = all.filter((e) => e.d >= st.getTime()).length;
  $("#pb").innerHTML = [
    ["Best single", b && ms(b.t), b && dk(b.d)],
    ["Best ao5", r5 && ms(r5[0]), r5 && dk(r5[1])],
    ["Best ao12", r12 && ms(r12[0]), r12 && dk(r12[1])],
    ["Today", td + " solves", ""],
    ["Total", all.length + " solves", ""],
    ["Days practised", dys.size, ""],
    [
      "3D cube",
      all.filter((e) => e.k === "3d").length + " solves",
      (() => {
        const x = all.filter((e) => e.k === "3d").map((e) => e.t);
        return x.length ? "best " + ms(Math.min(...x)) : "";
      })(),
    ],
  ]
    .map(
      ([k, x, s]) =>
        `<div><span>${k}</span><b>${x || "–"}</b><span>${s || ""}</span></div>`,
    )
    .join("");
  const g = {};
  all.forEach((e) => {
    const k = new Date(e.d).toDateString();
    (g[k] = g[k] || []).push(e);
  });
  let pv = null;
  const rows = Object.keys(g)
    .sort((a, b) => new Date(a) - new Date(b))
    .map((k) => {
      const a = g[k],
        m = a.reduce((s, e) => s + e.t, 0) / a.length,
        tr =
          pv == null
            ? ""
            : m < pv
              ? ' <span class="up">▲</span>'
              : ' <span class="dn">▼</span>';
      pv = m;
      return `<tr><td>${dk(new Date(k))}</td><td>${a.length}</td><td>${ms(Math.min(...a.map((e) => e.t)))}</td><td>${ms(m)}${tr}</td></tr>`;
    })
    .reverse();
  $("#days").innerHTML =
    "<tr><th>Date</th><th>Solves</th><th>Best</th><th>Mean</th></tr>" +
    (rows.join("") ||
      '<tr><td colspan="4" class="mut">No solves yet.</td></tr>');
}
$("#ex").onclick = () => {
  const j = JSON.stringify(times);
  $("#ta").value = j;
  try {
    navigator.clipboard.writeText(j).then(
      () => toast("Data copied"),
      () => {},
    );
  } catch (e) {}
};
$("#im").onclick = () => {
  try {
    const a = JSON.parse($("#ta").value);
    if (!Array.isArray(a)) throw 0;
    const have = new Set(times.map((e) => e.d + "_" + e.t));
    let n = 0;
    a.filter((e) => e && typeof e.t === "number" && e.t >= 0).forEach((e) => {
      const x = { t: e.t, s: String(e.s || ""), d: +e.d || Date.now(), k: e.k };
      if (!have.has(x.d + "_" + x.t)) {
        times.push(x);
        n++;
      }
    });
    times.sort((p, q) => p.d - q.d);
    render();
    drawProg();
    toast("Imported " + n + " solves");
  } catch (e) {
    toast("That data isn’t valid");
  }
};
let done = ld("done", {}),
  pg = SOLVED,
  ph = [],
  qs = 0,
  qn = 0;
const LES = [
  [
    "know",
    "Know your cube",
    `<div class="lesson"><p>A 2x2 has <b>8 corner pieces</b> and nothing else: no edges and no centres. Each corner has 3 coloured stickers, and the cube is solved when every face is one colour.</p><p>Because there are no fixed centres, you can hold one corner still and only ever turn three faces: <b>R</b>, <b>U</b> and <b>F</b>. The Solver tab works exactly this way.</p><p>There are 3,674,160 positions, and every one can be solved in 11 moves or fewer.</p></div>`,
  ],
  [
    "moves",
    "Basic moves (notation)",
    `<div class="lesson"><p>Three letters are enough: <b>R</b> (right face), <b>U</b> (top face) and <b>F</b> (front face). A plain letter is a quarter turn <b>clockwise</b>, as if you were looking straight at that face. A prime <b>'</b> means counter-clockwise, and <b>2</b> means a half turn.</p><p>Example: <b>R U' F2</b> = right clockwise, top counter-clockwise, front half turn. L, D and B work the same way for the left, bottom and back faces.</p><p class="mut">Try it on the 3D cube below: drag to rotate it, then tap a move.</p><div id="pg"></div></div>`,
  ],
  [
    "trig",
    "Triggers: your first algorithms",
    `<div class="lesson"><p>Short move groups you will repeat all the time. Tap Try it to run one on the cube in the previous lesson.</p><div class="alg"><div><b>Sexy move</b><code>R U R' U'</code><small>Repeat 6 times and the cube returns to how it started.</small></div><button data-alg="R U R' U'">Try it</button></div><div class="alg"><div><b>Sledgehammer</b><code>R' F R F'</code><small>Also returns after 6 repeats.</small></div><button data-alg="R' F R F'">Try it</button></div><div class="alg"><div><b>Sune</b><code>R U R' U R U2 R'</code><small>Your first orientation algorithm.</small></div><button data-alg="R U R' U R U2 R'">Try it</button></div></div>`,
  ],
  [
    "meth",
    "Methods overview",
    `<div class="lesson"><p>Every method splits the solve into stages. More algorithms to learn means fewer moves per solve.</p><table><tr><th>Method</th><th>Steps</th><th>Algorithms</th></tr><tr><td><b>Beginner</b></td><td>First layer, orient last layer, permute last layer</td><td>About 4</td></tr><tr><td><b>Ortega</b></td><td>Build one face, OLL, then PBL</td><td>7 OLL and 5 PBL</td></tr><tr><td><b>CLL</b></td><td>First layer, then all last-layer corners in one algorithm</td><td>42</td></tr><tr><td><b>EG</b></td><td>Advanced: first layer with a built-in setup for even more algorithms</td><td>100+</td></tr></table><p>If you are new, learn the beginner idea quickly and then move to Ortega. It is the best balance of effort and speed.</p></div>`,
  ],
  [
    "ort",
    "Ortega method, step by step",
    `<div class="lesson"><p><b>Step 1: build a face.</b> Make one full face of one colour. You do not care about the other layer yet. Plan it in inspection and aim for about 8 moves.</p><p><b>Step 2: OLL.</b> Orient the last layer so the opposite face is also a single colour. Count how many top-layer corners already show the top colour: <b>0</b> = H or Pi, <b>1</b> = Sune or Anti-Sune, <b>2</b> = U, T or L.</p><p><b>Step 3: PBL.</b> Permute both layers together with one algorithm, then align the layers with U and D turns.</p><p><button data-go="algs" data-grp="Ortega" class="p">Open the Ortega algorithms</button></p></div>`,
  ],
  [
    "pbl",
    "PBL: recognizing the case",
    `<div class="lesson"><p>After OLL, look at <b>each layer separately</b> and find the <b>bars</b>: two corners next to each other with the same colour on one side.</p><table><tr><td><b>Bars on every side</b></td><td>That layer is solved</td></tr><tr><td><b>Exactly one bar</b></td><td>Adjacent swap</td></tr><tr><td><b>No bar at all</b></td><td>Diagonal swap</td></tr></table><p>Two layers with three possibilities each give the PBL cases. For adjacent swaps also note whether the two bars are on the same side, opposite sides or side by side. The Algorithms tab shows each case as a diagram of the top and bottom layer.</p></div>`,
  ],
  [
    "cll",
    "CLL: the next step",
    `<div class="lesson"><p>With CLL you build the first layer as normal, then solve all four last-layer corners with <b>one algorithm</b>, which skips the separate OLL and PBL stages.</p><p>There are 42 cases: Sune (6), Anti-Sune (6), U (6), T (6), L (6), Pi (6), H (4) and 2 cases where the corners are already oriented. Learn them one shape at a time, starting with Sune and Anti-Sune.</p><p><button data-go="algs" data-grp="CLL" class="p">Open the CLL algorithms</button></p></div>`,
  ],
  [
    "quiz",
    "Practice: name that OLL case",
    `<div class="lesson"><p>You will see a top-layer case. Pick its name. Run through this a few times a day until you recognize all 7 at a glance.</p><div id="qz"></div></div>`,
  ],
  [
    "tips",
    "Study tips and glossary",
    `<div class="lesson"><p><b>Tips.</b> Learn a few algorithms at a time and drill each one slowly 10 times before speeding up. Do a few real solves between drills. Check the Progress tab to see whether your average is really dropping.</p><table><tr><td><b>AUF / ADF</b></td><td>Adjust U face / D face: a turn to line a layer up</td></tr><tr><td><b>OLL</b></td><td>Orient last layer</td></tr><tr><td><b>PBL</b></td><td>Permute both layers</td></tr><tr><td><b>CLL</b></td><td>Corners of last layer, in one step</td></tr><tr><td><b>ao5 / ao12</b></td><td>Average of 5 or 12 solves, dropping best and worst</td></tr><tr><td><b>Inspection</b></td><td>The 15 seconds before a solve to plan your first moves</td></tr></table></div>`,
  ],
];
function drawQ() {
  const el = $("#qz");
  if (!el) return;
  const O = ALGS.filter((a) => a[0] === "OLL"),
    c = O[(Math.random() * O.length) | 0];
  el.innerHTML = `<div class="row">${svgFor(c[2])}</div><div class="row">${O.map((a) => `<button data-q="${a[1]}">${a[1]}</button>`).join("")}</div><div class="mut" style="text-align:center" id="qr">Score ${qs}/${qn}. Which case is this?</div>`;
  el.querySelectorAll("[data-q]").forEach(
    (b) =>
      (b.onclick = () => {
        qn++;
        const ok = b.dataset.q === c[1];
        if (ok) qs++;
        $("#qr").innerHTML =
          (ok ? "✅ Correct! " : "❌ It was <b>" + c[1] + "</b>. ") +
          "Score " +
          qs +
          "/" +
          qn;
        el.querySelectorAll("button").forEach((x) => (x.disabled = true));
        setTimeout(drawQ, 1500);
      }),
  );
}
function setDone(id) {
  const d = !!done[id],
    b = document.querySelector('[data-done="' + id + '"]'),
    t = $("#tk-" + id);
  if (b) b.textContent = d ? "✓ Completed (tap to undo)" : "Mark as done";
  if (t) t.textContent = d ? " ✅" : "";
  const n = LES.filter((l) => done[l[0]]).length;
  $("#sp").style.width = (n / LES.length) * 100 + "%";
  $("#sl").textContent = n + " of " + LES.length + " lessons done";
}
function drawStudy() {
  $("#lessons").innerHTML = LES.map(
    ([id, t, h], i) =>
      `<details class="card"><summary><b>${i + 1}. ${t}</b><span id="tk-${id}"></span></summary>${h}<div class="row" style="justify-content:flex-start"><button data-done="${id}" class="p"></button></div></details>`,
  ).join("");
  LES.forEach((l) => setDone(l[0]));
  drawPg();
  drawQ();
}
function drawHome() {
  const st = new Date();
  st.setHours(0, 0, 0, 0);
  const td = times.filter((e) => e.d >= st.getTime()).length,
    goal = ld("goal", 20),
    ds = new Set(times.map((e) => new Date(e.d).toDateString()));
  let sk = 0;
  const d = new Date(st);
  if (!ds.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (ds.has(d.toDateString())) {
    sk++;
    d.setDate(d.getDate() - 1);
  }
  const b = times.length ? Math.min(...times.map((e) => e.t)) : null,
    n = LES.filter((l) => done[l[0]]).length,
    nx = LES.find((l) => !done[l[0]]);
  $("#hs").innerHTML =
    `<div><span>Today</span><b>${td}/${goal}</b></div><div><span>Day streak</span><b>${sk} 🔥</b></div><div><span>Best</span><b>${b == null ? "–" : ms(b)}</b></div><div><span>Study</span><b>${n}/${LES.length}</b></div>`;
  $("#gb").style.width = Math.min(100, (td / goal) * 100) + "%";
  $("#nx").textContent = nx
    ? "Next lesson: " + nx[1]
    : "All lessons completed 🎉";
}
function go(t) {
  tab(t);
  const nb = document.querySelector("nav button.on");
  if (nb && nb.scrollIntoView)
    nb.scrollIntoView({ inline: "center", block: "nearest" });
  if (t === "prog") drawProg();
  if (t === "home") drawHome();
  scrollTo(0, 0);
}
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-alg],[data-go],[data-done]");
  if (!a) return;
  if (a.dataset.done) {
    const id = a.dataset.done;
    done[id] = !done[id];
    sv("done", done);
    setDone(id);
    return;
  }
  if (a.dataset.alg) {
    const p = $("#pg"),
      dt = p && p.closest("details");
    if (dt) dt.open = true;
    pgAlg(a.dataset.alg);
    return;
  }
  if (a.dataset.grp) {
    grp = a.dataset.grp;
    drawAlgs();
  }
  go(a.dataset.go);
});
const CP = [...new Set(ST.map((s) => s.p.join()))].map((s) =>
    s.split(",").map(Number),
  ),
  INN = [];
CP.forEach((p) =>
  [0, 1, 2].forEach((a) => {
    const n = [0, 0, 0];
    n[a] = -p[a];
    INN.push({ p, n, i: -1 });
  }),
);
const Q = {
  st: SOLVED,
  busy: false,
  q: [],
  moves: 0,
  run: 0,
  t0: 0,
  armed: false,
  hint: false,
  scr: "",
  rx: -28,
  ry: -38,
  tk: 0,
};
const solvedNow = (s) =>
  [0, 1, 2, 3, 4, 5].every((f) => new Set(s.slice(f * 4, f * 4 + 4)).size == 1);
const skT = (k) => {
  const [x, y, z] = k.p,
    [nx, ny, nz] = k.n,
    r = nx
      ? `rotateY(${nx * 90}deg)`
      : ny
        ? `rotateX(${ny > 0 ? 90 : -90}deg)`
        : nz < 0
          ? "rotateY(180deg)"
          : "";
  return `translate3d(${(x + nx) * 30}px,${-(y + ny) * 30}px,${(z + nz) * 30}px) ${r}`;
};
function cubeRender() {
  const c = $("#cu");
  c.innerHTML = "";
  [...ST.map((k, i) => ({ p: k.p, n: k.n, i })), ...INN].forEach((k) => {
    const e = document.createElement("div");
    e.className = "sk";
    e.style.background = k.i < 0 ? "#111" : COL[Q.st[k.i]];
    e.style.transform = skT(k);
    e._p = k.p;
    c.appendChild(e);
  });
}
function turn(m) {
  return new Promise((r) => {
    const a = (m / 3) | 0,
      k = m % 3,
      c = $("#cu"),
      g = document.createElement("div");
    g.className = "lg";
    c.appendChild(g);
    [...c.children].forEach((e) => {
      if (e !== g && IN[a](e._p)) g.appendChild(e);
    });
    const ang = [-90, 90, 90, 90, -90, -90][a] * [1, 2, -1][k];
    g.getBoundingClientRect();
    g.style.transition = "transform .2s ease-in-out";
    g.style.transform = `rotate${"YXZYXZ"[a]}(${ang}deg)`;
    setTimeout(() => {
      Q.st = ap(Q.st, m);
      cubeRender();
      r();
    }, 230);
  });
}
function stopT() {
  clearInterval(Q.tk);
  Q.run = 0;
}
function fin() {
  clearInterval(Q.tk);
  const t = Math.round(performance.now() - Q.t0);
  $("#ct").textContent = ms(t);
  Q.run = 0;
  Q.armed = false;
  if (Q.hint) return;
  times.push({ t, s: Q.scr, d: Date.now(), k: "3d" });
  render();
  cubeStats();
  toast("🎉 Solved in " + ms(t) + " · saved to Progress");
}
async function pump() {
  if (Q.busy) return;
  Q.busy = true;
  while (Q.q.length) {
    const [m, u] = Q.q.shift();
    if (u && Q.armed && !Q.run) {
      Q.run = 1;
      Q.t0 = performance.now();
      Q.tk = setInterval(
        () => ($("#ct").textContent = ms(performance.now() - Q.t0)),
        50,
      );
    }
    await turn(m);
    if (u) {
      Q.moves++;
      $("#cm").textContent = Q.moves + " moves";
      if (Q.run && solvedNow(Q.st)) fin();
    }
  }
  Q.busy = false;
}
const mvq = (m, u = true) => {
  if (u && Q.rel) m = vmap()[(m / 3) | 0] * 3 + (m % 3);
  Q.q.push([m, u]);
  pump();
};
const D2R = Math.PI / 180,
  mm = (A, B) =>
    A.map((r) =>
      [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]),
    );
const RX = (a) => {
    const c = Math.cos(a * D2R),
      s = Math.sin(a * D2R);
    return [
      [1, 0, 0],
      [0, c, -s],
      [0, s, c],
    ];
  },
  RY = (a) => {
    const c = Math.cos(a * D2R),
      s = Math.sin(a * D2R);
    return [
      [c, 0, s],
      [0, 1, 0],
      [-s, 0, c],
    ];
  };
const homeM = () => mm(RX(-28), RY(-38));
Q.M = homeM();
function orth() {
  let [a, b] = Q.M;
  const n = (v) => {
    const l = Math.hypot(...v);
    return v.map((x) => x / l);
  };
  a = n(a);
  const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  b = n(b.map((x, i) => x - d * a[i]));
  Q.M = [
    a,
    b,
    [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ],
  ];
}
function rotV(ax, ay) {
  Q.M = mm(mm(RX(ax), RY(ay)), Q.M);
  orth();
}
let sr = "all";
Q.rel = true;
function vmap(M = Q.M) {
  const fs = [
      [0, -1, 0],
      [1, 0, 0],
      [0, 0, 1],
      [0, 1, 0],
      [-1, 0, 0],
      [0, 0, -1],
    ],
    v = fs.map((n) =>
      [0, 1, 2].map((i) => M[i][0] * n[0] + M[i][1] * n[1] + M[i][2] * n[2]),
    ),
    op = [3, 4, 5, 0, 1, 2];
  let F = 0;
  v.forEach((x, i) => {
    if (x[2] > v[F][2]) F = i;
  });
  const r1 = [0, 1, 2, 3, 4, 5].filter((i) => i != F && i != op[F]);
  let T = r1[0];
  r1.forEach((i) => {
    if (v[i][1] < v[T][1]) T = i;
  });
  const r2 = r1.filter((i) => i != T && i != op[T]);
  let R = r2[0];
  r2.forEach((i) => {
    if (v[i][0] > v[R][0]) R = i;
  });
  return [T, R, F, op[T], op[R], op[F]];
}
const vw = () => {
  const M = Q.M;
  $("#rot").style.transform =
    `scale(1.5) matrix3d(${[M[0][0], M[1][0], M[2][0], 0, M[0][1], M[1][1], M[2][1], 0, M[0][2], M[1][2], M[2][2], 0, 0, 0, 0, 1].join(",")})`;
  const vm = vmap(),
    L6 = "URFDLB";
  $("#cview").textContent = Q.rel
    ? "Facing you: " +
      L6[vm[2]] +
      " · top: " +
      L6[vm[0]] +
      " · right: " +
      L6[vm[1]]
    : "Fixed moves: U is the original top, F the original front";
};
MV.forEach((m, i) => {
  const b = document.createElement("button");
  b.textContent = m;
  b.onclick = () => mvq(i);
  $("#cmv").appendChild(b);
});
$("#c-sc").onclick = () => {
  if (Q.busy) return;
  stopT();
  let a;
  do {
    a = rscr();
    Q.st = scrState(a);
  } while (solvedNow(Q.st));
  Q.scr = fmt(a);
  Q.moves = 0;
  Q.armed = true;
  Q.hint = false;
  $("#ct").textContent = "0.00";
  $("#cm").textContent = "0 moves";
  $("#csc").textContent = "Scramble: " + Q.scr;
  $("#cso").textContent = "";
  cubeRender();
};
$("#c-rs").onclick = () => {
  if (Q.busy) return;
  stopT();
  Q.st = SOLVED;
  Q.armed = false;
  Q.moves = 0;
  $("#ct").textContent = "0.00";
  $("#cm").textContent = "0 moves";
  $("#csc").textContent = "";
  $("#cso").textContent = "";
  cubeRender();
};
$("#c-so").onclick = () => {
  const r = solve(Q.st),
    o = $("#cso");
  if (!r) {
    o.textContent = "Could not solve this state.";
    return;
  }
  stopT();
  Q.armed = false;
  Q.hint = true;
  o.textContent = r.length
    ? "Solution: " + fmt(r) + " (" + r.length + " moves)"
    : "Already solved!";
};
$("#c-pl").onclick = () => {
  const r = solve(Q.st) || [];
  if (r.length) {
    stopT();
    Q.armed = false;
    Q.hint = true;
    r.forEach((m) => mvq(m, false));
  }
};
const stg = $("#stage");
let dr = null;
stg.onpointerdown = (e) => {
  dr = [e.clientX, e.clientY];
  stg.setPointerCapture(e.pointerId);
};
stg.onpointermove = (e) => {
  if (!dr) return;
  rotV(-(e.clientY - dr[1]) * 0.6, (e.clientX - dr[0]) * 0.6);
  dr = [e.clientX, e.clientY];
  vw();
};
stg.onpointerup = stg.onpointercancel = () => (dr = null);
addEventListener("keydown", (e) => {
  if (
    !$("#cube3d").classList.contains("on") ||
    e.ctrlKey ||
    e.metaKey ||
    e.altKey
  )
    return;
  const a = "urfdlb".indexOf(e.key.toLowerCase());
  if (a >= 0) mvq(a * 3 + (e.shiftKey ? 2 : 0));
});
function cubeStats() {
  const x = times.filter((e) => e.k === "3d");
  $("#c3").textContent = x.length
    ? "3D cube: " +
      x.length +
      " solves · best " +
      ms(Math.min(...x.map((e) => e.t))) +
      (x.length >= 5 ? " · ao5 " + ms(avg(x, 5)) : "")
    : "No 3D cube solves saved yet.";
}
$("#c-vw").onclick = () => {
  Q.M = homeM();
  vw();
};
$("#c-rel").onchange = (e) => {
  Q.rel = e.target.checked;
  vw();
};
function ortho(M) {
  let [a, b] = M;
  const n = (v) => {
    const l = Math.hypot(...v);
    return v.map((x) => x / l);
  };
  a = n(a);
  const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  b = n(b.map((x, i) => x - d * a[i]));
  return [a, b, [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]];
}
function mini3d(h) {
  h.innerHTML =
    '<div class="st3"><div class="rot3"><div class="cu3"></div></div></div><div class="row"></div><label class="mut" style="display:flex;gap:6px;justify-content:center;align-items:center;margin-top:6px"><input type="checkbox" checked> Moves follow the side you face</label><div class="mut" style="text-align:center"></div>';
  const S = { st: SOLVED, M: homeM(), q: [], hist: [], busy: false, rel: true, dr: null },
    cu = h.querySelector(".cu3"),
    rot = h.querySelector(".rot3"),
    stg = h.querySelector(".st3"),
    row = h.querySelector(".row"),
    info = h.querySelector(".mut:last-child");
  const vw = () => {
    const M = S.M;
    rot.style.transform = `scale(1.3) matrix3d(${[M[0][0], M[1][0], M[2][0], 0, M[0][1], M[1][1], M[2][1], 0, M[0][2], M[1][2], M[2][2], 0, 0, 0, 0, 1].join(",")})`;
  };
  const render = () => {
    cu.innerHTML = "";
    [...ST.map((k, i) => ({ p: k.p, n: k.n, i })), ...INN].forEach((k) => {
      const e = document.createElement("div");
      e.className = "sk";
      e.style.background = k.i < 0 ? "#111" : COL[S.st[k.i]];
      e.style.transform = skT(k);
      e._p = k.p;
      cu.appendChild(e);
    });
  };
  const note = () => {
    info.textContent = S.hist.length ? S.hist.map((i) => MV[i]).join(" ") : "Drag to rotate, then tap a move.";
  };
  const turn = (m) =>
    new Promise((r) => {
      const a = (m / 3) | 0,
        k = m % 3,
        g = document.createElement("div");
      g.className = "lg";
      cu.appendChild(g);
      [...cu.children].forEach((e) => {
        if (e !== g && IN[a](e._p)) g.appendChild(e);
      });
      const ang = [-90, 90, 90, 90, -90, -90][a] * [1, 2, -1][k];
      g.getBoundingClientRect();
      g.style.transition = "transform .2s ease-in-out";
      g.style.transform = `rotate${"YXZYXZ"[a]}(${ang}deg)`;
      setTimeout(() => {
        S.st = ap(S.st, m);
        render();
        r();
      }, 230);
    });
  async function pump() {
    if (S.busy) return;
    S.busy = true;
    while (S.q.length) {
      const [m, rec] = S.q.shift();
      await turn(m);
      if (rec === 1) S.hist.push(m);
      else if (rec === 2) S.hist.pop();
      note();
    }
    S.busy = false;
  }
  const add = (m) => {
    if (S.rel) m = vmap(S.M)[(m / 3) | 0] * 3 + (m % 3);
    S.q.push([m, 1]);
    pump();
  };
  const btn = (t, f) => {
    const b = document.createElement("button");
    b.textContent = t;
    b.onclick = f;
    row.appendChild(b);
  };
  MV.forEach((m, i) => btn(m, () => add(i)));
  btn("↶ Undo", () => {
    if (S.hist.length && !S.busy) {
      S.q.push([inv(S.hist[S.hist.length - 1]), 2]);
      pump();
    }
  });
  btn("Reset", () => {
    if (!S.busy) {
      S.st = SOLVED;
      S.hist = [];
      render();
      note();
    }
  });
  btn("Reset view", () => {
    S.M = homeM();
    vw();
  });
  h.querySelector("input").onchange = (e) => {
    S.rel = e.target.checked;
  };
  stg.onpointerdown = (e) => {
    S.dr = [e.clientX, e.clientY];
    stg.setPointerCapture(e.pointerId);
  };
  stg.onpointermove = (e) => {
    if (!S.dr) return;
    S.M = ortho(mm(mm(RX(-(e.clientY - S.dr[1]) * 0.6), RY((e.clientX - S.dr[0]) * 0.6)), S.M));
    S.dr = [e.clientX, e.clientY];
    vw();
  };
  stg.onpointerup = stg.onpointercancel = () => (S.dr = null);
  render();
  vw();
  note();
  return {
    alg: (a) => {
      if (S.busy) return;
      S.q = [];
      S.st = SOLVED;
      S.hist = [];
      render();
      note();
      a.split(" ").forEach((t) => {
        const i = MV.indexOf(t);
        if (i >= 0) S.q.push([i, 1]);
      });
      pump();
    },
  };
}
let P3 = null;
function drawPg() {
  const h = $("#pg");
  if (h) P3 = mini3d(h);
}
function pgAlg(a) {
  if (P3) {
    P3.alg(a);
    $("#pg").scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
cubeStats();
cubeRender();
vw();
addEventListener("pointerdown", (e) => {
  if (state === "run" && !e.target.closest("#tm")) stopped = press();
});
$("#tm").addEventListener("contextmenu", (e) => e.preventDefault());
$("#hm").onclick = () => go("home");
$("#gm").onclick = () => {
  sv("goal", Math.max(5, ld("goal", 20) - 5));
  drawHome();
};
$("#gp").onclick = () => {
  sv("goal", ld("goal", 20) + 5);
  drawHome();
};
// ---------- solver: 3D cube tab ----------
const SV = { M: homeM(), busy: false, dr: null };
SV.cu = $("#sv-cu");
SV.rot = $("#sv-rot");
SV.stg = $("#sv-st");
function svView() {
  const M = SV.M;
  SV.rot.style.transform = `scale(1.3) matrix3d(${[M[0][0], M[1][0], M[2][0], 0, M[0][1], M[1][1], M[2][1], 0, M[0][2], M[1][2], M[2][2], 0, 0, 0, 0, 1].join(",")})`;
}
function svRender() {
  SV.cu.innerHTML = "";
  [...ST.map((k, i) => ({ p: k.p, n: k.n, i })), ...INN].forEach((k) => {
    const e = document.createElement("div");
    e.className = "sk";
    e.style.background = k.i < 0 ? "#111" : COL[net[k.i]];
    e.style.transform = skT(k);
    e._p = k.p;
    SV.cu.appendChild(e);
  });
}
function svLock(on) {
  SV.busy = on;
  ["go", "bl", "rs", "rn", "go2", "bl2", "rs2", "rn2", "pl2"].forEach(
    (id) => ($("#" + id).disabled = on),
  );
}
function svTurn(m) {
  return new Promise((r) => {
    const a = (m / 3) | 0,
      k = m % 3,
      cu = SV.cu,
      g = document.createElement("div");
    g.className = "lg";
    cu.appendChild(g);
    [...cu.children].forEach((e) => {
      if (e !== g && IN[a](e._p)) g.appendChild(e);
    });
    const ang = [-90, 90, 90, 90, -90, -90][a] * [1, 2, -1][k];
    g.getBoundingClientRect();
    g.style.transition = "transform .35s ease-in-out";
    g.style.transform = `rotate${"YXZYXZ"[a]}(${ang}deg)`;
    setTimeout(() => {
      net = ap(net, m);
      drawNet();
      r();
    }, 400);
  });
}
$("#go2").onclick = () => $("#go").onclick();
$("#bl2").onclick = () => {
  $("#bl").onclick();
  $("#sv-i").textContent = "";
};
$("#rs2").onclick = () => {
  $("#rs").onclick();
  $("#sv-i").textContent = "";
};
$("#rn2").onclick = () => {
  $("#rn").onclick();
  $("#sv-i").textContent = "";
};
$("#vw2").onclick = () => {
  SV.M = homeM();
  svView();
};
$("#pl2").onclick = async () => {
  if (SV.busy) return;
  const o = $("#out"),
    info = $("#sv-i");
  if (net.includes("-")) {
    o.className = "err";
    o.textContent =
      "Fill in every sticker first (" +
      (net.split("-").length - 1) +
      " still blank).";
    info.textContent = "Fill every sticker in the Enter colours tab first.";
    return;
  }
  const r = solve(net);
  if (!r) {
    o.className = "err";
    o.textContent =
      "No solution found. Check the colors: each color must appear 4 times and the cube must be a legal 2x2 (no single twisted corner or swapped pair).";
    info.textContent = "This cube can't be solved. Check the colours.";
    return;
  }
  if (!r.length) {
    o.className = "";
    o.textContent = "Already solved! 🎉";
    info.textContent = "Already solved! 🎉";
    return;
  }
  o.className = "";
  o.textContent = fmt(r) + "   (" + r.length + " moves)";
  $("#cs").hidden = false;
  svLock(true);
  for (let i = 0; i < r.length; i++) {
    info.textContent = "Move " + (i + 1) + "/" + r.length + ": " + MV[r[i]];
    await svTurn(r[i]);
  }
  info.textContent = "Solved! 🎉";
  svLock(false);
};
SV.stg.onpointerdown = (e) => {
  SV.dr = [e.clientX, e.clientY];
  SV.stg.setPointerCapture(e.pointerId);
};
SV.stg.onpointermove = (e) => {
  if (!SV.dr) return;
  SV.M = ortho(
    mm(mm(RX(-(e.clientY - SV.dr[1]) * 0.6), RY((e.clientX - SV.dr[0]) * 0.6)), SV.M),
  );
  SV.dr = [e.clientX, e.clientY];
  svView();
};
SV.stg.onpointerup = SV.stg.onpointercancel = () => (SV.dr = null);
function svTab(t) {
  document
    .querySelectorAll("#svt button")
    .forEach((x) => x.classList.toggle("on", x.dataset.sv === t));
  $("#sv-a").hidden = t !== "a";
  $("#sv-b").hidden = t !== "b";
}
document
  .querySelectorAll("#svt button")
  .forEach((b) => (b.onclick = () => svTab(b.dataset.sv)));
$("#to3d").onclick = () => {
  svTab("b");
  SV.stg.scrollIntoView({ behavior: "smooth", block: "center" });
};
$("#toc").onclick = () => {
  svTab("a");
  $("#sv-a").scrollIntoView({ behavior: "smooth", block: "start" });
};
svView();
newScr();
render();
drawPal();
drawNet();
drawAlgs();
drawStudy();
drawHome();