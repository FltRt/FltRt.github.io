let c = 512;
let pixels = [];
let scale = 0.01;
let floors = [];

function getFloor(a,b,c){
    if(a < c+b){
        return 0;
    }
    else if(a < c+b*2){
        return 1;
    }   
    else if(a < c+b*3){
        return 2;
    }  
    else {
        return 3;
    }
}

function isBorder(i, j) {
  let label = floors[i][j];

  if (i > 0     && floors[i-1][j] != label) return true;
  //if (i < c - 1 && getFloor(pixels[i+1][j]) != label) return true;
  if (j > 0     && floors[i][j-1] != label) return true;
  //if (j < c - 1 && getFloor(pixels[i][j+1]) != label) return true;

  return false;
}

function setup() {

  createCanvas(c, c);
  for (let i = 0; i < c; i++) {
    pixels[i] = [];
    floors[i] = [];
    for (let j = 0; j < c; j++) {
      let noiseValue = noise(i*scale, j*scale);
      pixels[i][j] = noiseValue;
      floors[i][j] = getFloor(noiseValue,0.15,0.4);
      
    }
  }

  for (let i = 0; i < c; i++) {
    for (let j = 0; j < c; j++) {
      if(isBorder(i,j)){
        stroke(50);
        point(i,j);
        //text('H',i,j);
      }

}
}

for (let n = 1; n < 6; n++){
for (let i = 0; i < c; i++) {
    for (let j = 0; j < c; j++) {
      floors[i][j] = getFloor(pixels[i][j],0.15,0.25+0.03*n);
      if(isBorder(i,j)){
        stroke(50,50,50,80);
        point(i,j);
        //text('I',i,j);
      }

}
}
}
  
}

function draw() {
  //  background(220);
  
    
    
    
}

  