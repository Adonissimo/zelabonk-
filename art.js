/* Independently drawn pixel art for the ZeldaBonk fan game. No extracted game assets. */
(function () {
  'use strict';
  const canvases = new Map(), textures = new Map(), materials = new Map();
  function surface(w, h) { const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; return canvas; }
  function rect(ctx, color, x, y, w, h) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
  function oval(ctx, color, x, y, rx, ry) {
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
    const src = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height), data = ctx.createImageData(canvas.width, canvas.height);
    for (let y = 1; y < canvas.height - 1; y++) for (let x = 1; x < canvas.width - 1; x++) {
      const at = (y * canvas.width + x) * 4;
      if (!src.data[at + 3] && [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => src.data[((y+dy)*canvas.width+x+dx)*4+3])) {
        data.data.set([27, 34, 43, 255], at);
      }
    }
    ctx.putImageData(data, 0, 0); ctx.drawImage(canvas, 0, 0); return out;
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
  function hero(id,direction,frame,action='idle'){
    const canvas=surface(64,80),c=canvas.getContext('2d'),phase=frame/Math.max(1,(ANIMATIONS[action]||[4])[0]-1),wave=Math.sin(frame*Math.PI/4);
    const back=direction===2,side=direction===1||direction===3,walking=action==='walk'||action==='dash',attacking=['attack','cast','ultimate'].includes(action),casting=action==='cast'||action==='ultimate';
    if(direction===3){c.translate(64,0);c.scale(-1,1);}poseContext(c,64,80,action,frame);
    const step=walking?Math.round(wave*3):0,raise=attacking?Math.round(Math.sin(phase*Math.PI)*13):action==='victory'?12:action==='glide'?8+frame%2:action==='jump'?frame%3:0;
    if(id==='midna'){
      // Imp Midna: oversized stone Fused Shadow, orange hair, turquoise markings.
      oval(c,'#ae572f',32,40,13,22);oval(c,'#e99446',37,34,9,18);rect(c,'#eeae5a',38,23,3,17);
      rect(c,'#292e3d',25,48,15,16);rect(c,'#69c8c7',25,49,4,12);rect(c,'#9be0d1',32,57,5,4);
      rect(c,'#292e3d',24,62-step,6,10+step);rect(c,'#292e3d',35,62+step,6,10-step);rect(c,'#85d3cb',23,69-step,7,3);rect(c,'#85d3cb',36,69+step,6,3);
      rect(c,'#445b61',21,31,24,19);rect(c,'#8ad7ce',24,39,8,11);rect(c,'#a8e8da',25,41,3,6);
      rect(c,'#887d64',16,10,28,23);rect(c,'#b7ad83',18,11,22,4);rect(c,'#b7ad83',13,18,9,24);rect(c,'#d7c79a',15,18,3,17);
      rect(c,'#5b635b',21,19,22,5);rect(c,'#384e4c',26,14,5,17);rect(c,'#d4c395',36,6,9,13);rect(c,'#aa9b76',42,5,4,9);
      rect(c,'#62b9ae',18,25,6,3);rect(c,'#d7c592',14,34,10,5);rect(c,'#4b5e59',32,12,3,4);
      if(!back){rect(c,'#e0a652',side?37:34,37,6,5);rect(c,'#e65337',side?40:38,37,2,5);rect(c,'#fff2c9',35,47,6,1);}
      rect(c,'#394d53',18,49-raise,6,11);rect(c,'#8ad7ce',17,50-raise,4,6);rect(c,'#374750',43,48-raise,5,11);rect(c,'#8ad7ce',45,48-raise,4,5);
      if(casting){oval(c,'#8fe3cf',47,42-raise,5+frame%2,4);rect(c,'#e7ffdd',45,40-raise,3,3);}
    }else if(id==='skullkid'){
      rect(c,'#6b3b47',25,58-step,6,13);rect(c,'#6b3b47',36,58+step,6,13);rect(c,'#ce8751',23,69-step,9,4);rect(c,'#ce8751',35,69+step,9,4);
      polygon(c,'#965142',[[23,37],[41,37],[45,61],[20,61]]);rect(c,'#cc8650',25,39,5,18);rect(c,'#dd9a55',20,42-raise,5,13);rect(c,'#bd6f45',43,42-raise,5,13);
      oval(c,'#9b743f',32,20,22,6);polygon(c,'#b99755',[[18,20],[24,7],[40,7],[47,20]]);rect(c,'#d7b96d',23,12,14,3);rect(c,'#684d35',20,20,27,3);
      polygon(c,'#6c3b72',[[18,27],[24,23],[32,29],[40,23],[47,28],[43,43],[33,53],[23,44]]);polygon(c,'#b5525c',[[22,29],[31,32],[32,47],[26,42]]);polygon(c,'#b96943',[[34,32],[43,29],[40,44],[33,49]]);
      for(const x of [24,39]){oval(c,'#e9cf62',x,35,5,6);oval(c,'#db713a',x,35,3,4);rect(c,'#31323e',x,33,1,5);}
      for(const[x,y,dx]of[[19,29,-6],[19,37,-6],[23,45,-5],[43,26,7],[46,34,7],[43,44,6]])polygon(c,'#d9b45f',[[x,y],[x+dx,y-3],[x+dx/2,y+5]]);
      if(casting){rect(c,'#d5b5ed',14,30-raise,4,4);rect(c,'#efd58b',48,28-raise,4,4);}
    }else{
      const palettes={link:['#24634c','#4b9b55','#85c86b','#dcb25c'],zelda:['#634682','#a78aca','#dbc8e8','#e8c56b'],tetra:['#315d7c','#568fa5','#92bfca','#e8ce78'],sheik:['#3f4d76','#687da3','#acb9d4','#e7e5cd']};
      const[dark,cloth,light,hair]=palettes[id]||palettes.link,zelda=id==='zelda',sheik=id==='sheik',tetra=id==='tetra';
      const folded=action==='jump'||action==='glide'?4:0;
      rect(c,'#51433b',24,57-step,7,14+step-folded);rect(c,'#6b5140',36,57+step,7,14-step-folded);rect(c,'#9b744b',23,68-step-folded,9,5);rect(c,'#87603f',36,68+step-folded,9,5);
      if(zelda)polygon(c,dark,[[24,39],[41,39],[47,68],[18,68]]);
      rect(c,dark,21,38,24,22);rect(c,cloth,23,39,19,17);rect(c,light,24,40,4,12);rect(c,'#c0a36b',21,55,24,4);rect(c,'#f0d798',31,54,5,6);
      rect(c,'#d5a574',17,42+step-raise,6,14);rect(c,'#edc69a',44,42-step-raise,6,14);rect(c,'#fff0c4',46,43-step-raise,2,5);
      rect(c,'#b98559',22,22,22,17);rect(c,'#f5d1a0',24,23,18,14);rect(c,'#ffe1af',25,24,6,8);
      rect(c,hair,20,17,25,10);rect(c,'#c79849',21,26,4,13);rect(c,hair,41,26,4,13);polygon(c,'#e5bd8b',[[23,28],[16,25],[21,33]]);polygon(c,'#e5bd8b',[[44,28],[50,25],[46,33]]);
      if(zelda){rect(c,hair,18,28,5,24);rect(c,'#cea651',43,28,4,25);rect(c,'#c9a14e',22,21,22,3);polygon(c,'#ffe4a0',[[28,21],[33,14],[38,21]]);rect(c,'#6387c4',32,18,3,4);polygon(c,'#e9d8a2',[[30,40],[36,40],[33,46]]);}
      else if(sheik){rect(c,'#ece7d7',20,15,25,10);rect(c,'#faf6de',23,15,14,3);rect(c,'#c5c6bd',21,26,7,10);rect(c,'#e7e3d3',24,33,21,6);rect(c,'#c7c7c0',27,36,14,3);polygon(c,'#a34251',[[29,43],[36,43],[33,49]]);rect(c,'#faf1d3',31,44,3,2);line(c,'#a34251',28,50,38,50,1);}
      else if(tetra){polygon(c,'#e9ce78',[[20,22],[23,12],[37,11],[45,19],[40,27],[28,23]]);polygon(c,'#bca256',[[43,20],[54,15],[55,27],[44,29]]);rect(c,'#e9ce78',46,18,7,6);rect(c,'#eee8cf',23,40,4,14);rect(c,'#eee8cf',39,40,4,14);rect(c,'#9e5d54',27,51,11,4);}
      else{polygon(c,'#317e4b',[[18,23],[20,12],[38,11],[51,31],[36,24]]);rect(c,'#67b958',22,14,13,4);rect(c,'#8bd379',23,15,5,2);}
      if(back){rect(c,hair,24,24,18,12);line(c,'#715d43',27,40,37,57,3);}
      else{const eye=side?36:27;rect(c,'#344455',eye,29,2,4);if(!side)rect(c,'#344455',38,29,2,4);if(action==='hurt'){rect(c,'#b57e60',25,29,16,2);}rect(c,'#ca8c67',32,36,4,1);}
      if(id==='link'){
        const angle=attacking?-1.4+phase*3.1:-.2;c.save();c.translate(49,51);c.rotate(angle);rect(c,'#d4e6e2',-1,-29,3,27);rect(c,'#8ca8bd',2,-26,1,24);polygon(c,'#f2f9e8',[[-1,-29],[0,-34],[2,-29]]);rect(c,'#a89ad3',-7,-4,15,3);rect(c,'#705ca0',-1,-1,3,8);rect(c,'#dfc98b',0,5,2,3);c.restore();
        rect(c,'#515d87',12,42-raise,8,17);rect(c,'#b8c2d1',13,43-raise,6,2);polygon(c,'#dcbd68',[[16,46-raise],[19,51-raise],[13,51-raise]]);rect(c,'#b37e66',15,52-raise,3,4);
      }else if(zelda){const bowX=49+(attacking?Math.round(Math.sin(phase*Math.PI)*2):0),bowY=45-raise;line(c,'#cfab5b',bowX,bowY-11,bowX+6,bowY-4,2);line(c,'#cfab5b',bowX+6,bowY-4,bowX+6,bowY+5,2);line(c,'#cfab5b',bowX+6,bowY+5,bowX,bowY+12,2);line(c,'#faf0ce',bowX,bowY-10,bowX-2,bowY+11,1);if(attacking)line(c,'#fff2bc',bowX-7,bowY,bowX+12,bowY,1);}
      else if(tetra){if(action!=='cast'||phase<.6){oval(c,'#2c3545',49,46-raise,5,6);rect(c,'#d3b06c',48,39-raise,3,3);rect(c,frame%2?'#f1bb69':'#fff0b0',50,36-raise,2,3);}}
      else if(sheik){c.save();c.translate(50,49-raise);c.rotate(attacking?phase*Math.PI:0);polygon(c,'#bc9a6c',[[-5,-7],[1,-7],[7,4],[3,7],[-1,-1],[-7,1]]);line(c,'#eee4b5',-4,-6,1,-6,1);c.restore();}
    }
    if(action==='ultimate'||action==='victory'){
      const color=id==='midna'?'#a3e3d4':'#f5d78b',offset=frame%3;for(const[x,y]of[[9,17],[53,8],[6,52]]){rect(c,color,x,y-offset,3,1);rect(c,color,x+1,y-1-offset,1,3);}
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
      oval(c,'#416375',32,46,22,16);oval(c,'#6a8c93',29,41,17,12);for(const x of[19,44]){oval(c,'#445567',x,33+bob,7,10);oval(c,'#d6c47e',x,30+bob,4,5);rect(c,'#39333c',x,28+bob,2,5);}rect(c,'#243b4d',19,48,27,7);for(let x=22;x<44;x+=7)polygon(c,'#e4d3a0',[[x,48],[x+4,48],[x+2,54]]);oval(c,'#38536a',12,57+bob,9,5);oval(c,'#38536a',51,57-bob,9,5);
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
    else if(id==='leaf'){line(c,'#fff5c7',-15,0,10,0,2);polygon(c,'#f3d98c',[[7,-5],[17,0],[7,5]]);line(c,'#b4e7da',-13,-4,-8,0,2);line(c,'#b4e7da',-13,4,-8,0,2);}
    else if(id==='hostile'){c.rotate(-direction*Math.PI/4);oval(c,'#a45b88',0,0,7+frame%2,7+frame%2);oval(c,'#f0afba',-1,-1,5,5);rect(c,'#fff2cd',-3,-3,3,3);}
    else{polygon(c,'#77cbbf',[[-16,-3],[8,-3],[17,0],[8,3],[-16,3]]);rect(c,'#d6fff0',-10,-1,23,2);rect(c,'#e5d394',-11,-6,3,12);}
    return outline(canvas);
  }
  function tree(realm) {
    const canvas=surface(80,112),c=canvas.getContext('2d');const dark=realm===2?'#383a66':realm===5?'#344f64':'#28543c', mid=realm===2?'#655c92':realm===5?'#638b84':'#3f8546', light=realm===2?'#9c8abc':realm===5?'#a1b8a0':'#89b959';
    rect(c,'#694f3b',34,61,13,47);rect(c,'#a47d4f',36,72,4,29);rect(c,'#483e33',42,78,4,27);
    const clusters=[[40,23,20,17],[22,42,18,20],[58,42,18,20],[39,48,27,24],[22,65,17,17],[59,65,17,17],[40,72,25,18]];
    for(const [x,y,rx,ry]of clusters){oval(c,dark,x,y,rx,ry);oval(c,mid,x-2,y-4,rx-3,ry-4);oval(c,light,x-5,y-8,Math.max(4,rx-9),Math.max(4,ry-10));}
    for(const [x,y]of [[22,36],[38,14],[48,37],[16,58],[48,65],[31,53]]){rect(c,light,x,y,4,3);rect(c,mid,x+3,y+3,3,2);}
    if(realm===6){rect(c,'#786144',27,79,27,30);rect(c,'#a08553',29,82,7,22);rect(c,'#423d30',31,90,5,3);rect(c,'#423d30',45,90,5,3);rect(c,'#c0a272',30,86,8,2);rect(c,'#c0a272',43,86,8,2);rect(c,'#6b4f36',38,91,5,9);rect(c,'#423d30',36,103,10,3);}
    return outline(canvas);
  }
  function moon(){const canvas=surface(80,80),c=canvas.getContext('2d');oval(c,'#70767c',40,40,35,35);oval(c,'#b0b4aa',37,36,31,31);oval(c,'#d0cdb6',32,31,23,25);for(const[x,y,r]of[[25,17,5],[56,23,4],[17,44,4],[62,48,6],[38,11,3]])oval(c,'#8e968e',x,y,r,r);oval(c,'#676c65',27,36,10,12);oval(c,'#676c65',53,36,10,12);oval(c,'#decb8b',27,38,5,7);oval(c,'#decb8b',53,38,5,7);rect(c,'#b84d38',27,36,2,5);rect(c,'#b84d38',52,36,2,5);polygon(c,'#8a8f7a',[[37,34],[44,33],[48,51],[36,51]]);oval(c,'#4b514a',40,58,20,10);for(let x=23;x<60;x+=6)rect(c,'#e4dec3',x,54,4,7);rect(c,'#e4dec3',27,65,27,2);return outline(canvas);}
  function clock(){const canvas=surface(64,64),c=canvas.getContext('2d');oval(c,'#433d49',32,32,29,29);oval(c,'#cfb879',32,32,26,26);oval(c,'#f5e5b8',32,32,23,23);for(let i=0;i<12;i++){const a=i*Math.PI/6;rect(c,'#685344',Math.round(31+Math.sin(a)*19),Math.round(31-Math.cos(a)*19),2,3);}rect(c,'#685344',31,15,3,19);polygon(c,'#685344',[[31,30],[47,40],[44,43],[30,34]]);oval(c,'#9b6744',32,32,3,3);return outline(canvas);}
  function plant(realm) {
    const canvas=surface(32,32),c=canvas.getContext('2d');const green=realm===2?'#8277a3':'#53894b';
    for(let i=0;i<5;i++){const x=6+i*5;rect(c,green,x,15-i%2*4,2,15);rect(c,'#8fbf67',x-3,19-i%2*4,3,3);}
    for(const [x,y]of [[5,12],[15,7],[25,13]]){rect(c,'#f4e8b6',x-2,y,7,3);rect(c,'#f4e8b6',x,y-2,3,7);rect(c,realm===2?'#db9bcc':'#edbd64',x,y,3,3);}
    return outline(canvas);
  }
  function canvas(kind,id,direction=0,frame=0,action='idle') {
    const key=[kind,id,direction,frame,action].join(':');
    if(!canvases.has(key))canvases.set(key,kind==='hero'?hero(id,direction,frame,action):kind==='enemy'?enemy(id,frame,action):kind==='boss'?boss(id,frame,action):kind==='projectile'?projectile(id,direction,frame):kind==='tree'?tree(id):kind==='moon'?moon():kind==='clock'?clock():plant(id));
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
  function terrain(realm,stone=false) {
    const key='terrain:'+realm+':'+stone;if(textures.has(key))return textures.get(key);
    const tile=surface(64,64),c=tile.getContext('2d');const palettes=[['#56984d','#64a653','#478c47','#8ab75d'],['#d8c18a','#e6d097','#c7ad77','#eee0b2'],['#66628b','#77729e','#504f75','#9290b0'],['#83ab61','#94bd72','#739c54','#b1cc87'],['#62616a','#777078','#4e505a','#9c7971'],['#769593','#88a4a1','#637f83','#b0bfb0']];const p=palettes[realm===7?3:realm%6];rect(c,stone?'#8e8b78':p[0],0,0,64,64);
    let seed=998+realm;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    if(stone){for(let row=0;row<6;row++)for(let col=-1;col<5;col++){const x=col*16+(row%2)*8,y=row*11;rect(c,'#687064',x,y,16,11);rect(c,'#b5b296',x+1,y+1,14,8);rect(c,'#d1c9a6',x+2,y+1,12,2);rect(c,'#7a826b',x+1,y+8,14,1);if(random()>.4)rect(c,p[2],x+2,y+2,3+Math.floor(random()*7),2);}}
    else for(let i=0;i<580;i++){const x=Math.floor(random()*64),y=Math.floor(random()*64);rect(c,p[1+Math.floor(random()*3)],x,y,1+Math.floor(random()*3),1);if(i%53===0&&realm!==4){rect(c,'#e6dfb7',x,y,2,2);}}
    const texture=textureFor(tile);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;textures.set(key,texture);return texture;
  }
  window.RelicArt=Object.freeze({canvas,material,sprite,terrain,animationFrame,ANIMATIONS});
})();
