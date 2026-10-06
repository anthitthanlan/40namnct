/**
 * NCT logo breakdown - motion on scroll.
 * Direct port of nct-motion/render.py (numpy/cv2) to Canvas 2D, driven by GSAP ScrollTrigger.
 *
 *   import { createNctMotion } from "./nct-motion.js";
 *   const m = await createNctMotion(document.querySelector("#nct"), { gsap, ScrollTrigger });
 *   m.destroy();
 *
 * The scene is a pure function of time t (0..15s). Scroll progress -> t.
 */

const W = 1920, H = 1080, DUR = 15;
const DEG = Math.PI / 180;

// ------------------------------------------------------------------ easing
const cl = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const seg = (t, a, b) => cl((t - a) / (b - a));
const oc = (x) => 1 - (1 - x) ** 3;
const oq = (x) => 1 - (1 - x) ** 5;
const oe = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x));
const ic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const ob = (x, s = 1.9) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2;
const lerp = (a, b, t) => a + (b - a) * t;
const mod = (a, n) => ((a % n) + n) % n;

function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ palette / timeline
const WHITE = [1, 1, 1], GREEN = [0.0, 0.78, 0.4], GOLD = [1.0, 0.9, 0.12];
const BLUE = [0.3, 0.58, 1.0], FIRE = [1.0, 0.44, 0.14];
const C = (c, a = 1) => `rgba(${(c[0] * 255) | 0},${(c[1] * 255) | 0},${(c[2] * 255) | 0},${cl(a)})`;

const B = [2.9, 4.9, 6.9, 8.9, 10.9];
const SC_DUR = 2.0;
const SCENES = [
  {
    key: "laurel", idx: 1, acc: GREEN, title: ["HAI CÀNH", "NGUYỆT QUẾ"],
    body: ["Sự vinh danh những thành tựu rực rỡ, gợi nhắc đến", "sự chở che của mái trường như một ngôi nhà thứ hai."], ghost: "LAUREL"
  },
  {
    key: "book", idx: 2, acc: GOLD, title: ["TRANG SÁCH", "RỘNG MỞ"],
    body: ["Một bệ đỡ vững chắc cho tượng đài tri thức phía trên,", "nơi học sinh mượn làm bệ phóng tới những chân trời mới."], ghost: "KNOWLEDGE"
  },
  {
    key: "hand", idx: 3, acc: BLUE, title: ["BÀN TAY", "CẦM ĐUỐC"],
    body: ["Sự tiếp nối ngọn lửa tri thức không ngừng lớn mạnh,", "được các lứa học trò trân trọng thắp sáng và trao đi."], ghost: "PASS THE LIGHT"
  },
  {
    key: "flame", idx: 4, acc: FIRE, title: ["NGỌN ĐUỐC", "N-C-T"],
    body: ["Ngọn lửa bền bỉ trao truyền qua bao thế hệ học sinh", "như một ngọn đuốc soi đường trên hành trình vươn xa."], ghost: "N·C·T"
  },
];
const SLAB_COL = [GREEN, GOLD, BLUE, FIRE, [1, 1, 1]];
const SLAB_TXT = ["01", "02", "03", "04", "NCT"];
const HITS = [[0.85, 0.55], [1.5, 1.0], ...B.slice(0, 4).map((b) => [b, 0.55]),
[11.5, 0.35], [11.78, 0.35], [12.02, 0.45], [12.26, 0.45], [12.55, 1.25]];
const RINGS = [[0.85, GOLD, 900, 0.9], [1.5, WHITE, 1500, 1.2], [12.55, GOLD, 1700, 1.3], [12.58, WHITE, 1000, 0.9]];
const BURSTS = [[1.5, GOLD, 90, 7, 1700], [12.55, GOLD, 120, 11, 1900], [12.55, WHITE, 60, 3, 1100]];

const META = {
  book: { x: 27, y: 1096, w: 1744, h: 617 },
  handtorch: { x: 757, y: 622, w: 410, h: 618 },
  flame: { x: 737, y: 330, w: 364, h: 282 },
  laurelL: { x: 329, y: 485, w: 371, h: 658 },
  laurelR: { x: 1108, y: 485, w: 372, h: 659 },
  base: { x: 0, y: 0, w: 1798, h: 1798 },
};
const CEN = (1798 - 1) / 2;
const LOGO_C = [960, 520];
const G_LOGO = 0.445;
const G_END_FINAL = 0.5, FINAL_X = 600;
const EXPL = {
  laurelL: [[-780, -60], -14, 1.0], laurelR: [[780, -60], 14, 1.0],
  flame: [[0, -420], 0, 1.0], book: [[0, 560], 0, 1.0], handtorch: [[0, 40], 0, 1.0],
};
const ORDER = ["laurelL", "laurelR", "handtorch", "book", "flame"];

const hitVal = (t) => {
  let v = 0;
  for (const [ht, s] of HITS) if (t >= ht) v += s * Math.exp(-(t - ht) * 9.0);
  return v;
};

// ------------------------------------------------------------------ helpers
const mkCanvas = (w, h) => {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
};
const loadImg = (src) => new Promise((res, rej) => {
  const i = new Image();
  i.onload = () => res(i);
  i.onerror = rej;
  i.src = src;
});

function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length);
  const n = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    let s = 0;
    const o = y * w;
    for (let x = -r; x <= r; x++) s += src[o + cl(x, 0, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[o + x] = s / n;
      s += src[o + Math.min(x + r + 1, w - 1)] - src[o + Math.max(x - r, 0)];
    }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += tmp[cl(y, 0, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = s / n;
      s += tmp[Math.min(y + r + 1, h - 1) * w + x] - tmp[Math.max(y - r, 0) * w + x];
    }
  }
  return out;
}

// ================================================================== main
export async function createNctMotion(root, opts = {}) {
  const gsap = opts.gsap || window.gsap;
  const ScrollTrigger = opts.ScrollTrigger || window.ScrollTrigger;
  const base = (opts.assetBase || "./assets").replace(/\/$/, "");
  const scrollPerSecond = opts.scrollPerSecond ?? 600; // px of scroll per 1s of motion
  if (!gsap || !ScrollTrigger) throw new Error("GSAP + ScrollTrigger required");
  gsap.registerPlugin(ScrollTrigger);

  // ---- DOM
  root.classList.add("nct-scroll");
  root.style.height = `calc(100vh + ${DUR * scrollPerSecond}px)`;
  const stage = document.createElement("div");
  stage.className = "nct-stage";
  const Q = Math.min(1, opts.quality ?? 0.75); // internal resolution scale (lower = faster)
  const canvas = mkCanvas(Math.round(W * Q), Math.round(H * Q));
  canvas.className = "nct-canvas";
  stage.appendChild(canvas);
  const vig = document.createElement("div");
  vig.style.cssText = "position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 38%,rgba(0,0,0,.38) 100%)";
  stage.appendChild(vig);
  root.appendChild(stage);
  const ctx = canvas.getContext("2d", { alpha: false });

  // ---- fonts
  const faces = [["400", "Regular"], ["700", "Bold"], ["900", "Black"]].map(([w, n]) =>
    new FontFace("NCTSans", `url(${base}/fonts/GoogleSans-${n}.ttf)`, { weight: w }));
  await Promise.all(faces.map((f) => f.load().then((ff) => document.fonts.add(ff))));

  // ---- sprites
  const spr = {};
  await Promise.all(Object.keys(META).map(async (k) => {
    const m = META[k];
    const img = await loadImg(`${base}/pieces/${k}.png`);
    // mip levels so small renders don't resample the full-res PNG every frame
    const levels = [{ f: 1, img, w: m.w, h: m.h }];
    let prev = img, pw = m.w, ph = m.h;
    for (const f of [0.5, 0.25]) {
      const lw = Math.max(2, Math.round(m.w * f)), lh = Math.max(2, Math.round(m.h * f));
      const c = mkCanvas(lw, lh);
      c.getContext("2d").drawImage(prev, 0, 0, pw, ph, 0, 0, lw, lh);
      levels.push({ f, img: c, w: lw, h: lh });
      prev = c; pw = lw; ph = lh;
    }
    spr[k] = {
      img, levels, w: m.w, h: m.h,
      rx: m.x - CEN, ry: m.y - CEN, cx: m.x + m.w / 2 - CEN, cy: m.y + m.h / 2 - CEN, m
    };
  }));

  // soft blobs (cached per colour)
  const blobCache = {};
  function blobSprite(color) {
    const key = C(color);
    if (!blobCache[key]) {
      const c = mkCanvas(256, 256), x = c.getContext("2d");
      const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
      for (let i = 0; i <= 8; i++) { const v = i / 8; g.addColorStop(v, C(color, Math.exp(-4 * v * v))); }
      x.fillStyle = g; x.fillRect(0, 0, 256, 256);
      blobCache[key] = c;
    }
    return blobCache[key];
  }

  // ghost text strips (cached at half res)
  const ghostCache = {};

  // glow masks (blurred alpha @ 1/4 res), tinted lazily
  const glowMask = {}, glowTint = {};
  function getGlow(k, color) {
    if (!glowMask[k]) {
      const s = spr[k], pad = 40;
      const sw = Math.ceil(s.w / 4) + 2 * pad, sh = Math.ceil(s.h / 4) + 2 * pad;
      const c = mkCanvas(sw, sh), x = c.getContext("2d");
      x.drawImage(s.img, pad, pad, s.w / 4, s.h / 4);
      const d = x.getImageData(0, 0, sw, sh).data;
      let a = new Float32Array(sw * sh);
      for (let i = 0; i < a.length; i++) a[i] = d[i * 4 + 3] / 255;
      for (let p = 0; p < 3; p++) a = boxBlur(a, sw, sh, 11);
      let mx = 1e-3;
      for (let i = 0; i < a.length; i++) if (a[i] > mx) mx = a[i];
      const out = x.createImageData(sw, sh);
      for (let i = 0; i < a.length; i++) {
        out.data[i * 4] = out.data[i * 4 + 1] = out.data[i * 4 + 2] = 255;
        out.data[i * 4 + 3] = Math.min(255, (a[i] / mx) * 255);
      }
      x.putImageData(out, 0, 0);
      glowMask[k] = { c, w: sw * 4, h: sh * 4, rx: s.m.x - pad * 4 - CEN, ry: s.m.y - pad * 4 - CEN, sw, sh };
    }
    const key = k + C(color);
    if (!glowTint[key]) {
      const g = glowMask[k], c = mkCanvas(g.sw, g.sh), x = c.getContext("2d");
      x.fillStyle = C(color); x.fillRect(0, 0, g.sw, g.sh);
      x.globalCompositeOperation = "destination-in"; x.drawImage(g.c, 0, 0);
      glowTint[key] = c;
    }
    return [glowMask[k], glowTint[key]];
  }

  // dot sprites
  const dotCache = {};
  function dotSprite(color) {
    const key = C(color);
    if (!dotCache[key]) {
      const c = mkCanvas(64, 64), x = c.getContext("2d");
      const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, C(color, (1 - i / 8) ** 1.6));
      x.fillStyle = g; x.fillRect(0, 0, 64, 64);
      dotCache[key] = c;
    }
    return dotCache[key];
  }

  // stripe pattern for slabs
  const stripeC = mkCanvas(64, 64);
  {
    const x = stripeC.getContext("2d");
    x.fillStyle = "rgba(0,0,0,0.17)";
    for (let k = -1; k < 3; k++) {
      x.beginPath(); x.moveTo(k * 64, 0); x.lineTo(k * 64 + 12, 0);
      x.lineTo(k * 64 - 52, 64); x.lineTo(k * 64 - 64, 64); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(k * 64 + 64, 0); x.lineTo(k * 64 + 76, 0);
      x.lineTo(k * 64 + 12, 64); x.lineTo(k * 64, 64); x.closePath(); x.fill();
    }
  }
  const stripePat = ctx.createPattern(stripeC, "repeat");

  const tmp = mkCanvas(1800, 1800), tx = tmp.getContext("2d");

  // deterministic randoms
  const R3 = rng(3), N = 110;
  const mkArr = (f) => Array.from({ length: N }, () => f(R3()));
  const PT = {
    x: mkArr((r) => r * W), y: mkArr((r) => r * H), v: mkArr((r) => 20 + r * 60),
    r: mkArr((r) => 1 + r * 3.2), ph: mkArr((r) => r * 6.28), amp: mkArr((r) => 10 + r * 40), z: mkArr((r) => r)
  };
  const BURST = BURSTS.map(([, , n, seed]) => {
    const r = rng(seed);
    const ang = Array.from({ length: n }, () => r() * 6.283);
    const sp = Array.from({ length: n }, () => 0.3 + r());
    const sz = Array.from({ length: n }, () => r());
    return { ang, sp, sz };
  });
  const EMB = (() => {
    const r = rng(21);
    return Array.from({ length: 70 }, () => ({ ph: r() * 3, life: 1.6 + r(), ox: r() - 0.5, hh: r(), sz: r() }));
  })();

  // ---------------------------------------------------------------- text
  const advCache = {};
  const adv = (ch, f, size) => {
    const k = f + size + ch;
    if (advCache[k] === undefined) {
      ctx.font = `${f} ${size}px NCTSans, sans-serif`;
      advCache[k] = ctx.measureText(ch).width;
    }
    return advCache[k];
  };
  const chars = (s) => Array.from(s.normalize("NFC"));
  const textW = (text, f, size, track = 0) =>
    chars(text).reduce((a, c) => a + adv(c, f, size) + track, 0) - track;
  const fit = (text, f, size, maxw, track = 0) => {
    while (textW(text, f, size, track) > maxw && size > 10) size -= 2;
    return size;
  };
  const F_BLACK = 900, F_BOLD = 700, F_REG = 400;
  const setF = (f, size) => { ctx.font = `${f} ${size}px NCTSans, sans-serif`; ctx.textBaseline = "alphabetic"; };

  function kinetic(text, f, size, x, baseY, t, tin, tout, color, st = 0.04, dur = 0.6, track = 0, alpha = 1) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, baseY - size * 1.35, W, size * 1.7); ctx.clip();
    setF(f, size);
    let xx = x;
    chars(text).forEach((ch, i) => {
      const a = adv(ch, f, size) + track;
      if (ch !== " ") {
        const pin = oe(seg(t, tin + i * st, tin + i * st + dur));
        const pout = tout !== null ? ic(seg(t, tout + i * st * 0.6, tout + i * st * 0.6 + 0.32)) : 0;
        if (pin > 0 && pout < 1) {
          const dy = (1 - pin) * size * 1.2 - pout * size * 1.3;
          ctx.fillStyle = C(color, alpha * Math.min(1, pin * 5) * (1 - pout));
          ctx.fillText(ch, xx, baseY + dy);
        }
      }
      xx += a;
    });
    ctx.restore();
  }

  function wipeLine(text, f, size, x, baseY, t, tin, tout, color, alpha = 1, dx = 60, track = 0) {
    const tw = textW(text, f, size, track);
    const pin = oe(seg(t, tin, tin + 0.7));
    const pout = tout !== null ? ic(seg(t, tout, tout + 0.3)) : 0;
    if (pin <= 0 || pout >= 1) return;
    let cur = x + (1 - pin) * dx * -1 - pout * 80;
    const vis = x - dx + (tw + dx * 2) * pin;
    setF(f, size);
    for (const ch of chars(text)) {
      const a = adv(ch, f, size) + track;
      if (ch !== " " && cur < vis) {
        ctx.fillStyle = C(color, alpha * cl((vis - cur) / 40) * (1 - pout));
        ctx.fillText(ch, cur, baseY);
      }
      cur += a;
    }
  }

  function drawGhost(word, t, y, a, speed = 90, size = 380) {
    const key = word + size;
    let g = ghostCache[key];
    if (!g) {
      const unit = word + "   ";
      const per = textW(unit, F_BLACK, size);
      const hs = 0.5, pad = 8;
      const c = mkCanvas(Math.ceil(per * hs) + 2 * pad, Math.ceil(size * 1.25 * hs));
      const x = c.getContext("2d");
      x.scale(hs, hs);
      x.font = `900 ${size}px NCTSans, sans-serif`;
      x.strokeStyle = "#fff"; x.lineWidth = 4; x.lineJoin = "round";
      x.strokeText(unit, pad / hs, 10 + size * 0.93);
      g = ghostCache[key] = { c, per, pad, hs };
    }
    const off = -mod(t * speed, g.per);
    ctx.save();
    ctx.globalAlpha = cl(a);
    for (let x = off; x < W; x += g.per)
      ctx.drawImage(g.c, x - g.pad / g.hs, y, g.c.width / g.hs, g.c.height / g.hs);
    ctx.restore();
  }

  // ---------------------------------------------------------------- primitives
  function drawSprite(src, sw, sh, rx, ry, rw, rh, pivotDef, G, o, additive, extra) {
    const alpha = o.alpha ?? 1;
    if (alpha <= 0.002) return;
    const [gx, gy, gs, grot] = G;
    const disp = o.disp || [0, 0], rot = o.rot || 0, sc = o.sc || [1, 1], pv = o.pivot || pivotDef;
    let img = src;
    if (o.reveal != null || o.shine || (o.flash || 0) > 0) {
      const f = sw / rw; // src px per logical px
      tx.setTransform(1, 0, 0, 1, 0, 0);
      tx.globalAlpha = 1; tx.globalCompositeOperation = "source-over";
      tx.clearRect(0, 0, sw, sh);
      tx.setTransform(f, 0, 0, f, 0, 0);
      tx.drawImage(src, 0, 0, rw, rh);
      if (o.reveal != null) {
        const f0 = 1 - o.reveal * 1.18, f1 = f0 + 0.18;
        const g = tx.createLinearGradient(0, f0 * rh, 0, f1 * rh);
        g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,1)");
        tx.globalCompositeOperation = "destination-in";
        tx.fillStyle = g; tx.fillRect(0, 0, rw, rh);
      }
      tx.globalCompositeOperation = "source-atop";
      if (o.shine && extra) {
        const [pos, wd, st] = o.shine;
        const off = extra.rx + 0.55 * extra.ry;
        const x0 = pos - 3 * wd - off, K = (6 * wd) / 1.3025;
        const g = tx.createLinearGradient(x0, 0, x0 + K, 0.55 * K);
        for (let i = -6; i <= 6; i++) {
          const xv = i / 2;
          g.addColorStop(0.5 + xv / 6, `rgba(255,255,255,${cl(Math.exp(-xv * xv) * st)})`);
        }
        tx.fillStyle = g; tx.fillRect(0, 0, rw, rh);
      }
      if ((o.flash || 0) > 0) {
        tx.fillStyle = `rgba(255,255,255,${cl(o.flash)})`; tx.fillRect(0, 0, rw, rh);
      }
      tx.globalCompositeOperation = "source-over";
      img = tmp;
    }
    ctx.save();
    if (additive) ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = cl(alpha);
    ctx.translate(gx, gy); ctx.rotate(grot * DEG); ctx.scale(gs, gs);
    ctx.translate(pv[0] + disp[0], pv[1] + disp[1]); ctx.rotate(rot * DEG); ctx.scale(sc[0], sc[1]);
    ctx.translate(-pv[0], -pv[1]);
    ctx.drawImage(img, 0, 0, sw, sh, rx, ry, rw, rh);
    ctx.restore();
  }

  function drawPiece(k, G, o = {}) {
    const s = spr[k];
    const sc = o.sc || [1, 1];
    const eff = G[2] * Q * Math.max(Math.abs(sc[0]), Math.abs(sc[1]), 0.05);
    let lv = s.levels[0];
    for (const l of s.levels) if (l.f >= eff * 1.1) lv = l;
    drawSprite(lv.img, lv.w, lv.h, s.rx, s.ry, s.w, s.h, [s.cx, s.cy], G, o, false, { rx: s.rx, ry: s.ry });
  }
  function drawGlow(k, G, color, strength, o = {}) {
    if (strength <= 0.01) return;
    const s = spr[k];
    const [g, tint] = getGlow(k, color);
    let rest = strength;
    while (rest > 0.01) {
      drawSprite(tint, g.sw, g.sh, g.rx, g.ry, g.w, g.h, [s.cx, s.cy], G, { ...o, alpha: Math.min(1, rest), shine: null, flash: 0 }, true);
      rest -= 1;
    }
  }
  function addBlob(cx, cy, r, color, strength) {
    if (r < 2 || strength <= 0.003) return;
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = cl(strength);
    ctx.drawImage(blobSprite(color), cx - r, cy - r, r * 2, r * 2);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  }
  function addDot(x, y, r, color, a) {
    if (a <= 0.01 || r < 0.5) return;
    const d = Math.max(3, r * 2 + 1);
    ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = cl(a);
    ctx.drawImage(dotSprite(color), x - d / 2, y - d / 2, d, d);
    ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
  }
  function ring(cx, cy, r, th, color, a) {
    if (a <= 0.01 || r < 2) return;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = C(color, a); ctx.lineWidth = Math.max(1, th);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  }
  const fillRect = (x, y, w, h, color, a = 1, add = false) => {
    if (w <= 0 || h <= 0) return;
    ctx.save(); if (add) ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = C(color, a); ctx.fillRect(x, y, w, h); ctx.restore();
  };

  function particles(t, accent, boost = 1, rise = 1) {
    const col = GOLD.map((g, i) => lerp(g, accent[i], 0.55));
    for (let i = 0; i < N; i++) {
      const y = mod(PT.y[i] - PT.v[i] * t * rise * (0.5 + PT.z[i]), H + 40) - 20;
      const x = PT.x[i] + Math.sin(t * 0.9 + PT.ph[i]) * PT.amp[i];
      const tw = 0.55 + 0.45 * Math.sin(t * 3 + PT.ph[i] * 3);
      addDot(x, y, PT.r[i] * (1 + 0.6 * PT.z[i]), col, 0.55 * tw * boost);
    }
  }

  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, "rgb(7,14,37)"); bgGrad.addColorStop(1, "rgb(3,5,11)");
  function background(t, accent, glowPos, glow = 0.35, grid = true) {
    ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, W, H);
    if (glowPos) { addBlob(glowPos[0], glowPos[1], 760, accent, glow); addBlob(glowPos[0], glowPos[1], 380, accent, glow * 0.7); }
    if (grid) {
      const off = (t * 14) % 90;
      ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = "rgba(255,255,255,0.022)";
      for (let x = Math.trunc(-off); x < W; x += 90) if (x >= 0) ctx.fillRect(x, 0, 1, H);
      for (let y = Math.trunc(off * 0.5); y < H; y += 90) ctx.fillRect(0, y, W, 1);
      ctx.restore();
    }
  }

  function hud(t, acc) {
    wipeLine("NCT  ·  LOGO BREAKDOWN", F_BOLD, 22, 72, 84, t, 0.2, null, [0.85, 0.9, 1.0], 0.8, 60, 5);
    fillRect(72, 58, 8, 8, acc);
    const pr = t / DUR;
    fillRect(72, 1034, W - 144, 2, WHITE, 0.12, true);
    const xEnd = 72 + (W - 144) * pr;
    fillRect(72, 1033, xEnd - 72, 4, acc);
    for (const b of B.slice(0, 4)) fillRect(72 + ((W - 144) * b) / DUR, 1026, 2, 18, WHITE, 0.35, true);
    addDot(xEnd, 1035, 14, acc, 0.9);
  }

  function miniLogo(t, keys, acc, cx, cy, gs, a) {
    const G = [cx, cy, gs, 0];
    drawPiece("base", G, { alpha: 0.9 * a });
    for (const k of ["laurelL", "laurelR", "handtorch", "book", "flame"])
      drawPiece(k, G, { alpha: (keys.includes(k) ? 1 : 0.18) * a });
    const r = (1798 * gs) / 2 + 12;
    ring(cx, cy, r, 3, acc, 0.9 * a);
    ring(cx, cy, r + 8 + 4 * Math.sin(t * 6), 2, acc, 0.35 * a);
  }

  function drawLogo(G, p, t, { ps = {}, alpha = 1, glow = 0, shine = null, flash = 0 } = {}) {
    const pb = ps.base ?? p;
    drawPiece("base", G, {
      rot: pb * 40, sc: [1 + 0.95 * pb, 1 + 0.95 * pb],
      alpha: alpha * (pb > 0 ? 1 - 0.8 * Math.min(pb, 1) : alpha), shine, flash
    });
    for (const k of ORDER) {
      const pk = ps[k] ?? p;
      const [d, r, s] = EXPL[k];
      const code = [...k].reduce((a, c) => a + c.charCodeAt(0), 0) % 7;
      const sw = Math.sin(t * 2.0 + code) * 12 * Math.min(Math.max(pk, 0), 1);
      const disp = [d[0] * pk, d[1] * pk + sw];
      if (glow > 0) drawGlow(k, G, WHITE, glow * Math.min(1, Math.abs(pk) + 0.3), { disp, rot: r * pk });
      const sc = 1 + (s - 1) * pk;
      drawPiece(k, G, { disp, rot: r * pk, sc: [sc, sc], alpha, shine, flash });
    }
  }
  function drawLogoFinal(G, ps, t, shine, flash) {
    const pb = ps.base;
    drawPiece("base", G, { rot: pb * 40, sc: [1 + 0.95 * pb, 1 + 0.95 * pb], alpha: 1 - 0.8 * Math.max(pb, 0), shine, flash });
    for (const k of ORDER) {
      const pk = ps[k];
      const [d, r] = EXPL[k];
      const disp = [d[0] * pk, d[1] * pk];
      if (pk > 0.01) drawGlow(k, G, WHITE, 0.6 * Math.min(1, pk * 2), { disp, rot: r * pk });
      drawPiece(k, G, { disp, rot: r * pk, alpha: Math.min(1, (1 - pk) * 4 + (pk < 0.9 ? 1 : 0)), shine, flash });
    }
  }

  // ---------------------------------------------------------------- effects
  function fxRingsSparks(t) {
    for (const [t0, col, mr, du] of RINGS) {
      const u = (t - t0) / du;
      if (u >= 0 && u < 1) ring(LOGO_C[0], LOGO_C[1], mr * oq(u), 14 * (1 - u) + 2, col, (1 - u) ** 1.5);
    }
    BURSTS.forEach(([t0, col, n, , spd], bi) => {
      const u = t - t0;
      if (u < 0 || u >= 1.1) return;
      const b = BURST[bi];
      for (let i = 0; i < n; i++) {
        const dist = (b.sp[i] * spd * (1 - Math.exp(-u * 3.2))) / 3.2;
        const x = LOGO_C[0] + Math.cos(b.ang[i]) * dist, y = LOGO_C[1] + Math.sin(b.ang[i]) * dist + 120 * u * u;
        addDot(x, y, 3 + b.sz[i] * 5 * (1 - u / 1.1), col, Math.max(0, 1 - u / 1.1) * 0.9);
      }
    });
  }

  function slabOverlay(t) {
    B.forEach((b, i) => {
      if (Math.abs(t - b) > 0.32) return;
      const S = 360;
      const xr = lerp(-S, W + S, ic(seg(t, b - 0.3, b - 0.02)));
      const xl = lerp(-S, W + S, ic(seg(t, b + 0.02, b + 0.3)));
      ctx.save();
      ctx.beginPath(); ctx.moveTo(xl + S, 0); ctx.lineTo(xr + S, 0); ctx.lineTo(xr, H); ctx.lineTo(xl, H); ctx.closePath();
      ctx.fillStyle = C(SLAB_COL[i].map((c) => c * 0.92)); ctx.fill();
      ctx.clip();
      stripePat.setTransform(new DOMMatrix().translate(-mod(t * 900, 64), 0));
      ctx.fillStyle = stripePat; ctx.fillRect(0, 0, W, H);
      const txt = SLAB_TXT[i], size = txt.length < 3 ? 420 : 330;
      const tw = textW(txt, F_BLACK, size);
      const x = W / 2 - tw / 2 + (1 - oe(seg(t, b - 0.2, b + 0.2))) * 160;
      setF(F_BLACK, size);
      ctx.fillStyle = "rgba(5,13,31,0.95)";
      let xx = x;
      for (const ch of chars(txt)) { ctx.fillText(ch, xx, H / 2 + size * 0.36); xx += adv(ch, F_BLACK, size); }
      ctx.restore();
    });
  }

  // ---------------------------------------------------------------- scenes
  function pieceScene(t, si) {
    const sc = SCENES[si], b = B[si], u = t - b, acc = sc.acc, key = sc.key;
    const ex = ic(seg(u, SC_DUR - 0.42, SC_DUR - 0.05));
    const tex = SC_DUR - 0.42;
    const flick = 0.5 + 0.5 * Math.sin(t * 13) * Math.sin(t * 7.3);
    let pc, gs, tx0, ty;
    if (key === "laurel") { pc = [540, 548]; gs = 0.8; tx0 = 1040; ty = 330; }
    else if (key === "book") { pc = [960, 860]; gs = 0.64; tx0 = 130; ty = 270; }
    else if (key === "hand") { pc = [1400, 540]; gs = 1.12; tx0 = 130; ty = 330; }
    else { pc = [520, 560]; gs = 1.85; tx0 = 1090; ty = 330; }
    const exDx = 1100 * ex;
    background(t, acc, [pc[0] + exDx, pc[1]], 0.38 + (key === "flame" ? 0.12 * flick : 0));
    drawGhost(sc.ghost, t, key !== "book" ? 190 : 420, 0.07 + 0.04 * Math.sin(t * 2),
      110 * (si % 2 === 0 ? 1 : -1) + 40, 420);
    drawPiece("base", [pc[0] + exDx * 0.5, pc[1], key !== "flame" ? 0.62 : 0.78, t * 6], { alpha: 0.1 });
    for (const [rr, aa] of [[0.72, 0.18], [0.86, 0.1]])
      ring(pc[0] + exDx, pc[1], ((1798 * 0.3 * rr) / 0.72) * (1 + 0.02 * Math.sin(t * 2)), 2, acc, aa);
    particles(t, acc, 1.0);

    if (key === "laurel") {
      const rv = oc(seg(u, 0.12, 0.95)), sway = Math.sin(t * 1.8) * 2.0;
      const G = [pc[0] - 5 * gs + exDx, pc[1] + 85 * gs, gs, 0];
      if (rv > 0) for (const [k, sgn] of [["laurelL", 1], ["laurelR", -1]]) {
        drawGlow(k, G, GREEN, 0.9 * rv, { rot: sgn * sway, reveal: rv });
        drawPiece(k, G, {
          rot: sgn * sway, reveal: rv, pivot: [sgn * 395, 330],
          shine: u > 1.0 && u < 1.7 ? [lerp(-700, 900, seg(u, 1.0, 1.7)), 90, 0.55] : null
        });
      }
    } else if (key === "book") {
      const s = ob(seg(u, 0.12, 0.8), 2.2);
      const G = [pc[0] + exDx, pc[1] - 505 * gs, gs, Math.sin(t * 1.5) * 1.2];
      const scl = [1, Math.max(s, 0.02)];
      drawGlow("book", G, GOLD, 0.8 * seg(u, 0.1, 0.5), { sc: scl });
      drawPiece("book", G, {
        sc: scl, alpha: cl(u / 0.15),
        shine: u > 0.95 && u < 1.65 ? [lerp(-1500, 1700, seg(u, 0.95, 1.65)), 110, 0.6] : null
      });
    } else if (key === "hand") {
      const p = oe(seg(u, 0.1, 0.8));
      const G = [pc[0] + exDx, pc[1] - 31 * gs, gs, Math.sin(t * 1.4) * 1.5];
      const dy = (1 - p) * 360;
      drawGlow("handtorch", G, BLUE, 0.9 * seg(u, 0.1, 0.6), { disp: [0, dy] });
      drawPiece("handtorch", G, {
        disp: [0, dy], alpha: cl(u / 0.2),
        shine: u > 0.95 && u < 1.6 ? [lerp(-500, 700, seg(u, 0.95, 1.6)), 70, 0.7] : null
      });
      addBlob(pc[0] + exDx, pc[1] - 330 * gs * 0.6, 300, acc, 0.25 * p);
    } else {
      const s = ob(seg(u, 0.1, 0.75), 2.4);
      const pulse = 1 + 0.025 * Math.sin(t * 11) + 0.02 * Math.sin(t * 17.3);
      const G = [pc[0] + exDx, pc[1] + 428 * gs, gs, Math.sin(t * 2.3) * 2];
      const fa = cl(u / 0.2);
      drawGlow("flame", G, FIRE, (0.9 + 0.4 * flick) * fa, { sc: [s * pulse, s * pulse] });
      drawGlow("flame", G, GOLD, 0.35 * fa, { sc: [s * pulse * 0.9, s * pulse * 0.9] });
      drawPiece("flame", G, {
        sc: [s * pulse, s * (1 + (pulse - 1) * 1.8)], alpha: fa,
        flash: 0.25 * Math.max(0, 1 - u * 3) + 0.08 * flick
      });
      EMB.forEach((e, i) => {
        const tt = mod(t + e.ph, e.life) / e.life;
        const x = pc[0] + exDx + e.ox * 330 + Math.sin(t * 3 + i) * 30 * tt;
        const y = pc[1] - 90 - tt * (300 + e.hh * 300);
        addDot(x, y, 2.5 + e.sz * 4 * (1 - tt), i % 3 ? FIRE : GOLD, (1 - tt) ** 1.2 * 0.95 * seg(u, 0.3, 0.9));
      });
    }

    const tin = b + 0.12, tout = b + tex;
    const maxw = 800;
    const fs = Math.min(fit(sc.title[0], F_BLACK, 130, maxw), fit(sc.title[1], F_BLACK, 130, maxw));
    wipeLine("0" + sc.idx, F_BLACK, 78, tx0, ty - 50, t, tin, tout, acc, 1.0);
    wipeLine("/ 04", F_BOLD, 30, tx0 + 118, ty - 56, t, tin + 0.08, tout, [0.6, 0.68, 0.8], 1.0);
    const bar = oe(seg(t, tin + 0.1, tin + 0.7)) * (1 - ic(seg(t, tout, tout + 0.3)));
    fillRect(tx0 + 220, ty - 28, 380 * bar, 6, acc);
    kinetic(sc.title[0], F_BLACK, fs, tx0, ty + fs * 0.9, t, tin + 0.05, tout, WHITE);
    kinetic(sc.title[1], F_BLACK, fs, tx0, ty + fs * 1.95, t, tin + 0.2, tout, acc);
    const yb = ty + fs * 1.95 + 62;
    sc.body.forEach((line, j) =>
      wipeLine(line, F_REG, 31, tx0, yb + j * 42, t, tin + 0.55 + j * 0.1, tout, [0.88, 0.92, 1.0], 0.95));
    const keys = key === "laurel" ? ["laurelL", "laurelR"] : key === "book" ? ["book"] : key === "hand" ? ["handtorch"] : ["flame"];
    miniLogo(t, keys, acc, 1790, 110, 0.07, oe(seg(u, 0.2, 0.6)) * (1 - ex));
    hud(t, acc);
  }

  function intro(t) {
    background(t, GOLD, LOGO_C, 0.3 * seg(t, 0.1, 0.9));
    particles(t, GOLD, 0.8);
    drawGhost("NGUYỄN CÔNG TRỨ", t, 330, 0.07, 140, 420);
    const p = seg(t, 0.12, 0.95);
    const G = [LOGO_C[0], LOGO_C[1], G_LOGO * Math.max(ob(p, 1.4), 0.01), lerp(-90, 0, oe(p))];
    const a = cl(t / 0.25);
    const flash = t > 0.85 ? Math.max(0, 1 - (t - 0.85) * 5) * 0.6 : 0;
    drawGlow("base", G, GOLD, 0.8 * seg(t, 0.4, 0.95));
    drawLogo(G, 0, t, {
      alpha: a, flash,
      shine: t > 0.95 && t < 1.45 ? [lerp(-1500, 1700, seg(t, 0.95, 1.45)), 120, 0.7] : null
    });
    const track = lerp(26, 6, oe(seg(t, 0.6, 1.5)));
    const label = "THPT NGUYỄN CÔNG TRỨ   ·   LOGO BREAKDOWN";
    const wl = textW(label, F_BOLD, 26, track);
    wipeLine(label, F_BOLD, 26, W / 2 - wl / 2, 1018, t, 0.7, null, [0.9, 0.94, 1.0], 0.9, 60, track);
    hud(t, GOLD);
  }

  function exploded(t) {
    const u = t - 1.5;
    const pe = oe(seg(u, 0, 0.85));
    const gs = lerp(G_LOGO, 0.36, ic(seg(u, 0, 0.9)));
    const cy = lerp(LOGO_C[1], 540, ic(seg(u, 0, 0.9)));
    background(t, GOLD, [960, 540], 0.28);
    particles(t, GOLD, 1.0);
    drawGhost("DECONSTRUCT", t, 380, 0.09, 520 * Math.exp(-u * 1.2) + 90, 420);
    const ps = {};
    for (const k of [...ORDER, "base"]) ps[k] = pe;
    ps.flame = oe(seg(u, 0, 0.8)); ps.book = oe(seg(u, 0.03, 0.9));
    drawLogo([960, cy, gs, 0], pe, t, { ps, glow: 0.5 * pe });
    const lab = [["01  HAI CÀNH NGUYỆT QUẾ", 520, 340, 0.4], ["02  TRANG SÁCH RỘNG MỞ", 640, 780, 0.55],
    ["03  BÀN TAY CẦM ĐUỐC", 960, 430, 0.7], ["04  NGỌN ĐUỐC N·C·T", 1060, 180, 0.85]];
    for (const [txt, lx, ly, dl] of lab) {
      const a = seg(u, dl, dl + 0.35);
      if (a > 0) {
        wipeLine(txt, F_BOLD, 26, lx, ly, t, 1.5 + dl, null, WHITE, 1.0, 60, 3);
        fillRect(lx, ly + 12, textW(txt, F_BOLD, 26, 3) * oe(a), 3, GOLD);
      }
    }
    hud(t, GOLD);
  }

  function assembly(t) {
    const gs = lerp(0.36, G_END_FINAL, ic(seg(t, 11.0, 12.5)));
    const cx = t >= 13.0 ? lerp(960, FINAL_X, ic(seg(t, 13.0, 13.7))) : 960;
    const pulse = t >= 12.55 ? 1 + 0.05 * Math.max(0, Math.exp(-(t - 12.55) * 8)) : 1;
    const G = [cx, 540, gs * pulse, 0];
    const timing = {
      base: [10.95, 11.75], laurelL: [11.15, 11.8], laurelR: [11.2, 11.85],
      book: [11.4, 11.95], handtorch: [11.6, 12.15], flame: [11.85, 12.45]
    };
    const ps = {};
    for (const [k, [a, b]] of Object.entries(timing)) {
      const x = seg(t, a, b);
      ps[k] = 1 - (k !== "base" ? ob(x, 1.3) : oq(x));
    }
    const hv = hitVal(t);
    background(t, GOLD, [G[0], 540], 0.3 + 0.35 * (hv > 0.1 ? 1 : 0) * Math.min(1, hv));
    particles(t, GOLD, 1.0);
    drawGhost("ASSEMBLE", t, 380, 0.08, -300, 420);
    const sh = t > 12.8 && t < 13.5 ? [lerp(-1500, 1700, seg(t, 12.8, 13.5)), 130, 0.6] : null;
    const flash = t >= 12.55 ? 0.8 * Math.exp(-(t - 12.55) * 14) : 0;
    drawLogoFinal(G, ps, t, sh, flash);
    const kw = [["VINH DANH", 11.15, GREEN, [400, 300]], ["NUÔI DƯỠNG", 11.4, GOLD, [1500, 780]],
    ["TIẾP NỐI", 11.6, BLUE, [1500, 300]], ["THẮP CHÍ", 11.85, FIRE, [300, 800]]];
    for (const [txt, t0, col, [x, y]] of kw) {
      if (t > t0 - 0.05 && t < t0 + 0.65) {
        const uu = seg(t, t0, t0 + 0.6);
        const tw = textW(txt, F_BLACK, 120);
        wipeLine(txt, F_BLACK, 120, x - tw / 2, y, t, t0, t0 + 0.45, col, Math.sin(Math.PI * uu), 30);
      }
    }
  }

  function finalScene(t) {
    const x = lerp(960, FINAL_X, ic(seg(t, 13.0, 13.7)));
    const G = [x, 540, G_END_FINAL * (1 + 0.006 * Math.sin(t * 2.2)), 0];
    background(t, GOLD, [x, 540], 0.32);
    particles(t, GOLD, 1.0, 1.4);
    drawGhost("NCT  40", t, 300, 0.06, 80, 520);
    drawGlow("base", G, GOLD, 0.35);
    drawLogo(G, 0, t, {
      flash: t >= 12.55 ? 0.8 * Math.exp(-(t - 12.55) * 14) : 0,
      shine: t > 12.8 && t < 13.5 ? [lerp(-1500, 1700, seg(t, 12.8, 13.5)), 130, 0.6] : null
    });
    const tx0 = 1130, t0 = 13.35, tout = null; // tout = null để không biến mất
    const lines = [["MỘT BIỂU TƯỢNG", WHITE, 0], ["40 NĂM GÌN GIỮ DI SẢN", GOLD, 0.14]];
    const sz = Math.min(...lines.map((l) => fit(l[0], F_BLACK, 118, 700)));
    let by = 400;
    for (const [txt, col, dl] of lines) {
      kinetic(txt, F_BLACK, sz, tx0, by, t, t0 + dl, tout, col, 0.03, 0.55);
      by += sz * 1.12;
    }
    wipeLine("THPT NGUYỄN CÔNG TRỨ", F_BLACK, 38, tx0, by + 30, t, t0 + 0.7, tout, [0.88, 0.92, 1], 1.0, 60, 6);
    wipeLine("TIẾP NỐI GIÁ TRỊ - THẮP CHÍ VƯƠN XA", F_REG, 26, tx0, by + 82, t, t0 + 0.85, tout, GOLD, 1.0);
    // Bỏ cái thanh vàng cắt ngang chữ
    hud(t, GOLD);
  }

  // ---------------------------------------------------------------- frame
  function renderFrame(t) {
    t = cl(t, 0, DUR);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgb(3,5,11)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const h = hitVal(t);
    if (h > 0.02) {
      const z = 1 + 0.03 * Math.min(h, 1.3);
      ctx.setTransform(z * Q, 0, 0, z * Q,
        Q * ((W / 2) * (1 - z) + Math.sin(t * 90) * 5 * h), Q * ((H / 2) * (1 - z) + Math.cos(t * 77) * 5 * h));
    } else ctx.setTransform(Q, 0, 0, Q, 0, 0);
    if (t < 1.5) intro(t);
    else if (t < B[0]) exploded(t);
    else if (t < B[4]) pieceScene(t, B.slice(0, 4).filter((b) => t >= b).length - 1);
    else if (t < 12.55) assembly(t);
    else finalScene(t);
    slabOverlay(t);
    fxRingsSparks(t);
  }

  // ---------------------------------------------------------------- GSAP
  const state = { t: 0 };
  let raf = 0;
  const draw = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => renderFrame(state.t)); };
  renderFrame(0);
  const tween = gsap.to(state, {
    t: DUR, ease: "none", onUpdate: draw,
    scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: opts.scrub ?? 0.6 },
  });

  return {
    renderFrame, // renderFrame(seconds) for debugging
    destroy() {
      cancelAnimationFrame(raf);
      tween.scrollTrigger && tween.scrollTrigger.kill();
      tween.kill();
      stage.remove();
    },
  };
}
