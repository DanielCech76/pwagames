/* Explicit, bounded downloads. A completed pack is committed only by the caller. */
(function(root){'use strict';const G=root.GeoLook;
const namesSnapshotBase=root.document?.currentScript?.src?new URL('../../../ar-place-data/v1/',root.document.currentScript.src).href:null;
function parsePlaces(json,center,radius){if(json.remark)throw Error('Služba míst nedokončila dotaz. Zkus menší dosah nebo později.');const out=[];for(const e of json.elements||[]){const t=e.tags||{},p={lon:e.lon??e.center?.lon,lat:e.lat??e.center?.lat};if(!Number.isFinite(p.lon)||!Number.isFinite(p.lat)||!t.name||G.distance(center,p)>radius)continue;const raw=String(t.ele||'').trim().replace(',','.'),alt=/^-?\d+(\.\d+)?(\s*m)?$/.test(raw)?Number.parseFloat(raw):null;out.push({...p,id:e.type+'/'+e.id,name:String(t['name:cs']||t.name).slice(0,120),alt:Number.isFinite(alt)&&alt>=-500&&alt<=9000?alt:null,depth:Number.isFinite(Number.parseFloat(t.depth))&&Number.parseFloat(t.depth)>=0?Number.parseFloat(t.depth):null,prominence:Number.isFinite(Number.parseFloat(t.prominence))?Number.parseFloat(t.prominence):null,population:Number.isFinite(Number.parseInt(t.population,10))?Number.parseInt(t.population,10):null,type:t.natural==='sinkhole'?'Propast':t.natural==='peak'?'Vrchol':t.waterway?'Řeka':t.natural==='water'?'Jezero':t.place==='sea'?'Moře':['city','town'].includes(t.place)?'Město':t.place?'Obec':t.historic?'Památka':'Vyhlídka',rank:t.natural==='peak'?1:['city','town'].includes(t.place)?0:2})}return out.sort((a,b)=>a.rank-b.rank||G.distance(center,a)-G.distance(center,b)).slice(0,1500)}
function cancelled(){return new DOMException('Zrušeno uživatelem','AbortError')}
function checkAbort(signal){if(signal?.aborted)throw cancelled()}
async function request(url,options={},signal,ms=30000,label='Server',onBytes){
 const c=new AbortController();let timedOut=false,settled=false,reader,timer,abort;
 const timeoutError=()=>{const e=Error(label+': časový limit '+ms/1000+' s vypršel.');e.name='TimeoutError';e.code='TIMEOUT';return e};
 const deadline=new Promise((_,reject)=>{abort=()=>{settled=true;reject(cancelled());c.abort();reader?.cancel().catch(()=>{})};signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();timer=setTimeout(()=>{timedOut=true;settled=true;reject(timeoutError());c.abort();reader?.cancel().catch(()=>{})},ms)});
 const operation=(async()=>{
  const {image,binary,...init}=options;checkAbort(signal);const r=await fetch(url,{...init,signal:c.signal,credentials:'omit'});
  if(c.signal.aborted){r.body?.cancel().catch(()=>{});throw cancelled()}
  if(!r.ok){const e=Error(label+': server vrátil HTTP '+r.status+'.');e.code='HTTP';throw e}
  if((image||binary)&&r.body?.getReader){reader=r.body.getReader();const chunks=[];let received=0;const total=Number(r.headers.get('Content-Length'))||0;try{for(;;){const next=await reader.read();if(next.done)break;checkAbort(c.signal);chunks.push(next.value);received+=next.value.byteLength;if(!settled)onBytes?.(received,total)}return new Blob(chunks,{type:r.headers.get('Content-Type')||'image/png'})}finally{reader.releaseLock?.()}}
  return await (image||binary?r.blob():r.json());
 })();
 try{return await Promise.race([operation,deadline])}catch(error){
  if(signal?.aborted)throw cancelled();if(timedOut)throw timeoutError();
  if(error.code==='HTTP')throw error;
  const e=Error(label+': '+(error.name==='SyntaxError'?'neplatná odpověď serveru.':'požadavek selhal (síť, přístup nebo CORS).'));e.code='NETWORK';throw e;
 }finally{settled=true;clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}

function snapshotCells(center,radius){const a=G.offset(center,-radius,-radius),b=G.offset(center,radius,radius),out=[];for(let lat=Math.floor(a.lat);lat<=Math.floor(b.lat);lat++)for(let lon=Math.floor(a.lon);lon<=Math.floor(b.lon);lon++)out.push(lat+'_'+lon);if(out.length>36)throw Error('Příliš velký dosah katalogu názvů.');return out}
function snapshotPoint(r){if(!Array.isArray(r)||r.length<7||!Number.isInteger(r[0])||r[0]<=0||typeof r[1]!=='string'||!Number.isFinite(r[2])||Math.abs(r[2])>180||!Number.isFinite(r[3])||Math.abs(r[3])>85||!Number.isInteger(r[4])||r[4]<0||r[4]>8)return null;return {id:'geonames/'+r[0],name:r[1].slice(0,120),lon:r[2],lat:r[3],type:['Město','Obec','Vrchol','Jezero','Památka','Místo','Část obce','Průsmyk','Hřeben'][r[4]],alt:Number.isFinite(r[5])&&r[5]>=-500&&r[5]<=9000?r[5]:null,rank:Number.isFinite(r[6])?G.clamp(r[6],0,4):3}}
async function snapshotJSON(blob,signal){checkAbort(signal);if(blob.size>8000000)throw Error('Katalog názvů je příliš velký.');const head=new Uint8Array(await blob.slice(0,2).arrayBuffer());let data;if(head[0]===31&&head[1]===139){if(!root.DecompressionStream)throw Error('Prohlížeč nepodporuje rozbalení katalogu.');data=await new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).json()}else data=JSON.parse(await blob.text());checkAbort(signal);if(data?.format!==1||!Array.isArray(data.rows)||data.rows.length>50000)throw Error('Neplatný katalog názvů.');return data}
async function snapshotPlaces(center,radius,signal,progress,options={}){
 const base=options.namesBase||namesSnapshotBase;if(!base)return null;
 const cache=options.placeCache;let index;try{index=await cache?.get('v1/index')}catch{}checkAbort(signal);
 if(!index){progress({phase:'names',percent:85,text:'Načítám katalog názvů ze serveru aplikace…',requestTimeout:10000});index=await request(new URL('index.json',base).href,{},signal,10000,'Katalog názvů aplikace');if(index?.format!==1||!index.cells||!index.global)throw Error('Neplatný index názvů.');try{await cache?.put('v1/index',index)}catch{}}
 if(index?.format!==1||!index.cells||!index.global)throw Error('Neplatný index názvů.');
 const detail=snapshotCells(center,radius).map(k=>index.cells[k]).filter(Boolean),files=[index.global,...detail],places=new Map();let done=0,cached=0;
 for(const record of files){checkAbort(signal);if(!/^(cities|-?\d{1,2}_-?\d{1,3})\.json\.gz$/.test(record.file))throw Error('Neplatná cesta katalogu názvů.');let data;try{data=await cache?.get('v1/'+record.file)}catch{}checkAbort(signal);
  if(data?.format===1&&Array.isArray(data.rows)&&data.rows.length<=50000)cached++;else{progress({phase:'names',percent:85+Math.floor(done/files.length*10),text:'Názvy '+(done+1)+'/'+files.length+' · katalog aplikace',requestTimeout:10000});const blob=await request(new URL(record.file,base).href,{binary:true},signal,10000,'Katalog názvů · '+record.file,(bytes,total)=>progress({phase:'names',percent:85+Math.floor((done+(total?Math.min(.95,bytes/total):0))/files.length*10),text:'Názvy '+(done+1)+'/'+files.length+' · katalog aplikace',tileBytes:bytes,tileTotal:total}));data=await snapshotJSON(blob,signal);try{await cache?.put('v1/'+record.file,data)}catch{}}
  for(const row of data.rows){const p=snapshotPoint(row);if(p&&G.distance(center,p)<=radius)places.set(p.id,p)}done++;progress({phase:'names',percent:85+Math.floor(done/files.length*10),done,total:files.length,cached,text:'Názvy '+done+'/'+files.length+' · katalog aplikace'});
 }
 return {places:[...places.values()].sort((a,b)=>a.rank-b.rank||G.distance(center,a)-G.distance(center,b)).slice(0,G.clamp(options.maxPlaces||1500,1500,6000)),source:'GeoNames',scope:detail.length?'regional':'global-cities',snapshot:index.snapshot};
}

let preferredTerrain=null;
const terrainProviders=[{name:'Mapterhorn',url:key=>'https://tiles.mapterhorn.com/9/'+key+'.webp',timeout:15000},{name:'AWS Terrain Tiles',url:key=>'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/9/'+key+'.png',timeout:30000}];
async function pixels(blob){const bitmap=await createImageBitmap(blob,{colorSpaceConversion:'none',premultiplyAlpha:'none'});try{const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(bitmap,0,0);return {width:bitmap.width,height:bitmap.height,data:c.getImageData(0,0,bitmap.width,bitmap.height).data}}finally{bitmap.close()}}
async function download(center,radius,signal,progress=()=>{},options={}){
 if(!Number.isFinite(center.lon)||!Number.isFinite(center.lat)||Math.abs(center.lat)>75||Math.abs(center.lon)>179)throw Error('Tato oblast není podporovaná.');
 checkAbort(signal);radius=G.clamp(radius,5000,60000);
 const n=129,pack={format:1,center:{lon:center.lon,lat:center.lat},radius,n,created:Date.now(),grid:[],places:[],namesComplete:false,sources:[]},cells=new Map(),extent=512;
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const p=G.offset(center,(i/(n-1)*2-1)*radius,(j/(n-1)*2-1)*radius),x=(p.lon+180)/360*extent,y=(1-Math.asinh(Math.tan(p.lat*G.D))/Math.PI)/2*extent,key=Math.floor(x)+'/'+Math.floor(y);if(!cells.has(key))cells.set(key,[]);cells.get(key).push({index:j*n+i,x:x%1,y:y%1})}
 if(cells.size>36)throw Error('Příliš velká oblast. Zmenši dosah.');
 let done=0,cached=0,bytes=0;const total=cells.size;
 const emit=(text,extra={})=>progress({phase:'terrain',percent:Math.floor(done/total*80),done,total,cached,bytes,text,...extra});
 emit('Připravuji '+total+' výškových dlaždic…');
 for(const [key,points]of cells){
  checkAbort(signal);let image=null,source=null;
  try{const record=await options.cache?.get(key);if(record?.blob){image=await pixels(record.blob);source=record.source||'Místní cache';cached++}}catch{}checkAbort(signal);
  if(!image){const errors=[],providers=preferredTerrain?[preferredTerrain,...terrainProviders.filter(p=>p!==preferredTerrain)]:terrainProviders;for(const [attempt,provider]of providers.entries()){
   emit('Terén '+(done+1)+'/'+total+' · '+provider.name+' · 9/'+key);
   try{const blob=await request(provider.url(key),{image:true},signal,provider.timeout,provider.name+' · dlaždice 9/'+key,(received,size)=>emit('Terén '+(done+1)+'/'+total+' · '+provider.name,{percent:Math.floor((done+(size?Math.min(.95,received/size):0))/total*80),tileBytes:received,tileTotal:size}));checkAbort(signal);image=await pixels(blob);checkAbort(signal);source=provider.name;preferredTerrain=provider;bytes+=blob.size||0;try{await options.cache?.put(key,{blob,source})}catch(e){pack.cacheWarning='Dlaždice se nepodařilo uložit do mezipaměti.'}break;
   }catch(e){checkAbort(signal);errors.push(e.message);emit(e.message+(attempt===0?' Zkouším jiný zdroj…':''))}
  }if(!image)throw Error('Terén se nepodařilo stáhnout. '+errors.join(' '))}
  for(const p of points){const k=(Math.min(image.height-1,Math.floor(p.y*image.height))*image.width+Math.min(image.width-1,Math.floor(p.x*image.width)))*4;pack.grid[p.index]=Math.round(image.data[k]*256+image.data[k+1]+image.data[k+2]/256-32768)}
  if(!pack.sources.includes(source))pack.sources.push(source);done++;emit('Terén '+done+'/'+total+' dokončen · z cache '+cached);
 }
 const known=new Map();for(const previous of options.previous||[])for(const p of previous.places||[])if(G.distance(center,p)<=radius)known.set(p.id||p.name,p);pack.places=[...known.values()].slice(0,1500);
 const same=options.previous?.find(p=>valid(p)&&p.namesComplete!==false&&G.distance(center,p.center)+radius<=p.radius+1);
 if(same){pack.places=same.places.filter(p=>G.distance(center,p)<=radius);pack.namesComplete=true;pack.namesSource=same.namesSource||'OpenStreetMap';pack.namesScope=same.namesScope;pack.namesSnapshot=same.namesSnapshot}
 // Commit a complete terrain snapshot before starting any independent place request.
 emit('Terén stažený. Ukládám jej pro okamžité použití…',{phase:'terrain-ready',percent:82});
 await options.onTerrain?.({...pack,places:pack.places.map(p=>({...p}))});checkAbort(signal);
 if(same)emit('Názvy míst jsou již uložené.',{phase:'names',percent:95});
 else{
  let snapshot=null;try{snapshot=await snapshotPlaces(center,radius,signal,e=>emit(e.text,e),options)}catch(e){checkAbort(signal);pack.snapshotError=e.message}
  if(snapshot){pack.places=snapshot.places;pack.namesComplete=true;pack.namesSource=snapshot.source;pack.namesScope=snapshot.scope;pack.namesSnapshot=snapshot.snapshot}
 }
 if(!pack.namesComplete){
  const around=`(around:${radius},${center.lat},${center.lon})`,query=`[out:json][timeout:8][maxsize:8388608];(nwr[natural=peak][name]${around};node[place~"^(city|town|village)$"][name]${around};nwr[tourism=viewpoint][name]${around};nwr[historic~"^(castle|ruins)$"][name]${around};);out center;`,errors=[],endpoints=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
  for(const [i,endpoint]of endpoints.entries()){
   emit('Terén připraven · názvy '+(i+1)+'/'+endpoints.length+' · '+new URL(endpoint).hostname,{phase:'names',percent:85+i*5,requestTimeout:12000});
   try{const json=await request(endpoint,{method:'POST',body:new URLSearchParams({data:query})},signal,12000,'Názvy míst · '+new URL(endpoint).hostname);pack.places=parsePlaces(json,center,radius);pack.namesComplete=true;pack.namesSource='OpenStreetMap';break}catch(e){checkAbort(signal);errors.push(e.message)}
  }
  if(!pack.namesComplete)pack.namesError=errors.join(' ');
 }

 checkAbort(signal);emit(pack.namesComplete?'Podklady připravené k uložení.':'Terén připravený; názvy se nepodařilo doplnit.',{phase:'saving',percent:95});return pack;
}
function covers(pack,p,fraction=1){return valid(pack)&&!!p&&G.distance(pack.center,p)<=pack.radius*fraction&&G.sample(pack,p)!==null}
function choose(packs,p){return packs.filter(pack=>covers(pack,p)).sort((a,b)=>G.distance(a.center,p)-G.distance(b.center,p)||b.created-a.created)[0]||null}
function valid(p){return p?.format===1&&Number.isFinite(p.center?.lon)&&Number.isFinite(p.center?.lat)&&Math.abs(p.center.lon)<=180&&Math.abs(p.center.lat)<=75&&Number.isFinite(p.radius)&&p.radius>=5000&&p.radius<=60000&&p.n===129&&Array.isArray(p.grid)&&p.grid.length===p.n*p.n&&p.grid.every(Number.isFinite)&&Array.isArray(p.places)&&p.places.length<=1500}
root.GeoLookData={download,parsePlaces,valid,request,covers,choose,snapshotPlaces,snapshotCells,snapshotPoint};if(typeof module!=='undefined')module.exports=root.GeoLookData;
})(globalThis);
