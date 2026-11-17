(function(root){
'use strict';const R=6371,D=Math.PI/180;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function xyz(lon,lat,h=0){const a=lon*D,b=lat*D,r=R+h;return [r*Math.cos(b)*Math.cos(a),r*Math.cos(b)*Math.sin(a),r*Math.sin(b)]}
const origin=xyz(12,47),east=[-Math.sin(12*D),Math.cos(12*D),0],up=xyz(12,47).map(x=>x/R),south=[Math.sin(47*D)*Math.cos(12*D),Math.sin(47*D)*Math.sin(12*D),-Math.cos(47*D)];
function enu(lon,lat,h=0){const p=xyz(lon,lat,h).map((v,i)=>v-origin[i]);return [east,up,south].map(a=>a.reduce((s,v,i)=>s+v*p[i],0))}
function distance(a,b){let p=xyz(a.lon,a.lat),q=xyz(b.lon,b.lat);return R*Math.acos(clamp(p.reduce((s,v,i)=>s+v*q[i],0)/(R*R),-1,1))}
function bearing(a,b){const p=a.lat*D,q=b.lat*D,l=(b.lon-a.lon)*D;return (Math.atan2(Math.sin(l)*Math.cos(q),Math.cos(p)*Math.sin(q)-Math.sin(p)*Math.cos(q)*Math.cos(l))/D+360)%360}
function interpolate(a,b,t){t=clamp(t,0,1);const p=xyz(a.lon,a.lat),q=xyz(b.lon,b.lat),w=distance(a,b)/R;if(w<1e-8)return {lon:a.lon,lat:a.lat};const s=Math.sin(w),v=p.map((x,i)=>(Math.sin((1-t)*w)*x+Math.sin(t*w)*q[i])/s);return {lon:Math.atan2(v[1],v[0])/D,lat:Math.atan2(v[2],Math.hypot(v[0],v[1]))/D}}
function mercator(lon,lat){return [(lon+180)/360,(1-Math.asinh(Math.tan(clamp(lat,-85,85)*D))/Math.PI)/2]}
function unmercator(x,y){return {lon:x*360-180,lat:Math.atan(Math.sinh(Math.PI*(1-2*y)))/D}}
function sample(meta,data,lon,lat){const [x,y]=mercator(lon,lat),u=(x*64-meta.x)*256/meta.step,v=(y*64-meta.y)*256/meta.step,n=meta.n;if(u<0||v<0||u>n-1||v>n-1)return null;let i=Math.min(n-2,Math.floor(u)),j=Math.min(n-2,Math.floor(v)),a=u-i,b=v-j;return ((1-a)*(1-b)*data[j*n+i]+a*(1-b)*data[j*n+i+1]+(1-a)*b*data[(j+1)*n+i]+a*b*data[(j+1)*n+i+1])/1000}
function visible(meta,data,from,to,sampler){const length=distance(from,to);if(length<.1)return true;const p=xyz(from.lon,from.lat,from.alt),q=xyz(to.lon,to.lat,to.alt||0);for(let i=1;i<80;i++){const t=i/80,v=p.map((x,k)=>x+(q[k]-x)*t),r=Math.hypot(...v),lat=Math.asin(v[2]/r)/D,lon=Math.atan2(v[1],v[0])/D,h=sampler?sampler(lon,lat):sample(meta,data,lon,lat);if(h===null)return false;if(r-R<h-.015)return false}return true}
function view(yaw,pitch,zoom,head){return {yaw:clamp(yaw,-72,72),pitch:clamp(pitch,-85,40),zoom:clamp(zoom,1,8),head:clamp(head,0,1)}}
function aperture(x,y,aspect,yaw,pitch,head){const f=Math.tan(32*D),rx=x*f*aspect,ry=y*f,rz=-1,c=Math.cos(pitch*D),s=Math.sin(pitch*D),a=ry*c-rz*s,b=ry*s+rz*c,cy=Math.cos(-yaw*D),sy=Math.sin(-yaw*D),xx=rx*cy+b*sy,zz=-rx*sy+b*cy;if(zz>=0)return false;const t=-(.632-head*.44)/zz,px=Math.abs(xx*t),py=Math.abs(a*t),w=.1625,h=.245,r=.1;return px<=w&&py<=h&&Math.hypot(Math.max(0,px-(w-r)),Math.max(0,py-(h-r)))<=r;}
const api={aperture,R,D,clamp,xyz,enu,distance,bearing,interpolate,mercator,unmercator,sample,visible,view};root.FlightGeo=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
