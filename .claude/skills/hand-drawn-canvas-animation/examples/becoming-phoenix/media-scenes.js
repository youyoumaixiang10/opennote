'use strict';
function pencilScene(c,t){awakening(c,Math.min(5.99,t*.91));}
// A continuous storm performance: three gusts, a lost foothold, then recovery.
function stormForce(t){return .28+.5*sm(.1,1.25,t)*(1-sm(1.45,2.0,t))+.8*sm(2.05,2.5,t)*(1-sm(3.0,3.8,t))+1.1*sm(3.95,4.45,t)*(1-sm(4.65,5.5,t))+.3*sm(5.9,6.8,t);}
function inkScene(c,t){
 stock(c,'#14191d');const q=qt(t),white='#f3efdf',gust=stormForce(t),travel=t*88+95*sm(2.05,2.8,t)+160*sm(3.95,4.8,t);
 c.save();
 // Camera absorbs the strongest gust, then settles. Geometry remains overscanned.
 const shake=sm(2,2.5,t)*(1-sm(5.4,6.4,t));
 c.translate(960,600);c.rotate(Math.sin(t*8.7)*.004*gust*shake);c.scale(1.035,1.035);c.translate(-960+Math.sin(t*19)*4*gust*shake,-600+Math.sin(t*14)*3*gust*shake);
 const opening=[];for(let i=-2;i<=13;i++){const x=i*180,yy=300+noise1((x+travel*.23)/350,17)*115+Math.sin(t*1.5+i*.42)*22*gust;opening.push([x,yy]);}
 c.fillStyle=white;c.fill(curvePath([...opening,[2260,1130],[-360,1130]],true,1.0));
 // Cloud scud streams behind the distant tree silhouettes.
 for(let i=0;i<17;i++){const x=((hash(i,22)*2800-travel*.6)%2800+2800)%2800-400,y=245+hash(i,27)*220;
  artLine(c,[[x,y],[x+140,y-20*gust],[x+310,y-9],[x+430,y-35*gust]],{w:3+hash(i,24)*12,col:'#394047',al:.14,seed:i});}
 const treeLayer=(depth,count,spacing,col)=>{
  const drift=travel*depth;
  for(let i=-3;i<count+4;i++){
   const x=i*spacing-((drift%spacing)+spacing)%spacing,worldI=i+Math.floor(drift/spacing),phase=worldI*.71;
   const bend=(40+155*gust)*depth*(.65+.35*Math.sin(t*2.3+phase));
   const at=(dx,y)=>[x+dx-bend*Math.pow(clamp((950-y)/1000,0,1),1.7),y];
   const w=depth>1?76:depth>.5?44:22;
   const pts=[at(-w*.7,1110),at(-w*.55,735),at(-w*.5,380),at(-w*.8,-150),at(w*.5,-150),at(w*.8,360),at(w*.65,750),at(w*.8,1110)];
   c.fillStyle=col;c.fill(curvePath(pts,true,.6));
   for(let j=0;j<3;j++){const y=390+j*150;artLine(c,[at(0,y+160),at(90+15*j,y),at(170+20*j,y-105)],{w:w*.17,col,seed:worldI*13+j});}
  }
 };
 treeLayer(.24,14,172,'#b1b3aa');treeLayer(.64,10,247,'#596264');treeLayer(1.05,9,292,'#242d33');
 // One restrained lightning illumination in the back of the forest.
 const flash=sm(2.47,2.53,t)*(1-sm(2.55,2.78,t));
 if(flash>0){c.save();c.globalAlpha=flash*.72;artLine(c,[[1640,-40],[1510,164],[1575,183],[1415,409]],{w:11,col:'#fffbed',seed:211});c.restore();}
 c.fillStyle='#10171b';c.fill(curvePath([[-350,900],[100,882],[520,850],[880,846],[1180,848],[1590,879],[2250,850],[2250,1250],[-350,1250]],true,.8));
 for(let i=0;i<68;i++){const x=((hash(i,55)*2450-travel)%2450+2450)%2450-240,y=897+hash(i,56)*180;artLine(c,[[x,y],[x+58,y-7],[x+101,y-3]],{col:white,w:1.1,al:.2,seed:i});}
 // The feet skid under force; a short involuntary hop catches the body again.
 const x=950+150*sm(0,1.3,t)-180*sm(1.4,2.1,t)+120*sm(2.6,3.4,t)-230*sm(4.15,4.55,t)+140*sm(4.9,5.7,t)+140*sm(5.9,6.8,t);
 if(t>=4.15&&t<4.88){const u=clamp((t-4.15)/.73,0,1),air=4*57*u*(1-u);
  mediumGround(c,x,848-air,2.25,{medium:'ink',age:.12,a:u<.5?'push':'reach',b:u<.5?'air':'land',u:u<.5?u*2:(u-.5)*2,blink:gust>1.1});
 }else mediumGround(c,x,848,2.25,{medium:'ink',age:.12,a:'lean',b:'crouch',u:clamp(.15+.65*stormForce(q),0,1),blink:gust>1||t>6.5});
 // Spray, wind strokes and torn leaves move at different depths.
 for(let i=0;i<235;i++){
  const near=i%4===0,speed=near?1180:710,xx=((hash(i,41)*2650-t*speed-travel*.6)%2650+2650)%2650-300,yy=(hash(i,42)*1500+t*(near?620:400))%1500-160;
  const len=(near?105:54)*(1+gust*.65);artLine(c,[[xx,yy],[xx-len,yy+len*.45]],{col:yy>820?white:'#182329',w:near?2.9:1.2,al:near?.40:.26,seed:i+100,rough:.2});
 }
 for(let i=0;i<16;i++){const x=((hash(i,102)*3000-t*(620+i*18)-travel)%3000+3000)%3000-420,y=350+hash(i,103)*620+Math.sin(t*4+i)*38*gust;
  c.save();c.translate(x,y);c.rotate(-t*(3+hash(i,101)*4)+i);c.scale(1+hash(i,104)*1.7,1);c.fillStyle=i%3?'#1c272d':white;c.fill(curvePath([[-14,0],[-2,-8],[19,-2],[5,8]],true,.7));c.restore();}
 for(let i=0;i<9;i++){const x=((hash(i,111)*2800-t*(880+i*20))%2800+2800)%2800-350,y=160+hash(i,112)*790;
  artLine(c,[[x,y],[x-100,y+10],[x-220,y-15*gust],[x-320,y+5]],{w:1.2,col:y>840?white:'#283b43',al:.28*gust,seed:400+i});}
 // A snapped branch passes close to the lens during the largest gust.
 if(t>4.05&&t<5.4){const u=(t-4.05)/1.35;c.save();c.translate(2250-u*2950,150+u*570);c.rotate(-.35-u*1.25);artLine(c,[[-230,20],[-90,-4],[120,7],[280,-43]],{w:25,col:'#10191d',seed:500});artLine(c,[[0,0],[50,-88],[104,-111]],{w:12,col:'#10191d',seed:501});c.restore();}
 // Near trunks cross the frame edges and sell camera travel without hiding the bird.
 for(let i=0;i<2;i++){const x=i?W+125-70*Math.sin(t*1.2): -160-90*Math.sin(t*1.05);c.fillStyle='#0c1419';c.fill(curvePath([[x-60,1200],[x-20,420],[x-150*gust,-100],[x+15-150*gust,-100],[x+95,530],[x+85,1200]],true,.8));}
 c.restore();
}
const SAND_N=520,SAND_WORLD=1920;
function sandBirdPoints(p,x,y,s){return smoothPts([...p.crown,...p.beak.slice(1),...p.breast.slice(1),...p.back.slice().reverse()],true,5,1.2).map(([a,b])=>[x+a*s,y+b*s]);}
const sandPose0=poseShape('crouch','crouch',0,.14),sandPose1=poseShape('listen','listen',0,.4);
const newSandShape=sandBirdPoints(sandPose1,1010,1230,2.6);
function initialBed(h,N,world){
 const cv=document.createElement('canvas');cv.width=cv.height=N;const g=cv.getContext('2d');g.scale(N/world,N/world);g.translate(1070,1140);g.scale(2.25,2.25);g.fillStyle='#fff';g.fill(bodyPath(sandPose0));g.fill(curvePath(sandPose0.tail,true,.7));g.strokeStyle='#fff';g.lineWidth=6;for(const id of ['legA','legB','footA','footB'])g.stroke(curvePath(sandPose0[id],false,.8));
 const data=g.getImageData(0,0,N,N).data;for(let i=0;i<h.length;i++){const y=Math.floor(i/N)/N,x=(i%N)/N,mask=data[i*4+3]/255;h[i]=(.78+hash(i,42)*.26)*(1-mask*.97)+(y>.69?.26:0)+Math.max(0,.18-Math.abs(x-.5))*.2;}
 // Real heaped sand strokes are added to the initially cleared body.
 g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,N,N);g.setTransform(N/world,0,0,N/world,0,0);g.translate(1070,1140);g.scale(2.25,2.25);g.strokeStyle='#fff';g.lineWidth=2.8;g.stroke(curvePath(sandPose0.wing,false,1.1));g.stroke(curvePath(sandPose0.eye,false,1.1));const lines=g.getImageData(0,0,N,N).data;for(let i=0;i<h.length;i++)h[i]+=lines[i*4+3]/255*.75;
}
sandFilm({N:SAND_N,world:SAND_WORLD,hand:true,init:initialBed,gestures:[
 G.wind(.0,1.1,{box:[160,500,1720,1470],vx:570,vy:-65,strength:.15,lift:.9,turb:.7,feather:260}),
 G.palm(1.0,2.3,[[590,1130],[760,1060],[1050,1010],[1340,1080]],{r:120,keep:.12,strength:1,streaks:.2}),
 G.fill(2.6,4.55,newSandShape,{tool:'pour',r:11,spacing:19,amount:2.9}),
 G.pour(4.30,4.65,[[783,1150],[600,1237],[790,1212]],{r:13,amount:2.2}),
 G.finger(4.65,5.10,smoothPts(sandPose1.wing,false,5,.9).map(([x,y])=>[1010+x*2.6,1230+y*2.6]),{r:9,keep:.7}),
 G.dab(5.13,1010+sandPose1.eye[1][0]*2.6,1230+(sandPose1.eye[1][1]+4)*2.6,{r:9,hand:'finger'})
]});
function sandScene(c,t){sandLook(960,970,1880-80*sm(0,6,t));sandFrame(c,t);const im=c.getImageData(0,0,OUT_W,OUT_H),d=im.data;for(let i=0;i<d.length;i+=4){const v=Math.round(d[i]*.25+d[i+1]*.60+d[i+2]*.15);d[i]=d[i+1]=d[i+2]=v;}c.save();c.setTransform(1,0,0,1,0,0);c.putImageData(im,0,0);c.restore();resetT(c);}
function doodleScene(c,t){const q=qt(t),warm=sm(1.4,4.6,q);backdrop(c,'#add7d5',{spot:.3,vignette:.08});const pull=sm(0,2,t);moveCamera(c,lerp(559,960,pull),lerp(656,540,pull),lerp(1.48,1,pull));
 // Found photo is a shelter, and a real rim becomes the drawn bird's perch.
 const pl=place('lantern',{x:1250,y:962,h:878,pivot:[.5,1],rot:-.025*(1-sm(0,3,t))});
 artLine(c,[[130,966],[712,944],[1180,961],[1750,965]],{w:5,col:'#25444b',seed:50});
 for(let i=0;i<8;i++){const x=260+i*110;artLine(c,[[x,952],[x-18,874],[x+15,833]],{w:3,col:'#4a786d',al:.6,seed:44+i});}
 photo(c,pl,{ground:960,shadow:.32});const lamp=on(pl,.51,.69);glow(c,lamp[0],lamp[1],360,'#ffcf6b',warm*.85);
 let h;if(t<2.0)h={x:595,ground:947,a:'listen',b:'rest',u:sm(.7,1.8,q)};else if(t<5.35)h=hopState(q,2.45,1.15,[595,947],[1220,850],230);else h=hopState(q,5.55,1.1,[1220,850],[480,863],215);
 mediumGround(c,h.x,h.ground,1.75,{...h,medium:'doodle',age:.4,warm,blink:t>5.15&&t<5.35});
 if(t>3.6){c.save();c.beginPath();c.ellipse(...on(pl,.50,.73),pl.w*.455,pl.h*.245,pl.rot,0,TAU);c.clip();photo(c,pl,{al:.14,shadow:0});c.restore();}
 // A drawn flame and little stars are on the glass, not free decoration beside it.
 const z=on(pl,.65,.73);artLine(c,[[z[0],z[1]+31],[z[0]-16,z[1]+2],[z[0]+2,z[1]-41],[z[0]+21,z[1]+8],[z[0],z[1]+31]],{w:4,col:'#e8872b',al:warm,seed:11});
 for(let i=0;i<9;i++){const xx=1500+hash(i,77)*230,yy=230+hash(i,78)*470,r=9+hash(i,75)*10;artLine(c,[[xx-r,yy],[xx+r,yy],[xx,yy],[xx,yy-r],[xx,yy+r]],{w:3,col:'#fff6cf',al:warm*.9,seed:i});}
}
// Every leap advances through one landscape. The camera follows; the bird never resets.
function risoScene(c,t){
 const q=qt(t),part=Math.min(2,Math.floor(t/(8/3))),local=t-part*(8/3);
 const perches=[[480,863],[1180,684],[1960,530],[2690,380]],h=hopState(local,.55,1.2,perches[part],perches[part+1],185+part*20);
 const age=.4+.6*sm(0,7.6,q),sc=1.75+.35*sm(0,7.6,q),cx=1510*sm(2.4,7.2,t);
 const posed=poseShape(h.a,h.b,Math.round(h.u*12)/12,age),head=h.ground-75*(.65+.35*age)*sc+Math.min(...posed.crown.map(p=>p[1]))*sc;
 const cy=Math.min(-304*sm(2.4,7.2,t),head-135);
 const plates=[makePlate(),makePlate(),makePlate()];
 plates.forEach(({g},ch)=>{
  g.save();g.translate(-cx,-cy);g.fillStyle=ch===2?'#555':'#000';
  if(ch===0){g.fill(circPath(220+cx,180+cy,145));for(const [x,y] of perches)g.fill(rectPath(x-390,y,680,1700));}
  if(ch===1){const top=[];for(let i=-2;i<14;i++)top.push([i*330,100+noise1(i,34)*180]);g.fill(curvePath([...top,[4000,600],[-660,600]],true,.8));for(const [x,y] of perches)for(let i=0;i<6;i++)g.fill(rectPath(x-350+i*110,y+24,38,1300));}
  if(ch===2){for(const [x,y] of perches)g.fill(rectPath(x-393,y,686,17));
   // Earlier takeoffs leave a visible trail of ink impressions.
   for(let k=0;k<=part;k++){const x=perches[k][0],y=perches[k][1];for(let j=0;j<4;j++){g.save();g.translate(x-120+j*45,y+43);g.rotate(-.35);g.fill(curvePath([[-9,10],[0,-14],[12,12],[4,6]],true,.5));g.restore();}}
  }
  risoBirdPlate(g,{x:h.x,y:h.ground-75*(.65+.35*age)*sc,scale:sc,a:h.a,b:h.b,u:Math.round(h.u*12)/12,age,channel:ch});g.restore();
 });
 stock(c,'#f6ead3');const inks=[PRINTCOLORS.yellow,PRINTCOLORS.pink,PRINTCOLORS.cyan];
 for(let ch=0;ch<3;ch++)printPlate(c,plates[ch].cv,{ink:inks[ch],cell:7.2,angle:[.15,.72,1.1][ch],offset:[[0,0],[6,-3],[-5,4]][ch],mottling:.16,jitter:.12,seed:60+ch,blend:'multiply',maxCov:.98});
}
function pageTexture(g,w,h,col,seed){g.fillStyle=col;g.fillRect(0,0,w,h);g.strokeStyle='#ceba96';g.lineWidth=.8;g.strokeRect(18,18,w-36,h-36);for(let i=0;i<35;i++){const x=hash(i,seed)*w,y=hash(i,seed+1)*h;artLine(g,[[x,y],[x+20,y+3]],{w:.65,col:'#877960',al:.14,seed:i});}}
const pageA=tex3(520,630,(g,w,h)=>{pageTexture(g,w,h,'#f7e8c7',71);g.fillStyle='#df8269';g.fill(curvePath([[0,390],[160,341],[331,413],[520,366],[520,630],[0,630]]));for(let i=0;i<7;i++)leaf(g,40+i*69,490,-.5,65,.7,i);},2);
const pageB=tex3(520,630,(g,w,h)=>{pageTexture(g,w,h,'#ebdcb9',75);g.fillStyle='#d2a942';g.beginPath();g.arc(330,180,98,0,TAU);g.fill();for(let i=0;i<30;i++)artLine(g,[[40,350+i*6],[420,349+i*6]],{w:.65,col:'#789183',al:.3,seed:i});},2);
const cover2=tex3(520,630,(g,w,h)=>{g.fillStyle='#365b62';g.fillRect(0,0,w,h);g.strokeStyle='#e4c17c';g.lineWidth=3;g.strokeRect(28,28,w-56,h-56);materialFeather(g,[215,485],[303,140],35,{medium:'paper',color:'#e3b85c',seed:82});},2);
const cutBird=tex3(380,450,(g,w,h)=>{g.save();g.translate(217,363);mediumBird(g,{x:0,y:0,scale:1.27,age:.75,a:'listen',medium:'doodle',warm:1});g.restore();},2);
const cutPhoenix=tex3(900,520,null,2);
let lastPaperPose=-1;
function unfoldPhoenix(t){
 const frame=Math.floor(t*24+1e-6);if(frame===lastPaperPose)return;lastPaperPose=frame;
 const time=frame/24,left=sm(3.45,5.25,time),right=sm(3.8,5.65,time),tail=sm(4.25,6.1,time),sc=lerp(.44,.63,sm(2.75,4.4,time));
 const y=495-sc*lerp(110,380,tail);
 cutPhoenix.redraw(g=>{
  // The base never moves: unfolding adds height above the physical paper tab.
  g.fillStyle='#edc571';g.fill(polyPath([[436,480],[464,480],[478,520],[422,520]]));
  g.fillStyle='#f8e4ae';g.fill(polyPath([[450,480],[464,480],[478,520],[450,520]]));
  artLine(g,[[450,480],[450,520]],{col:'#9c824b',w:1,seed:33});
  mediaPhoenix(g,{x:450,y,scale:sc,style:'paper',a:'spread',foldLeft:left,foldRight:right,tailOpen:tail});
  // Bright crease edges describe the two wings while they rotate out of the fold.
  for(const [side,open] of [[-1,left],[1,right]])if(open<.96){
   const hingeX=450+side*35*sc,hingeY=y-58*sc;
   artLine(g,[[hingeX,hingeY],[hingeX+side*(8+34*open)*sc,hingeY+128*sc]],{col:'#fff5d9',w:2.2,al:1-open,seed:170+side});
  }
 });
}
const phoenixPaperPiece={base:[[-450,-90],[450,-90]],h:520,sheet:cutPhoenix,lean:85};
const treePaper=tex3(190,340,(g,w,h)=>{g.fillStyle='#407b76';g.fill(curvePath([[85,340],[64,218],[10,148],[38,70],[97,3],[170,97],[175,175],[113,248],[118,340]],true,.75));g.strokeStyle='#f3e9d3';g.lineWidth=2;g.beginPath();g.moveTo(100,330);g.lineTo(91,70);g.stroke();},2);
// The very last printed frame becomes the physical sheet inside the book.
const printPageL=tex3(520,630,null,2),printPageR=tex3(520,630,null,2);
let printedPageReady=false;
function ensurePrintedPage(){if(printedPageReady)return;const plate=document.createElement('canvas');plate.width=OUT_W;plate.height=OUT_H;const g=plate.getContext('2d');risoScene(g,7.999);
 printPageL.redraw((g,w,h)=>g.drawImage(plate,0,0,OUT_W/2,OUT_H,0,0,w,h));
 printPageR.redraw((g,w,h)=>g.drawImage(plate,OUT_W/2,0,OUT_W/2,OUT_H,0,0,w,h));printedPageReady=true;}
const storybook=book3({PW:560,PD:630,board:'#334e5c',cover:cover2,spreads:[
 {left:printPageL,right:printPageR,pieces:[]},
 {left:pageB,right:pageA,pieces:[phoenixPaperPiece,{base:[[-390,230],[-200,230]],h:290,sheet:treePaper},{base:[[270,180],[430,180]],h:255,sheet:treePaper}]}
]});
function paperScene(c,t){ensurePrintedPage();unfoldPhoenix(t);phoenixPaperPiece.lean=lerp(20,85,sm(2.6,4.15,t));stock(c,'#b78f67');const q=qt(t);
 for(let i=0;i<32;i++)artLine(c,[[0,i*40+noise1(i,21)*20],[980,i*40+8],[1920,i*40-7]],{w:1,col:'#654b3b',al:.14,seed:i});
 // Pull out of the exact print into its page, then turn the page to reveal the grown bird.
 const u=sm(0,1.8,t);cam3({eye:[-200*u,lerp(1008,950,u),lerp(1,1420,u)],target:[0,150*u,0],f:lerp(1714.2857,1680,u)});
 const turn=t<1.85?1:1+sm(1.85,3.65,t);storybook.draw(c,{turn});
 if(t>5.6){const p=proj3([0,510,-90]);motes(c,t,{n:24,power:sm(5.6,7,t)*.5,origin:p.slice(0,2),spread:380});}
}
function screenScene(c,t){const q=qt(t);stock(c,'#073c45');
 const sun=curvePath(blob(960,450,421,421,141,{amp:.026,n:72}));screenFill(c,sun,[520,30,880,880],{color:'#f45738',paper:'#ffc947',seed:34,wear:.025});
 for(let i=0;i<32;i++){const a=i*TAU/32,rr=465;artLine(c,[[960+Math.cos(a)*rr,450+Math.sin(a)*rr],[960+Math.cos(a)*(rr+75),450+Math.sin(a)*(rr+75)]],{w:i%2?5:9,col:'#d9912b',al:.54,seed:i});}
 c.fillStyle='#052e37';c.fill(polyPath([[0,740],[300,530],[540,784],[730,674],[960,852],[1210,650],[1530,750],[1710,560],[1920,705],[1920,1080],[0,1080]]));
 const u=sm(.2,4.8,q),sc=lerp(.72,1.18,u);mediaPhoenix(c,{x:960,y:lerp(375,452,u),scale:sc,a:'spread',b:'high',u:Math.sin(u*Math.PI)*.6,style:'screen',phase:q*.35});
 if(t>5.1)motes(c,t,{n:80,power:.75,origin:[960,590],spread:930});
}
function mixedScene(c,t){const q=qt(t);stock(c,'#f6efde');
 // Return to the opening branch: the same world, now changed by the bird's journey.
 paintedSun(c,960,440,355,C.gold,.25);paintedSun(c,960,440,365,C.orange,.10);
 const hill=curvePath([[-60,1001],[350,963],[630,998],[1020,970],[1350,1000],[1610,963],[1980,1000],[1980,1120],[-60,1120]]);
 c.fillStyle='#d9dfc5';c.fill(hill);dotScreen(c,hill,[0,940,1920,140],{color:PRINTCOLORS.cyan,cell:8,density:.3,angle:.7,seed:21,alpha:.28});
 twig(c,950,1008,1390,{seed:52});nest(c,950,991,.46);
 for(let i=0;i<13;i++){const x=100+i*142;bloom(c,x,1039,.42+hash(i,31)*.35,[C.coral,C.violet,C.orange,C.pink][i%4],91+i);}
 const ph=(Math.max(0,q-.4)%2.5)/2.5,u=ph<.5?ph*2:(1-ph)*2;
 mediaPhoenix(c,{x:960,y:452-20*sm(0,6,q),scale:lerp(1.18,1.14,sm(0,2,t)),a:'spread',b:'high',u:u*.6,style:'mixed',phase:q*.6});
 motes(c,t,{n:75,power:.58,origin:[960,650],spread:900});
 if(t>6.1){const z=sm(6.1,7,t);c.save();c.translate(2300-1900*z,450);c.rotate(-.4);c.scale(2+z*11,2+z*11);materialFeather(c,[0,100],[40,-130],35,{medium:'paper',color:'#edbf47',seed:74});c.restore();if(z>.5)veil(c,C.paper,sm(.5,1,z));}
}
const TIMELINE=[{name:'pencil — first breath',dur:7,fn:pencilScene},{name:'ink — the storm',dur:7,fn:inkScene},{name:'sand — drawn again',dur:6,fn:sandScene},{name:'photo doodle — warmth',dur:7,fn:doodleScene},{name:'risograph — growing',dur:8,fn:risoScene},{name:'paper pop-up — a new chapter',dur:7,fn:paperScene},{name:'screen print — phoenix',dur:7,fn:screenScene},{name:'mixed media — all its colours',dur:7,fn:mixedScene},{name:'signature',dur:4,fn:signature}];
