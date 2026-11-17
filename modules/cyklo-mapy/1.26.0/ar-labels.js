/* Deterministic, persistent label admission and placement, independent of DOM. */
(function(root){'use strict';const G=root.GeoLook,key=p=>String(p.id||p.name),names={near:'Blízko',horizon:'Obzor',beyond:'Za obzorem'};
function classify(p,near,origin,flat=false){const category=G.category(p),hidden=p.visibility==='hidden',geometric=Number.isFinite(origin?.alt)&&p.km*1000>Math.sqrt(2*G.R*Math.max(0,origin.alt))+Math.sqrt(2*G.R*Math.max(0,p.alt??0)),group=flat&&p.km<=near?'near':hidden||geometric?'beyond':p.km<=near?'near':'horizon';return {category,group,hidden,geometric,significant:['city','peak','river','lake','reservoir','sea'].includes(category)&&(p.rank??3)<=2||(p.rank??3)<=1};}
function score(p,category){return 120-G.clamp(p.rank??3,0,4)*18+({peak:8,city:6,river:4,lake:4,sea:4}[category]||0)-Math.log2(1+p.km)*2+(Number.isFinite(p.prominence)&&p.prominence>=0?Math.min(15,Math.log2(1+p.prominence)):0)+(Number.isFinite(p.population)&&p.population>=0?Math.min(10,Math.log10(1+p.population)*2):0);}
function overlap(a,b){return Math.abs(a.x-b.x)<(a.width+b.width)/2+7&&Math.abs(a.y-b.y)<(a.height+b.height)/2+6;}
class Labels{
 constructor(){this.states=new Map();this.pending=new Map();this.reasons=new Map();this.tick=-Infinity;this.stats={loaded:0,filtered:0,direction:0,shown:0};}
 reset(){this.states.clear();this.pending.clear();this.reasons.clear();this.tick=-Infinity;}
 invalidate(){this.tick=-Infinity;}
 update(points,project,options,now,w,h){const byId=new Map(points.map(p=>[key(p),p])),selected=options.selected&&key(options.selected),pins=options.pins||new Set(),near=options.near||2,range=options.range||100,limits={near:G.clamp(Math.round(18*(options.density||1)),6,60),far:options.amount||32};
  const currentSignature=[w,h,near,range,limits.near,limits.far,selected,[...pins].join(','),[...options.filters].join(','),options.groups.near,options.groups.horizon,options.groups.beyond,options.flat,options.majorOnly].join(':');
  const forced=currentSignature!==this.signature;if(forced||now-this.tick>=250){this.signature=currentSignature;this.tick=now;const candidates=[],stats={loaded:points.length,filtered:0,direction:0,shown:0};this.reasons.clear();
   for(const p of points){const id=key(p),info=classify(p,near,options.origin,options.flat),important=id===selected||pins.has(id),old=this.states.get(id);let reason=!options.filters.has(info.category)?'Vypnutý typ objektu':p.km>range||info.group!=='beyond'&&p.km>200?'Mimo nastavený dosah':p.km>200&&options.majorOnly!==false&&!(info.category==='city'&&(p.major||p.capital||p.population>=100000)||info.category==='peak'&&(p.major||p.alt>=2000))?'Nízký význam pro velkou vzdálenost':!options.groups[info.group]?'Vypnutá skupina '+names[info.group]:info.group!=='near'&&!info.significant?'Nízký význam pro vzdálený pohled':null;
    const metadata={...info,point:p,score:score(p,info.category),important};this.reasons.set(id,{...metadata,reason:reason||'Mimo směr pohledu'});if(reason&&!important)continue;stats.filtered++;const screen=project(p,info);if(!screen)continue;
    if(screen.x<16||screen.x>w-65||screen.y<100||screen.y>h-60)continue;stats.direction++;
    if(!old&&!important){if(!this.pending.has(id))this.pending.set(id,now);if(now-this.pending.get(id)<250){this.reasons.get(id).reason='Čekám na ustálení v záběru';continue;}}
    const width=G.clamp(p.name.length*(info.group==='near'?6.1:5.3)+40,150,info.group==='near'?220:190),height=info.group==='near'?48:44;
    candidates.push({id,point:p,screen,info,important,width,height,old,priority:metadata.score+(important?10000:0)+(old?now-old.admitted<1200?1000:12:0)});
   }
   // Admit by importance, then lay out far-to-near in stable horizontal rows.
   candidates.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));const admitted=[],counts={near:0,far:0};
   for(const c of candidates){const band=c.info.group==='near'?'near':'far';if(counts[band]>=limits[band]&&!c.important){this.reasons.get(c.id).reason='Limit množství popisků';continue}admitted.push(c);counts[band]++}
   admitted.sort((a,b)=>b.point.km-a.point.km||a.id.localeCompare(b.id));const boxes=[],next=new Map();let cursor=80;
   for(const c of admitted){const reason=this.reasons.get(c.id),x=G.clamp(c.screen.x,12+c.width/2,w-75-c.width/2);let box,bottom;
    const first=Math.max(cursor,80+c.height),last=Math.min(h-65,c.screen.y-12),preferred=c.old?.bottom;
    const rows=[];if(preferred>=first&&preferred<=last)rows.push(preferred);for(let y=first;y<=last;y+=54)rows.push(y);
    for(const y of rows){const b={x,y:y-c.height/2,width:c.width,height:c.height};if(boxes.some(a=>overlap(a,b)))continue;box=b;bottom=y;break}
    if(!box){reason.reason='Není místo nad bodem bez překryvu';continue}cursor=bottom;boxes.push(box);next.set(c.id,{...c,bottom,box,admitted:c.old?.admitted??now,lastSeen:now,opacity:1,visualBottom:c.old?.visualBottom??bottom});reason.reason=c.important?'Vybraný nebo připnutý cíl':'Zobrazeno';stats.shown++;
   }
   this.states=next;this.stats=stats;
   const candidateIds=new Set(candidates.map(c=>c.id));for(const [id]of this.pending)if(!byId.has(id)||!candidateIds.has(id)&&this.reasons.get(id)?.reason==='Mimo směr pohledu')this.pending.delete(id);
  }
  const dt=G.clamp((now-(this.frameAt??now))/1000,.008,.1);this.frameAt=now;const out=[];let bottom=80;for(const [id,state]of [...this.states].sort((a,b)=>b[1].point.km-a[1].point.km||a[0].localeCompare(b[0]))){const point=byId.get(id);if(!point)continue;const screen=project(point,state.info);if(!screen||screen.x<16||screen.x>w-65||screen.y<100||screen.y>h-60)continue;state.visualBottom+=(state.bottom-state.visualBottom)*(1-Math.exp(-dt/.12));const y=Math.max(bottom,state.visualBottom,80+state.height);if(y>screen.y-12||y>h-65)continue;const x=G.clamp(screen.x,12+state.width/2,w-75-state.width/2),box={x,y:y-state.height/2,width:state.width,height:state.height};if(out.some(a=>overlap(a.box,box)))continue;bottom=y;out.push({...state,box,point,screen,x,y,opacity:state.opacity});}return out;
 }
 explain(p){if(!p)return 'Vyber objekt pro vysvětlení.';const r=this.reasons.get(key(p));if(!r)return 'Objekt zatím nebyl vyhodnocen.';return [r.reason,names[r.group],G.distanceText(p.km),'Význam z katalogu: '+(p.rank??3)+' (0 nejvyšší)',r.hidden?'Zakrytý terénem':r.geometric?'Za geometrickým horizontem':p.visibility==='unknown'?'Viditelnost neověřena':'Terénní viditelnost ověřena',Number.isFinite(p.prominence)?'Prominence '+p.prominence+' m':r.category==='peak'?'Prominence v podkladech není uvedena':'',Number.isFinite(p.population)?'Obyvatel '+p.population:''].filter(Boolean).join(' · ');}
}
root.GeoLookLabels={Labels,classify,score,key};if(typeof module!=='undefined')module.exports=root.GeoLookLabels;
})(globalThis);
