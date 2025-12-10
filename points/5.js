let img;
let allColors = []; 
let pixelMap = [];  

let noiseScale = 0.003; 

function preload() {
  img = loadImage("test4.jpg"); 
}

function setup() {
  createCanvas(img.width, img.height);
  pixelDensity(1);
  
    // 1. dramatic
  img.loadPixels();
  let dramaScore = calculateDrama();
      // 0.0005 to 0.02
  noiseScale = map(dramaScore, 10, 60, 0.0005, 0.02, true);
  //console.log(`Dramatic: ${dramaScore.toFixed(2)}, Noise Scale: ${noiseScale.toFixed(5)}`);

    // 2.  ALL pixels 
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

  noLoop();
  generateExactMap();
}

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

// --- HELPER FUNCTIONS ---

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