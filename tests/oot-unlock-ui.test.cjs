const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {HEROES,REALMS,BOSSES,GUARDIAN_LANDMARKS}=require('../core.js');
const {Profile}=require('../profile.js');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const js=read('app.js'),html=read('index.html');
const node=()=>{
  const attrs={},children=[];
  return {attrs,children,dataset:{},hidden:false,innerHTML:'',
    set textContent(value){this.text=value;if(value==='')children.length=0;},get textContent(){return this.text;},
    setAttribute(name,value){attrs[name]=value;}, addEventListener(){},appendChild(child){children.push(child);}};
};
function setup(){
  const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])),elements={};
  const $=id=>{assert.ok(ids.has(id),id+' is missing from index.html');return elements[id]??=(node());};
  const storage=new Profile();
  let dialog=null;
  const context={$,HEROES,REALMS,BOSSES,GUARDIAN_LANDMARKS,storage,selectedHero:'link',artURL:()=>'',selectHero(){},
    document:{createElement:node},currentDialog:()=>dialog,closeAll(){dialog=null;},openDialog(id){dialog=id;},saveCheckpoint(){},formatTime:()=> '0:04'};
  const rosterStart=js.indexOf('  function renderHeroes()'),resultsStart=js.indexOf('  function showMapClear()');
  const program=js.slice(rosterStart,js.indexOf('  function renderCamp()',rosterStart))
    +js.slice(resultsStart,js.indexOf('  async function chooseMapResult',resultsStart));
  vm.createContext(context);vm.runInContext(program,context);
  return {context,storage,$};
}
test('the OoT roster shows the requirement until a guardian victory unlocks the ally',()=>{
  const {context,storage,$}=setup();
  const saria=()=>$('oot-hero-roster').children.find(card=>card.dataset.rosterHero==='saria');
  context.renderHeroes();
  assert.equal(saria().attrs['aria-disabled'],'true');
  assert.match(saria().innerHTML,/Defeat Gohma inside the Great Deku Tree/);
  storage.recordGuardian('gohma');context.renderHeroes();
  assert.equal(saria().attrs['aria-disabled'],'false');
  assert.match(saria().innerHTML,/Choose hero/);
});
test('results for Gohma display the roster reward alongside the stats',()=>{
  const {context,$}=setup();
  context.game={state:'map-clear',mapResult:{companion:'saria',realm:6,nextRealm:7,nextIsFinal:false,time:4,kills:51,damageDealt:123,damageTaken:45}};
  context.showMapClear();
  assert.equal($('map-clear-recruit').hidden,false);
  assert.match($('map-clear-recruit').textContent,/Saria joined your party/);
  assert.equal($('map-clear-next-name').textContent,'Lake Hylia');
});
