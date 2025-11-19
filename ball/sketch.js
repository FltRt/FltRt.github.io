function setup() {
  let z = createCanvas(windowWidth, windowHeight);
  background(1);
 z.touchStarted(Clear);
}

let a = 20;
let b = 6;
let c = 4;

function getMin(a){
  if(a%2==0){
    return a/2-1;
  }else{
    return (a-1)/2;
  }
}
function getMax(a){
  if(a%2==0){
    return a/2+1;
  }else{
    return (a-1)/2+2;
  }
}

function draw() {
  
  for (let i = 0; i < 1; i++) {
    noStroke();
    fill(random(255), random(255), random(255));
    ellipse(random(getMin(a)*width/a, getMax(a)*width/a), random(getMin(a)*height/a, getMax(a)*height/a), 20, 20);
  } 
  if (frameCount % 10 === 0) {
    noStroke();
    fill(random(150), random(150), random(150));
    ellipse(random(width), random(height), 80, 80);
}
if (frameCount % 35 === 0) {
    noStroke();
    fill(random(150), random(150), random(150));
    ellipse(random(width), random(height), 120, 120);
}
  if (frameCount % 5 === 0) {
    for (let i = 0; i < 3; i++) {
    noStroke();
    fill(random(200), random(200), random(200));
    ellipse(random(getMin(b)*width/b, getMax(b)*width/b), random(getMin(b)*height/b, getMax(b)*height/b), 40, 40);
}}

if (frameCount % 7 === 0) {
    for (let i = 0; i < 2; i++) {
    noStroke();
    fill(random(180), random(180), random(180));
    ellipse(random(getMin(c)*width/c, getMax(c)*width/c), random(getMin(c)*height/c, getMax(c)*height/c), 60, 60);
}}



}
function Clear() {
  for (let i = 0; i < 10; i++) {
    noStroke();
    fill(255);
    ellipse(random(width), random(height), 1000, 1000);
    nextFrame();
  }}