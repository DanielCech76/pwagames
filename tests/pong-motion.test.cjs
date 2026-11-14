const assert=require('node:assert/strict');
const {PongMotion}=require('../module-src/pong/motion.js');
function setup(mode,profile='balanced'){const m=new PongMotion();m.mode=mode;m.profile=profile;m.orientation(45,0,0,0);m.motion({beta:0,gamma:0},{x:0,y:0},0,0);assert(m.calibrate(0));return m;}
function run(m,value,seconds=.4){let x=236;for(let i=1;i<=seconds*100;i++){const t=i*10;if(m.mode==='gyro')m.motion({beta:0,gamma:value},null,0,t);else if(m.mode==='impulse')m.motion(null,{x:value,y:0},0,t);else m.orientation(45,value,0,t);x=m.step(.01,x,472,t);}return x;}
for(const mode of ['velocity','position','wheel','gyro','impulse']){assert(run(setup(mode),20)>236,mode+' right');assert(run(setup(mode),-20)<236,mode+' left');}
for(const mode of ['velocity','position','wheel'])assert.equal(run(setup(mode),1),236,'dead zone '+mode);
assert.equal(run(setup('touch'),30),236);
const gyro=setup('gyro');gyro.motion(null,{x:1,y:0},0,900);assert(!gyro.ready(900),'acceleration must not keep stale gyro alive');
const impulse=setup('impulse');impulse.motion({beta:0,gamma:1},null,0,900);assert(!impulse.ready(900));
const wheel=setup('wheel');wheel.orientation(0,0,0,10);assert(!wheel.ready(10),'flat wheel cannot be calibrated');
const invalid=setup('velocity');invalid.orientation(null,null,0,900);assert(!invalid.ready(900));assert.equal(invalid.step(.1,236,472,900),236);
assert(run(setup('velocity','walking'),15,.1)<run(setup('velocity','direct'),15,.1),'walking attenuates short disturbance');
const m=setup('velocity');assert(run(m,80,2)<=472);m.reset();assert(!m.zero);assert(!m.ready(0));
// Screen rotation is accounted for before mapping; the same gravity projection yields the same input.
const a=setup('position'),b=setup('position');a.orientation(0,20,0,10);b.orientation(20,0,90,10);assert(Math.abs(a.raw.tilt-b.raw.tilt)<1e-8);
console.log('PASS: all five motion mappings, signs, dead zone, filters, bounds, stale sensor isolation, invalid inputs, wheel geometry, rotation and reset');

const tuned=setup('velocity');assert(tuned.setLimits(10,30,.4));assert.equal(tuned.limits().left,10);assert(!tuned.setLimits(-1,20,1));const limited=run(tuned,60,1);assert(limited<=236+472*.4+1,'custom max speed');tuned.mode='gyro';assert.equal(tuned.limits().left,65,'mode-specific limits');tuned.mode='velocity';assert.equal(tuned.limits().right,30);tuned.reset();assert.equal(tuned.limits().speed,.4,'sensor reset retains tuning');console.log('PASS: per-mode asymmetric limits, speed cap, validation and tuning retention');
