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
 const history=[{version:'1.1.0',date:'2026-10-26',changes:['編成・個体編集と性格・サブスキル選択を改善','睡眠リサーチの記録済み表示・編集・下書きを整理し、スクショ入力を継続']},{version:'1.0.1',date:'2026-10-26',changes:['睡眠リサーチ履歴の削除機能を追加']},{version:'0.2.8',date:'2026-10-24',changes:['第40回グッドスリープデーを追加し、日別・特別ピックアップと満月の日の表示に対応']},{version:'0.2.7',date:'2026-10-24',changes:['週ごとのフィールド履歴と日付・時刻を指定した移動記録に対応','スキルのイベント補正で記録日時の確定フィールドを参照し、過去の取得数量を保持']},{version:'0.2.6',date:'2026-10-24',changes:['設定にイベントカレンダーを追加し、ピックアップ管理とイベント補正を整理','サブタブ・内訳ボタンと個体編集の配置・戻り先を調整']},{version:'0.2.5',date:'2026-10-24',changes:['CSVバックアップのアプリ内通知と日時付きファイル名を追加','スキルLvの選択・チームからの編集とその他の入力／子設定を整理']},{version:'0.2.4',date:'2026-10-24',changes:['睡眠の寝顔候補・ピックアップ順と履歴のかけら合計表示を修正','記録内訳の表示ボタンと画像の数量表示を調整']},{version:'0.2.3',date:'2026-10-24',changes:['ミュウのコピー時に通常と共通のアメ個数データを使用','入力欄のプレースホルダーと横並び配置を調整']},{version:'0.2.2',date:'2026-10-24',changes:['ピックアップのフィールド選択と登録フォーム・検索を修正','コピー効果の適用Lvと並べ替え・その他の記録UIを調整']},{version:'0.2.1',date:'2026-10-24',changes:['ミュウのスキルコピーによる追加アメとゆめのかけらの同時記録に対応']},{version:'0.2.0',date:'2026-10-24',changes:['記録の表示設定と行動別の集計設定を整理','ハロウィン2026のピックアップと睡眠アメ倍率に対応','文字入力のクリア操作と更新のお知らせを追加']},{version:'0.1.0',date:'2026-10-19',changes:['集計画像の個別・タブ単位・2タブ一括出力に対応','登録済みポケモンの用途別見出しと登録方法の順序を整理','固定数のゆめのかけらを記録ボタンに表示','バージョン表示と更新履歴を追加']}];
 function init(){
  const current=history[0],b=document.getElementById('app-version'),open=()=>AppPanels.open('更新履歴',body=>{for(const entry of history){const section=el('section',undefined,'release-entry'),h=el('h3','v'+entry.version),date=el('time',entry.date);date.dateTime=entry.date;const list=el('ul');for(const change of entry.changes)list.append(el('li',change));section.append(h,date,list);body.append(section);}});
  // 開発版の表示名と、保持する開発中の更新履歴を分離する。
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
