/* =========================================================
   GLOBAL VARIABLES (原封不动)
========================================================= */

let img;
let allColors = []; 
let pixelMap = [];  
let noiseScale = 0.003; 


/* =========================================================
   P5 LIFECYCLE
========================================================= */

function setup() {
  createCanvas(1, 1);
  pixelDensity(1);
  noLoop();
}


/* =========================================================
   ✅ EXTERNAL ENTRY POINT (HTML 调用这个)
========================================================= */

function processP5Image(_img) {
  img = _img;

  resizeCanvas(img.width, img.height);

  // ===== 原 setup 中的全部逻辑（完全照抄） =====

  // 1. dramatic
  img.loadPixels();
  let dramaScore = calculateDrama();
  window.currentDramaScore = dramaScore;

  noiseScale = map(dramaScore, 10, 60, 0.0005, 0.02, true);

  // 2. ALL pixels 
  let colorCounts = {};
  let tempPixels = [];

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let idx = (y * img.width + x) * 4;
      let r = img.pixels[idx];
      let g = img.pixels[idx+1];
      let b = img.pixels[idx+2];
      
      let colKey = `${r},${g},${b}`;
      
      // Store raw color data
      tempPixels.push({r, g, b, key: colKey});
      
      // Count frequency
      if (!colorCounts[colKey]) colorCounts[colKey] = 0;
      colorCounts[colKey]++;
    }
  }

  // 3. Sort the source pixels by their global FREQUENCY
  // Most frequent colors go to the front of the array
  tempPixels.sort((a, b) => {
    return colorCounts[b.key] - colorCounts[a.key];
  });
  
  allColors = tempPixels;

  generateExactMap();
}


/* =========================================================
   MAP GENERATION (原封不动)
========================================================= */

function generateExactMap() {
  loadPixels();
  randomSeed(100);
  noiseSeed(100);

  // 4. Create a list of all XY coordinates and their Noise Value
  pixelMap = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Get noise value for this position
      let n = fbm(x * noiseScale, y * noiseScale);
      
      pixelMap.push({
        x: x,
        y: y,
        val: n
      });
    }
  }

  // 5. Sort the coordinates by NOISE value
  // Highest noise values go to front, Lowest to back
  pixelMap.sort((a, b) => b.val - a.val);

  // 6. Match-Up
  // index 0 of sorted colors with index 0 of sorted noise positions
  for (let i = 0; i < pixelMap.length; i++) {
    let dest = pixelMap[i]; // The coordinate (x,y)
    let col = allColors[i]; // The color assigned to this rank
    
    let idx = (dest.y * width + dest.x) * 4;
    pixels[idx]     = col.r;
    pixels[idx + 1] = col.g;
    pixels[idx + 2] = col.b;
    pixels[idx + 3] = 255;
  }

  updatePixels();
}


/* =========================================================
   HELPER FUNCTIONS (原封不动)
========================================================= */

function calculateDrama() {
  let totalDifference = 0;
  let sampleSize = 0;
  // Sampling every 10th pixel for speed
  for (let y = 0; y < img.height; y += 10) {
    for (let x = 0; x < img.width - 1; x += 10) {
      let idx = (y * img.width + x) * 4;
      let nextIdx = (y * img.width + (x + 1)) * 4; 
      let b1 = (img.pixels[idx] + img.pixels[idx+1] + img.pixels[idx+2]) / 3;
      let b2 = (img.pixels[nextIdx] + img.pixels[nextIdx+1] + img.pixels[nextIdx+2]) / 3;
      totalDifference += abs(b1 - b2);
      sampleSize++;
    }
  }
  return totalDifference / sampleSize;
}


function fbm(x, y) {
  let total = 0;
  let amplitude = 0.5;
  let frequency = 1.0;
  for (let i = 0; i < 6; i++) {
    total += amplitude * noise(x * frequency, y * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  return total;
}


function dramaToLevel(drama) {
  return constrain(
    Math.ceil(map(drama, 10, 60, 1, 6)),
    1,
    6
  );
}


function remixBySingleColumn(sourceImg) {
  const w = sourceImg.width;
  const h = sourceImg.height;

  sourceImg.loadPixels();

  // 1. 随机选一列 x
  const x = floor(random(w));

  // 2. 取这一列的所有像素
  let column = [];
  let colorCounts = {};

  for (let y = 0; y < h; y++) {
    const idx = (y * w + x) * 4;
    const r = sourceImg.pixels[idx];
    const g = sourceImg.pixels[idx + 1];
    const b = sourceImg.pixels[idx + 2];
    const key = `${r},${g},${b}`;

    column.push({ r, g, b, key, y });

    colorCounts[key] = (colorCounts[key] || 0) + 1;
  }

  // 3. 找出出现次数最多的颜色
  let dominantKey = null;
  let maxCount = 0;

  for (let key in colorCounts) {
    if (colorCounts[key] > maxCount) {
      maxCount = colorCounts[key];
      dominantKey = key;
    }
  }

  // 4. 重排 column：
  //    dominant color → 最上
  //    其余顺序随机
  let top = [];
  let rest = [];

  for (let p of column) {
    if (p.key === dominantKey) {
      top.push(p);
    } else {
      rest.push(p);
    }
  }

  shuffle(rest, true); // p5 shuffle

  const reorderedColumn = top.concat(rest);

  // 5. 生成新图像（尺寸不变）
  const result = createImage(w, h);
  result.loadPixels();

  for (let y = 0; y < h; y++) {
    const p = reorderedColumn[y];

    for (let xx = 0; xx < w; xx++) {
      const idx = (y * w + xx) * 4;
      result.pixels[idx]     = p.r;
      result.pixels[idx + 1] = p.g;
      result.pixels[idx + 2] = p.b;
      result.pixels[idx + 3] = 255;
    }
  }

  result.updatePixels();
  return result;
}





function updateUploadThumbnail(p5img) {
  const thumb = document.getElementById("imageThumb");

  // p5.Image → data URL
  thumb.src = p5img.canvas.toDataURL("image/png");
  thumb.style.display = "block";
}
