const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const {DEFAULT_BINDINGS}=require('../profile.js');
const {Game}=require('../core.js');
const src=fs.readFileSync(require.resolve('../app.js'),'utf8');
const html=fs.readFileSync(require.resolve('../index.html'),'utf8');
const css=fs.readFileSync(require.resolve('../styles.css'),'utf8');
const chunk=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b,src.indexOf(a)));
function entry(){
  const button={attrs:{'aria-pressed':'false'},setAttribute(k,v){this.attrs[k]=v;},getAttribute(k){return this.attrs[k];}};
  const atlas={classList:new Set()};
  atlas.classList.toggle=(cls,on)=>on?atlas.classList.add(cls):atlas.classList.delete(cls);
  const dom={'map-button':button,'minimap-atlas':atlas};
  const game=new Game('link',4,{mode:'adventure'}),view={distance:29,yaw:1};
  const hooks={};
  const scope={$:id=>dom[id],game,view,keys:new Set(),dialog:null,document:{addEventListener:(event,handler)=>hooks[event]=handler},pendingBinding:null,storage:{bindings:{...DEFAULT_BINDINGS}},Element:class{}};
  scope.currentDialog=()=>scope.dialog;
  vm.runInNewContext([
    chunk('  function setMinimapZoom(', '  function updateMinimap('),
    chunk("  document.addEventListener('keydown',event=>", "  document.addEventListener('keyup'"),
    "this.click=toggleMinimapZoom;"
  ].join('\n'),scope);
  return {scope,game,view,button,atlas,press(code,repeat=false){
    let handled=false; hooks.keydown({code,repeat,preventDefault(){handled=true;}});return handled;
  }};
}
test('the actual gameplay shortcut enlarges and shrinks one map without entering a menu, pausing, or touching the camera',()=>{
  const e=entry();
  assert.equal(DEFAULT_BINDINGS.map,'KeyM');
  e.scope.keys.add(DEFAULT_BINDINGS.up);
  assert.equal(e.press('KeyM'),true);
  assert.equal(e.atlas.classList.has('is-zoomed'),true);
  assert.equal(e.button.getAttribute('aria-pressed'),'true');
  assert.equal(e.press('KeyM',true),false,'holding M does not auto-toggle');
  assert.equal(e.atlas.classList.has('is-zoomed'),true);
  assert.equal(e.game.state,'running');
  assert.equal(e.scope.dialog,null);
  assert.equal(e.scope.keys.has(DEFAULT_BINDINGS.up),true,'walking continues');
  assert.deepEqual(e.view,{distance:29,yaw:1});
  assert.equal(e.press('KeyM'),true);
  assert.equal(e.atlas.classList.has('is-zoomed'),false);
  assert.equal(e.button.getAttribute('aria-pressed'),'false');
});

test('tap uses the same toggle, real dialogs take precedence, and rebinding still works',()=>{
  const e=entry();
  e.scope.click();
  assert.equal(e.button.getAttribute('aria-pressed'),'true');
  e.scope.dialog='pause-dialog';
  e.scope.click();e.press('KeyM');
  assert.equal(e.button.getAttribute('aria-pressed'),'true','modal blocks live atlas changes');
  e.scope.dialog=null;
  e.scope.storage.bindings.map='KeyV';
  assert.equal(e.press('KeyM'),false);
  assert.equal(e.press('KeyV'),true);
  assert.equal(e.button.getAttribute('aria-pressed'),'false');
  assert.match(src,/map-button'\)\.addEventListener\('click',toggleMinimapZoom\)/);
  assert.match(src,/pause-map-button'\)\.addEventListener\('click',openMap\)/);
  assert.match(src,/function setupRun\(run\)\{\s*closeAll\(\);game=run;setMinimapZoom\(false\);/);
  assert.match(html,/id="map-button"[^>]+aria-controls="minimap-atlas" aria-pressed="false"/);
  assert.equal(html.match(/id="minimap"/g).length,1);
  assert.match(css,/\.minimap-atlas\{width:clamp\(108px,19vw,164px\)/);
  assert.match(css,/\.minimap-atlas\.is-zoomed\{width:clamp\(176px,[^;]*328px\)/);
});

test('viewport fit computes size from the unscaled content, reevaluates when checkpoint buttons show, and skips hidden gameplay menu',()=>{
  const values={};
  const menu={clientHeight:524,hidden:false};
  const content={offsetHeight:571,style:{setProperty(key,val){values[key]=+val;}}};
  const fit=vm.runInNewContext(chunk('  function fitTitleMenu(){','  function currentDialog(){')+'\nfitTitleMenu',{$:id=>id==='menu'?menu:content});
  fit();
  assert.equal(values['--menu-fit'],524/571);
  assert.ok(values['--menu-fit']*571<=524);
  content.offsetHeight=640;fit();
  assert.equal(values['--menu-fit'],524/640,'extra Continue controls fit too');
  menu.clientHeight=740;fit();
  assert.equal(values['--menu-fit'],1);
  menu.hidden=true;menu.clientHeight=400;fit();
  assert.equal(values['--menu-fit'],1);
  assert.match(css,/\.menu\{top:max\(64px,[^}]+overflow:clip\}/);
  assert.doesNotMatch(css,/\.menu\{[^}]+overflow-y:auto/);
  assert.match(css,/\.menu-content\{[^}]+translateY\(-50%\) scale\(var\(--menu-fit,1\)\)/);
  assert.match(src,/titleMenuResize\.observe\(\$\('menu'\)\);titleMenuResize\.observe\(\$\('menu-content'\)\)/);
  assert.match(src,/renderer\.setSize\(innerWidth,innerHeight,false\)/);
  assert.match(html,/id="menu" class="menu"><div id="menu-content"/);
});
