'use strict';
const C={paper:'#f5f1e7',ink:'#38332f',gold:'#edb832',orange:'#e87532',coral:'#d94967',pink:'#e96094',teal:'#32a7a4',blue:'#3a6fb0',violet:'#7554a4',navy:'#202c46'};
const finiteCache=new Map();
function remember(id,build,max=44){if(finiteCache.has(id))return finiteCache.get(id);const value=build();finiteCache.set(id,value);if(finiteCache.size>max)finiteCache.delete(finiteCache.keys().next().value);return value;}
function artLine(c,pts,{w=2,col=C.ink,al=1,seed=1,rough=.45,close=false}={}){
 c.save();c.strokeStyle=col;c.lineWidth=w;c.globalAlpha*=al;wob(c,pts,rough,seed,close,{pressure:.55,corner:1.3});c.restore();
}
function stock(c,base=C.paper){paper(c,base,null,92);}
function veil(c,colour,opacity){c.save();resetT(c);c.globalAlpha=opacity;c.fillStyle=colour;c.fillRect(0,0,W,H);c.restore();}
function moveCamera(c,x=CX,y=CY,z=1){c.translate(CX,CY);c.scale(z,z);c.translate(-x,-y);}
function blendPose(a,b,u){const A=K[a],B=K[b],o={};for(const k of Object.keys(A))o[k]=morphPoints(A[k],B[k],u);return o;}
function growingPoint(p,age){const young=1-age,head=clamp((-p[1]-75)/95,0,1);return [p[0]*(.80+.20*age)+(p[0]-25)*.20*head*young,p[1]*(.65+.35*age)-head*8*young];}
function poseShape(a,b,u,age){const q=blendPose(a,b,u);for(const k of Object.keys(q))q[k]=q[k].map(p=>growingPoint(p,age));
 const young=1-age;q.tail=q.tail.map(([x,y])=>[-80*(.8+.2*age)+(x+80*(.8+.2*age))*(1-young*.65),y]);
 if(age<.7){const e=q.eye,ex=e.reduce((s,p)=>s+p[0],0)/e.length,ey=e.reduce((s,p)=>s+p[1],0)/e.length;q.eye=e.map(([x,y])=>[ex+(x-ex)*(1+young*.55),ey+(y-ey)*(1+young*.55)]);}
 return q;
}
function bodyPath(p){return curvePath([...p.crown,...p.beak.slice(1),...p.breast.slice(1),...p.back.slice().reverse()],true,1.6);}
function birdCel({a='rest',b=a,u=0,age=.0,colour=0,look='pencil',blink=false}={}){
 u=Math.round(u*12)/12;age=Math.round(age*16)/16;colour=Math.round(colour*16)/16;
 const id=['bird',a,b,u,age,colour,look,blink,S].join('/');
 return remember(id,()=>{
  const p=poseShape(a,b,u,age),d=raw(p);
  if(blink){d.strokes=d.strokes.filter(s=>!s.id.startsWith('pupil/')&&s.id!=='eye');const e=p.eye;d.strokes.push({id:'closed-eye',points:[e[0],[e[1][0],e[1][1]+6],e[2]],width:1.8,pressure});}
  if(age<.8){const cap=motionPath(p.crown);for(let i=0;i<6;i++){const [x,yy]=cap.at(.17+i*.09).p;d.strokes.push({id:'fluff/'+i,points:[[x-2,yy+2],[x-4,yy-7],[x+2,yy-2]],width:.85,opacity:.48});}}
  const cv=document.createElement('canvas'),dpi=Math.max(.5,2.45*S);cv.width=Math.ceil(550*dpi);cv.height=Math.ceil(450*dpi);const g=cv.getContext('2d',{willReadFrequently:true});g.scale(dpi,dpi);g.translate(265,290);
  const body=bodyPath(p),wing=curvePath(p.wing,true,1.2),tail=curvePath(p.tail,true,.7);
  g.fillStyle=C.paper;g.fill(body);g.fill(tail);
  if(colour>0){
   const warm=mix('#eee4c9',C.orange,colour*.7);g.fillStyle=alpha(warm,.20+colour*.5);g.fill(body);
   pigmentWash(g,body,[-140,-240,270,280],{color:C.gold,seed:81,opacity:colour*.26,granulation:.17,edge:.08});
   g.fillStyle=alpha(mix(C.gold,C.coral,colour*.8),.24+colour*.5);g.fill(wing);
   g.fillStyle=alpha(C.orange,colour*.75);g.fill(tail);
   if(look==='riso')dotScreen(g,wing,[-170,-230,230,280],{cell:4.6,color:C.violet,density:.21,angle:.44,seed:43,alpha:colour*.35});
   for(const s of d.strokes){if(s.id.startsWith('feather/'))s.color=mix(C.ink,C.coral,colour*.55);if(s.id.startsWith('belly')||s.id.startsWith('breast/down'))s.color=mix(C.ink,C.orange,colour*.8);}
  }
  drawCel(g,compileCel(d,{id:a+'/'+b+'/'+u+'/'+age}),{material:look==='ink'?'ink':'pencil',color:colour>.5?'#54403e':C.ink});
  return {canvas:cv,dpi,origin:[265,290],pose:p};
 });
}
function bird(c,{x,y,scale=1,rot=0,flip=1,...opts}){const s=birdCel(opts);c.save();c.translate(x,y);c.rotate(rot);c.scale(scale*flip,scale);c.drawImage(s.canvas,-s.origin[0],-s.origin[1],s.canvas.width/s.dpi,s.canvas.height/s.dpi);c.restore();}
function grounded(c,x,ground,scale,opts={}){const age=opts.age??0;bird(c,{x,y:ground-75*(.65+.35*age)*scale,scale,...opts});}
function twig(c,x,y,length=1000,{colour=C.ink,seed=44,leaves=0}={}){
 c.save();c.translate(x,y);const line=[[-length*.5,5],[-length*.22,0],[0,-3],[length*.23,-10],[length*.5,-35]];
 artLine(c,line,{w:2.3,col:colour,seed});artLine(c,line.map(([x,y])=>[x,y+12]),{w:1.2,col:colour,al:.6,seed:seed+1});
 for(let i=0;i<45;i++){const xx=-length*.47+i*length*.021;artLine(c,[[xx,4-xx*.035],[xx+17,4-xx*.035],[xx+27,1-xx*.035]],{w:.6,col:colour,al:.4,seed:i+seed});}
 for(const side of [-1,1]){artLine(c,[[side*length*.26,-7],[side*length*.36,-60],[side*length*.39,-117]],{w:1.5,col:colour,al:.7,seed:seed+side+8});if(leaves>0)leaf(c,side*length*.39,-106,-side*.5,55,leaves,seed+side);}
 c.restore();
}
function leaf(c,x,y,rot,length=70,colour=1,seed=2){c.save();c.translate(x,y);c.rotate(rot);const pts=[[0,0],[-18,-length*.35],[-11,-length*.76],[6,-length],[20,-length*.53],[12,-length*.16],[0,0]],p=curvePath(pts);c.fillStyle=alpha(C.teal,colour*.35);c.fill(p);artLine(c,pts,{w:1.4,col:mix(C.ink,C.teal,colour),seed});artLine(c,[[0,0],[4,-length*.45],[6,-length]],{w:.8,col:C.ink,al:.5,seed});c.restore();}
function grass(c,x,y,w=400,colour=0,seed=1){for(let i=0;i<30;i++){const a=x+(hash(i,seed)-.5)*w,h=14+hash(i,seed+1)*48;artLine(c,[[a,y],[a-5,y-h*.5],[a-15+hash(i,seed+2)*25,y-h]],{w:.8+hash(i,seed+3),col:mix(C.ink,C.teal,colour),al:.25+hash(i,seed+4)*.30,seed:i+seed});}}
function rock(c,x,y,w=500,h=170,colour=0,seed=1){const pts=[[x-w/2,y],[x-w*.40,y-h*.58],[x-w*.15,y-h],[x+w*.25,y-h*.87],[x+w/2,y-h*.3],[x+w*.55,y+80],[x-w*.55,y+80]],p=curvePath(pts,true,.7);c.fillStyle=mix(C.paper,'#b9c7c3',colour*.6);c.fill(p);artLine(c,pts.slice(0,5),{w:2,col:mix(C.ink,C.navy,colour),seed});
 for(let i=0;i<26;i++){const xx=x-w*.39+i*w*.03,yy=y-h*.55+noise1(i*.3,seed)*h*.22;artLine(c,[[xx,yy],[xx+19,yy+30],[xx+31,yy+70]],{w:.7,col:mix(C.ink,C.blue,colour),al:.20,seed:seed+i});}}
function horizon(c,{t=0,colour=0,storm=0,depth=1}={}){
 const base=storm?mix(C.paper,'#c5c5c3',storm*.42):C.paper;stock(c,base);
 for(let layer=0;layer<3;layer++){const pts=[];for(let i=-1;i<=25;i++){const x=i*90,y=630+layer*110+noise1(i*.31,4+layer)*150-depth*40;pts.push([x,y]);}const p=curvePath([...pts,[W+100,H+50],[-100,H+50]],true,.7);
 c.fillStyle=mix(base,[C.blue,C.teal,C.violet][layer],colour*(.09+layer*.035));c.fill(p);artLine(c,pts,{w:1.2,col:mix('#9a9892',C.blue,colour),al:.4,seed:44+layer});}
}
function paintedSun(c,x,y,r,colour,opacity=.4){c.save();c.globalAlpha=opacity;c.fillStyle=colour;const pts=blob(x,y,r,r,116,{amp:.018,n:90});c.fill(curvePath(pts));c.strokeStyle=colour;c.lineWidth=1.5;wob(c,ellPts(x,y,r+9,r+9),1,23,true);c.restore();}
function rain(c,t,strength=1){c.save();c.strokeStyle='#696b73';c.lineWidth=1.1;c.globalAlpha=.24*strength;const time=Math.floor(t*24)/24;for(let i=0;i<150*strength;i++){const x=(hash(i,23)*2400-time*340+4800)%2400-240,y=(hash(i,26)*1300+time*540)%1300-120;c.beginPath();c.moveTo(x,y);c.lineTo(x-24,y+47);c.stroke();}c.restore();}
function wind(c,t,strength=1,colour='#8c8985'){for(let i=0;i<11;i++){const x=((hash(i,12)*2300-t*480)%2300+2300)%2300-200,y=180+hash(i,14)*620;artLine(c,[[x,y],[x+100,y-8],[x+230,y+10],[x+330,y-4]],{w:.8,col:colour,al:.18*strength,seed:i+52});}}
function motes(c,t,{n=70,colour=C.gold,power=1,origin=[CX,CY],spread=800}={}){c.save();for(let i=0;i<n;i++){const life=(t*.17+hash(i,11))%1,a=hash(i,12)*TAU,x=origin[0]+Math.cos(a)*life*spread,y=origin[1]+Math.sin(a)*life*spread*.65-life*80,r=1+hash(i,14)*3;c.globalAlpha=(1-life)*power*.65;c.strokeStyle=[colour,C.orange,C.coral][i%3];c.lineWidth=1.4;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*r*3,y+Math.sin(a)*r*3);c.stroke();}c.restore();}
function feather(c,root,tip,width,col,seed=1,{opacity=1,print=false}={}){
 const dx=tip[0]-root[0],dy=tip[1]-root[1],len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len,bend=(hash(seed,52)-.5)*len*.15;
 const at=u=>[lerp(root[0],tip[0],u)+nx*Math.sin(u*Math.PI)*bend,lerp(root[1],tip[1],u)+ny*Math.sin(u*Math.PI)*bend];
 const pts=[];for(let i=0;i<=10;i++){const u=i/10,p=at(u),w=Math.sin(Math.PI*u)**.75*width;pts.push([p[0]+nx*w,p[1]+ny*w]);}for(let i=10;i>=0;i--){const u=i/10,p=at(u),w=Math.sin(Math.PI*u)**.85*width*.68;pts.push([p[0]-nx*w,p[1]-ny*w]);}
 const path=curvePath(pts,true,1.3);c.save();c.globalAlpha*=opacity;c.fillStyle=col;c.fill(path);c.save();c.clip(path);c.fillStyle=alpha('#fff5c8',.17);c.fill(curvePath(pts.slice(0,11).concat([root]),true));
 if(print)dotScreen(c,path,[Math.min(root[0],tip[0])-width,Math.min(root[1],tip[1])-width,Math.abs(dx)+2*width,Math.abs(dy)+2*width],{cell:8,color:C.navy,density:.15,seed,angle:.5,alpha:.16});c.restore();
 artLine(c,pts,{w:1.4,col:mix(col,C.navy,.42),al:.72,seed,rough:.6,close:true});const mid=[];for(let i=0;i<=9;i++)mid.push(at(i/9));artLine(c,mid,{w:1.25,col:'#fff1bb',al:.78,seed:seed+1,rough:.35});
 for(let i=1;i<13;i++){const u=i/14,p=at(u),w=Math.sin(Math.PI*u)**.8*width*.84,down=at(Math.min(1,u+.055));artLine(c,[[p[0]+nx*w,p[1]+ny*w],down,[p[0]-nx*w*.6,p[1]-ny*w*.6]],{w:.65,col:mix(col,C.navy,.4),al:.42,seed:seed+i,rough:.15});}c.restore();
}
// Four authored wing silhouettes. Intermediates change whole feather drawings.
const WINGS={
 folded:{lead:[[35,-58],[115,-150],[164,-110],[157,26]],tips:[[175,-105],[190,-45],[170,40],[99,141]]},
 high:{lead:[[35,-58],[180,-230],[290,-347],[360,-370]],tips:[[431,-386],[475,-317],[438,-196],[238,-16]]},
 spread:{lead:[[35,-58],[210,-160],[398,-195],[521,-154]],tips:[[621,-138],[579,-43],[452,50],[233,104]]},
 down:{lead:[[35,-58],[160,17],[260,167],[304,251]],tips:[[372,322],[302,339],[193,277],[105,121]]}
};
function wingShape(a,b,u){return {lead:morphPoints(WINGS[a].lead,WINGS[b].lead,u),tips:morphPoints(WINGS[a].tips,WINGS[b].tips,u)};}
function phoenix(c,{x=CX,y=490,scale=1,a='spread',b=a,u=0,reveal=1,phase=0,colour=1}={}){
 // Pose time is quantized by the caller; no continuous movement beneath a held cel.
 c.save();c.translate(x,y);c.scale(scale,scale);const w=wingShape(a,b,u),palette=[C.gold,C.orange,C.coral,C.pink,C.violet,C.blue,C.teal];
 const ink=mix('#726b66',C.navy,colour);
 // Long separate tail plumes, curved through authored sampled centre-lines.
 for(let i=0;i<9;i++){
  const side=(i-4)/4,root=[side*17,68],tip=[side*(126+Math.abs(side)*90)+Math.sin(phase*.7+i*.58)*25,390-Math.abs(side)*94];
  feather(c,root,tip,16+(1-Math.abs(side))*13,mix('#b1aaa1',palette[(i+2)%7],colour),300+i,{opacity:reveal,print:i%3===0});
 }
 for(const side of [-1,1]){c.save();c.scale(side,1);const roots=motionPath(w.lead,{smooth:true}),tips=motionPath(w.tips,{smooth:true});
  const membrane=curvePath([...w.lead,...w.tips,...[w.lead[0]]],true,1.2);c.fillStyle=alpha(mix('#ccc0b2',C.orange,colour),.45*reveal);c.fill(membrane);
  for(let i=15;i>=0;i--){const t=i/15,root=roots.at(.10+t*.73).p,tip=tips.at(1-t).p,col=palette[Math.min(6,Math.floor((1-t)*6.9))];feather(c,root,tip,20+Math.sin(t*Math.PI)*11,mix('#b7b0a4',col,colour),i+23,{opacity:reveal,print:i%4===0});}
  for(let row=1;row>=0;row--)for(let i=11;i>=0;i--){const t=i/12,front=roots.at(.08+t*.76).p,end=tips.at(1-t).p,root=[lerp(34,front[0],.60+row*.25),lerp(-58,front[1],.60+row*.25)],point=[lerp(front[0],end[0],.14+row*.21),lerp(front[1],end[1],.14+row*.21)];feather(c,root,point,12+row*4,mix('#c3b6a4',[C.gold,C.orange,C.coral][(i+row)%3],colour),i+84+row*13,{opacity:reveal});}
  artLine(c,w.lead,{w:2,col:ink,al:.7*reveal,seed:83});c.restore();}
 // Body and head are one authored contour, with a separate beak and crest.
 const body=[[-39,67],[-55,4],[-43,-63],[-29,-113],[-28,-157],[-10,-185],[19,-188],[38,-168],[38,-140],[29,-110],[49,-59],[44,13],[28,76],[0,104],[-39,67]],path=curvePath(body,true,1.25);
 c.fillStyle=mix('#e6ddcc',C.orange,colour);c.fill(path);pigmentWash(c,path,[-60,-195,125,300],{color:C.gold,seed:51,opacity:.55,granulation:.13,edge:.1,blend:'source-over'});
 artLine(c,body,{w:2.1,col:ink,seed:92});
 formHatch(c,path,[-62,-197,128,308],{color:mix(C.ink,C.coral,colour),spacing:5,length:17,width:.7,opacity:.24,tone:(x,y)=>clamp(.25+x/170+y/530,0,.8),direction:(x,y)=>1.05+x/170,seed:64});
 for(let i=0;i<42;i++){const xx=(hash(i,18)-.5)*61,yy=-86+hash(i,19)*164;artLine(c,[[xx-5,yy-5],[xx,yy+5],[xx+4,yy]],{w:1,col:mix(C.ink,C.coral,colour),al:.55,seed:i+7});}
 for(let i=0;i<5;i++)feather(c,[-10+i*6,-171],[-33+i*16,-234-Math.sin(i/4*Math.PI)*30],7,[C.orange,C.gold,C.coral,C.gold,C.orange][i],611+i,{opacity:reveal});
 const beak=[[32,-165],[62,-155],[68,-140],[56,-145],[36,-142]];c.fillStyle=C.gold;c.fill(polyPath(beak));artLine(c,beak,{w:2,col:ink,seed:12});
 artLine(c,[[4,-164],[16,-167],[26,-161]],{w:1.8,col:ink,seed:77});
 c.fillStyle=ink;c.beginPath();c.ellipse(16,-158,4.2,5.2,-.15,0,TAU);c.fill();c.fillStyle='#fff5d5';c.beginPath();c.arc(17,-160,1.3,0,TAU);c.fill();
 artLine(c,[[-29,-120],[-9,-103],[24,-117]],{w:1.3,col:C.gold,seed:66});
 c.restore();
}
