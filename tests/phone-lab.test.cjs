const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
function setup({denyMotion=false,pending=false}={}){
 const elements={},events={},docEvents={},intervals=new Map(),cleared=[];let geoSuccess,geoError,permissionCalls=0,resolveOrientation;
 const classList=()=>({toggle(){},remove(){},add(){}});
 const el=id=>elements[id]??=( {classList:classList(),setAttribute(name,value){this[name]=value},textContent:'',hidden:false,disabled:false,dataset:{},style:{},addEventListener(){}} );
 const window={isSecureContext:true,DeviceOrientationEvent:{requestPermission(){permissionCalls++;return pending?new Promise(r=>resolveOrientation=r):Promise.resolve('granted')}},DeviceMotionEvent:{requestPermission(){permissionCalls++;return Promise.resolve(denyMotion?'denied':'granted')}},addEventListener:(type,fn)=>events[type]=fn,removeEventListener:(type,fn)=>{if(events[type]===fn)delete events[type]},scrollTo(){}};
 const document={body:{classList:classList()},getElementById:el,hidden:false,addEventListener:(type,fn)=>docEvents[type]=fn};
 const navigator={geolocation:{watchPosition(success,error){geoSuccess=success;geoError=error;return 0},clearWatch:id=>cleared.push(id)}};
 const context={window,document,navigator,screen:{orientation:{angle:0}},performance:{now:()=>10000},setInterval:fn=>{intervals.set(1,fn);return 1},clearInterval:id=>intervals.delete(id),Date,Math,Number,Promise};
 vm.createContext(context);vm.runInContext(fs.readFileSync('phone-lab.js','utf8'),context);
 return {el,events,docEvents,document,window,cleared,intervals,permissionCalls:()=>permissionCalls,resolve:()=>resolveOrientation('granted'),geo:p=>geoSuccess(p),error:e=>geoError(e),render:()=>intervals.get(1)?.()};
}
(async()=>{
 const s=setup();s.el('labLaunch').onclick();assert.equal(s.permissionCalls(),0,'Opening must not request access');await s.el('labStartSensors').onclick();assert.equal(s.permissionCalls(),2);
 s.events.deviceorientation({alpha:0,beta:0,gamma:0,absolute:false});s.events.devicemotion({acceleration:{x:0,y:null,z:-1.5},accelerationIncludingGravity:{x:0,y:0,z:9.81},rotationRate:{alpha:0,beta:2,gamma:null},interval:16});s.render();
 assert.notEqual(s.el('labAlpha').textContent,'—');assert.equal(s.el('labAy').textContent,'—');assert.equal(s.el('labRz').textContent,(0).toLocaleString('cs-CZ',{minimumFractionDigits:2,maximumFractionDigits:2}));assert.equal(s.el('labRy').textContent,'—');assert.equal(s.el('labMagnitude').textContent,'—');assert.equal(s.el('labGyroStatus').dataset.state,'live');
 s.el('labCalibrate').onclick();assert.equal(s.el('labCalibration').textContent,'Neutrální poloha nastavená');
 s.el('labStartGeo').onclick();s.geo({coords:{latitude:0,longitude:0,accuracy:5,altitude:null,altitudeAccuracy:null,speed:0,heading:null},timestamp:0});assert.notEqual(s.el('labLat').textContent,'—');assert.equal(s.el('labAltitude').textContent,'—');assert.notEqual(s.el('labSpeed').textContent,'—');assert.equal(s.el('labHeading').textContent,'—');
 s.document.hidden=true;s.docEvents.visibilitychange();assert.deepEqual(s.cleared,[0]);assert(!s.events.deviceorientation);assert(!s.events.devicemotion);assert(!s.el('labStartGeo').disabled);
 s.el('labBack').onclick();assert.equal(s.intervals.size,0);assert(s.el('phoneLab').hidden);assert.equal(s.el('labLat').textContent,'—');
 const denied=setup({denyMotion:true});denied.el('labLaunch').onclick();await denied.el('labStartSensors').onclick();assert(denied.events.deviceorientation);assert(!denied.events.devicemotion);assert.equal(denied.el('labGyroStatus').dataset.state,'warn');
 const race=setup({pending:true});race.el('labLaunch').onclick();const start=race.el('labStartSensors').onclick();race.el('labBack').onclick();race.resolve();await start;assert(!race.events.deviceorientation);assert(!race.events.devicemotion);
 const compact=setup();compact.el('labLaunch').onclick();compact.el('labModeToggle').onclick();assert.equal(compact.el('labCompactView').hidden,false);
 compact.el('labAllToggle').onclick();await Promise.resolve();await Promise.resolve();await Promise.resolve();
 assert.equal(compact.permissionCalls(),2);assert(compact.events.devicemotion);assert(compact.el('labStartGeo').disabled);
 compact.events.deviceorientation({alpha:335,beta:12,gamma:8,absolute:false});compact.events.devicemotion({acceleration:{x:5,y:-2,z:null},accelerationIncludingGravity:{x:0,y:0,z:9.81},rotationRate:{alpha:0,beta:90,gamma:-45},interval:16});compact.render();
 assert.equal(compact.el('labPhone').style.transform,'rotate(25deg)');assert.equal(compact.el('labCompactPhone').style.transform,'rotate(25deg)');
 assert.equal(compact.el('labCompactBarAx').style.width,'25%');assert.equal(compact.el('labCompactBarAy').dataset.direction,'negative');assert.equal(compact.el('labCompactBarAz').dataset.empty,'true');assert.equal(compact.el('labCompactRz').textContent,(0).toLocaleString('cs-CZ',{minimumFractionDigits:1,maximumFractionDigits:1}));
 compact.el('labCompactCalibrate').onclick();assert.equal(compact.el('labCompactPhone').style.transform,'rotate(0deg)');compact.events.deviceorientation({alpha:310,beta:12,gamma:8,absolute:false});compact.events.devicemotion({acceleration:{x:25,y:-25,z:0},rotationRate:{alpha:0,beta:200,gamma:0},interval:16});compact.render();assert.equal(compact.el('labCompactPhone').style.transform,'rotate(25deg)');assert.equal(compact.el('labCompactBarAx').style.width,'50%');assert.equal(compact.el('labCompactBarAx').dataset.clipped,'true');assert.equal(compact.el('labCompactBarAy').style.left,'0%');assert.equal(compact.el('labCompactBarAz').dataset.empty,'true');
 compact.el('labModeToggle').onclick();assert.equal(compact.el('labCompactView').hidden,true);assert(compact.events.devicemotion,'Mode switch must retain measurement');compact.el('labModeToggle').onclick();
 compact.el('labAllToggle').onclick();assert(!compact.events.devicemotion);assert.deepEqual(compact.cleared,[0]);assert.equal(compact.el('labAllToggle')['aria-pressed'],'false');assert.equal(compact.el('labCompactAx').textContent,'—');
 const pendingAll=setup({pending:true});pendingAll.el('labLaunch').onclick();pendingAll.el('labAllToggle').onclick();pendingAll.el('labAllToggle').onclick();pendingAll.resolve();await Promise.resolve();await Promise.resolve();await Promise.resolve();assert(!pendingAll.events.deviceorientation);assert.deepEqual(pendingAll.cleared,[0]);
 console.log('PASS: clockwise rotation, compact mode, signed/clamped bars, shared switch, zero/missing values, pending cancellation');
 const html=fs.readFileSync('index.html','utf8');for(const match of fs.readFileSync('phone-lab.js','utf8').matchAll(/\$\('([^']+)'\)/g))assert(html.includes('id="'+match[1]+'"'),'Missing UI element '+match[1]);
 console.log('PASS: explicit activation, permissions, null vs zero, axis mapping, calibration, location watch ID 0, background cleanup, partial denial, pending-permission exit');
})().catch(e=>{console.error(e);process.exitCode=1});
