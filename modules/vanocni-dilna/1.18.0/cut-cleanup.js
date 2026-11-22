'use strict';

// Repair sub-pixel seams without growing the outside edge of a silhouette.
function cleanCutMask(mask, width, height, pixelsPerMm) {
 const count=mask.length, source=mask.slice();
 const repairSeams=pixelsPerMm>=3;
 if(repairSeams)for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
  const p=y*width+x, value=source[p], opposite=1-value;
  const sides=Number(source[p-1]===opposite)+Number(source[p+1]===opposite)
   +Number(source[p-width]===opposite)+Number(source[p+width]===opposite);
  // Four-sided pinholes or thin stair-step gaps between two broad regions.
  if(sides===4||(!value&&sides>=2&&
   ((source[p-1]&&source[p+1]&&(source[p-width-1]&&source[p-width+1]||source[p+width-1]&&source[p+width+1]))||
    (source[p-width]&&source[p+width]&&(source[p-width-1]&&source[p+width-1]||source[p-width+1]&&source[p+width+1])))))mask[p]=opposite;
 }
 // Flood only runs small enough to be dust. Larger regions abort immediately;
 // border pixels and intentional apertures above the cutoff are retained.
 const span=Math.min(5,Math.max(1,Math.floor(pixelsPerMm*.28)));
 const area=Math.max(1,Math.floor(span*span*.65));
 const queue=new Int32Array(area+1);
 const visited=new Uint32Array(count);
 let generation=0;
 for(let i=0;i<count;i++){
  const value=mask[i];
  if(visited[i]||(mask[i-1]===value&&mask[i+1]===value&&mask[i-width]===value&&mask[i+width]===value))continue;
  const x=i%width,y=Math.floor(i/width);
  if(x===0||x===width-1||y===0||y===height-1)continue;
  generation++;
  let tail=0,left=x,right=x,top=y,bottom=y;
  function enqueue(p){
   if(tail>area||visited[p]===generation||mask[p]!==value)return;
   visited[p]=generation;queue[tail++]=p;
  }
  enqueue(i);
  for(let head=0;head<tail&&tail<=area;head++){
   const p=queue[head],xx=p%width,yy=Math.floor(p/width);
   left=Math.min(left,xx);right=Math.max(right,xx);top=Math.min(top,yy);bottom=Math.max(bottom,yy);
   if(!xx||xx===width-1||!yy||yy===height-1||right-left>=span||bottom-top>=span){tail=area+1;break;}
   enqueue(p-1);enqueue(p+1);enqueue(p-width);enqueue(p+width);
   // Diagonally touching offcuts are a single opening for this filter.
   if(!value){enqueue(p-width-1);enqueue(p-width+1);enqueue(p+width-1);enqueue(p+width+1);}
  }
  if(tail<=area)for(let j=0;j<tail;j++)mask[queue[j]]=1-value;
 }
 return mask;
}

// Reduce the raster staircase while retaining each closed loop and its winding.
function simplifyCutLoop(points,tolerance){
 if(points.length<=4||tolerance<=0)return points;
 let split=1,far=0;
 for(let i=1;i<points.length;i++){
  const d=(points[i][0]-points[0][0])**2+(points[i][1]-points[0][1])**2;
  if(d>far){far=d;split=i;}
 }
 const closed=[...points,points[0]],keep=new Uint8Array(closed.length);
 keep[0]=keep[split]=keep[closed.length-1]=1;
 const pending=[[0,split],[split,closed.length-1]],limit=tolerance*tolerance;
 while(pending.length){
  const [first,last]=pending.pop(),[x,y]=closed[first], [u,v]=closed[last];
  const dx=u-x,dy=v-y,length=dx*dx+dy*dy;
  let furthest=-1,best=limit;
  for(let i=first+1;i<last;i++){
   const px=closed[i][0]-x,py=closed[i][1]-y;
   const t=length?Math.min(1,Math.max(0,(px*dx+py*dy)/length)):0;
   const d=(px-t*dx)**2+(py-t*dy)**2;
   if(d>best){best=d;furthest=i;}
  }
  if(furthest!==-1){keep[furthest]=1;pending.push([first,furthest],[furthest,last]);}
 }
 const result=points.filter((_,i)=>keep[i]);
 return result.length>=3?result:points;
}
