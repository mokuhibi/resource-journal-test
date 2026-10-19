/* 通常報酬の数値を独自の小さな計算規則に整理。記事本文・画像・出現DBは同梱しない。
   確認元 https://wikiwiki.jp/poke_sleep/育成/進化/進化区分
   https://wikiwiki.jp/poke_sleep/寝顔図鑑/寝顔の一覧 (2026-10-19)
   未確認種・イベントは推測せず手入力。既存candyMapをアメの唯一の参照元とする。 */
(function(root){
 'use strict';
 const groups={
  4:'フシギダネ ヒトカゲ ゼニガメ キャタピー コラッタ アーボ ピチュー ピィ ププリン イーブイ リオル',
  5:'ピカチュウ ピッピ プリン',
  6:'フシギソウ リザード カメール トランセル ラッタ アーボック バリヤード',
  7:'カビゴン ガルーラ カイロス メタモン デリバード アブソル イワーク',
  8:'ルカリオ シャワーズ サンダース ブースター エーフィ ブラッキー リーフィア グレイシア ニンフィア',
  9:'フシギバナ リザードン カメックス バタフリー ライチュウ プクリン ピクシー'
 };
 const base=Object.fromEntries(Object.entries(groups).flatMap(([amount,species])=>species.split(' ').map(s=>[s,Number(amount)])));
 const fmt=n=>n.toLocaleString('ja-JP');
 const normalize=s=>s.normalize('NFKC').trim().replace(/[\u3041-\u3096]/g,c=>String.fromCharCode(c.charCodeAt(0)+96));
 function estimate(species,stars){if(!Number.isInteger(stars)||stars<1||stars>4)return null;return Object.hasOwn(base,species)?base[species]+[0,2,5,6][stars-1]:null;}
 const count=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000;
 function validDate(d){if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;const t=new Date(d+'T12:00:00Z');return Number.isFinite(t.getTime())&&t.toISOString().slice(0,10)===d;}
 function validate(sessions,map,legacy=[]){
  if(!Array.isArray(sessions)||sessions.length>100000)throw Error('睡眠記録の形式');const ids=new Set(),slots=new Set();
  for(const s of sessions){
   if(!s||typeof s.id!=='string'||!s.id||ids.has(s.id)||!validDate(s.date)||![1,2].includes(s.number)||typeof s.field!=='string'||s.field.length>100||!['うとうと','すやすや','ぐっすり','とくちょうなし'].includes(s.sleepType)||typeof s.recordedAt!=='string'||!Number.isFinite(Date.parse(s.recordedAt))||!Array.isArray(s.entries)||s.entries.length>100||!count(s.baseAmount)||!count(s.researchExp)||!count(s.amount)||(s.researchRank!==null&&(!Number.isInteger(s.researchRank)||s.researchRank<1||s.researchRank>70)))throw Error('睡眠記録の内容');
   if(s.amount!==s.baseAmount+(s.researchRank===70?s.researchExp:0))throw Error('睡眠のゆめのかけら');
   ids.add(s.id);const key=s.date+':'+s.number;if(slots.has(key))throw Error('同じ睡眠回の重複');slots.add(key);const entries=new Set();
   for(const e of s.entries){if(!e||typeof e.id!=='string'||!e.id||entries.has(e.id)||!Object.hasOwn(map,e.species)||e.candy!==map[e.species]||!Number.isInteger(e.stars)||e.stars<1||e.stars>4||!count(e.amount)||(e.calculatedAmount!==null&&!count(e.calculatedAmount)))throw Error('睡眠のアメ明細');entries.add(e.id);}
   if(!count(s.entries.reduce((n,e)=>n+e.amount,0)))throw Error('睡眠のアメ合計が大きすぎます');
  }
  // 旧記録が既に2回超でも削除しない。追加時の回数制限はsaveで確認する。
  return sessions;
 }
 function validateDrafts(drafts,map){
  if(drafts===undefined)return;if(!drafts||typeof drafts!=='object'||Array.isArray(drafts)||Object.keys(drafts).length>20000)throw Error('睡眠の下書き');
  for(const [key,d] of Object.entries(drafts)){
   if(!d||key!==d.date+':'+d.number||!validDate(d.date)||![1,2].includes(d.number)||typeof d.id!=='string'||typeof d.field!=='string'||d.field.length>100||!['うとうと','すやすや','ぐっすり','とくちょうなし'].includes(d.sleepType)||!Array.isArray(d.entries)||d.entries.length>100||(d.researchRank!==null&&(!Number.isInteger(d.researchRank)||d.researchRank<1||d.researchRank>70)))throw Error('睡眠の下書き');
   const value=v=>(typeof v==='string'&&v.length<=30)||(typeof v==='number'&&Number.isFinite(v));if(!value(d.baseAmount)||!value(d.researchExp))throw Error('睡眠の下書き入力');
   for(const e of d.entries)if(!e||typeof e.id!=='string'||!Object.hasOwn(map,e.species)||e.candy!==map[e.species]||!Number.isInteger(e.stars)||e.stars<1||e.stars>4||!value(e.amount)||(e.calculatedAmount!==null&&!count(e.calculatedAmount)))throw Error('睡眠の下書き明細');
  }
 }
 const datetime=s=>new Date(s.date+'T12:00:00+09:00').toISOString();
 function candyRecords(state){return (state.sleepSessions||[]).flatMap(s=>(s.entries.length?s.entries:[{id:'empty',amount:0,species:null,candy:null,stars:null}]).map(e=>({id:'sleep:'+s.id+':'+e.id,datetime:datetime(s),method:'research',amount:e.amount,species:e.species,pokemon:e.species,candy:e.candy,slot:null,sessionId:s.id,stars:e.stars})));}
 function shardRecords(state){return (state.sleepSessions||[]).map(s=>({id:'sleep:'+s.id,datetime:datetime(s),targetDate:s.date,method:'research',amount:s.amount,baseAmount:s.baseAmount,researchExp:s.researchExp,researchLevel:s.researchRank,researchRank:s.researchRank,sessionId:s.id,recordedAt:s.recordedAt}));}
 const countSessions=rs=>new Set(rs.map(r=>r.sessionId||r.id)).size;
 function save(state,session,map){
  const sessions=state.sleepSessions||[],other=sessions.filter(s=>s.id!==session.id),legacy=(state.shardRecords||[]).filter(r=>r.method==='research'&&(r.targetDate||day(r.datetime))===session.date);
  if(other.filter(s=>s.date===session.date).length+legacy.length>=2)throw Error('この日は睡眠リサーチが2回分あります。既存の記録を編集してください。');
  const next=[...other,session];validate(next,map);return {...state,sleepSessions:next};
 }
 function day(datetime){const d=new Date(Date.parse(datetime)+5*3600000);return d.toISOString().slice(0,10);}
 const api={base,estimate,normalize,validate,validateDrafts,validDate,candyRecords,shardRecords,countSessions,save,datetime,fmt};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SleepResearch=api;
})(typeof globalThis!=='undefined'?globalThis:this);
