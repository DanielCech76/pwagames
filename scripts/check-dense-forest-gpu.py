"""Actual GLES3 validation of screen-space LOD, mipmapped arrays and forest patches."""
from pathlib import Path
import runpy,subprocess,json,tempfile,ctypes as c
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
g=runpy.run_path(str(ROOT/'scripts/check-canopy-gpu.py'));globals().update({k:v for k,v in g.items() if not k.startswith('__')})
new=json.loads(subprocess.check_output(['node','-e',"const C=require('./module-src/cyklo/canopy.js');console.log(JSON.stringify({vertex:C.screenVertex,fragment:C.screenFragment,template:Array.from(C.template),low:Array.from(C.lowTemplate)}))"],cwd=ROOT))
objects=[]
for src,typ in [(new['vertex'],0x8B31),(new['fragment'],0x8B30)]:
 sh=createShader(typ);txt=c.c_char_p(src.encode());source(sh,1,c.byref(txt),None);compile(sh);ok=I();getiv(sh,0x8B81,c.byref(ok));buf=c.create_string_buffer(8192);log(sh,8192,None,buf);assert ok.value,buf.value;objects.append(sh)
p=proc('glCreateProgram',U,[])();[attach(p,s) for s in objects];proc('glLinkProgram',None,[U])(p);proc('glGetProgramiv',None,[U,U,c.POINTER(I)])(p,0x8B82,c.byref(ok));buf=c.create_string_buffer(8192);proc('glGetProgramInfoLog',None,[U,I,c.POINTER(I),c.c_char_p])(p,8192,None,buf);assert ok.value,buf.value
layers=[]
for overhead,base,clusters in [(False,'tree-crowns-v2.png','forest-clusters.png'),(True,'tree-crowns-top-v2.png','forest-clusters-top.png')]:
 orig=Image.open(ROOT/'module-src/cyklo/assets'/base).convert('RGBA');patch=Image.open(ROOT/'module-src/cyklo/assets'/clusters).convert('RGBA');rects=assets['topRects'] if overhead else assets['rects']
 for index in range(18):
  image=orig if index<9 else patch;rect=rects[index] if index<9 else [(index%9)%3/3,(index%9)//3/3,1/3,1/3];x,y,w,h=rect;cropped=image.crop((round(x*image.width),round(y*image.height),round((x+w)*image.width),round((y+h)*image.height))).resize((320,320),Image.Resampling.BILINEAR);layers.append(cropped.tobytes())
with tempfile.TemporaryDirectory() as temp:
 source_path=Path(temp)/'layers.rgba';source_path.write_bytes(b''.join(layers));subprocess.run(['node','-e',"const fs=require('fs'),C=require('./module-src/cyklo/canopy.js'),p=process.argv[1],b=fs.readFileSync(p),n=320*320*4;for(let i=0;i<b.length;i+=n)C.bleedAlpha(b.subarray(i,i+n),320);fs.writeFileSync(p,b)",str(source_path)],cwd=ROOT,check=True);raw=source_path.read_bytes()
 for unit in [2]:
  proc('glActiveTexture',None,[U])(0x84C0+unit);t=gen('glGenTextures');proc('glBindTexture',None,[U,U])(0x8C1A,t);part=raw;data=c.create_string_buffer(part);proc('glTexImage3D',None,[U,I,I,I,I,I,I,U,U,P])(0x8C1A,0,0x8058,320,320,36,0,0x1908,0x1401,data);proc('glGenerateMipmap',None,[U])(0x8C1A)
  for key,value in [(0x2801,0x2703),(0x2800,0x2601),(0x2802,0x2901),(0x2803,0x2901)]:param(0x8C1A,key,value)
proc('glUseProgram',None,[U])(p)
for name,value in [('u_atlas',2),('u_topAtlas',3)]:proc('glUniform1i',None,[I,I])(loc(p,name.encode()),value)
proc('glUniform2fv',None,[I,I,c.POINTER(F)])(loc(p,b'u_roots[0]'),9,(F*18)(*[v for row in assets['roots'] for v in row]))
bind=proc('glBindBuffer',None,[U,U]);upload=proc('glBufferData',None,[U,c.c_ssize_t,P,U]);attr=proc('glVertexAttribPointer',None,[U,I,U,U,I,P]);divisor=proc('glVertexAttribDivisor',None,[U,U]);enable=proc('glEnableVertexAttribArray',None,[U]);disable=proc('glDisableVertexAttribArray',None,[U]);const=proc('glVertexAttrib1f',None,[U,F]);drawInstanced=proc('glDrawArraysInstanced',None,[U,I,I,I])
instance=gen('glGenBuffers');template=gen('glGenBuffers')
def buffer_data(buffer,values):
 bind(0x8892,buffer);a=(F*len(values))(*values);upload(0x8892,c.sizeof(a),a,0x88E4)
def render(record,pixel=100,weight=0,detail=100,top=False,slope=(0,0)):
 buffer_data(instance,record)
 for index,size,offset in [(0,3,0),(2,2,12),(3,4,20)]:enable(index);attr(index,size,0x1406,0,36,offset);divisor(index,1)
 buffer_data(template,new['low'] if weight>=1 else new['template']);enable(1);attr(1,2,0x1406,0,8,0);divisor(1,0)
 for index,value in [(4,weight),(5,pixel)]:disable(index);const(index,value)
 disable(6);proc('glVertexAttrib2f',None,[U,F,F])(6,*slope)
 eye=(0,0,20) if top else (0,-10,6);matrix=[.04,0,0,0,0,.04,0,0,0,0,.01,0,0,0,0,1] if top else [.04,0,0,0,0,0,.01,0,0,.1,0,0,0,-.6,0,1]
 u3(loc(p,b'u_eye'),*eye);um(loc(p,b'u_matrix'),1,0,(F*16)(*matrix))
 for name,value in [('u_detail',detail),('u_limit',4000),('u_pseudo',1)]:u1(loc(p,name.encode()),value)
 clear(0x4000);drawInstanced(4,0,12 if weight>=1 else 36,1);pixels=(c.c_ubyte*(256*256*4))();read(0,0,256,256,0x1908,0x1401,pixels);return bytes(pixels)
for kind in range(3):
 record=[0,0,0,11.4,12,kind,.5,1,0];painted=render(record,100);medium=render(record,40);simple=render(record,10,1);assert painted!=medium and medium!=simple;assert simple==render(record,10,1,4000),'range must not change pixel-selected detail';assert sum(v>0 for v in simple[3::4])>100
 for level in range(3):
  patch=[0,0,0,40,15.6,kind,(level+.3)/3,1,3]
  for top in [False,True]:
   image_bytes=render(patch,8,1,4000,top);assert sum(v>0 for v in image_bytes[3::4])>200,(kind,level,top)
   if kind==0 and level==2 and not top:Image.frombytes('RGBA',(256,256),image_bytes).transpose(Image.Transpose.FLIP_TOP_BOTTOM).save('/tmp/cyklo-dense-patch.png')
  assert render(patch,8,1,4000,False,(.2,.1))!=render(patch,8,1,4000,False),'slope must affect cluster geometry'
assert proc('glGetError',U,[])()==0
print('PASS production shaders: 36 isolated mipmapped layers, all species/densities/front/top, independent pixel LOD, range invariance and terrain slopes')

# Compare complete old/new forest passes in the same synthetic portrait view.
import os,time,statistics
with tempfile.TemporaryDirectory() as temp:
 dest=Path(temp)/'scene.json';subprocess.run(['node','scripts/benchmark-forest-coverage.cjs'],cwd=ROOT,env={**os.environ,'CYKLO_COVERAGE_SCENE':str(dest)},check=True,stdout=subprocess.DEVNULL);scene=json.loads(dest.read_text())
old_sources=json.loads(subprocess.check_output(['node','-e',"const C=require('./module-src/cyklo/canopy.js');console.log(JSON.stringify({vertex:C.instanceVertex,fragment:C.instanceFragment}))"],cwd=ROOT));objects=[]
for src,typ in [(old_sources['vertex'],0x8B31),(old_sources['fragment'],0x8B30)]:
 sh=createShader(typ);txt=c.c_char_p(src.encode());source(sh,1,c.byref(txt),None);compile(sh);getiv(sh,0x8B81,c.byref(ok));log(sh,8192,None,buf);assert ok.value,buf.value;objects.append(sh)
previous=proc('glCreateProgram',U,[])();[attach(previous,s) for s in objects];proc('glLinkProgram',None,[U])(previous);proc('glGetProgramiv',None,[U,U,c.POINTER(I)])(previous,0x8B82,c.byref(ok));assert ok.value
W,H=256,512
fbo=gen('glGenFramebuffers');proc('glBindFramebuffer',None,[U,U])(0x8D40,fbo)
for attachment,fmt in [(0x8CE0,0x8058),(0x8D00,0x81A6)]:
 rb=gen('glGenRenderbuffers');proc('glBindRenderbuffer',None,[U,U])(0x8D41,rb);proc('glRenderbufferStorage',None,[U,U,I,I])(0x8D41,fmt,W,H);proc('glFramebufferRenderbuffer',None,[U,U,U,U])(0x8D40,attachment,0x8D41,rb)
assert proc('glCheckFramebufferStatus',U,[U])(0x8D40)==0x8CD5
proc('glViewport',None,[I,I,I,I])(0,0,W,H);proc('glEnable',None,[U])(0x0B71);proc('glDepthFunc',None,[U])(0x0203);proc('glDepthMask',None,[U])(1);proc('glClearColor',None,[F,F,F,F])(.18,.3,.12,1)
high_template=gen('glGenBuffers');low_template=gen('glGenBuffers');buffer_data(high_template,new['template']);buffer_data(low_template,new['low']);passes=[]
for index,program in enumerate([previous,p]):
 records=scene['scenes'][index]['records'];weights=scene['scenes'][index]['weights'];sizes=scene['scenes'][index]['pixels'];rows=[records[i*9:i*9+9]+[weights[i],sizes[i]] for i in (scene['scenes'][index].get('order') or range(len(weights)))];rows.sort(key=lambda r:r[9]>=1);high=sum(row[9]<1 for row in rows);vbo=gen('glGenBuffers');buffer_data(vbo,[v for row in rows for v in row]);passes.append((program,vbo,high,len(rows)-high))
 def uniform4(name,values):proc('glUniform4fv',None,[I,I,c.POINTER(F)])(loc(program,name.encode()),9,(F*36)(*[v for row in values for v in row]))
 proc('glUseProgram',None,[U])(program);um(loc(program,b'u_matrix'),1,0,(F*16)(*scene['camera']['matrix']));u3(loc(program,b'u_eye'),0,-800,835)
 for name,value in [('u_detail',4000),('u_limit',4000),('u_pseudo',1)]:u1(loc(program,name.encode()),value)
 for name,value in [('u_atlas',0 if not index else 2),('u_topAtlas',1 if not index else 3)]:proc('glUniform1i',None,[I,I])(loc(program,name.encode()),value)
 proc('glUniform2fv',None,[I,I,c.POINTER(F)])(loc(program,b'u_roots[0]'),9,(F*18)(*[v for row in assets['roots'] for v in row]));uniform4('u_rects[0]',assets['rects']);uniform4('u_topRects[0]',assets['topRects'])
def draw_pass(entry):
 program,vbo,high,low=entry;proc('glUseProgram',None,[U])(program);clear(0x4100)
 for start,count,geometry,template_buffer in [(0,high,36,high_template),(high,low,12,low_template)]:
  if not count:continue
  bind(0x8892,vbo)
  for index,size,offset in [(0,3,0),(2,2,12),(3,4,20),(4,1,36),(5,1,40)]:enable(index);attr(index,size,0x1406,0,44,start*44+offset);divisor(index,1)
  disable(6);proc('glVertexAttrib2f',None,[U,F,F])(6,0,0);bind(0x8892,template_buffer);enable(1);attr(1,2,0x1406,0,8,0);divisor(1,0);drawInstanced(4,0,geometry,count)
finish=proc('glFinish',None,[]);resources=[]
for index,entry in enumerate(passes):
 for _ in range(3):draw_pass(entry);finish()
 samples=[]
 for _ in range(9):
  began=time.perf_counter();draw_pass(entry);finish();samples.append((time.perf_counter()-began)*1000)
 pixels=(c.c_ubyte*(W*H*4))();read(0,0,W,H,0x1908,0x1401,pixels);data=bytes(pixels);image=Image.frombytes('RGBA',(W,H),data).transpose(Image.Transpose.FLIP_TOP_BOTTOM);image.save('/tmp/cyklo-forest-'+('before' if not index else 'after')+'.png');background=(46,76,31);painted=sum(max(abs(data[i+j]-background[j]) for j in range(3))>5 for i in range(0,len(data),4))/(W*H);resources.append({'softwarePassMedianMs':statistics.median(samples),'paintedFraction':painted})
assert resources[1]['paintedFraction']>resources[0]['paintedFraction']
assert proc('glGetError',U,[])()==0
print('Software EGL synthetic pass comparison (not mobile FPS):',json.dumps(resources))

if os.environ.get('CYKLO_GPU_METRICS'):
 Path(os.environ['CYKLO_GPU_METRICS']).write_text(json.dumps({'scope':'Synthetic Mesa llvmpipe forest pass; not Android FPS','baseline':resources[0],'optimized':resources[1]},indent=2)+'\n')
