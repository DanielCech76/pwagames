function positions(v){if(v===1)return [];let count=Math.floor(v/7)+2,step=v===32?26:Math.floor((v*4+count*2+1)/(count*2-2))*2,a=[6];for(let pos=v*4+10;a.length<count;pos-=step)a.splice(1,0,pos);return a}
function make(text,ratio,pattern,color,strength='subtle',opacity=1,contrast=.8){const q=qrcode(0,'H');q.addData(text);q.make();let n=q.getModuleCount(),offset=Math.max(4,Math.round(n*(1/ratio-1)/2)),total=n+2*offset,sub=n>65?1:3,grid=total*sub,step=900/grid;const pos=positions((n-17)/4);function fn(r,c){return (r<=8&&c<=8)||(r<=8&&c>=n-8)||(r>=n-8&&c<=8)||r===6||c===6||r===8||c===8||(n>=45&&((r<6&&c>=n-11)||(c<6&&r>=n-11)))||pos.some(y=>pos.some(x=>!((x===6&&y===6)||(x===6&&y===n-7)||(x===n-7&&y===6))&&Math.abs(r-y)<=2&&Math.abs(c-x)<=2));}
 const head='<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900"><rect width="900" height="900" fill="#fffdf5"/>';let ornament=[],code=[];
 for(let gy=0;gy<grid;gy++)for(let gx=0;gx<grid;gx++){
 const x=(gx+.5)*step,y=(gy+.5)*step,r=Math.floor(gy/sub)-offset,c=Math.floor(gx/sub)-offset,inside=r>=0&&c>=0&&r<n&&c<n,px=Math.min(899,Math.floor(x)),py=Math.min(899,Math.floor(y));
 const tone=(1-pattern[py*900+px]/255),art=Math.max(0,Math.min(1,tone*2.15*contrast)),base=.018+.452*art;
 const circle=rad=>`<circle cx="${x.toFixed(3)}" cy="${y.toFixed(3)}" r="${(rad*step).toFixed(3)}"/>`;
 ornament.push(circle(base));
 if(inside){let d=q.isDark(r,c),dx=gx%sub-Math.floor(sub/2),dy=gy%sub-Math.floor(sub/2),anchor=sub===1||strength==='strong'||(strength==='balanced'?Math.abs(dx)+Math.abs(dy)<=1:dx===0&&dy===0);if(fn(r,c))anchor=true;const rad=anchor?(d?(fn(r,c)?.68:.49):.025+.10*art):base;code.push(circle(rad));}
 else if(r>=-4&&c>=-4&&r<n+4&&c<n+4)code.push(circle(.018+.07*art));
 }
 const body=`<g fill="${color}">${ornament.join('')}</g>`,margin=(offset-4)/total*900,span=(n+8)/total*900;
 const qrLayer=opacity<=0?'':`<g opacity="${Math.min(1,Math.max(0,opacity))}"><rect x="${margin}" y="${margin}" width="${span}" height="${span}" fill="#fffdf5"/><g fill="${color}">${code.join('')}</g></g>`;
 return {svg:head+body+qrLayer+'</svg>',originalSvg:head+body+'</svg>',n,ratio:n/total};}
