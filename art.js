/* Independently drawn pixel art for the ZeldaBonk fan game. No extracted game assets. */
(function () {
  'use strict';
  const canvases = new Map(), textures = new Map(), materials = new Map();
  function surface(w, h) { const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; return canvas; }
  function rect(ctx, color, x, y, w, h) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function oval(ctx, color, x, y, rx, ry) {
    x=Math.round(x);y=Math.round(y);rx=Math.max(1,Math.round(rx));ry=Math.max(1,Math.round(ry));
    ctx.fillStyle = color;
    for (let row = -ry; row <= ry; row++) {
      const half = Math.floor(rx * Math.sqrt(Math.max(0, 1 - row * row / (ry * ry))));
      ctx.fillRect(x - half, y + row, half * 2 + 1, 1);
    }
  }
  function polygon(ctx, color, points) {
    ctx.fillStyle = color;
    const min = Math.min(...points.map(p => p[1])), max = Math.max(...points.map(p => p[1]));
    for (let y = min; y <= max; y++) {
      const hits = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) hits.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      hits.sort((a, b) => a - b);
      for (let i = 0; i + 1 < hits.length; i += 2) ctx.fillRect(Math.ceil(hits[i]), y, Math.floor(hits[i + 1]) - Math.ceil(hits[i]) + 1, 1);
    }
  }
  function outline(canvas) {
    const out = surface(canvas.width, canvas.height), ctx = out.getContext('2d');
    const source=canvas.getContext('2d');
    const src = source.getImageData(0, 0, canvas.width, canvas.height), data = ctx.createImageData(canvas.width, canvas.height);
    // Snap transformed silhouettes to opaque source pixels before outlining or caching them.
    for(let at=3;at<src.data.length;at+=4)src.data[at]=src.data[at]>=128?255:0;
    source.save();source.setTransform(1,0,0,1,0,0);source.putImageData(src,0,0);source.restore();
    for (let y = 1; y < canvas.height - 1; y++) for (let x = 1; x < canvas.width - 1; x++) {
      const at = (y * canvas.width + x) * 4;
      if (!src.data[at + 3] && [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => src.data[((y+dy)*canvas.width+x+dx)*4+3])) {
        data.data.set([27, 34, 43, 255], at);
      }
    }
    ctx.putImageData(data, 0, 0); ctx.drawImage(canvas, 0, 0);
    // One-pixel warm light and cool shadow preserve hard clusters without smoothing the art.
    const finished=ctx.getImageData(0,0,out.width,out.height),stride=out.width*4;
    for(let y=1;y<out.height-1;y++)for(let x=1;x<out.width-1;x++){
      const at=(y*out.width+x)*4;if(!src.data[at+3])continue;
      const lit=!src.data[at-stride+3]||!src.data[at-4+3],shade=!src.data[at+stride+3]||!src.data[at+4+3];
      if(!lit&&!shade)continue;const amount=lit?.14:.17,target=lit?[255,235,189]:[28,39,58];
      for(let channel=0;channel<3;channel++)finished.data[at+channel]=Math.round(src.data[at+channel]*(1-amount)+target[channel]*amount);
    }
    ctx.putImageData(finished,0,0);return out;
  }
  const ANIMATIONS={idle:[4,3],walk:[8,10],attack:[6,14],cast:[6,10],ultimate:[8,9],hurt:[2,8],jump:[4,6],glide:[4,4],dash:[4,12],death:[8,8],victory:[6,5],windup:[6,7],spawn:[6,7]};
  function animationFrame(action,age){const[frames,rate]=ANIMATIONS[action]||ANIMATIONS.idle;const frame=Math.floor(Math.max(0,age)*rate);return action==='death'||action==='ultimate'?Math.min(frames-1,frame):frame%frames;}
  function line(c,color,x0,y0,x1,y1,width=1){const steps=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=steps;i++)rect(c,color,Math.round(x0+(x1-x0)*i/Math.max(1,steps)),Math.round(y0+(y1-y0)*i/Math.max(1,steps)),width,width);}
  function poseContext(c,w,h,action,frame){
    if(action==='death'){const amount=frame/7;c.translate(w*.08,h*.34*amount);c.scale(.9,1-amount*.45);}
    else if(action==='hurt')c.translate(frame?1:-1,0);
    else if(action==='idle')c.translate(0,frame===1||frame===2?-1:0);
    else if(action==='walk')c.translate(0,frame%4===1?-1:0);
  }
  // Eight hand-pixelled views. Costumes and gesture timing belong to each hero.
  const HERO_MOTION={
    link:{stride:5,hitch:1,idle:1,bank:.08,attack:13,cast:15},
    zelda:{stride:3,hitch:1,idle:2,bank:.05,attack:10,cast:17},
    midna:{stride:4,hitch:2,idle:3,bank:.16,attack:15,cast:17},
    tetra:{stride:6,hitch:2,idle:1,bank:.13,attack:8,cast:14},
    sheik:{stride:7,hitch:2,idle:1,bank:.16,attack:15,cast:12},
    skullkid:{stride:6,hitch:3,idle:3,bank:.18,attack:12,cast:18},
  };
  function heroPose(id,action,frame){
    const motion=HERO_MOTION[id]||HERO_MOTION.link,frames=(ANIMATIONS[action]||ANIMATIONS.idle)[0];
    const phase=frame/Math.max(1,frames-1),cycle=frame/frames*Math.PI*2,beat=Math.sin(cycle),lag=Math.cos(cycle);
    const glide=action==='glide',jump=action==='jump',dash=action==='dash',walk=action==='walk',idle=action==='idle',hurt=action==='hurt';
    const attack=action==='attack',cast=action==='cast'||action==='ultimate',victory=action==='victory';
    const swing=Math.sin(phase*Math.PI),snap=phase<.4?phase*2.5:(1-phase)/.6;
    const flourish=cast||victory?Math.round(swing*3):0;
    const step=walk?Math.round(beat*motion.stride):dash?Math.round(beat*(motion.stride+3)):jump?Math.round(2+4*swing):glide?Math.round(2+2*beat):0;
    const sway=Math.round(walk?lag*2:dash?-3+lag*2:glide?beat*4:jump?beat*2:lag+(attack?snap*3:0));
    const lift=Math.round(cast?swing*motion.cast:attack?snap*motion.attack:victory?15+beat*4:jump?7+swing*9:0);
    const rise=glide?-Math.round(2+lag*2):jump?-Math.round(swing*3):dash?-1:walk?-Math.round(Math.abs(beat)*motion.hitch):idle?-Math.round((1-lag)*motion.idle/2):0;
    const tilt=glide?beat*motion.bank:jump?-.11+swing*.2:dash?.12+beat*.06+lag*.04:hurt?(frame?-.1:.11):attack?(.4-phase)*.16:victory?lag*.06:0;
    return {phase,beat,lag,swing,snap,glide,jump,dash,walk,idle,hurt,attack,cast,victory,step,sway,lift,rise,tilt,flourish};
  }
  const STARTER_GESTURES={link:'ember',zelda:'leaf',midna:'shadow',tetra:'cutlass',sheik:'kunai',skullkid:'fairy'};
  const ULTIMATE_GESTURES={link:'spin',zelda:'seal',midna:'fused',tetra:'waterGun',sheik:'harp',skullkid:'moonCrash',impa:'waterBlade',saria:'ocarinaSong',darunia:'goronSlam',ruto:'rutoSurge',nabooru:'spiritSage'};
  const WEAPON_GESTURES=new Set([...Object.values(STARTER_GESTURES),...Object.values(ULTIMATE_GESTURES),'sword','giantBlade','slingshot','hammer','rutoWave','axe']);
  // Original pixel props. These share palette and geometry across normal and ultimate poses.
  function ocarina(c,x,y,blue=false){
    const body=blue?'#3b64a9':'#ad7144',light=blue?'#87bced':'#f2bb73';
    polygon(c,body,[[x-7,y+1],[x-4,y-3],[x+5,y-4],[x+8,y-1],[x+5,y+4],[x-5,y+4]]);
    line(c,body,x+2,y,x+8,y-5,3);line(c,light,x-4,y-1,x+4,y-2,1);
    for(const i of [-3,0,3])rect(c,'#312d49',x+i,y+1,1,1);
  }
  function giantBlade(c,x,y,angle,axe=false){
    c.save();c.translate(x,y);c.rotate(angle);c.scale(axe?.86:.83,1);
    line(c,'#66443a',-7,0,0,0,4);line(c,'#d2a36b',-6,-1,0,-1,1);
    if(axe){
      line(c,'#533f43',-12,0,33,0,5);line(c,'#bb8558',-12,-1,31,-1,2);
      polygon(c,'#485364',[[23,-4],[22,-13],[30,-16],[40,-16],[46,-12],[40,-7],[36,-3],[36,3],[40,7],[46,12],[40,16],[29,16],[22,13],[23,4]]);
      polygon(c,'#a1a3a2',[[25,-4],[24,-12],[32,-14],[40,-14],[43,-12],[37,-7],[34,-3],[34,3],[37,7],[43,12],[40,14],[31,14],[24,12],[25,4]]);
      line(c,'#dcd6bb',32,-14,41,-14,2);line(c,'#dcd6bb',31,14,41,14,2);
      line(c,'#873c48',26,-8,33,-6,2);line(c,'#873c48',26,8,33,6,2);
    }else{
      polygon(c,'#506487',[[1,-3],[9,-7],[38,-7],[47,-3],[39,6],[8,6],[2,3]]);
      polygon(c,'#bcced7',[[4,-3],[11,-5],[37,-5],[44,-3],[36,4],[7,4]]);
      line(c,'#f6f4df',9,4,36,4,2);line(c,'#759daf',13,-1,39,-2,1);
      line(c,'#b99160',1,-6,1,6,3);
    }
    c.restore();
  }
  // The five Time-era allies use their own costumes, body proportions, and joint animation.
  const TIME_ALLIES={
    impa:{skin:'#e0aa88',shade:'#a26965',cloth:'#3e5672',dark:'#26324e',light:'#a8c1da',accent:'#bbb6f4',stride:7,hitch:2,height:87,width:29,gesture:'giantBlade'},
    saria:{skin:'#efc392',shade:'#bd855f',cloth:'#59964c',dark:'#225b46',light:'#b5db70',accent:'#cef28b',stride:5,hitch:3,height:68,width:20,gesture:'slingshot'},
    darunia:{skin:'#d49254',shade:'#985a40',cloth:'#ad6948',dark:'#704e41',light:'#eabc84',accent:'#f0b55d',stride:4,hitch:2,height:77,width:48,gesture:'hammer'},
    ruto:{skin:'#8ac5e4',shade:'#527fa8',cloth:'#7ab5d6',dark:'#3c5b8a',light:'#cbe4e3',accent:'#8eeaf4',stride:5,hitch:2,height:80,width:19,gesture:'rutoWave'},
    nabooru:{skin:'#bf7952',shade:'#864438',cloth:'#97465e',dark:'#733854',light:'#e798a5',accent:'#edba6d',stride:6,hitch:2,height:86,width:23,gesture:'axe'},
  };
  for(const gesture of Object.values(TIME_ALLIES).map(d=>d.gesture))WEAPON_GESTURES.add(gesture);
  function timeAlly(id,direction,frame,action,attackKind){
    const canvas=surface(112,112),c=canvas.getContext('2d'),a=TIME_ALLIES[id];
    const dir=(direction%8+8)%8,side=dir>4?8-dir:dir,mirror=dir>4,back=side>=3,profile=side===2,quarter=side%2===1;
    const frames=(ANIMATIONS[action]||ANIMATIONS.idle)[0],p=frame/Math.max(1,frames-1),cycle=frame/frames*Math.PI*2;
    const beat=Math.sin(cycle),lag=Math.cos(cycle),surge=Math.sin(p*Math.PI),release=p<.42?p/.42:Math.max(0,(1-p)/.58);
    const walk=action==='walk',dash=action==='dash',jump=action==='jump',glide=action==='glide',hurt=action==='hurt',death=action==='death',cheer=action==='victory',ult=action==='ultimate';
    const attack=action==='attack'||action==='cast',gesture=ult?ULTIMATE_GESTURES[id]:attack?(attackKind||a.gesture):null;
    const motion=walk||dash, air=jump||glide;
    const stomp=gesture==='goronSlam';
    const gait=motion?Math.round(beat*(a.stride+(dash?3:0))):air?Math.round(2+beat*3):0;
    const bend=stomp?(frame===0?6:frame===7?9:0):action==='idle'?Math.round((1-lag)*.8):0;
    let lift=glide?5+2*lag:jump?6+surge*7:motion?Math.abs(beat)*a.hitch:cheer?surge*4:0;
    if((id==='darunia'&&glide)||death) lift=0;
    const stature=a.height+(glide&&id==='darunia'?-16:0), b=103;
    const bx=(side===0||side===4)?0:3, hx=profile?5:quarter?3:0, topY=b-stature+bend, shoulder=b-stature*.60+(stomp?bend*.70:0), waist=b-stature*.30+(stomp?bend*.45:0);
    const half=a.width*(profile?.35:quarter?.43:.5), shoulderX=bx-half, opposite=bx+half;
    const yL=Math.min(106,b-(air?5:0)-gait), yR=Math.min(106,b-(air?8:0)+gait), xf=profile?5:0;
    const xL=bx-half*.58+xf-gait*.2, xR=bx+half*.59+xf+gait*.22;
    c.translate(56+(hurt?(frame?-3:3):0),-lift);
    if(mirror)c.scale(-1,1);
    if(death){c.translate(-9*p,b-23*p);c.rotate(.8*p);c.scale(1,1-.42*p);c.translate(0,-b);}
    if(glide||dash){c.translate(0,waist);c.rotate(glide?beat*(id==='ruto'?.17:.1):.13+beat*.03);c.translate(0,-waist);}
    const R=(color,x,y,w,h)=>rect(c,color,x,y,w,h), P=(color,points)=>polygon(c,color,points);
    const L=(color,x,y,tx,ty,w=1)=>line(c,color,x,y,tx,ty,w), O=(color,x,y,rx,ry)=>oval(c,color,x,y,rx,ry);
    const gem=(x,y,r,col=a.accent)=>P(col,[[x,y-r],[x+r,y],[x,y+r],[x-r,y]]);
    const spark=(x,y,r,col=a.accent)=>{L(col,x-r,y,x+r,y);L(col,x,y-r,x,y+r);};
    const limb=(color,hint,sx,sy,ex,ey,kx,ky,w)=>{
      L(color,sx,sy,kx,ky,w);L(color,kx,ky,ex,ey,w);
      L(hint,sx,sy,kx,ky,Math.max(1,w-3));L(hint,kx,ky,ex,ey,Math.max(1,w-3));
    };
    const elbow=(sx,sy,x,y)=>[(sx*2+x)/3,(sy+y)*.5+3];
    const arm=(sign,sx,sy,x,y)=>{
      const x0=sign<0?shoulderX:opposite,y0=shoulder,[el,ey]=elbow(sx,sy,x,y);
      const broad=id==='darunia'?15:id==='impa'?8:id==='saria'?5:6;
      const upper=id==='saria'?'#3a7150':a.skin;
      L(id==='saria'?a.dark:a.shade,x0,y0,el,ey,broad);
      L(upper,x0,y0,el,ey,Math.max(2,broad-3));
      L(a.shade,el,ey,x,y,broad);
      L(a.skin,el,ey,x,y,Math.max(2,broad-3));
      const fx=(el+2*x)/3,fy=(ey+2*y)/3;
      if(id==='impa'){
        L('#2c354d',fx-2,fy-2,x-2,y-2,8);
        L('#92a4b8',fx,fy-2,x,y-2,4);
        L('#d3d9d0',fx-1,fy-2,x-1,y-2,1);
      }else if(id==='nabooru'){
        L('#6f433d',fx-1,fy-2,fx-1,fy+2,6);
        L('#efbc61',fx-1,fy-1,fx-1,fy+1,4);
        R('#fff0aa',fx-2,fy-1,2,2);
        if(!back){L('#eab264',x0+sign*2,y0+4,el,ey-4,2);}
      }else if(id==='darunia'){
        L('#5e493c',fx-3,fy-2,fx-3,fy+2,11);
        L('#9d7b55',fx-3,fy-2,fx-3,fy+1,8);
        R('#e0ae6a',fx-2,fy-1,3,2);
        O('#9b5e40',x+2,y+2,8,7);O('#d79654',x+1,y,7,5);
        L('#f6bb76',x-4,y-1,x+4,y-1,2);
      }else if(id==='ruto'){
        P('#467d9e',[[el-2,ey-4],[el+sign*11,ey+1+beat*3],[el+sign*13,ey+8+beat*3],[el+sign*4,ey+5],[el+1,ey+4]]);
        L('#b9e6eb',el,ey-2,el+sign*10,ey+4+beat*3,2);
      }
    };
    const accent=(x,y,i)=>gem(x,y,2+i%2,i%2?'#fff1c1':a.accent);
    let axL=shoulderX-8, axR=opposite+7, ayL=waist+1+gait, ayR=waist+1-gait;
    if(air){axL-=glide?7:2;axR+=glide?7:2;ayL=shoulder+6+beat*2;ayR=shoulder+4-beat*3;}
    if(cheer){axL-=3;ayL=shoulder+3;axR+=6;ayR=shoulder-9-surge*5;}
    if(gesture){
      if(gesture==='giantBlade'||gesture==='waterBlade'){
        const ready=p<.30,cut=p<.67;
        axL=bx+(ready?-11:cut?8:1);ayL=shoulder+(ready?13:cut?-3:8);
        axR=bx+(ready?-10:cut?13:9);ayR=shoulder+(ready?14:cut?-3:7);
      }else if(gesture==='slingshot'){
        axL=bx-15-7*surge;ayL=shoulder-7;axR=bx+18+3*release;ayR=shoulder-8;
      }else if(gesture==='ocarinaSong'){
        axL=hx-5+beat*2;axR=hx+9+beat*2;ayL=topY+20+Math.round(lag*2);ayR=ayL+1;
      }else if(gesture==='rutoWave'||gesture==='rutoSurge'){
        axL=bx-12-11*surge;axR=bx+14+13*surge;ayL=shoulder+(p<.36?8:-10)+beat*3;ayR=ayL-4;
      }else if(gesture==='hammer'){
        const slam=p>.50;
        axL=bx+(slam?3:0)+12*release;axR=bx+(slam?10:5)+12*release;
        ayL=shoulder+(slam?20*surge:-8-2*surge);ayR=ayL-5;
      }else if(stomp){
        const push=frame===1;
        axL=shoulderX-(push?4:8);axR=opposite+(push?5:7);
        ayL=shoulder+(push?-13:19);ayR=shoulder+(push?-16:18);
      }else if(gesture==='spiritSage'){
        axL=bx-9-5*surge;axR=bx+9+5*surge;ayL=shoulder-5-12*surge;ayR=ayL;
      }
    }
    if(stomp&&frame>=2&&frame<=6){
      // Curl in midair. World elevation moves the sprite; local baseline stays under its body.
      const impact=frame===6,yt=impact?31:35,xt=impact?38:35,y=b-yt,theta=(frame-2)*.9+(side%3)*.28;
      O('#714d3e',0,y,xt,yt);O('#b27951',-1,y-1,xt-3,yt-2);
      c.save();c.translate(0,y);c.scale(1,impact?.87:1);c.rotate(theta);
      O('#975e43',0,0,29,29);O('#cd925a',-1,-2,22,22);
      for(let i=0;i<9;i++){
        const t=i*Math.PI*2/9,x=Math.sin(t)*23,yy=Math.cos(t)*23;
        P('#7f513e',[[x-8,yy-1],[x-4,yy-8],[x+4,yy-8],[x+9,yy-3],[x+8,yy+5],[x+1,yy+9],[x-6,yy+6]]);
        P(i%3===0?'#bd8554':'#ad724b',[[x-6,yy],[x-4,yy-6],[x+3,yy-7],[x+7,yy-2],[x+6,yy+4],[x-1,yy+7],[x-5,yy+3]]);
        L('#e7ae71',x-5,yy-3,x+2,yy-6,2);
      }
      // The folded head and white beard keep the boulder legible as Darunia himself.
      P('#814f43',[[-16,-10],[-9,-16],[5,-14],[12,-6],[10,6],[2,13],[-12,11],[-18,4]]);
      P('#db9a5c',[[-13,-9],[-9,-12],[4,-11],[9,-5],[7,6],[1,8],[-11,6],[-15,2]]);
      P('#f0e1c7',[[-14,-10],[-13,-15],[-8,-13],[-6,-19],[-3,-14],[2,-15],[6,-11],[-1,-9],[-9,-9]]);
      P('#e8d3b9',[[-15,1],[-8,5],[-1,4],[9,1],[6,8],[1,11],[-2,9],[-8,12],[-12,9]]);
      L('#6e3f3c',-9,-4,-6,-3,2);L('#6e3f3c',0,-3,4,-4,2);
      P('#a26546',[[10,-8],[20,-7],[21,2],[14,11],[8,8],[11,3]]);
      L('#dab078',12,-7,19,-4,2);L('#684c3e',11,7,15,9,2);
      c.restore();
      if(impact){L('#dfab75',-19,b-5,13,b-4,2);L('#a96d4c',-30,b-8,-23,b-5,2);}
      return outline(canvas);
    }
    if(gesture==='axe'){
      // Nabooru's axe belongs to the Iron Knuckle the witches trap her in.
      const front=profile?7:3, strike=p<.43?-2.45+p*.8:-.95+(p-.43)*2.8;
      const hX=bx+(p<.43?3:7),hY=p<.43?61-18*surge:65+9*surge;
      if(back)giantBlade(c,hX,hY,strike,true);
      for(const [x,y]of [[xL-4,yL],[xR+3,yR]]){
        P('#343947',[[x-7,78],[x+6,78],[x+5,y-7],[x+11,y-3],[x+10,y],[x-7,y]]);
        P('#777f87',[[x-6,80],[x+3,80],[x+3,y-5],[x+8,y-3],[x+7,y-1],[x-5,y-1]]);
        L('#b6b1a6',x-3,83,x-3,y-6,3);L('#945358',x-4,y-5,x+7,y-4,2);
      }
      P('#45404a',[[bx-16,43],[bx+16,44],[bx+21,73],[bx+11,91],[bx-12,91],[bx-20,75]]);
      P('#9d4e4c',[[bx-16,64],[bx+16,65],[bx+18,79],[bx+10,91],[bx-11,90],[bx-18,79]]);
      L('#cd7f66',bx-13,81,bx-9,88,2);L('#cd7f66',bx+14,80,bx+9,88,2);
      P('#8d9297',[[bx-15,45],[bx+15,45],[bx+17,67],[bx+10,76],[bx,80],[bx-12,75],[bx-18,66]]);
      P('#cbc3ad',[[bx-11,46],[bx+10,46],[bx+9,60],[bx,70],[bx-10,61]]);
      L('#754d56',bx-12,61,bx,72,2);L('#754d56',bx,72,bx+13,60,2);
      if(!back){
        gem(bx,56,5,'#ae514f');gem(bx,55,2,'#edd19d');
        for(const x of [bx-13,bx+13]){R('#ded1a4',x,60,2,2);R('#ded1a4',x,66,2,2);}
      }
      for(const x of [bx-18,bx+18]){
        const s=x<bx?-1:1;
        P('#6a5e65',[[x-11,52],[x-9,41],[x+s*12,33],[x+10,46],[x+9,55]]);
        P('#b2acad',[[x-9,49],[x-6,42],[x+s*9,36],[x+8,46],[x+7,51]]);
        L('#dfc9a4',x-7,44,x,41,2);L('#aeb1ac',x,54,hX,hY,7);L('#604451',x,56,hX-2,hY+1,2);
        R('#8e494f',x-4,49,9,3);
      }
      P('#6b4856',[[front-14,40],[front-15,22],[front-20,12],[front-8,16],[front-2,7],[front+3,13],[front+17,12],[front+12,24],[front+14,40],[front+6,49],[front-8,47]]);
      P('#a6a3a0',[[front-12,38],[front-11,22],[front-16,14],[front-7,18],[front-1,10],[front+3,16],[front+14,14],[front+10,23],[front+11,39],[front+4,46],[front-8,43]]);
      P('#d4c6aa',[[front-10,27],[front-7,21],[front-2,13],[front+3,20],[front+9,23],[front+6,27],[front,33],[front-6,27]]);
      if(!back){
        P('#343340',[[front-10,28],[front-3,29],[front,32],[front+3,28],[front+9,27],[front+6,33],[front+2,34],[front,39],[front-3,34],[front-8,33]]);
        R('#f5af78',front-7,30,3,1);R('#f5af78',front+4,29,3,1);
        L('#714452',front,36,front,44,2);
      }else L('#85515b',front-8,23,front+8,24,3);
      if(!back)giantBlade(c,hX,hY,strike,true);
      R('#a6a1aa',hX-3,hY-3,6,6);R('#c6bdb0',hX-2,hY-3,4,2);
      return outline(canvas);
    }
    if(id==='impa'){
      // The short white topknot and back scabbard are separate silhouettes.
      const flow=(glide?7:motion?3:0)+beat*2;
      if(!gesture||back){
        P('#292735',[[bx+7,shoulder-15],[bx+11,shoulder-13],[bx-14,waist+16],[bx-18,waist+16],[bx-17,waist+11]]);
        L('#796b60',bx+9,shoulder-11,bx-14,waist+14,2);
        L('#d6b88c',bx+6,shoulder-8,bx+12,shoulder-4,2);
      }
      P('#7c859e',[[hx-1,topY+4],[hx-5-flow,topY+15],[hx-10-flow,topY+23],[hx-12-flow,topY+19],[hx-8-flow,topY+5]]);
      L('#dcdad5',hx-3,topY+5,hx-10-flow,topY+18,3);
    }else if(id==='nabooru'){
      const flow=(glide?14:motion?8:3)+lag*3, root=hx-3, ty=topY+4;
      P('#702733',[[root+3,ty-8],[root-3,ty-11],[root-10,ty-8],[root-14,ty+5],[root-11-flow,shoulder+13],[root-24-flow,shoulder+31],[root-14-flow,shoulder+28],[root-4-flow,shoulder+20],[root-1-flow,shoulder+11],[root-3,ty+1]]);
      P('#af3938',[[root,ty-7],[root-7,ty-8],[root-12,ty+6],[root-9-flow,shoulder+14],[root-20-flow,shoulder+28],[root-12-flow,shoulder+25],[root-4-flow,shoulder+13],[root-4,ty-1]]);
      L('#e26044',root-6,ty-5,root-10,ty+7,3);L('#e26044',root-10,ty+7,root-7-flow,shoulder+15,2);
      L('#f4bf64',root-1,ty-8,root+4,ty-5,3);
    }else if(id==='ruto'){
      // Adult Ruto's long head-fin sweeps down behind the purple-blue crown.
      const f=glide?12:2,wave=beat*(motion||air?5:2),x=hx-2,y=topY+12;
      P('#46588e',[[x+1,y-10],[x-11,y-6],[x-13,y+6],[x-7,y+17],[x-12+wave-f,shoulder+17],[x-6+wave-f,shoulder+23],[x+3+wave,shoulder+17],[x+6,y+12]]);
      P('#79b4d1',[[x-4,y-5],[x-10,y+1],[x-7,y+12],[x-3,y+17],[x-8+wave-f,shoulder+20],[x+1+wave,shoulder+13],[x+2,y+9]]);
      L('#b0dbe6',x-8,y+2,x-4,y+14,2);
    }
    if(id==='darunia'){
      // Goron mass is round and low, with separate rock plates and a white beard.
      const stomp=Math.round(Math.abs(gait)*.35), mass=glide?27:31;
      O('#82513c',bx,waist-3, mass,mass*.80);
      if(!glide){
        for(const [x,y] of [[xL-5,yL-stomp],[xR+6,yR]]){
          O('#805441',x,y-6,12,7);O('#44393b',x,y-12,10,5);O('#d39156',x,y-7,10,5);
          for(let i=0;i<3;i++)R('#f0bc80',x-6+i*5,y-5,3,3);
        }
      }
      O('#b8774d',bx,waist-5,mass-3,mass*.73);
      if(!back){
        O('#e5a868',bx+1,waist-4,mass*.70,mass*.57);O('#f6c98d',bx+2,waist-6,mass*.53,mass*.44);
        L('#bb7c4b',bx-4,waist+6,bx+3,waist+8,2);
        L('#edb57a',bx-19,waist-8,bx-16,waist-15,2);
      }else{
        for(const [x,y]of [[-18,-9],[-5,-17],[10,-13],[16,0],[-14,3],[-2,4],[9,12]]){
          const xx=bx+x,yy=waist+y;
          P('#774939',[[xx-7,yy+2],[xx-4,yy-5],[xx+4,yy-6],[xx+7,yy],[xx+4,yy+6],[xx-5,yy+6]]);
          P('#be895e',[[xx-6,yy],[xx-3,yy-5],[xx+3,yy-5],[xx+6,yy-1],[xx+2,yy+2],[xx-4,yy+3]]);
          L('#e4ac72',xx-3,yy-4,xx+2,yy-5,2);
        }
      }
      arm(-1,bx-18,shoulder,axL,ayL);arm(1,bx+19,shoulder,axR,ayR);
      for(const [x,y] of [[shoulderX-2,shoulder+6],[opposite,shoulder+7]]){
        P('#9b6649',[[x-9,y-4],[x-3,y-10],[x+7,y-9],[x+11,y-3],[x+7,y+8],[x-7,y+8]]);
        L('#efb57b',x-8,y-4,x+6,y-8,2);L('#c4895f',x-5,y+4,x+6,y+4,2);
        if(x>bx&&!back){L('#813e3c',x-3,y,x+5,y,2);L('#813e3c',x+1,y-3,x+1,y+3,2);}
      }
      const head=topY+13, face=hx+(profile?5:0);
      O('#945140',hx,head,16,16);O('#d48850',hx+1,head-1,14,13);
      P('#a88e83',[[hx-15,head-1],[hx-17,head-14],[hx-10,head-10],[hx-9,head-19],[hx-3,head-14],[hx+1,head-23],[hx+5,head-16],[hx+12,head-19],[hx+16,head-7],[hx+10,head-3]]);
      P('#eee3cd',[[hx-15,head-13],[hx-9,head-9],[hx-8,head-17],[hx-2,head-12],[hx+1,head-21],[hx+5,head-14],[hx+11,head-17],[hx+14,head-9],[hx+4,head-9],[hx-8,head-7]]);
      if(!back){
        if(!profile){L('#f3e3cb',face-12,head-5,face-5,head-2,3);R('#65343b',face-9,head-1,4,2);}
        L('#f4e6cc',face+1,head-2,face+8,head-5,3);R('#67373b',face+3,head-1,4,2);
        O('#ad6547',face+1,head+4,7,4);O('#f1a769',face,head+3,6,3);
        P('#a39381',[[hx-15,head+5],[hx-8,head+8],[hx+1,head+7],[hx+15,head+4],[hx+13,head+15],[hx+6,head+21],[hx+1,head+18],[hx-7,head+22],[hx-14,head+13]]);
        P('#f0e3ca',[[hx-14,head+6],[hx-7,head+9],[hx+1,head+8],[hx+13,head+5],[hx+10,head+13],[hx+5,head+17],[hx+1,head+14],[hx-6,head+18],[hx-12,head+12]]);
        L('#9d8379',hx-5,head+11,hx+5,head+10,2);
      }else{
        P('#decfb7',[[hx-12,head-8],[hx+13,head-8],[hx+14,head+2],[hx+6,head+9],[hx+2,head+4],[hx-4,head+12],[hx-10,head+5]]);
        L('#b5a392',hx-5,head-7,hx-4,head+8,2);
      }
    }else{
      // Animate each costume around the shared walk cycle rather than reskinning a uniform.
      const pelvis=waist-2;
      for(const [x,y,sgn]of [[xL,yL,-1],[xR,yR,1]]){
        const root=bx+sgn*half*.62, kx=x-sgn*(glide?5:0)+(profile?2:0), ky=(pelvis+y)*.5;
        if(id==='nabooru'){
          P('#82415b',[[root-7,pelvis],[root+8,pelvis],[kx+9,ky-2],[x+5,y-11],[x+3,y-8],[x-5,y-9],[kx-9,ky+3]]);
          P('#ce7f99',[[root-5,pelvis+2],[root+6,pelvis+2],[kx+7,ky],[x+3,y-10],[x-3,y-10],[kx-7,ky+2]]);
          P('#efb6bb',[[root-3,pelvis+3],[root+3,pelvis+4],[kx+2,ky+4],[x,y-12],[kx-5,ky-1]]);
          for(let j=0;j<3;j++)gem(kx-3+j*3,ky+3+j,1,'#f3d8c0');
          L('#af7455',x-4,y-10,x+3,y-10,2);L('#edbb67',x-4,y-9,x+3,y-9,1);
          P('#723444',[[x-4,y-8],[x+3,y-8],[x+3,y-4],[x+10,y-5],[x+7,y],[x-5,y]]);
          L('#df8d6a',x+1,y-4,x+8,y-4,1);
        }else if(id==='ruto'){
          limb('#527fa8','#89c4de',root,pelvis,x,y-5,kx,ky,8);
          P('#4b83ac',[[kx-2,ky],[kx+sgn*5,ky+2],[kx+sgn*9,ky+11],[x+2,ky+7],[x-3,ky+4]]);
          L('#b8deeb',kx,ky+1,kx+sgn*7,ky+9,2);
          P('#5186a7',[[x-4,y-8],[x+3,y-8],[x+4,y-5],[x+8,y-1],[x+4,y+1],[x-4,y]]);
          L('#a6d7df',x-3,y-5,x+4,y-1,2);
        }else if(id==='saria'){
          limb('#a06852',a.skin,root,waist+4,x,y-6,kx,ky,6);
          L('#204e42',root,waist+4,kx,ky-5,8);
          L('#417751',root,waist+4,kx,ky-8,6);
          P('#513f32',[[x-5,y-12],[x+4,y-12],[x+4,y-6],[x+8,y-3],[x+7,y],[x-6,y]]);
          P('#8c6042',[[x-4,y-10],[x+2,y-10],[x+3,y-4],[x+6,y-2],[x-4,y-2]]);
          L('#bc8d5b',x-4,y-11,x+3,y-11,2);
        }else{
          limb('#7d5355',a.skin,root,pelvis,x,y-5,kx,ky,8);
          L('#242d46',root-1,pelvis,kx-1,ky-5,9);L('#485671',root,pelvis,kx,ky-6,6);
          P('#283048',[[kx-5,ky],[kx+4,ky-1],[x+3,y-5],[x+7,y-4],[x+8,y],[x-5,y],[x-5,y-6]]);
          P('#697d96',[[kx-3,ky],[kx+2,ky],[x+2,y-5],[x+6,y-4],[x+5,y-2],[x-3,y-2]]);
          L('#b5c5c8',kx-3,ky,x-2,y-6,2);L('#a8b7bc',x-2,y-4,x+4,y-4);
        }
      }
      arm(-1,shoulderX,shoulder,axL,ayL);arm(1,opposite,shoulder,axR,ayR);
      const chest=shoulder-1;
      for(const [x,y]of [[axL,ayL],[axR,ayR]])R(id==='ruto'?'#a8d7e3':id==='impa'?'#4a4756':a.skin,x-1,y-1,4,4);
      const ears=(x,y,wide=11)=>{
        const ear='#c99578';
        if(!profile)P(a.shade,[[x-wide+1,y+1],[x-wide-6,y-4],[x-wide-4,y+3],[x-wide+2,y+7]]);
        P(ear,[[x+wide-2,y+1],[x+wide+6,y-4],[x+wide+4,y+3],[x+wide-1,y+7]]);
        L(a.skin,x+wide-1,y+3,x+wide+4,y-2,2);
      };
      if(id==='impa'){
        const y=topY+17, apex=profile?6:0;
        P('#252e44',[[shoulderX-3,chest],[opposite+4,chest],[opposite+1,chest+8],[bx+6,waist-3],[bx+13,waist+1],[bx+10,waist+7],[bx-12,waist+7],[bx-10,waist],[bx-7,waist-3],[shoulderX,chest+6]]);
        P('#496482',[[shoulderX,chest+1],[opposite+2,chest+2],[bx+6,waist-1],[bx+7,waist+3],[bx-7,waist+3],[bx-6,waist-1]]);
        for(const [x,s] of [[shoulderX,-1],[opposite,1]]){
          P('#465a76',[[x-s*6,chest],[x+s*3,chest-2],[x+s*6,chest+3],[x+s*5,chest+7],[x-s*4,chest+6]]);
          L('#95b1cb',x-s*3,chest+1,x+s*3,chest+1,2);
        }
        L('#212b3c',bx-10,waist+1,bx+9,waist+1,3);R('#bcaa88',bx-2,waist,5,3);
        if(!back){
          const x=bx+(profile?3:0),yy=chest+4;
          P('#869eb5',[[x-11,yy-4],[x+11,yy-4],[x+9,yy+6],[x+2,yy+13],[x-6,yy+10],[x-10,yy+4]]);
          P('#bfd2d7',[[x-8,yy-3],[x+9,yy-3],[x+6,yy+5],[x+1,yy+10],[x-6,yy+7]]);
          P('#743c50',[[x-6,yy+2],[x-2,yy-1],[x+3,yy-1],[x+6,yy+2],[x+3,yy+5],[x-3,yy+5]]);
          R('#d9c2ad',x-3,yy+1,7,2);R('#743c50',x,yy+1,2,2);
          for(const u of [-3,0,3])R('#743c50',x+u,yy-3,1,2);
          R('#743c50',x,yy+5,1,3);
        }else{
          L('#b3bbbe',bx+9,chest+3,bx-8,waist+2,3);L('#6b523f',bx+9,chest+5,bx-8,waist+4,2);
        }
        R(a.shade,hx-4,y+8,8,7);if(!back)R(a.skin,hx-1,y+9,5,5);
        O('#8994a8',hx-3,y-12,6,8);O('#d4dce0',hx-3,y-14,4,6);
        R('#4d4a64',hx-7,y-8,9,2);
        ears(hx,y+2,9);
        O(a.shade,hx,y+1,10,12);if(!back)O(a.skin,hx+1,y+1,9,10);
        P('#acb1bd',[[hx-11,y+5],[hx-12,y-5],[hx-6,y-10],[hx+5,y-10],[hx+10,y-5],[hx+10,y+1],[hx+5,y-4],[hx+1,y-2],[hx-4,y+2],[hx-8,y+9]]);
        P('#eeeae0',[[hx-11,y-3],[hx-5,y-8],[hx+6,y-8],[hx+9,y-4],[hx+4,y-5],[hx-2,y-3],[hx-7,y+3],[hx-9,y+5]]);
        L('#cfd5d8',hx-10,y-3,hx-5,y-6,2);
        if(!back){
          for(const i of (profile?[5]:[-5,4])){
            L('#f7eddb',hx+i-2,y+2,hx+i+2,y+2,2);R('#993d55',hx+i,y+2,2,2);
            L('#f6e9d6',hx+i+(i>0?2:-1),y+6,hx+i+(i>0?3:-2),y+8);
          }
          R('#ae7168',hx+apex,y+6,2,1);R('#724857',hx+apex-1,y+9,3,1);
        }else{
          P('#c4c8d2',[[hx-10,y-3],[hx+9,y-3],[hx+9,y+5],[hx+3,y+11],[hx-6,y+10],[hx-9,y+6]]);
          L('#e9e9df',hx-6,y-5,hx-7,y+6,2);
        }
      }else if(id==='saria'){
        const y=topY+12, fringe=glide?Math.round(beat*3):0;
        P('#24573e',[[shoulderX-1,chest],[opposite+2,chest],[bx+7,waist-1],[bx+13,waist+8],[bx-13,waist+8],[bx-7,waist-1]]);
        P('#5ca04a',[[shoulderX+1,chest+1],[opposite-1,chest+1],[bx+5,waist-1],[bx+11,waist+6],[bx-10,waist+6]]);
        P('#87bd54',[[shoulderX+3,chest+2],[bx+7,chest+2],[bx+2,waist],[bx-7,waist+5],[bx-5,waist-4]]);
        if(!back){
          L('#d1e496',bx-6,chest+2,bx,chest+7,2);L('#d1e496',bx,chest+7,bx+6,chest+2,2);
        }else L('#abc874',bx-4,chest+4,bx+4,chest+4,2);
        L('#705741',bx-8,waist,bx+7,waist,3);L('#ba925c',bx-8,waist,bx+7,waist);
        if(!back){R('#e0bf74',bx-2,waist-1,5,4);R('#665946',bx,waist,2,2);}
        R(a.shade,hx-3,y+8,7,7);
        P('#245b45',[[hx-14,y-3],[hx-10,y-10],[hx-3,y-13],[hx+7,y-12],[hx+13,y-7],[hx+13,y+1],[hx+12+fringe,y+10],[hx+7+fringe,y+12],[hx-8+fringe,y+12],[hx-14+fringe,y+8]]);
        if(!back){ears(hx,y+2,10);O(a.shade,hx+1,y+3,10,11);O(a.skin,hx+2,y+2,9,10);}
        P('#438b48',[[hx-13,y-3],[hx-10,y-9],[hx-3,y-12],[hx+6,y-11],[hx+12,y-6],[hx+12,y],[hx+6,y-2],[hx+1,y+2],[hx-4,y],[hx-7,y+5],[hx-10+fringe,y+9],[hx-13+fringe,y+7]]);
        if(back)P('#4d954c',[[hx-12,y-1],[hx+11,y-2],[hx+11,y+7],[hx+7,y+10],[hx-8,y+10],[hx-12,y+7]]);
        P('#75ba60',[[hx-11,y-5],[hx-8,y-9],[hx-2,y-11],[hx+5,y-10],[hx+10,y-7],[hx+4,y-8],[hx-5,y-7],[hx-9,y-3]]);
        L('#254d45',hx-12,y-4,hx-5,y-7,2);L('#254d45',hx-5,y-7,hx+10,y-6,2);
        L('#487369',hx-5,y-7,hx+9,y-6);
        if(!back){
          for(const i of (profile?[6]:[-4,5])){
            R('#fff2d2',hx+i-1,y+3,4,3);R('#39748e',hx+i+1,y+3,2,3);R('#283d54',hx+i+2,y+4,1,2);
          }
          R('#d29174',hx+(profile?8:1),y+6,2,1);R('#9e6757',hx+(profile?6:0),y+9,4,1);
        }else{L('#70ae5d',hx-8,y+1,hx-7,y+7,2);L('#357347',hx+5,y+1,hx+3,y+8,2);}
      }else if(id==='ruto'){
        const y=topY+16, fan=glide?Math.round(4+beat*3):Math.round(beat*2), spread=profile?16:21;
        P('#486d9d',[[shoulderX-2,chest],[bx-4,chest-4],[bx+5,chest-4],[opposite+2,chest],[bx+6,chest+10],[bx+5,waist-6],[bx+9,waist+3],[bx+6,waist+9],[bx-7,waist+9],[bx-10,waist+3],[bx-5,waist-6],[bx-6,chest+10]]);
        P('#7eb9d7',[[shoulderX,chest],[bx-3,chest-3],[bx+5,chest-3],[opposite,chest+1],[bx+4,chest+11],[bx+4,waist-5],[bx+7,waist+4],[bx-6,waist+6],[bx-8,waist+3],[bx-3,waist-6],[bx-5,chest+10]]);
        if(!back){
          P('#e1e8dc',[[bx-4,chest+2],[bx+6,chest+2],[bx+5,chest+9],[bx+3,waist-4],[bx+5,waist+2],[bx-5,waist+3],[bx-4,waist-5],[bx-5,chest+8]]);
          L('#e6dcbe',bx-4,chest+8,bx-3,waist-2,2);
        }else L('#b0d4e4',bx,chest+3,bx-1,waist+2,2);
        R(a.shade,hx-3,y+10,7,6);
        P('#4d699a',[[hx-9,y-9],[hx-3,y-15],[hx+4,y-16],[hx+11,y-11],[hx+spread,y+1+fan],[hx+15,y+9],[hx+7,y+9],[hx+3,y+13],[hx-9,y+10],[hx-spread,y+4-fan],[hx-16,y-3]]);
        P('#7eaccc',[[hx-11,y-7],[hx-4,y-13],[hx+4,y-14],[hx+11,y-9],[hx+spread-1,y+1+fan],[hx+13,y+7],[hx+6,y+7],[hx-5,y+8],[hx-spread+2,y+4-fan],[hx-15,y-2]]);
        P('#a8d5e5',[[hx-13,y-4],[hx-6,y-10],[hx+2,y-12],[hx+9,y-9],[hx+16,y-1],[hx+7,y-4],[hx+1,y-3],[hx-5,y-4],[hx-spread+4,y+3-fan]]);
        P('#7e81ac',[[hx-6,y-10],[hx+2,y-14],[hx+7,y-11],[hx+4,y-2],[hx,y-1],[hx-1,y-4]]);
        if(!back){
          P('#bce0e6',[[hx-9,y],[hx-4,y-4],[hx+2,y-2],[hx+8,y-4],[hx+13,y+2],[hx+9,y+8],[hx+5,y+12],[hx-3,y+12],[hx-8,y+7]]);
          for(const i of (profile?[8]:[-5,7])){
            L('#745483',hx+i-3,y+1,hx+i+2,y+2,2);R('#f9e5ee',hx+i-2,y+2,4,2);R('#b75d89',hx+i,y+2,2,3);
          }
          R('#6b9db8',hx+2,y+6,3,1);L('#765e8c',hx+1,y+9,hx+6,y+9);
          gem(hx+13,y+8,2,'#9c78bb');if(!profile)gem(hx-13,y+8,2,'#9c78bb');
        }else{
          L('#8fa8ca',hx+1,y-11,hx+1,y+6,2);
          L('#b6d7e0',hx-9,y-4,hx-14,y+2,2);L('#b6d7e0',hx+10,y-3,hx+15,y+2,2);
        }
      }else if(id==='nabooru'){
        const y=topY+14, fx=hx+(profile?6:1);
        P(a.shade,[[shoulderX-1,chest],[bx-4,chest-4],[bx+5,chest-4],[opposite+1,chest],[opposite-1,chest+7],[bx+6,waist-5],[bx+11,waist+1],[bx+7,waist+6],[bx-9,waist+6],[bx-12,waist+1],[bx-6,waist-6],[shoulderX,chest+6]]);
        P(a.skin,[[shoulderX+1,chest],[bx-4,chest-3],[bx+4,chest-3],[opposite,chest],[bx+7,chest+9],[bx+5,waist-5],[bx+10,waist],[bx-9,waist+1],[bx-4,waist-7]]);
        P('#703953',[[shoulderX+1,chest+5],[bx-3,chest+6],[bx+2,chest+5],[opposite-1,chest+4],[bx+7,chest+12],[bx-8,chest+12]]);
        L('#dc91a2',bx-8,chest+6,bx+8,chest+6,2);L('#ad6b87',bx-7,chest+11,bx+6,chest+11,2);
        for(const dx of [-5,0,5])gem(bx+dx,chest+9,2,dx===0?'#78c4bf':'#e9ae89');
        L('#e8b86d',bx-5,chest+1,bx+5,chest+1,2);
        P('#71394e',[[bx-11,waist-2],[bx+11,waist-2],[bx+8,waist+5],[bx,waist+9],[bx-9,waist+5]]);
        L('#edb975',bx-10,waist-2,bx+10,waist-2,2);gem(bx,waist+1,3,'#77bfb5');
        R(a.shade,hx-3,y+10,8,9);if(!back)R(a.skin,hx-1,y+10,5,8);
        O('#762d38',hx-1,y-1,12,13); if(!back){O(a.shade,hx+1,y+3,10,11);O(a.skin,hx+2,y+3,9,10);}
        P('#b7413d',[[hx-11,y+4],[hx-12,y-4],[hx-8,y-9],[hx,y-13],[hx+8,y-10],[hx+12,y-4],[hx+9,y],[hx+5,y-6],[hx-2,y-4],[hx-6,y],[hx-8,y+8]]);
        L('#ee7850',hx-9,y-5,hx-3,y-9,2);L('#e06749',hx-3,y-9,hx+6,y-9,2);
        if(!back){
          L('#dfa65e',hx-9,y-1,hx,y-4,2);L('#e9b669',hx,y-4,hx+9,y-1,2);
          gem(fx,y-3,4,'#ca9556');gem(fx,y-3,2,'#68bfc0');
          for(const i of (profile?[6]:[-3,5])){
            L('#663337',hx+i-2,y+2,hx+i+2,y+1,2);R('#f8e0ba',hx+i-1,y+3,4,2);R('#ad772f',hx+i+1,y+3,2,3);
          }
          P('#a95740',[[fx,y+4],[fx+4,y+7],[fx+1,y+8],[fx-1,y+7]]);
          L('#814054',fx-2,y+10,fx+4,y+9,2);
          O('#ac764c',hx+10,y+9,3,5);O('#eec274',hx+10,y+9,2,4);O('#975040',hx+10,y+9,1,2);
          if(!profile){O('#efbd67',hx-8,y+9,2,4);O('#995547',hx-8,y+9,1,2);}
        }else{
          O('#af423e',hx-1,y,10,11);L('#dd6745',hx-7,y+1,hx-5,y+9,2);
          L('#f0b968',hx-7,y-8,hx+3,y-11,2);L('#ca8a55',hx-8,y+10,hx+7,y+11,2);
        }
      }
    }
    if(gesture==='giantBlade'||gesture==='waterBlade'){
      const angle=p<.30?2.72:p<.67?-.65+(p-.30)*1.8:-.24;
      giantBlade(c,axR,ayR,angle);
      if(gesture==='waterBlade'&&p>.25&&p<.79){
        const length=18+Math.round(surge*15),x=axR+3,y=ayR-10;
        P('#4d9dbb',[[x,y+4],[x+8,y-3],[x+length,y-7],[x+length-6,y],[x+8,y+6]]);
        L('#b8eff0',x+5,y+2,x+length-3,y-6,2);
      }
    }else if(gesture==='slingshot'){
      const y=ayR, x=axR+2, pull=p<.63?axL:x-5;
      L('#976440',x-4,y+8,x,y,3);L('#dcaa65',x,y,x+4,y-7,2);L('#b57d52',x,y,x+9,y,2);
      L('#e7c7a2',x+4,y-7,pull,y-3);L('#e7c7a2',pull,y-3,x+9,y);
      if(p<.63)O('#c7bac1',pull,y-3,2,2);
    }else if(gesture==='ocarinaSong'){
      ocarina(c,hx+4+beat*2,ayR-4);
      const nY=topY+9-5*surge,nX=hx+24+lag*2;
      L('#cfed8c',nX,nY,nX,nY-7);L('#cfed8c',nX,nY-7,nX+5,nY-5);O('#e7f2b3',nX-2,nY,2,1.6);
    }else if(gesture==='hammer'||(!gesture&&id==='darunia'&&!glide)){
      const x=axR-3,y=ayR-3,angle=!gesture?-1.1:p<.50?-2.5+1.2*release:-.6+1.5*surge;
      c.save();c.translate(x,y);c.rotate(angle);
      // Original pixel drawing of the supplied Megaton Hammer: a steel mallet, not a rectangular stone block.
      P('#1c202b',[[-11,0],[-8,-3],[17,-3],[20,-1],[19,3],[-7,3]]);
      L('#53525a',-7,-2,18,-2,2);L('#aca29a',-8,-2,-5,-2);
      L('#94744c',-4,-2,-4,2,2);
      c.translate(19,0);c.rotate(-.64);
      P('#22222d',[[-10,-4],[-7,-6],[-2,-6],[1,-9],[4,-11],[11,-11],[14,-8],[15,0],[14,8],[11,11],[4,11],[1,9],[-2,6],[-7,6],[-10,4]]);
      P('#36353d',[[-9,-3],[-6,-5],[-1,-5],[2,-7],[6,-9],[10,-9],[11,8],[5,8],[1,7],[-2,5],[-7,4]]);
      P('#171921',[[-8,2],[-3,3],[1,5],[5,7],[10,7],[11,10],[4,10],[1,8],[-2,6],[-7,6]]);
      L('#9b714e',-6,-5,-7,4,2);L('#d3a26d',-6,-4,-7,0);
      L('#a27d56',0,-6,-1,5,2);L('#dbad6e',0,-5,0,2);
      L('#644c39',-3,-5,-4,5);L('#b59265',-3,-3,-4,2);
      P('#6a6872',[[8,-10],[11,-11],[14,-8],[15,-3],[15,4],[13,9],[10,10],[9,5],[9,-5]]);
      P('#aaa5a8',[[10,-9],[12,-9],[14,-5],[14,2],[13,7],[11,8],[11,4],[10,-3]]);
      L('#e3d6c9',11,-9,13,-5);L('#d2c5bd',13,-6,13,1);
      R('#77747c',6,-7,2,2);R('#8e8790',6,4,2,2);R('#766f78',7,-1,1,1);
      P('#4a454d',[[-5,0],[-3,-2],[1,-1],[2,1],[0,4],[-4,3]]);
      L('#79717a',-4,0,0,-1);
      c.restore();
    }else if(gesture==='rutoWave'||gesture==='rutoSurge'){
      const reach=10+surge*(ult?9:7),x=axR+1,y=ayR+4;
      P('#4f9fbb',[[x-5,y+4],[x+2,y-7],[x+reach,y-11],[x+reach+6,y-6],[x+reach-1,y],[x+5,y+5]]);
      L('#c1eced',x+3,y-5,x+reach-1,y-10,2);gem(x+reach+1,y-11,2,'#c3efec');
      O('#4589b2',axL,ayL-1,4,5);L('#a7e8eb',axL-2,ayL+1,axL+2,ayL-4,1);
    }else if(gesture==='spiritSage'){
      const x=bx,y=ayR-9-6*surge,r=3+4*surge;
      O('#d9904e',x,y,r,r);O('#f5ce7f',x,y,r-1,r-1);
      L('#9b5d42',x,y-3,x,y+3);L('#a96546',x-2,y+2,x+2,y+2);
      if(p>.30)for(const sign of [-1,1])spark(x+sign*(r+7),y-3,2,'#f7d995');
    }
    if(glide){
      for(let i=0;i<3;i++){
        const x=-20-i*5-3*lag,y=waist+4+i*3+2*beat;
        if(id==='impa'||id==='nabooru')L(a.accent,x,y,x+5+i,y-2,1);
        else accent(x,y,i);
      }
    }
    return outline(canvas);
  }
  function hero(id,direction,frame,action='idle',attackKind=null){
    if(Object.hasOwn(TIME_ALLIES,id))return timeAlly(id,direction,frame,action,attackKind);
    const canvas=surface(112,112),c=canvas.getContext('2d');
    // Three charge poses, three quick turning poses and two planted recovery poses.
    const turnStep=id==='link'&&action==='ultimate'?[0,0,-1,1,4,7,8,8][frame%8]:0;
    const dir=(((direction+turnStep)%8)+8)%8,mirror=dir>4,view=mirror?8-dir:dir;
    const back=view>=3,profile=view===2,quarter=view===1||view===3;
    const {phase,beat,lag,swing,snap,glide,jump,dash,walk,idle,hurt,attack,cast,victory,step,sway,lift,rise,tilt,flourish}=heroPose(id,action,frame);
    const air=jump||glide,turn=profile?1:quarter?.8:.6;
    const special=action==='ultimate',gesture=attack||cast?(special?ULTIMATE_GESTURES[id]:attackKind||STARTER_GESTURES[id]):null;
    const release=phase<.28?-1:phase<.62?1:0;
    // Readable timing at game scale: crouch on anticipation, stretch on impact, then settle.
    // These are draw-only changes; the hit/projectile still resolves in the game loop.
    const ultimateStaging={
      spin:[0,2,5,2,-2,-1,2,0],seal:[0,1,1,-1,-4,-2,-1,0],
      fused:[0,3,1,-2,-4,-2,1,0],waterGun:[0,1,3,0,3,0,1,0],
      harp:[0,1,1,0,0,-1,0,0],moonCrash:[0,0,-2,-5,-7,-5,-1,0],
    };
    const stage=special?Math.min(frame,7):0;
    const settle=special?(ultimateStaging[gesture]?.[stage]||0):0;
    const lean=special?(gesture==='waterGun'?[0,-.10,-.16,-.02,.17,.07,-.04,0][stage]:
      gesture==='moonCrash'?[0,-.03,-.08,-.07,.04,.13,.03,0][stage]:
      gesture==='spin'?[0,-.08,-.13,.14,.1,.12,-.07,0][stage]:0):0;
    c.translate(16,0);
    if(mirror){c.translate(80,0);c.scale(-1,1);}
    if(id==='midna'||id==='skullkid'){c.translate(40,0);c.scale(profile?.78:quarter?.94:1,1);c.translate(-40,0);}
    if(gesture==='spin'&&stage>=3&&stage<=5){c.translate(40,0);c.scale(.89,1);c.translate(-40,0);}
    const floatKid=id==='skullkid'&&(idle||walk||glide||gesture==='moonCrash');
    c.translate(0,4+(floatKid?-4-Math.round(lag*2):rise)+settle);
    if(action==='death')poseContext(c,80,112,action,frame);
    if(hurt||dash)c.translate(hurt?(frame?3:-3):3,0);
    const floatLean=floatKid?(profile?-.23:quarter?-.15:-.10)+beat*.035:0;
    if(tilt||lean||floatLean){c.translate(40,76);c.rotate((tilt+lean+floatLean)*(back?-.8:1));c.translate(-40,-76);}
    const P=(color,points)=>polygon(c,color,points),R=(color,x,y,w,h)=>rect(c,color,x,y,w,h);
    const L=(color,x,y,xx,yy,width=1)=>line(c,color,x,y,xx,yy,width);
    const O=(color,x,y,rx,ry)=>oval(c,color,x,y,rx,ry);
    const skin=id==='tetra'?'#b97c51':id==='sheik'?'#e2c09a':'#ecc495';
    function limb(color,light,x,y,kx,ky,ex,ey,width=5){L(color,x,y,kx,ky,width);L(color,kx,ky,ex,ey,width);L(light,x,y,kx,ky,Math.max(1,width-3));L(light,kx,ky,ex,ey,Math.max(1,width-3));}
    function triforce(x,y,size,color){P(color,[[x,y],[x-size,y+size*2],[x+size,y+size*2]]);P('#546875',[[x,y+size],[x-size/2,y+size*2],[x+size/2,y+size*2]]);}
    function eye(x,y,color='#497b9a',large=false){R('#fff3db',x,y,large?6:5,large?5:4);R(color,x+2,y,2,large?5:4);R('#263746',x+3,y+1,1,3);R('#fff9dd',x+2,y,1,1);L('#684832',x-1,y-2,x+5,y-1);}
    const fingers=(x,y,color,spread=4)=>{for(let i=-1;i<=1;i++)L(color,x,y,x+i*spread,y-3-Math.abs(i),1);};
    const spark=(x,y,color,size=3)=>{L(color,x-size,y,x+size,y);L(color,x,y-size,x,y+size);};
    const ribbon=(color,shine,points,width=2)=>{
      for(let i=1;i<points.length;i++)L(color,...points[i-1],...points[i],width);
      for(let i=1;i<points.length;i++)L(shine,...points[i-1],...points[i]);
    };
    function shield(x,y){
      P('#617584',[[x-10,y-14],[x,y-18],[x+11,y-14],[x+9,y+6],[x,y+14],[x-9,y+5]]);
      P('#c6d0ce',[[x-8,y-13],[x,y-16],[x+9,y-13],[x+7,y+5],[x,y+11],[x-7,y+4]]);
      P('#304b88',[[x-6,y-11],[x,y-13],[x+7,y-11],[x+5,y+3],[x,y+8],[x-5,y+2]]);
      triforce(x,y-10,2,'#e9c45d');
      L('#c35753',x-5,y-1,x,y+3,2);L('#c35753',x,y+3,x+5,y-1,2);R('#d8715e',x-1,y-1,3,6);
      for(const dx of[-8,8])R('#eef0d6',x+dx,y-10,1,2);
    }
    function sword(x,y,amount,length=31){
      const ux=Math.sin(amount),uy=-Math.cos(amount),dx=Math.round(ux*length),dy=Math.round(uy*length);
      L('#718da6',x,y,x+dx,y+dy,4);L('#dcece4',x,y,x+dx,y+dy,2);
      P('#f4f5d9',[[x+dx+uy*2,y+dy-ux*2],[x+dx+ux*4,y+dy+uy*4],[x+dx-uy*2,y+dy+ux*2]]);
      const gx=Math.round(Math.cos(amount)*8),gy=Math.round(Math.sin(amount)*8);
      L('#66528c',x-gx,y-gy,x+gx,y+gy,3);L('#b1a1cf',x-gx,y-gy,x+gx,y+gy,1);
      L('#615388',x,y+2,x-Math.round(dx*.2),y-Math.round(dy*.2),3);R('#dfbd67',x-1,y+2,3,2);
    }
    function bow(x,y){
      const reach=profile||quarter?1:.56,draw=[1,7,12,15,1,2][frame%6];
      L('#b98443',x,y-15,x+9*reach,y-7,3);L('#f3cf79',x+9*reach,y-7,x+9*reach,y+7,3);
      L('#d8aa60',x+9*reach,y+7,x,y+16,3);L('#fff0b9',x,y-14,x-draw*reach,y);L('#fff0b9',x-draw*reach,y,x,y+14);
      if(frame<4){L('#fff5ce',x-(2+draw)*reach,y,x+17*reach,y,2);P('#f8d890',[[x+14*reach,y-3],[x+21*reach,y],[x+14*reach,y+3]]);}
      if(frame===4)spark(x+14*reach,y,'#fff5ce',3);
    }
    function cutlass(x,y,a){
      c.save();c.translate(x,y);c.rotate(a);
      L('#675240',-5,0,3,0,3);L('#dbb16b',0,-5,0,5,3);
      P('#6a94a6',[[1,-3],[16,-5],[27,-10],[31,-13],[27,-6],[21,-1],[11,3],[1,2]]);
      L('#edf4e0',4,2,14,0,2);L('#edf4e0',14,0,27,-6,2);
      c.restore();
    }
    function waterPistol(x,y){
      P('#63434f',[[x-4,y-5],[x+13,y-5],[x+16,y-3],[x+15,y+2],[x+3,y+3],[x+1,y+9],[x-4,y+8],[x-2,y+2]]);
      R('#344a5a',x-3,y-5,17,6);R('#b8cbd0',x-3,y-5,16,2);
      R('#d8aa6e',x+8,y-5,3,7);R('#96735e',x-3,y+4,5,4);
      if(stage===4){spark(x+17,y-2,'#9deaf3',3);R('#e3f8ec',x+22,y-3,2,2);}
    }
    function harp(x,y){
      const t=Math.round(4*beat);
      const arch=[[x-10,y+7],[x-11,y-1],[x-8,y-9],[x-4,y-12],[x+9,y-7],[x+12,y-2],[x+7,y+5],[x+2,y+10],[x-6,y+11],[x-10,y+7]];
      ribbon('#ae745b','#f4c97c',arch,3);
      for(let i=0;i<4;i++)L('#efe5b4',x-6+i*4,y-9+i,x-7+i*4,y+9-i);
      if(phase>.25&&phase<.85){
        L('#8fdcc7',x+15,y-5+t,x+15,y-13+t);
        L('#c3f1d3',x+15,y-13+t,x+19,y-10+t);O('#c3f1d3',x+13,y-5+t,2,1.5);
      }
    }
    function kunai(x,y){
      L('#a27e61',x-4,y+3,x+4,y-1,3);
      P('#7790b0',[[x+2,y-3],[x+8,y-8],[x+14,y-10],[x+9,y-2],[x+5,y+2]]);
      L('#e6ecdf',x+4,y-2,x+12,y-8,1);
    }
    function horn(x,y){
      L('#a9794c',x-6,y,x+8,y-3,3);L('#f5d58d',x-4,y-1,x+8,y-3,1);
      P('#c99754',[[x+3,y-3],[x+12,y-9],[x+12,y+2],[x+3,y]]);
      L('#f9d68d',x+11,y-8,x+11,y+2,2);
    }
    function fairy(x,y,white=false){
      const dx=Math.round(beat*3),w=2+Math.abs(beat)*4;
      O(white?'#d0dce6':'#9972ba',x+dx-3,y-2,2,w);
      O(white?'#d0dce6':'#9972ba',x+dx+3,y-2,2,w);
      O(white?'#fff3be':'#c99add',x+dx,y,3,3);
      if(frame%2===0)R(white?'#fffdec':'#f2bce9',x+dx-1,y-1,2,2);
    }
    function weapon(x,y){
      if(gesture==='ember'||gesture==='sword'||gesture==='spin'){
        const angle=gesture==='spin'?[-.18,-.84,-1.50,1.45,.72,1.62,.99,.20][stage]:
          (back?[.31,-.44,-.86,.70,1.45,.43]:[.15,-.61,-1.06,1.44,1.86,.51])[frame%6];
        // One brief afterimage stays with the swing; the physical sword remains in Link's hand.
        if(id==='link'&&frame>=3&&frame<=(special?6:4)){
          const arc=(radius,from,to)=>Array.from({length:11},(_,i)=>{
            const theta=from+(to-from)*i/10;return [x+Math.sin(theta)*radius,y-Math.cos(theta)*radius];
          });
          const from=angle-(special?1.48:.86),to=angle+.22;
          c.globalAlpha=.9;
          P(special?'#c79d53':'#53bcae',arc(33,from,to).concat(arc(27,to,from)));
          P(special?'#ffe196':'#c8ffe1',arc(33,from+.19,to-.06).concat(arc(31,to-.06,from+.19)));
          c.globalAlpha=1;
        }
        sword(x,y,angle);
        if(gesture==='spin'&&(stage===1||stage===2)){
          const tx=x+Math.sin(angle)*29,ty=y-Math.cos(angle)*29;
          spark(tx,ty,stage===2?'#fff3b9':'#eab966',stage+1);
        }
      }
      if(gesture==='leaf')bow(x,y);
      if(gesture==='cutlass')cutlass(x,y,[-1.08,-1.83,-2.08,-.7,.42,.05][frame%6]);
      if(gesture==='waterGun')waterPistol(x-2,y);
      if(gesture==='kunai'&&phase<.7)kunai(x,y-1);
      if(gesture==='harp')harp(x-4,y-2);
    }
    if(id==='midna'){
      // Twilight Princess form: the imp becomes the giant, many-armed Fused Shadow.
      if(gesture==='fused'&&phase>.12&&phase<.93){
        const spread=7+Math.round(swing*12), y=54-Math.round(swing*5);
        const strike=stage>=4&&stage<=5;
        for(let i=0;i<10;i++){
          const a=i*Math.PI*.2+stage*.4,x=40+Math.cos(a)*(29+stage*2),yy=60+Math.sin(a)*(24+stage*2);
          R(i%2?'#846ca2':'#86bbab',x,yy,strike?3:2,strike?3:2);
        }
        P('#302b42',[[38,11],[52,13],[62,31],[56,y-6],[57,y+19],[52,82],[58,94],[46,95],[39,87],[26,96],[17,94],[27,82],[22,y+4],[21,y-14],[19,32],[25,19]]);
        for(const side of [-1,1]){
          for(let row=0;row<3;row++){
            const x=40+side*(13-row),yy=y-16+row*13;
            const elbow=x+side*((strike?12:6)+spread/2),end=x+side*((strike?15:5)+spread);
            const ey=yy+(strike?-12:5)+Math.round(Math.sin(phase*Math.PI*4+row)*6)+row*9;
            const ink=row%2?'#4e435f':'#3e354e';
            limb(ink,'#746581',x,yy,elbow,yy-5,end,ey,7);
            L(ink,end,ey,end+side*4,ey-8,3);L(ink,end,ey,end+side*5,ey+3,3);
            L('#8cc0ae',elbow,yy-4,end-side*3,ey,1);
          }
        }
        P('#77786d',[[37,13],[49,16],[54,27],[49,42],[40,43],[33,37],[28,30],[31,19]]);
        P('#99967b',[[37,16],[47,18],[51,26],[46,35],[38,36],[32,29]]);
        P('#423d49',[[42,11],[44,4],[49,6],[54,15],[52,21],[49,17]]);
        L('#e6a86e',36,26,46,25,2);R('#c8645b',41,25,2,2);
        P('#605171',[[34,48],[47,46],[51,61],[46,73],[35,75],[29,65]]);
        ribbon('#77b2a5','#b6e9c4',[[37,49],[44,52],[43,59],[38,63],[43,67],[46,65]],2);
        if(strike){spark(42,26,'#ffd899',5);L('#b2bfab',55,68,68,70,2);L('#b2bfab',25,68,12,70,2);}
        return outline(canvas);
      }
      // Twilight Princess imp: tiny curved body, huge asymmetrical Fused Shadow, exposed right eye.
      const hairSwing=glide?Math.round(8+beat*5):walk?sway*3:cast?Math.round(swing*8):sway;
      if(glide||dash){
        // The imp floats; the trail is drifting Twilight motes, not invented wings or a glider.
        for(let i=0;i<8;i++){
          const x=10+i*8+(frame+i)%5,y=74+i%3*6+Math.round(Math.sin(i+frame*Math.PI*.5)*4);
          const d=2+(i+frame)%3;
          R(i%2?'#735f8e':'#4f6177',x,y,d,d);
          if(i%3===0)R('#8fcac3',x+1,y-1,1,1);
        }
      }
      P('#a9522e',[[43,27],[57,31],[61+hairSwing,52],[57+hairSwing,glide?60:78],[48,glide?70:83],[51,61],[44,43]]);
      P('#e48236',[[48,28],[54,34],[56+hairSwing,55],[51+hairSwing,glide?58:72],[51,50],[46,38]]);
      L('#ffbb59',51,35,54+hairSwing,55,2);
      if(gesture==='shadow'){
        const reach=profile?1:quarter?.86:.5,hx=48+(14+Math.round(swing*11))*reach,hy=46-lift-(back?6:0);
        // Midna's animated hair-hand carries a dark Fused Shadow silhouette and its teal markings.
        limb('#2b203f','#725685',52,51,hx-5,hy+7,hx,hy,8);
        L('#e98b44',52,50,hx-4,hy+5,2);
        P('#352143',[[hx-8,hy+2],[hx-5,hy-8],[hx+3,hy-10],[hx+9,hy-6],[hx+8,hy+4],[hx+2,hy+7]]);
        for(const [dy,len] of [[-8,12],[-4,15],[0,14],[4,11]]){
          L('#33203f',hx+2,hy+dy,hx+len*reach,hy+dy-(dy<0?4:-1),3);
          L('#9acfc7',hx+5,hy+dy,hx+Math.max(6,len*reach-2),hy+dy-(dy<0?2:0));
        }
        R('#b9efe0',hx,hy-3,3,2);
      }
      const tuck=glide?9:jump?Math.round(swing*8):idle?Math.round(2-lag*2):0,legShift=glide?Math.round(-5+lag*3):0;
      const footL=92-step-tuck,footR=92+step-tuck;
      limb('#26383e','#639b99',34,72,30-legShift,83-step-tuck,28+legShift,footL+1,5);
      limb('#26383e','#86c7bd',45,73,48-legShift,83+step-tuck,49+legShift,footR+1,5);
      P('#81cfc4',[[25+legShift,footL],[32+legShift,footL],[34+legShift,footL+4],[23+legShift,footL+4]]);
      P('#93dcd0',[[46+legShift,footR],[51+legShift,footR],[55+legShift,footR+4],[45+legShift,footR+4]]);
      P('#23353d',[[31,54],[46,54],[48,65],[44,76],[35,77],[30,70]]);P('#67beb9',[[31,56],[35,58],[35,67],[41,69],[39,74],[33,72],[30,64]]);
      L('#a8ebe0',33,59,34,65,2);L('#87d9cd',39,73,44,69,2);R('#8cd5ca',42,57,3,5);
      const palmL=[glide?17+sway:23-Math.round(swing*(attack?6:0)),glide?61+beat*4:68-lift],palmR=[glide?62+sway:53+flourish+(gesture==='leaf'?8:0),glide?54-beat*5:66-lift];
      limb('#2d4147','#86cfc7',31,55,palmL[0]+6,60-lift/2,...palmL,4);
      limb('#2d4147','#a2ded1',47,55,palmR[0]-5,57-lift/2,...palmR,4);
      if(glide||victory){fingers(...palmL,'#95dcd1',2);fingers(...palmR,'#9fe7db',2);}
      O('#5e9599',40,44,15,14);P('#9fdfd1',[[36,39],[50,37],[51,48],[44,54],[37,49]]);
      if(!back){O('#edb45c',45,44,5,5);O('#d74f32',47,44,2,4);R('#fff1be',44,41,2,2);L('#324c53',43,40,50,40,2);L('#f1e4bd',40,51,46,50);}
      P('#454f4b',[[19,14],[30,8],[48,10],[55,23],[52,35],[39,39],[33,49],[19,44],[17,30]]);
      P('#90927b',[[21,15],[30,11],[46,12],[51,23],[47,31],[34,34],[29,44],[21,40]]);
      P('#b2ad8b',[[21,15],[29,12],[44,13],[45,18],[29,17],[25,25],[24,38],[20,39]]);
      P('#606f64',[[30,20],[44,20],[47,25],[42,30],[34,29],[34,25],[39,25],[39,23],[30,23],[29,34],[25,36],[26,25]]);
      P('#68766b',[[44,13],[47,5],[55,5],[60,12],[60,22],[55,26],[50,23],[55,20],[55,12],[51,10],[49,17]]);
      L('#c5bf95',48,8,54,7,2);L('#c5bf95',58,12,58,19,2);R('#b6b191',18,31,9,4);R('#5b756d',20,35,5,4);
      if(!back){
        // Fused Shadow's carved eye and layered stone edge, separate from Midna's exposed eye.
        P('#424d48',[[25,29],[33,25],[41,28],[38,32],[31,34],[26,32]]);
        P('#b9b398',[[27,29],[33,27],[39,28],[35,31],[30,32]]);
        R('#646e5f',32,28,3,3);L('#334d4a',20,39,26,41);L('#c5bf95',21,36,25,37);
      }
      if(back){P('#687a70',[[27,17],[40,15],[48,23],[43,34],[29,38],[26,30]]);L('#a6ae8b',31,20,40,20,2);L('#384e4a',32,25,41,25,3);R('#99a888',30,31,9,2);}
      if(gesture!=='shadow')weapon(palmR[0]+2,palmR[1]-4);
    }else if(id==='skullkid'){
      // Majora's Mask sits over the face; the back shows straps and straw hair instead of painted eyes.
      const summoning=gesture==='moonCrash'&&stage>0&&stage<7;
      // Skull Kid levitates while still and travelling. Both knees hang under the body,
      // lagging side-to-side together, instead of making alternating ground contacts.
      const dangling=floatKid||gesture==='fairy';
      const crouch=dangling?5:air?Math.round(4+Math.abs(beat)*4):0;
      const lank=dangling?Math.round(lag*(glide?6:3))+(profile?14:quarter?10:5):0;
      const legBeat=dangling?0:step,drift=dangling?Math.round(beat*(glide?4:2)):0;
      const lx=28+lank+drift+(dangling?7:0),ly=(dangling?87:93)-legBeat-crouch;
      limb('#4e3930','#92704e',31,72,33+lank,(dangling?76:84)-legBeat-crouch,lx,ly,6);
      const fx=50+lank+drift,fy=(dangling?84:90)+legBeat-crouch;
      limb('#4e3930','#9a744f',46,72,46+lank,(dangling?74:82)+legBeat-crouch,fx,fy,6);
      function skullBoot(x,y,turned){
        if(turned){
          P('#492a2d',[[x-4,y-4],[x+1,y-4],[x+5,y+1],[x+10,y-1],[x+13,y-8],[x+14,y-3],[x+11,y+5],[x+5,y+7],[x-4,y+3]]);
          P('#ae5036',[[x-3,y-3],[x+1,y-3],[x+6,y+2],[x+10,y],[x+12,y-3],[x+10,y+3],[x+5,y+5],[x-3,y+2]]);
          R('#c9a064',x-2,y-1,3,3);
        }else{P('#93442f',[[x-5,y-4],[x+3,y-3],[x+9,y+1],[x+11,y+5],[x+4,y+5],[x-5,y+3]]);R('#cc9757',x-1,y-2,3,2);}
      }
      skullBoot(lx,ly,dangling);skullBoot(fx,fy,dangling);
      P('#8c4131',[[27,51],[49,51],[53+drift,75],[45+drift,71],[41+drift,77],[36+drift,72],[29+drift,77],[25+drift,70]]);P('#d17a3d',[[30,54],[39,56],[38+drift,69],[31+drift,71]]);
      P('#71824c',[[25,50],[32,45],[40,49],[48,45],[54,51],[47,56],[41,53],[34,57]]);
      P('#58613a',[[31,64],[44,64],[48+drift,73],[43+drift,73],[43+drift,79],[39+drift,75],[34+drift,79],[32+drift,74],[27+drift,76]]);
      P('#879044',[[32,66],[37,68],[42+drift,73],[36+drift,72],[32+drift,75],[31+drift,71]]);
      for(const [x,y]of[[28,58],[43,65],[33,72]])L('#e0a154',x,y,x+4,y-1,2);
      const playing=gesture==='fairy'&&phase<.83,marionette=dangling||cast||victory;
      const handL=summoning?[[23,21,18,15,13,13,24,28][stage],[64,48,34,30,35,52,60,64][stage]]:
        playing?[36+beat*2,54-lift]:[marionette?14-sway:16,marionette?59-lift+beat*7:72-lift];
      const handR=summoning?[[51,59,62,66,68,68,56,51][stage],[62,47,32,26,32,50,53,62][stage]]:
        playing?[54+beat*2,54-lift]:[marionette?65+sway:61,marionette?53-lift-beat*7:71-lift];
      if(floatKid&&!glide&&!summoning){
        const armY=62+Math.round(beat);
        limb('#453632','#80634a',27,54,28,armY+3,47,armY-3,6);
        limb('#4a352f','#987456',48,54,48,armY+3,32,armY-2,6);
        P('#7e8641',[[31,armY-4],[36,armY-3],[37,armY+1],[31,armY+2],[29,armY-1]]);
        P('#a5a05b',[[42,armY-2],[47,armY-3],[49,armY],[46,armY+3],[42,armY+2]]);
      }else{
        limb('#785334','#bc8b4a',26,55,handL[0]+(summoning?-3:4),handL[1]+(summoning?10:-6),...handL,4);
        limb('#785334','#bc8b4a',50,55,handR[0]+(summoning?3:-4),handR[1]+(summoning?10:-7),...handR,4);
        for(const [x,y] of [handL,handR])P('#d09a4e',[[x-3,y-3],[x+3,y-3],[x+5,y+4],[x+1,y+7],[x-4,y+4]]);
        if(summoning){
          fingers(...handL,'#dbb276',3);fingers(...handR,'#dbb276',3);
          if(stage>=2&&stage<=4){
            spark(handL[0]-3,handL[1]-7,'#e1a5c0',stage);
            spark(handR[0]+3,handR[1]-7,'#edb277',stage);
          }
        }
      }
      O('#5b4231',40,33,16,18);P('#887046',[[25,36],[28,21],[48,21],[55,34],[50,47],[30,46]]);
      // Red-orange strips radiate behind the mask. Vary the peaks to keep the torn-hemp silhouette.
      const fan=profile?44:40,flutter=idle||walk||glide?Math.round(beat*2):0;
      for(const [dx,dy,w] of [[-30,16,8],[-26,5,10],[-18,-1,8],[-9,-8,10],[5,-11,10],[16,-5,8],[24,3,9],[29,13,8]]){
        const tipX=fan+dx+flutter,tipY=23+dy,baseX=fan+dx*.44;
        P('#55292e',[[baseX-3,35],[tipX-w/2,tipY+3],[tipX-w/2+1,tipY],[tipX+w/2,tipY-1],[baseX+4,36]]);
        P(dx%2?'#b64931':'#993c30',[[baseX-1,33],[tipX-w/2+2,tipY+1],[tipX+w/2-1,tipY],[baseX+3,32]]);
        L('#d36339',tipX-2,tipY+2,baseX,29);
      }
      P('#9b4430',[[fan-10,35],[fan-9,20],[fan-4,17],[fan+7,19],[fan+11,34]]);
      L('#bf5a34',fan-5,20,fan-4,32,2);L('#e5733e',fan-1,21,fan,29);
      if(back){P('#654b32',[[27,31],[50,31],[48,47],[33,49]]);for(let x=29;x<50;x+=4)L('#c2a85e',x,31,x+1,44,2);L('#49333b',27,35,50,39,3);}
      else{
        const mx=profile?46:quarter?42:39,mw=profile?11:18;
        for(const s of[-1,1])for(let i=0;i<4;i++){
          const x=mx+s*(mw-3),y=33+i*6, palette=['#e1a64f','#9faa5b','#cb784f','#c5ac67'];
          P('#4b334d',[[x,y],[x+s*(i===1?14:11),y-6],[x+s*5,y+5]]);
          P(palette[i],[[x+s*3,y],[x+s*(i===1?12:9),y-5],[x+s*6,y+3]]);
        }
        P('#51345e',[[mx-mw,33],[mx-10,28],[mx,34],[mx+10,28],[mx+mw,33],[mx+mw-3,50],[mx,63],[mx-mw+3,50]]);
        P('#a54457',[[mx-mw+3,35],[mx-3,38],[mx-2,57],[mx-11,49]]);P('#ad5054',[[mx+3,38],[mx+mw-2,35],[mx+10,51],[mx+1,58]]);
        for(const s of profile?[1]:[-1,1]){
          const x=mx+s*(mw-5);
          P('#7d734c',[[x-2,33],[x+s,22],[x+3,32]]);L('#e8d285',x+s,25,x+1,31,2);
          L('#b7a4cd',mx+s*2,38,mx+s*4,34);L('#b7a4cd',mx+s*4,34,x,32);
          P('#4e867d',[[x-2,53],[x+4,52],[x+s*6,61],[x,57]]);L('#a7bc7f',x,54,x+s*3,57,2);
        }
        for(const x of profile?[mx+3]:[mx-9,mx+9]){
          O('#542d4e',x,43,8,8);O('#e5793b',x,43,7,7);O('#e2b748',x,43,5,5);
          O('#bec54d',x,43,3,3);R('#543a46',x-1,42,2,2);R('#fff1a3',x-3,40,2,2);L('#662f65',x-5,33,x+3,35,2);
        }
        L('#bd9868',mx-2,49,mx,54);L('#e0bc73',mx+2,51,mx+1,55);R('#d0b582',mx-1,58,3,2);
      }
      if(playing){
        horn(51+beat*2,53-lift);
      }
      if(gesture==='fairy'||gesture==='moonCrash'){
        fairy(14+flourish/2,44+beat*8,true);
        fairy(69-flourish/2,44-lag*8);
      }
    }else{
      const link=id==='link',zelda=id==='zelda',tetra=id==='tetra',sheik=id==='sheik';
      const cx=profile?41:quarter?40:39,bw=profile?15:quarter?22:26;
      const left=cx-bw/2,right=cx+bw/2,headY=(tetra?29:26)+(idle?(frame===2?1:0):hurt?2:0);
      const wave=glide?Math.round(beat*4):dash?3:0;
      let palmL=[left-4,67+step/2-lift],palmR=[right+5,66-step/2-lift];
      if(glide){
        if(link){palmL=[left-7,30+wave];palmR=[right+6,30-wave];}
        if(zelda){palmL=[left-17*turn,50+wave];palmR=[right+17*turn,50-wave];}
        if(tetra){palmL=[left-7,39+wave];palmR=[right+8,56-wave];}
        if(sheik){palmL=[left-9*turn,52+wave];palmR=[right+15*turn,62-wave];}
      }else if(jump){
        palmL=[left-7,59-lift+step/2];palmR=[right+8,58-lift-step/2];
      }else if(dash){
        palmL=[left-11*turn,64+wave];palmR=[right+12*turn,56-wave];
      }else if(victory){
        palmL=[left-6-flourish,65-lift];palmR=[right+8+flourish,49-lift];
      }else if(attack||cast){
        if(gesture==='leaf'){
          palmL=[cx+[5,4,0,-5,-9,-2][frame%6]*turn,50+Math.round(swing*2)];
          palmR=[right+[5,8,11,14,15,8][frame%6]*turn,54-Math.round(swing*5)];
        }else if(gesture==='seal'){
          palmL=[cx+[-10,-4,1,-7,-17,-19,-14,-12][stage]*turn,[65,60,51,46,47,53,59,63][stage]];
          palmR=[cx+[13,10,7,20,27,29,23,17][stage]*turn,[63,56,48,34,33,39,49,58][stage]];
        }else if(gesture==='harp'){
          palmL=[cx+[-8,-9,-5,-3,-6,-3,-5,-8][stage],[65,56,45,55,45,54,47,60][stage]];
          palmR=[cx+[14,12,11,11,11,11,11,14][stage],[66,59,54,54,54,54,55,63][stage]];
        }else if(gesture==='cutlass'){
          palmL=[left-8,61+beat*4];
          palmR=[right+4+release*7*turn,62-lift-(release<0?8:0)];
        }else if(gesture==='waterGun'){
          palmR=[cx+[13,8,6,25,24,18,15,13][stage]*turn,[69,55,47,55,49,55,62,66][stage]];
          palmL=[cx+[-12,-8,-3,16,15,8,-5,-12][stage]*turn,[68,60,55,60,52,59,63,66][stage]];
        }else if(gesture==='spin'){
          palmL=[left+[-3,-3,-2,-10,-13,-11,-6,-3][stage]*turn,[68,63,57,60,54,54,63,66][stage]];
          palmR=[right+[4,-1,-9,8,9,7,10,6][stage]*turn,[67,66,66,54,53,57,60,65][stage]];
        }else if(gesture==='kunai'){
          palmL=[left-7*turn,60+beat*3];
          palmR=[right+4+[-13,-10,-5,15,11,2][frame%6]*turn,[55,48,43,52,57,64][frame%6]];
        }else{
          palmL=[left-4-Math.round(snap*4),67-lift];
          palmR=[right+5+Math.round(6*snap*turn),66-lift-Math.round(snap*3)];
        }
      }
      const armPaths=(shade,light,y)=>{
        const braking=glide||dash||victory||special;
        limb(shade,light,left-1,y,(left+palmL[0])/2-3,braking?(y+palmL[1])/2+5:57+step/2-lift*.6,...palmL,4);
        limb(shade,light,right-1,y,(right+palmR[0])/2+3,braking?(y+palmR[1])/2+5:56-step/2-lift*.6,...palmR,4);
        if((zelda&&glide)||(sheik&&glide)){fingers(...palmL,light,2);fingers(...palmR,light,2);}
      };
      if(sheik&&(air||dash||walk||gesture==='harp')){
        ribbon('#6f879a','#cbd0c6',[[left+1,44],[left-10,44+wave],[left-25*turn,50+wave],[left-37*turn,46+wave+sway]],4);
        ribbon('#829aa5','#ebe8d4',[[left+1,47],[left-12,50+wave],[left-23*turn,55+wave],[left-29*turn,54+wave-sway]],2);
      }
      if(tetra&&(air||dash||walk)){
        ribbon('#87443f','#f09080',[[right-2,49],[right+8*turn,52],[right+20*turn,51+wave],[right+32*turn,55+wave-sway]],4);
      }
      if(zelda){
        // Breath of the Wild ceremonial dress: white gown, bare arms, gold girdle and braided blonde hair.
        P('#b68b43',[[27,23],[31,14],[46,13],[53,22],[52,64],[44+sway,73],[29,65],[24,48]]);
        P('#e0bd61',[[30,24],[48,22],[48,58],[44+sway,66],[29,59]]);L('#f2d88a',29,30,29,54,2);
        const hem=glide?Math.round(6+beat*5):gesture==='seal'?[0,-2,-4,2,5,6,3,0][stage]:walk||jump||dash?sway*2:sway,skirt=air?5:0;
        P('#bbbfbb',[[left+2,54],[right-2,54],[right+9+hem,94-skirt],[right+4+hem,98-skirt],[cx-2+hem,97-skirt+wave/2],[left-9+hem,98-skirt],[left-7+hem,87-skirt]]);
        P('#f5f0da',[[left+4,55],[right-3,55],[right+5+hem,93-skirt],[cx+1+hem,96-skirt+wave/2],[left-5+hem,94-skirt]]);
        P('#d8dccc',[[cx-1,61],[cx+4,61],[cx+8+hem,94-skirt],[cx+3+hem,95-skirt]]);L('#fff9e7',left+4,65,left+hem,90-skirt,2);
        L('#d4ad63',left-6+hem,94-skirt,right+6+hem,94-skirt,2);L('#eee0ad',left-4+hem,92-skirt,right+4+hem,92-skirt);
        for(const s of[-1,1]){
          const ax=cx+s*3,ex=cx+s*9+hem;
          L('#cbb783',ax,65,ex,90-skirt);P('#ddc77f',[[ex-2,89-skirt],[ex,86-skirt],[ex+2,89-skirt],[ex,91-skirt]]);
        }
        R(skin,cx-8+hem-step/2,97-skirt,5,3);R(skin,cx+5+hem-step/2,97-skirt,5,3);
        P('#f3f0db',[[left,42],[right,42],[right-3,60],[left+3,60]]);P('#c4cdbd',[[left,42],[cx,47],[right,42],[right-2,49],[left+2,49]]);
        P('#d8b362',[[left+1,57],[right-1,57],[right-2,62],[cx,65],[left+2,62]]);L('#ffdf85',left+3,58,right-3,58);R('#7bada0',cx-2,60,5,3);
        armPaths('#c3966e','#f6d2a1',43);
        for(const [x,y] of[palmL,palmR]){R('#dbb45e',x,y-5,4,3);R('#f3d47d',x,y-5,4,1);}
        if(glide)for(const [x,y] of[palmL,palmR]){spark(x+2,y-3+beat,'#fbe198',2+frame%2);R('#fff5cf',x+3,y-4,2,2);}
      }else{
        const pants=link?'#e1debf':tetra?'#f0e7c6':'#374e78',pantsLight=link?'#f6f0d4':tetra?'#fff4db':'#7185a7';
        const feet=[(glide?(link?4:tetra?6:9):jump?Math.round(swing*6):0)+step,(glide?(link?6:tetra?9:4):jump?Math.round(swing*4):0)-step];
        const trail=glide?Math.round((sheik?7:tetra?4:3)+beat*2):dash?4:0;
        limb(pants,pantsLight,cx-7,70,cx-9-trail,81-feet[0],cx-10-trail,90-feet[0],6);
        limb(pants,pantsLight,cx+6,70,cx+9-trail,81-feet[1],cx+10-trail,90-feet[1],6);
        if(tetra){for(const s of[-1,1]){const x=cx+s*10-trail,boot=-feet[s<0?0:1];R(skin,x-1,85+boot,5,10);R('#5e4936',x-2,95+boot,8,3);R('#a98b4d',x-2,91+boot,7,2);}}
        else if(sheik){for(const s of[-1,1]){const x=cx+s*10-trail,boot=-feet[s<0?0:1];R('#d4d6c4',x-1,83+boot,6,12);for(let j=0;j<3;j++)L('#8d9c9c',x-1,86+j*3+boot,x+4,88+j*3+boot);P('#5d717d',[[x-2,94+boot],[x+5,94+boot],[x+7,98+boot],[x-3,98+boot]]);}}
        else for(const s of[-1,1]){const x=cx+s*10-trail,boot=-feet[s<0?0:1];P('#684d36',[[x-2,84+boot],[x+5,84+boot],[x+5,94+boot],[x+8,97+boot],[x-4,98+boot],[x-4,94+boot]]);L('#b58c54',x-1,86+boot,x-1,93+boot,2);R('#382f2c',x-4,98+boot,13,1);}
        const cloth=link?'#286e46':tetra?'#dfd2a7':'#314e7b',light=link?'#58a259':tetra?'#f0e2b8':'#667da7';
        P(cloth,[[left+3,42],[right-3,42],[right,54],[right-2,68],[right+2,73],[left-2,73],[left+1,63],[left-1,51]]);
        P(light,[[left+4,44],[cx,46],[cx+1,64],[left+3,67]]);L(link?'#91bc74':tetra?'#eea0a1':'#8d9fc0',left+4,46,left+3,58,2);
        const arm=sheik?'#415b84':skin,armLight=sheik?'#9aaaba':tetra?'#dd9d67':'#f3c99a';
        armPaths(arm,armLight,46);
        if(link){
          for(const x of[left-3,right-1]){R('#e6e3c9',x,49,6,7);P('#3e8850',[[x-1,44],[x+4,43],[x+7,49],[x+5,52],[x-1,50]]);}
          P('#ebdfb8',[[left+6,42],[cx,47],[right-6,42],[cx+2,53],[cx-3,53]]);
          L('#65523a',right-4,42,cx-5,65,3);L('#c9a06a',right-4,42,cx-5,65);
          R('#675039',left,64,bw,5);R('#dfbe68',cx-1,63,6,6);R('#7d643c',cx+1,65,2,2);
          L('#a9b8a6',left+1,72,right-1,72,2);for(let x=left+1;x<right;x+=3)R('#536e65',x,71,1,1);
          for(const [x,y] of[palmL,palmR]){R('#755237',x-1,y-4,5,6);R('#b18650',x-1,y-4,5,1);}
        }else if(tetra){
          P('#31566e',[[left,42],[left+5,43],[cx-3,52],[left+4,62],[left-1,60]]);P('#3c677f',[[right-5,43],[right,42],[right+1,59],[right-5,62],[cx+4,52]]);
          P('#bd5759',[[left+4,41],[cx,44],[right-4,41],[right-5,46],[cx,50],[left+5,46]]);
          P('#e47f73',[[cx-4,45],[cx+4,45],[cx+2,53],[cx-3,56],[cx-1,50]]);
          R('#584976',left-1,63,bw+2,6);R('#a98b9e',left+1,64,bw-2,2);P('#6a5181',[[right-1,65],[right+7,75+sway],[right+2,80],[right-4,68]]);R('#e3bd5b',cx-3,63,6,6);
          R('#f1e8cd',left,71,bw,6);L('#b9bca7',cx,71,cx,77);
        }else{
          P('#e5e3cc',[[left+5,42],[right-3,44],[right+1,60],[cx+2,68],[left+2,61]]);P('#afb8b0',[[left+5,44],[left+8,47],[left+5,58],[cx+2,64],[cx-2,65],[left+1,59]]);
          // Sheikah eye: three lashes, almond eye and falling tear.
          for(const x of[cx-4,cx,cx+4])L('#aa4252',x,49,x,51);
          P('#b04a57',[[cx-6,55],[cx,51],[cx+6,55],[cx,58]]);O('#e9dfc4',cx,55,3,2);R('#ae4655',cx-1,54,2,3);P('#b04a57',[[cx-2,59],[cx+2,59],[cx,65]]);
          for(const [x,y] of[palmL,palmR])for(let j=0;j<3;j++){R('#d6d8c9',x-1,y-7+j*3,5,2);L('#8a999b',x,y-5+j*3,x+3,y-4+j*3);}
          L('#bcab87',left,68,right,66,2);
        }
      }
      // Angular chins, tapered ears, brows and separate profiles retain identity at game scale.
      const hw=profile?12:quarter?14:15,faceX=cx+(profile?3:quarter?2:0);
      P('#bd8c61',[[faceX-hw,headY-8],[faceX+hw-1,headY-8],[faceX+hw+1,headY+4],[faceX+9,headY+14],[faceX,headY+18],[faceX-10,headY+12],[faceX-hw-1,headY+3]]);
      P(skin,[[faceX-hw+2,headY-8],[faceX+hw-2,headY-8],[faceX+hw,headY+3],[faceX+8,headY+12],[faceX,headY+15],[faceX-9,headY+10]]);
      if(!profile)P(skin,[[faceX-hw,headY],[faceX-hw-8,headY-4],[faceX-hw-5,headY+5],[faceX-hw,headY+7]]);
      P('#f4cda0',[[faceX+hw-1,headY],[faceX+hw+8,headY-5],[faceX+hw+5,headY+4],[faceX+hw-1,headY+7]]);
      L('#bb895e',faceX+hw+1,headY+2,faceX+hw+5,headY-1);
      const hair=link?'#d6ae4f':tetra?'#e6c65d':'#d9b260';
      if(link){
        P('#9f7b38',[[faceX-16,headY-10],[faceX-11,headY-15],[faceX+9,headY-14],[faceX+16,headY-7],[faceX+15,headY+4],[faceX+10,headY+9],[faceX+8,headY-2],[faceX+3,headY+2],[faceX-1,headY-4],[faceX-8,headY+4],[faceX-9,headY+11],[faceX-14,headY+7]]);
        P(hair,[[faceX-13,headY-11],[faceX+8,headY-12],[faceX+12,headY-6],[faceX+11,headY+2],[faceX+7,headY-5],[faceX+2,headY-1],[faceX-2,headY-6],[faceX-9,headY+1]]);
        P('#24623d',[[faceX-17,headY-11],[faceX-13,headY-20],[faceX+5,headY-22],[faceX+13,headY-15],[faceX+18+sway,headY+4],[faceX+11,headY],[faceX+6,headY-10]]);
        P('#4e9954',[[faceX-13,headY-13],[faceX-10,headY-18],[faceX+4,headY-19],[faceX+12,headY-10],[faceX+8,headY-10]]);L('#8dc476',faceX-11,headY-16,faceX+2,headY-17);
        L('#60a15c',faceX-15,headY-10,faceX+7,headY-10,2);
      }else if(zelda){
        P('#c29a4a',[[faceX-15,headY-7],[faceX-12,headY-15],[faceX+8,headY-16],[faceX+16,headY-8],[faceX+14,headY+9],[faceX+10,headY+13],[faceX+9,headY-5],[faceX+1,headY-8],[faceX-9,headY-2],[faceX-11,headY+11],[faceX-15,headY+8]]);
        P('#efd181',[[faceX-12,headY-8],[faceX-9,headY-13],[faceX+6,headY-14],[faceX+12,headY-8],[faceX+3,headY-10],[faceX-4,headY-5]]);
        for(let i=0;i<6;i++){const x=faceX-11+i*4,y=headY-8-Math.round(Math.sin(i/5*Math.PI)*3);R(i%2?'#ac823b':'#f3d98d',x,y,3,2);}
        R('#578b82',faceX+hw+3,headY+6,3,6);R('#e7c267',faceX+hw+3,headY+5,3,2);
        if(!back){L('#c9a456',cx-5,45,cx,49);L('#c9a456',cx,49,cx+6,45);O('#6e9c92',cx,49,2,3);}
      }else if(tetra){
        P('#a98934',[[faceX-16,headY-8],[faceX-12,headY-18],[faceX+3,headY-21],[faceX+14,headY-14],[faceX+16,headY-2],[faceX+9,headY+1],[faceX+4,headY-5],[faceX-4,headY-1],[faceX-10,headY-4],[faceX-11,headY+6]]);
        P('#f1d56c',[[faceX-13,headY-9],[faceX-9,headY-17],[faceX+2,headY-19],[faceX+11,headY-13],[faceX+11,headY-7],[faceX+5,headY-11],[faceX-3,headY-7]]);
        P('#debc51',[[faceX+9,headY-16],[faceX+15,headY-26],[faceX+25,headY-31],[faceX+22,headY-17],[faceX+26,headY-10],[faceX+16,headY-10]]);L('#fff092',faceX+16,headY-20,faceX+21,headY-25,2);R('#705239',faceX+11,headY-17,6,4);
        R('#558dac',faceX+hw+3,headY+7,3,6);R('#a3cfcb',faceX+hw+3,headY+7,1,2);
      }else{
        P('#aaa98f',[[faceX-16,headY-9],[faceX-10,headY-19],[faceX+8,headY-18],[faceX+15,headY-9],[faceX+14,headY-1],[faceX-15,headY-1]]);
        P('#eeebd5',[[faceX-13,headY-10],[faceX-8,headY-17],[faceX+7,headY-16],[faceX+13,headY-9],[faceX+10,headY-4],[faceX-13,headY-3]]);
        L('#aab3ad',faceX-10,headY-11,faceX+9,headY-8,2);L('#fff9df',faceX-7,headY-15,faceX+6,headY-14);
        P('#d6b65c',[[faceX-11,headY-5],[faceX+3,headY-7],[faceX+6,headY],[faceX-1,headY+10],[faceX-6,headY+12],[faceX-5,headY+2]]);
        L('#f2d786',faceX-8,headY-3,faceX-3,headY+4,2);
        P('#bfc8bd',[[faceX-13,headY+7],[faceX+14,headY+6],[faceX+12,headY+17],[faceX-1,headY+20],[faceX-12,headY+15]]);L('#f0ead0',faceX-10,headY+9,faceX+11,headY+9,2);L('#8f9f9c',faceX-8,headY+15,faceX+9,headY+13);
        P('#d1d6c5',[[left,42],[left+5,44],[left+1,54+sway],[left-8,60+sway],[left-2,50]]);
      }
      if(back){
        if(tetra){P('#365d78',[[left+2,43],[right-2,43],[right,60],[left,60]]);L('#6b91a5',left+4,46,left+3,57,2);L('#284960',cx+3,47,cx+4,59);}
        if(sheik){P('#3c5985',[[left+3,43],[right-2,44],[right,63],[left+1,64]]);L('#b9c6ba',left+4,45,right-2,60,3);L('#8faaa7',left+5,45,right-1,60);}
        const hairBack=sheik?'#d8dccb':hair;
        P(hairBack,[[faceX-12,headY-2],[faceX+12,headY-2],[faceX+11,headY+11],[faceX+5,headY+15],[faceX-10,headY+11]]);
        if(zelda){P('#c9a451',[[faceX-12,headY+1],[faceX+11,headY+1],[faceX+13,66+sway],[faceX+5,73],[faceX-8,68],[faceX-14,52]]);L('#f1d786',faceX-7,headY+7,faceX-6,60,2);L('#b68c43',faceX+4,headY+9,faceX+6,65,2);}
        if(link){P('#2d7046',[[faceX-14,headY-12],[faceX+4,headY-17],[faceX+15,headY-7],[faceX+17+sway,headY+12],[faceX+5,headY+7],[faceX,headY-4],[faceX-12,headY-4]]);L('#76aa62',faceX-9,headY-10,faceX+2,headY-11,2);shield(cx,57);}
        if(sheik){L('#abb7ae',faceX-12,headY+2,faceX+11,headY+6,2);L('#fff4d5',faceX-9,headY-10,faceX+7,headY-7);}
      }else{
        const eyesY=headY+2;
        if(sheik)eye(faceX+6,eyesY,'#b24e57');
        else if(profile)eye(faceX+7,eyesY,tetra?'#3d6889':'#497b9a',tetra);
        else{eye(faceX-(quarter?5:10),eyesY,tetra?'#426d8a':'#4c83a0',tetra);eye(faceX+6,eyesY,tetra?'#426d8a':'#4c83a0',tetra);}
        if(!sheik){R('#bd895e',faceX+2,headY+9,2,2);L('#ac6c53',faceX+1,headY+13,faceX+5,headY+12);if(tetra)L('#6a4b36',faceX+2,headY+13,faceX+7,headY+11);}
        if(action==='hurt')L('#b4856a',faceX-9,eyesY+1,faceX+10,eyesY+1,2);
      }
      if(link){
        if(!back&&!glide)shield(palmL[0]-1,palmL[1]-4);
        if(!gesture&&!glide&&(!back||victory))sword(palmR[0]+(back?3:0),palmR[1]-5,victory?-.2+beat*.13:jump?.55+beat*.1:dash?1.05:.15+sway*.04,dash||victory?22:31);
      }
      if(gesture==='seal'){
        const [x,y]=palmR,[lx,ly]=palmL;
        fingers(x+1,y,'#f6cc7f',2);fingers(lx+1,ly,'#efc77c',2);
        if(stage===1||stage===2){
          const sx=(x+lx)*.5,sy=(y+ly)*.5-6;
          spark(sx,sy,'#f6c773',stage+1);R('#fff0bb',sx,sy,2,2);
        }
        if(stage>=3&&stage<=6){
          const d=[0,0,0,4,5,4,2,0][stage],sx=x+2,sy=y-6;
          const tri=(tx,ty)=>P('#ffe599',[[tx,ty],[tx-d,ty+d*1.65],[tx+d,ty+d*1.65]]);
          tri(sx,sy-d*2);tri(sx-d,sy-d*.2);tri(sx+d,sy-d*.2);
          spark(sx,sy-13,'#fff3c4',d);spark(lx-2,ly-4,'#eec874',Math.max(2,d-1));
        }
      }else weapon(palmR[0]+1,palmR[1]-3);
    }
    if(cast||victory||glide){
      if(id==='zelda'){
        if(glide){
          for(const s of [-1,1]){
            const x=40+s*17,y=84+Math.round(beat*4);
            ribbon('#d5a958','#ffe9a3',[[x+s*9,y-9],[x+s*8,y-3],[x+s*3,y+2],[x-s*2,y+5]],2);
          }
        }
        const points=glide?[[11,50],[65,52],[17,83],[63,79]]:[[14,30],[67,26],[9,61]];
        points.forEach(([x,y],i)=>{const yy=y+Math.round(Math.sin(phase*Math.PI*2+i)*4);spark(x,yy,i%2?'#fff5cf':'#efc46f',2+(i+frame)%2);});
      }else if(id==='midna'){
        for(let i=0;i<4;i++){const x=10+i*5+(i%2?46:0),y=25+i*12+(frame+i)%4;P(i%2?'#665282':'#8ac7bd',[[x,y-2],[x+3,y],[x,y+3],[x-3,y]]);}
      }else if(id==='skullkid'){
        for(let i=0;i<3;i++){const x=(i%2?62:12)+i*2,y=36+i*14+Math.round(Math.cos(phase*Math.PI*2+i)*5);spark(x,y,i%2?'#e4ae8a':'#db9deb',2+frame%2);}
      }else if(id==='link'&&!glide){
        for(const [x,y] of [[12,23],[66,13],[9,66]])spark(x,y-frame%3,'#f0d18c',2);
      }else if(id==='sheik'&&glide){
        for(let i=0;i<2;i++)L('#b5c8cb',9+i*6,63+i*6+frame,20+i*6,61+i*6+frame);
      }else if(id==='tetra'&&cast){
        for(let i=0;i<3;i++)R(i%2?'#f9d48a':'#d8a363',70+i*3,28-i*3-frame%3,2,2);
      }
    }
    return outline(canvas);
  }

  // Body motion and signature effects are authored separately from combat timing.
  const MOB_MOTION={
    chuchu:['jelly','#71cfa0'],blue_chuchu:['jelly','#8ddcf8'],deku_baba:['snap','#e5cd84'],
    deku_scrub:['spit','#dfbf6e'],octorok:['spit','#f4a487'],skulltula:['scuttle','#decca5'],
    tektite:['spring','#e9ba7b'],keese:['wing','#d5a9ed'],seahat:['rotor','#e9d68f'],
    bokoblin:['club','#ddac67'],gloom_bokoblin:['club','#d77483'],lizalfos:['lunge','#c0d783'],
    shadow_kargarok:['wing','#e89b8e'],shadow_vermin:['scuttle','#ce8c91'],shadow_beast:['club','#e1978f'],
    remlit:['spring','#e2a878'],little_frox:['jelly','#d7c780'],evermean:['branch','#e5ca8a'],takkuri:['wing','#e6c086'],
    slime:['jelly','#71cfa0'],mushroom:['snap','#e5cd84'],bat:['wing','#d5a9ed'],boar:['club','#ddac67'],
  };
  const BOSS_MOTION={
    kingbulblin:['heavy','#d8b573','charge'],morpha:['flow','#88dded','water'],
    gohma:['creep','#f0bc69','brood'],helmaroc:['wing','#9bc8ed','dive'],
    zant:['cloak','#cbb0f6','teleport'],ghirahim:['blade','#efd4e9','blade'],
    colgera:['flow','#a6e4ef','storm'],majora:['hover','#ffc286','moon'],
    ganondorf:['heavy','#f08d69','summon'],phantom:['cloak','#c9e8b0','volley'],
  };
  const fSin=(frame,count=8)=>Math.sin(frame*Math.PI*2/count);
  function enemyMotion(c,w,h,action,frame,style){
    const count=ANIMATIONS[action]?.[0]||4,wave=fSin(frame,count),pulse=(1-Math.cos(frame*Math.PI*2/count))*.5;
    const t=frame/Math.max(1,count-1),power=action==='attack'?.58+.42*Math.sin(Math.PI*Math.min(1,.22+t)) : t;
    let x=0,y=0,sx=1,sy=1,angle=0;
    const boss=w>64,scale=boss?2:1,flying=['wing','rotor','hover','flow','cloak'].includes(style),elastic=['jelly','spring','snap','spit','flow'].includes(style);
    if(action==='walk'||action==='idle'){
      if(flying){ y=-(2+pulse*(action==='walk'?3.3:1.7))*scale; angle=wave*.045; if(style==='rotor')x=wave*2; }
      else if(elastic){sx=1+wave*.035;sy=1-wave*.07;y=-(style==='spring'?4:1.5)*pulse*scale;}
      else {x=wave*(style==='scuttle'?2.8:1.5)*scale;angle=wave*(style==='scuttle'?.045:.023);}
    }else if(action==='windup'){
      if(flying){y=-(1+t*5)*scale;sx=1+t*.045;sy=1+t*.07;angle=-t*.08;}
      else {y=t*2*scale;sx=1+t*(elastic?.13:.075);sy=1-t*(elastic?.2:.115);angle=-t*(style==='lunge'?.16:.066);}
    }else if(action==='attack'){
      if(flying){x=power*3*scale;y=-Math.sin(t*Math.PI)*3*scale;sx=1-power*.04;sy=1+power*.09;angle=power*.12;}
      else {x=power*(style==='lunge'?5:2)*scale;y=-Math.sin(t*Math.PI)*3*scale;sx=1+power*(elastic?.12:.075);sy=1-power*.06;angle=power*(style==='lunge'?.15:.07);}
    }else if(action==='hurt'){
      x=(frame===0?-3:1)*scale;sx=1.045;sy=.9;angle=frame===0?-.08:.03;
    }else if(action==='spawn'){
      sy=.65+t*.35;sx=.88+t*.12;y=(1-t)*3*scale;
    }else if(action==='death'){
      sy=1-t*.67;sx=1+t*.13;angle=t*.07;
    }
    const pivot=h-(boss?13:10);
    c.translate(w*.5+Math.round(x),pivot+Math.round(y));c.rotate(angle);c.scale(sx,sy);c.translate(-w*.5,-pivot);
    return {wave,bob:Math.round(wave*(flying?3:2)),t,power};
  }
  function bossTell(c,id,action,frame,variant){
    if(!['windup','attack','spawn','death'].includes(action))return;
    const [,color,signature]=BOSS_MOTION[id]||BOSS_MOTION.phantom;
    const windup=action==='windup', f=frame/((ANIMATIONS[action]?.[0]||6)-1);
    const intent=variant==='landmark'?signature:variant||signature;
    const C=(x,y,r=3)=>{polygon(c,color,[[x,y-r],[x+r,y],[x,y+r],[x-r,y]]);if(r>3)rect(c,'#f7ebcc',x-1,y-1,2,2);};
    if(action==='spawn'||action==='death'){
      for(let i=0;i<7;i++){const a=i*Math.PI*2/7+frame*.09,r=action==='spawn'?48-f*24:26+f*24;C(64+Math.cos(a)*r,101+Math.sin(a)*r*.54,2+(i+frame)%3);}return;
    }
    if(variant==='landmark'){
      // Four extra corner emblems make the arena-only attacks distinct from the basic cycle.
      const edge=windup?52-f*9:43+f*10;
      for(const side of [-1,1])for(const dy of [-31,37]){
        const x=64+side*edge,y=70+dy+f*(windup?-5:6);
        C(x,y,5);line(c,color,x-side*10,y,x-side*5,y,2);
      }
    }
    if(intent==='charge'||intent==='dive'){
      for(let i=0;i<4;i++){const y=58+i*17;const x=(windup?19:30)+(i%2)*11+(windup?f*8:-f*15);line(c,color,x,y,x+11+i*3,y-4,2+(i%2));}
      for(let i=0;i<3;i++)C(91+i*8,88-f*13+i*5,3+i%2);
    }else if(intent==='slam'||intent==='moon'){
      const cy=windup?25+f*7:75+f*44;
      for(let i=0;i<5;i++)C(23+i*20,cy+(i%2)*9,3+(i+frame)%3);
      if(!windup){for(let i=0;i<4;i++){const dx=16+f*(10+i*5);line(c,color,64+dx,120-i*4,75+dx,124-i*5,2);line(c,color,64-dx,120-i*4,53-dx,124-i*5,2);}}
    }else if(intent==='teleport'){
      for(let i=0;i<9;i++){const y=19+i*12, side=i%2?-1:1;
        const x=64+side*(windup?47-f*11:24+f*27)+Math.sin(i+frame)*4;rect(c,color,x,y,3+i%3,3+i%3);}
      line(c,color,35+f*28,19,35+f*28,104,1);line(c,color,93-f*28,30,93-f*28,122,1);
    }else if(intent==='summon'||intent==='brood'){
      for(let i=0;i<5;i++){const x=21+i*21,y=windup?97-f*(24+i%2*15):102+f*17-(i%2)*12;C(x,y,3+(i+frame)%3);if(!windup)line(c,color,x-4,y+7,x+4,y+7,2);}
    }else if(intent==='water'||intent==='storm'){
      for(let i=0;i<14;i++){const a=i*TAU_ART/14+frame*.25,r=windup?49-f*14:29+f*23;const x=64+Math.cos(a)*r,y=65+Math.sin(a)*r;line(c,color,x,y,x-Math.sin(a)*8,y+Math.cos(a)*8,2);}
    }else{
      for(let i=0;i<7;i++){const a=Math.PI*(.12+i*.126),r=windup?41-f*13:32+f*22;const x=64+Math.cos(a)*r,y=63-Math.sin(a)*r;C(x,y,intent==='blade'?5:3+(i%3));
        if(intent==='blade')line(c,color,x-4,y+6,x+4,y-6,2);}
    }
  }
  const TAU_ART=Math.PI*2;
  function mobTell(c,id,action,frame,style,color){
    if(!['attack','windup','hurt','death'].includes(action))return;
    const t=frame/((ANIMATIONS[action]?.[0]||6)-1), windup=action==='windup';
    if(action==='death'){
      for(let i=0;i<5;i++){const x=9+i*10+(i%2?1:-1)*t*3,y=60-t*(5+i%3*6);rect(c,color,x,y,2+i%2,2);}
    }else if(action==='hurt'){
      for(let i=0;i<3;i++)rect(c,'#eed49d',12+i*5-t*4,21+i*4-t*3,3,2);
    }else if(['snap','spit'].includes(style)){
      const y=id==='octorok'?55:44, x=windup?47:48+t*11;
      oval(c,color,x,y,windup?2+t*3:4-t*2,windup?2+t*3:4-t*2);
      if(!windup)line(c,color,x-7,y,x-3,y,2);
    }else if(['wing','rotor'].includes(style)){
      for(const side of[-1,1])line(c,color,32+side*18,windup?27+t*6:42+t*12,32+side*27,windup?18+t*6:34+t*12,2);
    }else if(['club','lunge','branch'].includes(style)){
      if(windup){rect(c,color,47-t*4,10+t*6,3,3);rect(c,color,53-t*4,15+t*6,2,2);}
      else{for(let i=0;i<3;i++)line(c,color,41+i*4,25+t*12+i*5,48+i*4,32+t*12+i*5,2);}
    }else{
      for(const side of [-1,1])for(let i=0;i<2;i++)rect(c,color,32+side*((windup?16:19)+t*8+i*4),55+(windup?i*3:-i*5),3,2);
    }
  }

  function boss(id,frame,action='idle',variant=0){
    const canvas=surface(128,144),c=canvas.getContext('2d'),[style,,signature]=BOSS_MOTION[id]||BOSS_MOTION.phantom;
    const intent=variant==='landmark'?signature:variant||signature;
    bossTell(c,id,action,frame,variant);
    const {wave,t,power}=enemyMotion(c,128,144,action,frame,style),windup=action==='windup',strike=action==='attack';
    const lift=windup?3+t*11:strike?Math.round(power*8):0;
    const force=windup?-t:strike?power:0;
    if(force){
      c.translate(64,119);
      if(intent==='charge'||intent==='dive'){c.translate(force*4,0);c.rotate(force*.13);}
      else if(intent==='slam'||intent==='moon'){c.translate(0,force*4);c.scale(1+force*.10,1-force*.12);}
      else if(intent==='teleport'){c.translate(Math.round(force*10),-Math.abs(force)*5);c.scale(1-Math.abs(force)*.08,1+Math.abs(force)*.08);}
      else if(intent==='volley'||intent==='blade'){c.rotate(force*-.07);c.translate(0,-Math.abs(force)*3);}
      else if(intent==='water'||intent==='storm'){c.scale(1+force*.08,1-force*.08);c.rotate(force*.055);}
      c.translate(-64,-119);
    }
    if(id==='kingbulblin'){
      rect(c,'#494936',43,103-Math.round(wave*2),16,27);rect(c,'#494936',72,103+Math.round(wave*2),16,27);oval(c,'#6f8c50',64,82,31,33);oval(c,'#8da65e',64,49+Math.round(wave*2),25,24);polygon(c,'#e4cf94',[[42,39],[30,15],[48,29]]);polygon(c,'#e4cf94',[[80,39],[96,15],[77,29]]);oval(c,'#c1b376',64,59+Math.round(wave*2),19,12);rect(c,'#323d3c',50,43+Math.round(wave*2),7,4);rect(c,'#323d3c',73,43+Math.round(wave*2),7,4);for(const x of[50,75])polygon(c,'#f3e5b5',[[x,60+Math.round(wave*2)],[x+5,60+Math.round(wave*2)],[x+3,47+Math.round(wave*2)]]);rect(c,'#704e41',39,94,50,10);rect(c,'#d3bc75',58,92,13,14);const clubAngle=windup?.05+t*.25:strike?-.78-power*.62:wave*.06;
      c.save();c.translate(94,92);c.rotate(clubAngle);line(c,'#7a6349',0,0,3,-53,8);oval(c,'#777477',3,-55,11,20);line(c,'#aca7a2',-3,-70,0,-48,3);c.restore();
    }else if(id==='morpha'){
      for(let i=0;i<15;i++){const y=117-i*5,x=64+Math.sin(i*.35+frame*.45)* (windup?17+t*13:strike?20+power*14:20);oval(c,i%2?'#73b9d1':'#9bd9df',x,y,14-i*.35,8);oval(c,'#b5e9e7',x-3,y-2,5,4);}oval(c,'#be5b83',64+Math.sin(frame*.4)*10,65,13,13);oval(c,'#eda8af',60+Math.sin(frame*.4)*10,61,7,7);rect(c,'#fee9b3',58+Math.sin(frame*.4)*10,57,4,4);
    }else if(id==='gohma'){

      for(const side of [-1,1])for(let i=0;i<3;i++){const y=69+i*17,step=Math.round(Math.sin(frame*Math.PI/4+i)*(windup?5+t*6:strike?5+power*8:5));line(c,'#5a5340',64+side*24,y,64+side*47,y-14+step,8);line(c,'#9a8d57',64+side*47,y-14+step,64+side*55,y+20,6);line(c,'#d0bd78',64+side*56,y+14,64+side*59,y+23,3);}
      oval(c,'#655f3f',64,77,32,35);oval(c,'#a09a5b',61,69,28,29);oval(c,'#b8b76f',56,61,19,17);for(const x of [43,57,72,83])rect(c,'#717448',x,52+(x%5),5,11);
      const eyeY=83+(strike?Math.round(power*6):0),pupil=windup?6-t*4:5;
      oval(c,'#423c3b',64,eyeY,24,24);oval(c,windup?'#f4dc8b':'#c9944b',64,eyeY,19,windup?20-t*7:20);oval(c,'#d56842',64,eyeY,10,16);rect(c,'#2e3942',64-pupil/2,eyeY-13,pupil,26);rect(c,'#fff0b7',57,eyeY-10,4,8);
      polygon(c,'#d9c88b',[[44,106],[34,126],[55,114]]);polygon(c,'#d9c88b',[[84,106],[94,126],[73,114]]);
    }else if(id==='helmaroc'||id==='colgera'){
      const ice=id==='colgera',dark=ice?'#487f9f':'#355a9a',mid=ice?'#82bdce':'#6673bb',light=ice?'#cbe8e1':'#a9b9db',flap=Math.round(wave*(strike?17:11))-lift+(intent==='dive'&&strike?Math.round(power*18):0);
      for(const side of [-1,1]){polygon(c,dark,[[64+side*10,65],[64+side*53,37+flap],[64+side*48,79+flap],[64+side*23,95]]);polygon(c,mid,[[64+side*16,65],[64+side*49,43+flap],[64+side*37,72+flap],[64+side*22,82]]);for(let j=0;j<4;j++)line(c,light,64+side*(24+j*6),57+flap+j*2,64+side*(20+j*7),81+flap,2);}
      if(ice){for(let i=5;i>=0;i--){const x=64+Math.round(Math.sin(frame*.6+i*.9)*8),y=47+i*13;oval(c,dark,x,y,17-i,11);polygon(c,light,[[x-13+i,y-4],[x,y-13],[x+13-i,y-4],[x,y+7]]);}polygon(c,'#d6efdf',[[45,31],[35,7],[55,23],[64,10],[73,23],[94,7],[83,33],[76,46],[51,46]]);rect(c,'#668a9d',49,32,30,9);rect(c,'#eac383',53,35,5,3);rect(c,'#eac383',71,35,5,3);}
      else{oval(c,dark,64,81,21,32);oval(c,mid,61,73,17,27);polygon(c,'#e4cea0',[[49,114],[45,132],[58,123],[61,115]]);polygon(c,'#e4cea0',[[68,115],[72,131],[83,132],[79,114]]);oval(c,'#b6b8c9',64,45-lift,22,25);oval(c,'#e4dfc9',61,42-lift,16,20);rect(c,'#575e88',46,40-lift,14,5);rect(c,'#575e88',69,40-lift,13,5);rect(c,'#e2be61',51,42-lift,5,3);rect(c,'#e2be61',73,42-lift,5,3);polygon(c,'#d7aa5a',[[59,48-lift],[72,48-lift],[68,66-lift],[61,63-lift]]);for(let i=0;i<3;i++)polygon(c,'#8b6d9e',[[52+i*8,23-lift],[55+i*8,8-lift],[60+i*8,24-lift]]);}
    }else if(id==='majora'){
      for(const side of [-1,1])for(let i=0;i<3;i++){const x=64+side*(28-i*3),y=45+i*24;polygon(c,'#d4ae5c',[[x,y],[x+side*26,y-8],[x+side*15,y+15]]);}
      polygon(c,'#654072',[[29,43],[43,29],[64,44],[85,29],[100,43],[91,88],[64,116],[37,88]]);polygon(c,'#bc5d62',[[36,48],[59,52],[62,101],[43,84]]);polygon(c,'#b27547',[[67,52],[92,46],[85,85],[65,106]]);
      for(const x of [45,83]){oval(c,'#efdc7b',x,65,13,18);oval(c,'#df8c45',x,65,8,13);oval(c,'#633d60',x+Math.round(wave*2),65,3,10);rect(c,'#fff0be',x-5,55,3,5);}
      rect(c,'#b7a5c2',60,83,7,10);for(const side of [-1,1])for(let i=0;i<2;i++)line(c,'#744a75',64+side*12,105,64+side*(25+i*7),127+Math.round(wave*5),3);
    }else{
      const zant=id==='zant',ghirahim=id==='ghirahim',phantom=id==='phantom',dark=ghirahim?'#8f87a1':zant?'#344651':'#33344a',light=ghirahim?'#ebe8dc':zant?'#6b9490':'#7e8c7a';
      polygon(c,dark,[[44,57],[85,57],[108,132],[20,132]]);polygon(c,zant?'#456669':ghirahim?'#bda9c8':'#6a4a55',[[64,64],[84,59],[102,132],[65,125]]);
      rect(c,dark,43,105,15,29);rect(c,dark,72,105,15,29);rect(c,light,42,130,17,6);rect(c,light,72,130,18,6);rect(c,light,42,62,44,44);rect(c,ghirahim?'#fff5df':'#a1ad8d',46,65,7,31);rect(c,'#c5ac68',42,98,45,6);
      const high=intent==='summon'||intent==='volley'||intent==='blade';
      const handY=72-lift-(strike?5:0)-(windup&&high?t*13:0);
      const reach=windup?-6*t:strike?power*11:wave*1.4;
      line(c,dark,43,67,28-reach,handY+20-(high?Math.abs(force)*13:0),10);
      line(c,light,82,67,99+reach,handY+18,10);
      oval(c,phantom?'#869a85':ghirahim?'#d4c3ae':'#8b8f6b',64,42,20,23);
      if(zant){polygon(c,'#708b83',[[44,25],[56,11],[71,13],[85,32],[80,66],[62,80],[44,57]]);polygon(c,'#a7ac8b',[[58,12],[62,3],[74,14],[82,35],[63,27]]);rect(c,'#293f42',48,38,29,8);rect(c,'#dda85b',52,44,23,3);line(c,'#a0b5a2',52,54,70,68,3);}
      else if(ghirahim){polygon(c,'#f0ebdd',[[44,35],[49,14],[72,12],[86,31],[66,24],[53,41]]);rect(c,'#e6dbc5',50,34,28,20);rect(c,'#603d57',55,40,4,5);rect(c,'#603d57',71,40,4,5);line(c,'#af5263',63,53,75,51,2);for(const[x,y]of[[34,60-lift],[94,50-lift],[104,83]])polygon(c,'#b45477',[[x,y-8],[x+5,y],[x,y+8],[x-5,y]]);}
      else if(phantom){polygon(c,'#c2c7a0',[[44,30],[30,9],[53,19]]);polygon(c,'#c2c7a0',[[76,19],[97,9],[84,35]]);rect(c,'#253941',46,39,36,10);rect(c,'#d3ef9d',50,42,8,3);rect(c,'#d3ef9d',70,42,8,3);}
      else{polygon(c,'#913d3b',[[43,38],[43,15],[62,7],[83,18],[86,40],[75,29],[53,26]]);rect(c,'#b66a45',50,12,6,9);rect(c,'#4b5543',49,36,31,19);rect(c,'#e6bf66',54,40,5,3);rect(c,'#e6bf66',71,40,5,3);polygon(c,'#733f3a',[[52,51],[77,51],[72,65],[57,64]]);rect(c,'#ddb56a',62,28,5,8);}
      if(!zant){
        c.save();c.translate(99+reach,handY+18);c.rotate(windup?-.24-t*.65:strike?-(phantom?.7:1.04)*power:wave*.03);
        line(c,phantom?'#bce0ab':ghirahim?'#eee3e7':'#bacbba',0,-34,0,9,4);
        line(c,'#f5eed7',0,-33,0,-2,2);rect(c,'#d0b26c',-8,2,16,4);c.restore();
      }else for(let j=0;j<4;j++)rect(c,'#d5a861',55+j%2*10,83+j*6,4,4);
    }

    return outline(canvas);
  }
  function archetypeEnemy(type,frame,action='idle',id=type){
    if(type==='boss')return boss('phantom',frame,action);
    const canvas=surface(64,72),c=canvas.getContext('2d'),[style,color]=MOB_MOTION[id]||MOB_MOTION.boar;
    mobTell(c,id,action,frame,style,color);
    const {wave,bob,t,power}=enemyMotion(c,64,72,action,frame,style),windup=action==='windup',strike=action==='attack';
    if(type==='slime'){
      oval(c,'#226c64',32,48,18+Math.max(0,bob)+(windup?4*t:0),14-bob+(strike?3*power:0));oval(c,'#4baf91',31,44-bob,17,15+bob);oval(c,'#7bd4a8',27,40-bob,10,9);for(const x of[24,38]){oval(c,'#e5ead1',x,42-bob,4,6);rect(c,'#29394c',x,41-bob,2,5);}rect(c,'#205b59',28,53-bob,9,2);
    }else if(type==='mushroom'){
      rect(c,'#487c47',29,39,6,20);polygon(c,'#74ac50',[[30,53],[11,45],[18,60],[31,61]]);polygon(c,'#92bd59',[[34,52],[53,46],[47,59],[32,61]]);oval(c,'#405d95',32,31+bob,16,16);oval(c,'#7398c0',28,27+bob,11,10);rect(c,'#2c3047',18,31+bob,29,windup?9+t*6:strike?13+power*3:7);for(let x=20;x<46;x+=6)polygon(c,'#f6e9c5',[[x,31+bob],[x+4,31+bob],[x+2,36+bob]]);for(const[x,y]of[[22,22],[36,19],[41,26]])rect(c,'#e9dcb2',x,y+bob,4,4);
    }else if(type==='bat'){
      polygon(c,'#655278',[[27,31],[8,17+bob*5],[3,39],[17,34],[23,44]]);polygon(c,'#8e76a6',[[37,31],[56,17+bob*5],[61,39],[47,34],[41,44]]);oval(c,'#49435c',32,37,9,12);polygon(c,'#4d465e',[[24,30],[23,16],[31,27]]);polygon(c,'#4d465e',[[34,27],[42,16],[40,32]]);rect(c,'#f1cf69',26,32,4,4);rect(c,'#f1cf69',35,32,4,4);rect(c,'#e4cfa4',29,43,2,4);rect(c,'#e4cfa4',34,43,2,4);
    }else{
      rect(c,'#654746',21,50-bob,8,15);rect(c,'#654746',37,50+bob,8,14);oval(c,'#a64b43',33,43,16,15);oval(c,'#ce6955',32,28,16,15);polygon(c,'#d69c66',[[18,24],[7,19],[15,32]]);polygon(c,'#d69c66',[[46,24],[58,19],[50,32]]);oval(c,'#d59c77',32,35,11,7);rect(c,'#403d41',23,27,5,3);rect(c,'#403d41',37,27,5,3);rect(c,'#e8dab1',23,34,4,6);rect(c,'#e8dab1',38,34,4,6);rect(c,'#6d443e',29,34,3,3);rect(c,'#6d443e',34,34,3,3);rect(c,'#c2a36c',20,47,25,4);rect(c,'#f1d392',30,46,5,6);c.save();c.translate(51,45);c.rotate(windup?-.35-t*.72:strike?.37+t*1.23:wave*.07);rect(c,'#654b3d',-2,-17,5,35);oval(c,'#8e7453',0,-20,7,10);rect(c,'#b49b6b',-4,-25,3,6);c.restore();
    }
    return outline(canvas);
  }
  // Species identities are separate from the four shared combat archetypes.
  function enemy(id,frame,action='idle'){
    const base={chuchu:'slime',blue_chuchu:'slime',deku_baba:'mushroom',keese:'bat',bokoblin:'boar',gloom_bokoblin:'boar'};
    if(base[id]){
      const original=archetypeEnemy(base[id],frame,action,id);if(id!=='blue_chuchu'&&id!=='gloom_bokoblin')return original;
      const result=surface(64,72),ctx=result.getContext('2d');ctx.drawImage(original,0,0);const pixels=ctx.getImageData(0,0,64,72);
      for(let i=0;i<pixels.data.length;i+=4)if(pixels.data[i+3]&&pixels.data[i]+pixels.data[i+1]+pixels.data[i+2]>130){if(id==='blue_chuchu'){const green=pixels.data[i+1];pixels.data[i]=Math.round(pixels.data[i]*.75);pixels.data[i+1]=Math.round(green*.8);pixels.data[i+2]=Math.min(255,green+35);}else{pixels.data[i]=Math.min(255,pixels.data[i]*.6+45);pixels.data[i+1]*=.35;pixels.data[i+2]*=.65;}}
      ctx.putImageData(pixels,0,0);return result;
    }
    if(['slime','mushroom','bat','boar','boss'].includes(id))return archetypeEnemy(id,frame,action);
    const canvas=surface(64,72),c=canvas.getContext('2d'),[style,color]=MOB_MOTION[id]||MOB_MOTION.boar;
    mobTell(c,id,action,frame,style,color);
    const {wave,bob,t,power}=enemyMotion(c,64,72,action,frame,style),windup=action==='windup',strike=action==='attack';
    if(id==='skulltula'){
      for(const s of[-1,1])for(let i=0;i<4;i++){const y=28+i*8,step=Math.round(fSin(frame+i*2)*4);line(c,'#a0824f',32+s*9,y,32+s*(23+i%2*5),y-9+step,3);line(c,'#b9a471',32+s*(23+i%2*5),y-9+step,32+s*(25-i%2*3+(strike?3*power:0)),y+10-step,3);}
      oval(c,'#a99665',32,36,13,19);oval(c,'#e1d6a8',32,33,10,12);oval(c,'#3d3942',27,32,4,5);oval(c,'#3d3942',38,32,4,5);rect(c,'#51433e',30,38,5,6);for(let x=25;x<41;x+=5)rect(c,'#e6dcb8',x,45,3,5);
    }else if(id==='deku_scrub'){
      polygon(c,'#3c773e',[[11,56],[21,42],[28,49],[41,39],[54,57]]);oval(c,'#855b38',32,40+bob,14,17);oval(c,'#b0884d',28,36+bob,10,12);rect(c,'#eeb95c',24,33+bob,4,5);rect(c,'#eeb95c',37,33+bob,4,5);oval(c,'#563c30',33,46+bob,7,6);rect(c,'#b39258',30,42+bob,15,8);rect(c,'#302e35',40,44+bob,5,4);polygon(c,'#78a44e',[[32,27],[16,18],[17,30],[30,31],[45,12],[46,27]]);
    }else if(id==='octorok'){
      for(let i=0;i<4;i++)oval(c,'#a64848',14+i*12,58+Math.round(Math.sin(frame+i)*2),8,5);
      oval(c,'#c75f59',32,40+bob,20,18);oval(c,'#e98e73',26,34+bob,13,10);oval(c,'#eee7c7',24,40+bob,5,6);oval(c,'#eee7c7',40,40+bob,5,6);rect(c,'#2f3541',24,41+bob,2,4);rect(c,'#2f3541',38,41+bob,2,4);oval(c,'#a44445',32,51+bob,7,9);oval(c,'#442e3a',32,55+bob,5+(windup?2*t:0),5+(strike?3*power:0));
    }else if(id==='tektite'){
      for(const s of[-1,1])for(const d of[-1,1]){line(c,'#bb6c43',32+s*7,42,32+s*24,35+d*11+bob,3);line(c,'#e0a66b',32+s*24,35+d*11+bob,32+s*22,58+d*5,3);}oval(c,'#af5e42',32,39+bob,14,12);oval(c,'#eaa769',30,35+bob,10,7);oval(c,'#ead9a3',32,41+bob,7,7);rect(c,'#40333e',31,36+bob,3,10);
    }else if(id==='lizalfos'){
      polygon(c,'#41734f',[[24,56],[7,62],[12,50],[23,45]]);rect(c,'#4b8054',25,50-bob,7,14);rect(c,'#4b8054',39,50+bob,7,14);oval(c,'#558c57',33,41,12,16);oval(c,'#6ea960',34,25+bob,12,11);rect(c,'#8dbb6e',34,27+bob,21,9);rect(c,'#e4d490',40,28+bob,5,3);rect(c,'#313d39',38,22+bob,4,3);for(let y=18;y<51;y+=8)polygon(c,'#ba9362',[[23,y],[16,y+5],[25,y+8]]);line(c,'#a9c4ca',49,47,windup?44-t*9:58,windup?25-t*14:strike?43+power*8:34,4);rect(c,'#8b6b47',45,46,9,3);
    }else if(id==='seahat'){
      oval(c,'#b89c63',32,43,13,16);rect(c,'#e7ce87',28,33,8,20);rect(c,'#41414c',25,42,5,4);rect(c,'#41414c',36,42,5,4);line(c,'#6a6349',32,18,32,30,3);c.save();c.translate(32,19);c.rotate(frame*(strike?1.09:windup?.38:Math.PI/4));for(let i=0;i<4;i++){c.rotate(Math.PI/2);polygon(c,'#e4d9ac',[[0,0],[4,-24],[11,-12],[5,0]]);}c.restore();
    }else if(id.startsWith('shadow_')){
      if(id==='shadow_kargarok'){for(const s of[-1,1])polygon(c,'#343444',[[32,35],[32+s*28,18+bob*5],[32+s*22,43],[32+s*12,49]]);oval(c,'#272b39',32,39,8,15);polygon(c,'#bd765a',[[30,23],[43,31],[32,32]]);rect(c,'#e27c60',30,29,5,3);}
      else if(id==='shadow_vermin'){oval(c,'#2a2d3b',32,48,17,12);for(const s of[-1,1])for(let i=0;i<3;i++)line(c,'#515069',32+s*11,42+i*7,32+s*24,40+i*9+bob,3);rect(c,'#ef985b',24,43,4,5);rect(c,'#ef985b',37,43,4,5);}
      else{rect(c,'#272a37',22,48-bob,9,18);rect(c,'#272a37',36,48+bob,9,18);oval(c,'#343440',32,35,17,20);line(c,'#30313e',17,30,7-(strike?power*3:0),55-bob-(windup?t*26:0),8);line(c,'#30313e',46,30,56+(strike?power*4:0),55+bob-(windup?t*27:0),8);polygon(c,'#68616a',[[21,13],[43,13],[47,29],[32,38],[17,29]]);for(const x of[24,34])rect(c,'#ed986b',x,18,4,12);rect(c,'#93beb1',29,37,6,14);}
    }else if(id==='remlit'){
      oval(c,'#c4a16f',32,46,17,13);oval(c,'#e9c891',32,32+bob,15,13);polygon(c,'#ae8c68',[[19,28+bob],[13,9+bob],[29,22+bob]]);polygon(c,'#ae8c68',[[36,22+bob],[52,9+bob],[46,29+bob]]);for(const x of[23,37]){oval(c,'#ad7e91',x,30+bob,5,5);rect(c,'#3f3b4a',x,28+bob,2,6);}rect(c,'#67454a',30,38+bob,5,3);line(c,'#d5b680',47,48,57,34-bob*2-(windup?t*7:0)+(strike?power*6:0),4);rect(c,'#bd956a',21,54-bob,6,10);rect(c,'#bd956a',38,54+bob,6,10);
    }else if(id==='little_frox'){
      oval(c,'#416375',32,46,22,16);oval(c,'#6a8c93',29,41,17,12);for(const[x,y]of[[17,36],[45,36],[22,29],[42,28]]){polygon(c,'#859792',[[x-4,y],[x,y-5],[x+4,y],[x+2,y+3]]);}oval(c,'#344d60',32,32+bob,9,10);oval(c,'#d6c47e',32,31+bob,6,7);oval(c,'#b06d41',32,31+bob,4,5);rect(c,'#39333c',31,26+bob,2,10);rect(c,'#f4df9b',29,27+bob,2,2);rect(c,'#243b4d',19,48,27,windup?5:strike?9+power*4:7);for(let x=22;x<44;x+=7)polygon(c,'#e4d3a0',[[x,48],[x+4,48],[x+2,54]]);oval(c,'#38536a',12,57+bob,9,5);oval(c,'#38536a',51,57-bob,9,5);
    }else if(id==='evermean'){
      rect(c,'#695447',24,25,17,30);rect(c,'#a0875c',27,27,5,22);line(c,'#645448',27,51,15,64-bob,6);line(c,'#645448',38,51,49,64+bob,6);line(c,'#6c5948',24,34,10,47-bob-(windup?t*23:0),5);line(c,'#6c5948',41,34,55,47+Math.round(wave*2)-(windup?t*20:0)+(strike?power*9:0),5);for(const[x,y]of[[18,21],[32,13],[47,22]]){oval(c,'#3f614a',x,y,15,13);oval(c,'#6e8954',x-3,y-3,11,9);}rect(c,'#d6ad70',27,36,4,4);rect(c,'#d6ad70',36,36,4,4);rect(c,'#3e3a39',29,44,8,5);
    }else if(id==='takkuri'){
      for(const s of[-1,1])polygon(c,'#765f4b',[[32,35],[32+s*28,16+bob*5],[32+s*24,43],[32+s*8,45]]);oval(c,'#4d4b47',32,42,10,16);oval(c,'#ac8b6c',34,27+bob,9,9);polygon(c,'#d4b475',[[39,25+bob],[54,32+bob],[39,35+bob]]);rect(c,'#eddbb1',35,24+bob,4,4);rect(c,'#38383e',37,24+bob,2,3);for(const x of[27,36])line(c,'#bd9264',x,55,x,64,3);
    }
    return outline(canvas);
  }

  // The Master's beam is a curling energy front. +X is forward; -X is the wake.
  function swordWave(direction,frame){
    const canvas=surface(64,64),c=canvas.getContext('2d');
    c.translate(32,32);c.rotate(direction*Math.PI/4);
    const beat=Math.max(0,Math.min(7,frame))/7,spread=Math.sin(beat*Math.PI/2);
    const span=16+10*spread,skew=(beat-.4)*4;
    const point=(t,lag,spread=1)=>[-15+38*Math.pow(Math.max(0,Math.cos(t*Math.PI/2)),.72)-lag+t*skew,t*span*spread];
    const ribbon=(color,from,to,lag,width,scale=1)=>{
      const front=[],back=[];
      for(let i=0;i<=24;i++){
        const f=i/24,t=from+(to-from)*f,[x,y]=point(t,lag,scale);
        const band=.6+width*Math.pow(Math.sin(f*Math.PI),.73);
        front.push([Math.round(x),Math.round(y)]);back.push([Math.round(x-band),Math.round(y)]);
      }
      polygon(c,color,front.concat(back.reverse()));
    };
    // Two expanding, open echoes give the arc a wake without suggesting a blade or a hilt.
    if(frame>0){
      c.globalAlpha=.28+.19*(1-beat);
      ribbon('#3cb4bb',-.91,.91,8+beat*6,2.2,.85+beat*.08);
      if(frame>2)ribbon('#66dac1',-.70,.56,16+beat*4,1.5,.76);
      c.globalAlpha=1;
    }
    ribbon('#4abbb3',-1,1,0,8.2-beat*3);
    ribbon('#91f1cd',-.96,.96,.25,5.8-beat*2.7);
    ribbon('#ecffe3',-.79,.83,.15,2.2-beat*.75);
    for(let i=0;i<5;i++){
      const t=(i-2)*.425+.07*Math.sin(frame*2+i),[x,y]=point(t,9+(i%3)*3+beat*6,.99);
      const n=(i+frame)%3===0?3:2;
      rect(c,i%2?'#c2f9d9':'#63c8bd',x-3,y,n+1,1);
      if((i+frame)%2===0)rect(c,'#adf8d1',x-7,y+(i>2?2:-2),2,1);
    }
    return canvas;
  }
  function projectile(id,direction,frame){
    if(id==='ember')return swordWave(direction,frame);
    const canvas=surface(40,40),c=canvas.getContext('2d');c.translate(20,20);c.rotate(direction*Math.PI/4);
    if(id==='bomb'){c.rotate(-direction*Math.PI/4);oval(c,'#25394c',0,3,9,10);oval(c,'#4f7185',-3,0,5,6);rect(c,'#d2ad6b',-2,-9,4,4);line(c,'#a07b4e',0,-9,4,-14,2);rect(c,frame%2?'#eeab52':'#fff2ae',4,-16,3+frame%2,4);}
    else if(id==='boomerang'){c.rotate(frame*Math.PI/4);polygon(c,'#795947',[[-13,-3],[-4,-7],[9,-3],[12,5],[7,8],[2,0],[-6,-1],[-13,3]]);line(c,'#dfbd7c',-10,-2,-4,-4,2);line(c,'#b2d68b',-2,-4,7,0,2);}
    // Directional effects are authored facing +X. The renderer rotates them from world velocity.
    else if(id==='slingshot'){
      line(c,'#8d857a',-14,0,-2,0,1);line(c,'#ddc394',-8,-1,-2,-1,1);
      polygon(c,'#786660',[[0,-3],[5,-4],[9,-1],[8,2],[4,4],[0,2]]);
      polygon(c,'#d1b69d',[[1,-2],[5,-3],[8,-1],[5,1],[1,0]]);
      rect(c,'#eee4c4',3,-2,2,1);
    }
    else if(id==='waterShot'){
      const f=frame%3;
      polygon(c,'#438eae',[[-18,2],[-10,-3],[-7,-3],[-4,-6],[7,-7],[15,-3],[17,0],[13,4],[5,7],[-7,5]]);
      polygon(c,'#94deed',[[-10,2],[-5,-1],[1,-5],[7,-5],[14,-2],[14,1],[7,3],[0,4]]);
      line(c,'#e3faf2',2,-3,10,-3,2);rect(c,'#b5e9e9',-16+f,5,3,1);rect(c,'#8bc3db',-12-f,-6,2,1);
    }
    else if(id==='moonKick'){
      oval(c,'#48455f',1,0,13,13);oval(c,'#8e929e',2,-1,11,11);
      polygon(c,'#c6bd9d',[[1,-11],[7,-10],[11,-7],[12,2],[7,8],[1,10],[-3,6],[-5,0],[-1,-7]]);
      oval(c,'#d5d2ae',7,-6,3,3);oval(c,'#6e7187',-6,-5,3,3);
      line(c,'#533b50',-6,-4,-2,-2,2);line(c,'#533b50',3,-2,8,-5,2);rect(c,'#e6a06e',-4,-3,2,2);rect(c,'#e6a06e',5,-4,2,2);
      polygon(c,'#594650',[[-6,3],[-2,2],[3,2],[7,4],[5,7],[-3,7]]);line(c,'#e6dabb',-3,4,5,4);
      if(frame%2===0){rect(c,'#d2a6a0',-16,-4,4,1);rect(c,'#9f8295',-17,6,4,1);}
    }
    else if(id==='impaNeedle'||id==='kunai'){
      polygon(c,'#795b9d',[[-18,0],[-10,-2],[13,-2],[18,0],[13,2],[-10,2]]);
      line(c,'#d7c9f7',-11,0,14,0,2);line(c,'#fff7e4',4,-1,16,-1);
      if(frame%2===0){rect(c,'#ceb4ec',-17,2,4,1);rect(c,'#eee0ff',-18,-2,2,1);}
    }
    else if(id==='leaf'){
      line(c,'#ad733a',-16,0,12,0,3);line(c,'#fff5c7',-14,0,12,0,1);
      polygon(c,'#eab967',[[6,-5],[18,0],[6,5],[8,0]]);
      polygon(c,'#fff1aa',[[10,-3],[17,0],[10,1]]);
      polygon(c,'#8acaba',[[-16,-4],[-11,-3],[-8,0],[-13,0]]);
      polygon(c,'#9fe1ce',[[-16,4],[-11,3],[-8,0],[-13,0]]);
      rect(c,frame%2?'#e4bc67':'#fff2c8',-18,0,2,1);
    }
    else if(id==='shadowHand'){
      polygon(c,'#332047',[[-17,4],[-10,-2],[-10,-8],[-2,-13],[5,-12],[8,-8],[15,-11],[18,-9],[13,-5],[18,-5],[18,-1],[13,1],[17,3],[16,6],[11,5],[11,9],[7,12],[-1,12],[-8,7],[-16,9]]);
      polygon(c,'#63406f',[[-12,3],[-6,-1],[-7,-6],[-1,-10],[6,-9],[8,-6],[11,-6],[12,0],[9,6],[5,9],[-1,9],[-7,5]]);
      line(c,'#7ed2bf',-11,4,-4,2,2);line(c,'#a6f5d6',-3,-2,1,-7,2);
      line(c,'#85d6c8',1,-7,7,-5,2);line(c,'#85d6c8',7,-5,4,1,2);
      line(c,'#ab8bcc',10,-7,15,-9);line(c,'#e3a96d',12,1,16,0);
      if(frame%2===0){rect(c,'#82639b',-17,-5,2,2);rect(c,'#9addce',0,14,2,2);}
    }
    else if(id==='shadowRune'){
      polygon(c,'#352341',[[0,-13],[8,-7],[10,3],[0,12],[-10,3],[-8,-7]]);
      polygon(c,'#81548c',[[0,-9],[6,-5],[7,2],[0,8],[-7,2],[-6,-5]]);
      line(c,'#9edfc7',-4,1,0,-4,2);line(c,'#9edfc7',0,-4,4,1,2);rect(c,'#ffe1a2',-1,2,3,3);
    }
    else if(id==='hostile'){c.rotate(-direction*Math.PI/4);oval(c,'#a45b88',0,0,7+frame%2,7+frame%2);oval(c,'#f0afba',-1,-1,5,5);rect(c,'#fff2cd',-3,-3,3,3);}
    else{polygon(c,'#77cbbf',[[-16,-3],[8,-3],[17,0],[8,3],[-16,3]]);rect(c,'#d6fff0',-10,-1,23,2);rect(c,'#e5d394',-11,-6,3,12);}
    return outline(canvas);
  }
  function artRandom(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function tree(realm,variant=0) {
    const canvas=surface(112,144),c=canvas.getContext('2d'),rand=artRandom(719+realm*191+variant*137);
    const palettes=[['#214737','#376e40','#599846','#94bd65'],['#285c47','#3c8b58','#6fba73','#a4d17c'],['#2c304b','#494469','#686185','#a291af'],['#31563e','#527d46','#80aa58','#c1d887'],['#353745','#5d5a68','#8c8790','#cbc3b2'],['#45483d','#737c4e','#a7a15b','#d9c982'],['#214834','#3c7440','#659f4e','#a4c77a'],['#305b4e','#4a8663','#77ab78','#b2cd92']];
    const p=palettes[realm],trunk=realm===4?'#6c6471':realm===2?'#514955':'#78583d';
    if(realm===1){
      polygon(c,'#503f33',[[49,138],[63,138],[69,70],[65,35],[57,35],[59,76]]);polygon(c,'#a58b55',[[52,134],[57,133],[65,74],[63,43],[60,45],[61,78]]);
      for(let y=65;y<136;y+=9)line(c,'#534933',55,y,64,y-2,2);
      for(const side of[-1,1])for(let branch=0;branch<4;branch++){
        const y=30+branch*5,ex=57+side*(44-branch*5),ey=17+branch*11;
        polygon(c,p[0],[[58,38],[ex,ey],[ex+side*4,ey+18],[56,44]]);
        polygon(c,p[2],[[59,35],[ex,ey],[ex-side*8,ey+8],[57,40]]);
        line(c,p[3],59,35,ex,ey+1,1);
        for(let j=1;j<5;j++){const t=j/5,x=59+(ex-59)*t,py=35+(ey-35)*t;line(c,p[1],x,py,x-side*5,py+12,2);}
      }
      for(const x of[51,62,70])oval(c,'#8e7344',x,46,5,6);
    }else if(realm===4){
      polygon(c,'#393945',[[44,141],[68,141],[63,86],[75,50],[66,18],[59,21],[63,52],[54,81]]);
      polygon(c,p[2],[[51,137],[57,138],[57,84],[69,50],[64,25],[62,25],[65,49],[50,85]]);
      for(const [x,y,side]of[[53,92,-1],[63,70,1],[65,48,-1]]){line(c,p[1],x,y,x+side*24,y-23,6);line(c,p[2],x,y-2,x+side*24,y-24,2);}
      for(const[x,y]of[[38,83],[72,67],[48,46],[65,110]]){oval(c,'#285d6b',x,y,14,5);oval(c,'#77d4d0',x-2,y-2,11,3);rect(c,'#d0f4df',x-7,y-3,6,1);}
    }else{
      const giant=realm===6,wide=giant?12:0;
      polygon(c,'#453e32',[[39-wide,142],[72+wide,142],[65+wide/2,102],[66,59],[48,56],[46-wide/2,107]]);
      polygon(c,trunk,[[44-wide,139],[67+wide,139],[60+wide/2,101],[62,62],[51,62],[50-wide/2,111]]);
      line(c,'#ac8455',49-wide/2,128,54-wide/2,76,3);line(c,'#443d31',61+wide/2,133,58+wide/2,87,2);
      for(const side of[-1,1]){line(c,trunk,56,82,56+side*27,50,7);line(c,'#a17b4b',55,79,55+side*25,50,2);line(c,trunk,53+side*4,126,53+side*23,139,5);}
      const clusters=[[54,24,24,17],[29,38,22,19],[79,38,23,18],[18,61,15,17],[94,59,15,18],[48,47,26,21],[73,60,26,22],[32,69,25,22],[54,80,25,19],[81,79,20,17],[19,85,14,12]];
      for(const[cx,cy,rx,ry]of clusters){
        const x=cx+Math.floor(rand()*5)-2,y=cy+Math.floor(rand()*5)-2;oval(c,p[0],x,y,rx,ry);oval(c,p[1],x-2,y-3,rx-2,ry-3);
        for(let i=0;i<13;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand()),lx=Math.round(x+Math.cos(a)*r*(rx-5)),ly=Math.round(y+Math.sin(a)*r*(ry-5));
          const color=ly<y-2?p[2]:p[1];polygon(c,color,[[lx-5,ly],[lx-2,ly-4],[lx+3,ly-3],[lx+6,ly],[lx+3,ly+3],[lx-3,ly+3]]);
          if(i%3===0){rect(c,p[3],lx-3,ly-2,4,1);rect(c,p[2],lx+2,ly,3,1);}
        }
      }
      if(realm===7)for(let i=0;i<18;i++){const x=14+rand()*84,y=62+rand()*27;line(c,p[1],x,y,x-2,y+15+rand()*13,2);rect(c,p[2],x-3,y+9,3,5);}
      if(realm===3)for(const[x,y]of[[28,47],[75,36],[47,67],[86,70]]){oval(c,'#a56c42',x,y,4,5);rect(c,'#edd38a',x-1,y-3,2,2);}
      if(giant){
        line(c,'#5a4934',40,106,51,103,3);line(c,'#5a4934',63,103,76,106,3);rect(c,'#332f2c',43,109,7,4);rect(c,'#332f2c',65,109,7,4);
        polygon(c,'#b49461',[[55,106],[60,105],[64,122],[53,122]]);line(c,'#443a2c',47,129,67,129,3);line(c,'#b79461',47,133,66,133,2);
      }
      if(realm===2)for(const[x,y]of[[27,67],[77,51],[52,38]]){rect(c,'#c9ad96',x,y,1,6);rect(c,'#eab986',x-2,y+2,5,1);}
    }
    return outline(canvas);
  }
  function plant(realm,variant=0){
    const canvas=surface(48,48),c=canvas.getContext('2d'),dark=realm===2?'#53506e':realm===4?'#536e79':'#365e3f',mid=realm===4?'#75afb1':realm===2?'#8b7a9e':'#639557',light=realm===4?'#b9ead4':'#a4c67e';
    if(realm===7&&variant===1){
      for(let i=0;i<7;i++){const x=6+i*6,y=10+i%3*5;line(c,'#5b8359',x,45,x,y,1);line(c,'#aac88c',x+1,42,x+2,y+3,1);polygon(c,'#799d67',[[x,41],[x-5,24],[x-2,37]]);if(i%2===0){rect(c,'#826544',x-1,y-6,3,9);rect(c,'#c4a276',x-1,y-6,1,5);}}
    }else if(variant===1){
      for(const side of[-1,1])for(let branch=0;branch<3;branch++){const ex=24+side*(18-branch*3),ey=17-branch*5;line(c,dark,24,44,ex,ey,2);for(let j=1;j<6;j++){const t=j/6,x=24+(ex-24)*t,y=44+(ey-44)*t;line(c,mid,x,y,x+side*(7-j*.6),y-5,2);line(c,light,x,y-1,x+side*3,y-5,1);}}
    }else if(variant===2){
      for(const[x,y,rx,ry]of[[13,31,10,10],[30,24,13,13],[34,35,11,8],[21,37,13,9]]){oval(c,dark,x,y,rx,ry);oval(c,mid,x-2,y-3,rx-2,ry-3);line(c,light,x-5,y-5,x,y-6,1);}
      const berry=realm===4?'#bbdcbe':realm===2?'#e4b299':'#d9aa6d';for(const[x,y]of[[13,29],[30,20],[32,32]]){rect(c,berry,x,y,3,3);rect(c,'#f5de9e',x,y,1,1);}
    }else if(variant===3){
      for(const[x,y,r]of[[15,29,10],[33,33,8],[27,19,7]]){rect(c,realm===4?'#96c3be':'#c0aa7b',x-2,y,4,15);oval(c,dark,x,y,r,4);oval(c,realm===4?'#69ced3':realm===2?'#b692ba':'#b6794e',x,y-3,r,r*.6);rect(c,light,x-5,y-5,4,2);rect(c,'#efe5b5',x+2,y-2,2,2);}
    }else{
      for(const[x,y]of[[9,26],[24,14],[38,24]]){line(c,dark,x,44,x,y,2);polygon(c,mid,[[x,37],[x-7,29],[x-5,38]]);polygon(c,light,[[x+1,33],[x+7,27],[x+5,34]]);
        const petal=realm===2?'#d9b3ce':realm===5?'#d6b36e':realm===4?'#a8e4dd':'#f3e3b4';rect(c,petal,x-4,y,9,3);rect(c,petal,x-1,y-3,3,9);rect(c,realm===4?'#e7f2c9':'#d8a459',x-1,y,3,3);}
    }
    return outline(canvas);
  }
  function prop(realm,variant=0){
    const canvas=surface(64,64),c=canvas.getContext('2d'),stone=realm===2?'#888099':realm===4?'#87868c':'#a5ad91',shade=realm===2?'#4d4c66':'#626f65',green=realm===4?'#86c3b0':'#648854';
    if(variant===0){
      polygon(c,'#514436',[[8,38],[47,26],[58,34],[52,45],[17,56],[7,49]]);polygon(c,'#90704b',[[9,37],[47,27],[54,32],[15,44]]);line(c,'#ba9865',14,38,46,30,2);line(c,'#594b38',21,42,51,34,2);oval(c,'#b99c68',13,46,8,9);oval(c,'#735b3e',13,46,5,6);oval(c,'#c6aa77',13,46,3,4);line(c,green,26,40,45,35,3);
    }else if(variant===1){
      polygon(c,shade,[[19,57],[45,57],[42,18],[34,13],[21,21]]);rect(c,stone,23,20,17,32);rect(c,'#c3c5ad',23,19,4,27);line(c,shade,29,25,35,30,2);line(c,shade,35,30,30,36,2);rect(c,green,22,46,16,5);rect(c,'#b4c68d',22,45,8,1);line(c,'#e1d2aa',30,25,33,25,1);
    }else if(variant===2){
      rect(c,'#584b38',29,23,5,36);polygon(c,'#9b7d50',[[10,18],[43,14],[53,23],[43,31],[10,34]]);line(c,'#dac28a',12,20,42,17,2);line(c,'#604f39',14,27,40,23,2);rect(c,'#d6c28a',22,23,9,2);rect(c,'#bc9b60',27,36,2,17);for(const x of[12,40])rect(c,'#dac591',x,22,2,2);
    }else{
      polygon(c,'#635240',[[18,35],[46,35],[43,55],[22,55]]);rect(c,'#b6935b',22,37,20,15);line(c,'#e0c285',24,38,24,50,2);rect(c,'#5b5d46',19,33,28,4);for(const s of[-1,1]){polygon(c,green,[[32,35],[32+s*20,15],[32+s*18,31]]);line(c,'#a2c480',32,34,32+s*16,20,1);}line(c,green,32,33,32,9,2);rect(c,realm===4?'#b4eee1':'#e9c882',29,8,7,6);
    }
    return outline(canvas);
  }
  // The Ultimate has its own cratered, red-eyed face. The distant scenery Moon stays unchanged.
  function moonCrashFace(){
    const canvas=surface(96,96),c=canvas.getContext('2d');
    const shell=[[46,3],[62,5],[76,12],[86,24],[91,40],[90,56],[84,72],[72,84],[56,91],[39,92],[22,84],[10,73],[5,59],[4,43],[9,28],[17,16],[30,7]];
    polygon(c,'#292a27',shell);polygon(c,'#595b53',[[43,4],[62,6],[76,12],[87,27],[90,42],[84,61],[69,78],[48,87],[29,83],[15,74],[7,57],[6,43],[13,25],[25,12]]);
    polygon(c,'#87877a',[[39,6],[62,7],[74,13],[84,25],[84,41],[73,55],[50,67],[28,70],[16,63],[12,53],[13,38],[20,21],[29,13]]);
    polygon(c,'#b2ae9d',[[24,18],[38,9],[59,9],[72,14],[78,23],[65,20],[59,26],[34,29],[15,40],[17,28]]);
    c.save();c.beginPath();shell.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
    const random=artRandom(3466);
    for(let j=0;j<145;j++){
      const x=6+Math.floor(random()*84),y=4+Math.floor(random()*86),n=1+Math.floor(random()*3);
      rect(c,['#d0cabc','#9a9889','#454743','#747367','#b8b4a3','#333530'][j%6],x,y,n,1+j%2);
    }
    for(const [x,y,r] of [[26,17,5],[45,12,4],[57,19,6],[73,22,4],[15,40,4],[82,68,3],[19,73,4],[55,85,4],[27,83,3],[75,34,3],[9,55,3]]){
      oval(c,'#aeab9a',x+1,y+1,r+1,r);oval(c,'#464842',x,y,r,r*.8);oval(c,'#66685e',x-1,y+1,Math.max(1,r-1),Math.max(1,r*.5));
    }
    c.restore();
    // Deep unequal sockets and sharp craggy brows make the gaze readable at game scale.
    polygon(c,'#3b3c35',[[14,38],[19,28],[27,23],[36,25],[45,34],[45,44],[37,54],[27,54],[17,49]]);
    polygon(c,'#0d1010',[[16,39],[22,30],[28,28],[36,30],[42,38],[40,47],[34,51],[26,51],[19,47]]);
    polygon(c,'#3b3b33',[[53,39],[61,35],[70,36],[81,44],[84,53],[80,63],[70,66],[60,62],[52,53]]);
    polygon(c,'#101112',[[55,44],[62,39],[71,40],[79,46],[80,53],[76,60],[68,63],[60,58],[55,52]]);
    line(c,'#aeaa96',19,29,26,25,2);line(c,'#a09c88',29,25,39,30,2);
    line(c,'#a9a492',55,40,63,36,2);line(c,'#9d9986',68,37,78,42,2);
    for(const [x,y,r] of [[29,41,8],[68,51,7]]){
      oval(c,'#722718',x,y,r+1,r);oval(c,'#a8441c',x,y,r,r*.88);oval(c,'#de7925',x,y,r-1.7,r*.73);
      oval(c,'#e9bd46',x,y,r-3.2,r*.47);oval(c,'#f2d968',x,y,r-4.4,r*.35);oval(c,'#13130f',x,y,1.7,1.9);
      rect(c,'#f7df8a',x-2,y-2,1,1);
    }
    polygon(c,'#5c5c51',[[45,32],[52,37],[55,51],[59,57],[54,65],[42,63],[37,58],[43,51]]);
    polygon(c,'#aaa594',[[46,37],[50,39],[50,51],[55,57],[49,60],[41,57],[46,51]]);
    line(c,'#c9c2ad',47,41,47,50,2);line(c,'#3b3d36',40,57,45,61,2);
    // Off-center grin, individually shaded old teeth and a stone lip rather than a uniform white stripe.
    polygon(c,'#3e3d34',[[14,56],[24,59],[34,62],[46,66],[61,68],[75,64],[81,63],[77,72],[65,80],[49,84],[34,82],[22,76],[17,68]]);
    polygon(c,'#171916',[[17,59],[26,63],[36,66],[49,70],[61,71],[75,66],[72,73],[63,78],[49,81],[36,79],[24,73],[20,67]]);
    for(const [x,y,w,h,d] of [[22,62,6,8,2],[29,65,7,9,1],[37,68,7,9,1],[45,70,8,9,0],[54,71,8,8,-1],[63,70,7,6,-2],[71,68,4,4,-2]]){
      polygon(c,'#858373',[[x,y],[x+w,y+d],[x+w-1,y+h+d],[x+1,y+h-1]]);
      polygon(c,'#c8c4ac',[[x+1,y+1],[x+w-1,y+d+1],[x+w-2,y+h+d-2],[x+2,y+h-3]]);
    }
    line(c,'#8e8a7b',20,74,29,80,1);line(c,'#737467',36,84,51,86,1);line(c,'#727368',62,83,71,78,1);
    return outline(canvas);
  }
  function moon(){const canvas=surface(80,80),c=canvas.getContext('2d');oval(c,'#70767c',40,40,35,35);oval(c,'#b0b4aa',37,36,31,31);oval(c,'#d0cdb6',32,31,23,25);for(const[x,y,r]of[[25,17,5],[56,23,4],[17,44,4],[62,48,6],[38,11,3]])oval(c,'#8e968e',x,y,r,r);oval(c,'#676c65',27,36,10,12);oval(c,'#676c65',53,36,10,12);oval(c,'#decb8b',27,38,5,7);oval(c,'#decb8b',53,38,5,7);rect(c,'#b84d38',27,36,2,5);rect(c,'#b84d38',52,36,2,5);polygon(c,'#8a8f7a',[[37,34],[44,33],[48,51],[36,51]]);oval(c,'#4b514a',40,58,20,10);for(let x=23;x<60;x+=6)rect(c,'#e4dec3',x,54,4,7);rect(c,'#e4dec3',27,65,27,2);return outline(canvas);}
  function clock(){const canvas=surface(64,64),c=canvas.getContext('2d');oval(c,'#433d49',32,32,29,29);oval(c,'#cfb879',32,32,26,26);oval(c,'#f5e5b8',32,32,23,23);for(let i=0;i<12;i++){const a=i*Math.PI/6;rect(c,'#685344',Math.round(31+Math.sin(a)*19),Math.round(31-Math.cos(a)*19),2,3);}rect(c,'#685344',31,15,3,19);polygon(c,'#685344',[[31,30],[47,40],[44,43],[30,34]]);oval(c,'#9b6744',32,32,3,3);return outline(canvas);}
  function visualVariant(kind,action,value){
    if(kind==='hero'&&(action==='attack'||action==='cast')&&WEAPON_GESTURES.has(value))return value;
    return (kind==='enemy'||kind==='boss')&&(value===1||value===true)?1:null;
  }
  function canvas(kind,id,direction=0,frame=0,action='idle',value=null) {
    const variant=visualVariant(kind,action,value),key=[kind,id,direction,frame,action,variant].join(':');
    if(!canvases.has(key)){
      let source;
      if(variant===1){
        const base=canvas(kind,id,direction,frame,action);
        source=surface(base.width,base.height);
        const ctx=source.getContext('2d');ctx.translate(base.width,0);ctx.scale(-1,1);ctx.drawImage(base,0,0);
      }else source=kind==='hero'?hero(id,direction,frame,action,variant):kind==='enemy'?enemy(id,frame,action):kind==='boss'?boss(id,frame,action,direction):kind==='projectile'?projectile(id,direction,frame):kind==='tree'?tree(id,frame):kind==='prop'?prop(id,frame):kind==='moon'?(id==='crash'?moonCrashFace():moon()):kind==='clock'?clock():plant(id,frame);
      canvases.set(key,source);
    }
    return canvases.get(key);
  }
  function textureFor(canvas) { const texture=new THREE.CanvasTexture(canvas);texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;return texture; }
  function material(kind,id,direction=0,frame=0,flash=false,action='idle',value=null) {
    const variant=visualVariant(kind,action,value),key=[kind,id,direction,frame,flash,action,variant].join(':');
    if(!materials.has(key)){
      let art=canvas(kind,id,direction,frame,action,variant);
      if(flash){const white=surface(art.width,art.height),c=white.getContext('2d');c.drawImage(art,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#fff1b5';c.fillRect(0,0,art.width,art.height);art=white;}
      const texture=textureFor(art);textures.set(key,texture);materials.set(key,new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.35,depthWrite:false,depthTest:!['hero','enemy','boss','projectile'].includes(kind)}));
    }
    return materials.get(key);
  }
  function sprite(kind,id,width,height,direction=0,frame=0){const sprite=new THREE.Sprite(material(kind,id,direction,frame));sprite.center.set(.5,0);sprite.scale.set(width,height,1);sprite.renderOrder=kind==='hero'?10:kind==='boss'?6:['enemy','projectile'].includes(kind)?5:0;return sprite;}
  function groundOverlay(realm,stage){
    const key='ground-overlay:'+realm+':'+stage;if(textures.has(key))return textures.get(key);
    const tile=surface(512,512),c=tile.getContext('2d'),rand=artRandom(871+realm*1237+stage*37),layout=BonkTerrain.layout(realm,stage),point=value=>256+value*4;
    const earth=['#b1a875','#e2ce9e','#97909f','#c1b891','#7b717a','#b3ab8c','#a29868','#c3c9a2'][realm];
    const moss=['#647c49','#cfb681','#514e71','#8aa55b','#535969','#748472','#4c7b41','#608c6a'][realm];
    c.globalAlpha=.23;
    for(const patch of layout.patches){const x=point(patch.x),y=point(patch.z),r=patch.radius*4;c.fillStyle=moss;c.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6,rad=r*(.8+rand()*.35);if(i)c.lineTo(Math.round(x+Math.cos(a)*rad),Math.round(y+Math.sin(a)*rad));else c.moveTo(Math.round(x+rad),Math.round(y));}c.closePath();c.fill();}
    c.globalAlpha=1;
    if(realm===1||realm===7){
      const coast=[];for(let i=0;i<17;i++)coast.push([point(14+Math.sin(i*.63+stage)*2),point(-40+i*5)]);
      const band=(offset,color)=>{c.fillStyle=color;c.beginPath();c.moveTo(512,coast[0][1]);for(const[x,y]of coast)c.lineTo(x+offset,y);c.lineTo(512,coast.at(-1)[1]);c.closePath();c.fill();};
      band(-14,realm===1?'#e3d2a1':'#b9c4a1');band(-5,'#8cbbaa');band(1,realm===1?'#4b9eab':'#4e94a8');band(18,realm===1?'#418e9e':'#43849e');
      for(let i=0;i<180;i++){const x=point(18+rand()*46),y=point(-37+rand()*74);rect(c,i%5===0?'#a6d9cc':'#70b5b9',x,y,3+rand()*12,1);if(i%8===0){oval(c,'#467b63',x,y,3,2);rect(c,'#9cbb7d',x-2,y,2,1);}}
      for(let i=0;i<70;i++){const y=point(-38+rand()*76),x=point(12+rand()*3);rect(c,i%3?'#a6b99b':'#e2dbb5',x,y,2,1);}
    }
    // Wide worn paths radiate from the shrine plaza into the surrounding terrain.
    c.lineCap='round';c.lineJoin='round';
    for(const trail of [{x:-48,z:-48},{x:48,z:-48},{x:0,z:55}]){
      const length=Math.hypot(trail.x,trail.z),nx=-trail.z/length,nz=trail.x/length,bend=(realm%2?1:-1)*1.3;
      c.strokeStyle=moss;c.lineWidth=21;c.beginPath();c.moveTo(256,256);c.bezierCurveTo(point(trail.x*.3+nx*bend),point(trail.z*.3+nz*bend),point(trail.x*.7-nx*bend),point(trail.z*.7-nz*bend),point(trail.x),point(trail.z));c.stroke();
      c.strokeStyle=earth;c.lineWidth=14;c.stroke();c.strokeStyle=realm===2?'#b1a6af':realm===4?'#998991':'#d1c79e';c.globalAlpha=.33;c.lineWidth=6;c.stroke();c.globalAlpha=1;
      for(let i=3;i<length*2;i++){
        const t=i/(length*2),side=(rand()-.5)*3.8,x=trail.x*t+nx*side,z=trail.z*t+nz*side,px=point(x),py=point(z);
        rect(c,realm===2||realm===4?(i%4?'#625d70':'#b8acb8'):(i%4?'#9c997b':'#ddd5b4'),px,py,1+rand()*2,1);
        if(i%5===0){rect(c,moss,point(x+nx*2),point(z+nz*2),2,2);}
      }
    }
    if(realm===1||realm===7)for(let x=16;x<40;x+=.65){c.save();c.translate(point(x),point(-x));c.rotate(-Math.PI/4);rect(c,'#665e49',-7,-2,14,3);rect(c,'#baa77a',-6,-2,12,1);c.restore();}
    oval(c,'#858d78',256,point(-7),17,17);oval(c,'#c3c5a4',256,point(-7),14,14);oval(c,'#a7b397',256,point(-7),10,10);
    for(const obstacle of layout.obstacles){if(obstacle.kind!=='tree')continue;const x=point(obstacle.x),y=point(obstacle.z);c.globalAlpha=.35;oval(c,'#3e5a42',x+2,y+2,9,4);c.globalAlpha=1;for(let i=0;i<6;i++)rect(c,i%2?earth:moss,x+(rand()-.5)*16,y+(rand()-.5)*10,2,1);}
    if(realm===2||realm===4){
      for(let i=0;i<35;i++){const x=(rand()-.5)*104,z=(rand()-.5)*104;if(Math.hypot(x,z)<7)continue;const color=realm===4?'#b35e83':'#b1baae';c.globalAlpha=.6;line(c,color,point(x),point(z),point(x)+8,point(z)+5,1);line(c,color,point(x)+8,point(z)+5,point(x)+5,point(z)+10,1);}c.globalAlpha=1;
    }
    const texture=textureFor(tile);texture.generateMipmaps=true;texture.minFilter=THREE.NearestMipmapNearestFilter;textures.set(key,texture);return texture;
  }
  function surfaceTexture(kind,realm=0){
    const key='surface:'+kind+':'+realm;if(textures.has(key))return textures.get(key);
    const tile=surface(64,64),c=tile.getContext('2d'),rand=artRandom(119+realm*43);
    if(kind==='wood'){
      rect(c,'#806345',0,0,64,64);for(let x=0;x<64;x+=8){rect(c,'#514936',x,0,1,64);rect(c,'#b29462',x+1,0,1,64);for(let i=0;i<6;i++){const y=rand()*64;rect(c,i%2?'#9c7b51':'#6a563e',x+3,y,1,5+rand()*10);}}for(const[x,y]of[[13,19],[42,47]]){oval(c,'#5d4b37',x,y,3,5);oval(c,'#a17e51',x,y,1,3);}
    }else if(kind==='roof'){
      const p=realm===5?['#5d526b','#8d6d83','#b7979e']:realm===3?['#7b6045','#ad855a','#d2b27b']:['#34563d','#648450','#9aa56b'];rect(c,p[0],0,0,64,64);
      for(let y=0;y<64;y+=8)for(let x=-8;x<64;x+=16){const xx=x+(y/8%2)*8;rect(c,p[1],xx+1,y+1,14,6);rect(c,p[2],xx+2,y+1,12,1);rect(c,p[0],xx+13,y+2,1,5);}
    }else{
      rect(c,realm===2?'#5b596f':'#667a8d',0,0,64,64);for(let x=0;x<64;x+=4)rect(c,'#ffffff0c',x,0,1,64);line(c,'#dec995',6,0,6,64,2);line(c,'#dec995',57,0,57,64,2);
      for(const[x,y]of[[32,15],[24,29],[40,29]])polygon(c,'#e9d299',[[x,y],[x-7,y+12],[x+7,y+12]]);line(c,'#bca779',17,47,32,54,2);line(c,'#bca779',32,54,48,47,2);
    }
    const texture=textureFor(tile);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;textures.set(key,texture);return texture;
  }
  function terrain(realm,stone=false) {
    const key='terrain:'+realm+':'+stone;if(textures.has(key))return textures.get(key);
    const tile=surface(64,64),c=tile.getContext('2d');const palettes=[['#56984d','#64a653','#478c47','#8ab75d'],['#d8c18a','#e6d097','#c7ad77','#eee0b2'],['#66628b','#77729e','#504f75','#9290b0'],['#83ab61','#94bd72','#739c54','#b1cc87'],['#62616a','#777078','#4e505a','#9c7971'],['#769593','#88a4a1','#637f83','#b0bfb0']];const p=palettes[realm===7?3:realm%6];rect(c,stone?'#8e8b78':p[0],0,0,64,64);
    let seed=998+realm;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    if(stone){for(let row=0;row<6;row++)for(let col=-1;col<5;col++){const x=col*16+(row%2)*8,y=row*11;rect(c,'#687064',x,y,16,11);rect(c,'#b5b296',x+1,y+1,14,8);rect(c,'#d1c9a6',x+2,y+1,12,2);rect(c,'#7a826b',x+1,y+8,14,1);if(random()>.4)rect(c,p[2],x+2,y+2,3+Math.floor(random()*7),2);}}
    else {
      for(let i=0;i<28;i++){
        const x=Math.floor(random()*64),y=Math.floor(random()*64),color=i%4===0?p[2]:p[1];
        rect(c,color,x,y,3,1);rect(c,color,x+1,y-1,1,3);
        if(i%7===0&&realm!==4){rect(c,p[3],x,y-1,1,1);}
      }
      for(let i=0;i<10;i++){const x=Math.floor(random()*64),y=Math.floor(random()*64);rect(c,p[2],x,y,2,1);}
    }
    const texture=textureFor(tile);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.generateMipmaps=true;texture.minFilter=THREE.NearestMipmapNearestFilter;textures.set(key,texture);return texture;
  }
  window.RelicArt=Object.freeze({canvas,material,sprite,terrain,groundOverlay,surfaceTexture,animationFrame,ANIMATIONS});
})();
