/* ユーザー提供の通常・特別報酬候補値を整理。候補値と寝顔の存在確認は別管理。記事本文・画像・出現DBは同梱しない。
   確認元 https://wikiwiki.jp/poke_sleep/育成/進化/進化区分
   https://wikiwiki.jp/poke_sleep/寝顔図鑑/寝顔の一覧 (2026-10-20)
   ムウマ・ムウマージの★1～3: https://ns5.serebii.net/pokemonsleep/pokemon/misdreavus.shtml
   https://ns5.serebii.net/pokemonsleep/pokemon/mismagius.shtml
   未確認の★・イベント補正は推測せず手入力。既存candyMapをアメの唯一の参照元とする。 */
(function(root){
 'use strict';
 const groups={
  4:"フシギダネ ヒトカゲ ゼニガメ キャタピー コラッタ アーボ ピチュー ピィ ププリン イーブイ リオル ガーディ コイル ミニリュウ チコリータ ウパー ウパー(パルデア) チルット アチャモ ミズゴロウ コリンク グレッグル ユキカブリ イシズマイ タマザラシ タマザラシ(ホリデー) タマゲタケ アブリー ヌイコグマ ホゲータ カヌチャン デルビル ソーナノ タツベイ チゴラス オンバット サンド ロコン ロコン(アローラ) ディグダ ニャース コダック マンキー マダツボミ イシツブテ ヤドン ドードー ゴース カラカラ イーブイ(ハロウィン) イーブイ(ホリデー) ヒノアラシ ワニノコ トゲピー ネイティ メリープ ヨーギラス キモリ ラルトス ナマケロ ココドラ ゴクリン ナックラー カゲボウズ ナエトル ヒコザル ポッチャマ フワンテ ウソハチ マネネ ピンプク ムンナ ワシボン バケッチャ(ちゅうだま) バケッチャ(こだま) バケッチャ(おおだま) バケッチャ(ギガだま) アゴジムシ エレズン ニャオハ クワッス パモ アルクジラ",
  5:"ピカチュウ ピッピ プリン ソーナンス ピカチュウ(ハロウィン) ピカチュウ(ホリデー) ピカチュウ(キャプテン) トゲチック ウソッキー",
  6:"フシギソウ リザード カメール トランセル ラッタ アーボック バリヤード オコリザル ヤドラン レアコイル ハクリュー ジュプトル ワカシャモ ヌマクロー ヤルキモノ チルタリス フワライド ルクシオ ドクロッグ イワパレス アブリボン キテルグマ ナカヌチャン ガラガラ ヘルガー トドグラー コモルー オンバーン サンドパン ダグトリオ ペルシアン ゴルダック ウツドン ゴローン ドードリオ ゴースト ベイリーフ マグマラシ アリゲイツ ネイティオ モココ ヌオー サナギラス キルリア コドラ マルノーム ビブラーバ ジュペッタ ハヤシガメ モウカザル ポッタイシ ユキノオー モロバレル ウォーグル デンヂムシ ニャローテ アチゲータ ウェルカモ パモット ドオー",
  7:"ガルーラ カイロス メタモン デリバード アブソル イワーク カモネギ ヤミラミ ラッキー ツボツボ ヘラクロス ニューラ ルチャブル デデンネ クチート プラスル マイナン ミカルゲ キュワワー トゲデマル ミミッキュ ジジーロン ウッウ ヤミカラス ムウマ",
  8:"ルカリオ シャワーズ サンダース ブースター エーフィ ブラッキー リーフィア グレイシア ニンフィア キュウコン キュウコン(アローラ) ウインディ ドンカラス ムシャーナ ハガネール ガチゴラス ヤドキング ハピナス マニューラ パンプジン(ちゅうだま) パンプジン(こだま) パンプジン(おおだま) パンプジン(ギガだま) ストリンダー(ハイ) ストリンダー(ロー) ハルクジラ ムウマージ",
  9:"フシギバナ リザードン カメックス バタフリー ライチュウ プクリン ピクシー カイリュー オーダイル ジュカイン バシャーモ ケッキング レントラー マスカーニャ デカヌチャン クワガノン エンペルト トドゼルガ ボーマンダ ウツボット ゴローニャ ゲンガー メガニウム バクフーン デンリュウ バンギラス ラグラージ サーナイト ボスゴドラ フライゴン ドダイトス ゴウカザル ジバコイル トゲキッス エルレイド ラウドボーン ウェーニバル パーモット"
 };
 // Reward candidates and verified sleep-style availability are separate (audit 2026-10-20).
 // https://wikiwiki.jp/poke_sleep/寝顔図鑑/寝顔の一覧
 // Size-specific rewards: https://www.serebii.net/pokemonsleep/pokemon/pumpkaboo.shtml
 // and the corresponding Small/Large/Jumbo Variety and Gourgeist pages.
 const base=Object.fromEntries(Object.entries(groups).flatMap(([amount,species])=>species.split(' ').map(s=>[s,Number(amount)])));
 const specialRewards=Object.fromEntries('ライコウ エンテイ スイクン ラティアス ラティオス クレセリア ミュウツー ミュウ'.split(' ').map(s=>[s,{1:11,2:13,3:16}]));
 specialRewards['ダークライ']={1:11,2:16,3:20};
 // These eight verified size tables deliberately do not inherit a generic form's reward.
 const sizeRewards={"バケッチャ(ちゅうだま)":{"1":4,"2":6,"3":9,"4":10},"バケッチャ(こだま)":{"1":4,"2":6,"3":9,"4":10},"バケッチャ(おおだま)":{"1":4,"2":6,"3":9,"4":10},"バケッチャ(ギガだま)":{"1":4,"2":6,"3":9,"4":10},"パンプジン(ちゅうだま)":{"1":8,"2":10,"3":13,"4":14},"パンプジン(こだま)":{"1":8,"2":10,"3":13,"4":14},"パンプジン(おおだま)":{"1":8,"2":10,"3":13,"4":14},"パンプジン(ギガだま)":{"1":8,"2":10,"3":13,"4":14}};
 // Listed exceptions are manual-only. New species are not enabled merely by a candidate value.
 const excludedStars={"ムウマ":[4],"ムウマージ":[4],"ディグダ":[4],"コイル":[4],"ゴース":[4],"イーブイ(ハロウィン)":[3,4],"イーブイ(ホリデー)":[3,4],"カゲボウズ":[4],"タマザラシ(ホリデー)":[3,4],"フワンテ":[4],"ムンナ":[4],"ピカチュウ(ハロウィン)":[3,4],"ピカチュウ(ホリデー)":[3,4],"ピカチュウ(キャプテン)":[2,3,4],"ダグトリオ":[4],"レアコイル":[4],"ゴースト":[4],"フワライド":[4],"ユキノオー":[4],"イワーク":[4],"ハガネール":[4],"ムシャーナ":[4],"ガチゴラス":[4],"ハルクジラ":[4],"ドダイトス":[4],"ジバコイル":[4],"デカヌチャン":[4]};
 const absentStars={"ゴース":[4],"イーブイ(ハロウィン)":[3,4],"イーブイ(ホリデー)":[3,4],"ピカチュウ(ハロウィン)":[3,4],"ピカチュウ(ホリデー)":[3,4]};
 const verifiedNormalNames="フシギダネ ヒトカゲ ゼニガメ キャタピー コラッタ アーボ サンド ロコン ロコン(アローラ) ディグダ ニャース コダック マンキー ガーディ マダツボミ イシツブテ ヤドン コイル ドードー ゴース カラカラ イーブイ イーブイ(ハロウィン) イーブイ(ホリデー) ミニリュウ チコリータ ヒノアラシ ワニノコ ピチュー ピィ ププリン トゲピー ネイティ メリープ ウパー ウパー(パルデア) デルビル ヨーギラス キモリ アチャモ ミズゴロウ ラルトス ナマケロ ココドラ ゴクリン ナックラー チルット カゲボウズ ソーナノ タマザラシ タマザラシ(ホリデー) タツベイ ナエトル ヒコザル ポッチャマ コリンク フワンテ ウソハチ マネネ ピンプク リオル グレッグル ユキカブリ ムンナ イシズマイ タマゲタケ ワシボン チゴラス バケッチャ(ちゅうだま) バケッチャ(こだま) バケッチャ(おおだま) バケッチャ(ギガだま) オンバット アゴジムシ アブリー ヌイコグマ エレズン ニャオハ ホゲータ クワッス パモ カヌチャン アルクジラ ピカチュウ ピカチュウ(ハロウィン) ピカチュウ(ホリデー) ピカチュウ(キャプテン) ピッピ プリン トゲチック ウソッキー ソーナンス フシギソウ リザード カメール トランセル ラッタ アーボック サンドパン ダグトリオ ペルシアン ゴルダック オコリザル ウツドン ゴローン ヤドラン レアコイル ドードリオ ゴースト ガラガラ バリヤード ハクリュー ベイリーフ マグマラシ アリゲイツ ネイティオ モココ ヌオー ヘルガー サナギラス ジュプトル ワカシャモ ヌマクロー キルリア ヤルキモノ コドラ マルノーム ビブラーバ チルタリス ジュペッタ トドグラー コモルー ハヤシガメ モウカザル ポッタイシ ルクシオ フワライド ドクロッグ ユキノオー イワパレス モロバレル ウォーグル オンバーン デンヂムシ アブリボン キテルグマ ニャローテ アチゲータ ウェルカモ パモット ナカヌチャン ドオー カモネギ イワーク ラッキー ガルーラ カイロス メタモン ヤミカラス ツボツボ ヘラクロス ニューラ デリバード ヤミラミ クチート プラスル マイナン アブソル ミカルゲ ルチャブル デデンネ キュワワー トゲデマル ミミッキュ ジジーロン ウッウ キュウコン キュウコン(アローラ) ウインディ シャワーズ サンダース ブースター エーフィ ブラッキー ヤドキング ハガネール ハピナス ドンカラス ルカリオ マニューラ リーフィア グレイシア ムシャーナ ガチゴラス ニンフィア パンプジン(ちゅうだま) パンプジン(こだま) パンプジン(おおだま) パンプジン(ギガだま) ストリンダー(ハイ) ストリンダー(ロー) ハルクジラ フシギバナ リザードン カメックス バタフリー ライチュウ ピクシー プクリン ウツボット ゴローニャ ゲンガー カイリュー メガニウム バクフーン オーダイル デンリュウ バンギラス ジュカイン バシャーモ ラグラージ サーナイト ケッキング ボスゴドラ フライゴン トドゼルガ ボーマンダ ドダイトス ゴウカザル エンペルト レントラー ジバコイル トゲキッス エルレイド クワガノン マスカーニャ ラウドボーン ウェーニバル パーモット デカヌチャン ムウマ ムウマージ".split(' ');
 const autoStars=Object.fromEntries([...verifiedNormalNames.map(s=>[s,[1,2,3,4].filter(star=>!excludedStars[s]?.includes(star))]),...Object.keys(specialRewards).map(s=>[s,[1,2,3]])]);
 function candidateAmount(species,stars){if(!Number.isInteger(stars)||stars<1||stars>4)return null;if(Object.hasOwn(specialRewards,species))return specialRewards[species][stars]??null;if(Object.hasOwn(sizeRewards,species))return sizeRewards[species][stars]??null;return Object.hasOwn(base,species)?base[species]+[0,2,5,6][stars-1]:null;}
 function rewardStatus(species,stars){if(!Number.isInteger(stars)||stars<1||stars>4)return 'unknown';if(absentStars[species]?.includes(stars))return 'absent';return autoStars[species]?.includes(stars)?'verified':'unknown';}
 // 表示する寝顔の個別例外。確認後に「ポケモン名:[1,2,3,5]」等を追加する。
 // 未指定は従来の★1～4を維持。報酬の確認範囲とは独立して管理する。
 // ユーザー指定（2026-10-22）。表示ルールのみ変更し、報酬表・保存済みの寝顔番号は変更しない。
 const starOverrides=Object.fromEntries('ディグダ ダグトリオ コイル レアコイル ゴース ゴースト イワーク ミュウツー ミュウ ムウマ ハガネール ライコウ エンテイ スイクン カゲボウズ ジュペッタ ラティアス ラティオス ドダイトス フワンテ フワライド ムウマージ ユキノオー クレセリア ダークライ ムンナ ムシャーナ ガチゴラス デカヌチャン ハルクジラ'.split(' ').map(name=>[name,['ミュウツー','ラティアス','ラティオス'].includes(name)?[1,2,3,5]:[1,2,3]]));
 function displayStars(species){const xs=starOverrides[species];return Array.isArray(xs)&&xs.length&&xs.every(n=>Number.isInteger(n)&&n>=1&&n<=5)&&new Set(xs).size===xs.length?[...xs]:[1,2,3,4];}
 function nextStars(species,stars){const xs=displayStars(species).filter(s=>rewardStatus(species,s)!=='absent'),i=xs.indexOf(stars);return xs.length?xs[(i+1)%xs.length]:stars;}

 const fmt=n=>n.toLocaleString('ja-JP');
 const normalize=s=>s.normalize('NFKC').trim().replace(/[\u3041-\u3096]/g,c=>String.fromCharCode(c.charCodeAt(0)+96));
 const isExField=field=>/\s*EX$/.test(field||'');
 function estimate(species,stars,field=''){return isExField(field)?null:autoStars[species]?.includes(stars)?candidateAmount(species,stars):null;}
 function changeStars(entry,stars,multiplier=1,field=''){const basic=estimate(entry.species,stars,field),calculatedAmount=basic===null?null:Math.ceil(basic*multiplier),manual=entry.manualAmount===true||(entry.amount!==''&&(entry.calculatedAmount===null||Number(entry.amount)!==entry.calculatedAmount));return {...entry,stars,calculatedAmount,amount:manual?entry.amount:(calculatedAmount??''),...(manual?{manualAmount:true}:{})};}
 const multipliers=[1,1.5,2,3];
 function candyMultiplier(state,date){
  const stored=state.settings?.sleepCandyMultipliers||{};if(Object.hasOwn(stored,date))return stored[date];
  const own=state.sleepDrafts?.[date+':1']?.candyMultiplier??(state.sleepSessions||[]).find(s=>s.date===date&&s.number===1)?.candyMultiplier;
  if(own!==undefined)return own;
  // Old saved dates retain normal rewards until the user explicitly changes the setting.
  if((state.sleepSessions||[]).some(s=>s.date===date&&s.number===1))return 1;
  const previous=new Date(date+'T12:00:00Z');previous.setUTCDate(previous.getUTCDate()-1);const day=previous.toISOString().slice(0,10);
  return stored[day]??state.sleepDrafts?.[day+':1']?.candyMultiplier??(state.sleepSessions||[]).find(s=>s.date===day&&s.number===1)?.candyMultiplier??1;
 }
 function setCandyMultiplier(state,date,multiplier,map){
  if(!validDate(date)||!multipliers.includes(multiplier))throw Error('アメ獲得量を確認してください。');
  const key=date+':1',cached=state.sleepDrafts?.[key],saved=(state.sleepSessions||[]).find(s=>s.date===date&&s.number===1),draft=cached||saved;
  const sleepDrafts={...(state.sleepDrafts||{})};if(draft)sleepDrafts[key]={...draft,candyMultiplier:multiplier,entries:draft.entries.map(e=>changeStars(e,e.stars,multiplier,draft.field))};
  validateDrafts(sleepDrafts,map);return {...state,settings:{...state.settings,sleepCandyMultipliers:{...(state.settings?.sleepCandyMultipliers||{}),[date]:multiplier}},sleepDrafts};
 }
 function validateMultipliers(state){const values=state.settings?.sleepCandyMultipliers;if(values===undefined)return;if(!values||typeof values!=='object'||Array.isArray(values)||Object.entries(values).some(([d,m])=>!validDate(d)||!multipliers.includes(m)))throw Error('睡眠のアメ倍率設定');}
 const count=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000;
 function validDate(d){if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;const t=new Date(d+'T12:00:00Z');return Number.isFinite(t.getTime())&&t.toISOString().slice(0,10)===d;}
 function validate(sessions,map,legacy=[]){
  if(!Array.isArray(sessions)||sessions.length>100000)throw Error('睡眠記録の形式');const ids=new Set(),slots=new Set(),links=new Set();
  for(const s of sessions){
   if(!s||typeof s.id!=='string'||!s.id||ids.has(s.id)||!validDate(s.date)||![1,2].includes(s.number)||typeof s.field!=='string'||s.field.length>100||!['うとうと','すやすや','ぐっすり','とくちょうなし','特徴なし'].includes(s.sleepType)||typeof s.recordedAt!=='string'||!Number.isFinite(Date.parse(s.recordedAt))||!Array.isArray(s.entries)||s.entries.length>100||!count(s.baseAmount)||!count(s.researchExp)||!count(s.amount)||(s.researchRank!==null&&(!Number.isInteger(s.researchRank)||s.researchRank<1||s.researchRank>70)))throw Error('睡眠記録の内容');
   if(s.candyMultiplier!==undefined&&!multipliers.includes(s.candyMultiplier))throw Error('睡眠のアメ倍率');
   for(const flag of ['candyRecorded','shardsRecorded'])if(s[flag]!==undefined&&typeof s[flag]!=='boolean')throw Error('睡眠の保存項目');
   if(s.legacyResearchId!==undefined&&(typeof s.legacyResearchId!=='string'||links.has(s.legacyResearchId)||!legacy.some(r=>r.id===s.legacyResearchId&&r.method==='research'&&(r.targetDate||day(r.datetime))===s.date)))throw Error('既存睡眠記録との対応');
   if(s.legacyResearchId)links.add(s.legacyResearchId);
   if(s.amount!==s.baseAmount+(s.researchRank===70?s.researchExp:0))throw Error('睡眠のゆめのかけら');
   ids.add(s.id);const key=s.date+':'+s.number;if(slots.has(key))throw Error('同じ睡眠回の重複');slots.add(key);const entries=new Set();
   for(const e of s.entries){if(!e||typeof e.id!=='string'||!e.id||entries.has(e.id)||!Object.hasOwn(map,e.species)||e.candy!==map[e.species]||!Number.isInteger(e.stars)||e.stars<1||e.stars>5||!count(e.amount)||(e.calculatedAmount!==null&&!count(e.calculatedAmount)))throw Error('睡眠のアメ明細');entries.add(e.id);}
   if(!count(s.entries.reduce((n,e)=>n+e.amount,0)))throw Error('睡眠のアメ合計が大きすぎます');
  }
  // 旧記録が既に2回超でも削除しない。追加時の回数制限はsaveで確認する。
  return sessions;
 }
 function validateDrafts(drafts,map){
  if(drafts===undefined)return;if(!drafts||typeof drafts!=='object'||Array.isArray(drafts)||Object.keys(drafts).length>20000)throw Error('睡眠の下書き');
  for(const [key,d] of Object.entries(drafts)){
   if(!d||key!==d.date+':'+d.number||!validDate(d.date)||![1,2].includes(d.number)||typeof d.id!=='string'||typeof d.field!=='string'||d.field.length>100||!['','うとうと','すやすや','ぐっすり','とくちょうなし','特徴なし'].includes(d.sleepType)||!Array.isArray(d.entries)||d.entries.length>100||(d.researchRank!==null&&(!Number.isInteger(d.researchRank)||d.researchRank<1||d.researchRank>70)))throw Error('睡眠の下書き');
   if(d.candyMultiplier!==undefined&&!multipliers.includes(d.candyMultiplier))throw Error('下書きのアメ倍率');
   const value=v=>(typeof v==='string'&&v.length<=30)||(typeof v==='number'&&Number.isFinite(v));if(!value(d.baseAmount)||!value(d.researchExp))throw Error('睡眠の下書き入力');
   for(const e of d.entries)if(!e||typeof e.id!=='string'||!Object.hasOwn(map,e.species)||e.candy!==map[e.species]||!Number.isInteger(e.stars)||e.stars<1||e.stars>5||!value(e.amount)||(e.calculatedAmount!==null&&!count(e.calculatedAmount)))throw Error('睡眠の下書き明細');
  }
 }
 const datetime=s=>new Date(s.date+'T12:00:00+09:00').toISOString();
 function candyRecords(state){return (state.sleepSessions||[]).filter(s=>s.candyRecorded!==false).flatMap(s=>(s.entries.length?s.entries:[{id:'empty',amount:0,species:null,candy:null,stars:null}]).map(e=>({id:'sleep:'+s.id+':'+e.id,datetime:datetime(s),method:'research',amount:e.amount,species:e.species,pokemon:e.species,candy:e.candy,slot:null,sessionId:s.id,stars:e.stars})));}
 function shardRecords(state){return (state.sleepSessions||[]).filter(s=>s.shardsRecorded!==false&&!s.legacyResearchId).map(s=>({id:'sleep:'+s.id,datetime:datetime(s),targetDate:s.date,method:'research',amount:s.amount,baseAmount:s.baseAmount,researchExp:s.researchExp,researchLevel:s.researchRank,researchRank:s.researchRank,sessionId:s.id,recordedAt:s.recordedAt}));}
 const countSessions=rs=>new Set(rs.map(r=>r.sessionId||r.id)).size;
 function save(state,session,map){
  if(session.entries.length&&session.candyRecorded===false)session={...session,candyRecorded:true};
  const other=(state.sleepSessions||[]).filter(s=>s.id!==session.id),remaining=researchRows({...state,sleepSessions:other},session.date).filter(r=>r.record.id!==session.legacyResearchId);
  if(remaining.length>=2)throw Error('この日は睡眠リサーチが2回分あります。既存の記録を編集してください。');
  const next=[...other,session];validate(next,map,state.shardRecords||[]);return {...state,sleepSessions:next};
 }
 // Save only candy. Shard values always come from the saved row, never the other component's draft.
 function saveCandy(state,draft,map,now){
  if(draft.entries.some(e=>e.amount==null||String(e.amount).trim()===''))throw Error('アメ数が未入力です。各ポケモンのアメ数を入力してください。');
  if(isExField(draft.field)&&draft.entries.some(e=>e.manualAmount!==true&&e.calculatedAmount!=null))throw Error('EXのアメ数を確認し、実際の個数を入力してください。');
  const row=researchRows(state,draft.date).find(r=>r.number===draft.number),old=row?.kind==='session'?row.record:row?.sleepSession,legacy=row?.kind==='legacy'?row.record:null;
  const base=old||{},rank=old?old.researchRank:(legacy?legacy.researchLevel:draft.researchRank),values=legacy?{baseAmount:legacy.baseAmount,researchExp:legacy.researchExp,amount:legacy.amount}:old?{baseAmount:old.baseAmount,researchExp:old.researchExp,amount:old.amount}:{baseAmount:0,researchExp:0,amount:0};
  const session={...base,id:old?.id||draft.id,date:draft.date,number:draft.number,field:draft.field,sleepType:draft.sleepType||'とくちょうなし',entries:draft.entries.map(e=>({...e,amount:e.amount===''?NaN:Number(e.amount)})),researchRank:rank??null,...values,recordedAt:old?.recordedAt||now,updatedAt:now,candyRecorded:true,...(draft.candyMultiplier!==undefined?{candyMultiplier:draft.number===1?draft.candyMultiplier:1}:{}),shardsRecorded:legacy?false:(old?old.shardsRecorded!==false:false),...(legacy?{legacyResearchId:legacy.id}:{})};
  const next=save(state,session,map),key=draft.date+':'+draft.number;
  return {...next,sleepDrafts:{...(state.sleepDrafts||{}),[key]:{...draft,id:session.id}},settings:{...state.settings,sleepField:session.field}};
 }
 function day(datetime){const d=new Date(Date.parse(datetime)+5*3600000);return d.toISOString().slice(0,10);}
 const visible=state=>state.settings?.showSleepTab===true;
 // Both inputs address these same saved rows. Legacy rows remain in their original array.
 function researchRows(state,date){
  const sessions=(state.sleepSessions||[]).filter(s=>s.date===date),rows=sessions.filter(s=>!s.legacyResearchId).map(s=>({key:'session:'+s.id,kind:'session',number:s.number,record:s})),used=new Set(sessions.map(r=>r.number));
  const legacy=(state.shardRecords||[]).filter(r=>r.method==='research'&&(r.targetDate||day(r.datetime))===date).slice().sort((a,b)=>Date.parse(a.datetime)-Date.parse(b.datetime));
  for(const r of legacy){const linked=sessions.find(s=>s.legacyResearchId===r.id);let n=linked?.number||1;if(!linked)while(used.has(n))n++;used.add(n);rows.push({key:'legacy:'+r.id,kind:'legacy',number:n,record:r,...(linked?{sleepSession:linked}:{})});}
  return rows.sort((a,b)=>a.number-b.number);
 }
 const researchTotal=(state,date)=>researchRows(state,date).reduce((sum,r)=>sum+(r.kind==='session'&&r.record.shardsRecorded===false?0:r.record.amount),0);
 function getDraft(state,date,number,id){
  const cached=state.sleepDrafts?.[date+':'+number];if(cached)return JSON.parse(JSON.stringify(cached));
  const row=researchRows(state,date).find(r=>r.number===number),saved=row?.kind==='session'?row.record:row?.sleepSession;
  let draft=saved?JSON.parse(JSON.stringify(saved)):{id,date,number,field:(typeof FieldHistory!=='undefined'?FieldHistory:require('./field-history.js')).inherited(state,date).field,sleepType:'',entries:[],baseAmount:'',researchExp:'0',researchRank:Number.isInteger(state.settings?.researchRank)?state.settings.researchRank:null};
  if(row?.kind==='legacy')draft={...draft,legacyResearchId:row.record.id,baseAmount:row.record.baseAmount,researchExp:row.record.researchExp,researchRank:row.record.researchLevel??null};
  else if(saved?.shardsRecorded===false)draft={...draft,baseAmount:'',researchExp:'0'};
  return draft;
 }
 function researchDraft(state,date,number,values,map,id){
  const draft={...getDraft(state,date,number,id),...values},sleepDrafts={...(state.sleepDrafts||{}),[date+':'+number]:draft};validateDrafts(sleepDrafts,map);return {...state,sleepDrafts};
 }
 // Explicit legacy edits/deletions retain attached candy at its original date.
 function replaceLegacy(state,id,replacement){
  const old=(state.shardRecords||[]).find(r=>r.id===id);if(!old)return state;
  if(old.method!=='research')return {...state,shardRecords:replacement?state.shardRecords.map(r=>r.id===id?replacement:r):state.shardRecords.filter(r=>r.id!==id)};
  const date=old.targetDate||day(old.datetime),sameDate=replacement&&(replacement.targetDate||day(replacement.datetime))===date;
  const row=researchRows(state,date).find(r=>r.key==='legacy:'+id),drafts={...(state.sleepDrafts||{})},key=date+':'+row.number;
  const detach=s=>{const next={...s,baseAmount:0,researchExp:0,amount:0,shardsRecorded:false};delete next.legacyResearchId;return next;};
  const sleepSessions=(state.sleepSessions||[]).map(s=>s.legacyResearchId===id&&!sameDate?detach(s):s);
  if(drafts[key]){if(sameDate)drafts[key]={...drafts[key],baseAmount:replacement.baseAmount,researchExp:replacement.researchExp,researchRank:replacement.researchLevel};else{drafts[key]={...drafts[key],baseAmount:'',researchExp:'0'};delete drafts[key].legacyResearchId;}}
  return {...state,shardRecords:replacement?state.shardRecords.map(r=>r.id===id?replacement:r):state.shardRecords.filter(r=>r.id!==id),...(state.sleepSessions?{sleepSessions}:{}),...(state.sleepDrafts?{sleepDrafts:drafts}:{})};
 }
 function updateResearch(state,date,key,values,map,newId,now,field){
  if(!validDate(date)||!count(values.baseAmount)||!count(values.researchExp))throw Error('リサーチ日と個数を確認してください。');
  const rows=researchRows(state,date),row=rows.find(r=>r.key===key);
  const rank=row?(row.kind==='legacy'?row.record.researchLevel:(row.record.shardsRecorded===false?state.settings?.researchRank:row.record.researchRank)):state.settings?.researchRank;
  if((!row||row.kind==='session'&&row.record.shardsRecorded===false)&&(!Number.isInteger(rank)||rank<1||rank>70))throw Error('設定でリサーチランクを設定してください。');
  const amount=values.baseAmount+(rank===70?values.researchExp:0);if(!count(amount))throw Error('獲得数が大きすぎます。');
  if(row?.kind==='legacy'){
   const drafts={...(state.sleepDrafts||{})},key=date+':'+row.number;
   if(drafts[key])drafts[key]={...drafts[key],...values,researchRank:rank};
   return {...state,shardRecords:state.shardRecords.map(r=>r.id===row.record.id?{...r,...values,amount,updatedAt:now}:r),...(state.sleepDrafts?{sleepDrafts:drafts}:{})};
  }
  let session;
  if(row)session={...row.record,...values,...(field!==undefined?{field}:{}),researchRank:rank,amount,shardsRecorded:true,updatedAt:now};
  else{const match=/^new:([12])$/.exec(key),number=match?Number(match[1]):0;if(!number||rows.some(r=>r.number===number))throw Error('編集する睡眠を選び直してください。');const draft=state.sleepDrafts?.[date+':'+number];session={id:draft?.id||newId,date,number,field:field??draft?.field??(typeof FieldHistory!=='undefined'?FieldHistory:require('./field-history.js')).inherited(state,date).field,sleepType:draft?.sleepType||'とくちょうなし',entries:[],recordedAt:now,researchRank:rank,candyRecorded:false,shardsRecorded:true,...values,amount};}
  const next=save(state,session,map),drafts={...(state.sleepDrafts||{})},draftKey=date+':'+session.number;
  // Keep unsaved candy edits while synchronising only the saved shard fields.
  if(drafts[draftKey])drafts[draftKey]={...drafts[draftKey],id:session.id,...values,researchRank:rank};
  return {...next,...(state.sleepDrafts?{sleepDrafts:drafts}:{})};
 }
 // Delete one unified history row, including only its linked legacy shard row and draft.
 function removeResearch(state,date,key){
  const row=researchRows(state,date).find(r=>r.key===key);if(!row)throw Error('削除する睡眠リサーチ履歴が見つかりません。');
  const session=row.kind==='session'?row.record:row.sleepSession,legacyId=row.kind==='legacy'?row.record.id:session.legacyResearchId,drafts={...(state.sleepDrafts||{})};delete drafts[date+':'+row.number];
  return {...state,...(state.sleepSessions?{sleepSessions:state.sleepSessions.filter(s=>s.id!==session?.id)}:{}),...(legacyId?{shardRecords:state.shardRecords.filter(r=>r.id!==legacyId)}:{}),...(state.sleepDrafts?{sleepDrafts:drafts}:{})};
 }
 function initialDate(state,today){const d=new Date(today+'T12:00:00Z');if(state.settings?.sleepMode!=='split')d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10);}
 // Collapse only sleep-screen candidates; saved species keys and encounters remain intact.
 const candidateName=species=>species.replace(/^(バケッチャ|パンプジン)[（(](?:ちゅうだま|こだま|おおだま|ギガだま)(?:しゅ)?[）)]$/,'$1');
 function candidateGroups(names){const groups=new Map();for(const species of names){const key=candidateName(species);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(species);}return [...groups.values()];}
 const api={removeResearch,candidateName,candidateGroups,initialDate,candyMultiplier,setCandyMultiplier,validateMultipliers,visible,researchRows,researchTotal,updateResearch,getDraft,researchDraft,replaceLegacy,base,specialRewards,sizeRewards,autoStars,absentStars,starOverrides,displayStars,rewardStatus,nextStars,candidateAmount,estimate,changeStars,isExField,normalize,validate,validateDrafts,validDate,candyRecords,shardRecords,countSessions,save,saveCandy,datetime,fmt};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.SleepResearch=api;
})(typeof globalThis!=='undefined'?globalThis:this);
