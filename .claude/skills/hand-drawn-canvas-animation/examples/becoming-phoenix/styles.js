'use strict';
// Different drawing constructions, not a palette switch over the pencil render.
function mediumBird(c,{x=0,y=0,scale=1,age=.2,a='rest',b=a,u=0,medium='ink',warm=0,blink=false}={}){
 const p=poseShape(a,b,Math.round(u*12)/12,Math.round(age*12)/12),body=bodyPath(p),wing=curvePath(p.wing,true,.9),tail=curvePath(p.tail,true,.7);
 c.save();c.translate(x,y);c.scale(scale,scale);
 c.fillStyle=medium==='ink'?'#faf8ed':'#fffdf3';c.fill(tail);c.fill(body);
 if(medium==='ink'){
  c.fillStyle='#171a1a';c.fill(wing);const cap=curvePath([...p.crown.slice(1,5),...p.cheek.slice(0,3).reverse()],true,1.1);c.fill(cap);
  artLine(c,p.back,{w:5.2,col:'#111717',seed:71});artLine(c,p.breast,{w:3.8,col:'#111717',seed:79});artLine(c,p.tail,{w:3.4,col:'#111717',seed:52});
 }else{
  pigmentWash(c,wing,[-180,-245,250,300],{color:'#efa524',opacity:.28+.35*warm,seed:55,edge:.25});
  pigmentWash(c,body,[-140,-240,290,300],{color:'#e87b40',opacity:warm*.22,seed:61});
 }
 const d=raw(p);d.strokes=d.strokes.filter(s=>!s.id.includes('/down/')&&!s.id.startsWith('cap/')&&!s.id.includes('/barb/')&&!s.id.endsWith('/search'));
 for(const s of d.strokes){s.width*=medium==='ink'?1.8:2.0;s.opacity=1;if(medium==='ink'&&(s.id.startsWith('feather/')||s.id.startsWith('wing/')))s.color='#f9f4e4';else s.color='#1c2628';}
 if(blink){d.strokes=d.strokes.filter(s=>s.id!=='eye'&&!s.id.startsWith('pupil/'));d.strokes.push({id:'blink',points:[p.eye[0],[p.eye[1][0],p.eye[1][1]+5],p.eye[2]],width:2.7});}
 drawCel(c,compileCel(d,{id:'brush/'+a+'/'+b+'/'+Math.round(u*12)}),{material:'ink'});
 if(medium==='doodle'){
  artLine(c,[[p.cheek[2][0]+5,p.cheek[2][1]+12],[p.cheek[3][0]+7,p.cheek[3][1]+10]],{w:7,col:'#e6a071',al:.65*warm,seed:21});
 }
 c.restore();
}
function mediumGround(c,x,ground,scale,opts){mediumBird(c,{x,y:ground-75*(.65+.35*(opts.age??.2))*scale,scale,...opts});}
function inkBird(c,opts){mediumBird(c,{medium:'ink',...opts});}
function makePlate(){const cv=document.createElement('canvas');cv.width=OUT_W;cv.height=OUT_H;const g=cv.getContext('2d',{willReadFrequently:true});g.setTransform(S,0,0,S,0,0);g.fillStyle='#fff';g.fillRect(0,0,W,H);return{cv,g};}
function risoBirdPlate(c,{x,y,scale=1,a='rest',b=a,u=0,age=1,channel=0}={}){
 const p=poseShape(a,b,u,age);c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#000';c.strokeStyle='#000';c.lineWidth=2.5;
 if(channel===0){c.fill(bodyPath(p));c.fill(curvePath(p.tail,true,.7));}
 if(channel===1){c.fill(curvePath(p.wing,true,.9));c.fill(curvePath(p.tail,true,.7));const bib=curvePath([...p.cheek,p.breast[1]],true,1.3);c.fill(bib);}
 if(channel===2){const head=curvePath([...p.crown.slice(1),...p.cheek.slice(0,4).reverse()],true);c.fillStyle='#888';c.fill(head);c.fillStyle='#000';c.fill(polyPath(p.beak));c.stroke(curvePath(p.footA,false,.8));c.stroke(curvePath(p.footB,false,.8));c.stroke(curvePath(p.legA,false,.8));c.stroke(curvePath(p.legB,false,.8));}
 c.fillStyle='#fff';c.beginPath();const eye=p.eye[1];c.arc(eye[0],eye[1]+4,8,0,TAU);c.fill();
 if(channel===2){c.fillStyle='#000';c.beginPath();c.arc(eye[0]+1,eye[1]+4,3.5,0,TAU);c.fill();}
 if(channel===1){c.strokeStyle='#fff';c.lineWidth=3;for(let i=0;i<8;i++){const u=i/8,aa=p.wing[1],bb=p.wing[6],tip=motionPath(p.wing.slice(2,6)).at(u).p;c.stroke(curvePath([[lerp(aa[0],bb[0],u),lerp(aa[1],bb[1],u)],tip],false));}}
 c.restore();
}
const PRINTCOLORS={cyan:'#00a4b5',pink:'#ed3c87',yellow:'#f6c926',navy:'#122d49',coral:'#f65b3a',cream:'#fff0c2'};
// Same curved plume geometry, with visibly different mark systems per material.
function materialFeather(c,root,tip,width,{medium='screen',color='#f8c33b',seed=1}={}){
 const dx=tip[0]-root[0],dy=tip[1]-root[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L,curve=(hash(seed,14)-.5)*L*.14;
 const at=t=>[lerp(root[0],tip[0],t)+nx*Math.sin(Math.PI*t)*curve,lerp(root[1],tip[1],t)+ny*Math.sin(Math.PI*t)*curve],P=[];
 for(let i=0;i<=10;i++){const u=i/10,p=at(u),r=width*Math.sin(Math.PI*u)**.72;P.push([p[0]+nx*r,p[1]+ny*r]);}
 for(let i=10;i>=0;i--){const u=i/10,p=at(u),r=width*.72*Math.sin(Math.PI*u)**.83;P.push([p[0]-nx*r,p[1]-ny*r]);}
 const shape=curvePath(P,true,1.2),box=[Math.min(root[0],tip[0])-width,Math.min(root[1],tip[1])-width,Math.abs(dx)+width*2,Math.abs(dy)+width*2];
 c.save();
 if(medium==='pencil'){
  c.fillStyle='#f7efda';c.fill(shape);artLine(c,P,{col:'#514a50',w:1.6,seed,rough:1.1,close:true});
  for(let j=1;j<20;j++){const u=j/21,p=at(u),r=width*Math.sin(Math.PI*u);artLine(c,[[p[0]+nx*r,p[1]+ny*r],at(Math.min(1,u+.09)),[p[0]-nx*r*.7,p[1]-ny*r*.7]],{col:'#746877',w:.85,al:.66,seed:seed+j});}
 }else if(medium==='riso'){
  c.fillStyle='#f5e4c1';c.fill(shape);dotScreen(c,shape,box,{color:color,cell:5.7,density:.7,seed,angle:.4,alpha:.95});c.save();c.translate(3,-2);dotScreen(c,shape,box,{color:seed%2?PRINTCOLORS.cyan:PRINTCOLORS.pink,cell:5.7,density:.3,seed:seed+2,angle:1.1,alpha:.6});c.restore();
 }else if(medium==='paper'){
  c.shadowColor='rgba(17,23,40,.25)';c.shadowBlur=3;c.shadowOffsetY=3;c.fillStyle=color;c.fill(shape);c.shadowColor='transparent';c.strokeStyle='#fff9e8';c.lineWidth=2.8;c.stroke(shape);
  c.save();c.clip(shape);c.fillStyle='rgba(255,255,240,.17)';c.fill(polyPath([...P.slice(0,11),root]));c.restore();
 }else{
  screenFill(c,shape,box,{color,paper:PRINTCOLORS.cream,seed,wear:.035});
  artLine(c,P,{col:color,w:1.3,seed,rough:1.0,close:true});
 }
 const shaft=[];for(let j=0;j<=10;j++)shaft.push(at(j/10));
 artLine(c,shaft,{col:medium==='pencil'?'#7e6a60':PRINTCOLORS.cream,w:medium==='screen'?2.7:1.2,al:.8,seed});
 if(medium==='screen'){for(let i=1;i<8;i++){const u=i/9,p=at(u),r=width*.72*Math.sin(Math.PI*u);artLine(c,[[p[0]+nx*r,p[1]+ny*r],at(Math.min(1,u+.065))],{col:PRINTCOLORS.cream,w:1.35,al:.63,seed:seed+i});}}
 c.restore();
}
function mediaPhoenix(c,{x=960,y=490,scale=1,a='spread',b=a,u=0,style='screen',phase=0,foldLeft=1,foldRight=1,tailOpen=1}={}){
 const w=wingShape(a,b,u);c.save();c.translate(x,y);c.scale(scale,scale);
 const colors=style==='screen'?['#fff0c2','#f2bf35','#f36b38','#e64539']:['#ffc548','#eb596e','#ae539f','#4562a8','#26b8b0'];
 for(let i=0;i<9;i++){const k=(i-4)/4;materialFeather(c,[k*15,57],[(k*203+Math.sin(phase+i*.5)*22)*lerp(.12,1,tailOpen),lerp(110,380-Math.abs(k)*54,tailOpen)],22,{medium:style==='mixed'?['paper','riso','screen'][i%3]:style,color:colors[i%colors.length],seed:200+i});}
 for(const side of [-1,1]){c.save();c.scale(side,1);const opening=side<0?foldLeft:foldRight,angle=(1-opening)*1.49;
  if(opening<1){c.translate(35,-58);c.transform(Math.cos(angle),Math.sin(angle)*.48,0,1,0,0);c.translate(-35,58);}
  const lead=motionPath(w.lead),tips=motionPath(w.tips);
  for(let i=15;i>=0;i--){const t=i/15,root=lead.at(.1+t*.73).p,tip=tips.at(1-t).p,medium=style==='mixed'?(side<0?(i<5?'pencil':'riso'):(i<5?'screen':'paper')):style;
   materialFeather(c,root,tip,22+Math.sin(t*Math.PI)*10,{medium,color:style==='mixed'?(side<0?(i%3?PRINTCOLORS.pink:PRINTCOLORS.cyan):colors[i%5]):colors[Math.floor((1-t)*3.9)],seed:i+40+(side<0?2000:0)});
  }
  for(let row=1;row>=0;row--)for(let i=10;i>=0;i--){const t=i/11,fr=lead.at(.08+t*.76).p,tip=tips.at(1-t).p,root=[lerp(34,fr[0],.60+row*.25),lerp(-58,fr[1],.6+row*.25)],end=[lerp(fr[0],tip[0],.14+row*.21),lerp(fr[1],tip[1],.14+row*.21)];materialFeather(c,root,end,12+row*4,{medium:style==='mixed'?(side<0?'riso':'paper'):style,color:colors[(i+row)%colors.length],seed:i+90+row*13});}
  c.restore();
 }
 const body=[[-39,67],[-55,4],[-43,-63],[-29,-113],[-28,-157],[-10,-185],[19,-188],[38,-168],[38,-140],[29,-110],[49,-59],[44,13],[28,76],[0,104],[-39,67]],p=curvePath(body,true,1.3);
 screenFill(c,p,[-60,-195,130,305],{color:style==='paper'?'#f07d4a':'#ffc548',paper:'#fff1d1',seed:53,wear:.035});
 artLine(c,body,{col:style==='screen'?'#ffb239':'#50334c',w:2.6,seed:88});
 for(let i=0;i<24;i++){const xx=(hash(i,18)-.5)*50,yy=-65+hash(i,19)*145;artLine(c,[[xx-7,yy],[xx,yy+9],[xx+6,yy+1]],{w:2,col:style==='screen'?PRINTCOLORS.coral:'#bc467c',al:.7,seed:i+30});}
 for(let i=0;i<5;i++)materialFeather(c,[-10+i*6,-171],[-30+i*15,-232-Math.sin(i/4*Math.PI)*24],6,{medium:style==='mixed'?'paper':style,color:colors[i%colors.length],seed:400+i});
 c.fillStyle=PRINTCOLORS.cream;c.fill(polyPath([[32,-165],[62,-155],[68,-140],[56,-145],[36,-142]]));c.fillStyle='#142c3d';c.beginPath();c.ellipse(16,-158,5,6,0,0,TAU);c.fill();c.fillStyle='#fff7e5';c.beginPath();c.arc(18,-161,1.6,0,TAU);c.fill();c.restore();
}
