/* Explicit, bounded downloads. A completed pack is committed only by the caller. */
(function(root){'use strict';const G=root.GeoLook;
function parsePlaces(json,center,radius){if(json.remark)throw Error('Služba míst nedokončila dotaz. Zkus menší dosah nebo později.');const out=[];for(const e of json.elements||[]){const t=e.tags||{},p={lon:e.lon??e.center?.lon,lat:e.lat??e.center?.lat};if(!Number.isFinite(p.lon)||!Number.isFinite(p.lat)||!t.name||G.distance(center,p)>radius)continue;const raw=String(t.ele||'').trim().replace(',','.'),alt=/^-?\d+(\.\d+)?(\s*m)?$/.test(raw)?Number.parseFloat(raw):null;out.push({...p,id:e.type+'/'+e.id,name:String(t['name:cs']||t.name).slice(0,120),alt:Number.isFinite(alt)&&alt>=-500&&alt<=9000?alt:null,type:t.natural==='peak'?'Vrchol':t.place?'Obec':t.historic?'Památka':'Vyhlídka',rank:t.natural==='peak'?1:['city','town'].includes(t.place)?0:2})}return out.sort((a,b)=>a.rank-b.rank||G.distance(center,a)-G.distance(center,b)).slice(0,1500)}
function cancelled(){return new DOMException('Zrušeno uživatelem','AbortError')}
function checkAbort(signal){if(signal?.aborted)throw cancelled()}
async function request(url,options={},signal,ms=30000,label='Server',onBytes){
 const c=new AbortController();let timedOut=false;
 const abort=()=>c.abort();signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)c.abort();
 const timer=setTimeout(()=>{timedOut=true;c.abort()},ms);
 try{
  const {image,...init}=options,r=await fetch(url,{...init,signal:c.signal,credentials:'omit'});
  if(!r.ok){const e=Error(label+': server vrátil HTTP '+r.status+'.');e.code='HTTP';throw e}
  if(image&&r.body?.getReader){const reader=r.body.getReader(),chunks=[];let received=0;const total=Number(r.headers.get('Content-Length'))||0;for(;;){const next=await reader.read();if(next.done)break;chunks.push(next.value);received+=next.value.byteLength;onBytes?.(received,total)}return new Blob(chunks,{type:r.headers.get('Content-Type')||'image/png'})}
  return await (image?r.blob():r.json());
 }catch(error){
  if(signal?.aborted)throw cancelled();
  if(timedOut){const e=Error(label+': časový limit '+ms/1000+' s vypršel.');e.name='TimeoutError';e.code='TIMEOUT';throw e}
  if(error.code==='HTTP')throw error;
  const e=Error(label+': '+(error.name==='SyntaxError'?'neplatná odpověď serveru.':'požadavek selhal (síť, přístup nebo CORS).'));e.code='NETWORK';throw e;
 }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort)}
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
 const same=options.previous?.find(p=>valid(p)&&p.namesComplete!==false&&G.distance(center,p.center)+radius<=p.radius+1);
 if(same){pack.places=same.places.filter(p=>G.distance(center,p)<=radius);pack.namesComplete=true;emit('Názvy míst jsou již uložené.',{phase:'names',percent:95})}
 else{
  const around=`(around:${radius},${center.lat},${center.lon})`,query=`[out:json][timeout:25][maxsize:8388608];(nwr[natural=peak][name]${around};node[place~"^(city|town|village)$"][name]${around};nwr[tourism=viewpoint][name]${around};nwr[historic~"^(castle|ruins)$"][name]${around};);out center;`,errors=[];
  for(const endpoint of ['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter']){
   emit('Stahuji názvy míst · '+new URL(endpoint).hostname+'…',{phase:'names',percent:85});
   try{const json=await request(endpoint,{method:'POST',body:new URLSearchParams({data:query})},signal,35000,'Názvy míst · '+new URL(endpoint).hostname);pack.places=parsePlaces(json,center,radius);pack.namesComplete=true;break}catch(e){checkAbort(signal);errors.push(e.message)}
  }
  if(!pack.namesComplete){const known=new Map();for(const previous of options.previous||[])for(const p of previous.places||[])if(G.distance(center,p)<=radius)known.set(p.id||p.name,p);pack.places=[...known.values()].slice(0,1500);pack.namesError=errors.join(' ')}
 }
 checkAbort(signal);emit(pack.namesComplete?'Podklady připravené k uložení.':'Terén připravený; názvy se nepodařilo doplnit.',{phase:'saving',percent:95});return pack;
}
function covers(pack,p,fraction=1){return valid(pack)&&!!p&&G.distance(pack.center,p)<=pack.radius*fraction&&G.sample(pack,p)!==null}
function choose(packs,p){return packs.filter(pack=>covers(pack,p)).sort((a,b)=>G.distance(a.center,p)-G.distance(b.center,p)||b.created-a.created)[0]||null}
function valid(p){return p?.format===1&&Number.isFinite(p.center?.lon)&&Number.isFinite(p.center?.lat)&&Math.abs(p.center.lon)<=180&&Math.abs(p.center.lat)<=75&&Number.isFinite(p.radius)&&p.radius>=5000&&p.radius<=60000&&p.n===129&&Array.isArray(p.grid)&&p.grid.length===p.n*p.n&&p.grid.every(Number.isFinite)&&Array.isArray(p.places)&&p.places.length<=1500}
root.GeoLookData={download,parsePlaces,valid,request,covers,choose};if(typeof module!=='undefined')module.exports=root.GeoLookData;
})(globalThis);
