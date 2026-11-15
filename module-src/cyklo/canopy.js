/* Reference-derived painted/faceted crowns; upright camera-azimuth cards with DEM foot anchors. */
(function(root){'use strict';
const R=6378137,rad=Math.PI/180;
const rects=[[0.0430622009569378, 0.03110047846889952, 0.2783094098883573, 0.2807017543859649], [0.3803827751196172, 0.03189792663476874, 0.23444976076555024, 0.2799043062200957], [0.6738437001594896, 0.11164274322169059, 0.28309409888357256, 0.19218500797448165], [0.04704944178628389, 0.3580542264752791, 0.2751196172248804, 0.2807017543859649], [0.3803827751196172, 0.35645933014354064, 0.23763955342902712, 0.2822966507177033], [0.6690590111642744, 0.43620414673046254, 0.284688995215311, 0.19537480063795853], [0.04784688995215311, 0.6794258373205742, 0.2743221690590112, 0.2902711323763955], [0.3787878787878788, 0.6850079744816587, 0.23923444976076555, 0.284688995215311], [0.6674641148325359, 0.773524720893142, 0.2886762360446571, 0.19218500797448165]];
const roots=[[0.49590308148594986, 0.9943181818181818], [0.5066407515387108, 0.9943019943019943], [0.4808212458832597, 0.991701244813278], [0.485751774318602, 0.9943181818181818], [0.5024527640764399, 0.9943502824858758], [0.48777203188967894, 0.9918367346938776], [0.488107822410148, 0.9945054945054945], [0.5039344262295082, 0.9943977591036415], [0.5026528106638604, 0.991701244813278]];
const topRects=[[0.03668261562998405, 0.02631578947368421, 0.2862838915470494, 0.2751196172248804], [0.361244019138756, 0.03269537480063796, 0.27352472089314195, 0.2743221690590112], [0.671451355661882, 0.06220095693779904, 0.291866028708134, 0.21451355661881977], [0.029505582137161084, 0.3532695374800638, 0.2966507177033493, 0.2807017543859649], [0.361244019138756, 0.3620414673046252, 0.2743221690590112, 0.2703349282296651], [0.6682615629984051, 0.3939393939393939, 0.3022328548644338, 0.21451355661881977], [0.03588516746411483, 0.6905901116427432, 0.27751196172248804, 0.2759170653907496], [0.35964912280701755, 0.69377990430622, 0.27751196172248804, 0.2679425837320574], [0.6666666666666666, 0.7320574162679426, 0.2982456140350877, 0.21770334928229665]];
function geometry(trees,origin,heights,shades=[],groups=false){const cos=Math.cos(origin[1]*rad),ox=R*origin[0]*rad,oy=R*Math.log(Math.tan(Math.PI/4+origin[1]*rad/2)),values=[];
 for(let i=0;i<trees.length;i++){if(groups&&i%5!==0)continue;const t=trees[i],z=heights[i];if(!Number.isFinite(z))continue;const x=(R*t.position[0]*rad-ox)*cos,y=(R*Math.log(Math.tan(Math.PI/4+t.position[1]*rad/2))-oy)*cos,h=t.height,w=h*(t.kind==='needleleaved'?.75:t.kind==='shrub'?1.5:.95),k=t.kind==='needleleaved'?1:t.kind==='shrub'?2:0;
  // Upright card plus a separate horizontal crown cap. The trunk never tilts.
  for(const cap of [0,2])for(const [u,v]of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]])values.push(x,y,z,u,v,w*(groups?2:1),h,k,t.seed,shades[i]??1,(groups?1:0)+cap);
 }return new Float32Array(values)}
const vertex=`#version 300 es
precision highp float;
layout(location=0) in vec3 a_anchor;
layout(location=1) in vec2 a_uv;
layout(location=2) in vec2 a_size;
layout(location=3) in vec4 a_info;
uniform mat4 u_matrix; uniform vec3 u_eye; uniform float u_detail; uniform float u_limit; uniform float u_pseudo; uniform vec2 u_roots[9];
out float v_cap; out vec3 v_world; out vec2 v_uv; out float v_lod; out float v_kind; out float v_shade; out float v_fade;
void main(){
 vec3 center=a_anchor+vec3(0.,0.,a_size.y*.6);
 vec3 direction=u_eye-center; float distance=length(direction); direction=distance>.001?direction/distance:vec3(0.,-1.,0.);
 float ratio=distance/max(1.,u_detail); float lod=ratio<.35?0.:ratio<.7?1.:2.;
 bool cap=a_info.w>1.5; float group=mod(a_info.w,2.);
 int species=int(floor(a_info.x+.5)); vec2 root=u_roots[int(lod)*3+species];
 vec2 horizontal=direction.xy; float lengthXY=length(horizontal);
 // Cylindrical billboard: camera azimuth only, fixed world vertical, DEM foot anchor.
 vec3 right=lengthXY>.001?vec3(-horizontal.y,horizontal.x,0.)/lengthXY:vec3(1.,0.,0.);
 vec3 position=a_anchor+right*(a_uv.x-root.x)*a_size.x+vec3(0.,0.,(root.y-a_uv.y)*a_size.y);
 float overhead=smoothstep(.88,.98,abs(direction.z));
 v_uv=a_uv;
 if(cap){vec3 forward=vec3(-right.y,right.x,0.);position=a_anchor+vec3(0.,0.,a_size.y*.72)+right*(a_uv.x-.5)*a_size.x+forward*(a_uv.y-.5)*a_size.x*.85;v_uv=a_uv;}
 v_cap=cap?1.:0.; v_world=position; gl_Position=u_matrix*vec4(position,1.);
 v_lod=lod;
 v_kind=a_info.x; v_shade=a_info.z*(.92+a_info.y*.16);
 float clipRatio=distance/max(1.,u_limit); v_fade=(1.-smoothstep(.85,1.,clipRatio))*(cap?overhead:1.-overhead);
 if(group>.5&&u_pseudo>.5)v_fade*=smoothstep(.68,.85,ratio);
 if(group<.5)v_fade*=1.-smoothstep(.75,1.,clipRatio);
}`;
const fragment=`#version 300 es
precision highp float;
uniform sampler2D u_atlas; uniform sampler2D u_topAtlas; uniform vec4 u_rects[9]; uniform vec4 u_topRects[9]; in float v_cap; in vec2 v_uv; in float v_lod; in float v_kind; in float v_shade; in float v_fade; out vec4 color;
void main(){int index=int(floor(v_lod+.5))*3+int(floor(v_kind+.5));vec4 rect=v_cap>.5?u_topRects[index]:u_rects[index];vec2 uv=rect.xy+clamp(v_uv,vec2(.002),vec2(.998))*rect.zw;
 float d=fract(dot(mod(floor(gl_FragCoord.xy),vec2(4.)),vec2(.25,.5625)));
 if(v_cap>.5)d=1.-d-.0001;
 if(v_fade<=d)discard; vec4 tex=v_cap>.5?texture(u_topAtlas,uv):texture(u_atlas,uv); if(tex.a<.45)discard; color=vec4(tex.rgb*v_shade,1.);}`;

// Shared conservative outline fan; only the nine-float instance changes per tree.
const outlines=[[[0.30816131,0.0],[0.69164333,0.0],[1.0,0.30835667],[1.0,0.62975384],[0.62975384,1.0],[0.33285035,1.0],[0.0,0.66714965],[0.0,0.30816131]],[[0.48552241,0.0],[0.53697889,0.0],[1.0,0.46302111],[1.0,0.76353276],[0.76353276,1.0],[0.23591488,1.0],[0.0,0.76408512],[0.0,0.48552241]],[[0.32151248,0.0],[0.62645082,0.0],[1.0,0.37354918],[1.0,0.65259774],[0.65259774,1.0],[0.27983169,1.0],[0.0,0.72016831],[0.0,0.32151248]],[[0.2923666,0.0],[0.7094944,0.0],[1.0,0.2905056],[1.0,0.62367424],[0.62367424,1.0],[0.33371212,1.0],[0.0,0.66628788],[0.0,0.2923666]],[[0.48993289,0.0],[0.5212528,0.0],[1.0,0.4787472],[1.0,0.78195503],[0.78195503,1.0],[0.21468927,1.0],[0.0,0.78531073],[0.0,0.48993289]],[[0.33789516,0.0],[0.58495398,0.0],[1.0,0.41504602],[1.0,0.68931573],[0.68931573,1.0],[0.31916767,1.0],[0.0,0.68083233],[0.0,0.33789516]],[[0.33912599,0.0],[0.70077306,0.0],[1.0,0.29922694],[1.0,0.64320854],[0.64320854,1.0],[0.33688985,1.0],[0.0,0.66311015],[0.0,0.33912599]],[[0.49386555,0.0],[0.51613445,0.0],[1.0,0.48386555],[1.0,0.81792717],[0.81792717,1.0],[0.18207283,1.0],[0.0,0.81792717],[0.0,0.49386555]],[[0.33851814,0.0],[0.57999587,0.0],[1.0,0.42000413],[1.0,0.7262557],[0.7262557,1.0],[0.26404713,1.0],[0.0,0.73595287],[0.0,0.33851814]],[[0.24904122,0.0],[0.74677647,0.0],[1.0,0.25322353],[1.0,0.79518792],[0.79518792,1.0],[0.17537443,1.0],[0.0,0.82462557],[0.0,0.24904122]],[[0.32631873,0.0],[0.72031155,0.0],[1.0,0.27968845],[1.0,0.71198895],[0.71198895,1.0],[0.2823666,1.0],[0.0,0.7176334],[0.0,0.32631873]],[[0.24683609,0.0],[0.74084344,0.0],[1.0,0.25915656],[1.0,0.76597193],[0.76597193,1.0],[0.23250452,1.0],[0.0,0.76749548],[0.0,0.24683609]],[[0.14070137,0.0],[0.85783236,0.0],[1.0,0.14216764],[1.0,0.84692693],[0.84692693,1.0],[0.21022727,1.0],[0.0,0.78977273],[0.0,0.14070137]],[[0.17703403,0.0],[0.75234959,0.0],[1.0,0.24765041],[1.0,0.74901386],[0.74901386,1.0],[0.24290835,1.0],[0.0,0.75709165],[0.0,0.17703403]],[[0.17208267,0.0],[0.68554502,0.0],[1.0,0.31445498],[1.0,0.71169483],[0.71169483,1.0],[0.26647115,1.0],[0.0,0.73352885],[0.0,0.17208267]],[[0.16377649,0.0],[0.86432795,0.0],[1.0,0.13567205],[1.0,0.76028171],[0.76028171,1.0],[0.26777291,1.0],[0.0,0.73222709],[0.0,0.16377649]],[[0.21849343,0.0],[0.7206486,0.0],[1.0,0.2793514],[1.0,0.7044335],[0.7044335,1.0],[0.24784483,1.0],[0.0,0.75215517],[0.0,0.21849343]],[[0.28708546,0.0],[0.65251415,0.0],[1.0,0.34748585],[1.0,0.76920139],[0.76920139,1.0],[0.22376643,1.0],[0.0,0.77623357],[0.0,0.28708546]]];
const template=new Float32Array([0,2].flatMap(cap=>Array.from({length:6},(_,i)=>[0,cap,i+1,cap,i+2,cap]).flat()));
const lowTemplate=new Float32Array([...template.slice(36,48),...template.slice(0,12)]);
function instances(trees,origin,heights,shades=[],groups=false){
 const cos=Math.cos(origin[1]*rad),ox=R*origin[0]*rad,oy=R*Math.log(Math.tan(Math.PI/4+origin[1]*rad/2)),data=new Float32Array(trees.length*9);let n=0;
 for(let i=0;i<trees.length;i++){if(groups&&i%5!==0)continue;const t=trees[i],z=heights[i];if(!Number.isFinite(z))continue;const h=t.height;
 data.set([(R*t.position[0]*rad-ox)*cos,(R*Math.log(Math.tan(Math.PI/4+t.position[1]*rad/2))-oy)*cos,z,h*(t.kind==='needleleaved'?.75:t.kind==='shrub'?1.5:.95)*(groups?2:1),h,t.kind==='needleleaved'?1:t.kind==='shrub'?2:0,t.seed,shades[i]??1,groups?1:0],n);n+=9;
 }return data.subarray(0,n)
}
// Conservative world-space sphere encloses trunk, all LOD roots and both crown planes.
function visible(data,matrix,target=new Float32Array(data.length),indices=null,slopes=null){
 const planes=[];for(let row=0;row<3;row++)for(const sign of [-1,1]){const p=[matrix[3]+sign*matrix[row],matrix[7]+sign*matrix[4+row],matrix[11]+sign*matrix[8+row],matrix[15]+sign*matrix[12+row]];const n=Math.hypot(p[0],p[1],p[2]);planes.push(p.map(v=>v/(n||1)))}let cursor=0;
 for(let i=0;i<data.length;i+=9){const x=data[i],y=data[i+1],z=data[i+2]+data[i+4]*.5,r=Math.max(data[i+3],data[i+4])*1.8+.05+(slopes?Math.hypot(slopes[i/9*2]||0,slopes[i/9*2+1]||0)*data[i+3]:0);if(planes.some(p=>p[0]*x+p[1]*y+p[2]*z+p[3]<-r))continue;if(indices)indices[cursor/9]=i/9;target.set(data.subarray(i,i+9),cursor);cursor+=9}return target.subarray(0,cursor)
}
// Screen overlap estimates detail only: it never removes a potentially visible tree.
// Three foreground layers stay detailed; transparent foliage is not treated as solid occlusion.
function overlapDetail(data,matrix,state,now,weights=new Float32Array(data.length/9),origin=null,viewport=[360,700]){
 const cos=origin?Math.cos(origin[1]*rad):1,ox=origin?R*origin[0]*rad:0,oy=origin?R*Math.log(Math.tan(Math.PI/4+origin[1]*rad/2)):0;const pixels=new Float32Array(data.length/9),cells=new Uint16Array(32*32),items=[];let transitioning=false,low=0;
 for(let i=0;i<data.length;i+=9){const x=data[i],y=data[i+1],z=data[i+2],w=data[i+3],h=data[i+4];let minX=1,minY=1,maxX=-1,maxY=-1,depth=0,unsafe=false;
  for(const dx of [-w*.5,w*.5])for(const dy of [-w*.5,w*.5])for(const dz of [h*.25,h]){const a=x+dx,b=y+dy,c=z+dz,W=matrix[3]*a+matrix[7]*b+matrix[11]*c+matrix[15];if(W<=.001){unsafe=true;continue}const X=(matrix[0]*a+matrix[4]*b+matrix[8]*c+matrix[12])/W,Y=(matrix[1]*a+matrix[5]*b+matrix[9]*c+matrix[13])/W;minX=Math.min(minX,X);maxX=Math.max(maxX,X);minY=Math.min(minY,Y);maxY=Math.max(maxY,Y);depth+=(matrix[2]*a+matrix[6]*b+matrix[10]*c+matrix[14])/W}
  pixels[i/9]=Math.max((maxX-minX)*viewport[0]*.5,(maxY-minY)*viewport[1]*.5);const key=(origin?Math.round(ox+x/cos):x.toFixed(2))+':'+(origin?Math.round(oy+y/cos):y.toFixed(2))+':'+z.toFixed(2)+':'+data[i+8];items.push({i,key,unsafe,depth,minX:Math.max(0,Math.min(31,Math.floor((minX+1)*16))),maxX:Math.max(0,Math.min(31,Math.floor((maxX+1)*16))),minY:Math.max(0,Math.min(31,Math.floor((minY+1)*16))),maxY:Math.max(0,Math.min(31,Math.floor((maxY+1)*16)))});
 }
 items.sort((a,b)=>a.depth-b.depth||a.i-b.i);
 for(const item of items){let covered=0,total=0;for(let y=item.minY;y<=item.maxY;y++)for(let x=item.minX;x<=item.maxX;x++){if(cells[y*32+x]>=3)covered++;total++}const hidden=!item.unsafe&&total>0&&covered/total>=.8;let previous=state.get(item.key);if(!previous){previous={since:now};state.set(item.key,previous)}if(!hidden)previous.since=now;const weight=hidden?Math.max(0,Math.min(1,(now-previous.since-120)/240)):0;weights[item.i/9]=weight;if(weight>0)low++;if(hidden&&weight<1)transitioning=true;
  // Wider group cards do not count as extra physical foreground trees.
  if(!item.unsafe&&data[item.i+8]<.5)for(let y=item.minY;y<=item.maxY;y++)for(let x=item.minX;x<=item.maxX;x++)cells[y*32+x]++;
 }if(state.size>30000)state.clear();return {order:Int32Array.from(items,item=>item.i/9),pixels,weights:weights.subarray(0,data.length/9),transitioning,low}
}
const outlineGLSL='const vec2 outline[144]=vec2[144]('+outlines.flat().map(p=>'vec2('+p.map(v=>Number(v).toFixed(8)).join(',')+')').join(',')+');\n';
const instanceVertex=vertex
 .replace('layout(location=1) in vec2 a_uv;','layout(location=1) in vec2 a_corner;\nlayout(location=4) in float a_overlap;\nout float v_overlap;')
 .replace('void main(){',outlineGLSL+'const vec2 rectangle[8]=vec2[8](vec2(0.,0.),vec2(1.,0.),vec2(1.,1.),vec2(0.,1.),vec2(0.,1.),vec2(0.,1.),vec2(0.,1.),vec2(0.,1.));\nvoid main(){')
 .replace('bool cap=a_info.w>1.5;','float blend=a_overlap;v_overlap=blend;bool cap=a_corner.y>1.5;')
 .replace('vec2 root=u_roots[int(lod)*3+species];','vec2 root=mix(u_roots[int(lod)*3+species],u_roots[6+species],blend);')
 .replace('vec2 horizontal=direction.xy;', 'vec2 a_uv=blend>0.?rectangle[int(a_corner.x+.5)]:outline[((cap?9:0)+(blend>=1.?2:int(lod))*3+species)*8+int(a_corner.x+.5)];\n vec2 horizontal=direction.xy;')
 .replace('if(group<.5)v_fade*=1.-smoothstep(.75,1.,clipRatio);','if(group<.5)v_fade*=1.-smoothstep(.75,1.,clipRatio);\n if(v_fade<=0.)gl_Position=vec4(2.,2.,2.,1.);');


const instanceFragment=fragment
 .replace('in float v_cap;', 'in float v_overlap; in float v_cap;')
 .replace('int index=int(floor(v_lod+.5))*3+int(floor(v_kind+.5));','int index=(v_overlap>=1.?6:int(floor(v_lod+.5))*3)+int(floor(v_kind+.5));')
 .replace('if(tex.a<.45)discard;', 'if(v_overlap>0.&&v_overlap<1.){int lowIndex=6+int(floor(v_kind+.5));vec4 lowRect=v_cap>.5?u_topRects[lowIndex]:u_rects[lowIndex];vec2 lowUV=lowRect.xy+clamp(v_uv,vec2(.002),vec2(.998))*lowRect.zw;vec4 lowTex=v_cap>.5?texture(u_topAtlas,lowUV):texture(u_atlas,lowUV);tex=mix(tex,lowTex,v_overlap);}if(tex.a<.45)discard;');


function coverageInstances(trees,origin,heights,shades=[],groups=false){
 if(!trees.some(t=>t.coverage||t.cluster))return instances(trees,origin,heights,shades,groups);
 const cos=Math.cos(origin[1]*rad),o=[R*origin[0]*rad,R*Math.log(Math.tan(Math.PI/4+origin[1]*rad/2))],data=new Float32Array(trees.length*9);let n=0;
 for(let i=0;i<trees.length;i++){const t=trees[i],belongs=!!(t.cluster||t.orientedFallback);if(belongs!==groups||!Number.isFinite(heights[i]))continue;const h=t.height,k=t.kind==='needleleaved'?1:t.kind==='shrub'?2:0,seed=t.cluster?((t.clusterLevel||0)+t.seed*.99)/3:t.seed;data.set([(R*t.position[0]*rad-o[0])*cos,(R*Math.log(Math.tan(Math.PI/4+t.position[1]*rad/2))-o[1])*cos,heights[i],t.cluster?t.width:h*(k===1?.75:k===2?1.5:.95),h,k,seed,shades[i]??1,t.cluster?1+2*(t.repeat||1):groups?1:0],n);n+=9}return data.subarray(0,n)
}

function coverageSlopes(trees,heights,groups=false){const modern=trees.some(t=>t.coverage||t.cluster),out=[];for(let i=0;i<trees.length;i++){const t=trees[i];if(!Number.isFinite(heights[i]))continue;if(modern?!!(t.cluster||t.orientedFallback)!==groups:groups&&i%5!==0)continue;out.push(t.slope?.[0]||0,t.slope?.[1]||0)}return new Float32Array(out)}

const screenVertex=instanceVertex
 .replace('layout(location=4) in float a_overlap;','layout(location=4) in float a_overlap;\nlayout(location=5) in float a_pixels;\nlayout(location=6) in vec2 a_slope;\nout float v_cluster;out float v_repeat;out float v_pixels;out float v_index;out float v_lowIndex;out vec2 v_sampleUV;')
 .replace('float lod=ratio<.35?0.:ratio<.7?1.:2.;','bool cluster=a_info.w>1.5;v_cluster=cluster?1.:0.;v_repeat=cluster?floor(a_info.w*.5):1.;v_pixels=a_pixels;float lod=cluster?clamp(floor(a_info.y*3.),0.,2.):a_pixels>=60.?0.:a_pixels>=20.?1.:2.;')
 .replace('vec2 root=mix(u_roots[int(lod)*3+species],u_roots[6+species],blend);','vec2 root=cluster?vec2(.5,1.):mix(u_roots[int(lod)*3+species],u_roots[6+species],blend);')
 .replace('if(group>.5&&u_pseudo>.5)', 'if(!cluster&&group>.5&&u_pseudo>.5)')
 .replace('v_world=position;', 'vec2 sampleUV=v_uv;if(cluster){if(fract((a_info.z*(.92+a_info.y*.16))*97.)>.5)sampleUV.x=1.-sampleUV.x;sampleUV*=vec2(v_repeat,cap?v_repeat:1.);}v_sampleUV=sampleUV;v_index=(cluster?9.:0.)+(cluster||blend<1.?floor(lod+.5)*3.:6.)+floor(a_info.x+.5)+(cap?18.:0.);v_lowIndex=6.+floor(a_info.x+.5)+(cap?18.:0.);if(cluster)position.z+=dot(a_slope,position.xy-a_anchor.xy);v_world=position;')
 .replace('float overhead=smoothstep(.88,.98,abs(direction.z));','if(cluster&&lengthXY>.001)position.xy+=direction.xy/lengthXY*a_size.x*.4;float overhead=cluster?smoothstep(.1,.3,abs(direction.z)):smoothstep(.88,.98,abs(direction.z));')
 .replace('(cap?overhead:1.-overhead)', '(cap?overhead:cluster?1.:1.-overhead)');
const screenFragment=`#version 300 es
precision highp float;precision highp sampler2DArray;
uniform sampler2DArray u_atlas;
in float v_cluster;in float v_pixels;in float v_overlap;in float v_cap;in float v_index;in float v_lowIndex;in vec2 v_sampleUV;in float v_shade;in float v_fade;in vec2 v_uv;out vec4 color;
void main(){float fade=v_fade;if(v_cluster>.5){float edge=min(min(v_uv.x,1.-v_uv.x),min(v_uv.y,1.-v_uv.y));fade*=smoothstep(0.,.06,edge);}if(fade<.999){float d=fract(dot(mod(floor(gl_FragCoord.xy),vec2(4.)),vec2(.25,.5625)));if(v_cap>.5)d=1.-d-.0001;if(fade<=d)discard;}
 vec2 uv=v_sampleUV;if(v_cluster<.5)uv=clamp(uv,vec2(.002),vec2(.998));else if(v_cap<.5)uv.y=clamp(uv.y,.002,.998);
 vec4 tex=texture(u_atlas,vec3(uv,v_index));if(v_cluster<.5&&v_overlap>0.&&v_overlap<1.)tex=mix(tex,texture(u_atlas,vec3(uv,v_lowIndex)),v_overlap);
 if(tex.a<(v_cluster>.5?.4:mix(.2,.45,smoothstep(6.,30.,v_pixels))))discard;color=vec4(tex.rgb*v_shade,1.);
}`;


let bleedQueue,bleedSeen;
function bleedAlpha(data,size){const n=size*size;if(!bleedQueue||bleedQueue.length<n){bleedQueue=new Int32Array(n);bleedSeen=new Uint8Array(n)}bleedSeen.fill(0,0,n);let head=0,tail=0;for(let i=0;i<n;i++)if(data[i*4+3]){bleedQueue[tail++]=i;bleedSeen[i]=1}while(head<tail){const i=bleedQueue[head++],x=i%size;for(let k=0;k<4;k++){const j=k===0?(x?i-1:-1):k===1?(x<size-1?i+1:-1):k===2?(i>=size?i-size:-1):(i<n-size?i+size:-1);if(j<0||bleedSeen[j])continue;bleedSeen[j]=1;data[j*4]=data[i*4];data[j*4+1]=data[i*4+1];data[j*4+2]=data[i*4+2];bleedQueue[tail++]=j}}return data}

root.CykloCanopy={arraySize:320,bleedAlpha,coverageSlopes,coverageInstances,screenVertex,screenFragment,clusterAsset:'./assets/forest-clusters.png',clusterTopAsset:'./assets/forest-clusters-top.png',lowTemplate,overlapDetail,instanceFragment,visible,outlines,template,instances,instanceVertex,rects,roots,topRects,topAsset:'./assets/tree-crowns-top-v2.png',asset:'./assets/tree-crowns-v2.png',geometry,vertex,fragment};if(typeof module!=='undefined')module.exports=root.CykloCanopy;
})(globalThis);
