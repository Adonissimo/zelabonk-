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
  const ANIMATIONS={idle:[4,3],walk:[8,10],swim:[8,12],tread:[4,5],attack:[6,14],cast:[6,10],ultimate:[8,9],hurt:[2,8],jump:[4,6],glide:[4,4],dash:[4,12],death:[8,8],victory:[6,5],windup:[6,7],spawn:[6,7]};
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
  // Distinct eight-beat locomotion silhouettes. Midna drifts; the other heroes plant alternating feet.
  const HERO_TRAVEL={
    link:{feet:[0,3,6,4,0,-3,-6,-4],height:[0,-1,-2,-1,0,-1,-2,-1],walkBank:.085,dashBank:.28,jumpBank:-.20},
    zelda:{feet:[0,1,3,2,0,-1,-3,-2],height:[0,-1,-1,0,0,-1,-1,0],walkBank:.028,dashBank:.12,jumpBank:-.08},
    midna:{feet:[0,0,0,0,0,0,0,0],height:[0,-1,-3,-4,-4,-3,-1,0],walkBank:.10,dashBank:.24,jumpBank:-.24},
    tetra:{feet:[0,4,6,3,-1,-5,-7,-3],height:[1,-1,-4,-2,1,-1,-4,-2],walkBank:.15,dashBank:.33,jumpBank:-.28},
    sheik:{feet:[0,5,8,5,0,-5,-8,-5],height:[4,3,1,2,4,3,1,2],walkBank:.23,dashBank:.42,jumpBank:-.33},
  };
  function heroPose(id,action,frame){
    const motion=HERO_MOTION[id]||HERO_MOTION.link,frames=(ANIMATIONS[action]||ANIMATIONS.idle)[0];
    const phase=frame/Math.max(1,frames-1),cycle=frame/frames*Math.PI*2,beat=Math.sin(cycle),lag=Math.cos(cycle);
    const glide=action==='glide',jump=action==='jump',dash=action==='dash',walk=action==='walk',idle=action==='idle',hurt=action==='hurt';
    const attack=action==='attack',cast=action==='cast'||action==='ultimate',victory=action==='victory';
    const swing=Math.sin(phase*Math.PI),snap=phase<.4?phase*2.5:(1-phase)/.6;
    const flourish=cast||victory?Math.round(swing*3):0;
    const travel=HERO_TRAVEL[id],slot=frame%8;
    const step=walk?(travel?travel.feet[slot]:Math.round(beat*motion.stride)):dash?Math.round(beat*(motion.stride+3)):jump?Math.round(2+4*swing):glide?Math.round(2+2*beat):0;
    const sway=Math.round(walk?lag*2:dash?-3+lag*2:glide?beat*4:jump?beat*2:lag+(attack?snap*3:0));
    const lift=Math.round(cast?swing*motion.cast:attack?snap*motion.attack:victory?15+beat*4:jump?7+swing*9:0);
    const rise=glide?-Math.round(2+lag*2):jump?-Math.round(swing*(id==='sheik'?7:id==='tetra'?5:3)):dash?(id==='sheik'?6:id==='midna'?-4:-1):walk?(travel?travel.height[slot]:-Math.round(Math.abs(beat)*motion.hitch)):idle?-Math.round((1-lag)*motion.idle/2):0;
    const tilt=glide?beat*motion.bank:jump?(travel?.jumpBank??-.11)+swing*.20:dash?(travel?.dashBank??.12)+beat*.045+lag*.035:walk&&travel?travel.walkBank+beat*.04:hurt?(frame?-.1:.11):attack?(.4-phase)*.16:victory?lag*.06:0;
    return {phase,beat,lag,swing,snap,glide,jump,dash,walk,idle,hurt,attack,cast,victory,step,sway,lift,rise,tilt,flourish};
  }
  const STARTER_GESTURES={link:'ember',zelda:'leaf',midna:'shadow',tetra:'cutlass',sheik:'kunai',skullkid:'fairy'};
  const ULTIMATE_GESTURES={link:'spin',zelda:'seal',midna:'fused',tetra:'waterGun',sheik:'harp',skullkid:'moonCrash',impa:'waterBlade',saria:'ocarinaSong',darunia:'goronSlam',ruto:'rutoSurge',nabooru:'spiritSage'};
  const WEAPON_GESTURES=new Set([...Object.values(STARTER_GESTURES),...Object.values(ULTIMATE_GESTURES),'sword','giantBlade','slingshot','hammer','rutoWave','axe']);
  // Original pixel props. These share palette and geometry across normal and ultimate poses.
  function ocarina(c,x,y,blue=false){
    const body=blue?'#3b64a9':'#ab7c4e',light=blue?'#87bced':'#efcf92';
    polygon(c,body,[[x-7,y+1],[x-4,y-3],[x+5,y-4],[x+8,y-1],[x+5,y+4],[x-5,y+4]]);
    line(c,body,x+2,y,x+8,y-5,3);line(c,light,x-4,y-1,x+4,y-2,1);
    if(!blue){line(c,'#d4a96e',x-5,y+2,x+5,y+2,2);rect(c,'#f6dda5',x-3,y-2,5,1);}
    for(const i of [-3,0,3])rect(c,blue?'#312d49':'#5d4c3c',x+i,y+1,1,1);
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
      // Impa's Giant Blade has an old bronze wheel guard, not an ornate sword hilt.
      oval(c,'#6c573b',2,0,5,8);oval(c,'#b89c62',2,0,4,7);
      for(const key of [-1,1])line(c,'#e8d1a0',1,key*2,-1,key*5,1);
      line(c,'#50606a',4,-5,7,4,2);line(c,'#d3ba8e',1,-2,4,2,1);
    }
    c.restore();
  }
  // The five Time-era allies use their own costumes, body proportions, and joint animation.
  const TIME_ALLIES={
    impa:{skin:'#e3ac82',shade:'#9f6152',cloth:'#358595',dark:'#284755',light:'#bfd6d6',accent:'#a9dfee',stride:7,hitch:2,height:87,width:29,gesture:'giantBlade'},
    saria:{skin:'#efc392',shade:'#b98057',cloth:'#668443',dark:'#273d29',light:'#c1d852',accent:'#dff38c',stride:5,hitch:3,height:68,width:20,gesture:'slingshot'},
    darunia:{skin:'#f6ad20',shade:'#b87420',cloth:'#873332',dark:'#54262c',light:'#ffce56',accent:'#ffe9b7',stride:4,hitch:2,height:83,width:50,gesture:'hammer'},
    ruto:{skin:'#78d6d1',shade:'#418e9b',cloth:'#3da7b5',dark:'#244a64',light:'#b9eae0',accent:'#8eeaf4',stride:5,hitch:2,height:80,width:19,gesture:'rutoWave'},
    nabooru:{skin:'#b87950',shade:'#75402e',cloth:'#963b47',dark:'#652b38',light:'#d7a3a5',accent:'#edba6d',stride:6,hitch:2,height:86,width:23,gesture:'axe'},
  };
  for(const gesture of Object.values(TIME_ALLIES).map(d=>d.gesture))WEAPON_GESTURES.add(gesture);
  // Sprite-only storyboard. Palm positions are relative to the shoulder line;
  // each gesture keeps its existing frame count and game-side release.
  const ALLY_ACTION_STAGING={
    giantBlade:{hands:[[-14,13,-8,14],[-16,4,-11,5],[-13,-10,-6,-13],[2,-7,12,-5],[6,5,15,4],[0,9,9,10]],
      lean:[-.12,-.19,-.15,.20,.13,.01],angle:[2.75,2.32,-1.57,-.36,.53,.19]},
    waterBlade:{hands:[[-12,15,-7,15],[-17,8,-10,9],[-15,-7,-7,-10],[1,-9,13,-12],[7,-8,17,-8],[9,-2,20,0],[6,6,12,5],[0,9,9,10]],
      lean:[-.03,-.16,-.21,.10,.19,.24,.12,0],angle:[2.70,2.48,-2.26,-.58,-.28,.36,.48,.14]},
    slingshot:{hands:[[-6,10,10,8],[-12,0,15,-5],[-20,-9,18,-10],[-24,-10,20,-10],[-16,-6,19,-9],[-9,6,12,4]],
      lean:[.02,-.05,-.11,-.13,.11,.04]},
    ocarinaSong:{hands:[[-4,11,7,12],[-4,5,8,6],[-5,-3,9,-2],[-5,-6,9,-5],[-5,-5,8,-4],[-5,-6,9,-5],[-5,-4,8,-3],[-4,7,7,7]],
      lean:[0,-.03,-.05,-.07,-.025,.025,-.035,0]},
    hammer:{hands:[[-9,8,4,8],[-8,0,8,-4],[-3,-14,11,-18],[7,-4,16,-5],[14,12,24,15],[8,10,17,10]],
      lean:[-.07,-.15,-.18,.05,.20,.10],angle:[-2.35,-2.10,-1.85,-.66,.57,.28]},
    rutoWave:{hands:[[-7,9,12,8],[-14,10,7,10],[-19,3,9,-1],[-5,-5,20,-6],[4,-8,28,-8],[0,1,17,3]],
      lean:[.015,-.07,-.14,.15,.21,.04]},
    rutoSurge:{hands:[[-9,12,10,12],[-15,8,15,9],[-18,1,18,2],[-12,-10,23,-12],[-9,-14,24,-16],[-7,-10,23,-11],[0,-3,29,-4],[-8,7,15,7]],
      lean:[0,-.04,-.09,-.12,-.02,.16,.20,.03]},
    axe:{lean:[-.02,-.10,-.16,.08,.21,.04],angle:[-2.45,-2.17,-1.64,-.68,.34,.75]},
    spiritSage:{hands:[[-7,11,7,11],[-6,6,6,6],[-5,1,5,1],[-9,-3,9,-3],[-15,-6,15,-6],[-19,-8,19,-8],[-17,-2,17,-2],[-10,5,10,5]],
      lean:[0,-.02,0,-.03,-.02,0,.025,0]},
  };
  const ALLY_WALKS={
    impa:{bank:.065,sway:1.7,foot:[0,3,8,5,0,-3,-8,-5],lift:[0,2,3,1,1,2,4,1]},
    saria:{bank:.10,sway:2.3,foot:[0,4,6,5,0,-4,-6,-5],lift:[0,2,5,3,0,2,5,3]},
    darunia:{bank:.060,sway:2.7,foot:[0,2,5,3,0,-2,-5,-3],lift:[0,0,2,1,0,0,2,1]},
    ruto:{bank:.115,sway:3.7,foot:[0,2,6,3,0,-2,-6,-3],lift:[1,3,4,3,1,3,4,3]},
    nabooru:{bank:.095,sway:3.0,foot:[0,4,7,5,0,-4,-7,-5],lift:[0,2,3,1,0,2,3,1]},
  };
  // Eight hand-keyed anatomy arrangements for each ally. Each cel places the
  // hip, shoulder line, head, knees, boots and hands independently.
  // [hip X/Y, shoulders X/Y, head X/Y], then left/right knee and foot [X/Y].
  const ALLY_LOSS_TORSO={
    impa:[[0,77,0,51,0,16],[-3,76,-4,49,-6,13],[-6,79,-2,53,1,19],[-8,85,-3,59,6,25],[-11,90,-6,65,8,34],[-13,92,-5,70,7,44],[-13,92,-5,74,5,49],[-13,93,-5,76,4,53]],
    saria:[[0,83,0,62,0,35],[-3,81,-4,59,-6,32],[-5,83,-1,63,4,38],[-8,87,-4,69,3,43],[-13,91,-8,73,6,48],[-14,94,-8,78,11,54],[-14,96,-8,82,13,60],[-14,97,-8,83,13,62]],
    darunia:[[0,78,0,53,0,20],[-2,76,-4,51,-7,17],[-5,80,-3,57,-5,24],[-3,84,-1,61,-2,30],[-1,87,3,66,9,35],[-2,89,6,70,12,39],[-2,90,5,73,11,43],[-2,91,4,74,10,45]],
    ruto:[[0,79,0,55,0,23],[-3,78,2,53,5,21],[-4,81,5,58,12,27],[-5,84,9,67,17,37],[-5,90,15,76,24,53],[-7,91,12,83,26,67],[-8,93,12,89,25,75],[-8,95,12,93,25,81]],
    nabooru:[[0,77,0,51,0,17],[2,77,4,49,9,12],[4,81,10,55,15,22],[-1,86,8,62,19,32],[-4,88,8,67,21,41],[-8,91,6,75,18,52],[-8,92,5,77,15,57],[-8,92,5,79,14,61]],
  };
  const ALLY_LOSS_LEGS={
    impa:[[-13,91,-15,102,13,90,16,103],[-14,88,-20,103,12,89,13,102],[-20,91,-23,103,11,83,21,103],[-23,92,-28,104,14,85,23,103],[-22,98,-32,103,17,87,23,103],[-17,102,-31,102,16,85,25,103],[-14,102,-31,103,15,88,25,103],[-13,103,-30,103,15,89,24,103]],
    saria:[[-9,93,-11,103,10,93,11,103],[-10,90,-16,103,10,90,16,101],[-16,93,-20,103,10,91,21,103],[-17,94,-22,104,12,91,22,104],[-16,97,-21,105,15,92,27,102],[-12,91,4,103,16,89,30,102],[-1,94,13,105,17,91,31,102],[2,94,14,105,18,92,30,103]],
    darunia:[[-20,92,-20,103,21,93,22,103],[-24,91,-25,103,20,89,21,102],[-25,91,-29,104,20,92,26,103],[-28,96,-28,103,19,95,27,104],[-29,101,-31,104,18,99,29,105],[-25,101,-36,104,18,102,32,104],[-23,103,-35,105,23,104,30,103],[-21,103,-34,105,24,104,31,104]],
    ruto:[[-9,91,-9,103,10,91,10,103],[-10,89,-13,103,12,87,18,99],[-12,94,-16,103,15,86,23,100],[-12,95,-18,104,14,88,28,103],[-16,96,-26,104,9,89,29,102],[-19,98,-32,104,4,91,26,103],[-19,101,-34,105,5,98,24,105],[-19,103,-34,106,6,101,22,105]],
    nabooru:[[-11,88,-13,104,11,88,12,104],[-10,87,-16,104,14,87,19,102],[-13,89,-19,103,18,90,22,103],[-14,93,-24,104,20,88,27,104],[-17,98,-26,104,20,90,29,104],[-16,101,-31,103,20,90,31,103],[-14,102,-31,104,18,90,29,104],[-13,103,-30,104,17,91,27,104]],
  };
  // [elbow X/Y, palm X/Y] left then right. Hands visibly meet the ground.
  const ALLY_LOSS_ARMS={
    impa:[[-15,61,-9,65,16,62,15,65],[-16,56,-15,50,18,57,22,63],[-17,69,-28,72,17,59,27,73],[-18,78,-26,88,21,76,27,91],[-23,82,-29,103,21,87,30,101],[-23,87,-30,103,19,90,22,90],[-23,88,-29,103,18,88,21,92],[-22,91,-27,103,17,89,20,93]],
    saria:[[-12,68,-9,74,14,70,14,75],[-13,62,-16,60,17,62,20,67],[-12,71,-19,77,17,70,23,74],[-17,77,-22,88,14,75,20,86],[-17,83,-22,101,12,83,23,90],[-12,91,-8,100,10,87,25,94],[-10,94,4,97,12,87,26,97],[-10,95,7,98,11,88,25,97]],
    darunia:[[-27,70,-30,89,26,69,30,89],[-29,64,-35,79,28,66,36,82],[-33,70,-38,87,27,69,35,89],[-34,78,-41,100,30,75,40,100],[-33,83,-41,97,34,81,42,98],[-30,86,-39,99,35,84,45,98],[-29,88,-37,102,33,88,43,101],[-28,89,-36,102,32,90,42,102]],
    ruto:[[-12,65,-15,75,15,64,17,74],[-16,63,-20,62,20,62,28,59],[-18,68,-26,67,21,66,32,63],[-16,75,-24,81,20,76,35,81],[-13,82,-22,91,25,90,39,101],[-12,90,-23,98,27,91,37,103],[-12,94,-24,102,24,94,34,104],[-12,94,-24,102,24,94,34,104]],
    nabooru:[[-12,62,-11,70,17,62,16,67],[-15,62,-19,60,21,59,22,58],[-16,70,-25,74,23,68,29,72],[-15,77,-20,89,23,76,32,85],[-15,81,-20,98,24,85,32,100],[-16,89,-19,103,24,88,31,103],[-17,90,-19,103,22,86,28,98],[-16,91,-18,103,21,88,26,99]],
  };
  function timeAlly(id,direction,frame,action,attackKind){
    const canvas=surface(112,112),c=canvas.getContext('2d'),a=TIME_ALLIES[id];
    const dir=(direction%8+8)%8,side=dir>4?8-dir:dir,mirror=dir>4,back=side>=3,profile=side===2,quarter=side%2===1;
    const frames=(ANIMATIONS[action]||ANIMATIONS.idle)[0],p=frame/Math.max(1,frames-1),cycle=frame/frames*Math.PI*2;
    const beat=Math.sin(cycle),lag=Math.cos(cycle),surge=Math.sin(p*Math.PI);
    const walk=action==='walk',dash=action==='dash',jump=action==='jump',glide=action==='glide',hurt=action==='hurt',death=action==='death',cheer=action==='victory',ult=action==='ultimate';
    const attack=action==='attack'||action==='cast',gesture=ult?ULTIMATE_GESTURES[id]:attack?(attackKind||a.gesture):null;
    const lossKey=Math.max(0,Math.min(7,frame)),deadFrame=Math.floor(lossKey),nextKey=Math.min(7,deadFrame+1),blend=lossKey-deadFrame;
    const position=keys=>keys[deadFrame].map((coord,i)=>coord+(keys[nextKey][i]-coord)*blend);
    const defeat=death?position(ALLY_LOSS_TORSO[id]):null;
    const lossLeg=death?position(ALLY_LOSS_LEGS[id]):null,lossArm=death?position(ALLY_LOSS_ARMS[id]):null;
    const viewWidth=profile?.76:quarter?.91:1,viewShift=profile?5:quarter?3:0;
    const jointX=x=>x*viewWidth+viewShift;
    const fallT=death?lossKey/7:0,finFold=id==='ruto'&&death?Math.max(0,(lossKey-2)/5):0;
    const motion=walk||dash, air=jump||glide;
    const staging=ALLY_ACTION_STAGING[gesture],costumeWalk=ALLY_WALKS[id];
    const take=Math.min(frame,(staging?.lean?.length||1)-1),walkFrame=frame%8;
    const stomp=gesture==='goronSlam';
    const gait=death?(id==='darunia'?Math.round(surge*4):Math.round((id==='saria'?-7:id==='ruto'?3:6)*fallT)):
      walk?costumeWalk.foot[walkFrame]:motion?Math.round(beat*(a.stride+3)):air?Math.round(2+beat*3):0;
    const bend=stomp?(frame===0?6:frame===7?9:0):action==='idle'?Math.round((1-lag)*.8):0;
    let lift=glide?5+2*lag:jump?6+surge*7:walk?costumeWalk.lift[walkFrame]:motion?Math.abs(beat)*a.hitch:cheer?surge*4:0;
    if((id==='darunia'&&glide)||death) lift=0;
    const stature=a.height+(glide&&id==='darunia'?-16:0), b=103;
    const bx=defeat?jointX(defeat[0]):(side===0||side===4)?0:3;
    const torsoX=defeat?jointX(defeat[2]):bx,hx=defeat?jointX(defeat[4]):viewShift;
    const topY=defeat?defeat[5]:b-stature+bend,shoulder=defeat?defeat[3]:b-stature*.60+(stomp?bend*.70:0);
    const waist=defeat?defeat[1]:b-stature*.30+(stomp?bend*.45:0);
    const half=a.width*(profile?.35:quarter?.43:.5),shoulderX=torsoX-half,opposite=torsoX+half;
    const xf=profile?5:0,yL=lossLeg?lossLeg[3]:Math.min(106,b-(air?5:0)-gait),yR=lossLeg?lossLeg[7]:Math.min(106,b-(air?8:0)+gait);
    const xL=lossLeg?jointX(lossLeg[2]):bx-half*.58+xf-gait*.2,xR=lossLeg?jointX(lossLeg[6]):bx+half*.59+xf+gait*.22;
    c.translate(56+(hurt?(frame?-3:3):0),-lift);
    if(mirror)c.scale(-1,1);
    // Pull release poses back slightly so the heavy weapon and forward crest stay in the cel.
    const releaseInset=gesture==='waterBlade'&&take>=3&&take<=6?16:gesture==='giantBlade'&&take>=3?13:
      gesture==='rutoSurge'&&take>=4?9:gesture==='rutoWave'&&take===4?7:
      (gesture==='hammer'||gesture==='axe')&&take===4?7:0;
    if(releaseInset)c.translate(-releaseInset,0);
    const stepLean=walk?beat*costumeWalk.bank:0;
    const moveLean=glide?beat*(id==='ruto'?.17:.1):dash?.13+beat*.03:0;
    const castLean=(staging?.lean?.[take]||0)+((stomp&&frame===1)?-.11:0);
    const idleLean=action==='idle'?(id==='saria'?.035*beat:id==='ruto'?.060*beat:id==='nabooru'?.032*lag:0):0;
    if(stepLean||moveLean||castLean||idleLean){
      c.translate(walk?beat*costumeWalk.sway:0,b);c.rotate(stepLean+moveLean+castLean+idleLean);c.translate(0,-b);
    }
    const R=(color,x,y,w,h)=>rect(c,color,x,y,w,h), P=(color,points)=>polygon(c,color,points);
    const L=(color,x,y,tx,ty,w=1)=>line(c,color,x,y,tx,ty,w), O=(color,x,y,rx,ry)=>oval(c,color,x,y,rx,ry);
    const gem=(x,y,r,col=a.accent)=>P(col,[[x,y-r],[x+r,y],[x,y+r],[x-r,y]]);
    const spark=(x,y,r,col=a.accent)=>{L(col,x-r,y,x+r,y);L(col,x,y-r,x,y+r);};
    const limb=(color,hint,sx,sy,ex,ey,kx,ky,w)=>{
      L(color,sx,sy,kx,ky,w);L(color,kx,ky,ex,ey,w);
      L(hint,sx,sy,kx,ky,Math.max(1,w-3));L(hint,kx,ky,ex,ey,Math.max(1,w-3));
    };
    // Center Darunia's round limbs on their joints; fat pixel lines grow down and right.
    const goronSegment=(sx,sy,ex,ey,width)=>{
      const length=Math.max(1,Math.hypot(ex-sx,ey-sy)),nx=-(ey-sy)/length,ny=(ex-sx)/length;
      for(const [color,inset,offset]of [['#a96720',0,0],['#eea323',2,-1],['#ffc64a',5,-2]]){
        const radius=(width-inset)/2,x0=sx+offset,y0=sy+offset,x1=ex+offset,y1=ey+offset;
        P(color,[[x0+nx*radius,y0+ny*radius],[x1+nx*radius,y1+ny*radius],
          [x1-nx*radius,y1-ny*radius],[x0-nx*radius,y0-ny*radius]]);
        O(color,x0,y0,radius,radius);O(color,x1,y1,radius,radius);
      }
    };
    const elbow=(sx,sy,x,y)=>[(sx*2+x)/3,(sy+y)*.5+3];
    const arm=(sign,sx,sy,x,y)=>{
      const x0=sign<0?shoulderX:opposite,y0=shoulder,key=sign<0?0:4;
      const [el,ey]=lossArm?[jointX(lossArm[key]),lossArm[key+1]]:elbow(sx,sy,x,y);
      const broad=id==='darunia'?15:id==='impa'?8:id==='saria'?5:6;
      const upper=id==='saria'?'#3a7150':a.skin;
      if(id==='darunia'){
        goronSegment(x0,y0,el,ey,broad);goronSegment(el,ey,x,y,broad);
      }else{
        L(id==='saria'?a.dark:a.shade,x0,y0,el,ey,broad);
        L(upper,x0,y0,el,ey,Math.max(2,broad-3));
        L(id==='saria'?'#263c2d':a.shade,el,ey,x,y,broad);
        L(id==='saria'?'#50714b':a.skin,el,ey,x,y,Math.max(2,broad-3));
      }
      const fx=(el+2*x)/3,fy=(ey+2*y)/3;
      if(id==='impa'){
        L('#344451',x0+sign*2,y0+1,el,ey-2,10);
        L('#8a9da4',x0+sign*1,y0+2,el-1,ey-2,7);
        L('#d7e1d9',x0,y0+3,el-1,ey-4,2);
        L('#354552',el+1,ey,x,y,8);L('#9facad',el,ey-1,x-1,y-1,5);
        L('#dce4d9',el-2,ey-2,x-2,y-1,2);
        L('#ddbd78',x-3,y-1,x+3,y+2,2);
        for(const [j,k] of [[.25,.72],[.58,.48]]){
          R('#ac5549',x0+(el-x0)*j-1,y0+(ey-y0)*j,2,2);
          R('#9b4941',el+(x-el)*k,ey+(y-ey)*k+1,2,1);
        }
      }else if(id==='nabooru'){
        L('#67473d',el,ey,x,y,7);
        L('#b0a398',el,ey,x,y,5);
        L('#dbcec1',el,ey-2,x,y-1,2);
        L('#7f6e69',fx-2,fy-2,fx+2,fy,1);
        L('#7f6e69',fx-1,fy+1,fx+3,fy+2,1);
        L('#9c663c',x-2,y-2,x+2,y+1,3);
        L('#d2a35e',x-2,y-3,x+2,y,1);
      }else if(id==='darunia'){
        const dx=x-el,dy=y-ey,length=Math.max(1,Math.hypot(dx,dy)),ux=dx/length,uy=dy/length;
        const nx=-uy,ny=ux,cuffX=el+dx*.78,cuffY=ey+dy*.78;
        L('#ffc84b',x0+sign*2,y0+2,el+sign*2,ey-3,4);
        for(const t of [.26,.43]){
          const sx=el+dx*t,sy=ey+dy*t;
          L('#ffe9b7',sx+nx*6,sy+ny*6,sx-nx*6,sy-ny*6,2);
        }
        const cuff=(along,across)=>[cuffX+ux*along+nx*across,cuffY+uy*along+ny*across];
        P('#57272a',[cuff(-5,-10),cuff(-5,10),cuff(4,11),cuff(5,-10)]);
        P('#8f4034',[cuff(-4,-9),cuff(-4,9),cuff(2,9),cuff(3,-9)]);
        L('#bc7150',...cuff(-4,-7),...cuff(-4,7),2);
        L('#64292b',...cuff(1,-9),...cuff(1,9),2);
        for(const off of[-5,4])P('#dcae8b',[cuff(-3,off-2),cuff(-3,off+2),cuff(0,off+2),cuff(0,off-2)]);
        O('#a76220',x+sign*2,y+3,10,9);O('#ed9e21',x+sign,y+1,9,7);
        P('#ffbf32',[[x-6,y-3],[x-2,y-6],[x+4,y-5],[x+8,y],[x+3,y+4],[x-5,y+3]]);
        L('#ffd36c',x-4,y-3,x+2,y-4,2);
        L('#bd7925',x+sign*3,y+5,x+sign*6,y+1,2);L('#bd7925',x-sign*5,y+4,x-sign*2,y+6);
      }else if(id==='saria'){
        L('#483b30',fx-2,fy-2,x-1,y-2,6);L('#765441',fx-2,fy-2,x-1,y-2,3);
        L('#ab835c',fx-2,fy-4,x-1,y-4);R('#d4ad76',x-1,y-3,2,2);
        L('#77915b',x0,y0+2,el,ey-2);L('#a4a674',el-sign*2,ey,el+sign*2,ey+1);
      }else if(id==='ruto'){
        // Long ray-shaped membranes unfold from the elbows and flutter with the water pose.
        const reach=(profile&&sign<0?.67:1)*(1-.72*finFold),flip=profile?1:sign,tipX=el+flip*(14+Math.round(beat*2))*reach;
        const tipY=y+14+Math.round(beat*4)+(glide?5:0)-6*finFold,rimX=(el+x)/2+flip*(6-4*finFold);
        P('#25506f',[[el-flip*1,ey-2],[el+flip*4,ey],[rimX+flip*6,ey+9],[tipX,tipY],[tipX-flip*9,tipY-3],[x+flip*1,y+2],[el,ey+3]]);
        P('#327fa7',[[el+flip*1,ey],[el+flip*4,ey+2],[rimX+flip*5,ey+10],[tipX-flip*2,tipY-3],[tipX-flip*8,tipY-6],[x,y+1]]);
        P('#42b6cc',[[el+flip*2,ey+1],[el+flip*4,ey+4],[tipX-flip*4,tipY-7],[tipX-flip*7,tipY-9],[x,y+1]]);
        L('#80d1da',el+flip*2,ey+2,tipX-flip*4,tipY-6,2);
        L('#2394b3',rimX,ey+6,tipX-flip*6,tipY-10,2);
        L('#26628e',rimX+flip*5,ey+10,tipX-flip*3,tipY-4);
        L(a.skin,el,ey-2,x,y-1,2);
      }
    };
    const accent=(x,y,i)=>gem(x,y,2+i%2,i%2?'#fff1c1':a.accent);
    let axL=shoulderX-8, axR=opposite+7, ayL=waist+1+gait, ayR=waist+1-gait;
    if(air){axL-=glide?7:2;axR+=glide?7:2;ayL=shoulder+6+beat*2;ayR=shoulder+4-beat*3;}
    if(cheer){axL-=3;ayL=shoulder+3;axR+=6;ayR=shoulder-9-surge*5;}
    const restingGoron=id==='darunia'&&action==='idle';
    const holdsOcarina=id==='saria'&&action==='idle'&&!back;
    const foldedImpa=id==='impa'&&action==='idle'&&!back&&!profile;
    if(holdsOcarina){
      axL=bx-4+lag;axR=bx+8+lag;ayL=shoulder+10+beat;ayR=shoulder+9+beat;
    }
    if(restingGoron){
      axL=bx-(profile?22:35);ayL=waist+11+beat;
      axR=bx+(profile?24:35);ayR=waist+10-beat;
    }
    if(foldedImpa){axL=bx+8;ayL=shoulder+13;axR=bx-9;ayR=shoulder+15;}
    if(lossArm){
      axL=jointX(lossArm[2]);ayL=lossArm[3];axR=jointX(lossArm[6]);ayR=lossArm[7];
    }
    if(walk){
      const swing=gait*(id==='impa'?.75:id==='darunia'?.60:id==='ruto'?1.2:.95);
      axL-=beat*(id==='ruto'?5:3);axR+=beat*(id==='ruto'?5:3);ayL+=swing;ayR-=swing;
    }
    if(staging?.hands){
      const [lx,ly,rx,ry]=staging.hands[take],scale=profile?.84:quarter?.94:1;
      const origin=gesture==='ocarinaSong'?hx:bx;
      axL=origin+lx*scale;axR=origin+rx*scale;
      ayL=shoulder+ly;ayR=shoulder+ry;
    }else if(stomp){
      const push=frame===1;
      axL=shoulderX-(push?6:8);axR=opposite+7;
      ayL=shoulder+(push?-17:19);ayR=shoulder+(push?-18:18);
    }
    if(stomp&&frame>=2&&frame<=6){
      // Curl in midair. World elevation moves the sprite; local baseline stays under its body.
      const impact=frame===6,arc=frame-2,yt=[31,34,36,34,29][arc],xt=[31,34,35,35,41][arc],y=b-yt;
      const theta=[0,.84,2.2,3.7,5.2][arc]+(side%3)*.28;
      O('#965c26',0,y,xt,yt);O('#f0a52a',-1,y-1,xt-3,yt-2);
      c.save();c.translate(0,y);c.scale(1,impact?.87:1);c.rotate(theta);
      O('#be7d29',0,0,29,29);O('#ffc442',-1,-2,22,22);
      for(let i=0;i<9;i++){
        const t=i*Math.PI*2/9,x=Math.sin(t)*23,yy=Math.cos(t)*23;
        P('#965b28',[[x-8,yy-1],[x-4,yy-8],[x+4,yy-8],[x+9,yy-3],[x+8,yy+5],[x+1,yy+9],[x-6,yy+6]]);
        P(i%3===0?'#f5bb4b':'#e5a037',[[x-6,yy],[x-4,yy-6],[x+3,yy-7],[x+7,yy-2],[x+6,yy+4],[x-1,yy+7],[x-5,yy+3]]);
        L('#ffe3a0',x-5,yy-3,x+2,yy-6,2);
      }
      // The folded head and white beard keep the boulder legible as Darunia himself.
      P('#ae6e25',[[-16,-10],[-9,-16],[5,-14],[12,-6],[10,6],[2,13],[-12,11],[-18,4]]);
      P('#ffc33b',[[-13,-9],[-9,-12],[4,-11],[9,-5],[7,6],[1,8],[-11,6],[-15,2]]);
      P('#fff1c9',[[-14,-10],[-13,-15],[-8,-13],[-6,-19],[-3,-14],[2,-15],[6,-11],[-1,-9],[-9,-9]]);
      P('#ffe9b7',[[-15,1],[-8,5],[-1,4],[9,1],[6,8],[1,11],[-2,9],[-8,12],[-12,9]]);
      L('#59311f',-9,-4,-6,-3,2);L('#59311f',0,-3,4,-4,2);
      P('#ab7946',[[10,-8],[20,-7],[21,2],[14,11],[8,8],[11,3]]);
      L('#dbb06d',12,-7,19,-4,2);L('#684c3e',11,7,15,9,2);
      c.restore();
      if(impact){
        L('#dfab75',-19,b-5,13,b-4,2);L('#a96d4c',-30,b-8,-23,b-5,2);
        for(const side of [-1,1])for(let i=0;i<3;i++){
          const xx=side*(28+i*6),yy=b-5-i*3;
          P(i%2?'#debb80':'#977550',[[xx-3,yy+2],[xx,yy-2],[xx+4,yy+1],[xx,yy+4]]);
        }
      }
      return outline(canvas);
    }
    if(gesture==='axe'){
      // Nabooru's axe belongs to the Iron Knuckle the witches trap her in.
      const front=profile?7:3,strike=staging.angle[take];
      const grip=[[-4,62],[-11,52],[-9,40],[4,53],[13,70],[8,68]][take];
      const hX=bx+grip[0],hY=grip[1];
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
      // Steel and leather scabbard across her back; feathers fan with the current pose.
      const flow=(glide?9:motion?5:death?5*Math.sin(fallT*Math.PI):0)+beat*3;
      if(!gesture||back){
        const h=profile?-.1:back?.53:.29,x=bx-12,y=waist-(back?18:10);
        c.save();c.translate(x,y);c.rotate(h);
        P('#372b29',[[-3,-6],[42,-5],[49,-3],[51,0],[46,4],[2,5],[-3,3]]);
        L('#76543d',1,-3,46,-1,3);L('#ae7a4b',4,-3,40,-2);
        L('#c5a76e',42,-3,47,0,2);L('#c3a571',0,-5,1,4,2);
        if(!death){L('#8f755a',-12,-1,-2,-1,3);R('#d2b889',-14,-2,2,3);}
        c.restore();
      }
      const fx=bx+(back?-9:10),fy=waist+1;
      for(const [i,dy] of [[0,19],[1,25]]){
        const tail=fx+(back?-1:1)*(12+i*3)+flow,ty=fy+dy;
        P('#88432d',[[fx-2,fy-1],[fx+4,fy],[fx+8+flow,fy+8],[tail+2,ty-4],[tail,ty],[fx+4+flow,fy+14],[fx,fy+4]]);
        P(i?'#ce5f35':'#ed8040',[[fx,fy],[fx+2,fy],[fx+7+flow,fy+8],[tail,ty-2],[fx+3+flow,fy+12],[fx,fy+4]]);
        L('#ffad62',fx+2,fy+4,fx+6+flow,fy+10,2);
      }
      P('#8b969f',[[hx+1,topY+2],[hx-8-flow,topY+5],[hx-8-flow,topY+14],[hx-12-flow,topY+21],[hx-10-flow,topY+24],[hx-6-flow,topY+12]]);
      L('#e2dfd4',hx+1,topY+2,hx-7-flow,topY+6,2);L('#d4d5cc',hx-7-flow,topY+6,hx-9-flow,topY+19,2);
    }else if(id==='nabooru'){
      const flow=(glide?13:motion?8:death?[3,11,13,9,5,2,-1,-2][deadFrame]:4)+lag*3, root=hx-3, ty=topY+3;
      const fallCloth=death?Math.max(0,shoulder+34-103):0,tailY=shoulder-fallCloth;
      P('#542735',[[root-6,ty-4],[root-7,ty-11],[root+3,ty-14],[root+8,ty-9],[root+5,ty-2],
        [root+10-flow,shoulder+5],[root+5-flow,shoulder+22],[root-3-flow,tailY+30],
        [root-14-flow,tailY+34],[root-22-flow,tailY+29],[root-17-flow,shoulder+22],[root-10,shoulder+2]]);
      P('#8f313d',[[root-5,ty-7],[root,ty-12],[root+6,ty-10],[root+3,ty-3],[root+7-flow,shoulder+7],
        [root+3-flow,shoulder+22],[root-13-flow,tailY+31],[root-20-flow,tailY+29],
        [root-14-flow,shoulder+20],[root-7,shoulder+1]]);
      L('#bd4d4d',root-2,ty-8,root-8-flow,tailY+24,2);
      L('#a83b42',root+2,ty-5,root-3-flow,tailY+25,2);
      L('#dc8056',root-5,ty-4,root+3,ty-3,2);
    }else if(id==='ruto'){
      // Swept Zora crown trails behind the face; the rear view shows its mottled keel.
      const f=glide?9:profile?7:2,wave=beat*(motion||air?5:2),x=hx-2,y=topY+12;
      if(back||profile){
        P('#236378',[[x+4,y-11],[x-9,y-8],[x-13,y+2],[x-7,y+14],[x-13+wave-f,shoulder+14],[x-7+wave-f,shoulder+20],[x+2+wave,shoulder+14],[x+8,y+8]]);
        P('#438f9c',[[x-5,y-7],[x-10,y],[x-6,y+12],[x-2,y+16],[x-10+wave-f,shoulder+16],[x+1+wave,shoulder+10],[x+4,y+7]]);
        L('#6ec7c6',x-9,y+2,x-4,y+13,2);
        for(const [dx,dy,w] of [[-7,1,4],[-6,7,3],[-4,12,4]])R('#2e697a',x+dx,y+dy,w,2);
      }
      // Dark blue hip fins have bright ridges across their flowing ray-like tips.
      for(const sign of [-1,1]){
        const x=bx+sign*(profile?5:7),y=waist+2;
        const spread=(profile&&sign<0?.72:1)*(15+Math.round(beat*3)+(glide?4:0))*(1-.64*finFold),tip=x+sign*spread;
        const hang=(18+Math.round(beat*4*sign))*(1-.73*finFold),drag=glide?-6:0;
        P('#265c81',[[x-sign,y-2],[x+sign*4,y+2],[tip+drag,y+hang-2],[tip+drag-sign*5,y+hang+1],[x-sign*2,y+hang+8],[x-sign*3,y+12]]);
        P('#3d94b5',[[x,y],[x+sign*3,y+3],[tip+drag-sign*2,y+hang-3],[tip+drag-sign*7,y+hang-1],[x-sign,y+hang+4],[x-sign,y+10]]);
        P('#64cbd5',[[x,y+3],[x+sign*3,y+6],[tip+drag-sign*6,y+hang-4],[x-sign,y+hang]]);
        L('#9fe1df',x,y+5,tip+drag-sign*7,y+hang-5,2);L('#317ba3',x,y+7,tip+drag-sign*5,y+hang-2);
        for(const i of[0,1,2])L('#3395b0',x+sign*(3+i*2),y+8+i*3,x+sign*(4+i*2),y+11+i*3);
      }
    }
    if(id==='darunia'){
      // Supplied Darunia reference: standing golden mass, ivory mane, sun marking and oxblood cloth.
      const stride=Math.round(Math.abs(gait)*.35),mass=(profile?27:quarter?32:34)+(defeat?lossKey*.35:0);
      const by=waist-(defeat?14:16),massHeight=defeat?.72-.28*fallT**1.7:.72;
      const ivory='#ffe9b7',cream='#fff3ce',hairShade='#d2a777',hairDark='#92633e';
      if(!glide){
        for(const [x,y,i]of [[xL-7,yL-stride,0],[xR+7,yR,4]]){
          const kneeX=lossLeg?jointX(lossLeg[i]):x,kneeY=lossLeg?lossLeg[i+1]-7:y-13;
          goronSegment(bx+(i?1:-1)*half*.53,waist-1,kneeX,kneeY,14);
          goronSegment(kneeX,kneeY,x,y-6,14);
          O('#c47b20',kneeX,kneeY,9,8);O('#f4ad28',kneeX-2,kneeY-2,7,6);
          L('#ffcd5e',kneeX-4,kneeY-4,kneeX,kneeY-5,2);
          L('#98602b',kneeX+3,kneeY+3,x+2,y-5,2);
          L('#7d332d',x-6,y-6,x+6,y-6,3);L('#b15b3e',x-5,y-7,x+5,y-7);
          P('#8e542b',[[x-7,y-3],[x+5,y-4],[x+9,y-1],[x+13,y+2],[x+10,y+5],[x-8,y+5],[x-11,y+2]]);
          P('#ed9e27',[[x-6,y-3],[x+4,y-3],[x+8,y],[x+11,y+2],[x+8,y+3],[x-8,y+3],[x-9,y+1]]);
          L('#ffca61',x-6,y-2,x+3,y-2,2);
          for(let j=0;j<4;j++){L('#a9692c',x-5+j*4,y+1,x-5+j*4,y+4);R('#ffe1a0',x-6+j*4,y,2,1);}
        }
      }
      O('#97571d',bx,by+1,mass,mass*massHeight);
      O('#d98b1b',bx-1,by-1,mass-2,mass*massHeight-1);
      O('#f7ad20',bx-3,by-3,mass-5,mass*massHeight-3);
      if(!back){
        const center=bx+(profile?5:0),sunX=center+1,sunY=by+10;
        P('#ffc43a',[[center-25,by-6],[center-20,by-17],[center-9,by-21],[center+8,by-20],[center+21,by-10],[center+16,by+1],[center+1,by+7],[center-18,by+4]]);
        P('#e4931c',[[center-27,by-5],[center-23,by+10],[center-12,by+18],[center+9,by+20],[center+22,by+12],[center+26,by+3],[center+23,by+15],[center+10,by+23],[center-12,by+22],[center-27,by+11]]);
        L('#ffda6a',center-23,by-11,center-18,by-17,2);
        // The open white sun wraps around the belly, with the navel inside its lower half.
        for(let i=0;i<8;i++){
          const angle=i*Math.PI/4-Math.PI/2,dx=Math.cos(angle),dy=Math.sin(angle);
          P(ivory,[[sunX+dx*12-dy*3,sunY+dy*12+dx*3],[sunX+dx*17,sunY+dy*17],[sunX+dx*12+dy*3,sunY+dy*12-dx*3]]);
        }
        O(ivory,sunX,sunY,10,9);O('#ef9f24',sunX,sunY,8,7);
        L(cream,sunX-7,sunY-5,sunX-4,sunY-7,1);
        L('#ffe1a2',sunX+12,sunY-4,sunX+13,sunY+3,1);
        L('#ffe1a2',sunX-13,sunY-2,sunX-12,sunY+4,1);
        R('#a56526',sunX-1,sunY+3,3,1);R('#c78022',sunX,sunY+4,2,1);
      }else{
        // Rock plates stay on the back; the reference's white belly emblem stays on the front.
        for(const[x,y]of [[-18,-9],[-5,-17],[10,-13],[18,0],[-14,4],[-1,3],[10,13]]){
          const xx=bx+x,yy=by+y;
          P('#9d6428',[[xx-7,yy+2],[xx-4,yy-5],[xx+4,yy-6],[xx+8,yy],[xx+4,yy+6],[xx-5,yy+6]]);
          P('#df9a2d',[[xx-6,yy],[xx-3,yy-5],[xx+3,yy-5],[xx+6,yy-1],[xx+2,yy+3],[xx-4,yy+3]]);
          L('#ffd16b',xx-3,yy-4,xx+2,yy-5,2);
        }
      }
      // A short maroon V leaves two distinct sturdy legs visible below the belly.
      P('#54262c',[[bx-18,waist+5],[bx-6,waist+9],[bx+8,waist+9],[bx+18,waist+4],[bx+10,waist+17],[bx+1,waist+22],[bx-10,waist+16]]);
      P('#873332',[[bx-15,waist+7],[bx-4,waist+11],[bx+7,waist+11],[bx+14,waist+7],[bx+7,waist+17],[bx+1,waist+19],[bx-8,waist+14]]);
      L('#b05c41',bx-12,waist+9,bx-3,waist+12,2);
      arm(-1,bx-18,shoulder,axL,ayL);arm(1,bx+19,shoulder,axR,ayR);
      for(const [x,y,sign]of [[shoulderX-2,shoulder+5,-1],[opposite,shoulder+6,1]]){
        O('#b77620',x,y,13,12);O('#eea322',x-1,y-1,11,10);O('#ffc841',x-3,y-4,8,7);
        L('#ffdb70',x-8,y-5,x-3,y-9,2);L('#d38a20',x+5,y,x+3,y+7,2);
        if(!back&&sign<0){
          P(ivory,[[x-7,y-3],[x-2,y-9],[x-1,y-3]]);P(ivory,[[x,y-4],[x+5,y-9],[x+5,y-3]]);
          P(ivory,[[x-6,y-1],[x-1,y-1],[x-5,y+7]]);P(ivory,[[x+1,y-1],[x+7,y-1],[x+3,y+3]]);
        }
        if(sign>0){L('#78302c',x-8,y+7,x+8,y+8,4);L('#b25f45',x-7,y+6,x+7,y+7);R('#d99f77',x+3,y+7,3,2);}
      }
      const head=topY+11,face=hx+(profile?6:quarter?3:0),wh=profile?14:19,trail=profile?4:quarter?2:0;
      // Ivory spikes form a continuous mane behind the broad brow and long layered beard.
      P(hairDark,[[hx-21,head-6],[hx-28-trail,head-14],[hx-17,head-12],[hx-19,head-20],[hx-10,head-16],[hx-8,head-24],[hx-4,head-21],[hx,head-27],[hx+6,head-18],[hx+10,head-21],[hx+12,head-14],[hx+18,head-9],[hx+25,head-14],[hx+23,head-5],[hx+27,head-6],[hx+23,head+3],[hx+28,head+10],[hx+23,head+13],[hx+28,head+24],[hx+20,head+21],[hx+23,head+30],[hx+11,head+26],[hx-1,head+23],[hx-17,head+29],[hx-22-trail,head+23],[hx-28-trail,head+26],[hx-23,head+13],[hx-27-trail,head+13],[hx-23,head+4],[hx-27-trail,head+1]]);
      P(hairShade,[[hx-19,head-6],[hx-25-trail,head-12],[hx-15,head-10],[hx-16,head-18],[hx-8,head-13],[hx-7,head-21],[hx-3,head-18],[hx,head-24],[hx+5,head-15],[hx+9,head-18],[hx+11,head-12],[hx+18,head-6],[hx+23,head-11],[hx+21,head-3],[hx+24,head-4],[hx+20,head+4],[hx+25,head+11],[hx+20,head+12],[hx+24,head+22],[hx+17,head+19],[hx+20,head+27],[hx+9,head+23],[hx-1,head+20],[hx-17,head+25],[hx-19-trail,head+21],[hx-25-trail,head+23],[hx-20,head+11],[hx-24-trail,head+11],[hx-20,head+3],[hx-24-trail,head]]);
      P(ivory,[[hx-17,head-6],[hx-22-trail,head-11],[hx-13,head-8],[hx-14,head-15],[hx-7,head-11],[hx-6,head-18],[hx-2,head-15],[hx,head-21],[hx+4,head-13],[hx+8,head-15],[hx+9,head-10],[hx+17,head-4],[hx+21,head-8],[hx+19,head-1],[hx+22,head-2],[hx+18,head+4],[hx+23,head+11],[hx+17,head+10],[hx+22,head+20],[hx+15,head+17],[hx+17,head+24],[hx+8,head+20],[hx,head+16],[hx-17,head+23],[hx-17-trail,head+18],[hx-23-trail,head+20],[hx-18,head+10],[hx-23-trail,head+10],[hx-18,head+2],[hx-21-trail,head]]);
      L(cream,hx,head-21,hx+3,head-10,2);L(cream,hx-6,head-17,hx-5,head-9,2);
      L(cream,hx-20-trail,head-10,hx-12,head-5,2);L(cream,hx-21-trail,head+9,hx-13,head+5,2);
      L('#b98a59',hx+5,head-14,hx+9,head-7,2);L('#b98a59',hx-20,head+15,hx-13,head+8,2);
      if(!back){
        O('#c07a21',face,head,wh,15);O('#f9b51f',face-1,head-2,wh-1,14);
        P('#ffca35',[[face-13,head-8],[face-7,head-15],[face+7,head-15],[face+14,head-8],[face+11,head-3],[face-12,head-3]]);
        for(const e of profile?[6]:[-9,9]){
          O('#6c371f',face+e,head+1,5,4);O('#2c1714',face+e+1,head+2,4,3);
          if(death&&deadFrame>=4)L('#a86c26',face+e-3,head+1,face+e+3,head+2,2);
          else{R('#fff5dc',face+e,head-1,2,2);R('#c99c75',face+e-2,head+1,1,1);}
          if(e<0)P('#713b20',[[face+e-9,head-3],[face+e-7,head-11],[face+e-3,head-13],[face+e+2,head-10],[face+e+8,head-5],[face+e+7,head-1],[face+e+2,head-3],[face+e-4,head-6],[face+e-8,head-1]]);
          else P('#713b20',[[face+e-8,head-5],[face+e-3,head-8],[face+e+1,head-13],[face+e+6,head-13],[face+e+9,head-8],[face+e+8,head],[face+e+4,head-4],[face+e,head-4],[face+e-4,head-1],[face+e-8,head-2]]);
          L('#945329',face+e-5,head-7,face+e,head-8,2);
        }
        R('#ba7524',face+1,head+2,2,1);R('#ba7524',face+5,head+2,2,1);
        L('#9c5a21',face-12,head+8,face-7,head+10);L('#9c5a21',face-7,head+10,face+3,head+9);L('#9c5a21',face+3,head+9,face+13,head+7);
        R('#ffda73',face-14,head+2,2,2);R(cream,face-12,head+4,2,1);
        P(hairDark,[[face-17,head+10],[face-12,head+7],[face-6,head+15],[face,head+10],[face+7,head+9],[face+17,head+14],[face+21,head+23],[face+14,head+22],[face+17,head+30],[face+8,head+28],[face+1,head+39],[face-7,head+35],[face-12,head+29],[face-19,head+33],[face-17,head+22],[face-23,head+25]]);
        P(hairShade,[[face-16,head+11],[face-12,head+9],[face-6,head+17],[face+1,head+12],[face+7,head+11],[face+15,head+16],[face+18,head+21],[face+12,head+20],[face+14,head+28],[face+7,head+26],[face+1,head+36],[face-6,head+32],[face-10,head+26],[face-17,head+30],[face-15,head+20],[face-20,head+23]]);
        P(ivory,[[face-15,head+11],[face-12,head+10],[face-6,head+18],[face+1,head+12],[face+6,head+12],[face+13,head+17],[face+15,head+20],[face+9,head+18],[face+12,head+26],[face+6,head+24],[face+1,head+33],[face-5,head+29],[face-9,head+23],[face-14,head+27],[face-13,head+18],[face-18,head+21]]);
        L(cream,face+1,head+14,face+2,head+25,3);L(cream,face-12,head+13,face-14,head+23,2);
        L('#c3976a',face-5,head+20,face-7,head+28,2);L('#d2ac7e',face+5,head+19,face+8,head+25,2);
        L(cream,face-2,head+25,face+1,head+31,2);
      }else{
        P(hairShade,[[hx-15,head-10],[hx+13,head-12],[hx+19,head+1],[hx+15,head+16],[hx+7,head+23],[hx+2,head+18],[hx-7,head+28],[hx-18,head+19],[hx-22,head+8]]);
        P(ivory,[[hx-13,head-10],[hx+11,head-11],[hx+16,head+1],[hx+12,head+13],[hx+6,head+19],[hx+2,head+14],[hx-7,head+24],[hx-15,head+16],[hx-19,head+7]]);
        L(cream,hx-6,head-8,hx-11,head+14,3);L('#c39968',hx+3,head-5,hx-1,head+14,2);
      }
    }else{
      // Animate each costume around the shared walk cycle rather than reskinning a uniform.
      const pelvis=waist-(id==='nabooru'?12:2);
      for(const [x,y,sgn]of [[xL,yL,-1],[xR,yR,1]]){
        const key=sgn<0?0:4,root=bx+sgn*(death?half*.38:half*.62);
        const kx=lossLeg?jointX(lossLeg[key]):x-sgn*(glide?5:0)+(profile?2:0),ky=lossLeg?lossLeg[key+1]:(pelvis+y)*.5;
        if(id==='nabooru'){
          const bulge=profile?10:13,u=kx+sgn*3;
          P('#604254',[[root-7,pelvis],[root+7,pelvis],[u+bulge,ky-5],[u+bulge,ky+4],
            [x+7,y-12],[x+3,y-8],[x-4,y-7],[x-7,y-10],[u-bulge,ky+3],[u-bulge+1,ky-4]]);
          P('#ad8697',[[root-5,pelvis+3],[root+6,pelvis+2],[u+bulge-2,ky-4],[u+bulge-2,ky+4],
            [x+5,y-12],[x+2,y-9],[x-4,y-9],[x-6,y-13],[u-bulge+2,ky+2],[u-bulge+3,ky-4]]);
          P('#c6a4ad',[[root-4,pelvis+5],[root+2,pelvis+5],[u+4,ky-2],[u+2,ky+5],
            [x-1,y-11],[x-5,y-13],[u-6,ky+2]]);
          L('#e4bdbd',root-1,pelvis+6,u-2,ky-1,2);L('#916a80',u+6,ky+3,x+3,y-13,2);
          L('#b29171',u-bulge+2,ky,x-5,y-12);L('#724b44',x-4,y-10,x+3,y-10,3);
          L('#b57953',x-3,y-10,x+3,y-9,2);L(a.skin,x-1,y-8,x,y-4,3);
          P('#6a3c45',[[x-4,y-7],[x+3,y-7],[x+4,y-4],[x+9,y-6],[x+9,y-2],[x+4,y],[x-5,y]]);
          L('#c39476',x+2,y-3,x+8,y-5,1);L('#805543',x+1,y-5,x+3,y-3);
        }else if(id==='ruto'){
          limb('#429098',a.skin,root,pelvis,x,y-5,kx,ky,8);
          L('#9adfce',root-1,pelvis+3,kx-1,ky,2);L('#9adfce',kx-1,ky,x-1,y-6,2);
          P('#3c969e',[[x-4,y-8],[x+2,y-8],[x+4,y-5],[x+9,y-2],[x+8,y+1],[x+3,y+2],[x-4,y]]);
          P('#81d5cb',[[x-3,y-6],[x+2,y-6],[x+4,y-4],[x+8,y-2],[x+6,y],[x-3,y-1]]);
          L('#c0e4d5',x-3,y-5,x+5,y-2);L('#53a8ad',x+4,y-2,x+6,y);
        }else if(id==='saria'){
          limb('#b17a53',a.skin,root,waist+4,x,y-6,kx,ky,7);
          L('#293d29',root,waist+4,kx,ky-4,9);
          L('#5d7740',root,waist+4,kx,ky-6,7);
          L('#8a9b56',kx-3,ky-5,kx+3,ky-5);
          const cuff=y-14;
          P('#29372b',[[x-5,cuff-1],[x-1,cuff+1],[x+4,cuff-2],[x+4,y-6],[x+8,y-4],[x+7,y],[x-6,y],[x-6,y-5]]);
          P('#56683a',[[x-4,cuff+1],[x-1,cuff+3],[x+3,cuff],[x+3,y-6],[x-4,y-5]]);
          P('#725541',[[x-4,y-5],[x+3,y-6],[x+7,y-3],[x+6,y-1],[x-5,y-1]]);
          L('#b59360',x-4,cuff,x-1,cuff+2);L('#b59360',x-1,cuff+2,x+3,cuff);
          L('#81904d',x-2,cuff+4,x-2,y-7);R('#ac905d',x+1,y-8,1,1);
        }else{
          limb('#244d61','#2c8490',root,pelvis,x,y-3,kx,ky,10);
          P('#4a685f',[[root+2,pelvis+3],[kx+2,ky-5],[kx-3,ky-5]]);
          P('#b9a36d',[[kx-6,ky-1],[kx+4,ky-2],[kx+7,ky+1],[kx+3,ky+4],[kx-5,ky+2]]);
          P('#40515a',[[kx-5,ky+1],[kx+5,ky],[x+4,y-5],[x+8,y-4],[x+9,y],[x-6,y],[x-5,y-6]]);
          P('#98a6a7',[[kx-4,ky+2],[kx+3,ky+1],[x+2,y-5],[x-4,y-5]]);
          L('#cedbd4',kx-3,ky+2,x-3,y-6,2);L('#e8cc89',kx-5,ky-2,kx+4,ky-2,2);
          for(const j of [3,6])R('#a84d3a',kx+1,ky+j,2,1);
          L('#b55c44',x-4,y-5,x+3,y-5,2);
          P('#583c34',[[x-4,y-3],[x+2,y-4],[x+7,y-3],[x+7,y-1],[x-3,y-1]]);
          L('#b18d76',x+3,y-3,x+6,y-2);
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
        const y=topY+15, apex=profile?6:0;
        P('#243b49',[[shoulderX-3,chest],[opposite+4,chest],[opposite+1,chest+8],[bx+6,waist-3],[bx+13,waist+1],[bx+10,waist+7],[bx-12,waist+7],[bx-10,waist],[bx-7,waist-3],[shoulderX,chest+6]]);
        P('#1d697d',[[shoulderX,chest+1],[opposite+2,chest+2],[bx+7,waist-1],[bx+7,waist+3],[bx-7,waist+3],[bx-9,waist-1]]);
        P('#3793a3',[[shoulderX+2,chest+2],[bx,chest+5],[bx+4,waist-2],[bx-7,waist-4]]);
        for(const [x,sgn] of [[shoulderX,-1],[opposite,1]]){
          P('#3d4c52',[[x-sgn*6,chest],[x+sgn*2,chest-2],[x+sgn*5,chest+1],[x+sgn*6,chest+6],[x-sgn*3,chest+5]]);
          L('#aabdc1',x-sgn*4,chest+1,x+sgn*3,chest+1,2);R('#b4614c',x+sgn*3,chest+3,2,2);
        }
        P('#293942',[[bx-11,waist-3],[bx+10,waist-3],[bx+12,waist+4],[bx-12,waist+6]]);
        L('#bfa76e',bx-11,waist-2,bx+10,waist-2,2);L('#7b908f',bx-11,waist+2,bx+10,waist+1,2);
        O('#625c4d',bx,waist,4,4);O('#cdb378',bx,waist,3,3);O('#809e98',bx,waist,2,2);
        for(const j of [-9,-6,6,9])R('#b35c43',bx+j,waist-1,2,2);
        if(!back){
          const x=bx+(profile?3:0),yy=chest+4;
          P('#292d36',[[x-10,yy-2],[x+9,yy-2],[x+7,yy+6],[x+1,yy+10],[x-6,yy+7]]);
          P('#dbd3b5',[[x-7,yy-1],[x+7,yy-1],[x+5,yy+5],[x,yy+7],[x-5,yy+4]]);
          for(const u of [-3,0,3])L('#ae4b43',x+u,yy-1,x+u,yy+2);
          P('#b04f47',[[x-5,yy+3],[x,yy+1],[x+5,yy+3],[x,yy+5]]);
          R('#eedbb5',x-2,yy+3,4,1);R('#974844',x,yy+3,1,4);
        }else{
          L('#a5b2a9',bx+9,chest+3,bx-8,waist+2,3);L('#77513e',bx+9,chest+5,bx-8,waist+4,2);
        }
        if(foldedImpa){
          L('#34424a',bx-12,chest+8,bx+10,chest+14,8);L('#a8b7b7',bx-12,chest+7,bx+8,chest+12,5);
          L('#edf0dc',bx-11,chest+6,bx+6,chest+11,2);
          L('#3a4b54',bx+11,chest+7,bx-12,chest+13,8);L('#a6b7b7',bx+11,chest+6,bx-11,chest+11,5);
          L('#dbe7dc',bx+9,chest+5,bx-10,chest+10,2);
          R('#a94c3f',bx-6,chest+10,2,2);R('#ac4f44',bx-1,chest+9,2,2);R('#e4be75',bx-13,chest+11,3,2);
        }
        // Heavy black scarf with beadwork sits close under her swept white hair.
        P('#24232b',[[hx-10,y+8],[hx+9,y+7],[hx+14,y+13],[hx+12,y+20],[hx-13,y+20],[hx-15,y+15]]);
        L('#574340',hx-12,y+13,hx+12,y+11,2);L('#292832',hx-10,y+17,hx+11,y+15,3);
        for(const [j,k] of [[-10,14],[-6,15],[-2,15],[2,14],[6,13],[10,12]]){
          R(j%4===2?'#d69d4f':'#aa5541',hx+j,y+k,2,2);
        }
        ears(hx,y+1,9);
        if(!back){
          P('#a16452',[[hx-10,y-6],[hx+10,y-6],[hx+11,y+1],[hx+6,y+9],[hx+2,y+12],[hx-5,y+9],[hx-10,y+5]]);
          P(a.skin,[[hx-8,y-5],[hx+8,y-6],[hx+10,y],[hx+5,y+8],[hx+2,y+10],[hx-4,y+8],[hx-8,y+4]]);
        }
        P('#a4adb4',[[hx-12,y-3],[hx-11,y-10],[hx-7,y-15],[hx-1,y-17],[hx+6,y-16],[hx+10,y-12],[hx+12,y-6],[hx+8,y-2],[hx+3,y-6],[hx-4,y-5],[hx-8,y-1]]);
        P('#ece9db',[[hx-11,y-8],[hx-7,y-13],[hx-1,y-15],[hx+5,y-14],[hx+9,y-10],[hx+9,y-6],[hx+4,y-9],[hx-4,y-7],[hx-8,y-3]]);
        L('#cbd2ce',hx-9,y-8,hx-2,y-13,2);L('#e7e8dc',hx-3,y-10,hx+4,y-13,2);
        L('#7d8b95',hx+6,y-8,hx+9,y-4,2);
        if(!back){
          const strand=hx-9;
          L('#c4d0cf',strand,y-8,strand-2,y+11,2);L('#e7e8d8',strand-1,y-4,strand-2,y+9);
          for(const t of [3,7])R('#bc584c',strand-2,y+t,2,1);
          for(const i of(profile?[5]:[-4,5])){
            L('#7b332f',hx+i-2,y,hx+i+3,y+1,2);
            if(death&&deadFrame>=3)L('#603e37',hx+i-2,y+2,hx+i+2,y+2);
            else{R('#eddab7',hx+i-1,y+1,3,2);R('#a93b3a',hx+i,y+1,1,2);}
            L('#ad482d',hx+i+(i>0?2:-1),y+2,hx+i+(i>0?1:-2),y+5,2);
          }
          P('#b66538',[[hx+apex,y-6],[hx+apex+1,y-3],[hx+apex-1,y-3]]);
          R('#a36351',hx+apex,y+6,2,1);L('#6c3d36',hx+apex-1,y+8,hx+apex+3,y+8);
        }else{
          P('#c3ced0',[[hx-10,y-7],[hx+8,y-9],[hx+10,y-3],[hx+8,y+4],[hx+2,y+8],[hx-6,y+8],[hx-10,y+5]]);
          L('#e9e9dc',hx-6,y-5,hx-6,y+5,2);L('#8b9da3',hx+6,y-6,hx+3,y+6,2);
        }
      }else if(id==='saria'){
        const y=topY+12, fringe=glide?Math.round(beat*3):motion?Math.round(beat):0;
        const cape=profile?9:14;
        // Double-cut leaf tunic and an asymmetric leather wrap over woven green shorts.
        P('#30482d',[[shoulderX-1,chest],[bx-5,chest-3],[bx+5,chest-3],[opposite+2,chest],[bx+7,waist-1],[bx+cape,waist+7],[bx+5,waist+9],[bx,waist+6],[bx-7,waist+9],[bx-cape,waist+6],[bx-7,waist-1]]);
        P('#657d3d',[[shoulderX+1,chest],[opposite,chest],[bx+5,waist-1],[bx+cape-2,waist+6],[bx+4,waist+7],[bx,waist+4],[bx-7,waist+7],[bx-cape+2,waist+5]]);
        P('#81964d',[[shoulderX+3,chest+2],[bx+5,chest+3],[bx+2,waist-2],[bx-7,waist+5],[bx-5,waist-4]]);
        for(const [x,sign] of [[shoulderX,-1],[opposite,1]]){
          P('#3b5231',[[x-sign*3,chest-1],[x+sign*4,chest],[x+sign*5,chest+4],[x+sign*3,chest+5],[x,chest+7],[x-sign*2,chest+4]]);
          L('#9aa45a',x-sign*1,chest+1,x+sign*3,chest+3);
        }
        if(!back){
          L('#b2b178',bx-6,chest+1,bx,chest+6,2);L('#aaa66d',bx,chest+6,bx+6,chest+1,2);
          gem(bx,chest+8,2,'#ddba79');
          for(const [x,sgn] of [[bx-7,-1],[bx+7,1]]){
            L('#acb268',x-sgn*2,waist+1,x+sgn*2,waist+6);
            L('#4e6236',x+sgn*2,waist+6,x+sgn*4,waist+3);
            R('#aab477',x+sgn*2,waist+4,1,1);
          }
        }else{
          L('#a3ad6a',bx-4,chest+3,bx+4,chest+3,2);
          L('#455637',bx,chest+4,bx,waist+5,2);
        }
        L('#453930',bx-cape+3,waist-2,bx+cape-3,waist+2,4);
        L('#846144',bx-cape+3,waist-3,bx+cape-3,waist,2);
        L('#aa8057',bx-cape+4,waist-3,bx+cape-4,waist);
        if(!back){
          for(const o of [-2,2]){
            L('#705240',bx+o,waist+1,bx+o+1,waist+8,2);
            R(o<0?'#b57d54':'#d5ac71',bx+o-1,waist,2,2);
          }
        }
        R(a.shade,hx-3,y+8,7,7);
        // Side-swept yellow-green bob, with a curled end behind each pointed ear.
        P('#51611e',[[hx-15,y-3],[hx-13,y-10],[hx-6,y-15],[hx+5,y-15],[hx+12,y-11],[hx+15,y-5],[hx+14,y+4],[hx+13+fringe,y+10],[hx+7+fringe,y+13],[hx-8+fringe,y+13],[hx-14+fringe,y+8],[hx-17+fringe,y+4]]);
        P('#82922d',[[hx-15+fringe,y+6],[hx-10,y+8],[hx-6,y-1],[hx+11,y],[hx+12+fringe,y+6],[hx+9+fringe,y+11],[hx-8+fringe,y+11]]);
        if(!back){
          ears(hx,y+2,11);
          P(a.shade,[[hx-9,y-4],[hx+11,y-4],[hx+11,y+5],[hx+8,y+10],[hx+4,y+13],[hx-4,y+12],[hx-9,y+8]]);
          P(a.skin,[[hx-8,y-4],[hx+9,y-4],[hx+10,y+4],[hx+7,y+9],[hx+3,y+11],[hx-3,y+11],[hx-8,y+7]]);
        }else{
          P('#97a934',[[hx-13,y-5],[hx+12,y-5],[hx+13,y+5],[hx+9,y+10],[hx+2,y+11],[hx-8,y+10],[hx-12,y+7]]);
          L('#bcce46',hx-7,y-4,hx-9,y+7,2);L('#6f8427',hx+5,y-5,hx+6,y+9,2);
        }
        P('#9aab31',[[hx-14,y-3],[hx-11,y-11],[hx-5,y-14],[hx+5,y-14],[hx+11,y-10],[hx+14,y-5],[hx+13,y-2],[hx+7,y-1],[hx-1,y+2],[hx-7,y+1],[hx-12,y+3]]);
        P('#c3d748',[[hx-13,y-5],[hx-10,y-10],[hx-5,y-12],[hx+3,y-13],[hx+9,y-9],[hx+12,y-6],[hx+7,y-5],[hx+1,y-3],[hx-5,y-2],[hx-10,y+1]]);
        P('#dfe974',[[hx-11,y-6],[hx-9,y-9],[hx-4,y-11],[hx+2,y-11],[hx+6,y-9],[hx-2,y-7],[hx-8,y-4]]);
        L('#697d27',hx-11,y+2,hx+7,y-1);L('#526629',hx+6,y-14,hx+13,y-4,2);
        L('#b1c73f',hx-13+fringe,y+7,hx-8+fringe,y+10,2);
        if(!back){
          for(const i of(profile?[6]:[-4,5])){
            L('#6e6948',hx+i-2,y+3,hx+i+2,y+2);
            if(death&&deadFrame>=4)L('#9b795b',hx+i-2,y+4,hx+i+2,y+4);
            else{
              R('#f4ebd0',hx+i-1,y+3,4,3);R('#3f6283',hx+i+1,y+3,2,3);R('#263b57',hx+i+2,y+4,1,2);
              R('#b1d4d5',hx+i+1,y+3,1,1);
            }
          }
          R('#d69470',hx+(profile?8:1),y+7,2,1);R('#a26856',hx+(profile?7:0),y+10,3,1);
        }
      }else if(id==='ruto'){
        const y=topY+16,span=profile?16:20,forward=profile?5:quarter?3:0,fx=hx+forward;
        // Turquoise Zora torso with the natural sea-blue collar accents of the reference.
        P('#387b87',[[shoulderX-2,chest],[bx-4,chest-4],[bx+5,chest-4],[opposite+2,chest],[bx+7,chest+9],[bx+5,waist-7],[bx+10,waist+3],[bx+6,waist+9],[bx-7,waist+9],[bx-10,waist+3],[bx-5,waist-6],[bx-7,chest+9]]);
        P(a.skin,[[shoulderX,chest],[bx-3,chest-3],[bx+5,chest-3],[opposite,chest+1],[bx+5,chest+9],[bx+3,waist-5],[bx+8,waist+3],[bx+5,waist+6],[bx-6,waist+6],[bx-8,waist+3],[bx-3,waist-6],[bx-5,chest+10]]);
        if(!back){
          P('#a8e1d7',[[bx-4,chest+2],[bx+5,chest+1],[bx+4,chest+9],[bx+2,waist-4],[bx+3,waist+2],[bx-5,waist+3],[bx-4,waist-5],[bx-6,chest+8]]);
          for(const sg of[-1,1]){
            P('#368eaa',[[bx+sg*3,chest-1],[bx+sg*7,chest],[bx+sg*8,chest+3],[bx+sg*3,chest+5]]);
            L('#63bfcc',bx+sg*4,chest+1,bx+sg*6,chest+2,2);
          }
          L('#d3eee1',bx-2,chest+7,bx-2,waist-3,2);
        }else{L('#5ca8b1',bx,chest+3,bx-1,waist+2,2);L('#a3e0d0',bx-2,chest+4,bx-2,waist-4,2);}
        R('#59afae',fx-4,y+9,7,9);if(!back)R('#abe2d5',fx-3,y+10,4,6);
        // Broad, dark-mottled crown crests over the narrow face like a rounded ray fin.
        P('#23586b',[[hx-span,y-2],[hx-span+3,y-8],[hx-9,y-14],[hx-4,y-17],[hx+7,y-17],[hx+16,y-13],[hx+span,y-8],[hx+span-1,y-2],[hx+span-6,y+3],[hx+9,y+6],[hx+5,y+11],[hx-6,y+10],[hx-10,y+7],[hx-span+4,y+4]]);
        P('#358c98',[[hx-span+2,y-2],[hx-span+5,y-7],[hx-8,y-13],[hx-3,y-16],[hx+7,y-16],[hx+15,y-12],[hx+span-1,y-8],[hx+span-3,y-3],[hx+span-7,y+1],[hx+9,y+4],[hx-10,y+5],[hx-span+5,y+2]]);
        P('#58b9b5',[[hx-span+3,y-2],[hx-9,y-7],[hx-5,y-11],[hx+5,y-14],[hx+13,y-12],[hx+span-2,y-7],[hx+span-3,y-5],[hx+8,y-5],[hx+3,y-1],[hx-9,y+1]]);
        P('#317984',[[hx-12,y-9],[hx-8,y-13],[hx-3,y-16],[hx+6,y-15],[hx+9,y-12],[hx+5,y-9],[hx-2,y-10],[hx-8,y-7]]);
        for(const [dx,dy,w,h] of [[-12,-6,4,2],[-7,-11,4,3],[-1,-13,5,3],[4,-15,4,2],[8,-10,4,3],[12,-9,3,2],[-4,-6,4,2],[1,-8,5,2],[-14,-2,3,2]]){
          R('#286877',hx+dx,y+dy,w,h);R('#54abb0',hx+dx+1,y+dy+h,Math.max(1,w-2),1);
        }
        L('#a1ded1',hx-span+4,y-2,hx-10,y-3,2);
        L('#9bd9d0',hx+7,y-7,hx+span-5,y-8,2);
        if(!back){
          P('#468f97',[[fx-9,y],[fx-5,y-5],[fx+1,y-4],[fx+7,y-6],[fx+10,y-3],[fx+10,y+3],[fx+8,y+9],[fx+3,y+14],[fx-3,y+12],[fx-8,y+7]]);
          P('#a1dfd5',[[fx-8,y+1],[fx-5,y-3],[fx+2,y-3],[fx+7,y-4],[fx+9,y-2],[fx+8,y+5],[fx+6,y+9],[fx+2,y+12],[fx-3,y+10],[fx-7,y+6]]);
          P('#c1e9dd',[[fx-3,y+7],[fx,y+2],[fx+3,y+5],[fx+6,y+8],[fx+2,y+10]]);
          for(const i of (profile?[5]:[-4,5])){
            L('#3d566e',fx+i-3,y+1,fx+i+2,y-1,2);
            if(death&&deadFrame>=4)L('#416f81',fx+i-2,y+2,fx+i+2,y+2);
            else{R('#f1e2ed',fx+i-2,y+1,4,2);R('#925891',fx+i,y+1,2,3);R('#533551',fx+i+1,y+1,1,2);}
          }
          L('#75b8b8',fx+2,y+5,fx+3,y+7);
          L('#55778a',fx,y+9,fx+4,y+8);
          for(const sg of profile?[1]:[-1,1]){
            const er=fx+sg*(profile?8:9);
            R('#c6a1ad',er-1,y+4,2,2);
            P('#7d56ad',[[er,y+5],[er+sg*2,y+8],[er+sg*2,y+13],[er-sg*1,y+11],[er-sg*1,y+7]]);
            L('#d58de4',er+sg*1,y+8,er+sg*1,y+11);
          }
        }else{
          L('#6cbab9',hx-5,y-3,hx-2,y+7,2);
          L('#85ccc5',hx+6,y-4,hx+3,y+7,2);
          if(quarter)gem(hx+span-7,y+7,2,'#a774c9');
        }
      }else if(id==='nabooru'){
        const hipLine=waist-9,y=topY+14, fx=hx+(profile?6:1);
        P(a.shade,[[shoulderX-1,chest],[bx-4,chest-4],[bx+5,chest-4],[opposite+1,chest],[opposite-1,chest+7],[bx+6,hipLine-5],[bx+11,hipLine+1],[bx+7,hipLine+6],[bx-9,hipLine+6],[bx-12,hipLine+1],[bx-6,hipLine-6],[shoulderX,chest+6]]);
        P(a.skin,[[shoulderX+1,chest],[bx-4,chest-3],[bx+4,chest-3],[opposite,chest],[bx+7,chest+9],[bx+5,hipLine-5],[bx+10,hipLine],[bx-9,hipLine+1],[bx-4,hipLine-7]]);
        P('#805c52',[[shoulderX+2,chest+5],[bx-3,chest+4],[bx+3,chest+5],[opposite-1,chest+6],
          [bx+7,chest+12],[bx+4,chest+15],[bx-6,chest+15],[bx-8,chest+11]]);
        P('#c4aca5',[[shoulderX+3,chest+6],[bx-3,chest+5],[bx+4,chest+6],[opposite-2,chest+7],
          [bx+5,chest+12],[bx+3,chest+14],[bx-6,chest+13]]);
        if(!back){
          L('#8b564a',bx-7,chest+7,bx-4,chest+12,2);
          L('#3f706b',bx-4,chest+12,bx-2,chest+8,2);
          L('#a46051',bx-1,chest+8,bx+1,chest+12,2);
          L('#3f706b',bx+2,chest+11,bx+4,chest+8,2);
          L('#9f5d40',bx-6,chest+1,bx+6,chest+2,2);
          gem(bx,chest+3,2,'#d49963');
        }
        const shift=air?Math.round(beat*3):motion?Math.round(beat):0;
        P('#65303c',[[bx-12,hipLine-2],[bx-5,hipLine],[bx,hipLine+2],[bx+7,hipLine-1],[bx+11,hipLine+1],
          [bx+14+shift,hipLine+7],[bx+8,hipLine+8],[bx+1,hipLine+10],[bx-5,hipLine+7],[bx-12+shift,hipLine+9]]);
        P('#9a4952',[[bx-11,hipLine],[bx-6,hipLine+1],[bx,hipLine+4],[bx+10,hipLine+1],
          [bx+12+shift,hipLine+6],[bx+7,hipLine+6],[bx,hipLine+8],[bx-6,hipLine+5],[bx-11+shift,hipLine+7]]);
        L('#bb6970',bx-10,hipLine+2,bx-6,hipLine+5,2);L('#bc6571',bx+8,hipLine+3,bx+12+shift,hipLine+6,2);
        gem(bx,hipLine+3,3,'#b17c50');gem(bx,hipLine+3,1,'#dfa66c');
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
      const angle=staging.angle[take];
      if((gesture==='waterBlade'&&take>=3&&take<=6)||(gesture==='giantBlade'&&take===3)){
        const water=gesture==='waterBlade',span=water?[24,36,40,29][take-3]:26;
        c.save();c.translate(axR,ayR);c.rotate(angle);
        P(water?'#3e8fae':'#96a6a8',[[5,4],[17,7],[29,5],[span+7,-1],[span,-5],[21,1],[10,1]]);
        L(water?'#c2edf1':'#e1e4d3',9,5,span+4,-1,2);
        if(water)for(let j=0;j<3;j++)O('#88c9d7',span-2+j*6,-5-j*3,1+j%2,1);
        c.restore();
      }
      giantBlade(c,axR,ayR,angle);
    }else if(gesture==='slingshot'){
      const y=ayR,x=axR+2,pull=take<4?axL:x+5,drawY=take<4?ayL-3:y-3;
      L('#976440',x-4,y+8,x,y,3);L('#dcaa65',x,y,x+4,y-7,2);L('#b57d52',x,y,x+9,y,2);
      L('#e7c7a2',x+4,y-7,pull,drawY);L('#e7c7a2',pull,drawY,x+9,y);
      if(take<4)O('#c7bac1',pull,drawY,2,2);
      if(take===4){
        L('#c7e4a4',x+10,y-4,x+17,y-6,2);O('#e5dbac',x+18,y-6,2,1);
      }
    }else if(gesture==='ocarinaSong'||holdsOcarina){
      if(!back)ocarina(c,holdsOcarina?bx+3+lag:hx+4+beat*2,holdsOcarina?ayL-1:ayR-4);
      if(gesture==='ocarinaSong'&&take>=2&&take<=6){
        for(let i=0;i<Math.min(3,take-1);i++){
          const nY=topY+16-(take-i)*3,nX=hx+16+i*8+lag*2;
          L('#cfed8c',nX,nY,nX,nY-6);L('#cfed8c',nX,nY-6,nX+4,nY-4);O('#e7f2b3',nX-2,nY,2,1.5);
        }
      }
    }else if(gesture==='hammer'||(!gesture&&id==='darunia'&&!glide&&!restingGoron&&!death)){
      const x=axR-3,y=ayR-3,angle=!gesture?-1.1:staging.angle[take];
      if(gesture&&take>=3&&take<=4){
        c.save();c.translate(x,y);c.rotate(angle);
        L('#cfaa70',8,-9,24,-12,2);L('#e6c992',15,-12,31,-15);c.restore();
      }
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
      const charge=take<3;
      if(charge){
        const power=2+take*.85,x=(axL+axR)/2,y=Math.min(ayL,ayR)-7;
        O('#367c9c',x,y,power+2,power+2);O('#71c8d6',x,y,power,power);
        L('#c6f2e9',x-power,y-1,x+1,y-power,2);
        if(ult)for(let i=0;i<2;i++)gem(x+(i?1:-1)*(6+take),y-4-i*3,2,'#b9eeea');
      }else{
        const reach=(ult?17:12)+Math.min(3,take-3)*3,x=axR-1,y=ayR+6;
        P('#386c9f',[[x-7,y+3],[x-1,y-5],[x+reach-3,y-10],[x+reach+4,y-9],[x+reach+7,y-4],[x+reach,y+2],[x+7,y+7]]);
        P('#53a9bd',[[x-4,y+3],[x+2,y-4],[x+reach-2,y-9],[x+reach+4,y-7],[x+reach+2,y-3],[x+9,y+4]]);
        L('#c1eced',x+2,y-4,x+reach-2,y-9,2);
        for(let j=0;j<(ult?4:2);j++)gem(x+reach+j*3,y-10-j*2,1+j%2,'#c3efec');
      }
    }else if(gesture==='spiritSage'){
      const r=[0,0,3,5,7,8,7,5][take],x=bx,y=ayR-8-Math.max(0,take-2)*2;
      if(r){
        O('#945841',x,y,r+1,r+1);O('#db9858',x,y,r,r);O('#f4c878',x,y,r-1,r-1);
        L('#a3644a',x,y-3,x,y+3);L('#a96546',x-2,y+2,x+2,y+2);
        if(take>=3)for(const sign of [-1,1])spark(x+sign*(r+4+surge*4),y-2+(sign<0?3:0),1+take%2,'#f7d995');
      }
    }
    if(glide){
      for(let i=0;i<3;i++){
        const x=-20-i*5-3*lag,y=waist+4+i*3+2*beat;
        if(id==='impa'||id==='nabooru')L(a.accent,x,y,x+5+i,y-2,1);
        else accent(x,y,i);
      }
    }
    if(death){
      const f=deadFrame;
      // Held gear is shown only on the first cel; the world renderer owns every falling prop.
      if(lossKey===0){
        if(id==='impa')giantBlade(c,axR,ayR-1,.25);
        else if(id==='saria'&&!back)ocarina(c,axR-2,ayR-1);
      }
      if(id==='impa'&&f>=4){
        L('#787d70',axL-4,b,axL+5,b,1);
        if(f===4)for(const i of [-1,1])R('#d5bd82',axL+i*7,b-3,2,2);
      }else if(id==='saria'&&f>=5){
        // Her nearer sleeve reaches over the bent knees instead of remaining at the side.
        L('#293d29',bx+3,waist-10,axR,ayR,5);L('#506b46',bx+4,waist-12,axR,ayR-1,2);
        L(a.skin,axR-1,ayR,axR+2,ayR+1,2);
      }else if(id==='nabooru'&&f>=4){
        // Let the loose silk trail along the floor behind the knee, separate from her arm.
        const hx0=bx-10,tip=-19-f*2;
        P('#552e3c',[[hx0,waist-5],[hx0-1,waist+5],[tip-6,b],[tip,b+1],[hx0+6,waist+4]]);
        L('#bd7759',hx0-1,waist+3,tip-2,b-1,1);
        L(a.skin,axR-1,ayR,axR+3,ayR+1,2);
      }
      // Only character-specific dust, magic and foliage remain in the sprite.
      if(id==='saria'){
        if(f>=3)for(let i=0;i<5;i++){
          const a0=i*2.399+fallT*.62,x=Math.cos(a0)*(12+i*4+f),y=b-9-i*4-(f-3)*3;
          if((f+i)%4!==3)gem(x,y,(f+i)%3===0?2:1,['#9db96f','#d9d78c','#aec878'][i%3]);
        }
      }else if(id==='darunia'){
        if(f>=3){
          const phase=f-3;
          for(const sign of [-1,1])for(let i=0;i<4;i++){
            const x=sign*(21+i*5+phase*3),y=b-3-Math.max(0,(i+1)*(5-phase)*.82-phase*2);
            if(f<7||i%2===0){
              P(i%2?'#c19761':'#9c7044',[[x-3,y],[x,y-4],[x+3,y-1],[x+2,y+2],[x-2,y+2]]);
              R('#e2bf81',x-1,y-2,2,1);
            }
          }
          if(f<6)L('#b08a51',-26,b-2,27,b-2);
        }
      }else if(id==='ruto'){
        // Ordered pixel break-up keeps the final camera cell transparent between droplets.
        const erode=[0,0,0,0,14,39,72,100][f];
        if(erode){
          c.save();c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='destination-out';
          for(let yy=0;yy<112;yy+=3)for(let xx=0;xx<112;xx+=3){
            if((xx*29+yy*43+(xx^yy)*7)%100<erode)R('#000',xx,yy,3,3);
          }
          c.restore();
        }
        if(f>=3){
          const w=[0,0,0,12,17,23,27,28][f],xx=5;
          O(f===7?'#326278':'#2c6883',xx,b-2,w,3);
          L('#72becd',xx-w+5,b-2,xx+w-5,b-2);
          for(let i=0;i<8;i++){
            const x=(i%2?-1:1)*(7+i*(f-1)*.57),y=b-5-i%5*(9-f)*1.8-(f<=5?5:1);
            gem(xx+x,y,i%3===0?2:1,['#66bed1','#a8e3df','#498dab'][i%3]);
          }
        }
      }else if(id==='nabooru'&&f>=2){
        const y=[0,0,52,57,61,64,68,72][f],r=[0,0,3,5,6,5,3,2][f];
        for(const sign of [-1,1]){
          const x=sign*(r+4+f),sy=y+(sign<0?2:-3);
          if(f<7)spark(x,sy,f<5?2:1,f<6?'#e9c285':'#b4875f');
          if(f===3||f===5)gem(x+sign*6,sy-5,1,'#d99c78');
        }
      }
    }
    return outline(canvas);
  }
  // World-facing, articulated defeat cels. Coordinates are hips, shoulders, head
  // (x/y/neck angle), then the two knee/foot and two elbow/hand pairs.
  const DEFEAT_JOINTS={
    link:[
      [55,70,55,45,56,28,-5,47,85,46,101,64,84,65,100,40,55,39,65,70,54,70,67],
      [53,69,51,45,48,27,-15,45,84,42,100,66,78,74,95,34,56,30,65,67,51,72,57],
      [52,72,55,48,56,31,4,43,84,42,101,67,85,75,101,40,64,44,72,70,60,75,71],
      [52,77,58,54,62,37,17,43,87,41,102,66,87,71,102,43,72,51,82,73,64,78,77],
      [53,83,60,68,64,52,29,46,97,35,102,68,89,70,102,45,83,52,91,71,82,73,91],
      [54,89,65,76,69,62,37,47,99,35,104,70,92,76,104,47,87,54,92,76,87,78,94],
      [54,90,65,79,71,64,40,47,100,36,105,70,94,76,105,48,89,54,94,75,89,77,95],
      [55,90,65,80,71,65,40,48,100,36,105,70,94,76,105,48,89,54,94,75,90,77,96]],
    zelda:[
      [55,69,55,46,55,27,0,49,87,48,101,63,85,65,101,37,57,34,46,73,55,75,46],
      [55,69,56,47,56,28,6,49,87,48,101,63,85,65,101,35,58,30,52,74,57,79,53],
      [54,73,53,50,52,32,-8,46,90,45,102,64,87,66,102,38,62,42,69,70,64,67,72],
      [55,79,54,56,55,40,4,44,94,41,102,65,91,66,103,40,70,49,79,69,68,58,78],
      [55,84,56,64,57,48,12,46,97,41,103,65,93,65,103,44,77,54,87,68,76,61,87],
      [55,91,55,73,55,59,16,46,98,41,104,66,98,68,105,43,85,51,95,68,85,61,95],
      [55,92,55,77,56,66,23,45,100,39,104,66,101,70,104,44,88,49,96,67,89,61,97],
      [55,93,55,78,55,67,25,45,100,39,104,66,101,70,104,44,89,48,97,67,89,61,97]],
    midna:[
      [56,65,56,42,56,25,0,49,77,48,93,64,77,64,94,38,54,36,65,71,53,71,62],
      [55,62,51,39,49,21,-16,48,73,54,88,64,73,67,89,36,50,31,66,65,42,73,41],
      [56,64,52,41,49,22,-13,53,76,61,90,66,78,68,91,37,53,32,69,68,51,75,56],
      [58,69,55,47,53,28,-5,49,80,55,95,66,83,64,96,39,61,38,75,70,58,78,67],
      [59,78,57,56,56,39,6,49,88,52,103,67,91,64,103,41,69,45,86,71,71,76,87],
      [58,86,59,66,61,53,19,46,94,42,104,68,99,63,105,43,79,48,93,73,79,73,96],
      [58,90,62,76,66,63,25,49,99,42,105,68,100,63,105,46,87,50,99,74,86,72,99],
      [57,91,61,77,65,65,26,48,100,42,105,67,100,63,105,46,88,50,99,73,87,72,99]],
    tetra:[
      [54,71,55,46,56,31,3,47,84,45,101,63,85,64,102,40,52,34,64,70,52,75,63],
      [51,72,48,43,47,33,-22,41,84,34,99,63,78,72,93,32,51,28,56,64,49,69,50],
      [57,75,57,50,54,33,-13,43,87,33,102,71,82,80,99,41,43,33,43,73,59,80,54],
      [58,79,62,54,65,38,15,48,89,36,104,74,93,81,103,46,59,38,74,73,64,84,72],
      [55,84,65,64,70,47,29,45,95,34,104,71,94,79,103,51,75,48,91,79,75,85,93],
      [49,89,63,80,72,65,50,39,96,29,104,64,95,75,105,52,92,53,102,76,87,83,102],
      [46,91,62,88,72,77,61,36,99,25,104,61,100,74,105,49,98,52,103,77,94,83,103],
      [46,91,62,89,73,78,62,36,100,26,104,61,100,74,105,49,99,52,104,77,95,83,103]],
    sheik:[
      [56,69,55,45,55,27,-5,46,84,44,101,65,84,67,101,39,54,35,64,72,55,75,65],
      [58,68,62,44,67,26,24,49,82,43,101,68,81,77,94,47,53,43,69,76,53,84,63],
      [56,72,50,48,46,32,-20,41,81,34,97,66,88,75,101,35,57,30,65,64,62,69,69],
      [60,81,52,56,48,43,-35,44,92,37,102,72,89,81,102,38,69,45,82,66,73,60,81],
      [62,88,52,70,46,53,-42,44,93,41,104,74,96,81,104,37,80,34,100,66,83,59,96],
      [60,91,48,80,42,64,-40,45,96,40,104,73,99,82,105,34,91,31,102,62,91,59,102],
      [59,91,48,81,42,66,-39,45,97,39,104,72,100,81,105,35,92,32,103,62,92,59,103],
      [59,92,48,82,42,67,-37,45,98,39,104,72,100,81,105,35,93,32,103,62,93,59,103]],
    skullkid:[
      [55,68,54,49,54,33,-3,48,73,57,83,65,72,73,78,34,55,31,61,72,50,76,55],
      [53,66,50,47,48,30,-17,48,70,60,78,66,69,75,76,33,53,29,48,69,49,74,44],
      [52,68,48,49,47,30,-19,43,76,49,85,64,73,74,81,29,51,23,48,67,52,74,60],
      [55,74,51,56,48,39,-13,43,81,49,92,66,81,78,90,31,60,26,70,70,62,80,68],
      [54,82,55,66,57,51,12,43,94,48,103,67,86,75,99,36,73,30,84,73,73,82,81],
      [49,88,59,79,65,64,33,37,96,40,105,62,92,73,105,42,89,37,99,75,84,83,97],
      [48,94,60,90,73,78,53,36,99,26,104,61,100,73,105,44,98,37,103,77,94,86,103],
      [48,94,60,91,74,79,54,36,100,27,105,61,100,74,105,44,99,37,104,77,95,86,103]]
  };
  const DEFEAT_COLORS={
    link:['#263c30','#4f6947','#739364','#bcb59d','#e4ddc1','#49362f','#916353','#e6b785'],
    zelda:['#4c3051','#854c79','#ae7297','#927291','#c0a0b9','#5e3a58','#ad7851','#e9be91'],
    midna:['#1e3032','#2e5553','#4d8179','#40857f','#8ac5b7','#265653','#75baad','#91c9bd'],
    tetra:['#3b344f','#4d5884','#7180aa','#667b82','#a7babb','#5b4036','#b38c73','#d6976a'],
    sheik:['#1e2b42','#3b4f74','#607395','#3f5b82','#8796af','#2b3448','#aeb6b5','#e2b895'],
    skullkid:['#56342c','#86523a','#b87b46','#594536','#a4805a','#633831','#af5336','#d2a16b']
  };
  function articulatedDefeat(id,direction,frame){
    const out=surface(112,112),c=out.getContext('2d');
    const f=Math.max(0,Math.min(7,frame)),key=Math.floor(f),u=f-key;
    const [cx,cy,sx,sy,hx,hy,bank,lx,ly,lfx,lfy,rx,ry,rfx,rfy,ex,ey,ax,ay,fx,fy,bx,by]=
      DEFEAT_JOINTS[id][key].map((n,i)=>n+(DEFEAT_JOINTS[id][Math.min(7,key+1)][i]-n)*u);
    const dir=(direction%8+8)%8,mirror=dir>4,view=mirror?8-dir:dir;
    const back=view>=3,side=view===2,w=side?.74:view===1||view===3?.90:1;
    if(mirror){c.translate(112,0);c.scale(-1,1);}
    const P=(col,p)=>polygon(c,col,p),L=(co,x,y,x2,y2,z=1)=>line(c,co,x,y,x2,y2,z),
      R=(co,x,y,ww,hh)=>rect(c,co,x,y,ww,hh),O=(co,x,y,ww,hh)=>oval(c,co,x,y,ww,hh);
    const [dark,body,shine,pants,pantsShine,boot,bootShine,skin]=DEFEAT_COLORS[id];
    const neckX=hx+(sx-hx)*.53,neckY=hy+(sy-hy)*.53;
    const torsoW=(id==='skullkid'?9:13)*w,hipW=(id==='skullkid'?8:10)*w;
    const band=(x,y,vx,vy,size,ink,lite)=>{
      const d=Math.hypot(vx-x,vy-y)||1,nx=(vy-y)/d,ny=(x-vx)/d;
      const shape=(w1,w2,shift=0)=>[[x+nx*(w1+shift),y+ny*(w1+shift)],[vx+nx*(w2+shift),vy+ny*(w2+shift)],
        [vx-nx*(w2-shift),vy-ny*(w2-shift)],[x-nx*(w1-shift),y-ny*(w1-shift)]];
      P(ink,shape(size,size*.85));P(lite,shape(size*.51,size*.44,-size*.14));
    };
    const foot=(x,y,kx,ky,sign)=>{
      const footX=x+sign*(id==='skullkid'?4:2),z=id==='skullkid'?5:6;
      band(kx,ky,x,y-3,4,boot,bootShine);
      P(boot,[[x-4,y-6],[x+4,y-5],[footX+z,y-2],[footX+z-1,y+1],[footX-z,y+1],[x-5,y-2]]);
      L(bootShine,footX-z+1,y-1,footX+z-1,y-1,2);
      R(shine,x-2,y-6,4,2);
    };
    const leg=(xx,yy,tx,ty,px,py,sign)=>{
      const size=id==='skullkid'?3:4;
      band(xx,yy,tx,ty,size+1,dark,pants);
      O(pants,tx,ty,size,size);
      band(tx,ty,px,py-4,size,dark,pantsShine);
      foot(px,py,tx,ty,sign);
    };
    const arm=(xx,yy,tx,ty,px,py)=>{
      const sleeve=id==='zelda'?'#a783a6':id==='midna'?'#396e6d':id==='skullkid'?'#9b6947':shine;
      band(xx,yy,tx,ty,4,dark,body);
      O(sleeve,tx,ty,3,3);
      band(tx,ty,px,py,id==='skullkid'?2:3,dark,sleeve);
      if(id==='sheik'||id==='link')for(let i=1;i<=2;i++){
        const p=(i+1)/4,x=tx+(px-tx)*p,y=ty+(py-ty)*p;
        L(id==='sheik'?'#c2c6bd':'#b18a68',x-2,y,x+2,y+1);
      }
      O(skin,px,py,3,2);R(shine,px-2,py,2,1);
    };
    // Costume fabric is anchored to the chest and pelvis, not skewed with the sprite.
    if(id==='midna'){
      const drift=[-12,-23,-19,-11,-8,-15,-24,-25][key],end=key<4?cy+23:104;
      P('#202831',[[sx-15,sy-5],[sx+11,sy],[cx+15,cy+12],[cx+13,end],[cx+drift,end],[sx+drift,sy+19]]);
      P('#28807a',[[sx-8,sy+2],[sx+6,sy+12],[cx+11,end-1],[cx+drift+2,end],[sx+drift+4,sy+19]]);
      L('#74b9a4',sx+drift+3,sy+25,cx+drift+1,end-3,2);
    }
    if(id==='zelda'){
      const hemL=[35,35,31,30,28,22,20,18][key],hemR=[76,79,80,84,86,90,91,93][key],bottom=105;
      P('#4d3049',[[cx-10,cy-3],[cx+10,cy-3],[Math.max(cx+10,hemR-5),bottom-3],[hemR,bottom],[hemL,bottom],[hemL+8,bottom-6]]);
      P('#d8ccbc',[[cx-8,cy-4],[cx+8,cy-3],[hemR-2,bottom-3],[hemL+3,bottom-4]]);
      P('#f0e3ca',[[cx-9,cy-3],[cx-2,cy-2],[Math.floor((cx+hemL)*.5),bottom-4],[hemL+5,bottom-4]]);
      P('#bbac9e',[[cx+3,cy-2],[cx+9,cy-1],[hemR-5,bottom-3],[Math.floor((cx+hemR)*.5),bottom-3]]);
      L('#ac8047',hemL+4,bottom-4,hemR-3,bottom-4,2);
      for(let i=hemL+5;i<=hemR-4;i+=4){R('#d7b478',i,bottom-5,2,2);R('#f3d398',i+1,bottom-5,1,1);}
      if(key>=4){
        L('#aea094',cx-8,cy+2,hemL+8,bottom-6,2);L('#b9a486',cx+7,cy+2,hemR-9,bottom-6,2);
        L('#fbedd4',cx-4,cy+1,hemL+15,bottom-7);
      }
      if(!back){
        const endY=Math.min(bottom-4,cy+25),endX=cx-4;
        P('#6b3e6a',[[cx-5,cy-2],[cx+4,cy-2],[endX+5,endY-3],[endX,endY],[endX-5,endY-4]]);
        L('#54759d',cx,cy,endX,endY-2,3);R('#e7c479',cx-2,cy+3,3,2);
      }
    }else{
      leg(cx-7*w,cy,lx,ly,lfx,lfy,-1);leg(cx+7*w,cy,rx,ry,rfx,rfy,1);
    }
    if(id==='sheik'||id==='tetra'){
      const tug=(id==='sheik'?[-18,-19,-27,-20,-18,-20,-22,-23]:[-12,-14,-19,-13,-8,-10,-10,-11])[key];
      const endY=sy+(key<4?14:7);
      const pale=id==='sheik'?'#c3c5b9':'#bc5b60',shade=id==='sheik'?'#767f84':'#6c3e54';
      P(shade,[[neckX-3,neckY],[neckX-8,neckY],[sx+tug-3,endY],[sx+tug+7,endY-1],[sx+tug+13,endY-8],[neckX+3,neckY+4]]);
      L(pale,neckX-5,neckY+2,sx+tug+2,endY-1,3);
      if(id==='sheik')L('#b4b9b7',neckX-3,neckY+7,sx+tug+9,endY+2,2);
    }
    if(back){arm(sx-torsoW,sy,ex,ey,ax,ay);arm(sx+torsoW,sy,fx,fy,bx,by);}
    P(dark,[[sx-torsoW,sy-4],[sx+torsoW,sy-4],[cx+hipW+1,cy],[cx+hipW,cy+4],[cx-hipW,cy+4],[cx-hipW-1,cy]]);
    P(body,[[sx-torsoW+2,sy-3],[sx+torsoW-2,sy-3],[cx+hipW-2,cy-1],[cx-hipW+2,cy-1]]);
    P(shine,[[sx-torsoW+3,sy-2],[sx,sy-1],[sx+(cx-sx)*.45,sy+(cy-sy)*.55],[cx-hipW+2,cy-2]]);
    if(id==='link'){
      L('#b1baac',sx-5,sy-3,sx,sy+5,2);L('#9a6b45',sx+7,sy-1,cx-5,cy-4,3);
      L('#543a33',cx-8,cy-6,cx+9,cy-6,3);R('#d7bd79',cx-2,cy-6,4,3);
      for(let i=-7;i<8;i+=3)R('#a1a58a',cx+i,cy+2,2,1);
      L('#37543b',sx+7,sy+3,cx+7,cy-9,2);
    }else if(id==='zelda'){
      L('#d8ad69',sx-8,sy-3,sx+9,sy-3,2);
      L('#d1a053',cx-7,cy-3,cx+7,cy-3,2);R('#e7c584',cx-1,cy-3,3,2);
    }else if(id==='midna'){
      P('#70aba0',[[sx-5,sy+4],[sx+4,sy+5],[cx+4,cy-3],[cx-5,cy-3]]);
      L('#caa25a',cx-8,cy-3,cx+6,cy-2,2);
    }else if(id==='tetra'){
      P('#aa8db6',[[sx-3,sy-2],[sx+4,sy-2],[cx+4,cy-4],[cx-4,cy-4]]);
      L('#be6468',cx-9,cy-3,cx+7,cy,3);
    }else if(id==='sheik'){
      P('#a8aaa8',[[sx-4,sy-1],[sx+6,sy],[sx+3,sy+10],[sx-4,sy+8]]);
      L('#b34d4c',sx-3,sy+3,sx+4,sy+4,2);L('#8d8365',cx-8,cy-3,cx+7,cy-3,2);
    }else{
      L('#a3a15f',sx-8,sy-2,sx+8,sy-2,3);
      L('#5f633e',cx-8,cy-2,cx+7,cy-1,3);
    }
    band(neckX,neckY,sx,sy,3,dark,skin);
    if(!back){arm(sx-torsoW,sy,ex,ey,ax,ay);arm(sx+torsoW,sy,fx,fy,bx,by);}
    // A small independent head cel preserves each original face, cap, mask, and crown.
    const headRow={link:30,zelda:28,midna:26,tetra:29,sheik:29,skullkid:34}[id];
    const maxY={link:48,zelda:46,midna:45,tetra:51,sheik:49,skullkid:62}[id];
    const headView=id==='sheik'&&key>=2?Math.min(4,view+1):view;
    const painted=canvas('hero',id,headView,0,'idle');
    c.save();c.translate(hx,hy);c.rotate(bank*Math.PI/180);c.drawImage(painted,16,0,80,maxY,-40,-headRow,80,maxY);
    if(key>=4&&!back&&id!=='skullkid'){
      const ey=id==='midna'?2:id==='zelda'?3:id==='sheik'?5:5;
      for(const at of (side?[7]:[-7,7])){
        R(id==='midna'?'#8ac5b7':skin,at-3,ey-1,6,3);
        L(id==='midna'?'#346365':'#5d4844',at-3,ey,at+2,ey+1);
      }
    }
    c.restore();
    if(id==='link'&&key>=2){
      const px=[0,0,46,51,55,56,56,56][key],py=[0,0,78,88,93,95,95,95][key];
      P('#627482',[[px-8,py-10],[px,py-13],[px+8,py-10],[px+7,py+2],[px,py+10],[px-7,py+2]]);
      P('#355483',[[px-6,py-8],[px,py-10],[px+6,py-8],[px+5,py+2],[px,py+7],[px-5,py+2]]);
      P('#d8b869',[[px,py-7],[px-3,py-2],[px+3,py-2]]);
      L('#ab5953',px-4,py+1,px,py+4,2);L('#ab5953',px,py+4,px+4,py+1,2);
      L('#d3cfb8',px-7,py-6,px-7,py+1,2);
    }else if(id==='zelda'&&key<=5){
      for(let i=0;i<7-key;i++){
        const theta=i*2.49+f*.37,r=17+f*5,x=sx+Math.cos(theta)*r,y=sy+Math.sin(theta)*r;
        R(i%2?'#d9aa72':'#f3d9a3',x,y,key<3?3:1,key<3?3:2);
        if(key<2)L('#f9e3ad',x-4,y+6,x-8,y-2,2);
      }
    }else if(id==='midna'&&key>=2&&key<7){
      for(let i=0;i<6-key*.55;i++)R(i%2?'#75b8a7':'#735a8a',sx-11+i*6-key*2,Math.min(102,sy+i*4+key*3),2,2);
    }else if(id==='skullkid'){
      for(const sign of [-1,1]){
        const x=56+sign*(21+f*4),y=55-f*5+(sign>0?-4:0);
        O(sign<0?'#eff4d8':'#c0a2df',x,y,key<4?3:1,key<4?3:1);
        if(key<4){L('#a0cec4',x-4,y-5,x-2,y+2,2);L('#bfa8d4',x+4,y-5,x+2,y+2,2);}
        else R('#d9c0e0',x-sign*5,y+4,1,1);
      }
    }
    if(key===4||key===5){
      const dust=id==='midna'?'#73a5a1':id==='zelda'?'#c2a17e':'#a29380';
      R(dust,Math.min(107,lfx-4),104,4,1);R(dust,Math.min(107,rfx+4),103,3,1);
    }
    return outline(out);
  }
  // Authored mermaid-style undulation, not the land rig rotated sideways.
  // Eight keys travel from shoulders to hips to knees to the paired fins.
  const RUTO_SWIM_WATER_ROW=73;
  const RUTO_SWIM_WAVE=[
    [ 0, 0, 2, 4, 5],
    [ 1,-3,-1, 3, 5],
    [ 2,-4,-5,-1, 4],
    [ 1,-2,-6,-7,-4],
    [ 0, 1,-3,-8,-12],
    [-1, 3, 1,-3,-8],
    [-1, 2, 4, 4, 1],
    [ 0, 1, 4, 7, 8],
  ];
  function rutoSurface(direction,frame,tread){
    const canvas=surface(112,112),c=canvas.getContext('2d'),dir=((direction%8)+8)%8;
    const turn=dir*Math.PI/4,sin=Math.sin(turn),cos=Math.cos(turn),side=Math.abs(sin),away=dir>=3&&dir<=5;
    const key=((frame%(tread?4:8))+(tread?4:8))%(tread?4:8);
    const [shoulderWave,hipWave,kneeWave,ankleWave,finWave]=RUTO_SWIM_WAVE[key];
    const bob=tread?[0,1,2,1][key]:shoulderWave;
    const hx=56+sin*(tread?5:24),hy=(tread?45:51+Math.abs(cos)*3)+bob;
    const p=(f,l,y)=>[Math.round(56+sin*f+cos*l),Math.round(70+cos*f*(tread?.32:.17)-sin*l*.24+y+bob)];
    const P=(fill,points)=>polygon(c,fill,points.map(v=>v.map(Math.round)));
    const O=(fill,[x,y],rx,ry)=>oval(c,fill,x,y,rx,ry);
    const L=(fill,[x,y],[a,b],w)=>{const inset=Math.floor(w/2);line(c,fill,x-inset,y-inset,a-inset,b-inset,w);};
    const R=(fill,x,y,w=1,h=1)=>rect(c,fill,x,y,w,h);
    const skin='#76c9c7',shine='#a9e2d6',shade='#2b6781',fin='#3894ad';
    const hip=p(tread?-1:-7,0,tread?16:hipWave-4),chest=p(tread?0:15,0,-8);
    const mix=(a,b,x)=>[Math.round(a[0]*(1-x)+b[0]*x),Math.round(a[1]*(1-x)+b[1]*x)];
    const limb=(start,joint,tip,width)=>{L(shade,start,joint,width);L(shade,joint,tip,width);L(skin,start,joint,width-2);L(skin,joint,tip,width-2);};
    const leg=(sign)=>{
      // Ruto keeps her two Zora legs. Together their outline reads as a single
      // mermaid kick, splitting into a pair of fin tips at the end of the wave.
      const tucked=key>=4&&key<=6?3:0;
      const treadFlex=[0,-1,1,2][key%4];
      const start=p(tread?-1:-8,sign*3,tread?16:hipWave-4);
      const joint=p(tread?-4:-22,sign*(tread?7:3),tread?19+treadFlex:kneeWave-4);
      const ankle=p(tread?-10:-36+tucked,sign*(tread?9:4),tread?25+treadFlex:ankleWave-4);
      const finTip=p(tread?-16:-49+tucked,sign*(tread?13:9),tread?26+treadFlex:finWave-5);
      const flare=p(tread?-14:-43+tucked,sign*(tread?14:10),tread?24+treadFlex:finWave-7);
      const seam=p(tread?-13:-45+tucked,sign*3,tread?28+treadFlex:finWave-3);
      limb(start,joint,ankle,7);
      P(shade,[[ankle[0],ankle[1]-3],flare,finTip,seam,[ankle[0],ankle[1]+2]]);
      P(fin,[ankle,mix(flare,ankle,.17),mix(finTip,seam,.12),mix(seam,ankle,.25)]);
      L(shine,mix(ankle,flare,.24),mix(flare,finTip,.45),1);
    };
    const arm=(sign)=>{
      const ease=tread?[0,1,2,1][key]:0;
      const shoulder=p(tread?0:14,sign*(tread?7:6),-7);
      // Tucked arms trail beside the torso; they never reach ahead of Ruto.
      const joint=tread?p(1,sign*(13+ease),-8+ease):p(5,sign*10,-5);
      const tip=tread?p(3,sign*(21+ease),-6+ease):p(-7,sign*9,hipWave-4);
      limb(shoulder,joint,tip,6);
      const blade=p(tread?0:-5,sign*(tread?18+ease:15),tread?-1:hipWave-5);
      P(shade,[joint,blade,tip,mix(tip,joint,.32)]);
      P(fin,[mix(joint,tip,.3),mix(blade,tip,.2),mix(tip,joint,.16)]);
      O(shine,tip,2,1);
    };
    const far=sin>=0?-1:1;
    leg(far);leg(-far);arm(far);
    const shoulderA=p(tread?0:14,8,-10),shoulderB=p(tread?0:14,-8,-10);
    const ribA=p(tread?0:3,8,-3+hipWave*.36),ribB=p(tread?0:3,-8,-3+hipWave*.36);
    const hipA=p(tread?-1:-9,6,tread?17:hipWave-3),hipB=p(tread?-1:-9,-6,tread?17:hipWave-3);
    P(shade,[shoulderA,[chest[0],chest[1]-6],shoulderB,ribB,hipB,[hip[0],hip[1]+5],hipA,ribA]);
    P(skin,[mix(shoulderA,chest,.18),[chest[0],chest[1]-4],mix(shoulderB,chest,.18),mix(ribB,hip,.15),hipB,[hip[0],hip[1]+3],hipA,mix(ribA,hip,.15)]);
    L(away?'#449da6':shine,mix(chest,hip,.15),mix(hip,chest,.17),4);
    arm(-far);
    // The crest, turquoise cheeks and violet eye stay recognizable at every angle.
    const [cx,cy]=[Math.round(hx),Math.round(hy)],span=Math.round(17-side*4),front=Math.round(sin*5);
    const crown=[[cx-span,cy],[cx-span+3,cy-6],[cx-9,cy-10],[cx-4,cy-12],[cx+6,cy-12],[cx+13,cy-9],[cx+span,cy-6],[cx+span,cy],[cx+span-4,cy+4],[cx+7,cy+6],[cx-8,cy+6],[cx-span+4,cy+4]];
    P('#23586b',crown);O('#3b939e',[cx,cy-3],span-2,7);
    P('#62b9b5',[[cx-span+3,cy-1],[cx-8,cy-9],[cx-2,cy-11],[cx+7,cy-10],[cx+span-2,cy-5],[cx+6,cy-6],[cx-2,cy-3]]);
    for(const [u,v,w] of [[-9,-4,3],[-6,-8,4],[-1,-9,4],[5,-8,3],[10,-5,3],[2,-5,3]])R('#2e707d',cx+u,cy+v,w,2);
    if(away){
      L('#58a4a9',[cx-3,cy+2],[cx-4-front,cy+14],5);
      L('#95d7cf',[cx-2,cy+3],[cx-3-front,cy+10],2);
      if(side>.5){O(skin,[cx+front,cy+3],5,5);R('#794c83',cx+front+(sin>0?3:-3),cy+1,2,2);}
    }else{
      const fx=cx+front;
      P(shade,[[fx-8,cy],[fx-4,cy-4],[fx+4,cy-4],[fx+9,cy],[fx+8,cy+6],[fx+2,cy+11],[fx-3,cy+10],[fx-8,cy+5]]);
      O(shine,[fx,cy+3],7,6);
      const eyes=side>.9?[Math.sign(sin)*4]:[-3,4];
      for(const e of eyes){R('#e6efdb',fx+e-2,cy+1,4,2);R('#895783',fx+e,cy+1,2,2);}
      R('#3e8695',fx+Math.sign(sin),cy+6,3,1);
      if(side>.75)R(shine,fx+Math.sign(sin)*7,cy+4,2,1);
    }
    return outline(canvas);
  }
  function hero(id,direction,frame,action='idle',attackKind=null){
    if(id==='ruto'&&(action==='swim'||action==='tread'))return rutoSurface(direction,frame,action==='tread');
    if(Object.hasOwn(TIME_ALLIES,id))return timeAlly(id,direction,frame,action,attackKind);
    if(action==='death'&&Object.hasOwn(DEFEAT_JOINTS,id))return articulatedDefeat(id,direction,frame);
    const canvas=surface(112,112),c=canvas.getContext('2d');
    // Three charge poses, three quick turning poses and two planted recovery poses.
    const turnStep=id==='link'&&action==='ultimate'?[0,0,-1,1,4,7,8,8][frame%8]:0;
    const dir=(((direction+turnStep)%8)+8)%8,mirror=dir>4,view=mirror?8-dir:dir;
    const back=view>=3,profile=view===2,quarter=view===1||view===3;
    const {phase,beat,lag,swing,snap,glide,jump,dash,walk,idle,hurt,attack,cast,victory,step,sway,lift,rise,tilt,flourish}=heroPose(id,action,frame);
    const air=jump||glide,turn=profile?1:quarter?.8:.6;
    const special=action==='ultimate',gesture=attack||cast?(special?ULTIMATE_GESTURES[id]:attackKind||STARTER_GESTURES[id]):null;
    const key=frame%6;
    // Readable timing at game scale: crouch on anticipation, stretch on impact, then settle.
    // These are draw-only changes; the hit/projectile still resolves in the game loop.
    const ultimateStaging={
      spin:[0,3,5,-1,-3,2,3,0],seal:[0,2,1,-2,-5,-3,0,0],
      fused:[0,4,-1,-4,-6,-4,2,0],waterGun:[0,2,4,-1,4,2,1,0],
      harp:[0,2,1,-2,-3,-1,1,0],moonCrash:[0,0,-2,-5,-7,-5,-1,0],
    };
    const stage=special?Math.min(frame,7):0;
    const settle=special?(ultimateStaging[gesture]?.[stage]||0):0;
    const attackBanks={ember:[-.10,-.17,-.21,.22,.13,.04],sword:[-.08,-.16,-.19,.26,.17,.05],
      leaf:[-.02,-.08,-.12,-.14,.10,.03],shadow:[.02,-.13,-.20,.24,.16,.02],
      cutlass:[-.09,-.21,-.28,.33,.24,.07],kunai:[.09,-.12,-.20,.32,.28,.16]};
    const ultimateBanks={waterGun:[0,-.10,-.22,.16,-.24,-.12,.02,0],seal:[0,-.05,-.08,-.14,-.20,-.14,-.05,0],
      moonCrash:[0,-.03,-.08,-.07,.04,.13,.03,0],harp:[0,.06,.12,-.10,-.06,.06,.04,0],
      fused:[0,-.17,-.21,.05,.13,-.12,.08,0],spin:[0,-.12,-.19,.27,.19,.10,-.09,0]};
    const lean=special?(ultimateBanks[gesture]?.[stage]||0):(attackBanks[gesture]?.[key]||0);
    c.translate(16,0);
    if(mirror){c.translate(80,0);c.scale(-1,1);}
    if(id==='midna'||id==='skullkid'){c.translate(40,0);c.scale(profile?.78:quarter?.94:1,1);c.translate(-40,0);}
    if(gesture==='spin'&&stage>=3&&stage<=5){c.translate(40,0);c.scale(.89,1);c.translate(-40,0);}
    const floatKid=id==='skullkid'&&(idle||walk||glide||gesture==='moonCrash');
    c.translate(0,4+(floatKid?-4-Math.round(lag*2):rise)+settle);
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
      const reach=profile||quarter?1:.56,draw=[2,7,13,17,0,2][key];
      L('#b98443',x,y-15,x+9*reach,y-7,3);L('#f3cf79',x+9*reach,y-7,x+9*reach,y+7,3);
      L('#d8aa60',x+9*reach,y+7,x,y+16,3);L('#fff0b9',x,y-14,x-draw*reach,y);L('#fff0b9',x-draw*reach,y,x,y+14);
      if(key<4){L('#fff5ce',x-(2+draw)*reach,y,x+17*reach,y,2);P('#f8d890',[[x+14*reach,y-3],[x+21*reach,y],[x+14*reach,y+3]]);}
      if(key===3){spark(x+15*reach,y,'#fff5dc',3);R('#e5c56d',x+8*reach,y-6,2,2);}
      if(key===4){L('#fef0b0',x+6*reach,y,x+18*reach,y,2);spark(x+19*reach,y,'#fff5ce',3);}
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
      if(stage===3){O('#3a93b3',x+17,y-2,3,2);R('#b9ebed',x+17,y-3,2,1);}
      else if(stage===4){
        const tip=x+26;
        P('#489ac0',[[x+15,y-4],[tip,y-5],[tip+4,y-2],[tip,y+2],[x+15,y]]);
        L('#e1fbeb',x+16,y-2,tip+3,y-2,2);spark(tip,y-2,'#9deaf3',3);
        R('#9eeafb',tip+7,y-5,2,2);
      }else if(stage===5){R('#a7f4ef',x+23,y+1,2,2);R('#56b7ce',x+28,y-4,2,2);}
    }
    function harp(x,y){
      const t=Math.round(4*beat);
      const arch=[[x-10,y+7],[x-11,y-1],[x-8,y-9],[x-4,y-12],[x+9,y-7],[x+12,y-2],[x+7,y+5],[x+2,y+10],[x-6,y+11],[x-10,y+7]];
      ribbon('#ae745b','#f4c97c',arch,3);
      for(let i=0;i<4;i++)L('#efe5b4',x-6+i*4,y-9+i,x-7+i*4,y+9-i);
      if(stage>=2&&stage<=6){
        for(let i=0;i<(stage>=3?3:1);i++){
          const xx=x+13+i*6,yy=y-4+t-i*6-(stage-2)*2;
          L('#8fdcc7',xx,yy,xx,yy-6);L('#c3f1d3',xx,yy-6,xx+4,yy-4);
          O(i%2?'#f1df9d':'#c3f1d3',xx-1,yy,2,1.5);
        }
        if(stage===3||stage===4)L('#fff4c8',x-7,y-2,x+10,y,2);
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
        const angle=gesture==='spin'?[-.18,-.86,-1.50,1.45,.72,1.62,.99,.20][stage]:
          gesture==='ember'?(back?[.41,-.59,-1.13,.88,1.48,.48]:[.36,-.67,-1.34,1.19,1.69,.35])[key]:
          (back?[.61,-.31,-.89,1.14,1.97,.71]:[.55,-.35,-.89,1.79,2.30,.48])[key];
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
      if(gesture==='cutlass'){
        const blade=[-1.08,-1.85,-2.24,-.48,.65,.21][key];
        if(key===3||key===4){
          const tip=x+Math.cos(blade)*27,y2=y+Math.sin(blade)*21;
          P('#6da7ae',[[x+8,y-10],[tip-2,y2-6],[tip+5,y2-2],[tip-2,y2+3],[x+6,y+1]]);
          L('#dcebe3',x+10,y-8,tip+3,y2-2,2);
        }
        cutlass(x,y,blade);
      }
      if(gesture==='waterGun')waterPistol(x-2,y);
      if(gesture==='kunai'){
        if(key<3)kunai(x,y-1);
        if(key===3){
          L('#bfd4db',x+2,y-3,x+18*turn,y-9,2);L('#5e9da9',x+5,y+2,x+22*turn,y-4);
          spark(x+18*turn,y-8,'#eef5d8',2);
        }
        if(key===4){L('#7ea9b0',x+3,y-3,x+15*turn,y-6);R('#d2e6da',x+3,y-1,2,1);}
      }
      if(gesture==='harp')harp(x-4,y-2);
    }
    if(id==='midna'){
      // The Fused Shadow ultimate alone uses the giant, many-armed transformation.
      if(gesture==='fused'&&stage>=2&&stage<=6){
        const spread=[0,0,5,10,21,18,7,0][stage],y=[0,0,66,57,46,52,62,0][stage];
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
      // True-form Midna: an original pixel interpretation of the supplied Twilight Princess reference.
      // Her ordinary shadow-hand and Fused Shadow ultimate above remain separate combat silhouettes.
      const headX=profile?44:quarter&&!back?42:40,front=profile?5:quarter&&!back?3:0;
      const flutter=Math.round(glide?beat*11:dash?9+beat*5:walk?sway*3:gesture==='shadow'?(-1+snap*8):beat*2);
      const leanTail=glide?Math.round(-8+lag*3):dash?-12:walk?Math.round(lag*2):0;
      const leftShoulder=profile?35:28,rightShoulder=profile?46:51;
      const hip=40+Math.round(sway/2),crouch=air?Math.round(swing*6):0;
      const robeL=15+flutter+leanTail,robeR=65+Math.round(flutter*.65)+leanTail;
      const teal='#78d4c7',tealDark='#36968e',deep='#222e31',ink='#191e26',violet='#332833';
      const gold='#e5a94b',bronze='#93582d',darkGold='#67472d';
      const faceY=27,handFrames=[[57,52,58,73,70,57],[63,47,38,53,48,61]];
      const palmL=glide?[leftShoulder-10+sway,47+Math.round(beat*5)]:
        dash?[leftShoulder-12,50+beat*4]:
        gesture==='fused'&&stage<2?[27-stage*4,59-stage*17]:
        victory?[leftShoulder-10,35-lift/4]:[leftShoulder-5+Math.round(beat*2),63-Math.round(lift*.29)];
      const palmR=glide?[rightShoulder+13+sway,50-Math.round(beat*5)]:
        dash?[rightShoulder+14,56-beat*5]:
        gesture==='fused'&&stage<2?[54+stage*6,57-stage*17]:
        gesture==='shadow'?[handFrames[0][key]-(profile?0:quarter?3:4),handFrames[1][key]]:
        victory?[rightShoulder+9,32-lift/3]:[rightShoulder+5-Math.round(beat*2),65-Math.round(lift*.65)];
      if(glide||dash){
        for(let i=0;i<7;i++){
          const x=10+i*9+(i+frame)%5,y=72+i%3*7+Math.round(Math.sin(i+frame*Math.PI*.5)*4);
          R(i%2?'#596982':'#436575',x,y,2+(i+frame)%3,2);if(i%3===0)R('#8fcac3',x+1,y-1,1,1);
        }
      }
      // Dark outer mantle peels away in motion, exposing the long turquoise lining.
      P(ink,[[31,34],[48,33],[55,41],[57,61],[robeR,81],[robeR-4,87],[hip+7,99],[hip,95],[robeL+11,94],[robeL,85],[23,62],[24,44]]);
      P('#3c3743',[[32,35],[37,38],[28,52],[24,68],[robeL+3,84],[robeL,85],[23,62],[24,44]]);
      P('#246e6c',[[29,57],[34,63],[hip-9,85],[hip-1,94],[robeL+10,93],[robeL+1,84],[26,66]]);
      P('#329b89',[[28,66],[32,72],[hip-13,87],[robeL+8,91],[robeL+3,85]]);
      P('#184c52',[[47,51],[56,61],[robeR-1,81],[robeR-8,87],[hip+7,96],[hip+4,90],[50,70]]);
      P('#2e8f81',[[52,65],[robeR-4,81],[robeR-8,86],[hip+10,89],[hip+9,85]]);
      if(back){
        P('#25232f',[[32,34],[48,34],[54,42],[53,56],[robeR-5,80],[hip+4,95],[robeL+7,89],[25,61],[26,44]]);
        P('#3b3544',[[39,39],[46,43],[45,58],[hip+7,82],[hip+5,93],[hip,85],[38,63]]);
        L('#396767',32,46,29,67);L('#376963',29,67,robeL+9,84);L('#478880',49,47,robeR-13,75);
        ribbon('#27575e','#469d90',[[hip-5,62],[hip+1,67],[hip-4,74],[hip+2,78],[hip+5,74]],2);
      }
      const tucked=glide?8:jump?crouch:dash?Math.round(5+beat*3):0;
      const floatDrift=walk?Math.round(beat*1.1):0;
      const fL=94+floatDrift-tucked,fR=97+floatDrift-tucked;
      if(!back){
        limb('#2b5a61','#529c9b',hip+6,65,hip+7+leanTail,82+floatDrift-tucked,hip+7+leanTail,fR,7);
        P('#52343f',[[hip+3,63],[hip+10,64],[hip+11,74],[hip+12+leanTail,fR-5],[hip+6+leanTail,fR-2],[hip+4,80]]);
        ribbon('#703f49','#b16562',[[hip+5,68],[hip+9,71],[hip+5,76],[hip+10+leanTail,80+floatDrift/2],[hip+6+leanTail,85+floatDrift/2],[hip+11+leanTail,92+floatDrift/2]],2);
        R('#5caea3',hip+6+leanTail,fR-3,5,4);
        const footX=hip-6+leanTail;
        limb('#3d7e79','#86c8ba',hip-4,64,footX,81+floatDrift-tucked,footX-1,fL,9);
        L('#9cdbcb',hip-6,67,footX-3,82+floatDrift-tucked,2);
        P('#70b7ae',[[footX-4,fL-3],[footX+2,fL-3],[footX+4,fL+1],[footX+2,fL+3],[footX-7,fL+2],[footX-7,fL]]);
        L('#59cbc0',hip-7,73,hip-3,75);L('#60d4c3',hip-3,75,hip-7,79);R('#72dcc8',hip-8,76,1,1);
        L(bronze,footX-4,fL-4,footX+3,fL-4,2);L(gold,footX-3,fL-4,footX+1,fL-4);
      }
      // Fitted black bodice with silver-mint skin and a compact gilded hip girdle.
      P('#3c7474',[[35,34],[46,34],[51,42],[51,52],[45,59],[49,64],[45,69],[34,66],[32,61],[34,54],[28,50],[30,42]]);
      if(!back){
        P('#a1d8ca',[[39,39],[46,41],[48,50],[43,54],[45,62],[43,64],[33,62],[37,54],[35,49]]);
        P('#15252d',[[31,41],[37,41],[39,47],[44,44],[48,38],[52,45],[50,51],[44,55],[39,51],[36,57],[31,53],[29,47]]);
        P('#2f5a5c',[[31,43],[36,43],[38,48],[34,51],[31,49]]);
        P('#386768',[[46,44],[50,42],[50,48],[46,51],[42,50]]);
        P('#46323b',[[34,63],[40,64],[46,62],[49,67],[46,72],[40,76],[39,70],[33,69]]);
        L(darkGold,33,63,43,66,3);L(darkGold,43,66,48,63,3);L(gold,34,63,43,65);L(gold,43,65,47,63);
        R('#f4ce77',42,65,2,2);
      }
      const drawArm=(x,hand,right)=>{
        const [hx,hy]=hand,elbow=(x+hx)/2+(right?2:-3),ey=(42+hy)/2+(glide?3:4);
        limb(deep,'#4a6765',x,42,elbow,ey,hx,hy,6);
        L('#3d9289',elbow,ey-1,hx,hy-2,2);
        const a=(elbow+hx)/2,b=(ey+hy)/2;
        L('#70d6c0',a-2,b-1,a+2,b+1);R('#59bcad',hx-2,hy-3,2,2);
        P('#77c4ba',[[hx-2,hy-2],[hx+2,hy-1],[hx+3,hy+2],[hx+1,hy+5],[hx-2,hy+3]]);
        if(glide||victory)fingers(hx,hy,'#9cdccf',2);
      };
      if(!back){drawArm(leftShoulder,palmL,false);drawArm(rightShoulder,palmR,true);}
      else{if(quarter||glide)drawArm(leftShoulder,palmL,false);drawArm(rightShoulder,palmR,true);}
      if(gesture==='shadow'){
        const active=key===3||key===4,reach=profile?1:quarter?.89:.75;
        const hx=palmR[0]+(active?5:2)*reach,hy=palmR[1]-(active?5:4);
        // Original game's grasp is retained as a shaped Twilight projection, not her normal braid.
        limb('#2e2440','#705881',rightShoulder+1,43,palmR[0]-2,palmR[1]+1,hx,hy,active?8:5);
        P('#2f223e',[[hx-5,hy+4],[hx-6,hy-3],[hx-2,hy-8],[hx+5,hy-7],[hx+8,hy],[hx+3,hy+6]]);
        for(const [dy,len] of [[-7,8],[-4,11],[0,12],[4,9]]){
          const end=hx+len*reach*(active?1:.69),ey=hy+dy-(dy<0?4:0);
          L('#342643',hx+3,hy+dy,end,ey,3);L('#a2dec9',hx+5,hy+dy,end-1,ey);
        }
        R('#a8ddc9',hx-1,hy-1,3,2);
        if(active){spark(hx+4,hy-8,'#92d2bf',2);R('#9372a8',hx+10*reach,hy-10,2,2);}
      }else if(gesture==='fused'){
        for(const [x,y] of[palmL,palmR]){
          const size=stage===1?4:2;spark(x,y-5,'#a4ddd2',size);R('#8872a7',x-3,y-10,2,2);
        }
      }else weapon(palmR[0]+2,palmR[1]-4);
      // Black peaked crown, gold filigree, and the single hanging copper braid.
      P('#1c222a',[[headX-11,33],[headX-11,18],[headX-7,12],[headX-3,11],[headX,4],[headX+5,10],[headX+10,15],[headX+11,25],[headX+10,35],[headX+6,39],[headX-8,39]]);
      P('#363444',[[headX-4,15],[headX,7],[headX+4,12],[headX+5,19],[headX,17],[headX-4,20]]);
      for(const s of[-1,1]){
        L(darkGold,headX+s*6,16,headX+s*14,12,2);
        L(gold,headX+s*11,13,headX+s*16,15);
        P('#b49357',[[headX+s*12,12],[headX+s*15,11],[headX+s*17,14],[headX+s*15,14]]);
      }
      if(back){
        P('#4b3239',[[headX-9,21],[headX+7,20],[headX+9,28],[headX+5,36],[headX-6,36],[headX-9,31]]);
        L(darkGold,headX-8,22,headX-6,33,2);L('#a75c32',headX+7,20,headX+5,34,3);
        L('#d98e41',headX+7,23,headX+5,32,1);
      }else{
        const fx=headX+front,hw=profile?6:8;
        P('#4a8583',[[fx-hw,faceY-7],[fx+hw-2,faceY-8],[fx+hw+1,faceY-2],[fx+hw,faceY+4],[fx+2,faceY+10],[fx-4,faceY+8],[fx-hw,faceY+4]]);
        P('#a8dccc',[[fx-hw+2,faceY-6],[fx+hw-1,faceY-6],[fx+hw,faceY+1],[fx+3,faceY+6],[fx+1,faceY+8],[fx-4,faceY+6],[fx-hw+2,faceY+2]]);
        L('#bdf2da',fx+1,faceY-2,fx+3,faceY+3);R('#a55762',fx-1,faceY+5,4,1);
        for(const ex of profile?[fx+4]:[fx-4,fx+4]){
          L('#22454b',ex-2,faceY-1,ex+2,faceY-2,2);
          R('#efa95b',ex,faceY-1,1,2);R('#f9ed9a',ex+1,faceY-2,1,1);
        }
        L('#c17936',headX-9,19,headX-8,31,3);L('#f2b655',headX-8,21,headX-7,27);
        L(bronze,headX-7,18,headX+6,18,3);
        ribbon(bronze,gold,[[headX-7,20],[headX-4,16],[headX,18],[headX+4,16],[headX+8,20]],2);
        L('#f0c174',headX-4,21,headX,24);L('#f0c174',headX,24,headX+5,20);
        R('#52b9ad',headX,21,2,2);
      }
      const braidX=headX+(back?6:8),braidTip=braidX+(back?3:6)+Math.round(flutter*.33);
      ribbon('#934a2d','#df8238',[[braidX-1,23],[braidX,33],[braidX+1,39],[braidTip,43],[braidTip+2,48]],5);
      L('#ffd068',braidX+1,31,braidX+2,39,2);
      for(const y of[32,35,39,43])L('#f1a551',braidX-1+(y-32)*.32,y,braidX+3+(y-32)*.32,y+1);
      R('#e9bc5e',braidTip,44,4,2);O('#ef9b3f',braidTip+2,49,3,5);L('#ffd17a',braidTip+1,46,braidTip+2,50);
    }else if(id==='skullkid'){
      // Majora's Mask sits over the face; the back shows straps and straw hair instead of painted eyes.
      const summoning=gesture==='moonCrash'&&stage>0&&stage<7;
      const cometBeat=summoning?[0,0,1,2,3,3,5,0][stage]:0;
      const fairyBeat=gesture==='fairy'?frame%6:-1;
      // Skull Kid levitates while still and travelling. Both knees hang under the body,
      // lagging side-to-side together, instead of making alternating ground contacts.
      const dangling=floatKid||gesture==='fairy';
      const crouch=dangling?(walk?3+Math.round((lag+1)*2):5)+cometBeat:air?Math.round(4+Math.abs(beat)*4):0;
      const lank=dangling?Math.round(lag*(glide?7:walk?5:3))+(profile?14:quarter?10:5):0;
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
      const playing=fairyBeat>=0&&fairyBeat<=3,marionette=dangling||cast||victory;
      const handL=summoning?[[23,22,19,13,12,10,9,28][stage],[64,50,40,28,24,26,69,64][stage]]:
        playing?[[30,36,39,34][fairyBeat], [65,55,53,52][fairyBeat]]:[marionette?14-sway:16,marionette?59-lift+beat*7:72-lift];
      const handR=summoning?[[51,58,64,66,70,72,73,51][stage],[62,48,36,25,19,24,64,62][stage]]:
        playing?[[47,52,57,66][fairyBeat],[60,52,50,45][fairyBeat]]:[marionette?65+sway:61,marionette?53-lift-beat*7:71-lift];
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
      const fan=profile?44:40,flutter=idle||walk||glide?Math.round(beat*(glide?6:walk?4:2)):cometBeat;
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
      if(playing)horn(handR[0]-3,handR[1]-2);
      if(fairyBeat>=0){
        const path=[[26,62,60,62],[23,60,63,56],[17,51,71,46],[13,45,74,39],[14,31,77,28],[20,38,72,32]][fairyBeat];
        fairy(path[0],path[1],true);fairy(path[2],path[3]);
        if(fairyBeat===3||fairyBeat===4){
          L('#e7d7ad',path[0]+3,path[1]+4,path[0]+10,path[1]+13);
          L('#a978bb',path[2]-2,path[3]+4,path[2]-9,path[3]+13,2);
        }
      }else if(summoning){
        fairy(16-cometBeat,44+beat*8,true);fairy(65+cometBeat,44-lag*8);
        if(stage===6){
          for(const [x,y] of [handL,handR]){L('#9e7189',x+2,y-20,x,y-4,2);spark(x,y-1,'#f3cf9e',4);}
        }
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
        if(link){palmL=[left-9,53-lift+step*.5];palmR=[right+8,44-lift*.35];}
        else if(zelda){palmL=[left-10,57-lift*.45];palmR=[right+10,55-lift*.4];}
        else if(tetra){palmL=[left-11,65-lift+step*.5];palmR=[right+10,40-lift*.7];}
        else if(sheik){palmL=[left-12,49-lift*.35];palmR=[right+11,63-lift*.55];}
      }else if(dash){
        if(link){palmL=[left-11*turn,63+wave];palmR=[right+10*turn,65-wave];}
        else if(zelda){palmL=[left-9*turn,58+wave];palmR=[right+14*turn,54-wave];}
        else if(tetra){palmL=[left-15*turn,61+wave];palmR=[right+12*turn,49-wave];}
        else if(sheik){palmL=[left-19*turn,61+wave];palmR=[right+13*turn,58-wave];}
      }else if(victory){
        palmL=[left-6-flourish,65-lift];palmR=[right+8+flourish,49-lift];
      }else if(walk){
        if(link){palmL=[left-4-step*.65,64+step*.68];palmR=[right+5+step*.65,66-step*.50];}
        else if(zelda){palmL=[left-5+lag*2,65+step*.20];palmR=[right+5+lag*2,65-step*.20];}
        else if(tetra){palmL=[left-3-step*.70,65+step*.61];palmR=[right+7+step*.63,63-step*.55];}
        else if(sheik){palmL=[left-10-step*.79,64+step*.44];palmR=[right+10+step*.79,60-step*.44];}
      }else if(attack||cast){
        if(gesture==='leaf'){
          palmL=[cx+[6,4,0,-4,-8,-5][key]*turn,[59,54,48,47,54,62][key]];
          palmR=[right+[4,9,13,15,12,6][key]*turn,[64,57,51,49,53,60][key]];
        }else if(gesture==='seal'){
          palmL=[cx+[-10,-5,1,-4,-16,-19,-15,-12][stage]*turn,[65,60,45,32,35,46,56,63][stage]];
          palmR=[cx+[13,9,6,16,26,29,23,17][stage]*turn,[63,53,40,22,25,37,49,58][stage]];
        }else if(gesture==='harp'){
          palmL=[cx+[-8,-9,-3,5,0,-6,-2,-8][stage],[65,57,44,49,42,54,49,60][stage]];
          palmR=[cx+[14,12,10,12,12,10,12,14][stage],[66,59,48,48,50,49,53,63][stage]];
        }else if(gesture==='cutlass'){
          palmL=[left+[-4,-1,2,-12,-14,-7][key]*turn,[65,57,51,61,64,64][key]];
          palmR=[right+[3,-4,-9,17,14,6][key]*turn,[64,50,36,58,64,65][key]];
        }else if(gesture==='waterGun'){
          palmR=[cx+[13,8,5,26,19,24,15,13][stage]*turn,[69,55,42,52,44,55,62,66][stage]];
          palmL=[cx+[-12,-8,-3,13,9,12,-5,-12][stage]*turn,[68,60,49,55,45,59,63,66][stage]];
        }else if(gesture==='spin'){
          palmL=[left+[-3,-3,-2,-10,-13,-11,-6,-3][stage]*turn,[68,63,57,60,54,54,63,66][stage]];
          palmR=[right+[4,-1,-9,8,9,7,10,6][stage]*turn,[67,66,66,54,53,57,60,65][stage]];
        }else if(gesture==='ember'||gesture==='sword'){
          const beam=gesture==='ember';
          palmL=[left+[-4,-1,2,-12,-9,-5][key]*turn,[68,62,54,60,64,67][key]];
          palmR=[right+[4,-2,-9,14,12,7][key]*turn,(beam?[66,56,43,53,58,63]:[67,62,55,60,67,66])[key]];
        }else if(gesture==='kunai'){
          palmL=[left+[-3,4,8,-14,-11,-8][key]*turn,[64,59,50,62,65,63][key]];
          palmR=[right+4+[-12,-10,-6,17,12,4][key]*turn,[60,49,36,49,58,63][key]];
        }else{
          palmL=[left-4-Math.round(snap*4),67-lift];
          palmR=[right+5+Math.round(6*snap*turn),66-lift-Math.round(snap*3)];
        }
      }
      const sheikSeal=sheik&&idle&&!back;
      const armPaths=(shade,light,y)=>{
        if(sheik){
          if(sheikSeal){
            palmL=[cx+3,61+beat];palmR=[right+7,31+beat];
          }
          for(const [side,sx,palm] of [[-1,left+1,palmL],[1,right-1,palmR]]){
            const [x,py]=palm,ex=sheikSeal?(side>0?right+2:left-7):(sx+x)*.5+side*3;
            const ey=sheikSeal?(side>0?54:57):glide?(y+py)*.5+5:56+side*step*.35-lift*.5;
            L('#253451',sx,y,ex,ey,8);L('#4b638b',sx+1,y+1,ex+1,ey,4);
            L('#7d858a',ex,ey,x,py,7);L('#d6d6cd',ex+.5,ey-1,x+.5,py-1,4);
            for(const t of [.24,.43,.62,.80]){
              const wx=ex+(x-ex)*t,wy=ey+(py-ey)*t,ww=x-ex,wh=py-ey,norm=Math.hypot(ww,wh)||1;
              L('#a2a3a0',wx-wh*2.7/norm,wy+ww*2.7/norm,wx+wh*2.7/norm,wy-ww*2.7/norm);
            }
            const sx1=sx*.7+ex*.3,sy1=y*.7+ey*.3;
            L('#ad4e42',sx1-3,sy1+1,sx1+3,sy1-1,2);
            O('#222c3d',x,py,4,4);L('#b5a06c',x-3,py-1,x+2,py-2);
          }
          return;
        }
        if(tetra&&idle&&!back&&!profile){
          palmL=[left+1,62];palmR=[right-1,62];
          limb(shade,light,left+2,y,left-10,55,...palmL,5);
          limb(shade,light,right-1,y,right+9,55,...palmR,5);
          return;
        }
        const braking=glide||dash||victory||special;
        limb(shade,light,left-1,y,(left+palmL[0])/2-3,braking?(y+palmL[1])/2+5:57+step/2-lift*.6,...palmL,4);
        limb(shade,light,right-1,y,(right+palmR[0])/2+3,braking?(y+palmR[1])/2+5:56-step/2-lift*.6,...palmR,4);
        if((zelda&&glide)||(sheik&&glide)){fingers(...palmL,light,2);fingers(...palmR,light,2);}
      };
      if(sheik){
        const fan=air||dash||walk?wave+sway:beat*2;
        if(dash)for(let i=0;i<3;i++){
          const x=left-10-i*7,y=53+i*6+beat*3;
          L(i%2?'#80979b':'#697f9d',x,y,x-9+i,y-3,2);
        }
        ribbon('#7f8584','#cdd2cd',[[left+5,38],[left-9,40+fan],[left-22*turn,48+fan],[left-36*turn-(dash?6:0),51+fan]],3);
        ribbon('#a6a7a3','#e3e1d9',[[left+5,43],[left-5,45+fan],[left-16*turn,54+fan],[left-29*turn,56+fan]],2);
      }
      if(tetra){
        const wind=air||dash||walk?wave+sway:beat*2,tail=left-27*turn;
        P('#592c3d',[[left+5,43],[left-6,43],[left-14,40+wind],[tail,45+wind],[tail+5,49+wind],[tail+3,55+wind],
          [left-10,52+wind],[left-3,49],[left+6,49]]);
        P('#b64c58',[[left+3,44],[left-7,45],[left-14,42+wind],[tail+1,46+wind],[tail+7,48+wind],[tail+5,52+wind],
          [left-10,51+wind],[left-4,48],[left+4,49]]);
        L('#e3786a',left-17*turn,46+wind,left-6,47,2);
      }
      if(zelda){
        // Twilight royal regalia: purple bodice, layered ivory skirt, and an embroidered front banner.
        const hem=glide?Math.round(6+beat*5):gesture==='seal'?[0,-2,-4,3,8,6,3,0][stage]:dash?-8+sway:walk||jump?sway*2:sway;
        const skirt=air?5+Math.round(swing*3):0,y0=98-skirt,w=(profile?14:quarter?18:21)+(gesture==='seal'&&stage>=3&&stage<=5?3:0);
        const clothX=cx+hem,dressL=clothX-w,dressR=clothX+w;
        P('#795333',[[cx-13,23],[cx+12,20],[right+4,40],[right+4+sway,67],[right+8+hem,78],[cx+2+hem,72],[left-7+sway,75],[left-6,53]]);
        P('#bd9250',[[cx-10,25],[cx+11,21],[right+2,40],[right+1+sway,65],[right+5+hem,73],[cx+1+hem,67],[left-4+sway,69],[left-4,52]]);
        L('#e0b76b',left-2,44,left-3+sway,64,2);L('#e1b269',right-1,44,right+1+sway,65,2);

        // Full skirt with doubled fabric at the hem and slit-like shadowed folds.
        P('#41263f',[[left+5,62],[right-5,62],[dressR,y0+2],[dressR-8,y0+4],[dressL+4,y0+4],[dressL-1,y0+1]]);
        P('#805072',[[dressL+1,y0-1],[dressR-2,y0-1],[dressR-2,y0+2],[dressR-9,y0+3],[dressL+5,y0+3]]);
        P('#b7ab9b',[[left+6,61],[right-6,61],[right+hem*.8,79-skirt],[dressR,y0-2],[clothX+10,y0-1],[dressL,y0-2],[dressL+8,83-skirt]]);
        P('#e9dfcc',[[left+6,63],[cx+3,65],[clothX+10,y0-2],[dressL,y0-3],[dressL+8,84-skirt]]);
        P('#d3c8b7',[[cx+3,64],[right-6,62],[dressR,y0-3],[clothX+7,y0-2]]);
        P('#f5eddb',[[left+7,66],[left+13,70],[dressL+11,y0-5],[dressL+6,y0-5]]);
        P('#a99e92',[[right-6,66],[right-4,72],[dressR-2,y0-5],[dressR-8,y0-4]]);
        L('#ae833e',dressL+2,y0-5,dressR-2,y0-5,2);L('#efd18c',dressL+3,y0-6,dressR-3,y0-6);
        for(let x=dressL+3;x<dressR-2;x+=4){
          R('#c69752',x,y0-7,2,3);R('#f4d790',x+1,y0-7,1,1);
        }

        // Riding sleeves and calligraphic gold shoulder plates follow the existing pose.
        armPaths('#8f7196','#ccabc5',44);
        for(const [x,y] of[palmL,palmR]){
          R('#684d69',x-2,y-5,5,3);R('#c6985b',x-2,y-5,5,1);
          P('#d8ad8b',[[x-2,y-2],[x+2,y-3],[x+3,y],[x+1,y+3],[x-2,y+2]]);
          R('#f1c5a1',x,y-2,2,3);
        }
        P('#53274e',[[left+1,42],[cx,42],[right-1,42],[right-4,52],[right-6,62],[cx,66],[left+6,62],[left+3,51]]);
        P('#873f79',[[left+4,44],[cx,45],[right-4,43],[right-6,55],[cx+3,62],[left+6,58]]);
        P('#a8588c',[[left+5,46],[cx-1,46],[cx+2,51],[cx-2,55],[left+6,54]]);
        P('#ac8ca8',[[cx-6,40],[cx+6,40],[cx+9,44],[cx,48],[cx-9,44]]);
        P('#a27538',[[cx-8,44],[cx,45],[cx+8,44],[cx+6,47],[cx,50],[cx-6,47]]);
        L('#f1cb80',cx-7,44,cx-2,47);L('#f1cb80',cx+7,44,cx+2,47);R('#744979',cx-1,46,2,2);
        for(const [x,sign] of[[left+2,-1],[right-2,1]]){
          const gy=glide?-1:(sign<0?Math.round(step*.17):Math.round(-step*.17));
          P('#6c4a2e',[[x-sign*4,40+gy],[x+sign*9,38+gy],[x+sign*8,43+gy],[x+sign*6,48+gy],[x+sign*1,50+gy],[x-sign*3,47+gy]]);
          P('#bc8f4b',[[x-sign*3,41+gy],[x+sign*8,39+gy],[x+sign*6,44+gy],[x+sign*4,48+gy],[x,48+gy],[x-sign*2,45+gy]]);
          L('#f4d592',x-sign*2,41+gy,x+sign*7,40+gy);L('#f3c980',x-sign*1,45+gy,x+sign*5,44+gy);
          L('#916639',x+sign*4,45+gy,x+sign*1,47+gy);R('#fff0b6',x-sign*2,42+gy,1,2);
        }
        L('#775034',left+6,62,right-6,62,4);L('#d7ab55',left+6,61,right-6,61,2);
        for(let bx=left+6;bx<=right-6;bx+=3)R('#f3cc7f',bx,61,1,2);

        if(!back){
          // The Hyrule banner turns with the camera, and its point follows the drifting skirt.
          const bx=cx+(profile?5:quarter?3:0),tail=bx+Math.round(hem*.7),tw=profile?5:quarter?7:8,tip=y0-7;
          P('#662e56',[[bx-tw,63],[bx+tw,63],[tail+tw-1,tip-5],[tail,tip+3],[tail-tw+1,tip-5]]);
          P('#b15985',[[bx-tw+1,65],[bx+tw-1,65],[tail+tw-2,tip-5],[tail,tip+1],[tail-tw+2,tip-5]]);
          P('#303e70',[[bx-tw+2,66],[bx+tw-2,66],[tail+tw-3,tip-5],[tail,tip-1],[tail-tw+3,tip-5]]);
          L('#596e9b',bx-tw+3,67,tail-tw+4,tip-6);L('#4f6391',bx+tw-3,67,tail+tw-4,tip-6);
          const tx=bx+Math.round(hem*.24),ty=70,tw2=profile?2:3;
          P('#e8bf63',[[tx,ty],[tx-tw2,ty+5],[tx+tw2,ty+5]]);
          P('#405785',[[tx,ty+2],[tx-1,ty+4],[tx+1,ty+4]]);
          const ex=bx+Math.round(hem*.46),ey=78;
          P('#bd5252',[[ex-4,ey],[ex-1,ey+2],[ex,ey],[ex+1,ey+2],[ex+4,ey],[ex+2,ey+4],[ex,ey+6],[ex-2,ey+4]]);
          R('#ed9b72',ex,ey+2,1,2);L('#7585ac',tail-2,tip-4,tail,tip-2);L('#566b9d',tail+2,tip-4,tail,tip-2);
          O('#bc8a3a',bx,62,3,2);R('#ffdb83',bx-1,61,2,2);
          P('#e7b95d',[[bx-4,63],[bx-2,65],[bx-4,68],[bx-5,66]]);
          P('#e7b95d',[[bx+4,63],[bx+5,66],[bx+4,68],[bx+2,65]]);
        }else{
          L('#a79182',cx,65,clothX+3,y0-7,2);
          P('#723359',[[cx-6,60],[cx+5,60],[cx+4,67],[cx+8+hem,76],[cx+hem,74],[cx-6+hem,76],[cx-4,67]]);
        }
        if(glide)for(const [x,y] of[palmL,palmR]){spark(x+2,y-3+beat,'#fbe198',2+frame%2);R('#fff5cf',x+3,y-4,2,2);}
      }else{
        const pants=link?'#e1debf':tetra?'#677a81':'#374e78',pantsLight=link?'#f6f0d4':tetra?'#bbc8c7':'#7185a7';
        const feet=[(glide?(link?4:tetra?6:9):jump?Math.round(swing*6):0)+step,(glide?(link?6:tetra?9:4):jump?Math.round(swing*4):0)-step];
        const trail=glide?Math.round((sheik?7:tetra?4:3)+beat*2):dash?4:0;
        limb(pants,pantsLight,cx-7,70,cx-9-trail,81-feet[0],cx-10-trail,90-feet[0],6);
        limb(pants,pantsLight,cx+6,70,cx+9-trail,81-feet[1],cx+10-trail,90-feet[1],6);
        if(link){
          for(const s of[-1,1]){
            const x=cx+s*10-trail,y=-feet[s<0?0:1];
            P('#503b37',[[x-3,82+y],[x+4,82+y],[x+5,93+y],[x+8,96+y],[x+7,99+y],[x-5,99+y],[x-5,94+y]]);
            P('#785447',[[x-2,83+y],[x+3,83+y],[x+3,93+y],[x+7,97+y],[x-3,97+y]]);
            R('#a3805a',x-3,83+y,8,2);R('#674239',x-4,90+y,9,2);
            R('#d2ab68',x+1,89+y,3,3);R('#563e35',x+2,90+y,1,1);
            L('#967563',x-3,95+y,x+3,94+y);R('#362a2c',x-5,99+y,13,1);
          }
        }else if(tetra){
          for(const sign of[-1,1]){
            const x=cx+sign*10-trail,k=-feet[sign<0?0:1],w=profile?7:10;
            P('#37454b',[[cx+sign*4-4,70],[cx+sign*4+4,70],[x+w*.6,87+k],[x+w*.18,90+k],[x-w*.55,89+k],[x-w*.7,85+k]]);
            P(sign<0?'#b6c5c5':'#9bafb1',[[cx+sign*4-3,72],[cx+sign*4+3,73],[x+w*.45,86+k],
              [x+w*.18,88+k],[x-w*.52,87+k],[x-w*.54,84+k]]);
            L('#d3d9d0',x-w*.4,87+k,x+w*.35,87+k);R(skin,x-1,89+k,5,7);
            P('#543d38',[[x-2,93+k],[x+4,93+k],[x+5,96+k],[x+7,98+k],[x-3,99+k],[x-4,97+k]]);
            L('#bd9677',x-2,97+k,x+5,97+k,1);L('#382e31',x-1,94+k,x+4,96+k,1);
          }
        }
        else if(sheik){
          for(const sign of [-1,1]){
            const x=cx+sign*10-trail,k=-feet[sign<0?0:1],thigh=cx+sign*7;
            P('#232e4b',[[thigh-5,68],[thigh+4,69],[x+5,84+k],[x+2,90+k],[x-5,86+k]]);
            P('#42648e',[[thigh-3,71],[thigh+3,72],[x+4,83+k],[x+1,87+k],[x-4,84+k]]);
            P('#aab7bf',[[thigh-3,75],[thigh+2,74],[thigh+4,77],[thigh+1,80],[thigh-3,79]]);
            L('#e0ddcc',thigh-2,75,thigh+2,75);L('#d0c7a9',x-2,81+k,x+2,85+k);
            L('#a65043',thigh-4,79,thigh+4,81,2);
            P('#879098',[[x-4,84+k],[x+5,84+k],[x+5,91+k],[x-3,91+k]]);
            L('#dad6ca',x-3,85+k,x+4,86+k);L('#c4c4bc',x-3,88+k,x+4,89+k);
            P('#1d283e',[[x-4,90+k],[x+4,88+k],[x+3,96+k],[x+8,98+k],[x+7,100+k],[x-5,100+k]]);
            P('#39455a',[[x-3,91+k],[x+2,90+k],[x+1,96+k],[x+6,98+k],[x-4,99+k]]);
            L('#9a875b',x-3,91+k,x-4,97+k);L('#a7483a',x-4,93+k,x+2,94+k);
            L('#b0a59c',x+3,99+k,x+7,99+k,2);
          }
        }
        else for(const s of[-1,1]){const x=cx+s*10-trail,boot=-feet[s<0?0:1];P('#684d36',[[x-2,84+boot],[x+5,84+boot],[x+5,94+boot],[x+8,97+boot],[x-4,98+boot],[x-4,94+boot]]);L('#b58c54',x-1,86+boot,x-1,93+boot,2);R('#382f2c',x-4,98+boot,13,1);}
        if(link&&!back){
            const xx=right+(profile?3:0);
            P('#373f42',[[xx-9,39],[xx+1,37],[xx+7,45],[xx+9,53],[xx+3,63],[xx-2,63],[xx+3,53]]);
            L('#b0ada0',xx+1,37,xx+8,52,2);L('#cfcbad',xx+8,52,xx+3,62);
            L('#666c6c',xx+2,43,xx+5,53,2);
        }
        const cloth=link?'#31533a':tetra?'#a698bf':'#314e7b',light=link?'#527149':tetra?'#cbbcdc':'#667da7';
        P(cloth,[[left+3,42],[right-3,42],[right,54],[right-2,68],[right+2,73],[left-2,73],[left+1,63],[left-1,51]]);
        P(light,[[left+4,44],[cx,46],[cx+1,64],[left+3,67]]);L(link?'#91bc74':tetra?'#eea0a1':'#8d9fc0',left+4,46,left+3,58,2);
        const arm=sheik?'#415b84':skin,armLight=sheik?'#9aaaba':tetra?'#dd9d67':'#f3c99a';
        armPaths(arm,armLight,46);
        if(link){
          // Twill tunic over an ivory undershirt, with chainmail at the cuffs and hem.
          const hem=walk||air?sway*1.2:0;
          if(!back){
            P('#3c6246',[[left+2,43],[right-2,43],[right+2,54],[right-4,67],[right+5+hem,76],[left-4+hem,77],[left,66],[left-3,54]]);
            P('#6c8256',[[left+3,45],[cx,48],[cx-3,59],[left+2,65],[left+1,54]]);
            P('#284835',[[right-3,47],[right-1,59],[right-4,68],[right+3+hem,74],[cx+3,72],[cx+4,60]]);
            L('#89a274',left+2,49,left+1,60);
          }
          for(const x of[left-4,right-2]){
            R('#ccc5ab',x,50,7,7);R('#a4a398',x,54,7,4);
            for(let j=0;j<3;j++)R(j%2?'#e1dbbf':'#717875',x+j*2,55+j%2,1,2);
            P('#496947',[[x-1,45],[x+4,43],[x+8,49],[x+6,52],[x-1,51]]);
          }
          if(!back){
            P('#dfd6b7',[[left+5,41],[cx,45],[right-5,41],[right-7,47],[cx,55],[left+7,48]]);
            L('#9a9a8b',cx,47,cx,54);
            L('#3d302f',right-4,42,cx-8,65,6);L('#865a47',right-4,42,cx-8,65,4);
            L('#c0976f',right-5,43,cx-9,64);
            for(let j=1;j<5;j++){const x=right-4+(cx-8-(right-4))*j/5,y=42+23*j/5;R('#c2a179',x,y,1,1);}
            R('#b88f5d',right-11,48,4,4);R('#654437',right-10,49,2,2);
            R('#623832',left-1,62,bw+2,6);R('#93553d',left,63,bw,2);
            R('#cbb18a',cx-2,62,6,6);R('#593d37',cx,64,2,2);
            R('#73503d',right-6,65,6,7);L('#b08961',right-5,66,right-1,66);
            L('#7e8b76',left-3+hem,76,right+4+hem,76,2);
            for(let x=left-2+hem;x<right+3+hem;x+=3)R('#a2a699',x,76,1,2);
          }
          for(const [x,y] of[palmL,palmR]){
            P('#65443b',[[x-3,y-10],[x+4,y-10],[x+4,y-2],[x+2,y+2],[x-3,y+1]]);
            L('#9d725d',x-2,y-9,x-2,y-2,2);R('#be9a77',x-2,y-8,5,1);R('#b0896c',x-2,y-4,4,1);
            R('#d0a37d',x+1,y-1,3,2);
          }
        }else if(tetra){
          // Open indigo pirate vest and a layered red fabric sash over blue-gray trousers.
          P('#332f57',[[left-2,43],[left+5,43],[cx-5,51],[cx-3,62],[left+3,64],[left-5,60],[left-2,54]]);
          P('#4b5695',[[left-1,45],[left+4,45],[cx-6,52],[cx-5,61],[left+2,62],[left-3,60]]);
          P('#354274',[[right-5,43],[right+1,43],[right+3,54],[right+3,62],[right-5,64],[cx+6,60],[cx+7,49]]);
          P('#6374b0',[[right-3,45],[right,45],[right+1,54],[right+1,60],[right-2,61],[right-4,54]]);
          P('#5b2a40',[[left+2,63],[right-2,62],[right+1,70],[cx+4,73],[left-1,71]]);
          P('#b84a56',[[left+3,64],[right-2,63],[right-1,69],[cx+3,71],[left+1,69]]);
          L('#df706d',left+2,67,right-1,66);L('#893c50',left+4,70,right-1,68);
          P('#642d42',[[left+1,42],[cx,44],[right-2,40],[right,45],[cx+1,54],[left+6,50]]);
          P('#be555f',[[left+3,43],[cx,45],[right-3,42],[right-2,45],[cx+1,51],[left+7,48]]);
          L('#f08678',left+5,45,cx+1,49);
          if(!back){
            for(const [x,y]of[palmL,palmR]){
              L('#d8c7aa',x-2,y-5,x+2,y-5,2);L('#87776a',x-1,y-4,x+3,y-4);
            }
            if(idle&&!profile){
              L('#5a453a',right+2,67,right+9,65,2);L('#b49565',right+3,66,right+9,64,1);
              L('#544238',right+3,65,right+4,69,2);
            }
          }
        }else{
          const xh=cx+(profile?4:quarter?3:0),v=profile?7:10;
          P('#24334f',[[left+3,41],[right-1,42],[right+1,51],[right-4,62],[right-2,68],[left+1,69],[left+3,59],[left,49]]);
          P('#354e75',[[left+3,44],[cx-1,46],[xh-1,61],[left+3,66],[left+3,55]]);
          P('#202a41',[[right-4,44],[right-1,47],[right-3,53],[xh+4,53],[xh+2,49]]);
          L('#999581',left+3,42,left+8,44,2);L('#e1c881',right-6,43,right-1,45);
          for(const [lx,sy] of [[left+1,-1],[right-1,1]]){
            L('#405f88',lx,47,lx+sy*4,50,3);
            L('#c05445',lx-sy*1,48,lx+sy*4,52,2);L('#af423a',lx+sy*3,47,lx+sy,53);
          }
          if(!back){
            // Red Sheikah eye and silver embroidered chest inset are smaller than the tunic.
            P('#59687c',[[xh-v,45],[xh+v-1,45],[xh+v-2,60],[xh,65],[xh-v+2,59]]);
            P('#9d9c9a',[[xh-v+2,46],[xh-1,47],[xh+v-2,46],[xh+v-4,55],[xh-1,62],[xh-v+4,55]]);
            for(const j of [-3,0,3])L('#a64a48',xh+j,49,xh+j,52);
            P('#b44c4d',[[xh-5,54],[xh,51],[xh+5,54],[xh,56]]);O('#e1d3b8',xh,54,2,1);R('#b44c4d',xh,54,1,2);
            P('#a94a47',[[xh-1,57],[xh+1,57],[xh+2,60],[xh,62],[xh-2,60]]);
          }
          L('#1a2336',left+3,65,right-3,66,3);L('#a18c64',left+4,65,right-3,65);
          for(const [x,j] of [[left+1,-1],[right-1,1]]){
            O('#b4a77d',x,64,1.5,1.5);L('#29334e',x,66,x+j*5,75,4);
            L('#637897',x,67,x+j*3,72,2);
          }
        }
      }
      // Angular chins, tapered ears, brows and separate profiles retain identity at game scale.
      const hw=link?(profile?10:quarter?12:13):(profile?12:quarter?14:15),faceX=cx+(profile?3:quarter?2:0);
      P('#bd8c61',[[faceX-hw,headY-8],[faceX+hw-1,headY-8],[faceX+hw+1,headY+4],[faceX+9,headY+14],[faceX,headY+18],[faceX-10,headY+12],[faceX-hw-1,headY+3]]);
      P(skin,[[faceX-hw+2,headY-8],[faceX+hw-2,headY-8],[faceX+hw,headY+3],[faceX+8,headY+12],[faceX,headY+15],[faceX-9,headY+10]]);
      if(!profile)P(skin,[[faceX-hw,headY],[faceX-hw-8,headY-4],[faceX-hw-5,headY+5],[faceX-hw,headY+7]]);
      P('#f4cda0',[[faceX+hw-1,headY],[faceX+hw+8,headY-5],[faceX+hw+5,headY+4],[faceX+hw-1,headY+7]]);
      L('#bb895e',faceX+hw+1,headY+2,faceX+hw+5,headY-1);
      const hair=link?'#d6ae4f':tetra?'#e6c65d':'#d9b260';
      if(link){
        // The soft cap trails behind the head rather than sitting like a helmet.
        const tail=faceX-(profile?27:quarter?23:20)+sway;
        P('#274737',[[faceX-14,headY-14],[faceX-8,headY-21],[faceX+4,headY-22],[faceX+12,headY-17],[faceX+13,headY-12],
          [faceX-7,headY-8],[faceX-12,headY+3],[tail+2,headY+16],[tail-3,headY+12],[tail-2,headY+1]]);
        P('#527450',[[faceX-12,headY-15],[faceX-8,headY-20],[faceX+4,headY-20],[faceX+9,headY-16],[faceX-5,headY-12],
          [tail+2,headY+5],[tail,headY+12],[tail-1,headY+5]]);
        L('#779361',faceX-9,headY-18,faceX+3,headY-20);
        P('#9a743d',[[faceX-12,headY-12],[faceX-7,headY-17],[faceX-1,headY-15],[faceX+6,headY-17],[faceX+12,headY-11],
          [faceX+14,headY-3],[faceX+10,headY+6],[faceX+7,headY+8],[faceX+8,headY-2],[faceX+3,headY-5],[faceX-2,headY-10],[faceX-7,headY-3],[faceX-9,headY+6],[faceX-13,headY+5]]);
        P('#e5bc64',[[faceX-10,headY-12],[faceX-6,headY-15],[faceX-1,headY-13],[faceX-4,headY-6],[faceX-8,headY-1],[faceX-10,headY+3]]);
        P('#cfa052',[[faceX,headY-14],[faceX+6,headY-16],[faceX+11,headY-10],[faceX+12,headY-2],[faceX+9,headY+2],[faceX+7,headY-5]]);
        L('#f4d787',faceX-8,headY-13,faceX-4,headY-10);L('#f1cf80',faceX+3,headY-14,faceX+8,headY-9);
      }else if(zelda){
        const cross=faceX+(profile?3:0);
        P('#8b643a',[[faceX-16,headY-6],[faceX-17,headY-12],[faceX-13,headY-17],[faceX-5,headY-20],[faceX+7,headY-19],[faceX+14,headY-15],[faceX+18,headY-9],[faceX+15,headY+1],[faceX+13,headY+13],[faceX+8,headY+14],[faceX+9,headY+3],[faceX+10,headY-6],[cross,headY-8],[faceX-9,headY-6],[faceX-9,headY+6],[faceX-12,headY+12],[faceX-16,headY+6]]);
        P('#ceaa58',[[faceX-15,headY-10],[faceX-10,headY-16],[faceX-3,headY-18],[cross+1,headY-13],[faceX+7,headY-17],[faceX+14,headY-13],[faceX+16,headY-8],[faceX+9,headY-6],[cross+1,headY-9],[faceX-8,headY-6],[faceX-13,headY-4]]);
        P('#efd786',[[faceX-14,headY-10],[faceX-9,headY-15],[faceX-3,headY-17],[cross,headY-12],[faceX-6,headY-9]]);
        P('#f5dfa2',[[cross+1,headY-12],[faceX+6,headY-16],[faceX+11,headY-14],[faceX+15,headY-9],[faceX+8,headY-10]]);
        L('#ba8e47',faceX-14,headY-3,faceX-11,headY+7,2);L('#e2ba64',faceX+14,headY-2,faceX+11,headY+12,2);
        if(!back){
          // Gold tiara at the hairline: a narrow V pointing toward a garnet.
          const crownY=headY-5;
          L('#7b533a',cross-8,crownY-3,cross,crownY+3,2);L('#7b533a',cross+8,crownY-3,cross,crownY+3,2);
          L('#e5b866',cross-8,crownY-3,cross,crownY+2);L('#f9d48a',cross+8,crownY-3,cross,crownY+2);
          R('#a9434c',cross-1,crownY,3,2);R('#e88864',cross,crownY,1,1);
          R('#dcab5a',faceX+hw+3,headY+5,2,4);R('#b36b72',faceX+hw+3,headY+8,2,2);
        }
      }else if(tetra){
        // Curled forelock: a tall hook, with a darker inset spiral that survives sprite scaling.
        const x=faceX,y=headY,twist=profile?5:quarter?3:1;
        P('#555034',[[x-17,y-2],[x-15,y-10],[x-9,y-15],[x+1,y-16],[x+7+twist,y-19],[x+3+twist,y-23],
          [x+4+twist,y-26],[x+10+twist,y-28],[x+15+twist,y-25],[x+16+twist,y-20],[x+12+twist,y-15],
          [x+17,y-8],[x+17,y+4],[x+12,y+12],[x+13,y+3],[x+11,y-5],[x+4,y-4],[x+7,y-9],[x-4,y-5],[x-11,y-1],[x-13,y+6],[x-13,y+11],[x-17,y+5]]);
        P('#adaa61',[[x-16,y-3],[x-14,y-9],[x-8,y-14],[x+3,y-15],[x+9+twist,y-19],[x+5+twist,y-23],
          [x+7+twist,y-26],[x+11+twist,y-27],[x+15+twist,y-23],[x+14+twist,y-19],[x+11+twist,y-15],
          [x+15,y-8],[x+15,y+3],[x+13,y+7],[x+13,y-4],[x+10,y-7],[x+4,y-6],
          [x+6,y-8],[x-2,y-7],[x-9,y-3],[x-13,y+1],[x-14,y+7],[x-15,y+3]]);
        L('#dfd686',x-12,y-8,x+2,y-13,2);
        L('#d9cf83',x+7+twist,y-23,x+10+twist,y-26,2);
        L('#61603c',x+12+twist,y-24,x+13+twist,y-21,2);
        L('#61603c',x+13+twist,y-21,x+10+twist,y-20,2);
        R('#eee1a6',x-10,y-10,4,1);
      }else{
        const y=headY,x=faceX,t=profile?12:15;
        P('#b9b9ad',[[x-t-1,y-8],[x-t-4,y-15],[x-t-1,y-20],[x-8,y-18],[x+2,y-20],[x+10,y-16],[x+t,y-10],[x+t+1,y-3],[x-t,y-3]]);
        P('#eee9d9',[[x-t-2,y-15],[x-t-1,y-19],[x-8,y-16],[x+1,y-18],[x+9,y-15],[x+t-2,y-10],[x+10,y-9],[x-3,y-11]]);
        L('#9b9f9e',x-t-1,y-13,x-8,y-7,2);L('#e0e0d6',x-t-2,y-17,x-9,y-9,2);
        L('#b4b7af',x-9,y-15,x+10,y-13,2);L('#fff3df',x-7,y-15,x+9,y-14);
        P('#ad5936',[[x-t,y-11],[x-6,y-12],[x+8,y-11],[x+t,y-8],[x+t-1,y-5],[x+7,y-8],[x-7,y-8],[x-t,y-7]]);
        L('#e19354',x-t+1,y-10,x+7,y-10,2);L('#d4824a',x+7,y-10,x+t-1,y-7);
        L('#f1e9d7',x-t,y-6,x+t-1,y-5,2);
        if(!back){
          P('#806737',[[x-t,y-5],[x-t+2,y-8],[x-t+10,y-6],[x-t+8,y+5],[x-t+3,y+10],[x-t+2,y+3]]);
          P('#dcb969',[[x-t+1,y-5],[x-t+4,y-7],[x-t+8,y-5],[x-t+7,y+3],[x-t+3,y+7]]);
          P('#d9b96a',[[x+4,y-6],[x+10,y-5],[x+t+1,y+3],[x+t-1,y+7],[x+7,y+4]]);
          L('#ffdd86',x+7,y-5,x+9,y+1);L('#ffdd86',x-t+4,y-5,x-t+4,y+3,2);
        }
        P('#858c8f',[[x-t-1,y+6],[x-4,y+3],[x+6,y+4],[x+t+1,y+7],[x+t-1,y+12],[x+6,y+17],[x+1,y+20],[x-t+2,y+16]]);
        P('#d8d9d0',[[x-t,y+6],[x-4,y+4],[x+6,y+4],[x+t,y+7],[x+8,y+11],[x-6,y+13],[x-t,y+11]]);
        L('#efede0',x-t+3,y+7,x+6,y+7,2);L('#a9ada8',x-t+1,y+12,x+t-1,y+9,2);
        L('#e0ddd1',x-t+4,y+14,x+8,y+11,2);L('#acafa6',x-7,y+16,x+9,y+12,2);
        P('#c3c7c0',[[left+3,42],[left+6,44],[left+2,51+sway],[left-6,55+sway],[left-1,48]]);
      }
      if(back){
        if(tetra){
          P('#3d497f',[[left+1,44],[right-1,43],[right+2,59],[right-1,63],[left-1,63],[left-2,58]]);
          P('#51649f',[[left+3,46],[cx,47],[cx-1,61],[left,60]]);
          L('#737bb5',left+4,47,left+3,57);L('#303254',cx+1,47,cx+3,61);
          L('#a74154',left+1,43,right-2,42,3);
        }
        if(sheik){
          P('#273650',[[left+3,44],[right-3,43],[right-2,59],[right-4,64],[left+3,64],[left+2,56]]);
          L('#a9adb0',left+3,45,right-4,62,3);L('#d1cdb9',left+4,45,right-3,62);
          L('#9f544e',right-3,46,right-7,58,2);
        }
        const hairBack=tetra?'#9c9c55':hair;
        if(!sheik)P(hairBack,[[faceX-12,headY-2],[faceX+12,headY-2],[faceX+11,headY+11],[faceX+5,headY+15],[faceX-10,headY+11]]);
        if(zelda){
          const tx=faceX+Math.round((glide?beat*6:walk?sway*2:sway)),ty=70+(air?-5:0);
          P('#8b6034',[[faceX-13,headY-2],[faceX+13,headY-2],[faceX+13,headY+10],[tx+11,ty-11],[tx+7,ty],[tx-3,ty-3],[tx-12,ty+3],[tx-14,ty-13],[faceX-14,headY+13]]);
          P('#cda357',[[faceX-11,headY-4],[faceX+10,headY-3],[faceX+11,headY+7],[tx+8,ty-11],[tx+6,ty-3],[tx+1,ty-6],[tx-8,ty],[tx-12,ty-15],[faceX-12,headY+8]]);
          P('#e7c47d',[[faceX-10,headY-6],[faceX-4,headY-8],[faceX+4,headY-5],[tx+4,ty-11],[tx-6,ty-4],[tx-8,ty-15]]);
          L('#f5db9c',faceX-5,headY-6,tx-3,ty-14,2);
          L('#a47736',faceX+5,headY+3,tx+7,ty-10,2);
        }
        if(link){
          const tail=faceX+20+sway;
          P('#2e553c',[[faceX-13,headY-15],[faceX-6,headY-21],[faceX+5,headY-21],[faceX+13,headY-12],[tail+3,headY+9],
            [tail+1,headY+18],[tail-6,headY+14],[faceX+6,headY+4],[faceX-4,headY-3],[faceX-13,headY-6]]);
          L('#76915d',faceX-9,headY-16,faceX+3,headY-19,2);L('#50764d',faceX+12,headY-9,tail+1,headY+13,2);
          shield(cx+(quarter?7:0),58);
        }
        if(sheik){
          const x=faceX,y=headY;
          P('#b6bbb1',[[x-13,y-3],[x+12,y-3],[x+13,y+4],[x+9,y+13],[x-10,y+14],[x-13,y+8]]);
          L('#eeead9',x-11,y-2,x+9,y+1,3);L('#919c98',x-11,y+5,x+10,y+7,2);
          L('#e6e0d2',x-9,y+9,x+9,y+9,2);L('#a2a8a3',x-7,y+12,x+8,y+10,2);
        }
      }else{
        const eyesY=headY+2;
        if(sheik){
          for(const x of profile?[faceX+4]:[faceX-(quarter?6:9),faceX+5]){
            L('#534141',x-1,eyesY-2,x+4,eyesY-1);
            R('#f3e1bc',x,eyesY-1,4,2);R('#9f4552',x+1,eyesY-1,2,2);R('#503039',x+2,eyesY-1,1,2);
          }
        }
        else if(link){
          for(const x of profile?[faceX+4]:[faceX-(quarter?6:9),faceX+4]){
            L('#674a34',x-1,eyesY-2,x+4,eyesY-1);
            R('#eee3c9',x,eyesY,5,2);R('#486e8b',x+2,eyesY,2,3);R('#2b485d',x+3,eyesY+1,1,2);
            R('#f9e8ca',x+2,eyesY,1,1);
          }
        }
        else if(tetra){
          for(const x of profile?[faceX+7]:[faceX-(quarter?5:10),faceX+6]){
            P('#f7ead6',[[x-2,eyesY+2],[x,eyesY-1],[x+4,eyesY-1],[x+7,eyesY+2],[x+4,eyesY+5],[x,eyesY+5]]);
            O('#272430',x+2,eyesY+2,2,3);R('#f7ead1',x+1,eyesY,1,1);
            L('#48302d',x-2,eyesY+1,x,eyesY-1);L('#5c4239',x-1,eyesY-4,x+4,eyesY-5);
          }
          L('#713e3a',faceX-3,headY+12,faceX+4,headY+11);
          R('#edb088',faceX+4,headY+10,2,1);
          R('#c28d6d',faceX-8,headY+8,3,1);
        }
        else if(profile)eye(faceX+7,eyesY,'#497b9a');
        else{eye(faceX-(quarter?5:10),eyesY,tetra?'#426d8a':'#4c83a0',tetra);eye(faceX+6,eyesY,tetra?'#426d8a':'#4c83a0',tetra);}
        if(!sheik&&!tetra){R('#bd895e',faceX+2,headY+9,2,2);L('#ac6c53',faceX+1,headY+13,faceX+5,headY+12);if(tetra)L('#6a4b36',faceX+2,headY+13,faceX+7,headY+11);}
        if(action==='hurt')L('#b4856a',faceX-9,eyesY+1,faceX+10,eyesY+1,2);
      }
      if(sheikSeal){
        const [x,y]=palmR;
        O('#222b3b',x,y,4,5);L('#c2a66f',x-3,y+1,x+2,y-1);
        L('#bf8b73',x-1,y-3,x-2,y-9,2);L('#e0b78e',x+1,y-3,x+2,y-10,2);
        R('#f2d1a6',x+1,y-10,2,1);L('#44414e',x+2,y+1,x+5,y+1,2);
      }
      if(link){
        if(!gesture&&!glide&&(!back||victory))
          sword(palmR[0]+(back?3:0),palmR[1]-3,victory?-.2+beat*.13:jump?.55+beat*.1:dash?1.05:-2.18+sway*.04,
            dash||victory?22:jump?31:43);
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
    const t=frame/Math.max(1,count-1),power=action==='attack'?(.58+.42*Math.sin(Math.PI*Math.min(1,.22+t)))*(1-.88*Math.max(0,(t-.6)/.4)) : t;
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
    const eyePhase=id==='gohma'&&typeof variant==='string'&&variant.startsWith('eye-')?variant.split(':'):null;
    if(eyePhase)variant=eyePhase[1]||0;
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
      if(eyePhase?.[0]==='eye-guarded'){
        oval(c,'#4a4b36',64,eyeY,24,22);oval(c,'#8d8253',64,eyeY-3,20,15);
        polygon(c,'#a79a62',[[44,eyeY-8],[54,eyeY-17],[66,eyeY-18],[77,eyeY-12],[84,eyeY-3],[65,eyeY+3],[46,eyeY]]);
        line(c,'#413d32',44,eyeY+4,64,eyeY+8,3);line(c,'#413d32',64,eyeY+8,83,eyeY+2,3);
        if(windup)line(c,'#f2ad67',58,eyeY+5,71,eyeY+4,2);
      }else{
        const open=eyePhase?.[0]==='eye-open';
        oval(c,open?'#ffffbb':'#423c3b',64,eyeY,24,24);oval(c,open?'#fce271':windup?'#f4dc8b':'#c9944b',64,eyeY,19,windup?20-t*7:20);
        oval(c,open?'#fa834d':'#d56842',64,eyeY,10,16);rect(c,'#2e3942',64-pupil/2,eyeY-13,pupil,26);
        rect(c,open?'#fffbd7':'#fff0b7',57,eyeY-10,4,8);
      }
      const jaw=windup?Math.round(t*7):strike?-Math.round(power*7):Math.round(wave*2);
      polygon(c,'#d9c88b',[[44,106],[34-jaw,126-jaw],[55,114]]);polygon(c,'#d9c88b',[[84,106],[94+jaw,126-jaw],[73,114]]);
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
      rect(c,'#487c47',29,39,6,20);polygon(c,'#74ac50',[[30,53],[11,45],[18,60],[31,61]]);polygon(c,'#92bd59',[[34,52],[53,46],[47,59],[32,61]]);const headX=32+(windup?-Math.round(t*5):strike?Math.round(power*5):0),headY=31+bob+(windup?-Math.round(t*4):strike?Math.round(power*4):0);line(c,'#487c47',32,52,headX,headY,5);c.save();c.translate(headX-32,headY-31-bob);oval(c,'#405d95',32,31+bob,16,16);oval(c,'#7398c0',28,27+bob,11,10);rect(c,'#2c3047',18,31+bob,29,windup?9+t*6:strike?13+power*3:7);for(let x=20;x<46;x+=6)polygon(c,'#f6e9c5',[[x,31+bob],[x+4,31+bob],[x+2,36+bob]]);for(const[x,y]of[[22,22],[36,19],[41,26]])rect(c,'#e9dcb2',x,y+bob,4,4);c.restore();
    }else if(type==='bat'){
      const flap=bob*5-(windup?Math.round(t*8):0)+(strike?Math.round(power*10):0),tuck=strike?Math.round(power*7):0;polygon(c,'#655278',[[27,31],[8+tuck,17+flap],[3+tuck,39+flap*.52],[17,34+flap*.35],[23,44]]);polygon(c,'#8e76a6',[[37,31],[56-tuck,17+flap],[61-tuck,39+flap*.52],[47,34+flap*.35],[41,44]]);oval(c,'#49435c',32,37,9,12);polygon(c,'#4d465e',[[24,30],[23,16],[31,27]]);polygon(c,'#4d465e',[[34,27],[42,16],[40,32]]);rect(c,'#f1cf69',26,32,4,4);rect(c,'#f1cf69',35,32,4,4);rect(c,'#e4cfa4',29,43,2,4);rect(c,'#e4cfa4',34,43,2,4);
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
      for(const s of[-1,1])for(let i=0;i<4;i++){const y=28+i*8,step=Math.round(fSin(frame+i*2)*(windup?2:strike?7:4));line(c,'#a0824f',32+s*9,y,32+s*(23+i%2*5),y-9+step,3);line(c,'#b9a471',32+s*(23+i%2*5),y-9+step,32+s*(25-i%2*3+(strike?3*power:0)),y+10-step,3);}
      oval(c,'#a99665',32,36,13,19);oval(c,'#e1d6a8',32,33,10,12);oval(c,'#3d3942',27,32,4,5);oval(c,'#3d3942',38,32,4,5);rect(c,'#51433e',30,38,5,6);for(let x=25;x<41;x+=5)rect(c,'#e6dcb8',x,45,3,5);
    }else if(id==='deku_scrub'){
      polygon(c,'#3c773e',[[11,56],[21,42],[28,49],[41,39],[54,57]]);oval(c,'#855b38',32,40+bob,14,17);oval(c,'#b0884d',28,36+bob,10,12);rect(c,'#eeb95c',24,33+bob,4,5);rect(c,'#eeb95c',37,33+bob,4,5);oval(c,'#563c30',33,46+bob,7,6);rect(c,'#b39258',30,42+bob,15,8);rect(c,'#302e35',40,44+bob,5,4);const leafTilt=bob+(windup?Math.round(t*5):strike?-Math.round(power*6):0);polygon(c,'#78a44e',[[32,27+bob],[16-leafTilt,18+leafTilt],[17,30+bob],[30,31+bob],[45+leafTilt,12+leafTilt],[46,27+bob]]);
    }else if(id==='octorok'){
      for(let i=0;i<4;i++)oval(c,'#a64848',14+i*12,58+Math.round(Math.sin(frame+i)*2),8,5);
      oval(c,'#c75f59',32,40+bob,20,18);oval(c,'#e98e73',26,34+bob,13,10);oval(c,'#eee7c7',24,40+bob,5,6);oval(c,'#eee7c7',40,40+bob,5,6);rect(c,'#2f3541',24,41+bob,2,4);rect(c,'#2f3541',38,41+bob,2,4);oval(c,'#a44445',32,51+bob,7,9);oval(c,'#442e3a',32,55+bob,5+(windup?2*t:0),5+(strike?3*power:0));
    }else if(id==='tektite'){
      for(const s of[-1,1])for(const d of[-1,1]){line(c,'#bb6c43',32+s*7,42,32+s*24,35+d*11+bob,3);line(c,'#e0a66b',32+s*24,35+d*11+bob,32+s*22,58+d*5,3);}oval(c,'#af5e42',32,39+bob,14,12);oval(c,'#eaa769',30,35+bob,10,7);oval(c,'#ead9a3',32,41+bob,7,7);rect(c,'#40333e',31,36+bob,3,10);
    }else if(id==='lizalfos'){
      polygon(c,'#41734f',[[24,56],[7,62],[12,50],[23,45]]);rect(c,'#4b8054',25,50-bob,7,14);rect(c,'#4b8054',39,50+bob,7,14);oval(c,'#558c57',33,41,12,16);oval(c,'#6ea960',34,25+bob,12,11);rect(c,'#8dbb6e',34,27+bob,21,9);rect(c,'#e4d490',40,28+bob,5,3);rect(c,'#313d39',38,22+bob,4,3);for(let y=18;y<51;y+=8)polygon(c,'#ba9362',[[23,y],[16,y+5],[25,y+8]]);const handX=windup?48-t*7:strike?47+power*7:47,handY=windup?43-t*11:strike?42+power*8:44+bob;line(c,'#446f50',35,39,handX,handY,5);line(c,'#a9c4ca',handX,handY,windup?handX-10:strike?handX+9:58,windup?handY-17:strike?handY+8:34,4);rect(c,'#8b6b47',handX-4,handY-1,8,3);
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

  // Each family breaks along different parts of its silhouette. Source slices retain
  // the actual palette, markings and face; none of these finishers rolls the whole sprite.
  const ENEMY_FALL={
    chuchu:'pool',blue_chuchu:'pool',little_frox:'stumble',tektite:'spring',
    deku_baba:'stem',deku_scrub:'burrow',octorok:'jet',skulltula:'shell',
    keese:'fold',seahat:'rotor',takkuri:'fold',shadow_kargarok:'shards',
    bokoblin:'stumble',gloom_bokoblin:'shards',lizalfos:'stumble',shadow_beast:'shards',
    shadow_vermin:'shards',remlit:'spring',evermean:'timber',
    slime:'pool',mushroom:'stem',bat:'fold',boar:'stumble',
  };
  const BOSS_FALL={
    gohma:'shell',morpha:'jet',kingbulblin:'stumble',helmaroc:'fold',zant:'shards',
    ghirahim:'shards',colgera:'ice',majora:'mask',ganondorf:'stumble',phantom:'shards',
  };
  function enemyDefeatCanvas(kind,id,frame){
    const chief=kind==='boss',style=(chief?BOSS_FALL[id]:ENEMY_FALL[id])||'stumble';
    const color=(chief?BOSS_MOTION[id]?.[1]:MOB_MOTION[id]?.[1])||'#d9c59b';
    const art=chief?boss(id,0,'idle',id==='gohma'?'eye-open:':0):enemy(id,0);
    const w=art.width,h=art.height,out=surface(w,h),ctx=out.getContext('2d');
    const q=chief?2:1,n=Math.max(0,Math.min(7,frame)),t=n/7,
      drop=Math.max(0,(t-.13)/.87),sink=drop*drop;
    ctx.imageSmoothingEnabled=false;
    function strip(x,y,ww,hh,dx,dy,dw=ww,dh=hh){
      if(dw<1||dh<1)return;
      ctx.drawImage(art,x,y,ww,hh,Math.round(dx),Math.round(dy),Math.round(dw),Math.round(dh));
    }
    if(style==='pool'||style==='jet'||style==='burrow'){
      // The top sinks faster than the base: jelly becomes a puddle, a scrub
      // sinks behind its leaves, and watery bodies shed droplets.
      const shrink=style==='burrow'?0:drop*.79, stretch=1+(style==='pool'?.21:.09)*drop;
      const dw=w*stretch, dh=h*(1-shrink);
      ctx.save();ctx.beginPath();ctx.rect(0,0,w,h-5*q);ctx.clip();
      strip(0,0,w,h,(w-dw)/2,h-dh+(style==='burrow'?drop*43*q:0),dw,dh);ctx.restore();
      if(n>=2&&style!=='burrow'){
        oval(ctx,color,w*.5,h-7*q,(7+10*drop)*q,(1+2*drop)*q);
      }
    }else if(style==='shards'||style==='ice'||style==='mask'){
      // A readable first recoil, then separate pieces spread away from the core.
      const block=(style==='ice'?13:style==='mask'?16:8)*q;
      for(let y=0;y<h;y+=block)for(let x=0;x<w;x+=block){
        const ww=Math.min(block,w-x),hh=Math.min(block,h-y),k=Math.floor(x/block)+Math.floor(y/block)*7;
        if(n>4&&((k+1)%5)<n-4)continue;
        const spread=style==='ice'?17:style==='mask'?12:23;
        strip(x,y,ww,hh,x+(x-w*.5)/w*drop*spread*q,y+(style==='shards'?-12:11)*drop*q+(k%3-1)*drop*10*q);
      }
    }else if(style==='shell'||style==='fold'||style==='rotor'){
      // Legs pull inward on a shell, wings close over a bird, or a rotor breaks
      // separately from the round body. These are separate sprite parts.
      const side=Math.round(w*.31),mid=w-2*side;
      const tilt=Math.sin(t*Math.PI)*3*q, fold=drop*(style==='fold'?16:9)*q;
      const fall=(style==='shell'?8:style==='fold'?11:13)*q*sink;
      if(style==='rotor'){
        const roof=Math.round(h*.43);
        strip(0,0,w,roof,-drop*12*q,fall+drop*7*q,w,roof*(1-.55*drop));
        strip(0,roof,w,h-roof,tilt,roof+fall,w,(h-roof)*(1-.28*drop));
      }else{
        strip(0,0,side,h,fold,fall,side*(1-.30*drop),h*(1-.13*drop));
        strip(w-side,0,side,h,w-side-fold+side*.30*drop,fall,side*(1-.30*drop),h*(1-.13*drop));
        strip(side,0,mid,h,side,fall+drop*(style==='shell'?20:12)*q,mid,h*(1-.24*drop));
      }
    }else if(style==='stem'){
      strip(0,49,w,h-49,0,49);
      const headX=32+Math.round(drop*19),headY=32+Math.round(drop*18);
      line(ctx,'#284b36',32,59,32+drop*4,51,6);
      line(ctx,'#487c47',32,58,32+drop*7,50,5);
      line(ctx,'#53814b',32+drop*7,50,headX,headY+9,5);
      ctx.save();ctx.translate(headX,headY);ctx.rotate(drop*.65);
      strip(11,10,42,34,-21,-22);ctx.restore();
    }else if(style==='timber'){
      // The roots stay down while the trunk and crown tip together at their joint.
      strip(0,52,w,h-52,-drop*3,52+drop*4);
      ctx.save();ctx.translate(32,54+drop*6);ctx.rotate(drop>.13?1.31*((drop-.13)/.87)**.76:0);
      strip(0,0,w,54,-32,-54);ctx.restore();
    }else{
      // Knees give way first, followed by the head and shoulders.
      const legs=Math.round(h*.67),shoulders=Math.round(h*.36);
      const lean=(style==='spring'?8:14)*q*drop;
      const settle=(style==='spring'?-6*Math.sin(Math.PI*drop):0)*q;
      strip(0,legs,w,h-legs,-lean*.14,legs+11*q*drop,w,(h-legs)*(1-.22*drop));
      strip(0,shoulders-2*q,w,legs-shoulders+4*q,lean*.62,shoulders-2*q+9*q*drop+settle,w,(legs-shoulders+4*q)*(1-.10*drop));
      strip(0,0,w,shoulders+3*q,lean,8*q*drop+settle,w,shoulders+3*q);
    }
    if(n>=2){
      // Discrete, material-colored pixels read as dust, leaves, water or magic.
      for(let k=0;k<(chief?11:6);k++){
        const dir=k%2?1:-1, dx=(6+k%4*5+(10+k%3*3)*drop)*q*dir,
          y=(style==='shards'||style==='ice'?h*.54:h*.87)-(Math.sin(drop*Math.PI)*(8+k%4*4)+k%3*2)*q;
        if(n>5&&k%3===0)continue;
        rect(ctx,k%3===1?'#e7dcb5':color,w*.5+dx,y,(k%3===0?3:2)*q,(k%2?2:1)*q);
      }
    }
    return out;
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
      }else if(action==='death'&&(kind==='enemy'||kind==='boss'))source=enemyDefeatCanvas(kind,id,frame);
      else source=kind==='hero'?hero(id,direction,frame,action,variant):kind==='enemy'?enemy(id,frame,action):kind==='boss'?boss(id,frame,action,direction):kind==='projectile'?projectile(id,direction,frame):kind==='tree'?tree(id,frame):kind==='prop'?prop(id,frame):kind==='moon'?(id==='crash'?moonCrashFace():moon()):kind==='clock'?clock():plant(id,frame);
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
    const half=BonkTerrain.LIMIT*4,size=half*2;
    const tile=surface(size,size),c=tile.getContext('2d'),rand=artRandom(871+realm*1237+stage*37),layout=BonkTerrain.layout(realm,stage),point=value=>half+value*4;
    const earth=['#b1a875','#e2ce9e','#97909f','#c1b891','#7b717a','#b3ab8c','#a29868','#c3c9a2'][realm];
    const moss=['#647c49','#cfb681','#514e71','#8aa55b','#535969','#748472','#4c7b41','#608c6a'][realm];
    c.globalAlpha=.23;
    for(const patch of layout.patches){const x=point(patch.x),y=point(patch.z),r=patch.radius*4;c.fillStyle=moss;c.beginPath();for(let i=0;i<12;i++){const a=i*Math.PI/6,rad=r*(.8+rand()*.35);if(i)c.lineTo(Math.round(x+Math.cos(a)*rad),Math.round(y+Math.sin(a)*rad));else c.moveTo(Math.round(x+rad),Math.round(y));}c.closePath();c.fill();}
    c.globalAlpha=1;
    if(realm===BonkTerrain.ZORA_REALM){
      const {basin,jabu}=BonkTerrain.ZORA_FOUNTAIN;
      // Short square ripples and tidal stains follow the actual depth profile.
      for(let i=0;i<540;i++){
        const x=basin.x+(rand()-.5)*82,z=basin.z+(rand()-.5)*59,depth=BonkTerrain.fountainBasin(x,z);
        if(depth<.10||depth>.68)continue;
        c.globalAlpha=.24+rand()*.25;
        rect(c,i%3?'#83bfbc':'#bdd1b7',point(x),point(z),2+Math.floor(rand()*8),1+Math.floor(rand()*2));
      }
      c.globalAlpha=1;
      for(let k=0;k<24;k++){
        const t=k/23,x=point(jabu.x*t*.85),z=point(-9-k);
        rect(c,'#5f817e',x-14,z-2,29,4);
        rect(c,k%3===0?'#a7c1b5':'#92aea7',x-12,z-2,25,3);
        rect(c,'#c1d4c3',x-12,z-2,25,1);
        rect(c,'#778f8b',x+(k%2===0?4:-6),z-1,1,2);
      }
      oval(c,'#607e7a',half,point(-7),17,17);oval(c,'#abc2ae',half,point(-7),14,14);oval(c,'#82a89d',half,point(-7),10,10);
    }
    if(realm===BonkTerrain.GREAT_SEA_REALM){
      const T=BonkTerrain,coast=[];
      for(let z=T.SEA_SHORE_START;z<=T.SEA_SHORE_END;z+=T.SEA_SHORE_STEP)coast.push([point(T.seaShoreX(stage,z)),point(z)]);
      const band=(offset,color)=>{c.fillStyle=color;c.beginPath();c.moveTo(size,coast[0][1]);for(const[x,y]of coast)c.lineTo(x+offset,y);c.lineTo(size,coast.at(-1)[1]);c.closePath();c.fill();};
      band(-14,'#e3d2a1');band(-5,'#8cbbaa');band(1,'#4b9eab');band(18,'#418e9e');
      for(let i=0;i<270;i++){const x=point(18+rand()*(BonkTerrain.LIMIT-18)),y=point(-37+rand()*74);rect(c,i%5===0?'#a6d9cc':'#70b5b9',x,y,3+rand()*12,1);if(i%8===0){oval(c,'#467b63',x,y,3,2);rect(c,'#9cbb7d',x-2,y,2,1);}}
      for(let i=0;i<70;i++){const y=point(-38+rand()*76),x=point(12+rand()*3);rect(c,i%3?'#a6b99b':'#e2dbb5',x,y,2,1);}
    }
    // Wide worn paths radiate from the shrine plaza into the surrounding terrain.
    c.lineCap='round';c.lineJoin='round';
    for(const trail of realm===BonkTerrain.ZORA_REALM?[]:BonkTerrain.SCENIC_TRAILS){
      const length=Math.hypot(trail.x,trail.z),nx=-trail.z/length,nz=trail.x/length,bend=(realm%2?1:-1)*1.3;
      c.strokeStyle=moss;c.lineWidth=21;c.beginPath();c.moveTo(half,half);c.bezierCurveTo(point(trail.x*.3+nx*bend),point(trail.z*.3+nz*bend),point(trail.x*.7-nx*bend),point(trail.z*.7-nz*bend),point(trail.x),point(trail.z));c.stroke();
      c.strokeStyle=earth;c.lineWidth=14;c.stroke();c.strokeStyle=realm===2?'#b1a6af':realm===4?'#998991':'#d1c79e';c.globalAlpha=.33;c.lineWidth=6;c.stroke();c.globalAlpha=1;
      for(let i=3;i<length*2;i++){
        const t=i/(length*2),side=(rand()-.5)*3.8,x=trail.x*t+nx*side,z=trail.z*t+nz*side,px=point(x),py=point(z);
        rect(c,realm===2||realm===4?(i%4?'#625d70':'#b8acb8'):(i%4?'#9c997b':'#ddd5b4'),px,py,1+rand()*2,1);
        if(i%5===0){rect(c,moss,point(x+nx*2),point(z+nz*2),2,2);}
      }
    }
    if(realm===1)for(let x=16;x<40;x+=.65){c.save();c.translate(point(x),point(-x));c.rotate(-Math.PI/4);rect(c,'#665e49',-7,-2,14,3);rect(c,'#baa77a',-6,-2,12,1);c.restore();}
    // Only draw dry lengths of the footpaths; the Great Sea extension uses the
    // same shore sampler as feet and minimap, rather than sand painted on water.
    c.beginPath();
    for(const path of BonkTerrain.OUTER_TRAILS){
      let pen=false;
      for(let i=1;i<path.length;i++){
        const [ax,az]=path[i-1],[bx,bz]=path[i],steps=Math.ceil(Math.hypot(bx-ax,bz-az));
        for(let k=0;k<=steps;k++){
          const t=k/steps,x=ax+(bx-ax)*t,z=az+(bz-az)*t;
          if(BonkTerrain.sampleWater(realm,stage,x,z)){pen=false;continue;}
          if(pen)c.lineTo(point(x),point(z));else c.moveTo(point(x),point(z));
          pen=true;
        }
      }
    }
    c.strokeStyle=moss;c.lineWidth=24;c.stroke();
    c.strokeStyle=earth;c.lineWidth=16;c.stroke();
    if(realm!==BonkTerrain.ZORA_REALM){oval(c,'#858d78',half,point(-7),17,17);oval(c,'#c3c5a4',half,point(-7),14,14);oval(c,'#a7b397',half,point(-7),10,10);}
    for(const obstacle of layout.obstacles){if(obstacle.kind!=='tree')continue;const x=point(obstacle.x),y=point(obstacle.z);c.globalAlpha=.35;oval(c,'#3e5a42',x+2,y+2,9,4);c.globalAlpha=1;for(let i=0;i<6;i++)rect(c,i%2?earth:moss,x+(rand()-.5)*16,y+(rand()-.5)*10,2,1);}
    if(realm===2||realm===4){
      for(let i=0;i<35;i++){const x=(rand()-.5)*104,z=(rand()-.5)*104;if(Math.hypot(x,z)<7)continue;const color=realm===4?'#b35e83':'#b1baae';c.globalAlpha=.6;line(c,color,point(x),point(z),point(x)+8,point(z)+5,1);line(c,color,point(x)+8,point(z)+5,point(x)+5,point(z)+10,1);}c.globalAlpha=1;
    }
    const texture=textureFor(tile);texture.generateMipmaps=true;texture.minFilter=THREE.NearestMipmapNearestFilter;textures.set(key,texture);return texture;
  }
  function surfaceTexture(kind,realm=0){
    const key='surface:'+kind+':'+realm;if(textures.has(key))return textures.get(key);
    const tile=surface(64,64),c=tile.getContext('2d'),rand=artRandom(119+realm*43);
    if(kind==='spring-stone'){
      rect(c,'#485e65',0,0,64,64);
      for(let y=0;y<64;y+=8)for(let x=-12;x<64;x+=16){
        const a=x+(y/8%2)*8,face=['#67838a','#719095','#5a777e','#849b99'][Math.floor(rand()*4)];
        rect(c,face,a+1,y+1,15,6);
        rect(c,'#9eb1a6',a+2,y+1,12,1);
        rect(c,'#536f74',a+3,y+5,12,2);
        if(rand()>.45)rect(c,'#9cab8c',a+3,y+3,2+Math.floor(rand()*7),1);
      }
    }else if(kind==='spring-water'||kind==='spring-falls'){
      const vertical=kind==='spring-falls';
      rect(c,vertical?'#69aebc':'#48959f',0,0,64,64);
      for(let i=0;i<94;i++){
        const x=Math.floor(rand()*64),y=Math.floor(rand()*64),long=2+Math.floor(rand()*(vertical?28:15));
        const color=(vertical?['#8ecdd7','#ace0e1','#d2eeeb','#7ebbcf']:['#56a4aa','#76b4b1','#97c8c4','#458c96'])[i%4];
        for(const shift of [-64,0,64])rect(c,color,x+(vertical?0:shift),y+(vertical?shift:0),vertical?1+(i%4===0):long,vertical?long:1+(i%5===0));
      }
    }else if(kind==='jabu-skin'||kind==='jabu-back'||kind==='jabu-fin'){
      const shades=kind==='jabu-back' ? ['#364239','#404c3d','#53604c','#283832','#5b624c'] :
        kind==='jabu-fin' ? ['#8c9b80','#a9ad8f','#6e846e','#bcba97','#9b9f7e'] :
        ['#8b9a82','#96a287','#82937d','#a4ab90','#758872'];
      rect(c,shades[0],0,0,64,64);
      for(let i=0;i<286;i++){
        const x=Math.floor(rand()*64),y=Math.floor(rand()*64),color=shades[(i%4)+1];
        const len=kind==='jabu-back'?5+i%11:2+i%4;
        for(const sx of [-64,0])for(const sy of [-64,0]){
          rect(c,color,x+sx,y+sy,len,1+i%3);
          if(i%3===0)rect(c,color,x+sx+2,y+sy+2,len-2,2);
        }
      }
    }else if(kind==='jabu-gold'){
      rect(c,'#957138',0,0,64,64);
      for(let x=-64;x<65;x+=16)for(let y=0;y<64;y++){
        const off=x+Math.floor(Math.min(y,64-y)*.80);
        rect(c,'#6a4d2b',off,y,3,1);rect(c,'#c5a14f',off+3,y,4,1);
        rect(c,'#e2be6a',off+7,y,2,1);rect(c,'#a68147',off+9,y,4,1);
      }
      for(const y of [2,8,54,60]){
        rect(c,'#604730',0,y,64,2);rect(c,'#efd58b',0,y+2,64,2);
        for(let x=1;x<64;x+=4)rect(c,'#fff0a8',x,y+2,1,1);
      }
    }else if(kind==='jabu-ribbon'){
      rect(c,'#522b47',0,0,64,64);
      rect(c,'#c98265',0,7,64,50);rect(c,'#85895a',0,11,64,42);
      for(let x=0;x<64;x+=16)for(let y=12;y<52;y++){
        const w=Math.max(1,Math.floor((y-12)*.38));
        rect(c,'#cf9a50',x+8-Math.floor(w/2),y,w,1);
        if(y>=29)rect(c,'#f8cf7c',x+7-Math.floor(w/3),y,Math.ceil(w*.45),1);
      }
      for(let x=0;x<64;x+=4){rect(c,'#8d4d62',x,2,2,4);rect(c,'#8d4d62',x,58,2,4);}
    }else if(kind==='wood'){
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
    const tile=surface(64,64),c=tile.getContext('2d');const palettes=[['#56984d','#64a653','#478c47','#8ab75d'],['#d8c18a','#e6d097','#c7ad77','#eee0b2'],['#66628b','#77729e','#504f75','#9290b0'],['#83ab61','#94bd72','#739c54','#b1cc87'],['#62616a','#777078','#4e505a','#9c7971'],['#769593','#88a4a1','#637f83','#b0bfb0']];const p=realm===7?['#72938a','#88a795','#607e77','#9fb19a']:palettes[realm%6];rect(c,stone?'#8e8b78':p[0],0,0,64,64);
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
  window.RelicArt=Object.freeze({canvas,material,sprite,terrain,groundOverlay,surfaceTexture,animationFrame,ANIMATIONS,RUTO_SWIM_WATER_ROW});
})();
