/* Original native-resolution scenery sprites for the Kokiri pixel map.
 * All outline coverage is binary: no blurred fills, gradients, or external art.
 */
(function (root, factory) {
  const art = factory();
  if (typeof module === 'object' && module.exports) module.exports = art;
  else root.BonkKokiriArt = art;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';

  const sizes = {
    home: [56, 50], deku: [110, 114], 'deku-open': [110, 114],
    tree: [32, 44], rock: [25, 18], plant: [15, 16],
    lantern: [12, 26], shrine: [34, 32], root: [32, 44],
    fungus: [22, 15], wall: [48, 25]
  };
  for (const size of Object.values(sizes)) Object.freeze(size);
  Object.freeze(sizes);
  const variants=Object.freeze({home:5,tree:4,rock:3,plant:4,lantern:2,root:2,fungus:3,wall:6});
  const wood = ['#242921','#373325','#4c3929','#684b31','#865d3a','#aa7e4a','#c89c63','#dfb777'];
  const leaf = ['#222c24','#303e2a','#405133','#53633a','#657744','#819050','#a4aa59'];
  const stone = ['#2e3630','#3a4539','#4e5848','#646b52','#828465','#a1a17a'];
  const glow = ['#7b4727','#cc743d','#f3ad57','#ffe19a','#fff3cb'];
  const rect = (c, x, y, w, h, color) => { c.fillStyle = color; c.fillRect(x, y, w, h); };
  const seed = n => () => { n = (Math.imul(1664525, n) + 1013904223) >>> 0; return n / 4294967296; };

  // Scan-convert at half-pixel centers. Even sloped silhouettes remain pixel-sharp.
  function poly(c, points, color, mask) {
    c.fillStyle = color;
    const top = Math.min(...points.map(p => p[1]));
    const bottom = Math.max(...points.map(p => p[1]));
    for (let y = top; y < bottom; y++) {
      const crossings = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length], v = y + .5;
        if ((a[1] <= v && b[1] > v) || (b[1] <= v && a[1] > v)) {
          crossings.push(a[0] + (b[0] - a[0]) * (v - a[1]) / (b[1] - a[1]));
        }
      }
      crossings.sort((a, b) => a - b);
      for (let i = 0; i + 1 < crossings.length; i += 2) {
        const a = Math.ceil(crossings[i] - .5), b = Math.ceil(crossings[i + 1] - .5);
        if (b <= a) continue;
        c.fillRect(a, y, b - a, 1);
        if (mask) for (let x = a; x < b; x++) mask.add(x + ',' + y);
      }
    }
  }
  function line(c, points, color, width = 1) {
    c.fillStyle = color;
    const o = Math.floor(width / 2);
    for (let p = 1; p < points.length; p++) {
      let [x,y] = points[p - 1];
      const [a,b] = points[p], dx = Math.abs(a - x), dy = -Math.abs(b - y), sx = Math.sign(a - x), sy = Math.sign(b - y);
      let err = dx + dy;
      do {
        c.fillRect(x - o, y - o, width, width);
        if (x === a && y === b) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
      } while (true);
    }
  }
  function flecks(c, mask, palette, random, x0, x1, y0, y1, n, tall = false) {
    for (let i = 0; i < n; i++) {
      const x = Math.floor(x0 + random() * (x1 - x0)), y = Math.floor(y0 + random() * (y1 - y0));
      const color = palette[Math.floor(random() * palette.length)];
      if (!mask || mask.has(x + ',' + y)) rect(c,x,y,1,1,color);
      const tx = x + (tall ? 0 : 1), ty = y + (tall ? 1 : 0);
      if ((!mask || mask.has(tx + ',' + ty)) && random() > .48) rect(c,tx,ty,1,1,color);
    }
  }
  function lamp(c,x,y,variant=0) {
    rect(c,x-1,y,2,3,wood[1]);
    poly(c,[[x-4,y+3],[x+3,y+3],[x+4,y+5],[x+4,y+10],[x+2,y+12],[x-3,y+12],[x-4,y+10]],wood[1]);
    rect(c,x-2,y+5,4,5,glow[variant ? 2 : 1]);rect(c,x-1,y+5,2,4,glow[3]);rect(c,x-1,y+6,1,2,glow[4]);
    rect(c,x-2,y+11,4,1,wood[3]);
  }
  function tuft(c,x,y,lush=false) {
    line(c,[[x-3,y],[x-4,y-3],[x-5,y-4]],leaf[2]);
    line(c,[[x-2,y],[x-2,y-4],[x-3,y-6]],leaf[4]);
    line(c,[[x,y],[x+1,y-6],[x+2,y-7]],leaf[lush?6:5]);
    line(c,[[x+2,y],[x+4,y-4],[x+5,y-4]],leaf[3]);
    rect(c,x-2,y,5,1,leaf[2]);
  }

  const homeColors = [
    ['#adbd68','#72944f','#546b3c','#679d8b'], ['#c2c96d','#839d4d','#5b753d','#d69683'],
    ['#d1a458','#a37546','#75523a','#e3b46b'], ['#acb37c','#7a8954','#556a46','#d99162'],
    ['#c0c96c','#8e9851','#5b7042','#8ebea6']
  ];
  function home(c, v, random) {
    const color = homeColors[v];
    const body = [[6,44],[10,38],[10,24],[7,18],[8,13],[14,8],[23,6],[33,6],[44,9],[49,14],[49,19],[46,24],[45,39],[50,44],[50,47],[38,47],[35,49],[22,49],[18,47],[8,48],[6,47]];
    const mask=new Set();
    poly(c,body,wood[0],mask);
    poly(c,[[7,44],[12,37],[12,20],[44,20],[43,37],[48,44],[47,46],[36,45],[34,48],[23,48],[19,45],[9,47]],wood[3]);
    poly(c,[[11,43],[15,34],[15,23],[36,22],[35,46],[23,47],[20,44],[12,46]],wood[4]);
    poly(c,[[34,24],[42,21],[42,36],[46,44],[40,43],[36,47]],wood[2]);
    for (const row of [
      [[11,44],[15,41],[17,35],[17,24]],[[16,43],[19,38],[21,33],[21,25]],
      [[35,45],[36,40],[37,33],[37,26]],[[42,43],[41,38],[40,30],[40,25]],
      [[9,45],[11,45],[13,44]], [[19,46],[21,45],[23,46]]
    ]) line(c,row,wood[5]);
    line(c,[[14,43],[16,39],[18,27]],wood[2]);
    line(c,[[42,45],[39,42],[38,37],[39,31]],wood[1]);
    flecks(c,mask,[wood[3],wood[5],wood[6]],random,11,44,25,46,30,true);

    // Flat sawn cap with broken annual rings; no changing specular sides.
    poly(c,[[7,16],[10,11],[18,8],[27,7],[36,7],[45,10],[49,14],[48,19],[43,23],[33,26],[20,26],[11,22],[7,19]],wood[2]);
    poly(c,[[8,16],[12,11],[20,8],[30,8],[38,9],[45,11],[48,15],[47,18],[42,21],[34,24],[20,24],[13,22],[8,19]],wood[5]);
    poly(c,[[10,15],[14,11],[22,9],[34,9],[43,11],[46,14],[45,17],[41,20],[32,22],[21,22],[14,20],[10,18]],wood[6]);
    poly(c,[[13,15],[19,12],[29,10],[38,12],[43,15],[40,18],[32,21],[22,21],[17,19],[13,17]],wood[5]);
    poly(c,[[17,15],[23,12],[32,12],[38,14],[39,16],[34,18],[27,20],[21,19],[17,17]],wood[7]);
    poly(c,[[21,15],[25,13],[33,14],[35,16],[30,18],[24,18],[21,17]],wood[5]);
    line(c,[[24,16],[28,15],[32,16],[29,17],[26,17]],wood[7]);
    line(c,[[11,18],[14,18],[16,20]],wood[4]);
    line(c,[[42,13],[42,14],[45,16]],wood[4]);
    line(c,[[31,10],[32,11],[33,12]],wood[4]);
    // Moss hangs over the roof edges in discrete steps.
    poly(c,[[8,13],[13,10],[18,9],[20,9],[18,11],[14,12],[13,14],[11,14],[10,17],[9,18],[8,17]],color[1]);
    line(c,[[9,14],[11,12],[17,10]],color[0]);
    poly(c,[[34,22],[37,21],[40,20],[42,19],[46,18],[47,16],[48,16],[47,20],[44,22],[43,25],[41,24],[40,23],[38,24],[37,25],[37,23],[34,23]],color[2]);
    line(c,[[35,22],[39,22],[42,20],[45,19]],color[1]);
    rect(c,40,21,2,1,color[0]);

    const door = [[20,46],[20,39],[21,35],[24,32],[29,31],[32,33],[35,36],[36,41],[36,46]];
    poly(c,door,wood[1]);
    poly(c,[[21,46],[21,39],[22,36],[25,33],[29,32],[33,35],[35,40],[35,46]],wood[6]);
    poly(c,[[23,46],[23,40],[24,37],[27,35],[30,35],[33,38],[34,41],[34,46]],'#282a23');
    if (v===2 || v===4){
      rect(c,24,42,9,3,wood[4]);line(c,[[24,42],[32,42]],wood[7]);rect(c,25,45,2,1,wood[2]);
    } else {
      line(c,[[24,44],[24,40],[26,37],[29,36]],wood[3]);
      rect(c,31,41,1,2,color[0]);rect(c,25,45,9,1,wood[3]);
    }
    line(c,[[20,47],[23,47],[24,48],[33,48],[36,47]],wood[0]);
    rect(c,24,47,10,1,wood[6]);rect(c,24,48,10,2,wood[2]);rect(c,25,48,8,1,wood[5]);
    if(v===2){
      rect(c,36,28,1,8,wood[7]);rect(c,37,28,9,5,wood[2]);rect(c,38,29,7,3,color[3]);rect(c,40,30,3,1,wood[3]);
    }else{
      poly(c,[[13,30],[17,28],[19,29],[19,34],[15,35],[13,34]],wood[1]);
      rect(c,14,31,4,3,wood[5]);rect(c,15,31,3,2,color[3]);rect(c,16,31,1,3,wood[3]);rect(c,15,34,4,1,wood[7]);
      if(v===1){line(c,[[40,30],[40,35],[42,38]],leaf[3]);rect(c,42,34,2,2,color[3]);rect(c,39,35,2,1,color[3]);}
      if(v===3){rect(c,39,31,4,2,wood[6]);rect(c,39,34,3,1,color[3]);}
      if(v===4){line(c,[[38,44],[38,33]],wood[2]);line(c,[[44,44],[44,32]],wood[5]);for(let y=33;y<=43;y+=2)rect(c,39,y,5,1,wood[6]);}
    }
    tuft(c,11,46,v===1);tuft(c,46,46,v===4);
    if(v===1||v===2)lamp(c,37,33,v===2);
  }

  function deku(c, open, random) {
    const trunk = [[1,109],[3,101],[13,95],[20,87],[24,73],[24,59],[14,52],[8,41],[5,23],[11,17],[20,17],[22,10],[29,6],[40,9],[45,3],[55,0],[67,0],[73,5],[83,4],[91,7],[96,14],[104,14],[109,25],[104,38],[99,45],[92,52],[87,66],[85,83],[92,94],[106,101],[109,108],[103,112],[81,111],[72,113],[37,113],[27,110],[13,111],[6,113]];
    const mask = new Set();
    poly(c,trunk,wood[0],mask);
    poly(c,[[5,106],[15,98],[28,91],[29,81],[29,65],[23,56],[31,41],[47,27],[69,29],[87,41],[90,52],[83,69],[82,81],[87,93],[96,100],[104,104],[105,108],[90,107],[78,109],[70,111],[39,111],[29,108],[17,109],[8,111]],wood[3]);
    poly(c,[[22,104],[33,96],[38,88],[36,76],[33,56],[46,40],[68,43],[80,53],[76,78],[76,92],[84,102],[77,108],[68,109],[40,109],[31,106]],wood[4]);
    poly(c,[[76,51],[86,52],[84,66],[81,80],[83,92],[96,101],[101,106],[88,106],[76,101],[70,86]],wood[2]);
    poly(c,[[27,60],[35,53],[37,50],[35,82],[25,99],[18,100],[23,94],[26,83]],wood[5]);
    for(const p of [
      [[17,104],[25,102],[34,96],[39,86],[39,81]],[[6,106],[12,103],[16,103],[25,98]],
      [[30,95],[34,87],[32,75],[32,69]],[[42,53],[45,44],[49,43]],
      [[79,92],[86,98],[94,102]],[[85,96],[88,101],[96,104],[101,104]],
      [[74,78],[73,65],[75,60],[78,56]],[[39,71],[39,62],[42,57]]
    ]) line(c,p,wood[5],2);
    for(const p of [
      [[10,109],[20,106],[29,103]],[[27,106],[33,103],[38,100]],[[36,86],[37,83],[37,78]],
      [[80,106],[82,104],[90,108]],[[82,85],[81,79],[82,69]],[[68,48],[71,52],[72,55]]
    ]) line(c,p,wood[2],2);
    flecks(c,mask,[wood[2],wood[3],wood[5]],random,13,98,51,108,160,true);

    // Layered foliage cuts a ragged arc above the recognisable broad wooden face.
    const crowns = [
      [[8,38],[6,27],[9,22],[15,20],[20,21],[24,13],[32,12],[39,15],[41,24],[39,30],[34,33],[30,40],[20,47],[15,45]],
      [[24,28],[24,17],[28,9],[36,8],[43,11],[48,7],[59,7],[65,14],[66,24],[60,30],[55,32],[44,37],[34,35],[29,34]],
      [[42,14],[49,5],[58,2],[67,2],[73,7],[82,6],[90,11],[94,19],[92,28],[86,34],[76,32],[68,32],[62,28],[54,26],[50,23]],
      [[76,28],[78,17],[84,12],[92,12],[97,17],[103,16],[107,24],[105,35],[99,39],[96,46],[90,50],[82,46],[80,40]]
    ];
    crowns.forEach((p, i) => {
      const m = new Set(), cx = [23,44,67,91][i], cy=[30,22,18,32][i];
      poly(c,p,leaf[i===3?1:2],m);
      poly(c,[[cx-12,cy],[cx-9,cy-7],[cx-3,cy-10],[cx+3,cy-11],[cx+10,cy-8],[cx+11,cy-3],[cx+4,cy],[cx+2,cy+4],[cx-6,cy+3],[cx-9,cy+5]],leaf[i===3?3:4]);
      line(c,[[cx-10,cy-3],[cx-7,cy-7],[cx-2,cy-8],[cx+1,cy-8],[cx+4,cy-10]],leaf[5],2);
      line(c,[[cx-5,cy],[cx-1,cy-3],[cx+4,cy-3],[cx+9,cy-5]],leaf[5]);
      flecks(c,m,[leaf[1],leaf[3],leaf[4],leaf[5]],random,cx-14,cx+16,cy-14,cy+16,43);
    });
    // Carved eyebrows, eyes and nose; small pixel highlights sit under each bevel.
    poly(c,[[33,48],[40,43],[48,44],[51,47],[51,51],[44,49],[37,50],[33,53]],wood[2]);
    poly(c,[[60,47],[66,43],[75,44],[81,48],[80,52],[74,49],[67,48],[62,51]],wood[2]);
    line(c,[[35,47],[41,44],[47,45],[50,47]],wood[6],2);
    line(c,[[61,47],[66,44],[73,45],[79,47]],wood[5],2);
    poly(c,[[36,53],[41,51],[48,52],[49,54],[47,56],[41,56],[37,55]],wood[1]);
    poly(c,[[63,52],[69,51],[76,52],[78,54],[75,56],[66,56],[63,55]],wood[1]);
    line(c,[[40,55],[44,55],[47,54]],wood[6]);
    line(c,[[66,54],[71,55],[75,54]],wood[6]);
    poly(c,[[53,48],[58,49],[58,54],[62,61],[61,66],[54,67],[50,63],[49,59]],wood[2]);
    poly(c,[[54,49],[57,50],[57,56],[59,60],[58,64],[54,64],[52,62],[51,60]],wood[6]);
    line(c,[[40,58],[44,59],[47,60]],wood[5]);
    line(c,[[67,60],[73,58]],wood[5]);
    // Roots still meet the anchor plane; the sprite never suspends a detached crown.
    for (const [x,y,v] of [[11,109,0],[20,107,1],[29,105,0],[89,107,1],[99,109,0]]) tuft(c,x,y,v);
    const arch=[[37,112],[37,96],[39,86],[43,80],[48,76],[54,74],[61,75],[68,79],[73,87],[76,99],[76,112]];
    poly(c,arch,wood[1]);
    poly(c,[[39,111],[39,98],[41,88],[44,82],[49,78],[55,76],[61,77],[67,81],[72,89],[74,102],[74,112]],wood[6]);
    poly(c,[[43,111],[43,95],[45,88],[49,82],[54,79],[60,79],[65,82],[69,89],[71,97],[71,112]],wood[2]);
    poly(c,[[46,111],[46,96],[48,89],[51,85],[55,82],[59,82],[64,86],[67,93],[67,111]],open?'#1c2d24':'#2a261e');
    if(open){
      poly(c,[[48,111],[48,99],[49,95],[53,91],[57,90],[62,92],[65,98],[65,111]],'#263c2b');
      poly(c,[[47,111],[49,107],[52,105],[62,105],[66,111]],'#6c6141');
      line(c,[[50,110],[52,108],[62,108],[64,110]],'#a3905d');
      rect(c,50,97,2,2,glow[1]);rect(c,62,95,1,2,glow[2]);rect(c,54,101,1,1,'#788751');
      lamp(c,40,94);lamp(c,73,94,1);
    }else{
      rect(c,48,96,18,14,wood[3]);rect(c,48,98,18,2,wood[5]);rect(c,48,105,18,2,wood[5]);
      for(const x of [51,55,59,63]) rect(c,x,97,1,13,wood[2]);
      rect(c,55,102,4,3,wood[1]);rect(c,56,102,2,2,wood[6]);
    }
    rect(c,43,111,28,2,wood[5]);rect(c,48,112,18,2,wood[6]);
    line(c,[[42,83],[46,80],[51,76],[59,75],[66,79]],wood[7]);
  }

  function tree(c, v, random) {
    const tone = [
      [leaf[1],leaf[2],leaf[3],leaf[4],leaf[5]],
      ['#243f32','#34563b','#496a45','#61804c','#889755'],
      ['#334533','#40543a','#5b6740','#777b44','#a29954'],
      ['#203128','#2d4434','#405e40','#577447','#758e53']
    ][v];
    const silhouette = [
      [[0,27],[2,21],[1,16],[3,11],[7,9],[8,5],[12,2],[19,1],[23,4],[24,7],[28,9],[30,15],[29,19],[31,24],[28,29],[22,31],[12,32],[4,31]],
      [[1,26],[4,20],[1,16],[2,10],[7,8],[10,6],[13,2],[19,0],[22,4],[27,5],[28,10],[31,14],[30,20],[31,23],[29,29],[23,31],[14,32],[7,31],[2,29]],
      [[0,26],[1,20],[4,17],[4,12],[8,9],[10,4],[15,3],[18,0],[23,3],[24,8],[30,12],[31,16],[29,20],[31,24],[27,31],[19,32],[11,31],[5,32]],
      [[0,25],[4,21],[3,17],[7,14],[6,11],[10,9],[10,6],[14,4],[16,0],[20,5],[24,6],[24,10],[28,13],[27,16],[31,20],[29,24],[31,27],[24,32],[18,31],[11,33],[4,32]]
    ][v];
    const mask=new Set();
    poly(c,[[7,42],[11,39],[12,31],[10,25],[15,25],[18,30],[21,25],[24,24],[23,29],[20,33],[21,39],[25,41],[25,43],[20,43],[19,44],[12,44],[10,43],[7,43]],wood[0]);
    poly(c,[[8,42],[12,39],[14,31],[13,29],[18,28],[18,33],[20,38],[24,42],[20,42],[18,43],[12,43]],wood[4]);
    line(c,[[10,42],[13,41],[15,36],[15,31]],wood[6]);line(c,[[18,32],[18,37],[19,41],[21,42]],wood[2]);
    poly(c,silhouette,tone[0],mask);
    poly(c,[[3,24],[6,21],[7,16],[11,14],[12,8],[18,4],[21,7],[25,9],[27,14],[25,18],[29,23],[26,27],[21,29],[10,30],[5,28]],tone[1]);
    poly(c,[[5,16],[8,12],[12,11],[12,7],[16,5],[19,4],[21,7],[21,10],[26,13],[23,18],[17,20],[17,24],[10,25],[7,24],[7,20]],tone[2]);
    poly(c,[[8,15],[11,13],[14,13],[15,9],[17,7],[20,8],[19,12],[22,14],[20,16],[14,16],[12,19],[9,20],[7,18]],tone[3]);
    line(c,[[11,14],[14,14],[15,12],[16,9]],tone[4],1);
    line(c,[[9,22],[12,23],[16,21]],tone[3]);
    line(c,[[19,25],[23,24],[25,21]],tone[2],2);
    line(c,[[22,14],[24,16],[23,18]],tone[4],1);
    flecks(c,mask,[tone[0],tone[2],tone[3],tone[4]],random,2,31,9,31,34);
    tuft(c,12,43,v===2);
  }
  function rock(c, v, random) {
    const rockMask=new Set();
    poly(c,[[0,14],[3,8],[7,2],[13,1],[17,2],[23,7],[25,11],[25,16],[20,18],[5,18],[1,16]],stone[0],rockMask);
    poly(c,[[1,14],[4,8],[8,3],[14,2],[18,3],[22,8],[24,12],[23,15],[19,16],[15,16],[13,17],[5,17]],stone[3]);
    poly(c,[[4,9],[8,4],[13,3],[18,4],[20,6],[19,9],[12,10],[8,11],[4,11]],stone[4]);
    poly(c,[[4,12],[10,12],[13,11],[19,10],[22,8],[24,12],[23,15],[19,16],[15,16],[13,17],[5,17]],stone[2]);
    line(c,[[6,9],[9,6],[13,5],[16,5],[18,6]],stone[5]);
    line(c,[[7,13],[11,13],[16,11],[19,11],[22,9]],stone[1]);
    flecks(c,rockMask,[stone[2],stone[3],stone[4]],random,3,23,6,16,17);
    if(v%3===0){line(c,[[16,15],[18,15],[22,13]],leaf[4],2);rect(c,22,12,2,1,leaf[5]);}
    if(v%3===1){rect(c,3,15,4,2,leaf[3]);rect(c,5,14,2,1,leaf[4]);}
  }
  function plant(c,v) {
    tuft(c,7,15,v%2===0);tuft(c,9,14,v%2===1);
    const petals=[['#f7da7c','#e9a960'],['#ddae8c','#ac7473'],['#8ec4a5','#65a78a'],['#eae4a9','#c3af62']][v%4];
    line(c,[[7,14],[7,8],[8,6],[8,4]],leaf[4]);
    for(const [x,y] of [[8,3],[6,2],[10,2],[8,0],[4,7],[10,9]])rect(c,x,y,2,1,petals[0]);
    rect(c,8,2,1,1,petals[1]);rect(c,7,3,1,1,petals[0]);
    if(v%2){rect(c,3,6,1,2,petals[0]);rect(c,11,8,1,2,petals[1]);}
  }
  function lantern(c,v) {
    rect(c,2,24,8,1,wood[2]);rect(c,1,25,10,1,wood[1]);
    rect(c,3,8,3,16,wood[2]);rect(c,4,7,1,16,wood[6]);
    rect(c,3,3,3,7,wood[3]);rect(c,4,3,5,2,wood[5]);rect(c,6,2,3,2,wood[2]);
    lamp(c,7,3,v%2);
  }
  function shrine(c) {
    poly(c,[[1,26],[6,23],[10,22],[11,20],[23,20],[25,22],[29,23],[33,26],[33,30],[28,32],[6,32],[1,30]],stone[0]);
    poly(c,[[3,26],[8,24],[13,22],[21,22],[27,24],[31,26],[28,28],[23,29],[11,29],[6,28]],stone[4]);
    rect(c,7,28,20,2,stone[2]);rect(c,11,26,12,1,stone[5]);
    poly(c,[[10,24],[11,15],[14,12],[20,12],[23,16],[24,24],[21,26],[13,26]],stone[1]);
    poly(c,[[12,23],[13,16],[16,13],[20,14],[22,18],[22,24],[19,25],[14,25]],stone[4]);
    poly(c,[[13,15],[14,11],[17,8],[20,11],[21,15],[17,17]],leaf[1]);
    poly(c,[[14,13],[17,9],[20,13],[17,16]],'#a9cca1');
    poly(c,[[15,13],[17,10],[17,15]],'#ebefb1');
    line(c,[[13,19],[15,20],[19,20],[22,19]],leaf[2]);
    line(c,[[3,28],[7,29],[12,30]],stone[5]);line(c,[[25,29],[30,28]],stone[3]);
    tuft(c,8,27);tuft(c,25,27);
  }
  function root(c,v,random){
    const mirrored=!!(v%2);
    const m=p=>mirrored?p.map(([x,y])=>[32-x,y]):p;
    const bark=new Set();
    poly(c,m([[1,0],[13,0],[15,8],[14,15],[17,22],[17,29],[21,35],[30,39],[32,43],[22,43],[14,41],[12,43],[4,44],[0,42],[0,30],[5,23],[3,13]]),wood[0],bark);
    poly(c,m([[3,0],[10,0],[12,8],[10,15],[12,21],[11,28],[17,37],[25,41],[15,40],[11,37],[7,41],[1,42],[2,31],[7,24],[5,14]]),wood[3]);
    poly(c,m([[6,0],[8,0],[10,8],[8,15],[10,23],[8,30],[10,34],[8,39],[5,39],[5,32],[7,25],[6,15]]),wood[4]);
    line(c,m([[7,2],[9,8],[7,14],[9,20],[8,27],[6,34]]),wood[5]);
    line(c,m([[11,17],[13,24],[13,32],[18,39]]),wood[2],2);
    line(c,m([[1,39],[3,34],[4,28]]),wood[4]);
    flecks(c,bark,[wood[2],wood[3],wood[4]],random,1,31,1,41,48,true);
    const fx=mirrored?26:6;
    rect(c,fx,30,1,4,leaf[4]);rect(c,fx,31,2,1,leaf[5]);rect(c,fx-2,33,3,1,leaf[3]);
  }
  function fungus(c,v) {
    const cap=[
      ['#4c4251','#70556b','#a57780','#d9a28d'],['#3d554b','#4e7f67','#80a779','#aacb88'],
      ['#553d2b','#8c593b','#c88956','#edb579']
    ][v%3];
    for(const [x,y,h] of [[6,7,6],[14,3,8],[17,9,5]]){
      rect(c,x-1,y+3,3,h,wood[2]);rect(c,x,y+3,1,h,wood[6]);
      poly(c,[[x-5,y+4],[x-4,y+1],[x-2,y-1],[x+2,y-1],[x+4,y+1],[x+5,y+4],[x+3,y+5],[x-3,y+5]],cap[0]);
      poly(c,[[x-4,y+3],[x-2,y],[x+2,y],[x+4,y+3],[x+2,y+4],[x-3,y+4]],cap[2]);
      rect(c,x-2,y+1,3,1,cap[3]);rect(c,x+2,y+2,1,1,cap[3]);
      rect(c,x-3,y+4,6,1,cap[1]);
    }
  }
  function wall(c,v,random) {
    const ys=[5+(v%3),4,3+(v%2),6,4+((v+1)%3),5,7,5];
    const cap=[[0,6]];
    ys.forEach((h,i)=>{cap.push([i*6,h],[(i+1)*6,h]);});
    cap.push([48,25],[0,25]);
    const mask=new Set();
    poly(c,cap,stone[1],mask);
    rect(c,0,10,48,14,stone[2]);
    // Long stone courses are split in offset runs, not triangular facets.
    for(let row=0;row<4;row++){
      const height=12+3*row;
      for(let x=-7+(row*4)%9;x<48;x+=8){
        const width=5+Math.floor(random()*3);
        rect(c,x,height,width,2,row%2?stone[3]:stone[2]);
        if(x>=0&&x+width<49&&random()>.18)rect(c,x+1,height,width-1,1,stone[4]);
        rect(c,x,height+2,width,1,stone[1]);
      }
    }
    flecks(c,mask,[stone[2],stone[3],stone[4]],random,0,48,10,24,35);
    ys.forEach((h,i)=>{
      const x=i*6;
      rect(c,x,h,6,3,leaf[4]);rect(c,x,h,6,1,leaf[6]);rect(c,x,h+2,6,2,leaf[3]);
      rect(c,x,h+4,6,1,leaf[2]); if(i%3!==1){rect(c,x+2,h+3,2,3,leaf[3]);rect(c,x+2,h+3,1,2,leaf[5]);}
    });
    rect(c,0,24,48,1,stone[0]);
  }
  function customCanvas(w,h){
    const canvas=document.createElement('canvas');
    canvas.width=w;canvas.height=h;return canvas;
  }
  function paint(kind,variant=0,canvasFactory=customCanvas){
    const dims=sizes[kind];
    if(!dims)throw new RangeError('Unknown Kokiri pixel sprite: '+kind);
    const [w,h]=dims, canvas=canvasFactory(w,h);
    if(canvas.width!==w)canvas.width=w;
    if(canvas.height!==h)canvas.height=h;
    const c=canvas.getContext('2d');
    c.imageSmoothingEnabled=false;c.clearRect(0,0,w,h);
    const number=Number(variant);
    const v=(Number.isFinite(number)?Math.abs(Math.trunc(number)):0)%(variants[kind]||1),random=seed(14749+v*56171+w*h*193);
    switch(kind){
      case 'home': home(c,v%5,random);break;
      case 'deku': deku(c,false,random);break;
      case 'deku-open': deku(c,true,random);break;
      case 'tree': tree(c,v%4,random);break;
      case 'rock': rock(c,v,random);break;
      case 'plant': plant(c,v);break;
      case 'lantern': lantern(c,v);break;
      case 'shrine': shrine(c);break;
      case 'root': root(c,v,random);break;
      case 'fungus': fungus(c,v);break;
      case 'wall': wall(c,v,random);break;
    }
    return canvas;
  }
  return Object.freeze({sizes,paint});
});
