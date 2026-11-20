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
  function hero(id, direction, frame) {
    const canvas = surface(48, 64), c = canvas.getContext('2d'), step = frame ? 2 : 0;
    const back = direction === 2, side = direction === 1 || direction === 3;
    if (direction === 3) { c.translate(48, 0); c.scale(-1, 1); }
    if (id === 'midna') {
      // Imp Midna: oversized stone Fused Shadow, orange hair, turquoise markings.
      oval(c, '#ba5d2e', 24, 30, 11, 17); oval(c, '#e99446', 27, 26, 8, 13);
      rect(c, '#292e3d', 18, 37, 12, 14); rect(c, '#73ced0', 18, 38, 4, 9); rect(c, '#73ced0', 24, 45, 5, 4);
      rect(c, '#292e3d', 17, 49, 5, 9 - step); rect(c, '#292e3d', 26, 49, 5, 7 + step);
      rect(c, '#4c5963', 14, 24, 20, 16); rect(c, '#8ad7ce', 17, 31, 7, 8);
      rect(c, '#887d64', 9, 7, 25, 20); rect(c, '#b7ad83', 11, 8, 20, 4); rect(c, '#b7ad83', 7, 13, 8, 20);
      rect(c, '#5b635b', 14, 14, 20, 5); rect(c, '#384e4c', 18, 11, 4, 13); rect(c, '#d4c395', 27, 5, 8, 11);
      rect(c, '#62b9ae', 12, 18, 5, 3); rect(c, '#d7c592', 8, 26, 8, 5);
      if (!back) { rect(c, '#d18c40', side ? 27 : 24, 29, 5, 4); rect(c, '#e65132', side ? 29 : 27, 29, 2, 4); rect(c, '#f8eac3', 25, 36, 5, 1); }
    } else {
      const zelda = id === 'zelda', dark = zelda ? '#634682' : '#24634c', cloth = zelda ? '#a78aca' : '#4b9b55', light = zelda ? '#dbc8e8' : '#85c86b';
      rect(c, '#614a3c', 16, 49 - step, 6, 9 + step); rect(c, '#755742', 27, 49 + step, 6, 9 - step);
      rect(c, '#a27b54', 15, 55 - step, 8, 4); rect(c, '#98704a', 27, 56, 8, 3);
      if (zelda) polygon(c, dark, [[18,33],[30,33],[35,54],[13,54]]);
      rect(c, dark, 15, 32, 19, 17); rect(c, cloth, 16, 32, 16, 12); rect(c, light, 17, 33, 4, 9);
      rect(c, '#b9a36b', 15, 45, 19, 3); rect(c, '#ead28c', 23, 44, 4, 4);
      rect(c, '#e6b582', 11, 34 + step, 5, 11); rect(c, '#f2ca92', 33, 34 - step, 4, 11);
      rect(c, '#b98559', 16, 20, 18, 13); rect(c, '#f5d1a0', 18, 20, 15, 11);
      rect(c, '#e4b85e', 14, 15, 21, 8); rect(c, '#f4d57d', 17, 16, 13, 5);
      rect(c, '#c18c42', 15, 21, 4, 10); rect(c, '#e3b85f', 32, 21, 3, 13);
      if (zelda) {
        rect(c, '#edcd79', 12, 24, 5, 23); rect(c, '#d3a754', 33, 24, 4, 23);
        rect(c, '#cfad61', 17, 17, 18, 2); rect(c, '#f9e0a2', 24, 14, 4, 5); rect(c, '#7387d5', 25, 15, 2, 2);
        rect(c, '#f2d98e', 36, 28, 2, 27); oval(c, '#c9e6ff', 37, 27, 3, 4);
      } else {
        polygon(c, '#317e4b', [[14,18],[16,11],[31,10],[40,25],[29,20]]); rect(c, '#67b958', 17, 12, 13, 4);
        rect(c, '#d4e6e2', 37, 21, 2, 26); rect(c, '#8ca8bd', 39, 23, 1, 22); rect(c, '#b1a1da', 33, 43, 10, 3); rect(c, '#8873ae', 37, 46, 2, 7);
        rect(c, '#535e91', 8, 34, 7, 15); rect(c, '#acb5cd', 9, 35, 5, 2); rect(c, '#d7c167', 10, 39, 3, 5);
      }
      if (back) { rect(c, '#c6944b', 18, 19, 16, 10); rect(c, '#7a6348', 23, 33, 3, 13); }
      else { rect(c, '#344455', side ? 28 : 20, 25, 2, 3); if (!side) rect(c, '#344455', 29, 25, 2, 3); rect(c, '#cb8b65', 25, 30, 3, 1); }
    }
    return outline(canvas);
  }
  function enemy(type, frame) {
    const canvas = surface(64, 72), c = canvas.getContext('2d'), bob = frame ? 1 : 0;
    if (type === 'slime') {
      oval(c, '#226c64', 32, 48, 18, 14); oval(c, '#4baf91', 31, 44 - bob, 17, 15 + bob); oval(c, '#7bd4a8', 27, 40, 10, 9);
      for (const x of [24,38]) { oval(c, '#e5ead1', x, 42, 4, 6); rect(c, '#29394c', x, 41, 2, 5); } rect(c, '#205b59', 28, 53, 9, 2);
    } else if (type === 'mushroom') {
      rect(c, '#487c47', 29, 39, 6, 20); polygon(c, '#74ac50', [[30,53],[11,45],[18,60],[31,61]]); polygon(c, '#92bd59', [[34,52],[53,46],[47,59],[32,61]]);
      oval(c, '#594875', 32, 31 + bob, 16, 16); oval(c, '#a98dc9', 28, 27 + bob, 11, 10); rect(c, '#2c3047', 18, 31, 29, 7);
      for (let x=20; x<46; x+=6) polygon(c, '#f6e9c5', [[x,31],[x+4,31],[x+2,36]]);
      for (const [x,y] of [[22,22],[36,19],[41,26]]) rect(c, '#e9dcb2', x,y,4,4);
    } else if (type === 'bat') {
      polygon(c, '#655278', [[27,31],[8,17+bob*8],[3,39],[17,34],[23,44]]); polygon(c, '#8e76a6', [[37,31],[56,17+bob*8],[61,39],[47,34],[41,44]]);
      oval(c, '#49435c', 32, 37, 9, 12); polygon(c, '#4d465e', [[24,30],[23,16],[31,27]]); polygon(c, '#4d465e', [[34,27],[42,16],[40,32]]);
      rect(c, '#f1cf69', 26,32,4,4); rect(c, '#f1cf69', 35,32,4,4); rect(c, '#e4cfa4', 29,43,2,4); rect(c, '#e4cfa4', 34,43,2,4);
    } else if (type === 'boar') {
      rect(c, '#654746', 21,50-bob,8,15);rect(c, '#654746', 37,50+bob,8,14);oval(c, '#a64b43', 33,43,16,15);oval(c, '#ce6955', 32,28,16,15);
      polygon(c, '#d69c66', [[18,24],[7,19],[15,32]]);polygon(c, '#d69c66', [[46,24],[58,19],[50,32]]);oval(c, '#d59c77', 32,35,11,7);
      rect(c, '#403d41', 23,27,5,3);rect(c, '#403d41', 37,27,5,3);rect(c, '#e8dab1', 23,34,4,6);rect(c, '#e8dab1', 38,34,4,6);rect(c, '#6d443e', 29,34,3,3);rect(c, '#6d443e', 34,34,3,3);
      rect(c, '#c2a36c', 20,47,25,4);rect(c, '#f1d392', 30,46,5,6);rect(c, '#654b3d', 50,28,5,35);oval(c, '#8e7453', 52,25,7,10);
    } else {
      polygon(c, '#322f4b', [[23,26],[42,26],[57,64],[7,64]]);polygon(c, '#57485e', [[31,29],[39,31],[48,64],[31,61]]);
      rect(c, '#617b78', 22,31,23,21);rect(c, '#8c9e87', 24,33,6,15);rect(c, '#cfad64', 22,46,23,4);oval(c, '#82978b', 33,22,12,13);
      polygon(c, '#c0c69d', [[21,17],[15,6],[29,12]]);polygon(c, '#c0c69d', [[38,12],[51,6],[44,22]]);rect(c, '#263740', 23,21,21,7);rect(c, '#d2f27e', 26,23,5,2);rect(c, '#d2f27e', 37,23,5,2);
      rect(c, '#b1dcc7', 9,25,3,34);rect(c, '#ede3b0', 4,51,13,3);rect(c, '#b1dcc7', 53,25,3,34);rect(c, '#ede3b0', 48,51,13,3);
    }
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
  function canvas(kind,id,direction=0,frame=0) {
    const key=[kind,id,direction,frame].join(':');
    if(!canvases.has(key))canvases.set(key,kind==='hero'?hero(id,direction,frame):kind==='enemy'?enemy(id,frame):kind==='tree'?tree(id):kind==='moon'?moon():kind==='clock'?clock():plant(id));
    return canvases.get(key);
  }
  function textureFor(canvas) { const texture=new THREE.CanvasTexture(canvas);texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;texture.generateMipmaps=false;return texture; }
  function material(kind,id,direction=0,frame=0,flash=false) {
    const key=[kind,id,direction,frame,flash].join(':');
    if(!materials.has(key)){
      let art=canvas(kind,id,direction,frame);
      if(flash){const white=surface(art.width,art.height),c=white.getContext('2d');c.drawImage(art,0,0);c.globalCompositeOperation='source-in';c.fillStyle='#fff1b5';c.fillRect(0,0,art.width,art.height);art=white;}
      const texture=textureFor(art);textures.set(key,texture);materials.set(key,new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.35,depthWrite:false}));
    }
    return materials.get(key);
  }
  function sprite(kind,id,width,height,direction=0,frame=0){const sprite=new THREE.Sprite(material(kind,id,direction,frame));sprite.center.set(.5,0);sprite.scale.set(width,height,1);return sprite;}
  function terrain(realm,stone=false) {
    const key='terrain:'+realm+':'+stone;if(textures.has(key))return textures.get(key);
    const tile=surface(64,64),c=tile.getContext('2d');const palettes=[['#56984d','#64a653','#478c47','#8ab75d'],['#d8c18a','#e6d097','#c7ad77','#eee0b2'],['#66628b','#77729e','#504f75','#9290b0'],['#83ab61','#94bd72','#739c54','#b1cc87'],['#62616a','#777078','#4e505a','#9c7971'],['#769593','#88a4a1','#637f83','#b0bfb0']];const p=palettes[realm];rect(c,stone?'#8e8b78':p[0],0,0,64,64);
    let seed=998+realm;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    if(stone){for(let row=0;row<6;row++)for(let col=-1;col<5;col++){const x=col*16+(row%2)*8,y=row*11;rect(c,'#687064',x,y,16,11);rect(c,'#b5b296',x+1,y+1,14,8);rect(c,'#d1c9a6',x+2,y+1,12,2);rect(c,'#7a826b',x+1,y+8,14,1);if(random()>.4)rect(c,p[2],x+2,y+2,3+Math.floor(random()*7),2);}}
    else for(let i=0;i<580;i++){const x=Math.floor(random()*64),y=Math.floor(random()*64);rect(c,p[1+Math.floor(random()*3)],x,y,1+Math.floor(random()*3),1);if(i%53===0&&realm!==4){rect(c,'#e6dfb7',x,y,2,2);}}
    const texture=textureFor(tile);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;textures.set(key,texture);return texture;
  }
  window.RelicArt=Object.freeze({canvas,material,sprite,terrain});
})();
