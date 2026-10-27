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
 const history=[{version:'1.1.0',date:'2026-10-27',changes:['編成・個体編集、睡眠リサーチOCRと記録前操作、ソーシャルリサーチ、設定画面を改善']},{version:'1.0.1',date:'2026-10-26',changes:['睡眠リサーチ履歴の削除機能を追加']},{version:'1.0.0',date:'2026-10-25',changes:['初回公開']}];
 function init(){
  const current=history[0],b=document.getElementById('app-version'),open=()=>AppPanels.open('更新履歴',body=>{for(const entry of history){const section=el('section',undefined,'release-entry'),h=el('h3','v'+entry.version),date=el('time',entry.date);date.dateTime=entry.date;const list=el('ul');for(const change of entry.changes)list.append(el('li',change));section.append(h,date,list);body.append(section);}});
  b.textContent='Ver.1.1.0 TEST';b.onclick=open;
  const historyButton=button('更新履歴',open);historyButton.id='release-history-button';const controls=el('div',undefined,'release-controls');b.before(controls);controls.append(b,historyButton);
  const key=KEY+'-release-seen';let seen;try{seen=localStorage.getItem(key);}catch(_){return;}
  if(current.version==='1.0.0'||seen===current.version)return;
  const banner=el('aside',undefined,'release-banner'),head=el('div',undefined,'section-head');head.append(el('strong','v'+current.version+' の更新'),button('閉じる',()=>{try{localStorage.setItem(key,current.version);banner.remove();}catch(e){notice('お知らせの既読状態を保存できません。',true);}}));const list=el('ul');for(const text of current.changes)list.append(el('li',text));banner.append(head,list);document.querySelector('header').after(banner);
  try{localStorage.setItem(key,current.version);}catch(_){}
 }
 return {init,history};
})();
AppRelease.init();
