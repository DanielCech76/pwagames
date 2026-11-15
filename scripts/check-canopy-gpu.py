"""Optional Linux EGL/GLES3 smoke test (Mesa surfaceless); no window or network.
Run: python scripts/check-canopy-gpu.py
"""
import ctypes as c,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
assets=json.loads(subprocess.check_output(['node','-e',"const C=require('./module-src/cyklo/canopy.js'); console.log(JSON.stringify({vertex:C.vertex,fragment:C.fragment,rects:C.rects,roots:C.roots,topRects:C.topRects}))"],cwd=ROOT))
from PIL import Image
import os,struct,math
E=c.CDLL('libEGL.so.1');I=c.c_int;U=c.c_uint;P=c.c_void_p;F=c.c_float
E.eglGetProcAddress.argtypes=[c.c_char_p];E.eglGetProcAddress.restype=P
def proc(name,ret,args):
 ptr=E.eglGetProcAddress(name.encode());assert ptr,name
 return c.CFUNCTYPE(ret,*args)(ptr)
display=proc('eglGetPlatformDisplayEXT',P,[U,P,c.POINTER(I)])(0x31DD,None,None)
E.eglInitialize.argtypes=[P,c.POINTER(I),c.POINTER(I)];E.eglInitialize.restype=U
major=I();minor=I();assert E.eglInitialize(display,c.byref(major),c.byref(minor))
E.eglBindAPI.argtypes=[U];assert E.eglBindAPI(0x30A0)
attrs=(I*13)(0x3033,1,0x3040,0x40,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038)
config=P();num=I();E.eglChooseConfig.argtypes=[P,c.POINTER(I),c.POINTER(P),I,c.POINTER(I)];assert E.eglChooseConfig(display,attrs,c.byref(config),1,c.byref(num)) and num.value
E.eglCreatePbufferSurface.argtypes=[P,P,c.POINTER(I)];E.eglCreatePbufferSurface.restype=P
surface=E.eglCreatePbufferSurface(display,config,(I*5)(0x3057,256,0x3056,256,0x3038));assert surface
E.eglCreateContext.argtypes=[P,P,P,c.POINTER(I)];E.eglCreateContext.restype=P
ctx=E.eglCreateContext(display,config,None,(I*3)(0x3098,3,0x3038));assert ctx
E.eglMakeCurrent.argtypes=[P,P,P,P];assert E.eglMakeCurrent(display,surface,surface,ctx)
getString=proc('glGetString',c.c_char_p,[U]);print(getString(0x1F02).decode(),getString(0x1F01).decode())
createShader=proc('glCreateShader',U,[U]);source=proc('glShaderSource',None,[U,I,c.POINTER(c.c_char_p),c.POINTER(I)]);compile=proc('glCompileShader',None,[U]);getiv=proc('glGetShaderiv',None,[U,U,c.POINTER(I)]);log=proc('glGetShaderInfoLog',None,[U,I,c.POINTER(I),c.c_char_p])
shaders=assets;compiled=[]
for key,typ in [('vertex',0x8B31),('fragment',0x8B30)]:
 sh=createShader(typ);txt=c.c_char_p(shaders[key].encode());source(sh,1,c.byref(txt),None);compile(sh);ok=I();getiv(sh,0x8B81,c.byref(ok));buf=c.create_string_buffer(8192);log(sh,8192,None,buf);assert ok.value,buf.value;compiled.append(sh)
program=proc('glCreateProgram',U,[])();attach=proc('glAttachShader',None,[U,U]);[attach(program,s) for s in compiled];varyings=(c.c_char_p*1)(b'v_world');proc('glTransformFeedbackVaryings',None,[U,I,c.POINTER(c.c_char_p),U])(program,1,varyings,0x8C8C);proc('glLinkProgram',None,[U])(program);ok=I();proc('glGetProgramiv',None,[U,U,c.POINTER(I)])(program,0x8B82,c.byref(ok));assert ok.value
proc('glUseProgram',None,[U])(program)
def gen(name):
 n=U();proc(name,None,[I,c.POINTER(U)])(1,c.byref(n));return n.value
texture=gen('glGenTextures');proc('glBindTexture',None,[U,U])(0x0DE1,texture)
image=Image.open(ROOT/'module-src/cyklo/assets/tree-crowns-v2.png').convert('RGBA');raw=image.tobytes();proc('glTexImage2D',None,[U,I,I,I,I,I,U,U,P])(0x0DE1,0,0x1908,image.width,image.height,0,0x1908,0x1401,c.cast(c.c_char_p(raw),P))
param=proc('glTexParameteri',None,[U,U,I]);param(0x0DE1,0x2801,0x2601);param(0x0DE1,0x2800,0x2601)
top_image=Image.open(ROOT/'module-src/cyklo/assets/tree-crowns-top-v2.png').convert('RGBA');top_raw=top_image.tobytes();proc('glActiveTexture',None,[U])(0x84C1);top_texture=gen('glGenTextures');proc('glBindTexture',None,[U,U])(0x0DE1,top_texture);proc('glTexImage2D',None,[U,I,I,I,I,I,U,U,P])(0x0DE1,0,0x1908,top_image.width,top_image.height,0,0x1908,0x1401,c.cast(c.c_char_p(top_raw),P));param(0x0DE1,0x2801,0x2601);param(0x0DE1,0x2800,0x2601);proc('glActiveTexture',None,[U])(0x84C0)
vertices=[]
for mode in [0,2]:
 for u,v in [(0,0),(1,0),(1,1),(0,0),(1,1),(0,1)]:vertices.extend([0,0,0,u,v,11.4,12,0,.5,1,mode])
array=(F*len(vertices))(*vertices);buffer=gen('glGenBuffers');proc('glBindBuffer',None,[U,U])(0x8892,buffer);proc('glBufferData',None,[U,c.c_ssize_t,P,U])(0x8892,c.sizeof(array),array,0x88E4)
for loc,size,offset in [(0,3,0),(1,2,12),(2,2,20),(3,4,28)]:proc('glEnableVertexAttribArray',None,[U])(loc);proc('glVertexAttribPointer',None,[U,I,U,U,I,P])(loc,size,0x1406,0,44,offset)
loc=proc('glGetUniformLocation',I,[U,c.c_char_p]);u1=proc('glUniform1f',None,[I,F]);u3=proc('glUniform3f',None,[I,F,F,F]);um=proc('glUniformMatrix4fv',None,[I,I,U,c.POINTER(F)])
for n,v in [('u_detail',100),('u_limit',1000),('u_pseudo',0)]:u1(loc(program,n.encode()),v)
proc('glUniform1i',None,[I,I])(loc(program,b'u_atlas'),0)
proc('glUniform1i',None,[I,I])(loc(program,b'u_topAtlas'),1)
proc('glUniform4fv',None,[I,I,c.POINTER(F)])(loc(program,b'u_topRects[0]'),9,(F*36)(*[v for r in assets['topRects'] for v in r]))
proc('glUniform4fv',None,[I,I,c.POINTER(F)])(loc(program,b'u_rects[0]'),9,(F*36)(*[v for r in assets['rects'] for v in r]))
proc('glUniform2fv',None,[I,I,c.POINTER(F)])(loc(program,b'u_roots[0]'),9,(F*18)(*[v for r in assets['roots'] for v in r]))
clear=proc('glClear',None,[U]);draw=proc('glDrawArrays',None,[U,I,I]);read=proc('glReadPixels',None,[I,I,I,I,U,U,P]);counts=[]
for index,(eye,matrix) in enumerate([
((0,-10,6),[.1,0,0,0,0,0,.01,0,0,.1,0,0,0,-.6,0,1]),
((0,-50,6),[.1,0,0,0,0,0,.01,0,0,.1,0,0,0,-.6,0,1]),
((0,-85,6),[.1,0,0,0,0,0,.01,0,0,.1,0,0,0,-.6,0,1]),
((0,0,20),[.1,0,0,0,0,.1,0,0,0,0,.01,0,0,0,0,1])]):
 u3(loc(program,b'u_eye'),*eye);um(loc(program,b'u_matrix'),1,0,(F*16)(*matrix));clear(0x4000);draw(4,0,12);pixels=(c.c_ubyte*(256*256*4))();read(0,0,256,256,0x1908,0x1401,pixels);data=bytes(pixels);n=sum(data[i]>0 for i in range(3,len(data),4));assert n>100,(index,n);counts.append(n)
 if os.environ.get('CYKLO_GPU_SNAPSHOT_DIR'):
  dest=Path(os.environ['CYKLO_GPU_SNAPSHOT_DIR']);dest.mkdir(parents=True,exist_ok=True);Image.frombytes('RGBA',(256,256),data).transpose(Image.Transpose.FLIP_TOP_BOTTOM).save(dest/f'crowns-{index}.png')
assert proc('glGetError',U,[])()==0
print('PASS compiled/linked and rendered three LODs plus vertical top-down:',counts)
u1(loc(program,b'u_limit'),1);clear(0x4000);draw(4,0,12);pixels=(c.c_ubyte*(256*256*4))();read(0,0,256,256,0x1908,0x1401,pixels);assert not any(bytes(pixels)[3::4]),'outside detail distance must be transparent'
print('PASS hard range clipping')

# Capture actual shader world coordinates: trunk bases stay on DEM and tops stay vertically above them.
u1(loc(program,b'u_limit'),1000)
feedback=gen('glGenBuffers');proc('glBindBuffer',None,[U,U])(0x8C8E,feedback);proc('glBufferData',None,[U,c.c_ssize_t,P,U])(0x8C8E,12*3*4,None,0x88E9);proc('glBindBufferBase',None,[U,U,U])(0x8C8E,0,feedback)
proc('glEnable',None,[U])(0x8C89)
for eye in [(0,-10,6),(35,-35,35),(-65,35,40),(0,0,100)]:
 u3(loc(program,b'u_eye'),*eye);proc('glBeginTransformFeedback',None,[U])(4);draw(4,0,12);proc('glEndTransformFeedback',None,[])()
 ptr=proc('glMapBufferRange',P,[U,c.c_ssize_t,c.c_ssize_t,U])(0x8C8E,0,12*3*4,1);assert ptr;world=struct.unpack('36f',c.string_at(ptr,12*3*4));proc('glUnmapBuffer',U,[U])(0x8C8E)
 top=world[0:3];other_top=world[3:6];bottom=world[15:18]
 assert abs(top[0]-bottom[0])<1e-5 and abs(top[1]-bottom[1])<1e-5,('trunk tilted',eye,top,bottom)
 assert abs(top[2]-bottom[2]-12)<1e-5
 distance=math.sqrt(eye[0]**2+eye[1]**2+(eye[2]-7.2)**2);lod=0 if distance<35 else 1 if distance<70 else 2;rx,ry=assets['roots'][lod*3]
 assert abs(top[0]+(other_top[0]-top[0])*rx)<1e-5 and abs(top[1]+(other_top[1]-top[1])*rx)<1e-5
 assert abs(top[2]+(bottom[2]-top[2])*ry)<1e-5,('foot moved off DEM',eye)
proc('glDisable',None,[U])(0x8C89)
assert proc('glGetError',U,[])()==0
print('PASS GPU transform feedback: fixed world-vertical trunks and DEM foot anchors across camera azimuth/elevation and all LODs')
