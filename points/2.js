let c = 512;
let scale = 0.02;

let col0, col1, col2, col3;

function setup() {
  createCanvas(c, c);
  noStroke();

  col0 = color(158,147,134);
  col1 = color(180,131,92);
  col2 = color(139,108,104);
  col3 = color(105,120,129);

  for (let i = 0; i < c; i++) {
    for (let j = 0; j < c; j++) {

      let n = noise(i*scale, j*scale);

      
      let col;

      if (n < 0.3) {
        col = col0;
      } else if (n < 0.45) {
        let t = map(n, 0.3, 0.45, 0, 1);
        col = lerpColor(col0, col1, t);
      } else if (n < 0.6) {
        let t = map(n, 0.45, 0.6, 0, 1);
        col = lerpColor(col1, col2, t);
      } else {
        let t = map(n, 0.6, 1.0, 0, 1);
        col = lerpColor(col2, col3, t);
      }

      fill(col);
      rect(i, j, 1, 1);
    }
  }
}

function draw() {}


// let x = 1; 

// function setup() {
//   createCanvas(1000, 1000);
//   background(255);
// }

// function draw() {
  
//   for (let i = 0; i < x; i++) {
//     circle(random(10, 990), random(10, 990), 1);
//   }

  
//   x *= 1.001;  
// }
