'use strict';
// 既存キーは保持。親スイッチは子の保存値を変更しない。
const SettingsUI=(()=>{
 const controls=[];
 const oldAggregate={help:[['aggregateCandy','help']],mew:[['aggregateCandy','mew'],['aggregateShards','skill']],delibird:[['aggregateCandy','delibird']],shards:[['aggregateShards','skill']],copy:[['aggregateCandy','skill'],['aggregateShards','skill']],metronome:[['aggregateCandy','skill'],['aggregateShards','skill']],research:[['aggregateCandy','research'],['aggregateShards','research']],nap:[['aggregateCandy','skill'],['aggregateShards','other']],other:[['aggregateCandy','skill'],['aggregateShards','other'],['aggregateShards','cluster']]};
 function row(root,name,key,group,legacy=[],depth=0,id=''){
  const label=el('label',undefined,'setting-row'+(depth?' setting-child':'')),text=el('span',name),control=el('span',undefined,'setting-control'),input=el('input');Object.assign(input,{type:'checkbox',id:id||group+'-'+key});input.setAttribute('role','switch');input.setAttribute('aria-label',name);control.append(input,el('span',undefined,'setting-state'));control.lastChild.setAttribute('aria-hidden','true');label.append(text,control);root.append(label);
  controls.push({input,key,group,legacy});input.onchange=()=>{const settings=clone(state.settings);if(key==='other'||C.otherKeys.includes(key)){const oldGroup=settings[group]||{};settings[group]={...oldGroup};for(const child of C.otherKeys)if(oldGroup[child]===undefined)settings[group][child]=group==='displayActions'?settings[child==='cluster'?'showShardCluster':'showShardOther']!==false:oldGroup.other===true||settings.aggregateShards?.[child==='cluster'?'cluster':'other']!==false;}settings[group]={...settings[group],[key]:input.checked};for(const path of input.checked&&group==='displayActions'&&!['copy','metronome'].includes(key)?legacy:[]){if(path.length===1)settings[path[0]]=input.checked;else settings[path[0]]={...settings[path[0]],[path[1]]:input.checked};}if(!commit({...state,settings},null))sync();};return label;
 }
 function init(){
  const root=$('settings'),old=[...root.children].filter(n=>n.classList.contains('card')&&!['research-rank-settings','data-sources','about-app'].includes(n.id)&&!n.querySelector('#export'));
  const stash=el('div');stash.hidden=true;stash.id='legacy-setting-controls';for(const n of old)stash.append(n);root.append(stash);
  const anchor=$('research-rank-settings');root.insertBefore(anchor,root.children[1]);
  const card=name=>{const n=el('div',undefined,'card');n.append(el('h3',name));anchor.after(n);return n;};
  // Insert in reverse to keep the requested order after research rank.
  const aggregate=card('集計する記録');row(aggregate,'アメ拾い','help','aggregateActions',oldAggregate.help);row(aggregate,'メインスキル','skills','aggregateActions');for(const [key,name] of [['mew','ミュウ'],['delibird','デリバード'],['shards','スキル：ゆめのかけらゲット系'],['copy','スキル：スキルコピー'],['metronome','スキル：ゆびをふる']])row(aggregate,name,key,'aggregateActions',oldAggregate[key],1);for(const [key,name] of [['research','睡眠リサーチ'],['other','その他']])row(aggregate,name,key,'aggregateActions',oldAggregate[key]);
  for(const [key,name] of [['cluster','ゆめのかたまり'],['mission','ミッション'],['achievement','アチーブメント'],['gift','プレゼント']])row(aggregate,name,key,'aggregateActions',[[ 'aggregateShards',key==='cluster'?'cluster':'other']],1);
  const display=card('記録タブ：表示する項目');row(display,'アメ拾い','help','displayActions',[['showCandyHelp']]);row(display,'メインスキル','skills','displayActions');for(const [key,name,legacy] of [['mew','ミュウ','mew'],['delibird','デリバード','delibird'],['shards','スキル：ゆめのかけらゲット系','showShardSkill'],['copy','スキル：スキルコピー',''],['metronome','スキル：ゆびをふる','']])row(display,name,key,'displayActions',legacy?[[legacy]]:[['showOtherCandy'],['showShardSkill']],1);
  display.append($('show-sleep-tab').closest('label'));const mode=$('sleep-mode').closest('label');mode.classList.add('setting-child');display.append(mode,$('sleep-mode-description'));row(display,'その他','other','displayActions');for(const [key,name] of [['cluster','ゆめのかたまり'],['mission','ミッション'],['achievement','アチーブメント'],['gift','プレゼント']])row(display,name,key,'displayActions',[[key==='cluster'?'showShardCluster':'showShardOther']],1);
  const nap=el('div',undefined,'settings-group setting-child');nap.id='nap-island-settings';nap.append(el('h4','おひるね島'));display.append(nap);
  const napDisplay=$('show-nap-island').closest('label');napDisplay.firstElementChild.textContent='入力欄を表示';napDisplay.classList.add('setting-child');nap.append(napDisplay);
  row(nap,'集計する記録','nap','aggregateActions',oldAggregate.nap,1);
  sync();
 }
 function sync(){
  for(const c of controls){const own=state.settings[c.group]?.[c.key],saved=own!==false,old=c.legacy.map(p=>p.length===1?state.settings[p[0]]!==false:state.settings[p[0]]?.[p[1]]!==false);if(c.group==='aggregateActions'&&C.otherKeys.includes(c.key)&&state.settings.aggregateActions?.other===true)old.fill(true);c.input.checked=saved&&(own===true||!old.length||old.some(Boolean));c.input.indeterminate=own===undefined&&saved&&old.some(Boolean)&&old.some(v=>!v);c.input.disabled=c.key!=='skills'&&['mew','delibird','shards','copy','metronome'].includes(c.key)&&state.settings[c.group]?.skills===false||C.otherKeys.includes(c.key)&&state.settings[c.group]?.other===false;}
  $('show-nap-island').disabled=state.settings.displayActions?.other===false;
  $('sleep-mode').disabled=!SleepResearch.visible(state);
 }
 return {init,sync};
})();
SettingsUI.init();
