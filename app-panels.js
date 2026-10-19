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
 const history=[{version:'0.1.0',date:'2026-10-19',changes:['集計画像の個別・タブ単位・2タブ一括出力に対応','登録済みポケモンの用途別見出しと登録方法の順序を整理','固定数のゆめのかけらを記録ボタンに表示','バージョン表示と更新履歴を追加']}];
 function init(){const b=document.getElementById('app-version');b.textContent='v'+history[0].version;b.onclick=()=>AppPanels.open('更新履歴',body=>{for(const entry of history){const section=el('section',undefined,'release-entry'),h=el('h3','v'+entry.version),date=el('time',entry.date);date.dateTime=entry.date;const list=el('ul');for(const change of entry.changes)list.append(el('li',change));section.append(h,date,list);body.append(section);}});}
 return {init,history};
})();
AppRelease.init();
