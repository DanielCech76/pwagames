(function(root){
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class PinballEngine{
 constructor(table,onEvent=()=>{}){this.table=table;this.emit=onEvent;this.reset()}
 reset(){this.score=0;this.number=1;this.multiplier=1;this.targets=this.table.targets.map(()=>false);this.cooldowns=new Map();this.time=0;this.over=false;this.flippers=this.table.flippers.map(f=>({...f,angle:f.rest,omega:0}));this.newBall()}
 newBall(){const p=this.table.launch;this.ball={x:p.x,y:p.y,vx:0,vy:0,r:10};this.ready=true;this.trail=[];this.emit('ready')}
 launch(power=1){if(!this.ready||this.over)return;this.ready=false;this.ball.vx=0;this.ball.vy=-(1190+clamp(power,0,1)*180);this.emit('launch')}
 add(points,type){this.score+=points*this.multiplier;this.emit(type)}
 hitOnce(id,delay){if((this.cooldowns.get(id)||0)>this.time)return false;this.cooldowns.set(id,this.time+delay);return true}
 segment(a,b,restitution=.8,omega=0,pivot=null){const ball=this.ball,dx=b.x-a.x,dy=b.y-a.y,t=clamp(((ball.x-a.x)*dx+(ball.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1),qx=a.x+t*dx,qy=a.y+t*dy;let nx=ball.x-qx,ny=ball.y-qy,d=Math.hypot(nx,ny),radius=ball.r+(pivot?9:4);if(d>=radius)return; if(d<.0001){nx=-dy;ny=dx;d=Math.hypot(nx,ny)||1}else{nx/=d;ny/=d;d=1}const norm=Math.hypot(nx,ny)||1;nx/=norm;ny/=norm;const overlap=radius-Math.hypot(ball.x-qx,ball.y-qy);ball.x+=nx*overlap;ball.y+=ny*overlap;const svx=pivot?-omega*(qy-pivot.y):0,svy=pivot?omega*(qx-pivot.x):0,vn=(ball.vx-svx)*nx+(ball.vy-svy)*ny;if(vn<0){ball.vx-=(1+restitution)*vn*nx;ball.vy-=(1+restitution)*vn*ny}}
 circle(c,power,id,points,type){const b=this.ball,dx=b.x-c.x,dy=b.y-c.y,d=Math.hypot(dx,dy),r=b.r+c.r;if(d>=r)return;const nx=d?dx/d:0,ny=d?dy/d:1;b.x=c.x+nx*(r+.2);b.y=c.y+ny*(r+.2);const dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx-=1.8*dot*nx;b.vy-=1.8*dot*ny}if(this.hitOnce(id,.13)){b.vx+=nx*power;b.vy+=ny*power;if(points)this.add(points,type)}}
 step(dt,input=[false,false]){if(this.over)return;this.time+=dt;for(let i=0;i<2;i++){const f=this.flippers[i],target=input[i]?f.active:f.rest,old=f.angle;f.angle+=clamp(target-f.angle,-13*dt,13*dt);f.omega=(f.angle-old)/dt}if(this.ready)return;const b=this.ball;b.vy+=this.table.gravity*dt;b.vx*=1-.06*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
 for(const [a,c] of this.table.walls)this.segment({x:a[0],y:a[1]},{x:c[0],y:c[1]});
 this.table.bumpers.forEach((c,i)=>this.circle(c,210,'b'+i,this.table.points.bumper,'bumper'));
 this.table.slings.forEach((c,i)=>this.circle(c,240,'s'+i,this.table.points.sling,'sling'));
 this.table.targets.forEach((c,i)=>{const before=this.cooldowns.get('t'+i);this.circle(c,80,'t'+i,0,'target');if(before!==this.cooldowns.get('t'+i)&&!this.targets[i]){this.targets[i]=true;this.add(this.table.points.target,'target');if(this.targets.every(Boolean)){this.score+=this.table.points.complete*this.multiplier;this.multiplier=Math.min(5,this.multiplier+1);this.targets.fill(false);this.emit('bonus')}}});
 for(const f of this.flippers)this.segment(f,{x:f.x+Math.cos(f.angle)*f.length,y:f.y+Math.sin(f.angle)*f.length},.83,f.omega,f);
 const speed=Math.hypot(b.vx,b.vy);if(speed>1800){b.vx*=1800/speed;b.vy*=1800/speed}if(b.y>this.table.height+40){if(this.number>=this.table.balls){this.over=true;this.emit('over')}else{this.number++;this.newBall();this.emit('lost')}}
 }
}
root.PinballEngine=PinballEngine;if(typeof module!=='undefined')module.exports=PinballEngine;
})(typeof window!=='undefined'?window:globalThis);
