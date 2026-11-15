/* Optional approximate forest visualization, not a survey of individual trees.
   One bounded local mesh, MapLibre's own WebGL context, no third-party renderer. */
(function(root){'use strict';
const R=6378137,rad=Math.PI/180,FOREST_SOURCE='cyklo-vegetation',MASK='cyklo-vegetation-mask',TREES='cyklo-vegetation-3d';
function normalize(s){
 if(!['map','realistic','forest'].includes(s.sceneMode))s.sceneMode='map';
 s.treeRadius=[200,350,500].includes(Number(s.treeRadius))?Number(s.treeRadius):350;
 if(s.vegetationDensity==null)s.vegetationDensity={sparse:50,normal:100,dense:150}[s.treeDensity]||100;
 s.vegetationDensity=Math.max(25,Math.min(200,Number(s.vegetationDensity)||100));
 if(!['auto','broadleaved','mixed','needleleaved'].includes(s.forestType))s.forestType='auto';
 s.treeScale=Math.max(50,Math.min(150,Number(s.treeScale)||100));
 if(!['off','subtle','rich'].includes(s.undergrowth))s.undergrowth='subtle';
 if(!['original','subtle','illustrated'].includes(s.surfaceStyle))s.surfaceStyle='subtle';
 if(!['auto','economy','high'].includes(s.vegetationQuality))s.vegetationQuality='auto';return s;
}
// These are regional visual estimates, never ecological measurements.
function vegetation(position,altitude,properties={},override='auto',seed=.5){
 const raw=properties.leaf_type||properties['leaf:type']||({deciduous:'broadleaved',coniferous:'needleleaved',mixed:'mixed'}[properties.wood]);
 let type=['broadleaved','needleleaved','mixed'].includes(raw)?raw:null,source=type?'map':'estimate';
 if(override!=='auto'){type=override;source='manual'}
 const central=position[0]>=5&&position[0]<=25&&position[1]>=45&&position[1]<=55;
 const known=central&&Number.isFinite(altitude),z=known?altitude:null;
 if(!type){const ratio=z===null?.5:z<450?.8:z<950?.65-(z-450)/500*.3:z<1350?.35-(z-950)/400*.25:.08;type=seed<ratio?'broadleaved':'needleleaved'}
 else if(type==='mixed')type=seed<.5?'broadleaved':'needleleaved';
 const scrub=['scrub','shrubbery','heath'].includes(properties.subclass)||properties.natural==='scrub';
 // An approximate high-altitude transition applies only in the regional fallback.
 const dwarf=source==='estimate'&&z!==null&&z>1450;
 if(scrub||dwarf)return {kind:'shrub',height:scrub?1.2+seed*2.2:1+seed*3,source};
 const taper=source==='estimate'&&z!==null?Math.max(.25,1-Math.max(0,z-1000)/650):1;
 return {kind:type,height:(type==='broadleaved'?16+seed*12:18+seed*15)*taper,source};
}
function project(c){return [R*c[0]*rad,R*Math.log(Math.tan(Math.PI/4+Math.max(-85,Math.min(85,c[1]))*rad/2))]}
function unproject(c){return [c[0]/R/rad,(2*Math.atan(Math.exp(c[1]/R))-Math.PI/2)/rad]}
function hash(x,y){let a=Math.imul(x|0,374761393)^Math.imul(y|0,668265263);a=Math.imul(a^(a>>>13),1274126177);return ((a^(a>>>16))>>>0)/4294967296}
function inRing(p,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside}
function inPolygon(p,rings){return rings.length&&inRing(p,rings[0])&&!rings.slice(1).some(r=>inRing(p,r))}
function distanceSegment(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
function polygons(features){const result=[];let vertices=0;for(const f of features.slice(0,160)){const g=f.geometry,groups=g?.type==='Polygon'?[g.coordinates]:g?.type==='MultiPolygon'?g.coordinates:[];for(const rings of groups){const count=rings.reduce((n,r)=>n+r.length,0);if(count>12000||vertices+count>60000)continue;vertices+=count;const r=rings.map(r=>r.map(project));if(!r[0]?.length)continue;let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const p of r[0]){x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1])}result.push({r,b:[x0,y0,x1,y1],properties:f.properties||{}});if(result.length>=160)return result}}return result}
function contains(p,polys){return polys.some(a=>p[0]>=a.b[0]&&p[0]<=a.b[2]&&p[1]>=a.b[1]&&p[1]<=a.b[3]&&inPolygon(p,a.r))}
function segments(features,route,center,extent){const lines=[route||[]];for(const f of features.slice(0,350)){const g=f.geometry;if(g?.type==='LineString')lines.push(g.coordinates);else if(g?.type==='MultiLineString')lines.push(...g.coordinates)}const result=[];for(const line of lines){for(let i=1;i<line.length;i++){if(result.length>=5000)return result;const a=project(line[i-1]),b=project(line[i]);if(center&&(Math.max(a[0],b[0])<center[0]-extent||Math.min(a[0],b[0])>center[0]+extent||Math.max(a[1],b[1])<center[1]-extent||Math.min(a[1],b[1])>center[1]+extent))continue;result.push([a,b])}}return result}
function sample(center,forests,excluded,roads,route,options={}){
 const radius=options.radius||350,density=Math.max(25,Math.min(200,Number(options.amount)||({sparse:50,normal:100,dense:150}[options.density]||100))),quality=options.quality||'auto',cap=quality==='high'?6000:quality==='economy'?1000:3000;
 const cos=Math.max(.09,Math.cos(Math.round(center[1]*10)/10*rad)),step=8/cos,c=project(center),extent=radius/cos,woods=polygons(forests),avoid=polygons(excluded),ways=segments(roads,route,c,extent+20/cos),out=[];
 for(let iy=Math.floor((c[1]-extent)/step);iy<=Math.ceil((c[1]+extent)/step);iy++)for(let ix=Math.floor((c[0]-extent)/step);ix<=Math.ceil((c[0]+extent)/step);ix++){
  const seed=hash(ix,iy);if(hash(ix+991,iy-772)>density/200)continue;
  const p=[(ix+.15+seed*.7)*step,(iy+.15+hash(iy,ix)*.7)*step],distance=Math.hypot(p[0]-c[0],p[1]-c[1])*cos;if(distance>radius)continue;
  const wood=woods.find(a=>p[0]>=a.b[0]&&p[0]<=a.b[2]&&p[1]>=a.b[1]&&p[1]<=a.b[3]&&inPolygon(p,a.r));if(!wood||contains(p,avoid))continue;
  if(ways.some(([a,b])=>p[0]>=Math.min(a[0],b[0])-9/cos&&p[0]<=Math.max(a[0],b[0])+9/cos&&p[1]>=Math.min(a[1],b[1])-9/cos&&p[1]<=Math.max(a[1],b[1])+9/cos&&distanceSegment(p,a,b)*cos<9))continue;
  const position=unproject(p),altitude=options.elevation?.(position),plant=vegetation(position,altitude,wood.properties,options.forestType||'auto',hash(ix+51,iy+99));
  // Sparse low edge shrubs stay inside the mapped forest, never invent a surrounding belt.
  if(plant.kind!=='shrub'&&options.undergrowth!=='off'&&seed<(options.undergrowth==='rich'?.3:.14)){
   const edge=8/cos;if(!contains([p[0]+edge,p[1]],woods)||!contains([p[0]-edge,p[1]],woods)||!contains([p[0],p[1]+edge],woods)||!contains([p[0],p[1]-edge],woods)){plant.kind='shrub';plant.height=1.2+seed*5}
  }
  out.push({position,...plant,height:plant.height*(options.scale||100)/100,seed,distance,lod:quality==='economy'||distance>220?'far':'near'});
 }
 return out.sort((a,b)=>a.distance-b.distance||a.seed-b.seed).slice(0,cap);
}
function mesh(trees,origin,elevation){
 const c=project(origin),cos=Math.cos(origin[1]*rad),v=new Float32Array(trees.length*228*6);let cursor=0;
 function tri(a,b,c,color){for(const p of [a,b,c]){v[cursor++]=p[0];v[cursor++]=p[1];v[cursor++]=p[2];v[cursor++]=color[0];v[cursor++]=color[1];v[cursor++]=color[2]}}
 for(const tree of trees){const base=elevation(tree.position);if(!Number.isFinite(base))continue;
  const p=project(tree.position),x=(p[0]-c[0])*cos,y=(p[1]-c[1])*cos,h=tree.height,seed=tree.seed,far=tree.lod==='far',kind=tree.kind||'needleleaved';
  const green=kind==='broadleaved'?[.24+seed*.07,.47+seed*.1,.16]:kind==='shrub'?[.29,.43+seed*.08,.16]:[.1,.32+seed*.08,.18];
  const color=angle=>green.map((n,i)=>n*(.78+.22*Math.cos(angle-1)));
  if(kind!=='shrub'&&!far){const r=.22;for(let i=0;i<3;i++){const a=i*Math.PI*2/3,b=(i+1)*Math.PI*2/3,A=[x+Math.cos(a)*r,y+Math.sin(a)*r,base],B=[x+Math.cos(b)*r,y+Math.sin(b)*r,base],C=[B[0],B[1],base+h*.6],D=[A[0],A[1],base+h*.6];tri(A,B,C,[.28,.2,.12]);tri(A,C,D,[.28,.2,.12])}}
  if(kind==='needleleaved'){
   const r=h*(.19+seed*.05),sides=far?5:7;
   for(const [z,top,width]of (far?[[h*.2,h,r]]:[[h*.22,h*.8,r],[h*.48,h,r*.72]]))for(let i=0;i<sides;i++){const a=i*Math.PI*2/sides,b=(i+1)*Math.PI*2/sides;tri([x+Math.cos(a)*width,y+Math.sin(a)*width,base+z],[x+Math.cos(b)*width,y+Math.sin(b)*width,base+z],[x,y,base+top],color(a))}
  }else{
   // Closed, irregular ellipsoid: broad crowns and low shrub clumps.
   const sides=far?5:7,rings=far?3:5,r=h*(kind==='shrub'?.7:.29+seed*.08),bottom=kind==='shrub'?0:h*.34;
   const point=(j,i)=>{const lat=-Math.PI/2+Math.PI*j/rings,a=i*Math.PI*2/sides,w=Math.cos(lat)*r*(1+.1*Math.sin(i*3+seed*8));return [x+Math.cos(a)*w,y+Math.sin(a)*w*(.86+seed*.2),base+bottom+(Math.sin(lat)+1)/2*(h-bottom)]};
   for(let j=0;j<rings;j++)for(let i=0;i<sides;i++){const a=point(j,i),b=point(j,i+1),c=point(j+1,i+1),d=point(j+1,i);tri(a,b,c,color(i*2*Math.PI/sides));tri(a,c,d,color(i*2*Math.PI/sides))}
  }
 }
 return v.subarray(0,cursor);
}
// Small original procedural patterns, generated once; no external texture downloads.
function pattern(kind){const width=64,data=new Uint8Array(width*width*4),base={grass:[125,153,82],scrub:[100,133,70],field:[174,151,91],forest:[76,113,58]}[kind];for(let y=0;y<width;y++)for(let x=0;x<width;x++){const noise=(hash(x,y)-.5)*18,stripe=kind==='field'?(x%8<2?-17:4):kind==='grass'?Math.sin(x*2+y)*4:Math.sin(x*.7)*Math.cos(y*.8)*9;const i=(y*width+x)*4;for(let c=0;c<3;c++)data[i+c]=Math.max(0,Math.min(255,base[c]+noise+stripe));data[i+3]=255}return {width,height:width,data}}
function localMatrix(matrix,origin){const scale=origin.meterInMercatorCoordinateUnits(),out=new Float32Array(16);for(let i=0;i<4;i++){out[i]=matrix[i]*scale;out[4+i]=-matrix[4+i]*scale;out[8+i]=matrix[8+i]*scale;out[12+i]=matrix[i]*origin.x+matrix[4+i]*origin.y+matrix[8+i]*(origin.z||0)+matrix[12+i]}return out}
function compile(gl,type,text){const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw Error('Shader stromů se nepodařilo přeložit')}return s}
class Forest{
 constructor(map,settings,status,route=()=>[]){this.map=map;this.settings=normalize(settings);this.status=status;this.route=route;this.closed=false;this.count=0;this.failed=false;this.listeners=[];this.lastBuild=0;this.dataRevision=0;this.onData=e=>{if(e?.sourceId===FOREST_SOURCE||String(e?.sourceId||'').startsWith('cyklo-relief-')){if(e.tile)this.dataRevision++;this.schedule()}else if(e?.type==='moveend')this.schedule()};for(const event of ['moveend','sourcedata']){map.on(event,this.onData);this.listeners.push(event)}}
 active(){return this.settings.sceneMode==='forest'&&this.settings.mapMode==='3d'&&!this.settings.economyMode}
 surfacesOn(){return this.settings.surfaceStyle!=='original'&&this.settings.sceneMode!=='realistic'&&!this.settings.economyMode}
 applySurfaces(){const m=this.map,on=this.surfacesOn();for(const kind of ['forest','grass','scrub','field']){
  const id='cyklo-surface-'+kind,image='cyklo-pattern-'+kind;
  if(!on){if(m.getLayer(id))m.removeLayer(id);continue}
  if(!m.hasImage?.(image))m.addImage(image,pattern(kind));
  const filter=kind==='forest'?['==',['get','class'],'wood']:kind==='field'?['match',['get','subclass'],['farmland','farm'],true,false]:kind==='scrub'?['match',['get','subclass'],['scrub','shrubbery','heath'],true,false]:['all',['==',['get','class'],'grass'],['!', ['match',['get','subclass'],['scrub','shrubbery','heath'],true,false]]];
  const opacity=this.settings.surfaceStyle==='illustrated'?.72:.2;
  if(!m.getLayer(id))m.addLayer({id,type:'fill',minzoom:12,source:FOREST_SOURCE,'source-layer':'landcover',filter,paint:{'fill-pattern':image,'fill-opacity':opacity}},this.before());else m.setPaintProperty(id,'fill-opacity',opacity);
 }}
 apply(){if(this.closed)return;normalize(this.settings);if(!this.active()&&!this.surfacesOn()){this.remove();this.status(this.settings.sceneMode==='forest'?'Stromy jsou ve 2D a úsporném režimu vypnuté.':'3D vegetace vypnutá.');return}if(this.failed)return;try{
  if(!this.map.getSource(FOREST_SOURCE))this.map.addSource(FOREST_SOURCE,{type:'vector',url:'https://tiles.openfreemap.org/planet',attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · <a href="https://openfreemap.org/">OpenFreeMap</a>'});
  this.applySurfaces();
  if(!this.active()){for(const id of [TREES,MASK])if(this.map.getLayer(id))this.map.removeLayer(id);this.clear();this.buildKey='';this.status('3D stromy vypnuté · textury krajiny jsou zapnuté.');return}
  if(!this.map.getLayer(MASK))this.map.addLayer({id:MASK,type:'fill',minzoom:12,source:FOREST_SOURCE,'source-layer':'landcover',filter:['match',['get','class'],['wood','grass'],true,false],paint:{'fill-opacity':0.001}},this.before());
  if(!this.map.getLayer(TREES))this.map.addLayer(this.layer(),this.before());
  const key=[this.settings.treeRadius,this.settings.vegetationDensity,this.settings.forestType,this.settings.treeScale,this.settings.undergrowth,this.settings.vegetationQuality,this.settings.terrainEnabled,this.settings.terrainExaggeration].join(':');if(key!==this.key){this.key=key;this.lastBuild=0}this.schedule()
 }catch{this.fail()}}
 before(){return (this.map.getStyle()?.layers||[]).find(l=>l.id==='ride-border'||l.type==='symbol')?.id}
 schedule(){if(this.closed||!this.active()||this.failed||this.timer)return;this.timer=setTimeout(()=>{this.timer=null;this.build()},Math.max(100,1000-(Date.now()-this.lastBuild)))}
 build(){if(this.closed||!this.active()||this.failed)return;this.lastBuild=Date.now();try{const m=this.map;if(m.getZoom()<12){this.clear();this.status('Pro 3D stromy přibliž mapu (zoom alespoň 12).');return}const terrain=!!this.settings.terrainEnabled;if(terrain&&(!m.getTerrain?.()||m.isSourceLoaded&&!m.isSourceLoaded('cyklo-relief-dem'))){this.clear();this.status('Stromy čekají na výškový podklad.');return}const pos=m.getCenter(),xy=project([pos.lng,pos.lat]),buildKey=[Math.floor(xy[0]/40),Math.floor(xy[1]/40),Math.floor(m.getZoom()),this.key,this.dataRevision].join(':');if(buildKey===this.buildKey)return;this.buildKey=buildKey;const q=(sourceLayer,filter)=>m.querySourceFeatures(FOREST_SOURCE,{sourceLayer,...(filter?{filter}: {})});const forest=q('landcover',['any',['==','class','wood'],['in','subclass','scrub','shrubbery','heath']]),excluded=[...q('water'),...q('building')],roads=q('transportation'),center=m.getCenter();const origin=[center.lng,center.lat];const trees=sample(origin,forest,excluded,roads,this.route(),{radius:this.settings.treeRadius,amount:this.settings.vegetationDensity,forestType:this.settings.forestType,scale:this.settings.treeScale,quality:this.settings.vegetationQuality,undergrowth:this.settings.undergrowth,elevation:p=>{const z=m.queryTerrainElevation?.(p);return Number.isFinite(z)?z/(Number(this.settings.terrainExaggeration)||1):null}});const heights=trees.map(t=>terrain?m.queryTerrainElevation(t.position):0);this.buildMesh(trees,origin,heights);const counts=trees.reduce((a,t)=>(a[t.kind]=(a[t.kind]||0)+1,a),{});this.status(trees.length?'Přibližná vegetace · '+trees.length+' prvků · listnaté '+(counts.broadleaved||0)+' / jehličnaté '+(counts.needleleaved||0)+' / nízké '+(counts.shrub||0)+' · '+(this.settings.forestType==='auto'?(trees.some(t=>t.source==='estimate')?'mapová data + regionální odhad':'mapová data'):'ruční typ lesa'):'V načtené oblasti nejsou dostupné lesní plochy.')}catch{this.fail()}}
 buildMesh(trees,origin,heights){
  const id=this.meshRevision=(this.meshRevision||0)+1;
  const accept=vertices=>{if(this.closed||id!==this.meshRevision||!this.active())return;this.vertices=vertices;this.origin=origin;this.count=vertices.length/6;this.dirty=true;this.map.triggerRepaint()};
  if(typeof root.Worker==='function'&&!this.workerDisabled){try{
   if(!this.worker){this.worker=new root.Worker(new URL('./landscape-worker.js',document.baseURI));this.worker.onmessage=e=>{if(e.data.id!==this.meshRevision)return;clearTimeout(this.workerTimer);if(e.data.error)this.workerFailed();else this.meshAccept?.(e.data.vertices)};this.worker.onerror=()=>this.workerFailed()}
   this.meshAccept=accept;clearTimeout(this.workerTimer);this.workerTimer=setTimeout(()=>this.workerFailed(),10000);this.worker.postMessage({id,trees,origin,heights});return;
  }catch{this.workerFailed();return}}
  let i=0;accept(mesh(trees,origin,()=>heights[i++]));
 }
 workerFailed(){clearTimeout(this.workerTimer);this.worker?.terminate();this.worker=null;this.workerDisabled=true;this.buildKey='';this.meshRevision=(this.meshRevision||0)+1;this.schedule()}
 clear(){this.meshRevision=(this.meshRevision||0)+1;this.count=0;this.vertices=new Float32Array();this.dirty=true;this.map.triggerRepaint?.()}
 layer(){const owner=this;return {id:TREES,type:'custom',renderingMode:'3d',onAdd(map,gl){owner.gl=gl;try{owner.shaders=[];const vs=compile(gl,gl.VERTEX_SHADER,'#version 300 es\nlayout(location=0) in vec3 a_pos; layout(location=1) in vec3 a_color; uniform mat4 u_matrix; out vec3 v_color; void main(){gl_Position=u_matrix*vec4(a_pos,1.0);v_color=a_color;}');owner.shaders.push(vs);const fs=compile(gl,gl.FRAGMENT_SHADER,'#version 300 es\nprecision mediump float; in vec3 v_color; out vec4 color; void main(){color=vec4(v_color,1.0);}');owner.shaders.push(fs);owner.program=gl.createProgram();gl.attachShader(owner.program,vs);gl.attachShader(owner.program,fs);gl.linkProgram(owner.program);if(!gl.getProgramParameter(owner.program,gl.LINK_STATUS))throw Error('Program stromů není dostupný');owner.buffer=gl.createBuffer();owner.vao=gl.createVertexArray();owner.uniform=gl.getUniformLocation(owner.program,'u_matrix');}catch{owner.disposeGL(gl);owner.fail()}},render(gl,args){if(owner.failed||!owner.count||!owner.origin||!owner.active())return;const matrix=args?.defaultProjectionData?.projectionMatrix||args?.defaultProjectionData?.mainMatrix||args;if(!matrix||matrix.length!==16)return;const old={program:gl.getParameter(gl.CURRENT_PROGRAM),buffer:gl.getParameter(gl.ARRAY_BUFFER_BINDING),vao:gl.getParameter(gl.VERTEX_ARRAY_BINDING),depth:gl.isEnabled(gl.DEPTH_TEST),cull:gl.isEnabled(gl.CULL_FACE),blend:gl.isEnabled(gl.BLEND),mask:gl.getParameter(gl.DEPTH_WRITEMASK)};try{gl.useProgram(owner.program);gl.bindVertexArray(owner.vao);gl.bindBuffer(gl.ARRAY_BUFFER,owner.buffer);if(owner.dirty){gl.bufferData(gl.ARRAY_BUFFER,owner.vertices,gl.DYNAMIC_DRAW);owner.dirty=false}gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,24,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,24,12);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);const p=maplibregl.MercatorCoordinate.fromLngLat(owner.origin,0);gl.uniformMatrix4fv(owner.uniform,false,localMatrix(matrix,p));gl.drawArrays(gl.TRIANGLES,0,owner.count)}finally{gl.bindVertexArray(old.vao);gl.bindBuffer(gl.ARRAY_BUFFER,old.buffer);gl.useProgram(old.program);for(const [name,on]of [[gl.DEPTH_TEST,old.depth],[gl.CULL_FACE,old.cull],[gl.BLEND,old.blend]])on?gl.enable(name):gl.disable(name);gl.depthMask(old.mask)}},onRemove(map,gl){owner.disposeGL(gl)}}}
 disposeGL(gl=this.gl){if(!gl)return;if(this.buffer)gl.deleteBuffer(this.buffer);if(this.vao)gl.deleteVertexArray(this.vao);if(this.program)gl.deleteProgram(this.program);for(const shader of this.shaders||[])gl.deleteShader(shader);this.buffer=this.vao=this.program=null;this.shaders=[];this.count=0}
 remove(){clearTimeout(this.workerTimer);this.worker?.terminate();this.worker=null;this.meshAccept=null;clearTimeout(this.timer);this.timer=null;for(const id of [TREES,MASK,...['forest','grass','scrub','field'].map(k=>'cyklo-surface-'+k)])if(this.map.getLayer(id))this.map.removeLayer(id);for(const k of ['forest','grass','scrub','field'])if(this.map.hasImage?.('cyklo-pattern-'+k))this.map.removeImage('cyklo-pattern-'+k);if(this.map.getSource(FOREST_SOURCE))this.map.removeSource(FOREST_SOURCE);this.clear();this.key='';this.buildKey=''}
 handles(e){if((e?.sourceId||e?.error?.sourceId)===FOREST_SOURCE){this.fail();return true}return false}
 fail(){if(this.failed)return;this.failed=true;this.clear();this.status('3D vegetace není dostupná · podklad a navigace pokračují. Zkus Obnovit vegetaci.')}
 retry(){this.remove();this.failed=false;this.apply()}
 destroy(){if(this.closed)return;this.closed=true;clearTimeout(this.timer);for(const event of this.listeners)this.map.off?.(event,this.onData);this.remove();this.disposeGL();this.map=null}
}
root.CykloLandscape={normalize,sample,mesh,vegetation,pattern,inPolygon,localMatrix,Forest};if(typeof module!=='undefined')module.exports=root.CykloLandscape;
})(globalThis);
