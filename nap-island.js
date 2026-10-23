'use strict';
// Nap Island uses the existing Other candy bucket; source identifies the actual acquisition method.
const NapIsland=(()=>{
 let selected='';
 function build(species,amount,date,id){
  if(!Object.hasOwn(candyMap,species))throw Error('一覧からポケモンを選んでください。');
  if(!Number.isSafeInteger(amount)||amount<1||amount>1000000000)throw Error('アメの個数は1以上の整数で入力してください。');
  if(!Number.isFinite(date.getTime()))throw Error('記録日時を入力してください。');
  return {id,method:'skill',source:'nap_island',datetime:date.toISOString(),species,pokemon:C.speciesName(species),nickname:'',pokemonId:null,slot:null,candy:candyMap[species],amount,context:null};
 }
 function search(){
  const input=$('nap-island-search'),root=$('nap-island-results'),query=normalize(input.value);root.replaceChildren();root.hidden=Boolean(selected)||!query;
  if(root.hidden)return;
  for(const name of names.filter(n=>normalize(n).includes(query)||normalize(C.speciesName(n)).includes(query))){root.append(button(C.speciesName(name),()=>{selected=name;input.value=C.speciesName(name);root.hidden=true;}));}
  if(!root.children.length)root.append(el('p','該当するポケモンがありません。'));
 }
 function render(){$('nap-island-section').hidden=state.settings.showNapIsland!==true;}
 function init(){
  const section=$('nap-island-section'),head=section.querySelector('h2');if(head)head.hidden=true;
  const form=el('form'),label=el('label'),amount=el('input'),save=el('button','記録');form.id='nap-island-shard-form';amount.id='nap-island-shard-amount';amount.placeholder='ゆめのかけら';Object.assign(amount,{type:'number',inputMode:'numeric',min:'1',max:'1000000000',step:'1',required:true});amount.setAttribute('aria-label','おひるね島のゆめのかけらの個数');label.append(amount);save.type='submit';form.append(label,save);section.prepend(form);
  form.onsubmit=e=>{e.preventDefault();try{const n=Number(amount.value);if(!String(amount.value||'').trim()||!Number.isSafeInteger(n)||n<1||n>1000000000)throw Error('ゆめのかけらの個数は1以上の整数で入力してください。');if(ShardUI.saveRecord({method:'other',otherKind:'nap_island',amount:n,memo:''}))amount.value='';}catch(err){notice(err.message,true);}};

  $('show-nap-island').onchange=()=>commit({...state,settings:{...state.settings,showNapIsland:$('show-nap-island').checked}},null);
  $('nap-island-search').oninput=()=>{selected='';search();};
  $('nap-island-form').onsubmit=e=>{e.preventDefault();try{const raw=$('nap-island-amount').value;if(!raw.trim())throw Error('アメの個数を入力してください。');const r=build(selected,Number(raw),recordDate(),uid());if(commit({...state,records:[...state.records,r]},resourceNotice(r)))$('nap-island-amount').value='';}catch(err){notice(err.message,true);}};
 }
 function edit(record){
  const dialog=el('dialog'),form=el('form'),date=el('input'),species=el('select'),amount=el('input');dialog.id='nap-island-editor';dialog.append(form);document.body.append(dialog);
  Object.assign(date,{type:'datetime-local',value:C.localInput(record.datetime),required:true});Object.assign(amount,{type:'number',inputMode:'numeric',min:'1',max:'1000000000',step:'1',value:record.amount,required:true});
  for(const name of names)species.add(new Option(C.speciesName(name),name));species.value=record.species;form.append(el('h2','おひるね島の記録を訂正'));
  for(const [title,input] of [['日時',date],['ポケモン名',species],['アメの個数',amount]]){const label=el('label',title);input.setAttribute('aria-label',title);label.append(input);form.append(label);}
  const error=el('p'),save=el('button','訂正を保存'),cancel=button('閉じる',()=>dialog.close());error.setAttribute('role','alert');save.type='submit';form.append(error,save,cancel);dialog.onclose=()=>dialog.remove();
  form.onsubmit=e=>{e.preventDefault();try{const old=state.records.find(r=>r.id===record.id&&C.isNapRecord(r));if(!old)throw Error('編集する記録が見つかりません。');if(!amount.value.trim())throw Error('アメの個数を入力してください。');const next={...old,...build(species.value,Number(amount.value),date.value===C.localInput(old.datetime)?new Date(old.datetime):C.fromInput(date.value),old.id),updatedAt:new Date().toISOString()};if(commit({...state,records:state.records.map(r=>r.id===old.id?next:r)},'おひるね島の記録を訂正しました。'))dialog.close();}catch(err){error.textContent=err.message;}};
  DateUI.update();dialog.showModal();
 }
 return {init,render,build,edit};
})();
