'use strict';
// 閲覧用モーダルを共用。閉じる前の位置とフォーカスを復元する。
const AppPanels=(()=>{
 let dialog,body,heading,opener,scroll=0,css='',after;
 function init(){
  dialog=el('dialog');dialog.id='app-panel';dialog.setAttribute('aria-labelledby','app-panel-title');
  const head=el('div',undefined,'app-panel-head');heading=el('h2');heading.id='app-panel-title';
  const b=button('閉じる',()=>close());head.append(heading,b);body=el('div',undefined,'app-panel-body');dialog.append(head,body);document.body.append(dialog);
  dialog.addEventListener('close',()=>{document.body.style.cssText=css;window.scrollTo(0,scroll);opener?.focus({preventScroll:true});const next=after;after=null;next?.();});
 }
 function open(title,fill){if(!dialog)init();if(dialog.open)return;opener=document.activeElement;scroll=window.scrollY;css=document.body.style.cssText;heading.textContent=title;body.replaceChildren();fill(body);document.body.style.position='fixed';document.body.style.top=-scroll+'px';document.body.style.width='100%';document.body.style.overflow='hidden';try{dialog.showModal();body.scrollTop=0;}catch(e){document.body.style.cssText=css;window.scrollTo(0,scroll);throw e;}}
 function close(next){after=typeof next==='function'?next:null;dialog.close();}
 return {open,close};
})();
// このリリースから番号を付与。確認できない過去のバージョンは掲載しない。
const AppRelease=(()=>{
 const history=[{version:'0.2.0',date:'2026-10-24',changes:['記録の表示設定と行動別の集計設定を整理','ハロウィン2026のピックアップと睡眠アメ倍率に対応','文字入力のクリア操作と更新のお知らせを追加']},{version:'0.1.0',date:'2026-10-19',changes:['集計画像の個別・タブ単位・2タブ一括出力に対応','登録済みポケモンの用途別見出しと登録方法の順序を整理','固定数のゆめのかけらを記録ボタンに表示','バージョン表示と更新履歴を追加']}];
 function init(){
  const current=history[0],b=document.getElementById('app-version'),open=()=>AppPanels.open('更新履歴',body=>{for(const entry of history){const section=el('section',undefined,'release-entry'),h=el('h3','v'+entry.version),date=el('time',entry.date);date.dateTime=entry.date;const list=el('ul');for(const change of entry.changes)list.append(el('li',change));section.append(h,date,list);body.append(section);}});
  b.textContent='v'+current.version;b.onclick=open;
  const historyButton=button('更新履歴',open);historyButton.id='release-history-button';const controls=el('div',undefined,'release-controls');b.before(controls);controls.append(b,historyButton);
  const key=KEY+'-release-seen';let seen;try{seen=localStorage.getItem(key);}catch(_){return;}
  if(current.version==='1.0.0'||seen===current.version)return;
  const banner=el('aside',undefined,'release-banner'),head=el('div',undefined,'section-head');head.append(el('strong','v'+current.version+' の更新'),button('閉じる',()=>{try{localStorage.setItem(key,current.version);banner.remove();}catch(e){notice('お知らせの既読状態を保存できません。',true);}}));const list=el('ul');for(const text of current.changes)list.append(el('li',text));banner.append(head,list);document.querySelector('header').after(banner);
  try{localStorage.setItem(key,current.version);}catch(_){}
 }
 return {init,history};
})();
AppRelease.init();
