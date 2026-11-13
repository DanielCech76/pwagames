const assert=require('node:assert/strict');
const Engine=require('../pinball-engine');
const table=require('../pinball-tables')[0];
for(const power of [0,.5,1]){
 const e=new Engine(table);e.launch(power);let reachedField=false;
 for(let i=0;i<240*12;i++){
  e.step(1/240,[i%150<80,i%130<70]);
  if(!e.ready&&e.ball.x<500)reachedField=true;
  assert(Number.isFinite(e.ball.x+e.ball.y+e.ball.vx+e.ball.vy));
 }
 assert(reachedField,'Every launch power must reach the playing field');
}
const e=new Engine(table);e.launch();
e.ball={x:210,y:175,vx:0,vy:200,r:10};e.step(1/240);
assert(e.score>0);assert(e.ball.vy<0);
const f=new Engine(table);f.launch();
f.ball={x:245,y:855,vx:0,vy:120,r:10};
for(let i=0;i<12;i++)f.step(1/240,[true,false]);
assert(f.ball.vy<0,'A moving flipper must lift the ball');
const targets=new Engine(table);targets.launch();
for(const target of table.targets){targets.ball={x:target.x,y:target.y+20,vx:0,vy:-100,r:10};targets.step(1/240)}
assert.equal(targets.multiplier,2);assert.equal(targets.score,3500);assert(targets.targets.every(hit=>!hit));
for(let i=0;i<3;i++){e.ready=false;e.ball.y=1100;e.step(1/240)}
assert(e.over);assert.equal(e.number,3);
e.reset();assert(!e.over);assert(e.ready);assert.equal(e.score,0);
console.log('PASS: launch powers, stable physics, bumper, moving flipper, target bonus, three balls, reset');
