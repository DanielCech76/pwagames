/* Experimental on-device geometric urban alignment. No semantic identity claims.
   All matches are proposals: map heights/road edges may be approximate. */
(function(root){'use strict';
const G=root.GeoLook,MAX_GROUPS=48,MAX_LINES=400;
function metres(value){if(typeof value==='number')return Number.isFinite(value)?value:null;if(typeof value!=='string'||!/^\s*\d+(?:[.,]\d+)?\s*(?:m)?\s*$/.test(value))return null;return Number(value.replace(',','.').replace(/m\s*$/,''))}
function model(features,origin,sample,radius=1500){
 const groups=[],seen=new Set(),stats={buildings:0,towers:0,roads:0,bridges:0,missing:0};let count=0;
 const sorted=features.map(f=>{let c=f.geometry?.coordinates;while(Array.isArray(c?.[0]))c=c[0];return {f,d:Array.isArray(c)?G.distance(origin,{lon:c[0],lat:c[1]}):Infinity}}).filter(x=>x.d<=radius).sort((a,b)=>a.d-b.d);
 for(const {f,d} of sorted){if(groups.length>=MAX_GROUPS||count>=MAX_LINES)break;if(d<8)continue;const p=f.properties||{},g=f.geometry;if(!g)continue;const code=[p.man_made,p.class,p.subclass,p.amenity].join(' ').toLowerCase(),building=f.kind==='building'||p.building,bridge=String(p.brunnel||'')==='bridge'||p.bridge==='yes'||p.bridge===true,tower=/chimney|tower|lighthouse|water_tower|obelisk|monument/.test(code),road=f.kind==='transportation'&&!bridge;
 if(!building&&!tower&&!road&&!bridge)continue;
 const id=String(f.kind||'')+'/'+String(f.id??'')+'/'+JSON.stringify(g),lines=[];if(seen.has(id))continue;seen.add(id);let approximate=false,type=building?'buildings':tower?'towers':bridge?'bridges':'roads';
 function point(c,lift=0,absolute=null){if(!Array.isArray(c)||!c.slice(0,2).every(Number.isFinite))return null;const pt={lon:c[0],lat:c[1]},base=sample(pt),alt=absolute??(Number.isFinite(base)?base+lift:null);return Number.isFinite(alt)?G.local(origin,{...pt,alt}):null}
 function add(a,b){if(a&&b&&lines.length<32&&count+lines.length<MAX_LINES&&Math.hypot(...a.map((v,i)=>v-b[i]))>.5)lines.push([a,b])}
 if(building){const height=metres(p.height)??metres(p.render_height),minimum=metres(p.min_height)??metres(p.render_min_height)??0;approximate=metres(p.height)===null;if(height===null||height<=minimum||height>600){stats.missing++;continue}const rings=g.type==='Polygon'?[g.coordinates[0]]:g.type==='MultiPolygon'?g.coordinates.map(poly=>poly[0]):[];
 for(const original of rings){if(!original||original.length>100||original.length<4)continue;const ring=original.slice(0,-1),base=ring.map(c=>point(c,minimum)),top=ring.map(c=>point(c,height));if(base.some(x=>!x)||top.some(x=>!x))continue;const area=base.reduce((s,a,i)=>{const b=base[(i+1)%base.length];return s+a[0]*b[1]-b[0]*a[1]},0);const front=base.map((a,i)=>{const b=base[(i+1)%base.length];return ((b[0]-a[0])*(-a[1])-(b[1]-a[1])*(-a[0]))*area<0});for(let i=0;i<base.length;i++)if(front[i]){add(top[i],top[(i+1)%top.length]);add(base[i],top[i]);add(base[(i+1)%base.length],top[(i+1)%top.length])}}
 }else if(tower&&g.type==='Point'){const height=metres(p.height)??metres(p.render_height);if(height===null||height<3||height>600){stats.missing++;continue}const diameter=metres(p.diameter);approximate=diameter===null||metres(p.height)===null;if(diameter!==null&&diameter>0&&diameter<100){const pt={lon:g.coordinates[0],lat:g.coordinates[1]},v=G.local(origin,{...pt,alt:origin.alt}),len=Math.hypot(v[0],v[1]);for(const side of [-1,1]){const q=G.offset(pt,v[1]/len*diameter*.5*side,-v[0]/len*diameter*.5*side),c=[q.lon,q.lat];add(point(c),point(c,height))}}else add(point(g.coordinates),point(g.coordinates,height));
 }else if(road||bridge){const width=metres(p.width),ele=metres(p.ele),lift=metres(p.bridge_height);if(width===null||width<1||width>80||bridge&&ele===null&&lift===null){stats.missing++;continue}approximate=true;const sets=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?g.coordinates:[];for(const coords of sets)for(let i=1;i<coords.length;i++){const a={lon:coords[i-1][0],lat:coords[i-1][1]},b={lon:coords[i][0],lat:coords[i][1]},v=G.local({...a,alt:0},{...b,alt:0}),len=Math.hypot(v[0],v[1]);if(len<3||len>150||G.distance(origin,a)>(bridge?1000:600))continue;for(const side of [-1,1]){const shift=pt=>{const q=G.offset(pt,v[1]/len*width*.5*side,-v[0]/len*width*.5*side);return point([q.lon,q.lat],bridge?lift??0:0,bridge?ele:null)};add(shift(a),shift(b))}}}
 if(lines.length){groups.push({id,name:p['name:cs']||p.name||({buildings:'Budova',towers:'Komín / věž',roads:'Ulice',bridges:'Most'})[type],type,approximate,lines});count+=lines.length;stats[type]++}else stats.missing++;
 }
 return {groups,stats};
}
function edges(image){
 const {width:w,height:h,data}=image,gray=new Float32Array(w*h),strength=new Float32Array(w*h),angle=new Uint8Array(w*h),values=[];
 for(let i=0;i<w*h;i++)gray[i]=.299*data[i*4]+.587*data[i*4+1]+.114*data[i*4+2];
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x,gx=-gray[i-w-1]+gray[i-w+1]-2*gray[i-1]+2*gray[i+1]-gray[i+w-1]+gray[i+w+1],gy=-gray[i-w-1]-2*gray[i-w]-gray[i-w+1]+gray[i+w-1]+2*gray[i+w]+gray[i+w+1],s=Math.hypot(gx,gy);strength[i]=s;angle[i]=((Math.round((Math.atan2(gy,gx)+Math.PI/2)*4/Math.PI)%4)+4)%4;if(s>20)values.push(s)}
 values.sort((a,b)=>a-b);const threshold=Math.max(65,values[Math.floor(values.length*.70)]||65),maps=Array.from({length:4},()=>new Float32Array(w*h).fill(16));let total=0;
 for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){const i=y*w+x;if(strength[i]>=threshold){maps[angle[i]][i]=0;total++}}
 // Chamfer distance per edge orientation, capped at 16 pixels.
 for(const a of maps){for(let y=1;y<h;y++)for(let x=1;x<w-1;x++){const i=y*w+x;a[i]=Math.min(a[i],a[i-1]+1,a[i-w]+1,a[i-w-1]+1.414,a[i-w+1]+1.414)}for(let y=h-2;y>=0;y--)for(let x=w-2;x>0;x--){const i=y*w+x;a[i]=Math.min(a[i],a[i+1]+1,a[i+w]+1,a[i+w-1]+1.414,a[i+w+1]+1.414)}}
 return {maps,width:w,height:h,density:total/(w*h)};
}
function projected(group,pose,w,h,fov){const lines=[];for(const [a,b]of group.lines){const ca=G.dot(a,pose.forward),cb=G.dot(b,pose.forward);if(ca<1||cb<1)continue;const p=G.project(a,pose,w,h,fov),q=G.project(b,pose,w,h,fov);if(p&&q&&Math.hypot(p.x-q.x,p.y-q.y)>5)lines.push([p,q])}return lines}
function evaluate(field,groups,pose,fov){
 const {width:w,height:h,maps}=field;let total=0,weight=0;const matches=[],boxes=[],directions=new Set();
 for(const group of groups){let sum=0,n=0,hit=0;const points=[];for(const [p,q]of projected(group,pose,w,h,fov)){const length=Math.hypot(p.x-q.x,p.y-q.y),steps=Math.min(50,Math.ceil(length/3)),angle=((Math.round(Math.atan2(q.y-p.y,q.x-p.x)*4/Math.PI)%4)+4)%4;for(let j=0;j<=steps;j++){const t=j/steps,x=Math.round(p.x+(q.x-p.x)*t),y=Math.round(p.y+(q.y-p.y)*t);if(x<3||x>=w-3||y<3||y>=h-3)continue;const i=y*w+x,d=maps[angle][i];sum+=Math.min(12,d);n++;if(d<2.5)hit++;points.push([x,y,angle])}}
 if(n<12){total+=12;weight++;continue;}const error=sum/n,coverage=hit/n;const k=group.type==='roads'?.35:group.approximate?.7:1;total+=error*k;weight+=k;if(coverage>=.65&&error<=3){matches.push({id:group.id,name:group.name,type:group.type,error,approximate:group.approximate});for(const [x,y,a]of points){boxes.push([x,y]);directions.add(a)}}
 }
 const span=boxes.length?{x:Math.max(...boxes.map(p=>p[0]))-Math.min(...boxes.map(p=>p[0])),y:Math.max(...boxes.map(p=>p[1]))-Math.min(...boxes.map(p=>p[1]))}:{x:0,y:0};
 return {error:weight?total/weight:Infinity,matches,span,directions:directions.size};
}
function fit(image,model,raw,yaw,pitch,fov){
 const field=edges(image),w=image.width,h=image.height,structures=model.groups.filter(g=>g.type!=='roads');
 if(structures.length<3)return {ok:false,reason:'Pro městské zarovnání chybí alespoň tři objekty s použitelnou geometrií a výškou. Ulice slouží jen jako doplněk. Stáhni detaily okolí nebo použij ruční body.'};
 if(field.density<.003||field.density>.22)return {ok:false,reason:'Obraz nemá dostatečně čitelné hrany nebo je příliš členitý. Zkus jiný záběr nebo ruční bod.'};
 // Freeze the candidate set to avoid winning by moving difficult objects off-screen.
 const initial=G.corrected(raw,yaw,pitch),groups=model.groups.filter(g=>projected(g,initial,w,h,fov).some(([p,q])=>Math.max(p.x,q.x)>w*.1&&Math.min(p.x,q.x)<w*.9&&Math.max(p.y,q.y)>h*.1&&Math.min(p.y,q.y)<h*.9)).slice(0,24);
 if(groups.filter(g=>g.type!=='roads').length<3)return {ok:false,reason:'V záběru nejsou tři použitelné městské objekty. Namiř jinam nebo použij ruční bod.'};
 const score=(dy,dp)=>{const pose=G.corrected(raw,yaw+dy,pitch+dp),r=evaluate(field,groups,pose,fov);return {...r,dy,dp,pose}};
 const results=[];for(let dy=-12;dy<=12;dy+=2)for(let dp=-8;dp<=8;dp+=2)results.push(score(dy,dp));results.sort((a,b)=>a.error-b.error);let best=results[0];const competitor=results.find(p=>Math.hypot(p.dy-best.dy,p.dp-best.dp)>=5);
 if(!Number.isFinite(best.error)||best.error>3||!competitor||competitor.error-best.error<.6||Math.abs(best.dy)>=12||Math.abs(best.dp)>=8)return {ok:false,reason:'Hrany městských objektů nemají dostatečně jednoznačnou shodu s mapou. Předchozí zarovnání zůstává zachované.'};
 const cy=best.dy,cp=best.dp;for(let dy=cy-1;dy<=cy+1;dy+=.5)for(let dp=cp-1;dp<=cp+1;dp+=.5){const r=score(dy,dp);if(r.error<best.error)best=r}
 if(best.matches.filter(m=>m.type!=='roads').length<3||best.span.x<w*.25||best.span.y<h*.12||best.directions<2)return {ok:false,reason:'Shody nejsou dostatečně rozložené v obraze. Použij jiný záběr nebo ruční body.'};
 return {ok:true,yaw:yaw+best.dy,pitch:pitch+best.dp,error:best.error,matches:best.matches,pose:best.pose,groups};
}
root.GeoLookUrban={metres,model,edges,projected,evaluate,fit};
})(typeof window!=='undefined'?window:globalThis);
