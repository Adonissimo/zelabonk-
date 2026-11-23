const{test}=require('node:test'),assert=require('node:assert/strict');const{Game,Terrain,REALMS}=require('../core.js');
test('all map levels share deterministic finite terrain with clear spawn and trail positions',()=>{
 for(let realm=0;realm<REALMS.length;realm++)for(const stage of[1,2,3]){const layout=Terrain.layout(realm,stage);assert.ok(layout.terraces.length>=1);assert.equal(Terrain.layout(realm,stage),layout);assert.equal(Terrain.height(realm,stage,0,0),0);for(const trail of Terrain.SCENIC_TRAILS)assert.equal(Terrain.height(realm,stage,trail.x,trail.z),0);for(let x=-64;x<=64;x+=4)for(let z=-64;z<=64;z+=4)assert.ok(Number.isFinite(Terrain.height(realm,stage,x,z)));}
});
test('terrain samples use the same triangles as the rendered grid',()=>{
 for(let x=-54;x<54;x+=6)for(let z=-54;z<54;z+=6){const a=Terrain.height(6,2,x,z),b=Terrain.height(6,2,x+2,z),c=Terrain.height(6,2,x,z+2),mid=Terrain.height(6,2,x+.5,z+.5);assert.ok(Math.abs(mid-(a+(b-a)*.25+(c-a)*.25))<1e-9);}
});
test('physical scenery blocks walking but permits clearing low obstacles in the air',()=>{
 const realm=6,stage=1,rock=Terrain.layout(realm,stage).obstacles.find(o=>o.kind==='rock');assert.ok(rock);const from={x:rock.x-rock.radius-1.1,z:rock.z},landed=Terrain.resolve(realm,stage,from.x,from.z,rock.x,rock.z,0,.52);assert.ok(Math.hypot(landed.x-rock.x,landed.z-rock.z)>=rock.radius+.51);const airborne=Terrain.resolve(realm,stage,from.x,from.z,rock.x,rock.z,4,.52);assert.ok(Math.hypot(airborne.x-rock.x,airborne.z-rock.z)<.1);
});
test('the three trail routes remain walkable on every map and level',()=>{
 for(let realm=0;realm<REALMS.length;realm++)for(const stage of[1,2,3])for(const trail of Terrain.SCENIC_TRAILS){let x=0,z=0,ground=0,jump=0;const length=Math.hypot(trail.x,trail.z),dx=trail.x/length*.12,dz=trail.z/length*.12;for(let step=0;step<Math.ceil(length/.12);step++){const next=Terrain.resolve(realm,stage,x,z,x+dx,z+dz,jump);jump=Math.max(0,jump+ground-next.ground);x=next.x;z=next.z;ground=next.ground;}assert.ok(Math.hypot(x-trail.x,z-trail.z)<.3,realm+':'+stage);}
});
test('world simulation preserves height above the terrain when moving off a ledge',()=>{
 const g=new Game('link',99,{mode:'adventure'});g.spawnTimer=999;const terrace=Terrain.layout(g.realm,g.stage).terraces[0];g.player.x=terrace.x;g.player.z=terrace.z;g.player.ground=g.groundAt(terrace.x,terrace.z);g.player.invincible=999;for(let i=0;i<200;i++){g.step(.02,{x:1,y:0,cameraYaw:0});assert.ok(g.player.y>=0);assert.equal(g.player.ground,g.groundAt(g.player.x,g.player.z));assert.ok(Number.isFinite(g.player.y+g.player.ground));}
});
