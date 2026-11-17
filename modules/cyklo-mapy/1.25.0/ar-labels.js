/* Deterministic, persistent label admission and placement, independent of DOM. */
(function(root){'use strict';const G=root.GeoLook,key=p=>String(p.id||p.name),names={near:'Blízko',horizon:'Obzor',beyond:'Za obzorem'};
function classify(p,near,origin,flat=false){const category=G.category(p),hidden=p.visibility==='hidden',geometric=Number.isFinite(origin?.alt)&&Number.isFinite(p.alt)&&p.km*1000>Math.sqrt(2*G.R*Math.max(0,origin.alt))+Math.sqrt(2*G.R*Math.max(0,p.alt)),group=flat&&p.km<=near?'near':hidden||geometric?'beyond':p.km<=near?'near':'horizon';return {category,group,hidden,geometric,significant:['city','peak','river','lake','sea'].includes(category)&&(p.rank??3)<=2||(p.rank??3)<=1};}
function score(p,category){return 120-G.clamp(p.rank??3,0,4)*18+({peak:8,city:6,river:4,lake:4,sea:4}[category]||0)-Math.log2(1+p.km)*2+(Number.isFinite(p.prominence)&&p.prominence>=0?Math.min(15,Math.log2(1+p.prominence)):0)+(Number.isFinite(p.population)&&p.population>=0?Math.min(10,Math.log10(1+p.population)*2):0);}
function overlap(a,b){return Math.abs(a.x-b.x)<(a.width+b.width)/2+7&&Math.abs(a.y-b.y)<(a.height+b.height)/2+6;}
class Labels{
 constructor(){this.states=new Map();this.pending=new Map();this.reasons=new Map();this.tick=-Infinity;this.stats={loaded:0,filtered:0,direction:0,shown:0};}
 reset(){this.states.clear();this.pending.clear();this.reasons.clear();this.tick=-Infinity;}
 invalidate(){this.tick=-Infinity;}
 update(points,project,options,now,w,h){const byId=new Map(points.map(p=>[key(p),p])),selected=options.selected&&key(options.selected),pins=options.pins||new Set(),near=options.near||2,range=options.range||100,limits={near:G.clamp(Math.round(18*(options.density||1)),6,60),far:options.amount||32};
  const currentSignature=[w,h,near,range,limits.near,limits.far,selected,[...pins].join(','),[...options.filters].join(','),options.groups.near,options.groups.horizon,options.groups.beyond,options.flat].join(':');
  const forced=currentSignature!==this.signature;if(forced||now-this.tick>=250){this.signature=currentSignature;this.tick=now;const candidates=[],stats={loaded:points.length,filtered:0,direction:0,shown:0};this.reasons.clear();
   for(const p of points){const id=key(p),info=classify(p,near,options.origin,options.flat),important=id===selected||pins.has(id),old=this.states.get(id);let reason=!options.filters.has(info.category)?'Vypnutý typ objektu':p.km>range?'Mimo nastavený dosah':!options.groups[info.group]?'Vypnutá skupina '+names[info.group]:info.group!=='near'&&!info.significant?'Nízký význam pro vzdálený pohled':null;
    const metadata={...info,point:p,score:score(p,info.category),important};this.reasons.set(id,{...metadata,reason:reason||'Mimo směr pohledu'});if(reason&&!important)continue;stats.filtered++;const screen=project(p,info);if(!screen)continue;
    const margin=old?24:60;if(screen.x<margin||screen.x>w-(old?16:65)||screen.y<(old?40:85)||screen.y>h-(old?35:65))continue;stats.direction++;
    if(!old&&!important){if(!this.pending.has(id))this.pending.set(id,now);if(now-this.pending.get(id)<250){this.reasons.get(id).reason='Čekám na ustálení v záběru';continue;}}
    const width=G.clamp(p.name.length*(info.group==='near'?6.1:5.3)+40,150,info.group==='near'?220:190),height=info.group==='near'?48:44;
    candidates.push({id,point:p,screen,info,important,width,height,old,priority:metadata.score+(important?10000:0)+(old?now-old.admitted<1200?1000:12:0)});
   }
   candidates.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id));const boxes=[],next=new Map(),counts={near:0,far:0};
   for(const c of candidates){const band=c.info.group==='near'?'near':'far',reason=this.reasons.get(c.id);if(counts[band]>=limits[band]&&!c.important){reason.reason='Limit množství popisků';continue;}
    const offsets=[...(c.old?[c.old.offset]:[]),0,-54,54,-108,108,-162,162,-216,216,-270,270],seen=new Set();let box,offset;
    for(const dy of offsets){if(seen.has(dy))continue;seen.add(dy);const b={x:c.screen.x,y:c.screen.y-32+dy,width:c.width,height:c.height};if(b.y<80||b.y>h-65)continue;if(boxes.some(a=>overlap(a,b)))continue;box=b;offset=dy;break;}
    if(!box){reason.reason='Překryv s jiným popiskem';continue;}boxes.push(box);counts[band]++;next.set(c.id,{...c,offset,box,admitted:c.old?.admitted??now,lastSeen:now,opacity:1,visualOffset:c.old?.visualOffset??offset});reason.reason=c.important?'Vybraný nebo připnutý cíl':'Zobrazeno';stats.shown++;
   }
   // Briefly retain an old card through edge crossings or temporary collisions.
   if(!forced)for(const [id,old]of this.states){if(next.has(id)||now-old.lastSeen>650||!byId.has(id))continue;const reason=this.reasons.get(id);if(boxes.some(b=>overlap(b,old.box)))continue;if(reason&&['Vypnutý typ objektu','Mimo nastavený dosah'].includes(reason.reason)||reason?.reason.startsWith('Vypnutá skupina'))continue;next.set(id,{...old,opacity:Math.max(0,1-(now-old.lastSeen)/650)});}
   this.states=next;this.stats=stats;
   for(const [id]of this.pending)if(!byId.has(id)||!candidates.some(c=>c.id===id)&&this.reasons.get(id)?.reason==='Mimo směr pohledu')this.pending.delete(id);
  }
  const dt=G.clamp((now-(this.frameAt??now))/1000,.008,.1);this.frameAt=now;const out=[];for(const [id,state]of this.states){const point=byId.get(id);if(!point)continue;const screen=project(point,state.info);if(!screen)continue;state.visualOffset+=(state.offset-state.visualOffset)*(1-Math.exp(-dt/.12));out.push({...state,point,screen,x:screen.x,y:screen.y-32+state.visualOffset,opacity:state.opacity});}return out;
 }
 explain(p){if(!p)return 'Vyber objekt pro vysvětlení.';const r=this.reasons.get(key(p));if(!r)return 'Objekt zatím nebyl vyhodnocen.';return [r.reason,names[r.group],G.distanceText(p.km),'Význam z katalogu: '+(p.rank??3)+' (0 nejvyšší)',r.hidden?'Zakrytý terénem':r.geometric?'Za geometrickým horizontem':p.visibility==='unknown'?'Viditelnost neověřena':'Terénní viditelnost ověřena',Number.isFinite(p.prominence)?'Prominence '+p.prominence+' m':r.category==='peak'?'Prominence v podkladech není uvedena':'',Number.isFinite(p.population)?'Obyvatel '+p.population:''].filter(Boolean).join(' · ');}
}
root.GeoLookLabels={Labels,classify,score,key};if(typeof module!=='undefined')module.exports=root.GeoLookLabels;
})(globalThis);
