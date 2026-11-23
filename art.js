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
  function animationFrame(action,age){const[frames,rate]=ANIMATIONS[action]||ANIMATIONS.idle;return action==='death'?Math.min(frames-1,Math.floor(Math.max(0,age)*rate)):Math.floor(Math.max(0,age)*rate)%frames;}
  function line(c,color,x0,y0,x1,y1,width=1){const steps=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=steps;i++)rect(c,color,Math.round(x0+(x1-x0)*i/Math.max(1,steps)),Math.round(y0+(y1-y0)*i/Math.max(1,steps)),width,width);}
  function poseContext(c,w,h,action,frame){
    if(action==='death'){const amount=frame/7;c.translate(w*.08,h*.34*amount);c.scale(.9,1-amount*.45);}
    else if(action==='hurt')c.translate(frame?1:-1,0);
    else if(action==='idle')c.translate(0,frame===1||frame===2?-1:0);
    else if(action==='walk')c.translate(0,frame%4===1?-1:0);
  }
  // Eight hand-pixelled views. Costumes follow the hero's named game, not one shared uniform.
  function hero(id,direction,frame,action='idle'){
    const canvas=surface(112,112),c=canvas.getContext('2d');
    const dir=((direction%8)+8)%8,mirror=dir>4,view=mirror?8-dir:dir;
    const back=view>=3,profile=view===2,quarter=view===1||view===3;
    const cycle=frame*Math.PI/4,walk=action==='walk'||action==='dash';
    const phase=frame/Math.max(1,(ANIMATIONS[action]||[4])[0]-1),swing=Math.sin(phase*Math.PI);
    const cast=action==='cast'||action==='ultimate',attack=action==='attack',air=action==='jump'||action==='glide';
    const step=walk?Math.round(Math.sin(cycle)*5):air?3:0;
    const lift=cast?Math.round(swing*18):attack?Math.round(swing*12):action==='victory'?18:air?11:0;
    const sway=walk?Math.round(Math.cos(cycle)*2):Math.round(Math.sin(frame*Math.PI/2));
    c.translate(16,0);
    if(mirror){c.translate(80,0);c.scale(-1,1);}
    if(id==='midna'||id==='skullkid'){c.translate(40,0);c.scale(profile?.78:quarter?.94:1,1);c.translate(-40,0);}
    c.translate(0,4);poseContext(c,80,112,action,frame);
    if(action==='dash')c.translate(3,-2);
    const P=(color,points)=>polygon(c,color,points),R=(color,x,y,w,h)=>rect(c,color,x,y,w,h);
    const L=(color,x,y,xx,yy,width=1)=>line(c,color,x,y,xx,yy,width);
    const O=(color,x,y,rx,ry)=>oval(c,color,x,y,rx,ry);
    const skin=id==='tetra'?'#d89b62':id==='sheik'?'#e2c09a':'#ecc495';
    function limb(color,light,x,y,kx,ky,ex,ey,width=5){L(color,x,y,kx,ky,width);L(color,kx,ky,ex,ey,width);L(light,x,y,kx,ky,Math.max(1,width-3));L(light,kx,ky,ex,ey,Math.max(1,width-3));}
    function triforce(x,y,size,color){P(color,[[x,y],[x-size,y+size*2],[x+size,y+size*2]]);P('#546875',[[x,y+size],[x-size/2,y+size*2],[x+size/2,y+size*2]]);}
    function eye(x,y,color='#497b9a',large=false){R('#fff3db',x,y,large?6:5,large?5:4);R(color,x+2,y,2,large?5:4);R('#263746',x+3,y+1,1,3);R('#fff9dd',x+2,y,1,1);L('#684832',x-1,y-2,x+5,y-1);}
    function shield(x,y){
      P('#617584',[[x-10,y-14],[x,y-18],[x+11,y-14],[x+9,y+6],[x,y+14],[x-9,y+5]]);
      P('#c6d0ce',[[x-8,y-13],[x,y-16],[x+9,y-13],[x+7,y+5],[x,y+11],[x-7,y+4]]);
      P('#304b88',[[x-6,y-11],[x,y-13],[x+7,y-11],[x+5,y+3],[x,y+8],[x-5,y+2]]);
      triforce(x,y-10,2,'#e9c45d');
      L('#c35753',x-5,y-1,x,y+3,2);L('#c35753',x,y+3,x+5,y-1,2);R('#d8715e',x-1,y-1,3,6);
      for(const dx of[-8,8])R('#eef0d6',x+dx,y-10,1,2);
    }
    function sword(x,y,amount){
      const dx=Math.round(Math.sin(amount)*31),dy=-Math.round(Math.cos(amount)*31);
      L('#718da6',x,y,x+dx,y+dy,4);L('#dcece4',x,y,x+dx,y+dy,2);
      P('#f4f5d9',[[x+dx-2,y+dy+2],[x+dx,y+dy-5],[x+dx+2,y+dy+2]]);
      const gx=Math.round(Math.cos(amount)*8),gy=Math.round(Math.sin(amount)*8);
      L('#66528c',x-gx,y-gy,x+gx,y+gy,3);L('#b1a1cf',x-gx,y-gy,x+gx,y+gy,1);
      L('#615388',x,y+2,x-Math.round(dx*.2),y-Math.round(dy*.2),3);R('#dfbd67',x-1,y+2,3,2);
    }
    if(id==='midna'){
      // Twilight Princess imp: tiny curved body, huge asymmetrical Fused Shadow, exposed right eye.
      const hairSwing=walk?sway*2:cast?Math.round(swing*7):sway;
      P('#a9522e',[[43,27],[57,31],[61+hairSwing,52],[57+hairSwing,78],[48,83],[51,61],[44,43]]);
      P('#e48236',[[48,28],[54,34],[56+hairSwing,55],[51+hairSwing,72],[51,50],[46,38]]);
      L('#ffbb59',51,35,54+hairSwing,55,2);
      if(cast||attack){
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
      limb('#26383e','#639b99',34,72,30,83-step,28,93-step,5);limb('#26383e','#86c7bd',45,73,48,83+step,49,93+step,5);
      P('#81cfc4',[[25,92-step],[32,92-step],[34,96-step],[23,96-step]]);P('#93dcd0',[[46,92+step],[51,92+step],[55,96+step],[45,96+step]]);
      P('#23353d',[[31,54],[46,54],[48,65],[44,76],[35,77],[30,70]]);P('#67beb9',[[31,56],[35,58],[35,67],[41,69],[39,74],[33,72],[30,64]]);
      L('#a8ebe0',33,59,34,65,2);L('#87d9cd',39,73,44,69,2);R('#8cd5ca',42,57,3,5);
      limb('#2d4147','#86cfc7',31,55,24,62-lift,23,68-lift,4);limb('#2d4147','#a2ded1',47,55,51,61-lift,53,66-lift,4);
      O('#5e9599',40,44,15,14);P('#9fdfd1',[[36,39],[50,37],[51,48],[44,54],[37,49]]);
      if(!back){O('#edb45c',45,44,5,5);O('#d74f32',47,44,2,4);R('#fff1be',44,41,2,2);L('#324c53',43,40,50,40,2);L('#f1e4bd',40,51,46,50);}
      P('#454f4b',[[19,14],[30,8],[48,10],[55,23],[52,35],[39,39],[33,49],[19,44],[17,30]]);
      P('#90927b',[[21,15],[30,11],[46,12],[51,23],[47,31],[34,34],[29,44],[21,40]]);
      P('#b2ad8b',[[21,15],[29,12],[44,13],[45,18],[29,17],[25,25],[24,38],[20,39]]);
      P('#606f64',[[30,20],[44,20],[47,25],[42,30],[34,29],[34,25],[39,25],[39,23],[30,23],[29,34],[25,36],[26,25]]);
      P('#68766b',[[44,13],[47,5],[55,5],[60,12],[60,22],[55,26],[50,23],[55,20],[55,12],[51,10],[49,17]]);
      L('#c5bf95',48,8,54,7,2);L('#c5bf95',58,12,58,19,2);R('#b6b191',18,31,9,4);R('#5b756d',20,35,5,4);
      if(back){P('#687a70',[[27,17],[40,15],[48,23],[43,34],[29,38],[26,30]]);L('#a6ae8b',31,20,40,20,2);L('#384e4a',32,25,41,25,3);R('#99a888',30,31,9,2);}
    }else if(id==='skullkid'){
      // Majora's Mask sits over the face; the back shows straps and straw hair instead of painted eyes.
      limb('#6a4936','#ac7b49',31,72,29,84-step,26,93-step,5);limb('#6a4936','#b48049',46,72,49,84+step,53,93+step,5);
      P('#b77c3f',[[20,91-step],[30,91-step],[32,96-step],[17,97-step],[16,94-step]]);P('#b77c3f',[[48,91+step],[55,91+step],[62,94+step],[61,97+step],[48,96+step]]);
      P('#9b4d35',[[27,51],[49,51],[53,75],[45,71],[41,77],[36,72],[29,77],[25,70]]);P('#c87840',[[30,54],[38,56],[38,69],[31,71]]);
      P('#71824c',[[25,50],[32,45],[40,49],[48,45],[54,51],[47,56],[41,53],[34,57]]);
      for(const [x,y]of[[28,58],[43,65],[33,72]])L('#e0a154',x,y,x+4,y-1,2);
      limb('#785334','#bc8b4a',26,55,19,64-lift,16,72-lift,4);limb('#785334','#bc8b4a',50,55,57,64-lift,61,71-lift,4);
      for(const side of[-1,1]){const x=side<0?15:62;P('#d09a4e',[[x-3,68-lift],[x+3,68-lift],[x+5,75-lift],[x+1,78-lift],[x-4,75-lift]]);}
      O('#5b4231',40,33,16,18);P('#887046',[[25,36],[28,21],[48,21],[55,34],[50,47],[30,46]]);
      P('#a88443',[[16,24],[22,15],[31,12],[34,5],[49,7],[53,20],[63,27],[49,31],[27,30]]);P('#ceb365',[[24,22],[30,15],[35,8],[46,9],[48,18],[52,23]]);L('#e7cb76',31,16,44,13,2);P('#755530',[[16,24],[35,25],[60,25],[63,28],[44,32],[23,29]]);
      if(back){P('#654b32',[[27,31],[50,31],[48,47],[33,49]]);for(let x=29;x<50;x+=4)L('#c2a85e',x,31,x+1,44,2);L('#49333b',27,35,50,39,3);}
      else{
        const mx=profile?46:quarter?42:39,mw=profile?11:18;
        for(const s of[-1,1])for(let i=0;i<4;i++){const x=mx+s*(mw-3),y=33+i*6;P(i%2?'#d4b86a':'#be9852',[[x,y],[x+s*(i===1?12:9),y-5],[x+s*5,y+5]]);}
        P('#51345e',[[mx-mw,33],[mx-10,28],[mx,34],[mx+10,28],[mx+mw,33],[mx+mw-3,50],[mx,63],[mx-mw+3,50]]);
        P('#9f456a',[[mx-mw+3,35],[mx-3,38],[mx-2,57],[mx-11,49]]);P('#b9783d',[[mx+3,38],[mx+mw-2,35],[mx+10,51],[mx+1,58]]);
        for(const x of profile?[mx+3]:[mx-9,mx+9]){O('#e5c751',x,42,6,8);O('#eb863d',x,43,4,6);O('#ac473a',x,43,2,4);R('#292b3f',x,39,1,8);R('#fff1a3',x-2,38,2,2);L('#662f65',x-5,33,x+3,35,2);}
        L('#bd9868',mx-2,49,mx,54);L('#e0bc73',mx+2,51,mx+1,55);R('#d0b582',mx-1,58,3,2);
      }
    }else{
      const link=id==='link',zelda=id==='zelda',tetra=id==='tetra',sheik=id==='sheik';
      const cx=profile?41:quarter?40:39,bw=profile?15:quarter?22:26;
      const left=cx-bw/2,right=cx+bw/2,headY=tetra?29:26;
      if(zelda){
        // Breath of the Wild ceremonial dress: white gown, bare arms, gold girdle and braided blonde hair.
        P('#b68b43',[[27,23],[31,14],[46,13],[53,22],[52,64],[44+sway,73],[29,65],[24,48]]);
        P('#e0bd61',[[30,24],[48,22],[48,58],[44+sway,66],[29,59]]);L('#f2d88a',29,30,29,54,2);
        const hem=walk?sway:0;
        P('#bbbfbb',[[left+2,54],[right-2,54],[right+9+hem,94],[right+4+hem,98],[cx-2+hem,97],[left-9+hem,98],[left-7+hem,87]]);
        P('#f5f0da',[[left+4,55],[right-3,55],[right+5+hem,93],[cx+1+hem,96],[left-5+hem,94]]);
        P('#d8dccc',[[cx-1,61],[cx+4,61],[cx+8,94],[cx+3,95]]);L('#fff9e7',left+4,65,left,90,2);
        L('#d4ad63',left-6,94,right+6,94,2);L('#eee0ad',left-4,92,right+4,92);
        R(skin,cx-8,97,5,3);R(skin,cx+5,97,5,3);
        P('#f3f0db',[[left,42],[right,42],[right-3,60],[left+3,60]]);P('#c4cdbd',[[left,42],[cx,47],[right,42],[right-2,49],[left+2,49]]);
        P('#d8b362',[[left+1,57],[right-1,57],[right-2,62],[cx,65],[left+2,62]]);L('#ffdf85',left+3,58,right-3,58);R('#7bada0',cx-2,60,5,3);
        limb('#c3966e',skin,left-2,43,left-6,57+step/2-lift,left-5,69+step/2-lift,4);limb('#c3966e','#f6d2a1',right,43,right+5,56-step/2-lift,right+4,68-step/2-lift,4);
        for(const x of[left-5,right+4]){R('#dbb45e',x,59-lift,4,3);R('#f3d47d',x,59-lift,4,1);}
      }else{
        const pants=link?'#e1debf':tetra?'#f0e7c6':'#374e78',pantsLight=link?'#f6f0d4':tetra?'#fff4db':'#7185a7';
        limb(pants,pantsLight,cx-7,70,cx-9,81-step,cx-10,90-step,6);limb(pants,pantsLight,cx+6,70,cx+9,81+step,cx+10,90+step,6);
        if(tetra){for(const s of[-1,1]){const x=cx+s*10;R(skin,x-1,85+s*step,5,10);R('#5e4936',x-2,95+s*step,8,3);R('#a98b4d',x-2,91+s*step,7,2);}}
        else if(sheik){for(const s of[-1,1]){const x=cx+s*10;R('#d4d6c4',x-1,83+s*step,6,12);for(let j=0;j<3;j++)L('#8d9c9c',x-1,86+j*3+s*step,x+4,88+j*3+s*step);P('#5d717d',[[x-2,94+s*step],[x+5,94+s*step],[x+7,98+s*step],[x-3,98+s*step]]);}}
        else for(const s of[-1,1]){const x=cx+s*10;P('#684d36',[[x-2,84+s*step],[x+5,84+s*step],[x+5,94+s*step],[x+8,97+s*step],[x-4,98+s*step],[x-4,94+s*step]]);L('#b58c54',x-1,86+s*step,x-1,93+s*step,2);R('#382f2c',x-4,98+s*step,13,1);}
        const cloth=link?'#286e46':tetra?'#b54d68':'#314e7b',light=link?'#58a259':tetra?'#df7c89':'#667da7';
        P(cloth,[[left+3,42],[right-3,42],[right,54],[right-2,68],[right+2,73],[left-2,73],[left+1,63],[left-1,51]]);
        P(light,[[left+4,44],[cx,46],[cx+1,64],[left+3,67]]);L(link?'#91bc74':tetra?'#eea0a1':'#8d9fc0',left+4,46,left+3,58,2);
        const arm=sheik?'#415b84':skin,armLight=sheik?'#9aaaba':'#f3c99a';
        limb(arm,armLight,left-1,46,left-6,58+step/2-lift,left-4,67+step/2-lift,4);
        limb(arm,armLight,right-1,46,right+4,58-step/2-lift,right+5,66-step/2-lift,4);
        if(link){
          for(const x of[left-3,right-1]){R('#e6e3c9',x,49,6,7);P('#3e8850',[[x-1,44],[x+4,43],[x+7,49],[x+5,52],[x-1,50]]);}
          P('#ebdfb8',[[left+6,42],[cx,47],[right-6,42],[cx+2,53],[cx-3,53]]);
          L('#65523a',right-4,42,cx-5,65,3);L('#c9a06a',right-4,42,cx-5,65);
          R('#675039',left,64,bw,5);R('#dfbe68',cx-1,63,6,6);R('#7d643c',cx+1,65,2,2);
          L('#a9b8a6',left+1,72,right-1,72,2);for(let x=left+1;x<right;x+=3)R('#536e65',x,71,1,1);
          for(const x of[left-4,right+5]){R('#755237',x-1,60-lift,5,6);R('#b18650',x-1,60-lift,5,1);}
        }else if(tetra){
          P('#31566e',[[left,42],[left+5,43],[cx-3,52],[left+4,62],[left-1,60]]);P('#3c677f',[[right-5,43],[right,42],[right+1,59],[right-5,62],[cx+4,52]]);
          P('#eee7cb',[[left+5,41],[cx,46],[right-4,41],[right-5,47],[cx,50],[left+5,46]]);
          R('#584976',left-1,63,bw+2,6);R('#a98b9e',left+1,64,bw-2,2);P('#6a5181',[[right-1,65],[right+7,75+sway],[right+2,80],[right-4,68]]);R('#e3bd5b',cx-3,63,6,6);
          R('#f1e8cd',left,71,bw,6);L('#b9bca7',cx,71,cx,77);
        }else{
          P('#e5e3cc',[[left+5,42],[right-3,44],[right+1,60],[cx+2,68],[left+2,61]]);P('#afb8b0',[[left+5,44],[left+8,47],[left+5,58],[cx+2,64],[cx-2,65],[left+1,59]]);
          // Sheikah eye: three lashes, almond eye and falling tear.
          for(const x of[cx-4,cx,cx+4])L('#aa4252',x,49,x,51);
          P('#b04a57',[[cx-6,55],[cx,51],[cx+6,55],[cx,58]]);O('#e9dfc4',cx,55,3,2);R('#ae4655',cx-1,54,2,3);P('#b04a57',[[cx-2,59],[cx+2,59],[cx,65]]);
          for(const x of[left-4,right+5])for(let j=0;j<3;j++){R('#d6d8c9',x-1,58+j*3-lift,5,2);L('#8a999b',x,60+j*3-lift,x+3,61+j*3-lift);}
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
        if(!back)shield(left-5,61-lift/3);
        if(!back||attack||action==='ultimate')sword(right+(back?10:6),61-lift,attack?(back?.25: -.95)+phase*(back?1.25:2.5):action==='victory'?-.2:.15);
      }
      if(zelda&&(cast||attack)){
        const reach=profile||quarter?1:.52,x=right+5,y=59-lift-(back?5:0),draw=phase<.55?Math.round(swing*8):0;
        limb('#ab805c',skin,right,45,x+2,y+3,x+6,y,4);
        L('#b98443',x,y-15,x+9*reach,y-7,3);L('#f3cf79',x+9*reach,y-7,x+9*reach,y+7,3);
        L('#d8aa60',x+9*reach,y+7,x,y+16,3);
        L('#fff0b9',x,y-14,x-draw*reach,y);L('#fff0b9',x-draw*reach,y,x,y+14);
        if(phase<.58||action==='ultimate'){L('#fff5ce',x-(2+draw)*reach,y,x+17*reach,y,2);P('#f8d890',[[x+14*reach,y-3],[x+21*reach,y],[x+14*reach,y+3]]);}

      }
      if(tetra&&(cast||attack)){const x=right+6,y=63-lift;O('#283c50',x,y,6,7);O('#536d83',x-2,y-2,3,4);R('#ba975c',x-1,y-8,3,3);L('#d3b171',x,y-8,x+3,y-12);R(frame%2?'#ffdb79':'#fff0bc',x+2,y-15,3,3);}
      if(sheik&&attack){const x=right+6,y=63-lift;P('#b69b68',[[x-7,y-6],[x+1,y-9],[x+9,y+4],[x+5,y+8],[x-1,y-2],[x-8,y-1]]);L('#efe5bc',x-5,y-5,x,y-6);}
    }
    if(cast||action==='victory'){
      const color=id==='midna'?'#91e5d0':id==='skullkid'?'#d49de4':'#f5d78b';
      for(const[x,y]of[[9,19],[67,14],[8,67]]){const yy=y-frame%3;R(color,x,yy,5,1);R(color,x+2,yy-2,1,5);}
    }
    return outline(canvas);
  }

  function boss(id,frame,action='idle'){
    const canvas=surface(128,144),c=canvas.getContext('2d'),wave=Math.sin(frame*Math.PI/4),windup=action==='windup',strike=action==='attack',lift=windup?8:0;
    poseContext(c,128,144,action,frame);
    if(id==='kingbulblin'){
      rect(c,'#494936',43,103-Math.round(wave*2),16,27);rect(c,'#494936',72,103+Math.round(wave*2),16,27);oval(c,'#6f8c50',64,82,31,33);oval(c,'#8da65e',64,49+Math.round(wave*2),25,24);polygon(c,'#e4cf94',[[42,39],[30,15],[48,29]]);polygon(c,'#e4cf94',[[80,39],[96,15],[77,29]]);oval(c,'#c1b376',64,59+Math.round(wave*2),19,12);rect(c,'#323d3c',50,43+Math.round(wave*2),7,4);rect(c,'#323d3c',73,43+Math.round(wave*2),7,4);for(const x of[50,75])polygon(c,'#f3e5b5',[[x,60+Math.round(wave*2)],[x+5,60+Math.round(wave*2)],[x+3,47+Math.round(wave*2)]]);rect(c,'#704e41',39,94,50,10);rect(c,'#d3bc75',58,92,13,14);line(c,'#7a6349',100,98,windup?89:114,windup?23:53,9);oval(c,'#777477',windup?89:114,windup?22:49,12,20);
    }else if(id==='morpha'){
      for(let i=0;i<15;i++){const y=117-i*5,x=64+Math.sin(i*.35+frame*.45)* (windup?28:20);oval(c,i%2?'#73b9d1':'#9bd9df',x,y,14-i*.35,8);oval(c,'#b5e9e7',x-3,y-2,5,4);}oval(c,'#be5b83',64+Math.sin(frame*.4)*10,65,13,13);oval(c,'#eda8af',60+Math.sin(frame*.4)*10,61,7,7);rect(c,'#fee9b3',58+Math.sin(frame*.4)*10,57,4,4);
    }else if(id==='gohma'){

      for(const side of [-1,1])for(let i=0;i<3;i++){const y=69+i*17,step=Math.round(Math.sin(frame*Math.PI/4+i)*5);line(c,'#5a5340',64+side*24,y,64+side*47,y-14+step,8);line(c,'#9a8d57',64+side*47,y-14+step,64+side*55,y+20,6);line(c,'#d0bd78',64+side*56,y+14,64+side*59,y+23,3);}
      oval(c,'#655f3f',64,77,32,35);oval(c,'#a09a5b',61,69,28,29);oval(c,'#b8b76f',56,61,19,17);for(const x of [43,57,72,83])rect(c,'#717448',x,52+(x%5),5,11);
      oval(c,'#423c3b',64,83,24,24);oval(c,windup?'#f4dc8b':'#c9944b',64,83,19,20);oval(c,'#d56842',64,83,10,16);rect(c,'#2e3942',62,70,5,26);rect(c,'#fff0b7',57,73,4,8);
      polygon(c,'#d9c88b',[[44,106],[34,126],[55,114]]);polygon(c,'#d9c88b',[[84,106],[94,126],[73,114]]);
    }else if(id==='helmaroc'||id==='colgera'){
      const ice=id==='colgera',dark=ice?'#487f9f':'#355a9a',mid=ice?'#82bdce':'#6673bb',light=ice?'#cbe8e1':'#a9b9db',flap=Math.round(wave*11)-lift;
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
      const handY=72-lift-(strike?5:0);line(c,dark,43,67,28-(strike?8:0),handY+20,10);line(c,light,82,67,99+(strike?8:0),handY+18,10);
      oval(c,phantom?'#869a85':ghirahim?'#d4c3ae':'#8b8f6b',64,42,20,23);
      if(zant){polygon(c,'#708b83',[[44,25],[56,11],[71,13],[85,32],[80,66],[62,80],[44,57]]);polygon(c,'#a7ac8b',[[58,12],[62,3],[74,14],[82,35],[63,27]]);rect(c,'#293f42',48,38,29,8);rect(c,'#dda85b',52,44,23,3);line(c,'#a0b5a2',52,54,70,68,3);}
      else if(ghirahim){polygon(c,'#f0ebdd',[[44,35],[49,14],[72,12],[86,31],[66,24],[53,41]]);rect(c,'#e6dbc5',50,34,28,20);rect(c,'#603d57',55,40,4,5);rect(c,'#603d57',71,40,4,5);line(c,'#af5263',63,53,75,51,2);for(const[x,y]of[[34,60-lift],[94,50-lift],[104,83]])polygon(c,'#b45477',[[x,y-8],[x+5,y],[x,y+8],[x-5,y]]);}
      else if(phantom){polygon(c,'#c2c7a0',[[44,30],[30,9],[53,19]]);polygon(c,'#c2c7a0',[[76,19],[97,9],[84,35]]);rect(c,'#253941',46,39,36,10);rect(c,'#d3ef9d',50,42,8,3);rect(c,'#d3ef9d',70,42,8,3);}
      else{polygon(c,'#913d3b',[[43,38],[43,15],[62,7],[83,18],[86,40],[75,29],[53,26]]);rect(c,'#b66a45',50,12,6,9);rect(c,'#4b5543',49,36,31,19);rect(c,'#e6bf66',54,40,5,3);rect(c,'#e6bf66',71,40,5,3);polygon(c,'#733f3a',[[52,51],[77,51],[72,65],[57,64]]);rect(c,'#ddb56a',62,28,5,8);}
      if(!zant){line(c,'#bacbba',102+(strike?8:0),handY-13,102+(strike?8:0),handY+27,4);rect(c,'#d0b26c',94+(strike?8:0),handY+20,19,4);}else for(let j=0;j<4;j++)rect(c,'#d5a861',55+j%2*10,83+j*6,4,4);
    }
    if(windup){for(let i=0;i<5;i++){const a=i*Math.PI*2/5+frame*.2;rect(c,'#f1d395',62+Math.round(Math.cos(a)*44),69+Math.round(Math.sin(a)*40),3,3);}}
    return outline(canvas);
  }
  function archetypeEnemy(type,frame,action='idle'){
    if(type==='boss')return boss('phantom',frame,action);
    const canvas=surface(64,72),c=canvas.getContext('2d'),wave=Math.sin(frame*Math.PI/4),bob=Math.round(wave*2),windup=action==='windup';poseContext(c,64,72,action,frame);
    if(type==='slime'){
      oval(c,'#226c64',32,48,18+Math.max(0,bob),14-bob);oval(c,'#4baf91',31,44-bob,17,15+bob);oval(c,'#7bd4a8',27,40-bob,10,9);for(const x of[24,38]){oval(c,'#e5ead1',x,42-bob,4,6);rect(c,'#29394c',x,41-bob,2,5);}rect(c,'#205b59',28,53-bob,9,2);
    }else if(type==='mushroom'){
      rect(c,'#487c47',29,39,6,20);polygon(c,'#74ac50',[[30,53],[11,45],[18,60],[31,61]]);polygon(c,'#92bd59',[[34,52],[53,46],[47,59],[32,61]]);oval(c,'#405d95',32,31+bob,16,16);oval(c,'#7398c0',28,27+bob,11,10);rect(c,'#2c3047',18,31+bob,29,windup?11:7);for(let x=20;x<46;x+=6)polygon(c,'#f6e9c5',[[x,31+bob],[x+4,31+bob],[x+2,36+bob]]);for(const[x,y]of[[22,22],[36,19],[41,26]])rect(c,'#e9dcb2',x,y+bob,4,4);
    }else if(type==='bat'){
      polygon(c,'#655278',[[27,31],[8,17+bob*5],[3,39],[17,34],[23,44]]);polygon(c,'#8e76a6',[[37,31],[56,17+bob*5],[61,39],[47,34],[41,44]]);oval(c,'#49435c',32,37,9,12);polygon(c,'#4d465e',[[24,30],[23,16],[31,27]]);polygon(c,'#4d465e',[[34,27],[42,16],[40,32]]);rect(c,'#f1cf69',26,32,4,4);rect(c,'#f1cf69',35,32,4,4);rect(c,'#e4cfa4',29,43,2,4);rect(c,'#e4cfa4',34,43,2,4);
    }else{
      rect(c,'#654746',21,50-bob,8,15);rect(c,'#654746',37,50+bob,8,14);oval(c,'#a64b43',33,43,16,15);oval(c,'#ce6955',32,28,16,15);polygon(c,'#d69c66',[[18,24],[7,19],[15,32]]);polygon(c,'#d69c66',[[46,24],[58,19],[50,32]]);oval(c,'#d59c77',32,35,11,7);rect(c,'#403d41',23,27,5,3);rect(c,'#403d41',37,27,5,3);rect(c,'#e8dab1',23,34,4,6);rect(c,'#e8dab1',38,34,4,6);rect(c,'#6d443e',29,34,3,3);rect(c,'#6d443e',34,34,3,3);rect(c,'#c2a36c',20,47,25,4);rect(c,'#f1d392',30,46,5,6);c.save();c.translate(51,45);c.rotate(windup?-.8:action==='attack'?.8:wave*.07);rect(c,'#654b3d',-2,-17,5,35);oval(c,'#8e7453',0,-20,7,10);rect(c,'#b49b6b',-4,-25,3,6);c.restore();
    }
    return outline(canvas);
  }
  // Species identities are separate from the four shared combat archetypes.
  function enemy(id,frame,action='idle'){
    const base={chuchu:'slime',blue_chuchu:'slime',deku_baba:'mushroom',keese:'bat',bokoblin:'boar',gloom_bokoblin:'boar'};
    if(base[id]){
      const original=archetypeEnemy(base[id],frame,action);if(id!=='blue_chuchu'&&id!=='gloom_bokoblin')return original;
      const result=surface(64,72),ctx=result.getContext('2d');ctx.drawImage(original,0,0);const pixels=ctx.getImageData(0,0,64,72);
      for(let i=0;i<pixels.data.length;i+=4)if(pixels.data[i+3]&&pixels.data[i]+pixels.data[i+1]+pixels.data[i+2]>130){if(id==='blue_chuchu'){const green=pixels.data[i+1];pixels.data[i]=Math.round(pixels.data[i]*.75);pixels.data[i+1]=Math.round(green*.8);pixels.data[i+2]=Math.min(255,green+35);}else{pixels.data[i]=Math.min(255,pixels.data[i]*.6+45);pixels.data[i+1]*=.35;pixels.data[i+2]*=.65;}}
      ctx.putImageData(pixels,0,0);return result;
    }
    if(['slime','mushroom','bat','boar','boss'].includes(id))return archetypeEnemy(id,frame,action);
    const canvas=surface(64,72),c=canvas.getContext('2d'),wave=Math.sin(frame*Math.PI/4),bob=Math.round(wave*2),windup=action==='windup';poseContext(c,64,72,action,frame);
    if(id==='skulltula'){
      for(const s of[-1,1])for(let i=0;i<4;i++){const y=28+i*8;line(c,'#a0824f',32+s*9,y,32+s*(23+i%2*5),y-9+bob,3);line(c,'#b9a471',32+s*(23+i%2*5),y-9+bob,32+s*(25-i%2*3),y+10-bob,3);}
      oval(c,'#a99665',32,36,13,19);oval(c,'#e1d6a8',32,33,10,12);oval(c,'#3d3942',27,32,4,5);oval(c,'#3d3942',38,32,4,5);rect(c,'#51433e',30,38,5,6);for(let x=25;x<41;x+=5)rect(c,'#e6dcb8',x,45,3,5);
    }else if(id==='deku_scrub'){
      polygon(c,'#3c773e',[[11,56],[21,42],[28,49],[41,39],[54,57]]);oval(c,'#855b38',32,40+bob,14,17);oval(c,'#b0884d',28,36+bob,10,12);rect(c,'#eeb95c',24,33+bob,4,5);rect(c,'#eeb95c',37,33+bob,4,5);oval(c,'#563c30',33,46+bob,7,6);rect(c,'#b39258',30,42+bob,15,8);rect(c,'#302e35',40,44+bob,5,4);polygon(c,'#78a44e',[[32,27],[16,18],[17,30],[30,31],[45,12],[46,27]]);
    }else if(id==='octorok'){
      for(let i=0;i<4;i++)oval(c,'#a64848',14+i*12,58+Math.round(Math.sin(frame+i)*2),8,5);
      oval(c,'#c75f59',32,40+bob,20,18);oval(c,'#e98e73',26,34+bob,13,10);oval(c,'#eee7c7',24,40+bob,5,6);oval(c,'#eee7c7',40,40+bob,5,6);rect(c,'#2f3541',24,41+bob,2,4);rect(c,'#2f3541',38,41+bob,2,4);oval(c,'#a44445',32,51+bob,7,9);oval(c,'#442e3a',32,55+bob,5,5);
    }else if(id==='tektite'){
      for(const s of[-1,1])for(const d of[-1,1]){line(c,'#bb6c43',32+s*7,42,32+s*24,35+d*11+bob,3);line(c,'#e0a66b',32+s*24,35+d*11+bob,32+s*22,58+d*5,3);}oval(c,'#af5e42',32,39+bob,14,12);oval(c,'#eaa769',30,35+bob,10,7);oval(c,'#ead9a3',32,41+bob,7,7);rect(c,'#40333e',31,36+bob,3,10);
    }else if(id==='lizalfos'){
      polygon(c,'#41734f',[[24,56],[7,62],[12,50],[23,45]]);rect(c,'#4b8054',25,50-bob,7,14);rect(c,'#4b8054',39,50+bob,7,14);oval(c,'#558c57',33,41,12,16);oval(c,'#6ea960',34,25+bob,12,11);rect(c,'#8dbb6e',34,27+bob,21,9);rect(c,'#e4d490',40,28+bob,5,3);rect(c,'#313d39',38,22+bob,4,3);for(let y=18;y<51;y+=8)polygon(c,'#ba9362',[[23,y],[16,y+5],[25,y+8]]);line(c,'#a9c4ca',49,47,windup?44:58,windup?20:34,4);rect(c,'#8b6b47',45,46,9,3);
    }else if(id==='seahat'){
      oval(c,'#b89c63',32,43,13,16);rect(c,'#e7ce87',28,33,8,20);rect(c,'#41414c',25,42,5,4);rect(c,'#41414c',36,42,5,4);line(c,'#6a6349',32,18,32,30,3);c.save();c.translate(32,19);c.rotate(frame*Math.PI/4);for(let i=0;i<4;i++){c.rotate(Math.PI/2);polygon(c,'#e4d9ac',[[0,0],[4,-24],[11,-12],[5,0]]);}c.restore();
    }else if(id.startsWith('shadow_')){
      if(id==='shadow_kargarok'){for(const s of[-1,1])polygon(c,'#343444',[[32,35],[32+s*28,18+bob*5],[32+s*22,43],[32+s*12,49]]);oval(c,'#272b39',32,39,8,15);polygon(c,'#bd765a',[[30,23],[43,31],[32,32]]);rect(c,'#e27c60',30,29,5,3);}
      else if(id==='shadow_vermin'){oval(c,'#2a2d3b',32,48,17,12);for(const s of[-1,1])for(let i=0;i<3;i++)line(c,'#515069',32+s*11,42+i*7,32+s*24,40+i*9+bob,3);rect(c,'#ef985b',24,43,4,5);rect(c,'#ef985b',37,43,4,5);}
      else{rect(c,'#272a37',22,48-bob,9,18);rect(c,'#272a37',36,48+bob,9,18);oval(c,'#343440',32,35,17,20);line(c,'#30313e',17,30,7,55-bob,8);line(c,'#30313e',46,30,56,55+bob,8);polygon(c,'#68616a',[[21,13],[43,13],[47,29],[32,38],[17,29]]);for(const x of[24,34])rect(c,'#ed986b',x,18,4,12);rect(c,'#93beb1',29,37,6,14);}
    }else if(id==='remlit'){
      oval(c,'#c4a16f',32,46,17,13);oval(c,'#e9c891',32,32+bob,15,13);polygon(c,'#ae8c68',[[19,28+bob],[13,9+bob],[29,22+bob]]);polygon(c,'#ae8c68',[[36,22+bob],[52,9+bob],[46,29+bob]]);for(const x of[23,37]){oval(c,'#ad7e91',x,30+bob,5,5);rect(c,'#3f3b4a',x,28+bob,2,6);}rect(c,'#67454a',30,38+bob,5,3);line(c,'#d5b680',47,48,57,34-bob*2,4);rect(c,'#bd956a',21,54-bob,6,10);rect(c,'#bd956a',38,54+bob,6,10);
    }else if(id==='little_frox'){
      oval(c,'#416375',32,46,22,16);oval(c,'#6a8c93',29,41,17,12);for(const[x,y]of[[17,36],[45,36],[22,29],[42,28]]){polygon(c,'#859792',[[x-4,y],[x,y-5],[x+4,y],[x+2,y+3]]);}oval(c,'#344d60',32,32+bob,9,10);oval(c,'#d6c47e',32,31+bob,6,7);oval(c,'#b06d41',32,31+bob,4,5);rect(c,'#39333c',31,26+bob,2,10);rect(c,'#f4df9b',29,27+bob,2,2);rect(c,'#243b4d',19,48,27,7);for(let x=22;x<44;x+=7)polygon(c,'#e4d3a0',[[x,48],[x+4,48],[x+2,54]]);oval(c,'#38536a',12,57+bob,9,5);oval(c,'#38536a',51,57-bob,9,5);
    }else if(id==='evermean'){
      rect(c,'#695447',24,25,17,30);rect(c,'#a0875c',27,27,5,22);line(c,'#645448',27,51,15,64-bob,6);line(c,'#645448',38,51,49,64+bob,6);line(c,'#6c5948',24,34,10,47-bob,5);line(c,'#6c5948',41,34,55,47+Math.round(wave*2),5);for(const[x,y]of[[18,21],[32,13],[47,22]]){oval(c,'#3f614a',x,y,15,13);oval(c,'#6e8954',x-3,y-3,11,9);}rect(c,'#d6ad70',27,36,4,4);rect(c,'#d6ad70',36,36,4,4);rect(c,'#3e3a39',29,44,8,5);
    }else if(id==='takkuri'){
      for(const s of[-1,1])polygon(c,'#765f4b',[[32,35],[32+s*28,16+bob*5],[32+s*24,43],[32+s*8,45]]);oval(c,'#4d4b47',32,42,10,16);oval(c,'#ac8b6c',34,27+bob,9,9);polygon(c,'#d4b475',[[39,25+bob],[54,32+bob],[39,35+bob]]);rect(c,'#eddbb1',35,24+bob,4,4);rect(c,'#38383e',37,24+bob,2,3);for(const x of[27,36])line(c,'#bd9264',x,55,x,64,3);
    }
    return outline(canvas);
  }

  function projectile(id,direction,frame){
    const canvas=surface(40,40),c=canvas.getContext('2d');c.translate(20,20);c.rotate(direction*Math.PI/4);
    if(id==='bomb'){c.rotate(-direction*Math.PI/4);oval(c,'#25394c',0,3,9,10);oval(c,'#4f7185',-3,0,5,6);rect(c,'#d2ad6b',-2,-9,4,4);line(c,'#a07b4e',0,-9,4,-14,2);rect(c,frame%2?'#eeab52':'#fff2ae',4,-16,3+frame%2,4);}
    else if(id==='boomerang'){c.rotate(frame*Math.PI/4);polygon(c,'#795947',[[-13,-3],[-4,-7],[9,-3],[12,5],[7,8],[2,0],[-6,-1],[-13,3]]);line(c,'#dfbd7c',-10,-2,-4,-4,2);line(c,'#b2d68b',-2,-4,7,0,2);}
    // Directional effects are authored facing +X. The renderer rotates them from world velocity.
    else if(id==='leaf'){
      line(c,'#ad733a',-16,0,12,0,3);line(c,'#fff5c7',-14,0,12,0,1);
      polygon(c,'#eab967',[[6,-5],[18,0],[6,5],[8,0]]);
      polygon(c,'#fff1aa',[[10,-3],[17,0],[10,1]]);
      polygon(c,'#8acaba',[[-16,-4],[-11,-3],[-8,0],[-13,0]]);
      polygon(c,'#9fe1ce',[[-16,4],[-11,3],[-8,0],[-13,0]]);
      rect(c,frame%2?'#e4bc67':'#fff2c8',-18,0,2,1);
    }
    else if(id==='ember'){
      polygon(c,'#3d8d9b',[[-14,-16],[-2,-17],[9,-13],[15,-7],[18,0],[15,7],[9,13],[-2,17],[-14,16],[-5,12],[2,6],[5,0],[2,-6],[-5,-12]]);
      polygon(c,'#83edcc',[[-13,-15],[-2,-15],[8,-12],[14,-6],[16,0],[14,6],[8,12],[-2,15],[-13,15],[-5,13],[5,7],[9,0],[5,-7],[-5,-13]]);
      line(c,'#ecfff3',8,-11,14,-5,2);line(c,'#e1ffed',14,-5,15,0,2);
      line(c,'#c4ffdf',15,0,13,6,2);line(c,'#89dac9',13,6,8,11,2);
      line(c,'#5ab8a9',-16,-6,-10,-6,1);line(c,'#5ab8a9',-16,6,-9,6,1);
      if(frame%2===0)rect(c,'#c7f7d4',-17,-1,5,2);
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
  function moon(){const canvas=surface(80,80),c=canvas.getContext('2d');oval(c,'#70767c',40,40,35,35);oval(c,'#b0b4aa',37,36,31,31);oval(c,'#d0cdb6',32,31,23,25);for(const[x,y,r]of[[25,17,5],[56,23,4],[17,44,4],[62,48,6],[38,11,3]])oval(c,'#8e968e',x,y,r,r);oval(c,'#676c65',27,36,10,12);oval(c,'#676c65',53,36,10,12);oval(c,'#decb8b',27,38,5,7);oval(c,'#decb8b',53,38,5,7);rect(c,'#b84d38',27,36,2,5);rect(c,'#b84d38',52,36,2,5);polygon(c,'#8a8f7a',[[37,34],[44,33],[48,51],[36,51]]);oval(c,'#4b514a',40,58,20,10);for(let x=23;x<60;x+=6)rect(c,'#e4dec3',x,54,4,7);rect(c,'#e4dec3',27,65,27,2);return outline(canvas);}
  function clock(){const canvas=surface(64,64),c=canvas.getContext('2d');oval(c,'#433d49',32,32,29,29);oval(c,'#cfb879',32,32,26,26);oval(c,'#f5e5b8',32,32,23,23);for(let i=0;i<12;i++){const a=i*Math.PI/6;rect(c,'#685344',Math.round(31+Math.sin(a)*19),Math.round(31-Math.cos(a)*19),2,3);}rect(c,'#685344',31,15,3,19);polygon(c,'#685344',[[31,30],[47,40],[44,43],[30,34]]);oval(c,'#9b6744',32,32,3,3);return outline(canvas);}
  function canvas(kind,id,direction=0,frame=0,action='idle') {
    const key=[kind,id,direction,frame,action].join(':');
    if(!canvases.has(key))canvases.set(key,kind==='hero'?hero(id,direction,frame,action):kind==='enemy'?enemy(id,frame,action):kind==='boss'?boss(id,frame,action):kind==='projectile'?projectile(id,direction,frame):kind==='tree'?tree(id,frame):kind==='prop'?prop(id,frame):kind==='moon'?moon():kind==='clock'?clock():plant(id,frame));
    return canvases.get(key);
  }
  function textureFor(canvas) { const texture=new THREE.CanvasTexture(canvas);texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;return texture; }
  function material(kind,id,direction=0,frame=0,flash=false,action='idle') {
    const key=[kind,id,direction,frame,flash,action].join(':');
    if(!materials.has(key)){
      let art=canvas(kind,id,direction,frame,action);
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
