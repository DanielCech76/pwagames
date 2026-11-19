'use strict';

let frame = 'none';
let sceneLocked = false;
let rimMm = 5;
let minimumMm = 1.6;

const circleOptions = ['none', 'circle', 'eye'];
const hangingTypes = new Set(['bell', 'bauble']);
const mmToUnits = mm => mm * W / outputMm;

function circleGeometry() {
 const radius = Math.min(W,H) * (frame === 'eye' ? .435 : .47);
 return {x:W/2,y:H*(frame==='eye'?.543:.5),radius,rim:Math.min(radius*.4,mmToUnits(rimMm))};
}

function drawHangers(c, scale, circle) {
 for (const item of objects) {
  if (!hangingTypes.has(item.type) || item.hanging === false) continue;
  const offset = item.x-circle.x;
  if (Math.abs(offset)>=circle.radius) continue;
  const inner = Math.max(0,circle.radius-circle.rim);
  const top = circle.y-Math.sqrt(Math.max(0,inner**2-offset**2))-circle.rim*.6;
  const end = bounds(item).top+Math.min(12,(item.height*(item.scaleY??1))*.15);
  if (end<=top) continue;
  const width = mmToUnits(item.cordMm??3);
  c.fillRect((item.x-width/2)*scale,top*scale,width*scale,(end-top)*scale);
 }
}

function completeCircle(c,scale,circle) {
 const {x,y,radius,rim}=circle;
 c.save();
 c.scale(scale,scale);
 c.globalCompositeOperation='destination-in';
 c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.fill();
 c.globalCompositeOperation='source-over';
 c.fillStyle='#000';
 c.beginPath();
 c.arc(x,y,radius,0,Math.PI*2);
 c.moveTo(x+radius-rim,y);
 c.arc(x,y,radius-rim,0,Math.PI*2,true);
 c.fill();
 if(frame==='eye'){
  const outer=Math.max(rim*1.45,radius*.065);
  const eyeY=y-radius-outer+rim*.6;
  c.beginPath();c.arc(x,eyeY,outer,0,Math.PI*2);
  c.moveTo(x+outer-rim*.75,eyeY);
  c.arc(x,eyeY,outer-rim*.75,0,Math.PI*2,true);
  c.fill();
 }
 c.restore();
}

function applyCirclePreset(name) {
 const designs={
  empty:[],
  bells:[
   ['bell',{x:380,y:435,height:192}],['bell',{x:635,y:552,height:163,cordMm:2.5}],
   ['spruce',{x:335,y:812,height:236,variant:3,treeStyle:1}],['house',{x:595,y:810,height:154,village:0}],
   ['snow',{x:116,y:518,height:109}],['snow',{x:827,y:453,height:109}]
  ],
  village:[
   ['house',{x:297,y:825,height:175,village:0}],['church',{x:480,y:827,height:264,village:1}],
   ['house',{x:663,y:825,height:175,village:2}],
   ['needle',{x:108,y:547,height:155,variant:0,rotation:31}],
   ['needle',{x:852,y:548,height:155,variant:1,mirrored:true,rotation:-31}]
  ],
  wreath:[
   ['house',{x:480,y:809,height:230,village:0}],
   ['needle',{x:88,y:588,height:271,variant:4,rotation:49}],
   ['needle',{x:872,y:587,height:271,variant:5,mirrored:true,rotation:-49}],
   ['needle',{x:139,y:723,height:198,variant:2,rotation:56}],
   ['needle',{x:820,y:723,height:198,variant:6,mirrored:true,rotation:-56}]
  ]
 };
 if(!Object.hasOwn(designs,name))return;
 clearTimeout(validationTimer);
 frame='eye';sceneLocked=false;base=name==='empty'?0:28;
 outputMm=200;pageHeightMm=200;fullPage=true;
 syncCanvasDimensions(960,960);
 objects=[];nextId=1;
 for(const [type,options] of designs[name]) add(type,options);
 selected=null;
 $('mm').value=outputMm;
 $('base').value=base;
 $('base-value').textContent=base;
 $('context').hidden=true;$('size-panel').hidden=true;
 refresh();
}

function setSceneLock(locked) {
 sceneLocked=locked;
 if(drag){clearTimeout(drag.timer);drag=null;}
 $('context').hidden=true;$('size-panel').hidden=true;
 if(locked)selected=null;
 refresh();
}

function syncCircleControls() {
 $('frame').value=frame;
 $('rim-width').value=rimMm;
 $('minimum-width').value=minimumMm;
 $('frame-settings').hidden=frame==='none';
 $('scene-lock').setAttribute('aria-pressed',sceneLocked);
 $('scene-lock').textContent=sceneLocked?'Odemknout':'Zamknout';
 for(const id of ['setup-open','project-new','page-open','toggle-base','project-load','frame','circle-preset','rim-width','minimum-width','library','scene-layers','empty-building','wide-inspector','scene-tools']){
  const el=$(id);
  el.inert=sceneLocked;
  if(el instanceof HTMLButtonElement||el instanceof HTMLSelectElement||el instanceof HTMLInputElement)el.disabled=sceneLocked;
 }
 stage.classList.toggle('scene-locked',sceneLocked);
}

// Erode the silhouette by half the required width and test the remaining core.
function hasStrongConnections({mask,w,h,scale},required=minimumMm) {
 const radius=mmToUnits(required)*scale/2;
 const limit=Math.max(1,Math.floor(radius*3+.5));
 const distance=new Uint16Array(mask.length);
 const core=new Uint8Array(mask.length);
 for(let y=0;y<h;y++){
  for(let x=0;x<w;x++){
   const i=y*w+x;
   if(!mask[i])continue;
   if(!x||!y||x===w-1||y===h-1){distance[i]=3;continue;}
   distance[i]=Math.min(limit+4,distance[i-1]+3,distance[i-w]+3,distance[i-w-1]+4,distance[i-w+1]+4);
  }
 }
 for(let y=h-2;y>0;y--){
  for(let x=w-2;x>0;x--){
   const i=y*w+x;
   if(mask[i])distance[i]=Math.min(distance[i],distance[i+1]+3,distance[i+w]+3,distance[i+w-1]+4,distance[i+w+1]+4);
  }
 }
 for(let i=0;i<core.length;i++)core[i]=mask[i]&&distance[i]>limit;
 const result=labelMask(core,w,h,scale);
 if(result.components===0)return false;
 const areas=new Uint32Array(result.components+1);
 const tolerance=Math.max(2,Math.ceil(radius));
 for(const id of result.problem){
  if(id&&id!==result.keeper&&++areas[id]>tolerance)return false;
 }
 return true;
}

function syncFramePosition(item) {
 $('frame-position').hidden=frame==='none'||!item;
 if($('frame-position').hidden)return;
 const cord=hangingTypes.has(item.type)&&item.hanging!==false;
 $('frame-cord-label').hidden=!cord;
 $('frame-x').value=(item.x/mmToUnits(1)).toFixed(1);
 $('frame-y').value=(item.y*outputMm/W).toFixed(1);
 if(cord)$('frame-cord').value=item.cordMm??3;
}

function updateFramePosition(key,value) {
 const item=selectedObject();
 if(!item||sceneLocked)return;
 if(Number.isFinite(value)){
  if(key==='cordMm')item.cordMm=clamp(value,.4,10);
  else item[key]=mmToUnits(value);
  keepOnCanvas(item);
 }
 refresh();
}
