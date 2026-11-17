/* Flight data have their own stable cache, independent of module versions. */
export class FlightOffline {
 constructor(root=new URL('../../../flight-data/v1/',location.href)){this.root=root;this.controller=null;this.busy=false}
 key(a,b){return [a,b].sort().join('-')}
 async cached(key){const c=await caches.open('letadlo-flight-data-v1');const base=new URL(key+'/',this.root);const hit=await c.match(new URL('manifest.json',base));if(!hit)return null;const m=await hit.json();for(const f of m.files)if(!await c.match(new URL(f.path,base)))return null;return {m,c,base}}
 cancel(){this.controller?.abort()}
 async remove(key){const c=await caches.open('letadlo-flight-data-v1');const prefix=new URL(key+'/',this.root).href;for(const r of await c.keys())if(r.url.startsWith(prefix))await c.delete(r)}
 async prepare(key,progress=()=>{}){
 if(this.busy)throw Error('Již probíhá stahování.');this.busy=true;this.controller=new AbortController();
 const timer=setTimeout(()=>this.controller?.abort(),60000);
 try{let pack=await this.cached(key);if(pack)return pack;
 const base=new URL(key+'/',this.root),c=await caches.open('letadlo-flight-data-v1');
 const get=async path=>{const r=await fetch(new URL(path,base),{signal:this.controller.signal,cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status+' · '+path);return r};
 const response=await get('manifest.json'),m=await response.json();
 if(m.version!==1||m.route!==key||JSON.stringify(m.files.map(f=>f.path))!==JSON.stringify(['region.json','terrain.bin','surface.jpg']))throw Error('Neplatný datový balíček');
 const total=m.files.reduce((s,f)=>s+f.size,0);const space=await navigator.storage?.estimate?.();if(space?.quota&&space.quota-space.usage<total*1.2)throw Error('Nedostatek místa');let done=0;
 for(const f of m.files){if(await c.match(new URL(f.path,base))){done+=f.size;progress(done,total);continue}progress(done,total);const r=await get(f.path),b=await r.arrayBuffer();const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');if(b.byteLength!==f.size||hash!==f.sha256)throw Error('Neúplná nebo poškozená data');await c.put(new URL(f.path,base),new Response(b,{headers:{'Content-Type':r.headers.get('Content-Type')||'application/octet-stream'}}));done+=b.byteLength;progress(done,total)}
 await c.put(new URL('manifest.json',base),new Response(JSON.stringify(m)));return {m,c,base};
 }finally{clearTimeout(timer);this.busy=false;this.controller=null}}
 async read(pack){const read=async f=>(await pack.c.match(new URL(f,pack.base)));const meta=await (await read('region.json')).json(),dem=new Int16Array(await (await read('terrain.bin')).arrayBuffer());if(dem.length!==meta.n*meta.n)throw Error('Neúplný terén');const blob=await (await read('surface.jpg')).blob(),url=URL.createObjectURL(blob);try{const image=await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=no;i.src=url});return {meta,dem,image}}finally{URL.revokeObjectURL(url)}}
}
