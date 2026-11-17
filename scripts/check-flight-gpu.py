"""Optional actual GLES3 compile/link of all flight materials, without a browser."""
import ctypes as c,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
assets=json.loads(subprocess.check_output(['node','scripts/flight/shader-smoke.mjs'],cwd=ROOT,stderr=subprocess.DEVNULL))
E=c.CDLL('libEGL.so.1');I=c.c_int;U=c.c_uint;P=c.c_void_p
E.eglGetProcAddress.argtypes=[c.c_char_p];E.eglGetProcAddress.restype=P
def proc(name,ret,args):
 ptr=E.eglGetProcAddress(name.encode());assert ptr,name
 return c.CFUNCTYPE(ret,*args)(ptr)
display=proc('eglGetPlatformDisplayEXT',P,[U,P,c.POINTER(I)])(0x31DD,None,None)
E.eglInitialize.argtypes=[P,c.POINTER(I),c.POINTER(I)];E.eglInitialize.restype=U
assert E.eglInitialize(display,c.byref(I()),c.byref(I()))
E.eglBindAPI.argtypes=[U];assert E.eglBindAPI(0x30A0)
attrs=(I*13)(0x3033,1,0x3040,0x40,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038)
config=P();num=I();E.eglChooseConfig.argtypes=[P,c.POINTER(I),c.POINTER(P),I,c.POINTER(I)];assert E.eglChooseConfig(display,attrs,c.byref(config),1,c.byref(num)) and num.value
E.eglCreatePbufferSurface.argtypes=[P,P,c.POINTER(I)];E.eglCreatePbufferSurface.restype=P
surface=E.eglCreatePbufferSurface(display,config,(I*5)(0x3057,16,0x3056,16,0x3038));assert surface
E.eglCreateContext.argtypes=[P,P,P,c.POINTER(I)];E.eglCreateContext.restype=P
ctx=E.eglCreateContext(display,config,None,(I*3)(0x3098,3,0x3038));assert ctx
E.eglMakeCurrent.argtypes=[P,P,P,P];assert E.eglMakeCurrent(display,surface,surface,ctx)
create=proc('glCreateShader',U,[U]);source=proc('glShaderSource',None,[U,I,c.POINTER(c.c_char_p),c.POINTER(I)]);compile=proc('glCompileShader',None,[U]);get=proc('glGetShaderiv',None,[U,U,c.POINTER(I)]);log=proc('glGetShaderInfoLog',None,[U,I,c.POINTER(I),c.c_char_p])
for material in assets:
 program=proc('glCreateProgram',U,[])()
 for key,typ in [('vertex',0x8B31),('fragment',0x8B30)]:
  sh=create(typ);txt=c.c_char_p(material[key].encode());source(sh,1,c.byref(txt),None);compile(sh);ok=I();get(sh,0x8B81,c.byref(ok));buf=c.create_string_buffer(16384);log(sh,16384,None,buf);assert ok.value,(material['level'],key,buf.value.decode());proc('glAttachShader',None,[U,U])(program,sh)
 proc('glLinkProgram',None,[U])(program);ok=I();proc('glGetProgramiv',None,[U,U,c.POINTER(I)])(program,0x8B82,c.byref(ok));buf=c.create_string_buffer(16384);proc('glGetProgramInfoLog',None,[U,I,c.POINTER(I),c.c_char_p])(program,16384,None,buf);assert ok.value,buf.value
 print('PASS GLES3 compile/link:',material['level'])
