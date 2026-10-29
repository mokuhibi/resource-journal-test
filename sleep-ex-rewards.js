'use strict';
// EX専用。field -> pokemon-data.js の種名 -> 寝顔の星数 -> アメ数。
// 未掲載は未設定(null)。0は明示的な0個として区別する。通常報酬からは補完しない。
// 外部の図鑑番号・寝顔IDは、提供形式を確認してからこの種名・星数へ対応付ける。
const SleepExRewards=(()=>{
 const data=Object.freeze({});
 function amount(field,species,stars,source=data){
  if(typeof field!=='string'||!(/\s*EX$/.test(field))||typeof species!=='string'||!Number.isInteger(stars)||stars<1||stars>5)return null;
  const value=source?.[field.replace(/\s*EX$/,' EX')]?.[species]?.[stars];
  return Number.isSafeInteger(value)&&value>=0?value:null;
 }
 return {data,amount};
})();
if(typeof module!=='undefined')module.exports=SleepExRewards;
