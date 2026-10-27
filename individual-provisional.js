'use strict';
const IndividualProvisional=(()=>{
 function patchIndividual(old,patch,map,newId){
  const p=old?{...old}:{id:newId(),species:'',nickname:'',profile:null,provisional:true};
  if(patch.species!==undefined){if(!Object.hasOwn(map,patch.species))throw Error('ポケモンの種類を確認してください。');const changed=p.species!==patch.species;p.species=patch.species;if(changed&&p.species!=='ミュウ'&&patch.mainSkillId===undefined){const SK=typeof MainSkillMaster!=='undefined'?MainSkillMaster:require('./main-skill-master');const key=SK.defaultId(p.species);delete p.mainSkill;delete p.mainSkillId;if(key)Object.assign(p,SK.fields(key));}}
  if(patch.nickname!==undefined)p.nickname=patch.nickname;if(patch.mainSkillId!==undefined){const SK=typeof MainSkillMaster!=='undefined'?MainSkillMaster:require('./main-skill-master');if(!SK.find(patch.mainSkillId)||p.species!=='ミュウ'&&SK.id(patch.mainSkillId)!==SK.defaultId(p.species)||p.species==='ミュウ'&&!SK.mewEntries().some(s=>s.id===SK.id(patch.mainSkillId)))throw Error('メインスキルを確認してください。');Object.assign(p,SK.fields(patch.mainSkillId));}
  if(typeof p.nickname!=='string'||p.nickname.length>40)throw Error('ニックネームは40文字以内にしてください。');const info={...(p.importedIndividual||{})};for(const k of ['level','skillLevel','nature'])if(patch[k]!==undefined)info[k]=patch[k];
  const subs=(p.profile?.subskills||info.subskills||Array(5).fill('')).map(v=>v??'');(patch.subskills||[]).forEach((s,i)=>{if(s!==null&&s!==undefined)subs[i]=s;});info.subskills=subs;
  for(const k of ['level','skillLevel'])if(info[k]!==undefined&&(!Number.isInteger(info[k])||info[k]<1||info[k]>100))throw Error('レベルを確認してください。');
  const SK=typeof MainSkillMaster!=='undefined'?MainSkillMaster:require('./main-skill-master');if(info.skillLevel!==undefined&&info.skillLevel>(SK.copyCap(p)??8))throw Error('スキルLv.の上限を確認してください。');
  if(new Set(subs.filter(Boolean)).size!==subs.filter(Boolean).length)throw Error('サブスキルが重複しています。');
  const profile={...(p.profile||Object.fromEntries(['level','skillLevel','nature'].filter(k=>info[k]!==undefined).map(k=>[k,info[k]]))),subskills:subs};for(const k of ['level','skillLevel','nature'])if(patch[k]!==undefined)profile[k]=patch[k];
  const C=typeof CandyCore!=='undefined'?CandyCore:require('./core');if(p.species&&C.profileValid(profile,p.species)){p.profile=profile;p.provisional=false;}else if(p.profile)throw Error('更新後の個体情報を確認してください。');
  p.importedIndividual=info;return p;
 }
 return {patchIndividual};
})();
if(typeof module!=='undefined')module.exports=IndividualProvisional;
