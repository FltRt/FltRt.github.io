let c = 512;
let pixels = [];
let scale = 0.01;

function setup() {
  createCanvas(c, c);
  
}
function draw() {
    background(254,254,254,20);
  

  // for (let i = 0; i < c; i++) {
  //   for (let j = 0; j < c; j++) {
  //     let p = pixels[i][j];
  //     if(p < 0.4){
  //       noStroke();
  //       fill(158,147,134);
  //       rect(i, j, 1, 1);
  //     }
  //     else if(p < 0.55){
  //       noStroke();
  //       fill(180,131,92);
  //       rect(i, j, 1, 1);
  //     }
  //     else if(p < 0.7){
  //       noStroke();
  //       fill(139,108,104);
  //       rect(i, j, 1, 1);
  //     }
  //     else {
  //       noStroke();
  //       fill(105,120,129);
  //       rect(i, j, 1, 1);
  //   }

  let t = frameCount * 0.01;
  for (let i = 0; i < c; i++) {
    pixels[i] = [];
    for (let j = 0; j < c; j++) {
      let noiseValue = noise(i*scale, j*scale,t);
      pixels[i][j] = noiseValue;
      
    }
  }

  for (let i = 0; i < c; i++) {
    for (let j = 0; j < c; j++) {
      let p = pixels[i][j];
      if(t/5 < p && p < t/5+0.05){
        
      noStroke();
      fill(255-t*30);
      rect(i, j, 1, 1);
      //text('H', i, j);
    }
    }
  }
}

