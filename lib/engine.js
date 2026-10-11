import * as THREE from 'three'
import {freshness,occupancyState} from './core.mjs'

export function startEngine(cv,tip,nav){
const cleanup=[];let raf=0;const on=(t,e,f,o)=>{t.addEventListener(e,f,o);cleanup.push(()=>t.removeEventListener(e,f,o))};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],rnd=(a,b)=>a+Math.random()*(b-a),L=(a,b,u)=>a+(b-a)*u,cl=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ez=u=>u*u*(3-2*u),RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const S={co2:640,t:24.2,h:56,ppl:2,kg:6.2,sel:'ac',l:{e:1,a:1,c:1},w:{ac:320,light:45,tv:120,plug:18}},tot=()=>Math.round(S.w.ac+S.w.light+S.w.tv+S.w.plug);
const DV={ac:{n:'AC unit',p:[-1.9,2.45,-2.85],g:[1.9,.5,.3]},light:{n:'Ceiling lamp',p:[0,2.3,0]},tv:{n:'Television',p:[.8,1.5,-2.8],g:[2.2,1.25,.1]},plug:{n:'Smart plug',p:[3.55,.2,1],g:[.25,.3,.25]},sensor:{n:'CO₂ sensor',p:[-3.9,1.5,1.4],g:[.1,.35,.35]}};
/* ---- scene ---- */
const R=new THREE.WebGLRenderer({canvas:cv,antialias:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setClearColor(0x0b0d0c);
const sc=new THREE.Scene();sc.fog=new THREE.FogExp2(0x0b0d0c,.02);const cam=new THREE.PerspectiveCamera(34,1,.1,200),g=new THREE.Group();sc.add(g);
const COL={lime:0xc8ff3d,ember:0xff5a36,ice:0x7fd6ff,bone:0xece8dc},V=THREE.Vector3;
const FU=[];const edge=(geo,c,o)=>new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:c,transparent:true,opacity:o}));
const blk=(w,h,d,x,y,z)=>{const geo=new THREE.BoxGeometry(w,h,d),m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x14181a}));m.position.set(x,y,z);m.add(edge(geo,COL.bone,.5));g.add(m);FU.push(m);return m};
const wall=(w,h,x,y,z,ry)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:COL.bone,transparent:true,opacity:.05,side:2,depthWrite:false}));m.position.set(x,y,z);m.rotation.y=ry;g.add(m)};
const shell=edge(new THREE.BoxGeometry(8,3,6),COL.lime,.55);shell.position.y=1.5;g.add(shell);wall(8,3,0,1.5,-3,0);wall(6,3,-4,1.5,0,Math.PI/2);
const grid=new THREE.GridHelper(70,70,0x1b2a1d,0x121a14);grid.position.y=-.02;sc.add(grid);
const hp=[[-1.9,-2.85],[.8,-2.8],[0,0],[3.55,1],[-.4,1.1]],HV=hp.map(([x,z])=>new V((x+4)/8,(3-z)/6,0));
const floorM=new THREE.ShaderMaterial({uniforms:{t:{value:0},k:{value:.3},p:{value:HV}},vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform float t,k;uniform vec3 p[5];varying vec2 v;
vec3 ramp(float x){vec3 a=vec3(.05,.06,.055),b=vec3(1.,.35,.21),c=vec3(.93,.91,.84);return mix(mix(a,b,smoothstep(0.,.5,x)),c,smoothstep(.5,1.,x));}
void main(){float h=0.;for(int i=0;i<5;i++){float d=distance(v,p[i].xy);h+=p[i].z*exp(-d*d*34.);}h+=.05*sin(v.x*28.+t)*sin(v.y*22.-t*.7);
float gl=step(.965,fract(v.x*8.))+step(.96,fract(v.y*6.));vec3 c=mix(vec3(.055,.065,.06),ramp(clamp(h,0.,1.)),k);c+=gl*.07*vec3(.78,1.,.24);gl_FragColor=vec4(c,1.);}`});
const floor=new THREE.Mesh(new THREE.PlaneGeometry(8,6),floorM);floor.rotation.x=-Math.PI/2;g.add(floor);
blk(3,.5,1.1,-.4,.25,1.1);blk(3,.8,.3,-.4,.7,1.65);blk(.3,.7,1.1,-1.95,.45,1.1);blk(.3,.7,1.1,1.15,.45,1.1);blk(1.2,.4,1.2,-.4,.25,-.3);blk(3.2,.7,.6,.8,.35,-2.65);blk(1.8,.8,.9,2.7,.4,1.5);blk(.6,.5,.6,1.8,.25,1.5);
[[-3.5,.3],[3.6,-2.5],[3.3,2.6],[-3.3,-2.4]].forEach(([x,z])=>{const geo=new THREE.ConeGeometry(.34,1,6),m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0x10200f}));m.position.set(x,.5,z);m.add(edge(geo,COL.lime,.7));g.add(m)});
const gt=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),r=x.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=r;x.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const D={},dm=[];for(const k in DV){const d=DV[k],geo=d.g?new THREE.BoxGeometry(...d.g):new THREE.SphereGeometry(.28,16,12),mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:COL.lime}));mesh.position.set(...d.p);mesh.userData.k=k;g.add(mesh);dm.push(mesh);
const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,color:COL.lime,blending:2,depthWrite:false,transparent:true}));glow.position.copy(mesh.position);g.add(glow);
const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1,48),new THREE.MeshBasicMaterial({color:COL.lime,transparent:true,side:2,depthWrite:false}));ring.position.copy(mesh.position);g.add(ring);D[k]={mesh,glow,ring,ph:Math.random()*6}}
const meter=new V(4.7,.3,3.5);blk(.4,.6,.3,4.7,.3,3.5);const FL=['ac','light','tv','plug'];
const fg=new THREE.BufferGeometry().setFromPoints(FL.flatMap(k=>[meter,new V(...DV[k].p)]));g.add(new THREE.LineSegments(fg,new THREE.LineBasicMaterial({color:COL.ice,transparent:true,opacity:.25})));
const fp=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array(FL.length*7*3),3)),new THREE.PointsMaterial({color:COL.lime,size:.16,transparent:true,blending:2,depthWrite:false,map:gt}));fp.frustumCulled=false;g.add(fp);
const N=560,ap=new Float32Array(N*3),av=[];for(let i=0;i<N;i++){ap.set([rnd(-3.8,3.8),rnd(.1,2.9),rnd(-2.8,2.8)],i*3);av.push(rnd(.05,.25))}
const air=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(ap,3)),new THREE.PointsMaterial({color:COL.ice,size:.12,transparent:true,blending:2,depthWrite:false,map:gt}));air.frustumCulled=false;g.add(air);
const tg=new THREE.CylinderGeometry(.36,.36,4,16,1,true);tg.translate(0,2,0);const tower=edge(tg,COL.ember,.6);tower.position.set(6.4,0,-1);g.add(tower);
const fg2=new THREE.CylinderGeometry(.3,.3,1,16);fg2.translate(0,.5,0);const fill=new THREE.Mesh(fg2,new THREE.MeshBasicMaterial({color:COL.ember,transparent:true,opacity:.85}));fill.position.copy(tower.position);g.add(fill);
const ceilM=new THREE.Mesh(new THREE.PlaneGeometry(8,6),new THREE.MeshBasicMaterial({color:COL.bone,transparent:true,opacity:.07,side:2,depthWrite:false}));ceilM.rotation.x=-Math.PI/2;ceilM.position.y=3;g.add(ceilM);
const scanM=new THREE.Mesh(new THREE.PlaneGeometry(8,6),new THREE.MeshBasicMaterial({color:COL.lime,transparent:true,opacity:.16,side:2,depthWrite:false}));scanM.rotation.x=-Math.PI/2;scanM.add(edge(new THREE.PlaneGeometry(8,6),COL.lime,.9));g.add(scanM);
const hg=new THREE.Group();g.add(hg);[[-8.2,-.3,6,5.4,0x2a2140],[8.2,.3,6,5.4,0x3a2418]].forEach(([x,z,w,d,c])=>{const f=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:c}));f.rotation.x=-Math.PI/2;f.position.set(x,.01,z);hg.add(f);const e=edge(new THREE.BoxGeometry(w,2.4,d),COL.lime,.5);e.position.set(x,1.2,z);hg.add(e)});hg.visible=false;
const HL=[['Bedroom',-8.2,2.6,-.3,'210'],['Kitchen',8.2,2.6,.3,'420'],['Living room',0,3.5,0,'']].map(([n,x,y,z,w])=>{const e=document.createElement('div');e.className='hl';e.onclick=()=>nav('/room');document.body.append(e);cleanup.push(()=>e.remove());return{e,v:new V(x,y,z),n,w}});
function labels(){HL.forEach(h=>{if(RT!='house'){h.e.style.display='none';return}const v=h.v.clone().project(cam);h.e.style.display=v.z<1?'block':'none';h.e.style.left=(v.x*.5+.5)*innerWidth+'px';h.e.style.top=(-v.y*.5+.5)*innerHeight+'px';h.e.innerHTML=h.n+'<b>'+(h.w||tot())+' W</b>'})}
function snap(){R.setSize(520,320,false);cam.aspect=520/320;cam.clearViewOffset();cam.updateProjectionMatrix();floorM.uniforms.k.value=.8;HV.forEach(v=>v.z=.5);return [[9,6.5,9.5],[-9,6,8],[1,16,3]].map(p=>{cam.position.set(...p);cam.lookAt(0,1,0);R.render(sc,cam);return cv.toDataURL('image/jpeg',.82)})}
const TH=snap();
/* ---- camera path ---- */
const W=[{p:[13,8.5,13],t:[0,1,0],o:.2},{p:[5.5,4.4,7.5],t:[-1,2,-2],o:.18},{p:[-10,5,6],t:[0,1.5,0],o:-.2},{p:[1,17,2.5],t:[2,0,0],o:.2},{p:[11,7,10],t:[1,1,0],o:-.2}];
let T=[],fs=0,mx=0,my=0,last=0,hov=null;const P=new V(),Tg=new V(),col=new THREE.Color(),rc=new THREE.Raycaster(),nd=new THREE.Vector2();
const tops=()=>T=['top','energy','air','carbon','live'].map(i=>document.getElementById(i)?.offsetTop??0);
function size(){R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;tops()}
function frame(ms){raf=requestAnimationFrame(frame);const t=ms*.001,dt=Math.min(.05,t-last);last=t;let tp,tt,to,lt;
if(RT=='home'){const y=scrollY+innerHeight*.4;let f=0;for(let i=0;i<4;i++)if(y>=T[i])f=i+cl((y-T[i])/(T[i+1]-T[i]));fs+=(f-fs)*(RM?1:.07);
const i=Math.min(3,Math.floor(fs)),u=ez(fs-i),a=W[i],b=W[i+1],bm=k=>Math.max(0,1-Math.abs(fs-k)*1.3),lv=cl((fs-3.3)/.7),wx=(base,k,on)=>L(Math.max(base,bm(k)),on?1:.08,lv);
tp=[0,1,2].map(n=>L(a.p[n],b.p[n],u));tt=[0,1,2].map(n=>L(a.t[n],b.t[n],u));to=L(a.o,b.o,u);lt=[wx(.15,1,S.l.e),wx(.35,2,S.l.a),wx(.25,3,S.l.c)]}
else{const v=VW[RT];tp=v.p;tt=v.t;to=v.o;lt=v.l;
if(RT=='device'){const d=DV[S.sel].p;tp=[d[0]+3,d[1]+1.4,d[2]+4.2];tt=d;lt=[1,.15,.1]}
if(RT=='room'){lt=[S.l.e?1:.08,S.l.a?1:.08,S.l.c?1:.08];if(S.v2){tp=[0,19,1.4];tt=[0,0,0]}}}
const rt=t-RTt<1.5?.06:(RT=='home'?.3:.12);cP.lerp(tmp.set(...tp),rt);cT.lerp(tmp.set(...tt),rt);cO+=(to-cO)*rt;lw.forEach((_,n)=>lw[n]+=(lt[n]-lw[n])*.12);
P.copy(cP).sub(cT);const c=Math.cos(orb.az),sn=Math.sin(orb.az);P.set(P.x*c-P.z*sn,Math.max(2,P.y+orb.el*8),P.x*sn+P.z*c).multiplyScalar(RT=='room'?orb.z:1).add(cT);
if(!RM){P.x+=Math.sin(t*.25)*.5;if(RT=='home'){P.x+=mx*1.6;P.y-=my*.7}}
cam.position.copy(P);cam.lookAt(cT);cam.setViewOffset(innerWidth,innerHeight,-(innerWidth<820?0:cO)*innerWidth,0,innerWidth,innerHeight);
const wE=lw[0],wA=lw[1],wC=lw[2];
ceilM.visible=!!S.ceil&&RT=='room';scanM.visible=RT=='scan'||RT=='processing';if(scanM.visible)scanM.position.y=1.5+Math.sin(t*1.3)*1.45;hg.visible=RT=='house';tower.visible=fill.visible=['home','room','analytics'].includes(RT);
if(RT=='processing'){PR.p=Math.min(1,PR.p+dt/9);proc()}FU.forEach((m,i)=>m.visible=RT!='processing'||PR.p>i/FU.length);
floorM.uniforms.t.value=t;floorM.uniforms.k.value=.3+.7*wC;const wt=[S.w.ac/360,S.w.tv/360,S.w.light/160,S.w.plug/90,S.ppl*.1];HV.forEach((v,j)=>v.z=wt[j]*.9);
for(const k in D){const d=D[k],pw=(S.w[k]??110)/360,sel=S.sel==k;d.glow.scale.setScalar(1.1+pw*1.8+Math.sin(t*3+d.ph)*.15+(sel?.8:0));d.glow.material.opacity=.35+.5*wE+(sel?.2:0);
const c=(t*(.3+pw)+d.ph)%1;d.ring.scale.setScalar(.25+c*2.6);d.ring.material.opacity=(1-c)*(.15+.55*wE+(sel?.4:0));d.ring.quaternion.copy(cam.quaternion);d.mesh.scale.setScalar(sel?1.25:1)}
const fa=fp.geometry.attributes.position.array;FL.forEach((k,j)=>{const s=.12+S.w[k]/900,d=DV[k].p;for(let n=0;n<7;n++){const q=(t*s+n/7)%1,x=(j*7+n)*3;fa[x]=L(meter.x,d[0],q);fa[x+1]=L(meter.y,d[1],q);fa[x+2]=L(meter.z,d[2],q)}});fp.geometry.attributes.position.needsUpdate=true;fp.material.opacity=wE;
for(let n=0;n<N;n++){const x=n*3;ap[x+1]+=av[n]*.016;ap[x]+=Math.sin(t*.6+n)*.0025;if(ap[x+1]>2.9)ap[x+1]=.1}air.geometry.attributes.position.needsUpdate=true;
air.geometry.setDrawRange(0,Math.round(180+cl((S.co2-450)/700)*380));col.set(COL.ice).lerp(new THREE.Color(COL.lime),cl((S.co2-450)/450)).lerp(new THREE.Color(COL.ember),cl((S.co2-900)/500));air.material.color.copy(col);air.material.opacity=.15+.8*wA;
fill.scale.y=Math.max(.03,cl(S.kg/14)*4);fill.material.opacity=.3+.6*wC;tower.material.opacity=.25+.5*wC;
R.render(sc,cam);labels()}
/* ---- data + UI ---- */
const F={dn:()=>DV[S.sel].n,dw:()=>S.sel=='sensor'?(S.co2|0)+' ppm':(S.w[S.sel]|0)+' W',dkwh:()=>((S.w[S.sel]||0)*.015).toFixed(2),dkg:()=>((S.w[S.sel]||0)*.015*.71).toFixed(2),did:()=>'ESP32-0'+(Object.keys(DV).indexOf(S.sel)+1),peak:()=>(Math.max(...S.H.pw)/1000*[1,1.2,1.4,1.6][rg]).toFixed(1),en:()=>(tot()*.025*RANGE[rg]).toFixed(1),cf:()=>(tot()*.025*.71*RANGE[rg]).toFixed(1),co2:()=>S.co2|0,t:()=>S.t.toFixed(1),h:()=>S.h|0,pw:tot,kg:()=>S.kg.toFixed(2),ac:()=>S.w.ac|0,tv:()=>S.w.tv|0,light:()=>S.w.light|0,ppl:()=>S.ppl};

function upd(){upd2();badge();$$('[data-k]').forEach(e=>e.textContent=F[e.dataset.k]());const sel=S.sel,w=S.w[sel]??0;
$$('[data-d]').forEach(e=>{const k=e.dataset.d,v=S.w[k];e.classList.toggle('on',k==sel);e.querySelector('b').textContent=v==null?(S.co2|0)+' ppm':(v|0)+' W';e.querySelector('u').style.width=v==null?cl((S.co2-400)/1200)*100+'%':cl(v/380)*100+'%'});
$$('.det').forEach(e=>e.innerHTML=`<b>${DV[sel].n}</b> · ${(w*.015).toFixed(2)} kWh today · ${(w*.015*.71).toFixed(2)} kg CO₂e`)}
const iv=setInterval(()=>{const g=450+S.ppl*115;if(useLocal()){S.co2+=(g-S.co2)*.12+rnd(-8,8);S.t+=(22.4+S.ppl*.32-S.t)*.1+rnd(-.03,.03);S.h=cl(S.h+rnd(-.4,.4),48,64)}S.w.ac=cl(180+(S.t-22)*55+rnd(-10,10),150,380);S.w.tv=S.ppl?120+rnd(-5,5):4;if(useLocal())S.w.plug=18+rnd(-1,1);S.w.light=S.ppl?45:0;S.kg+=tot()/1000*.71/60*3;if(S.kg>14)S.kg=6.2;push();upd()},1000);cleanup.push(()=>clearInterval(iv));
on(window,'pointermove',e=>{mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;hov=null;if(e.target===cv){nd.set(mx*2,-my*2);rc.setFromCamera(nd,cam);const h=rc.intersectObjects(dm)[0];if(h)hov=h.object.userData.k}
cv.style.cursor=hov?'pointer':'';tip.style.display=hov?'block':'none';if(hov){tip.style.left=e.clientX+14+'px';tip.style.top=e.clientY+14+'px';const v=S.w[hov];tip.textContent=DV[hov].n+' · '+(v==null?(S.co2|0)+' ppm':(v|0)+' W')}});
on(window,'click',e=>{if(e.target===cv&&hov){S.sel=hov;upd()}});
const io=new IntersectionObserver(es=>es.forEach(e=>e.isIntersecting&&e.target.classList.add('in')),{threshold:.25});cleanup.push(()=>io.disconnect());

const VW={login:{p:[12,7,12],t:[0,1,0],o:0,l:[.2,.45,.2]},scan:{p:[9,6.5,10],t:[0,1,0],o:0,l:[0,0,.05]},processing:{p:[9,6.5,10],t:[0,1,0],o:0,l:[0,0,.05]},rooms:{p:[15,9,15],t:[0,1,0],o:0,l:[.1,.25,.1]},room:{p:[10,7.5,10],t:[0,1,0],o:0},device:{o:.22},house:{p:[0,21,13],t:[0,0,0],o:0,l:[.1,.1,.4]},analytics:{p:[1,17,2.5],t:[2,0,0],o:-.2,l:[.1,.1,1]},env:{p:[-9,5,6],t:[0,1.5,0],o:-.2,l:[.1,1,.1]}};
let RT='home',RTt=0,cO=.2,rg=0;const RANGE=[1,7,30,365],cP=new V(13,8.5,13),cT=new V(0,1,0),tmp=new V(),lw=[.15,.35,.25],orb={az:0,el:0,z:1},PR={p:0};S.ceil=1;S.v2=0;
const sd=(b,a,n=48)=>Array.from({length:n},(_,i)=>b+Math.sin(i/4)*a+Math.sin(i*1.9)*a*.3);
S.H={co2:sd(640,60),t:sd(24,.4),h:sd(56,2),pw:sd(480,60)};const DH={};for(const k in DV)DH[k]=sd(k=='sensor'?640:(S.w[k]||50),(S.w[k]||50)*.08,40);
function push(){[['co2',S.co2],['t',S.t],['h',S.h],['pw',tot()]].forEach(([k,v])=>{S.H[k].push(v);S.H[k].shift()});for(const k in DV){DH[k].push(k=='sensor'?S.co2:S.w[k]);DH[k].shift()}}
const spark=(a,h,c)=>{const w=300,mx=Math.max(...a),mn=Math.min(...a),p=a.map((v,i)=>`${(i/(a.length-1)*w).toFixed(1)},${(h-4-(v-mn)/(mx-mn||1)*(h-10)).toFixed(1)}`).join('L');return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path d="M${p}L${w},${h}L0,${h}Z" fill="${c}" opacity=".12"/><path d="M${p}" fill="none" stroke="${c}" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`};
function stack(seed){const C=['#c8ff3d','#ff5a36','#7fd6ff','#ece8dc'],n=25,W=720,H=240,A=[0,1,2,3].map(k=>Array.from({length:n},(_,i)=>Math.max(.12,.5+Math.sin((i+k*4+seed)/3)*.32+(i>16&&i<22&&k<3?.55:0)+Math.sin(i*1.7+k+seed)*.06))),mx=Math.max(...A[0].map((_,i)=>A.reduce((s,a)=>s+a[i],0)));let acc=A[0].map(()=>0);const X=i=>i/(n-1)*W,Y=v=>H-6-v/mx*(H-16);
return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block">`+[0,1,2,3].map(i=>`<line x1="0" x2="${W}" y1="${H-6-i*(H-16)/3}" y2="${H-6-i*(H-16)/3}" stroke="#ece8dc" opacity=".1"/>`).join('')+A.map((s,k)=>{const lo=acc.slice();acc=acc.map((a,i)=>a+s[i]);return `<path d="M${acc.map((v,i)=>X(i)+','+Y(v)).join('L')}L${lo.map((_,i)=>X(n-1-i)+','+Y(lo[n-1-i])).join('L')}Z" fill="${C[k]}" opacity=".78"/>`}).join('')+'</svg>'}
const stk=()=>{const e=$('#stk');if(e)e.innerHTML=stack(rg*3)};



function upd2(){$$('[data-sp]').forEach(e=>{const k=e.dataset.sp;e.innerHTML=spark(k=='dev'?DH[S.sel]:S.H[k],+e.dataset.h||56,k=='co2'?'#7fd6ff':k=='pw'||k=='dev'?'#c8ff3d':'#ece8dc')});
[['co2',400,2000,800,1000],['t',16,32,26,28],['h',20,80,60,70]].forEach(([k,lo,hi,a,b])=>{const v=+F[k](),e=$('#g-'+k),c=v<a?'#c8ff3d':v<b?'#ece8dc':'#ff5a36',q=$('#gs-'+k);if(!e)return;e.setAttribute('stroke-dasharray',cl((v-lo)/(hi-lo))*100+' 100');e.style.stroke=c;q.textContent=v<a?'Good':v<b?'Elevated':'High';q.style.color=c});
$$('[data-m]').forEach(x=>{const d=MAP.find(y=>y.id==x.dataset.m);x.textContent=!d?'':d.meteringMode=='metered'?(LIVE.m?(Date.now()-LIVE.m<30000?'measured':'stale'):'simulated'):d.meteringMode});$$('.chips a').forEach(a=>a.classList.toggle('on',a.dataset.c==S.sel));{const l=$('#dlnk');if(l){l.dataset.nav='/device/'+S.sel;l.href='/device/'+S.sel}}
if($('#occ'))$('#occ').innerHTML=Array.from({length:24},(_,i)=>`<i style="height:${i==23?Math.max(4,S.ppl*12.5):15+((i*37)%60)*.7}%"></i>`).join('')}
const sync=()=>{[['b2',!!S.v2],['b3',!S.v2],['bC',!!S.ceil]].forEach(([i,v])=>{const e=$('#'+i);if(e)e.classList.toggle('on',v)})};
function proc(){if(!$('#pbar'))return;const n=Math.floor(PR.p*5);$('#pbar').style.width=PR.p*100+'%';$$('#stl li').forEach((l,i)=>l.className=PR.p>=1||i<n?'done':i==n?'act':'');$('#pgo').classList.toggle('dis',PR.p<1)}
function populate(){const DLH=Object.entries(DV).map(([k,d])=>`<li><button data-d="${k}"><span>${d.n} <small data-m="${k}" style="color:var(--mut)"></small></span><b data-w="${k}"></b><i><u></u></i></button></li>`).join('');['#dl','#dl2'].forEach(i=>{const e=$(i);if(e)e.innerHTML=DLH});if($('#gz'))$('#gz').innerHTML=[['co2','CO₂','ppm'],['t','Temp','°C'],['h','Humidity','%']].map(([k,n,u])=>`<div class="gz"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" class="gt"/><circle cx="60" cy="60" r="50" class="gv" id="g-${k}" pathLength="100" stroke-dasharray="0 100" transform="rotate(-90 60 60)"/></svg><b data-k="${k}"></b><small>${n} ${u}</small><span class="gs" id="gs-${k}"></span></div>`).join('');if($('#dchips'))$('#dchips').innerHTML=Object.entries(DV).map(([k,d])=>`<a href="/device/${k}" data-nav="/device/${k}" data-c="${k}">${d.n}</a>`).join('');if($('#rg'))$('#rg').innerHTML=[['Living room','28 m²',0],['Bedroom','16 m²',1],['Kitchen','12 m²',2]].map(([n,a,i])=>`<a class="rc" href="/room" data-nav="/room"><img alt="${n} in 3D" src="${TH[i]}" style="filter:${['none','hue-rotate(250deg)','hue-rotate(40deg) saturate(1.4)'][i]}"><div><b>${n}</b><br><small>Floor 1 · ${a}</small></div></a>`).join('')+'<a class="rc add" href="/rooms/import" data-nav="/rooms/import"><div><div style="font-size:34px;color:var(--lime)">+</div>Import a GLB room<br><small>native RoomPlan scan: later phase</small></div></a>';$$('.card:not(.in)').forEach(c=>io.observe(c));sync();$$('.ly button').forEach(x=>x.classList.toggle('on',!!S.l[x.dataset.l]));['ppl','ppl2'].forEach(i=>{const e=$('#'+i);if(e)e.value=S.ppl});['po','po2'].forEach(i=>{const e=$('#'+i);if(e)e.textContent=S.ppl})}
function route(path){const seg=path.split('/').filter(Boolean),h=seg[0]||'home';RT=(VW[h]||h=='home')?h:'home';RTt=last;if(seg[1]&&DV[seg[1]])S.sel=seg[1];orb.az=orb.el=0;orb.z=1;PR.p=0;scrollTo(0,0);tops();populate();stk();upd()}
on(document,'click',e=>{const t=e.target,a=t.closest('[data-go]');if(a){e.preventDefault();const go=()=>document.getElementById(a.dataset.go)?.scrollIntoView({behavior:RM?'auto':'smooth'});if(RT!='home'){nav('/');setTimeout(go,450)}else go();return}
const na=t.closest('a[data-nav]');if(na){e.preventDefault();nav(na.dataset.nav);return}
const d=t.closest('[data-d]');if(d){S.sel=d.dataset.d;upd();return}
const lb=t.closest('.ly button');if(lb){S.l[lb.dataset.l]^=1;$$('.ly button').forEach(x=>x.classList.toggle('on',!!S.l[x.dataset.l]));return}
const id=t.closest('button')?.id;if(id=='b2'){S.v2=1;sync()}else if(id=='b3'){S.v2=0;sync()}else if(id=='bC'){S.ceil^=1;sync()}
const b=t.closest('.tabs b');if(b){[...b.parentNode.children].forEach(c=>c.classList.toggle('on',c==b));if(b.parentNode.id=='rtabs'){rg=[...b.parentNode.children].indexOf(b);stk();upd()}}});
on(document,'input',e=>{const t=e.target;if(t.id=='ppl'||t.id=='ppl2'){S.ppl=+t.value;['ppl','ppl2'].forEach(i=>{const x=$('#'+i);if(x)x.value=S.ppl});['po','po2'].forEach(i=>{const x=$('#'+i);if(x)x.textContent=S.ppl});upd()}});
let dr=null;on(window,'pointerdown',e=>{if(RT=='room'&&e.target===cv&&!hov)dr=[e.clientX,e.clientY]});on(window,'pointerup',()=>dr=null);
on(window,'pointermove',e=>{if(dr){orb.az-=(e.clientX-dr[0])*.006;orb.el=cl(orb.el+(e.clientY-dr[1])*.004,-.15,.4);dr=[e.clientX,e.clientY]}});
on(window,'wheel',e=>{if(RT=='room'&&e.target===cv){e.preventDefault();orb.z=cl(orb.z*(1+e.deltaY*.001),.55,1.7)}},{passive:false});
on(window,'resize',size);size();raf=requestAnimationFrame(frame);

// ---- live backend data (SSE). Measured node data always wins; simulated data only drives the UI if no measured node has ever reported.
const LIVE={m:0,s:0,mo:0,warm:false,err:false}
let MAP=[] // persisted device<->telemetry mappings from /api/rooms/:id/devices
fetch('/api/rooms/room-204/devices').then(r=>r.ok?r.json():null).then(j=>{if(j){MAP=j.devices;upd()}}).catch(()=>{})
const useLocal=()=>!LIVE.m&&Date.now()-LIVE.s>15000
function applyMsg(m){
  const at=Date.parse(m.receivedAt)||0
  if(m.source=='simulated'){if(LIVE.m)return;LIVE.s=Math.max(LIVE.s,at)}else LIVE.m=Math.max(LIVE.m,at)
  const en=m.environment;if(en){if(en.co2Ppm!=null)S.co2=en.co2Ppm;if(en.temperatureC!=null)S.t=en.temperatureC;if(en.humidityPct!=null)S.h=en.humidityPct}
  if(m.energy&&m.energy.powerW!=null){const pd=MAP.find(d=>d.channel=='power'&&(m.source=='simulated'||d.nodeId==m.nodeId));if(pd)S.w[pd.id]=m.energy.powerW} // only mapped devices receive power; AC/TV/lamp stay estimated
  if(m.source!='simulated'){LIVE.warm=!!(m.flags&&m.flags.co2Warmup);if(m.occupancy&&m.occupancy.motion===true)LIVE.mo=Math.max(LIVE.mo,at)}
  upd()
}
function badge(){const el=$('#lv');if(!el)return;const now=Date.now();let st,tx
  if(LIVE.m){const a=(now-LIVE.m)/1000;st=freshness(a,'environment');tx=st=='live'?`Live · measured · ${a|0}s ago${LIVE.warm?' · CO₂ calibrating':''} · ${occupancyState(LIVE.mo,now,300)}`:st=='stale'?`Stale · sensor last seen ${a|0}s ago`:`Offline · last seen ${a>3600?'over 1 h':Math.round(a/60)+' min'} ago`}
  else if(now-LIVE.s<=30000){st='sim';tx='Simulated · server simulator, not hardware'}
  else{st='local';tx=LIVE.err?'Local simulation · backend unavailable or signed out':'Connecting…'}
  document.body.dataset.live=st;el.textContent='● '+tx}
{const es=new EventSource('/api/stream');es.addEventListener('telemetry',ev=>{try{applyMsg(JSON.parse(ev.data))}catch{}});es.onopen=()=>{LIVE.err=false};es.onerror=()=>{LIVE.err=true;es.close()};cleanup.push(()=>es.close())}

return{route,dispose(){cancelAnimationFrame(raf);cleanup.forEach(f=>f());R.dispose()}}
}
