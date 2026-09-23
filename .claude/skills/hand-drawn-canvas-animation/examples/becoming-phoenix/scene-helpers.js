'use strict';
// Shared drawing helpers for the opening, printed leaps and signature.
const qt=t=>Math.floor(t*12+1e-6)/12;
function egg(c,x,y,open=0,scale=1){c.save();c.translate(x,y);c.scale(scale,scale);
 const bottom=[[-106,-44],[-72,-25],[-41,-51],[-11,-23],[22,-49],[55,-24],[91,-50],[111,-20],[105,45],[78,92],[18,112],[-55,100],[-101,54],[-106,-44]];
 const whole=[[0,-206],[57,-182],[95,-108],[113,-22],[105,49],[78,92],[18,112],[-55,100],[-101,54],[-110,-18],[-86,-114],[-39,-187],[0,-206]];
 const p=curvePath(open?bottom:whole,true,open?.55:1.3);c.fillStyle=C.paper;c.fill(p);artLine(c,open?bottom:whole,{w:2.1,seed:66,rough:.9});
 for(let i=0;i<55;i++){const x=(hash(i,81)-.5)*165,y=hash(i,82)*130-25;if(!open||y>2)artLine(c,[[x,y],[x+5,y+3],[x+7,y+8]],{w:.75,al:.22,seed:i});}
 if(!open)artLine(c,[[-30,-160],[-12,-125],[-32,-104],[-9,-78],[-17,-52]],{w:1.1,al:.6,seed:4});c.restore();}
function nest(c,x,y,s=1){c.save();c.translate(x,y);c.scale(s,s);for(let i=0;i<46;i++){const y=hash(i,4)*57,r=145+hash(i,3)*60;artLine(c,[[-r,y-16],[-r*.5,y+33],[0,y+48],[r*.6,y+26],[r,y-25]],{w:.9+hash(i,5)*.9,al:.25+hash(i,6)*.4,seed:i+20});}c.restore();}
function awakening(c,t){stock(c,'#f4f2eb');moveCamera(c,960,610,1+sm(0,6,t)*.055);
 twig(c,950,854,1390,{seed:52});grass(c,352,863,270,0,81);nest(c,950,811,1.15);
 if(t>1.55){const u=sm(1.55,3.2,qt(t));c.save();c.beginPath();c.rect(480,0,930,836);c.clip();bird(c,{x:950,y:lerp(1040,772,u),scale:2.1,age:0,a:u<.5?'crouch':'rest',b:'listen',u:sm(3.2,4.3,qt(t)),blink:t>4.25&&t<4.42});c.restore();}
 egg(c,950+(t<1.7?Math.sin(qt(t)*24)*sm(.4,1.3,t)*2:0),773,t>1.55?1:0,1.08);
 if(t>1.55){const k=sm(1.55,2.35,qt(t)),xx=1040+180*k,yy=601-105*Math.sin(k*Math.PI)+230*k;c.save();c.translate(xx,yy);c.rotate(k*1.2);const top=[[-60,19],[-35,-65],[1,-102],[42,-62],[65,16],[40,-3],[10,19],[-20,-4],[-60,19]];c.fillStyle=C.paper;c.fill(curvePath(top,true,.7));artLine(c,top,{w:1.6,seed:19});c.restore();}
 if(t<.9)veil(c,'#f4f2eb',1-sm(0,.9,t));
}
function hopState(t,start,dur,from,to,height){const pre=sm(start-.32,start,t);if(t<start)return{x:from[0],ground:from[1],a:'rest',b:'crouch',u:pre};
 const f=clamp((t-start)/dur,0,1),x=lerp(from[0],to[0],f),ground=lerp(from[1],to[1],f)-4*height*f*(1-f);
 if(f<1)return{x,ground,a:f<.45?'push':'air',b:f<.45?'air':'reach',u:f<.45?f/.45:(f-.45)/.55};
 return{x:to[0],ground:to[1],a:'land',b:'rest',u:sm(start+dur,start+dur+.38,t)};
}
function bloom(c,x,y,scale,colour,seed){c.save();c.translate(x,y);c.scale(scale,scale);artLine(c,[[0,0],[-6,-44],[0,-97]],{col:C.teal,w:2,al:.7,seed});for(let i=0;i<6;i++){const a=i*TAU/6,pts=blob(Math.cos(a)*17,-103+Math.sin(a)*14,13,20,seed+i,{rot:a,amp:.09});c.fillStyle=alpha(colour,.7);c.fill(curvePath(pts));artLine(c,pts,{col:mix(colour,C.navy,.4),w:1,al:.7,seed:i,close:true});}c.fillStyle=C.gold;c.beginPath();c.arc(0,-103,8,0,TAU);c.fill();c.restore();}
const XLOGO=new Path2D('M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6944H306.615L611.412 515.685L658.88 583.579L1055.08 1150.3H892.476L569.165 687.854V687.828Z');
function signature(c,t){stock(c);const a=sm(.3,1.0,t);c.save();c.globalAlpha=a;c.translate(899,372);c.scale(.102,.102);c.fillStyle='#272624';c.fill(XLOGO);c.restore();
 c.save();c.globalAlpha=sm(.65,1.45,t);c.textAlign='center';c.textBaseline='middle';c.fillStyle='#272624';c.font='500 65px "Avenir Next", Avenir, Arial, sans-serif';c.fillText('@superalesha',960,570);c.restore();
 const z=sm(.05,1.8,qt(t));c.save();c.translate(lerp(1410,1258,z),lerp(305,689,z));c.rotate(lerp(.7,1.04,z));c.scale(.75,.75);feather(c,[0,95],[34,-102],15,C.gold,713,{opacity:sm(.05,.6,t)});c.restore();
 artLine(c,[[720,657],[899,665],[1052,658],[1190,652]],{w:1.3,col:C.orange,al:sm(1.3,2.0,t)*.58,seed:88});
}
