const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {Game,REALMS,Terrain,ARENA_LIMIT}=require('../core.js');
const atlas=require('../minimap.js');

function travel(){
  return new Game('link',99,{mode:'adventure',reviewMapClears:true});
}

test('first-run atlas advances from the shrine to the forest doorway and the actual tunnel threshold, then tracks the moving boss',()=>{
  const run=travel();
  assert.equal(atlas.objective(run,Terrain,null),null);
  run.stageKills[run.realm]=run.stageTarget;
  assert.deepEqual(atlas.objective(run,Terrain,null),{x:0,z:-7,glyph:'objective',label:'Advance at the stage shrine'});
  run.realmStages[run.realm]=3;run.stageKills[run.realm]=run.stageTarget;
  Object.assign(run.player,{x:-12,z:-37});
  assert.ok(run.dekuTrailReady);
  const outside=atlas.snapshot(run,Terrain,REALMS,null);
  const next=Terrain.dekuWaypoint(run.player.x,run.player.z);
  assert.deepEqual([outside.target.x,outside.target.z],[next.x,next.z]);
  assert.equal(outside.info.limit,ARENA_LIMIT);
  Object.assign(run.player,{x:Terrain.DEKU_PORTAL.x,z:Terrain.DEKU_PORTAL.z});
  run.progressAdventure(.02);
  assert.ok(run.landmarkApproach);
  const tunnel=atlas.snapshot(run,Terrain,REALMS,null);
  assert.equal(tunnel.landmarks.length,0,'outdoor pins never leak into the interior');
  assert.equal(tunnel.info.limit,Terrain.DEKU_ENTRANCE.limit);
  assert.equal(tunnel.target.z,Terrain.DEKU_ENTRANCE.openingZ);
  assert.equal(atlas.walkable(tunnel.info,10,18),false);
  assert.equal(atlas.walkable(tunnel.info,0,18),true);
  assert.equal(atlas.walkable(tunnel.info,10,1),true);
  run.player.z=Terrain.DEKU_ENTRANCE.openingZ-.1;
  run.progressAdventure(.02);
  assert.ok(run.boss);
  Object.assign(run.boss,{x:13,z:-11});
  const hunt=atlas.snapshot(run,Terrain,REALMS,null);
  assert.deepEqual(hunt.target,{x:13,z:-11,glyph:'boss',label:'Defeat Gohma'});
  assert.notDeepEqual(atlas.projection(outside.info.limit,13,-11),atlas.projection(hunt.info.limit,13,-11),'map reprojects to arena bounds on transition');
  run.boss.dead=true;run.sariaRescue=true;
  assert.equal(atlas.objective(run,Terrain,{sariaRescue:{to:{x:2,z:-5}}}).label,'Meet Saria');
  assert.equal(atlas.objective(run,Terrain,{sariaRescue:{to:{x:2,z:-5}}}).z,-5);
});

test('the expanded realm bounds stay world-fixed while clustered allies and objectives retain visible, anchored icons',()=>{
  const run=travel();run.activateShrine(run.realm);run.enterRealm(Terrain.ZORA_REALM);
  const snap=atlas.snapshot(run,Terrain,REALMS,null),n=atlas.SIZE,m=10;
  assert.equal(snap.info.limit,Terrain.LIMIT);
  assert.deepEqual(atlas.projection(snap.info.limit,-snap.info.limit,-snap.info.limit),[m,m]);
  assert.deepEqual(atlas.projection(snap.info.limit,snap.info.limit,snap.info.limit),[n-m,n-m]);
  assert.deepEqual(atlas.projection(snap.info.limit,0,0),[n*.5,n*.5]);
  assert.deepEqual(snap.landmarks[0],{x:Terrain.ZORA_FOUNTAIN.jabu.x,z:Terrain.ZORA_FOUNTAIN.jabu.z,glyph:'jabu',label:'Lord Jabu-Jabu'});
  assert.equal(snap.allies.length,1);
  const ally=snap.allies[0],px=atlas.projection(snap.info.limit,ally.x,ally.z),from={...snap.player,x:ally.x,z:ally.z};
  const placed=atlas.arrangePins(snap.info.limit,from,[{...ally,glyph:'objective'},ally]);
  assert.equal(new Set(placed.concat({x:px[0],y:px[1]}).map(m=>[m.x,m.y].join())).size,3);
  assert.ok(placed.every(r=>r.u===px[0]&&r.v===px[1]),'stems still have the original coordinate');
  run.realm=0;
  const hyrule=atlas.snapshot(run,Terrain,REALMS,null);
  if(Terrain.SCENIC_STRUCTURES)assert.equal(hyrule.landmarks[0].x,Terrain.SCENIC_STRUCTURES[0].x);
});

function node(){
  const ops=[];
  const ctx={fillRect(x,y,w,h){ops.push([this.fillStyle,x,y,w,h]);},strokeRect(){},fillText(){},drawImage(base){ops.push(['base',base]);}};
  return {ops,attrs:{},dataset:{},setAttribute(k,v){this.attrs[k]=v;},getContext:()=>ctx};
}
test('actual HUD update draws terrain and accessible legend through the browser entry point and caches by world, not camera',()=>{
  const src=fs.readFileSync(require.resolve('../app.js'),'utf8'),html=fs.readFileSync(require.resolve('../index.html'),'utf8');
  assert.ok(html.indexOf('src="minimap.js"')<html.indexOf('src="app.js"'));
  assert.match(html,/id="minimap"[^>]+aria-describedby="minimap-legend"/);
  const scope={game:travel(),window:{BonkMinimap:atlas},Terrain,REALMS,view:{yaw:0}};
  const canvas=node(),symbol=node(),legend={dataset:{},querySelectorAll:()=>[symbol]};
  symbol.dataset.minimapGlyph='player';
  let backgrounds=0;
  canvas.ownerDocument={createElement(){backgrounds++;return node();}};
  const nodes={minimap:canvas,'minimap-legend':legend};scope.$=key=>nodes[key];
  const update=vm.runInNewContext(src.slice(src.indexOf('  function updateMinimap(){'),src.indexOf('  function updateHud(){'))+'\nupdateMinimap',scope);
  update();
  assert.equal(legend.dataset.painted,'true');
  assert.ok(symbol.ops.some(op=>op[0]==='#fff6dc'));
  assert.match(canvas.attrs['aria-label'],/Kokiri Forest\. North up/);
  assert.equal(backgrounds,1);
  const first=canvas.ops.slice();
  scope.view.yaw+=Math.PI/2;update();
  assert.equal(backgrounds,1);
  assert.notDeepEqual(first,canvas.ops.slice(first.length),'camera rotates player arrow, not world');
  scope.game=new Game('link',19,{mode:'survival',realm:Terrain.ZORA_REALM});
  update();
  assert.equal(backgrounds,2);
  assert.match(canvas.attrs['aria-label'],/Zora’s Fountain.*Activate the shrine/);
});
