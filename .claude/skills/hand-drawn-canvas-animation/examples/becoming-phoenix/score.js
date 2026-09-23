'use strict';
// Original 60-second chamber-like score, generated with Web Audio synthesis.
// Felt-piano motif, bowed pads, bell harmonics and restrained percussion.
function score(ac,t0,destination){
 const master=ac.createGain();master.gain.setValueAtTime(.69,t0);master.gain.setValueAtTime(.69,t0+58);master.gain.linearRampToValueAtTime(0,t0+60);
 const comp=ac.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=18;comp.ratio.value=2.4;comp.attack.value=.02;comp.release.value=.25;master.connect(comp);comp.connect(destination);
 const dry=ac.createGain();dry.gain.value=.85;dry.connect(master);
 const reverb=ac.createConvolver(),ir=ac.createBuffer(2,Math.floor(ac.sampleRate*2.6),ac.sampleRate),random=rng(713);
 for(let side=0;side<2;side++){const d=ir.getChannelData(side);for(let i=0;i<d.length;i++)d[i]=(random()*2-1)*Math.exp(-i/ac.sampleRate*2.8)*(i>ac.sampleRate*.017?1:0);}
 reverb.buffer=ir;const wet=ac.createGain();wet.gain.value=.21;reverb.connect(wet);wet.connect(master);
 const send=(node,amount=.3,pan=0)=>{const p=ac.createStereoPanner();p.pan.value=pan;node.connect(p);p.connect(dry);const s=ac.createGain();s.gain.value=amount;p.connect(s);s.connect(reverb);};
 const hz=n=>440*2**((n-69)/12);
 function piano(n,t,d=2.2,v=.22,pan=0){if(t>=59)return;const g=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=3100;g.connect(f);send(f,.65,pan);g.gain.setValueAtTime(0,t0+t);g.gain.linearRampToValueAtTime(v,t0+t+.007);g.gain.exponentialRampToValueAtTime(v*.22,t0+t+.26);g.gain.exponentialRampToValueAtTime(.0001,t0+t+d);
  for(const [ratio,gain] of [[1,1],[2.002,.30],[3.008,.10],[4.02,.045]]){const o=ac.createOscillator(),a=ac.createGain();o.type='sine';o.frequency.value=hz(n)*ratio;a.gain.value=gain;o.connect(a);a.connect(g);o.start(t0+t);o.stop(t0+t+d+.05);}}
 function strings(notes,t,d,v=.035){for(let j=0;j<notes.length;j++){const e=ac.createGain(),f=ac.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(620,t0+t);f.frequency.linearRampToValueAtTime(1350,t0+t+d*.7);e.connect(f);send(f,.7,(j/(notes.length-1||1)-.5)*.8);e.gain.setValueAtTime(0,t0+t);e.gain.linearRampToValueAtTime(v,t0+t+Math.min(.8,d*.2));e.gain.setValueAtTime(v*.85,t0+t+d*.7);e.gain.exponentialRampToValueAtTime(.0001,t0+t+d+1.2);
   for(const detune of [-5,4]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=hz(notes[j]);o.detune.value=detune;o.connect(e);o.start(t0+t);o.stop(t0+t+d+1.25);}}}
 function bell(n,t,v=.12){const e=ac.createGain();send(e,.9,.35);e.gain.setValueAtTime(v,t0+t);e.gain.exponentialRampToValueAtTime(.0001,t0+t+3.8);for(const [r,k] of [[1,.7],[2,.19],[3.99,.07]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=hz(n)*r;g.gain.value=k;o.connect(g);g.connect(e);o.start(t0+t);o.stop(t0+t+3.85);}}
 function drum(t,v=.13){const o=ac.createOscillator(),e=ac.createGain();o.frequency.setValueAtTime(86,t0+t);o.frequency.exponentialRampToValueAtTime(42,t0+t+.2);e.gain.setValueAtTime(v,t0+t);e.gain.exponentialRampToValueAtTime(.0001,t0+t+.65);o.connect(e);send(e,.12);o.start(t0+t);o.stop(t0+t+.7);}
 function hiss(t,d,v,seed=1,freq=1300){const buf=ac.createBuffer(1,Math.ceil(ac.sampleRate*d),ac.sampleRate),data=buf.getChannelData(0),r=rng(seed);for(let i=0;i<data.length;i++)data[i]=(r()*2-1)*Math.sin(Math.PI*i/data.length)**2;const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=buf;f.type='bandpass';f.frequency.value=freq;f.Q.value=.55;g.gain.value=v;s.connect(f);f.connect(g);send(g,.45,-.15);s.start(t0+t);}
 function chirp(t,n=82){const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(hz(n),t0+t);o.frequency.exponentialRampToValueAtTime(hz(n+7),t0+t+.065);o.frequency.exponentialRampToValueAtTime(hz(n+2),t0+t+.16);g.gain.setValueAtTime(0,t0+t);g.gain.linearRampToValueAtTime(.035,t0+t+.02);g.gain.exponentialRampToValueAtTime(.0001,t0+t+.19);o.connect(g);send(g,.35,.1);o.start(t0+t);o.stop(t0+t+.2);}
 const chords=[[50,57,62,65,69],[46,53,58,62,65],[41,53,57,60,65],[48,55,60,62,67],[43,50,55,58,62],[45,52,57,61,64],[46,53,58,62,65],[50,57,62,65,69],[50,57,62,65,69],[41,53,57,60,65],[48,55,60,64,67],[46,53,58,62,65],[48,55,60,62,67],[50,57,62,65,69],[45,52,57,61,64],[45,52,57,61,64],[50,57,62,66,69],[43,55,59,62,67],[47,54,59,62,66],[50,57,62,66,69]];
 chords.forEach((ch,bar)=>{const t=bar*3,energy=bar<4?.3:bar<6?.35:bar<8?.32:bar<13?.58:bar<16?.77:1;
  piano(ch[0],t,2.8,.15+energy*.055,-.24);
  if(bar>=4)strings(ch.slice(1),t,2.95,.010+energy*.018);
  if(bar<4){[0,1.5,2.25].forEach((beat,k)=>piano(ch[2+k%3],t+beat,2.5,.15,.1+k*.15));}
  else if(bar>=8&&bar<19){for(let j=0;j<8;j++){if(t+j*.375>46.6&&t+j*.375<47.25)continue;piano(ch[1+[0,1,2,3,2,1,3,2][j]],t+j*.375,1.4,.070+energy*.035,(j%2?1:-1)*.3);}}
  else {piano(ch[2],t+.75,2.4,.13,.2);piano(ch[4],t+1.5,2.5,.105,.3);}
  if(bar>=10&&bar<19){drum(t,.10+energy*.07);if(bar>=13)drum(t+1.5,.06);hiss(t+2.15,.35,.025,bar+1,3400);}
 });
 // The motif learns to complete its phrase. Early fragments end unresolved.
 const motif=[[0,74],[1.5,69],[3.75,72],[5.25,65],[7.5,69],[9,67],[19.5,74],[21,69],[22.5,77],[24,76],[25.5,74],[28.5,77],[30,79],[31.5,81],[33,79],[34.5,77],[36,76],[37.5,74],[40.5,77],[42,79],[43.5,81],[45,85],[47,86],[48.5,81],[50,78],[51.5,81],[53,83],[54.5,81],[56.5,78],[57.5,74]];
 for(const [t,n] of motif)piano(n,t,t>47?2.8:2.1,t>47?.23:.17,.04);
 bell(86,21,.08);bell(90,25.5,.055);bell(86,47,.16);bell(93,50,.07);bell(86,56.5,.07);
 strings([50,57,62,66,69,74],47,5.8,.030);drum(47,.21);hiss(46.4,1.5,.11,94,2700);
 hiss(7,6.6,.11,66,650);hiss(8.2,1.5,.075,167,1250);hiss(9.05,1.9,.105,168,950);hiss(10.98,1.8,.14,169,760);drum(9.58,.11);hiss(9.52,.5,.11,170,240);hiss(11.2,.3,.08,171,2100);hiss(14,2.2,.07,76,900);
 // Sand drag, falling grains, paper turn and the first living wing stroke.
 hiss(15,1.3,.075,122,2100);hiss(16.6,1.95,.045,125,3900);
 hiss(36.85,.8,.05,130,1600);hiss(37.7,.85,.045,131,2400);hiss(38.5,1.6,.025,132,1800);hiss(39.2,1.4,.025,133,2400);hiss(40.1,.95,.02,134,3100);
 hiss(41.5,1.1,.045,138,1300);
 hiss(9.5,.18,.07,21,1600);drum(10.65,.045);chirp(4.5);chirp(23.7,84);
 for(const n of [50,57,62,66,69,74])piano(n,57,2.8,.09,n%2?.2:-.2);
}
