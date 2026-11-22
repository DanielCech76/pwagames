// Simplify dense polylines using a small, independently bounded error budget.
function simplifyDenseOutline(points,tolerance){
 const n=points.length, arc=[0], kept=[];
 for(let i=1;i<=n;i++){
  const [a,b]=points[i-1], [x,y]=points[i%n];
  arc.push(arc[i-1]+Math.hypot(x-a,y-b));
 }
 const middle=Math.floor(n/2), spans=[[middle,n,0],[0,middle,0]];
 let deviation=0;
 while(spans.length){
  const [a,b,depth]=spans.pop();
  const [x,y]=points[a], [u,v]=points[b%n];
  const length=arc[b]-arc[a];
  let error=0,split=a+1;
  for(let i=a+1;i<b;i++){
   const t=(arc[i]-arc[a])/length;
   const [px,py]=points[i];
   const distance=Math.hypot(px-x-(u-x)*t,py-y-(v-y)*t);
   if(distance>error){error=distance;split=i;}
  }
  if(error<=tolerance){
   kept.push(points[a]);deviation=Math.max(deviation,error);
  }else{
   if(depth>=12)split=Math.floor((a+b)/2);
   spans.push([split,b,depth+1],[a,split,depth+1]);
  }
 }
 return kept.length<3?{points,deviation:0}:{points:kept,deviation};
}

// Fit traced polygons in their original coordinate system. Each accepted cubic
// is checked against the entire corresponding polyline, in both directions.
function fitTracedOutline(points, tolerance, sensitivity=50, spacing=0, spacingScale=[1,1]) {
 const n = points.length;
 const distance = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1]);
 const mix = (a,b,t) => a.map((v,i) => v+(b[i]-v)*t);
 const direction = (a,b) => {
  const d = distance(a,b);
  return d ? a.map((v,i) => (v-b[i])/d) : [0,0];
 };
 const dot = (a,b) => a[0]*b[0]+a[1]*b[1];
 const polyline = () => points.slice(1).concat([points[0]]).map(end=>({end}));
 const reach = 5;
 const angles = points.map((p,i)=>{
  const neighbor = (sign,radius) => {
   let length=0,prev=p;
   for(let step=1;step<n && step<=256;step++){
    const next=points[(i+sign*step+n)%n], edge=distance(prev,next);
    if(length+edge>=radius)return mix(prev,next,(radius-length)/edge);
    length+=edge;prev=next;
   }
   return prev;
  };
  const angleAt = radius => dot(direction(neighbor(-1,radius),p),direction(neighbor(1,radius),p));
  return Math.min(angleAt(reach),angleAt(reach*1.7));
 });
 const threshold=-.42-(sensitivity-50)*.01;
 const corners=angles.flatMap((angle,i)=>angle>threshold && angle>angles[(i+n-1)%n] && angle>=angles[(i+1)%n]?[i]:[]);
 if(n<5)corners.splice(0,corners.length,...points.map((_,i)=>i));
 if(spacing>0&&corners.length>1){
  const arc=[0];
  for(let i=0;i<n;i++){
   const [a,b]=points[i], [x,y]=points[(i+1)%n];
   arc.push(arc[i]+Math.hypot((x-a)*spacingScale[0],(y-b)*spacingScale[1]));
  }
  const perimeter=arc[n],cells=Math.max(1,Math.floor(perimeter/spacing));
  const width=perimeter/cells,kept=new Map();
  corners.sort((a,b)=>angles[b]-angles[a]||a-b);
  for(const index of corners){
   const cell=Math.min(cells-1,Math.floor(arc[index]/width));
   const nearby=[cell,(cell+1)%cells,(cell+cells-1)%cells];
   if(nearby.some(key=>{
    if(!kept.has(key))return false;
    const gap=Math.abs(arc[index]-arc[kept.get(key)]);
    return Math.min(gap,perimeter-gap)<spacing;
   }))continue;
   kept.set(cell,index);
  }
  corners.splice(0,corners.length,...[...kept.values()].sort((a,b)=>a-b));
 }
 const vertices=corners.map(index=>points[index]);
 if(n<5||tolerance<=0)return {start:points[0],segments:polyline(),vertices};
 if(corners.length<2){
  const first=corners[0]??0;
  corners.push(...(corners.length?[]:[first]),(first+Math.floor(n/2))%n);
  corners.sort((a,b)=>a-b);
 }
 function subcurveWithin(p,q,a,b,delta,depth=0){
  // Bounds the difference from the matched line using the convex hull of
  // the difference cubic; subdivision tightens that bound near the limit.
  const endpointError=Math.max(distance(p,a),distance(q,b));
  if(endpointError>tolerance)return Infinity;
  const bound=Math.max(endpointError,distance(delta[0],mix(a,b,1/3)),distance(delta[1],mix(a,b,2/3)));
  if(bound<=tolerance&&(bound-endpointError<=.05||depth>=3))return bound;
  if(depth===5)return Infinity;
  const ab=mix(p,delta[0],.5),bc=mix(delta[0],delta[1],.5),cd=mix(delta[1],q,.5);
  const left=mix(ab,bc,.5),right=mix(bc,cd,.5),center=mix(left,right,.5),mid=mix(a,b,.5);
  const leftBound=subcurveWithin(p,center,a,mid,[ab,left],depth+1);
  return Math.max(leftBound,subcurveWithin(center,q,mid,b,[right,cd],depth+1));
 }
 function fit(span,first,last,tangentStart,tangentEnd){
  const start=span[first],end=span[last],arc=[0];
  for(let i=first+1;i<=last;i++)arc.push(arc.at(-1)+distance(span[i-1],span[i]));
  const length=arc.at(-1);
  if(!(length>0))return {segment:{end},error:0};
  let lineError=0,lineCost=0,previousLineError=0;
  for(let i=1;i<arc.length;i++){
   const error=distance(span[first+i],mix(start,end,arc[i]/length));
   lineError=Math.max(lineError,error);
   lineCost+=(error+previousLineError)*(arc[i]-arc[i-1])/2;
   previousLineError=error;
  }
  if(lineError<=tolerance*.35)return {segment:{end},error:lineError,cost:lineCost};
  let aa=0,ab=0,bb=0,ar=0,br=0;
  for(let i=1;i<arc.length-1;i++){
   const t=arc[i]/length,s=1-t,u=3*s*s*t,v=3*s*t*t;
   const a=tangentStart.map(x=>x*u),b=tangentEnd.map(x=>x*v);
   const base=mix(start,end,t*t*t+v),residual=span[first+i].map((x,j)=>x-base[j]);
   const weight=(arc[i+1]-arc[i-1])/length;
   aa+=weight*dot(a,a);ab+=weight*dot(a,b);bb+=weight*dot(b,b);
   ar+=weight*dot(a,residual);br+=weight*dot(b,residual);
  }
  const det=aa*bb-ab*ab;
  let left=(ar*bb-br*ab)/det,right=(br*aa-ar*ab)/det;
  if(!(left>0&&right>0&&left<=length&&right<=length))left=right=distance(start,end)/3;
  const c1=start.map((x,i)=>x+left*tangentStart[i]),c2=end.map((x,i)=>x+right*tangentEnd[i]);
  const at=t=>{
   const s=1-t;
   return start.map((x,i)=>s*s*s*x+3*s*s*t*c1[i]+3*s*t*t*c2[i]+t*t*t*end[i]);
  };
  const derivative=t=>{
   const s=1-t;
   return start.map((x,i)=>3*(s*s*(c1[i]-x)+2*s*t*(c2[i]-c1[i])+t*t*(end[i]-c2[i])));
  };
  let split=Math.floor((first+last)/2),error=0,bound=0,cost=0,previousError=0,previous=start;
  for(let i=1;i<arc.length;i++){
   const t=arc[i]/length, prior=arc[i-1]/length, point=at(t);
   const difference=distance(point,span[first+i]);
   cost+=(difference+previousError)*(arc[i]-arc[i-1])/2;
   previousError=difference;
   if(difference>error&&first+i<last){error=difference;split=first+i;}
   if(Number.isFinite(bound)){
    const a=derivative(prior),b=derivative(t),factor=(t-prior)/3;
    bound=Math.max(bound,subcurveWithin(previous,point,span[first+i-1],span[first+i],
     [previous.map((v,j)=>v+a[j]*factor),point.map((v,j)=>v-b[j]*factor)]));
   }
   previous=point;
  }
  return Number.isFinite(bound)?{segment:{end,c1,c2},error:bound,cost}:{split};
 }
 const segments=[];
 let deviation=0,totalCost=0;
 for(let i=0;i<corners.length;i++){
  const from=corners[i],to=corners[i+1]??corners[0]+n;
  const span=Array.from({length:to-from+1},(_,j)=>points[(from+j)%n]);
  const last=span.length-1;
  const tangent=(index,sign)=>{
   let other=index+sign;
   while(other>0&&other<last&&distance(span[other],span[index])<reach)other+=sign;
   return direction(span[other],span[index]);
  };
  const candidate=(a,b)=>b===a+1?{segment:{end:span[b]},error:0}:fit(span,a,b,
   a===0? tangent(a,1):direction(span[a+1],span[a-1]),
   b===last? tangent(b,-1):direction(span[b-1],span[b+1]));
  const pieces=[];
  function split(a,b,depth=0){
   const result=candidate(a,b);
   if(result.segment){pieces.push({a,b,segment:result.segment,error:result.error,cost:result.cost??0});return;}
   const middle=depth<14?result.split:Math.floor((a+b)/2);
   split(a,middle,depth+1);split(middle,b,depth+1);
  }
  split(0,last);
  // Minimize the number of segments over the split boundaries, with bounded
  // lookahead so large user-supplied contours remain responsive.
  const best=[{count:0,error:0}];
  for(let j=1;j<=pieces.length;j++){
   const piece=pieces[j-1];
   best[j]={count:best[j-1].count+1,error:best[j-1].error+piece.cost,previous:j-1,segment:piece.segment,bound:piece.error};
   for(let k=Math.max(0,j-8);k<j-1;k++){
    const count=best[k].count+1;
    if(count>best[j].count)continue;
    const {segment,error,cost=0}=candidate(pieces[k].a,piece.b);
    const total=best[k].error+cost;
    if(segment&&(count<best[j].count||total<best[j].error))best[j]={count,error:total,previous:k,segment,bound:error};
   }
  }
  const fitted=[];
  for(let j=pieces.length;j>0;j=best[j].previous){
   fitted.push(best[j].segment);
   deviation=Math.max(deviation,best[j].bound);
  }
  totalCost+=best.at(-1).error;
  segments.push(...fitted.reverse());
 }
 return {start:points[corners[0]],segments,deviation,vertices,cost:totalCost};
}

// Detect crossings on a finely flattened copy before committing the vector fit.
function traceTopologyIsSafe(outlines) {
 const grid=new Map(), cell=8;
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const middle=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
 function flatten(a,b,c,d,output,depth=0){
  if(depth>=8||Math.max(Math.hypot(b[0]-(2*a[0]+d[0])/3,b[1]-(2*a[1]+d[1])/3),
   Math.hypot(c[0]-(a[0]+2*d[0])/3,c[1]-(a[1]+2*d[1])/3))<=.15){
   output.push(d);return;
  }
  const ab=middle(a,b),bc=middle(b,c),cd=middle(c,d);
  const left=middle(ab,bc),right=middle(bc,cd),center=middle(left,right);
  flatten(a,ab,left,center,output,depth+1);flatten(center,right,cd,d,output,depth+1);
 }
 let work=0;
 for(const {start,segments} of outlines){
  const points=[start];
  for(const {end,c1,c2} of segments){
   if(c1)flatten(points.at(-1),c1,c2,end,points);
   else points.push(end);
  }
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i];
   const x0=Math.floor(Math.min(a[0],b[0])/cell),x1=Math.floor(Math.max(a[0],b[0])/cell);
   const y0=Math.floor(Math.min(a[1],b[1])/cell),y1=Math.floor(Math.max(a[1],b[1])/cell);
   for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
    if(++work>1000000)return false;
    const key=x+','+y, bucket=grid.get(key)??[];
    for(const [c,d] of bucket){
     if(++work>1000000)return false;
     if(cross(a,b,c)*cross(a,b,d)<-1e-9&&cross(c,d,a)*cross(c,d,b)<-1e-9)return false;
    }
    bucket.push([a,b]);grid.set(key,bucket);
   }
  }
 }
 return true;
}
