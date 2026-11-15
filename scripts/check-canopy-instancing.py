"""Render old expanded cards and instanced outlines in real EGL and compare pixels.
Optional: requires Mesa GLES3 and Pillow. No browser, network or mobile FPS claim.
"""
import runpy,json,subprocess,ctypes as c
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
g=runpy.run_path(str(ROOT/'scripts/check-canopy-gpu.py'));globals().update({k:v for k,v in g.items() if not k.startswith('__')})
optimized=json.loads(subprocess.check_output(['node','-e',"const C=require('./module-src/cyklo/canopy.js');console.log(JSON.stringify({vertex:C.instanceVertex,template:Array.from(C.template)}))"],cwd=ROOT))
sh=createShader(0x8B31);txt=c.c_char_p(optimized['vertex'].encode());source(sh,1,c.byref(txt),None);compile(sh);ok=I();getiv(sh,0x8B81,c.byref(ok));buf=c.create_string_buffer(8192);log(sh,8192,None,buf);assert ok.value,buf.value
instanced=proc('glCreateProgram',U,[])();attach(instanced,sh);attach(instanced,compiled[1]);proc('glLinkProgram',None,[U])(instanced);proc('glGetProgramiv',None,[U,U,c.POINTER(I)])(instanced,0x8B82,c.byref(ok));assert ok.value
use=proc('glUseProgram',None,[U]);bind=proc('glBindBuffer',None,[U,U]);upload=proc('glBufferData',None,[U,c.c_ssize_t,P,U]);attr=proc('glVertexAttribPointer',None,[U,I,U,U,I,P]);divisor=proc('glVertexAttribDivisor',None,[U,U]);enable=proc('glEnableVertexAttribArray',None,[U]);drawInstanced=proc('glDrawArraysInstanced',None,[U,I,I,I])
referenceBuffer=gen('glGenBuffers');instanceBuffer=gen('glGenBuffers');templateBuffer=gen('glGenBuffers')
def data_buffer(buffer,values):
 bind(0x8892,buffer);values=(F*len(values))(*values);upload(0x8892,c.sizeof(values),values,0x88E4)
data_buffer(templateBuffer,optimized['template'])
views=[((0,-10,6),[.1,0,0,0,0,0,.01,0,0,.1,0,0,0,-.6,0,1]),((0,-50,6),[.1,0,0,0,0,0,.01,0,0,.1,0,0,0,-.6,0,1]),((0,-85,6),[.1,0,0,0,0,0,.01,0,0,.1,0,0,0,-.6,0,1]),((0,0,20),[.1,0,0,0,0,.1,0,0,0,0,.01,0,0,0,0,1]),((0,-5,18),[.1,0,0,0,0,.06,0,0,0,.05,0,0,0,-.6,0,1])]
def uniforms(p,eye,matrix,pseudo=0):
 use(p);u3(loc(p,b'u_eye'),*eye);um(loc(p,b'u_matrix'),1,0,(F*16)(*matrix))
 for name,value in [('u_detail',100),('u_limit',1000),('u_pseudo',pseudo)]:u1(loc(p,name.encode()),value)
 for name,value in [('u_atlas',0),('u_topAtlas',1)]:proc('glUniform1i',None,[I,I])(loc(p,name.encode()),value)
 for name,values,size in [('u_rects[0]',assets['rects'],4),('u_topRects[0]',assets['topRects'],4),('u_roots[0]',assets['roots'],2)]:proc('glUniform'+str(size)+'fv',None,[I,I,c.POINTER(F)])(loc(p,name.encode()),9,(F*(9*size))(*[v for row in values for v in row]))
def pixels():
 p=(c.c_ubyte*(256*256*4))();read(0,0,256,256,0x1908,0x1401,p);return bytes(p)
max_diff=0;cases=0
views.extend([((0,0,z),views[3][1]) for z in [55,90]])
for kind in range(3):
 for group in [0,1]:
  width=11.4*(2 if group else 1);height=12
  vertices=[]
  for cap in [0,2]:
   for u,v in [(0,0),(1,0),(1,1),(0,0),(1,1),(0,1)]:vertices.extend([0,0,0,u,v,width,height,kind,.5,1,group+cap])
  data_buffer(referenceBuffer,vertices);data_buffer(instanceBuffer,[0,0,0,width,height,kind,.5,1,group])
  for eye,matrix in views:
   uniforms(program,eye,matrix,0);bind(0x8892,referenceBuffer)
   for index,size,offset in [(0,3,0),(1,2,12),(2,2,20),(3,4,28)]:enable(index);attr(index,size,0x1406,0,44,offset);divisor(index,0)
   clear(0x4000);draw(4,0,12);reference=pixels()
   uniforms(instanced,eye,matrix,0);bind(0x8892,instanceBuffer)
   for index,size,offset in [(0,3,0),(2,2,12),(3,4,20)]:enable(index);attr(index,size,0x1406,0,36,offset);divisor(index,1)
   bind(0x8892,templateBuffer);enable(1);attr(1,2,0x1406,0,8,0);divisor(1,0)
   clear(0x4000);drawInstanced(4,0,36,1);actual=pixels()
   visible=sum(v>0 for v in reference[3::4]);lost=sum(reference[i+3]>0 and actual[i+3]==0 for i in range(0,len(reference),4));changed=sum(max(abs(reference[i+j]-actual[i+j]) for j in range(4))>8 for i in range(0,len(reference),4));ratio=changed/max(1,visible);max_diff=max(max_diff,ratio);cases+=1
   assert lost<=max(3,visible*.001),(kind,group,eye,'clipped silhouette',lost,visible)
   assert ratio<.01,(kind,group,eye,ratio)
assert proc('glGetError',U,[])()==0
print(f'PASS {cases} old/instanced GPU comparisons: <1% changed foreground pixels, worst {max_diff:.4%}; unchanged artwork/LOD, top view and mixed-plane transition')

# Dense mixed scene in a real depth framebuffer, using perspective projections.
import math
fbo=gen('glGenFramebuffers');proc('glBindFramebuffer',None,[U,U])(0x8D40,fbo)
for attachment,fmt in [(0x8CE0,0x8058),(0x8D00,0x81A6)]:
 rb=gen('glGenRenderbuffers');proc('glBindRenderbuffer',None,[U,U])(0x8D41,rb);proc('glRenderbufferStorage',None,[U,U,I,I])(0x8D41,fmt,256,256);proc('glFramebufferRenderbuffer',None,[U,U,U,U])(0x8D40,attachment,0x8D41,rb)
assert proc('glCheckFramebufferStatus',U,[U])(0x8D40)==0x8CD5
proc('glEnable',None,[U])(0x0B71);proc('glDepthFunc',None,[U])(0x0203);proc('glDepthMask',None,[U])(1)
def normalize(v):
 n=math.sqrt(sum(x*x for x in v));return [x/n for x in v]
def cross(a,b):return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]
def multiply(a,b):return [sum(a[k*4+row]*b[col*4+k] for k in range(4)) for col in range(4) for row in range(4)]
def perspective(eye):
 target=[0,0,7];z=normalize([eye[i]-target[i] for i in range(3)]);x=normalize(cross([0,0,1],z));y=cross(z,x)
 view=[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-sum(x[i]*eye[i] for i in range(3)),-sum(y[i]*eye[i] for i in range(3)),-sum(z[i]*eye[i] for i in range(3)),1]
 f=1/math.tan(math.radians(55)/2);near,far=1,500;projection=[f,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];return multiply(projection,view)
expanded=[];instances=[]
for index in range(45):
 x=(index%9-4)*5;y=(index//9-2)*7;z=(index%4)*.4;h=9+(index%5);kind=index%3;w=h*(.75 if kind==1 else 1.5 if kind==2 else .95)
 for group in [0,1]:
  if group and index%5:continue
  width=w*(2 if group else 1);seed=(index%7)/7;shade=.65+(index%4)*.12
  instances.extend([x,y,z,width,h,kind,seed,shade,group])
  for cap in [0,2]:
   for u,v in [(0,0),(1,0),(1,1),(0,0),(1,1),(0,1)]:expanded.extend([x,y,z,u,v,width,h,kind,seed,shade,group+cap])
data_buffer(referenceBuffer,expanded);data_buffer(instanceBuffer,instances)
for eye in [(0,-50,30),(35,-40,32),(-35,30,45),(1,-3,80)]:
 matrix=perspective(eye);uniforms(program,eye,matrix,1);bind(0x8892,referenceBuffer)
 for index,size,offset in [(0,3,0),(1,2,12),(2,2,20),(3,4,28)]:enable(index);attr(index,size,0x1406,0,44,offset);divisor(index,0)
 clear(0x4100);draw(4,0,len(expanded)//11);reference=pixels()
 uniforms(instanced,eye,matrix,1);bind(0x8892,instanceBuffer)
 for index,size,offset in [(0,3,0),(2,2,12),(3,4,20)]:enable(index);attr(index,size,0x1406,0,36,offset);divisor(index,1)
 bind(0x8892,templateBuffer);enable(1);attr(1,2,0x1406,0,8,0);divisor(1,0);clear(0x4100);drawInstanced(4,0,36,len(instances)//9);actual=pixels()
 visible=sum(v>0 for v in reference[3::4]);changed=sum(max(abs(reference[i+j]-actual[i+j]) for j in range(4))>8 for i in range(0,len(reference),4));assert visible>1000;assert changed/visible<.01,(eye,changed,visible)
assert proc('glGetError',U,[])()==0
print('PASS four dense mixed-species perspective/depth scenes across azimuths: <1% changed foreground pixels')
