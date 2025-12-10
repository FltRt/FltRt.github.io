// =================================================
// CONFIG
// =================================================
// =================================================
// COCA sorted cache (for fast nearest lookup)
// =================================================

let COCA_SORTED = null;

function initCocaSorted() {
  if (COCA_SORTED) return;
  COCA_SORTED = Object.entries(COCA)
    .map(([word, freq]) => ({ word, freq }))
    .sort((a, b) => a.freq - b.freq);
}
function findClosestWordByFreq(targetFreq) {
  let lo = 0;
  let hi = COCA_SORTED.length - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (COCA_SORTED[mid].freq < targetFreq) lo = mid + 1;
    else hi = mid - 1;
  }

  const candidates = [];
  if (lo < COCA_SORTED.length) candidates.push(COCA_SORTED[lo]);
  if (lo > 0) candidates.push(COCA_SORTED[lo - 1]);

  candidates.sort(
    (a, b) =>
      Math.abs(a.freq - targetFreq) -
      Math.abs(b.freq - targetFreq)
  );

  return candidates[0].word;
}

function remixSegmentByAffineFrequency(segment) {
  initCocaSorted();

  const words = segment
    .toLowerCase()
    .match(/[a-zA-Z']+/g) || [];

  const freqs = words
    .map(w => COCA[w])
    .filter(f => typeof f === "number");

  if (freqs.length === 0) return segment;

  // ---------------------------------------------
  // ✨ 两个随机系数（你可以调范围）
  // ---------------------------------------------

  // 缩放系数 a（比例保持）
  const a = 0.6 + Math.random() * 2.8;   // 0.6 ~ 3.4

  // 平移项 b（整体移动）
  const b = Math.random() * 8000 - 4000; // -4000 ~ +4000

  // ---------------------------------------------

  const newWords = freqs.map(f => {
    let target = a * f + b;
    target = Math.max(1, target); // 防止负数或 0
    return findClosestWordByFreq(target);
  });

  // 保持原单词数量 & 顺序
  return newWords.join(" ");
}

document.getElementById("remixBtn").addEventListener("click", () => {
  const textarea = document.getElementById("textInput");
  const originalText = textarea.value;

  const segments = originalText
    .split(/[\n,.]/)
    .map(s => s.trim())
    .filter(Boolean);

  if (!segments.length) return;

  const remixedSegments = segments.map(seg =>
    remixSegmentByAffineFrequency(seg)
  );

  // 重新组合文本
  const newText = remixedSegments.join(", ");

  textarea.value = newText;

  // 重新生成地形
  generateTopo(newText);
});


let GRID_X = 200;
let GRID_Y = 160;

const CONTOUR_STEP = 0.05;
const INDEX_STEP = 5;

let WIDTH = 280;        // 收紧宽度
let HEIGHT = 900;       // 会在 generateTopo 里动态计算

const KEYWORD_FREQ_LIMIT = 20000;
const MAX_KEYWORDS = 20;

const TEXT_MARGIN = 0.12;

// 控制 SVG 垂直长度（和段落数量相关）
const MIN_HEIGHT = 150;          // SVG 最小高度
const PIXELS_PER_SEGMENT = 30;   // 每个段落贡献的高度像素

// =================================================
// GLOBAL
// =================================================

let COCA = {};
let segmentsGlobal = [];
let keywordsGlobal = [];
let segmentRankGlobal = [];
let fieldGlobal = null;

// =================================================
// LOAD COCA
// =================================================

fetch("coca_60000.json")
  .then(r => r.json())
  .then(j => {
    COCA = j;
    console.log("COCA loaded");
    const ta = document.getElementById("textInput");
    if (ta) {
      generateTopo(ta.value);
    }
  });

// =================================================
// INPUT LISTENER
// =================================================

document.getElementById("textInput").addEventListener("input", e => {
  if (!COCA || Object.keys(COCA).length === 0) return;
  generateTopo(e.target.value);
});

// =================================================
// UTIL
// =================================================

function freqVal(f) {
  return Math.log(f + 1);
}

function lerp(a, b, t) {
  return a * (1 - t) + b * t;
}

function sampleArray(arr, t) {
  if (arr.length === 1) return arr[0];
  const p = t * (arr.length - 1);
  const i = Math.floor(p);
  const a = p - i;
  return lerp(arr[i], arr[Math.min(i + 1, arr.length - 1)], a);
}

function curveComplexity(curve) {
  let sum = 0;
  for (let i = 1; i < curve.length; i++) {
    sum += Math.abs(curve[i] - curve[i - 1]);
  }
  return sum / (curve.length - 1);
}

// =================================================
// MAIN
// =================================================

function generateTopo(text) {

  const segments = text
    .split(/[\n,.]/)
    .map(s => s.trim())
    .filter(Boolean);

  if (!segments.length) {
    clearSVG();
    return;
  }

  // 根据段落数量动态计算整体高度（不再固定 900）
  HEIGHT = Math.max(MIN_HEIGHT, segments.length * PIXELS_PER_SEGMENT);

  segmentsGlobal = segments;
  keywordsGlobal = [];

  const curves = [];
  const segmentMeans = [];

  // ---------- build curves ----------
  segments.forEach((seg, segIndex) => {
    const words = seg.toLowerCase().match(/[a-zA-Z']+/g) || [];
    const vals = [];

    words.forEach((w, i) => {
      if (COCA[w]) {
        const f = COCA[w];
        vals.push(freqVal(f));

        if (f < KEYWORD_FREQ_LIMIT) {
          keywordsGlobal.push({
            word: w,
            segIndex,
            xNorm: words.length > 1 ? i / (words.length - 1) : 0.5,
            freq: f
          });
        }
      }
    });

    const safe = vals.length ? vals : [0];
    segmentMeans.push(
      safe.reduce((a, b) => a + b, 0) / safe.length
    );

    const curve = [];
    for (let x = 0; x < GRID_X; x++) {
      curve.push(sampleArray(safe, x / (GRID_X - 1)));
    }
    curves.push(curve);
  });

  // ---------- vertical complexity → GRID_Y ----------
  const GRID_Y_MIN = 80;
  const GRID_Y_MAX = 320;

  const complexities = curves.map(curveComplexity);
  const avgComplexity =
    complexities.reduce((a, b) => a + b, 0) / complexities.length;

  const COMP_MIN = 0.01;
  const COMP_MAX = 0.12;

  let t = (avgComplexity - COMP_MIN) / (COMP_MAX - COMP_MIN);
  t = Math.max(0, Math.min(1, t));

  // γ < 1：让变化更温和，不会一上来就冲顶
  const gamma = 0.3;
  t = Math.pow(t, gamma);

  GRID_Y = Math.round(
    GRID_Y_MIN + t * (GRID_Y_MAX - GRID_Y_MIN)
  );

  // ---------- rank-based reorder ----------
  const ranked = segmentMeans
    .map((v, i) => ({ v, i }))
    .sort((a, b) => a.v - b.v);

  const segmentRank = new Array(segmentMeans.length);
  ranked.forEach((e, r) => (segmentRank[e.i] = r));
  segmentRankGlobal = segmentRank;

  const curvesByRank = new Array(curves.length);
  segmentRank.forEach((r, i) => {
    curvesByRank[r] = curves[i];
  });

  // ---------- build field ----------
  const field = new Array(GRID_X * GRID_Y);

  for (let y = 0; y < GRID_Y; y++) {
    const tRow = (y / (GRID_Y - 1)) * (curvesByRank.length - 1);
    const i0 = Math.floor(tRow);
    const a = tRow - i0;

    const c0 = curvesByRank[i0];
    const c1 = curvesByRank[Math.min(i0 + 1, curvesByRank.length - 1)];

    for (let x = 0; x < GRID_X; x++) {
      field[y * GRID_X + x] = lerp(c0[x], c1[x], a);
    }
  }

  const min = Math.min(...field);
  const max = Math.max(...field);
  const span = max - min || 1;

  for (let i = 0; i < field.length; i++) {
    field[i] = (field[i] - min) / span;
  }
  fieldGlobal = field;

  const levels = [];
  for (let v = 0; v <= 1.0001; v += CONTOUR_STEP) levels.push(v);

  const contours = d3.contours()
    .size([GRID_X, GRID_Y])
    .thresholds(levels)(field);

  drawSVG(contours);
}

// =================================================
// SVG
// =================================================

function clearSVG() {
  document.getElementById("out").innerHTML = "<p>graphed text</p>";
}

function drawSVG(contours) {
  const out = document.getElementById("out");
  out.innerHTML = "";

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", WIDTH);
  svg.setAttribute("height", HEIGHT); // 使用动态 HEIGHT
  out.appendChild(svg);

  // 使用 GRID_X / GRID_Y 分别控制 x、y 缩放
  const pathGen = d3.geoPath(
    d3.geoTransform({
      point: function (x, y) {
        this.stream.point(
          x * (WIDTH / GRID_X),
          y * (HEIGHT / GRID_Y)
        );
      }
    })
  );

  // --- contours ---
  contours.forEach((c, i) => {
    const d = pathGen(c);
    if (!d) return;
    const p = document.createElementNS(svgNS, "path");
    p.setAttribute("d", d);
    p.setAttribute("fill", "none");
    if (i % INDEX_STEP === 0) {
      p.setAttribute("stroke", "#000");
      p.setAttribute("stroke-width", "0.8");
    } else {
      p.setAttribute("stroke", "#999");
      p.setAttribute("stroke-width", "0.4");
    }
    svg.appendChild(p);
  });

  // --- keywords ---
  keywordsGlobal
    .sort((a, b) => a.freq - b.freq)
    .slice(0, MAX_KEYWORDS)
    .forEach(k => {
      const x =
        (TEXT_MARGIN + k.xNorm * (1 - 2 * TEXT_MARGIN)) * WIDTH;
      const rank = segmentRankGlobal[k.segIndex];

      const xField = Math.floor(k.xNorm * (GRID_X - 1));

      let yField = Math.floor(
        (rank /
          Math.max(1, segmentRankGlobal.length - 1)) *
        (GRID_Y - 1)
      );

      for (let d = 0; d < 20; d++) {
        const idx = yField * GRID_X + xField;
        const below = Math.min(
          (yField + 1) * GRID_X + xField,
          fieldGlobal.length - 1
        );
        if (fieldGlobal[below] <= fieldGlobal[idx]) break;
        yField++;
      }

      const y = yField * (HEIGHT / GRID_Y);

      const t = document.createElementNS(svgNS, "text");
      t.textContent = k.word;
      t.setAttribute("x", x);
      t.setAttribute("y", y);
      t.setAttribute("fill", "#444");
      t.setAttribute("font-size", "8px");
      t.setAttribute("text-anchor", "middle");
      svg.appendChild(t);
    });
}

const ta = document.getElementById("textInput");

function resizeTextarea() {
  ta.style.height = "auto";
  ta.style.height = ta.scrollHeight + "px";
}

ta.addEventListener("input", resizeTextarea);
resizeTextarea();
