'use strict';
// Preview/apply share the same validation for upstream CSV/TSV and custom box data.
const IndividualImport=(()=>{
 const M=typeof IndividualImportMaps!=='undefined'?IndividualImportMaps:require('./individual-import-maps.js');
 const headers={species:['ポケモン','Pokemon','Pokémon'],nickname:['ニックネーム','Nickname'],level:['レベル','Level'],skillLevel:['スキルレベル','Skill Level'],nature:['せいかく','性格','Nature'],mainSkill:['メインスキル','Main Skill'],ingredients1:['食材1','Ing 1','Ingredient 1'],ingredients2:['食材2','Ing 2','Ingredient 2'],ingredients3:['食材3','Ing 3','Ingredient 3'],sub0:['Lv10'],sub1:['Lv25'],sub2:['Lv50'],sub3:['Lv70'],sub4:['Lv80'],sleepHours:['一緒に眠った時間','Sleeping Time Shared','Ribbon'],shiny:['色違い','Shiny']};
 const normalize=s=>s.normalize('NFKC').trim().toLowerCase();
 function table(text){
  if(typeof text!=='string'||text.length>5000000)throw Error('5MB以下のCSV・TSVを選んでください。');
  text=text.replace(/^\uFEFF/,'');
  // The exported TSV format is unquoted; CSV uses doubled quotes and may contain line breaks.
  const sep=text.split(/\r?\n/,1)[0].includes('\t')?'\t':',',rows=[];let row=[],field='',quoted=false,closed=false;
  for(let i=0;i<text.length;i++){
   const ch=text[i];
   if(sep===','&&ch==='"'){
    if(quoted&&text[i+1]==='"'){field+='"';i++;}
    else if(quoted){quoted=false;closed=true;}
    else if(!field&&!closed)quoted=true;
    else throw Error('CSVの引用符を読み取れません。元のファイルを書き出し直してください。');
   }else if(!quoted&&(ch===sep||ch==='\n'||ch==='\r')){
    row.push(field);field='';closed=false;
    if(ch!==sep){if(ch==='\r'&&text[i+1]==='\n')i++;if(row.some(v=>v!==''))rows.push(row);row=[];}
   }else{if(closed)throw Error('CSVの引用符の後に不正な文字があります。');field+=ch;}
  }
  if(quoted)throw Error('CSVの引用符が閉じていません。');
  row.push(field);if(row.some(v=>v!==''))rows.push(row);
  if(rows.length<2)throw Error('見出し行と1件以上の個体が必要です。');
  if(rows.length>1001)throw Error('1回の取り込みは1,000件までです。');
  const keys=rows.shift().map(h=>Object.keys(headers).find(k=>headers[k].some(x=>normalize(x)===normalize(h)))||null);
  if(!keys.includes('species'))throw Error('ポケモン列がありません。個体値計算機からCSVまたはTSVで書き出してください(バックアップの復元とは別の機能です)。');
  if(keys.filter(Boolean).some((k,i,a)=>a.indexOf(k)!==i))throw Error('同じ意味の列が重複しています。');
  return rows.map((values,i)=>{if(values.length!==keys.length)throw Error((i+2)+'行目の列数が見出しと異なります。');return {line:i+2,fields:Object.fromEntries(keys.flatMap((k,j)=>k?[[k,values[j]]]:[])),unknown:keys.map((k,j)=>k?null:j).filter(x=>x!==null).map(j=>j+1)};});
 }
 function translated(group,value){return Object.hasOwn(M[group],value)?M[group][value]:value;}
 function preview(text,env){
  const Custom=typeof IndividualCustom!=='undefined'?IndividualCustom:require('./individual-custom.js');
  const clean=text.replace(/^\uFEFF/,'').trim();
  const input=/^(?:ニックネーム|ポケモン|Nickname|Pokemon|Pokémon|レベル|Level|せいかく|性格|Nature|スキルレベル|Skill Level)[,\t]/i.test(clean)||clean.split(/\r?\n/,1)[0].includes('\t')?table(text):(/^[A-Za-z0-9+\-]{12,16}(?:[.@]|$)/.test(clean.split(/\r?\n/,1)[0])?Custom.parse(text):table(text));
  const seen=new Set();return input.map(({line,fields:f,unknown,custom,parseError})=>{
   const warnings=[],errors=[],patch={},info={source:'nitoyon/pokesleep-tool',fields:{...f}};
   const canonical=v=>String(v||'').normalize('NFKC').replace(/\s/g,'').replace(/(こだま|ちゅうだま|おおだま|ギガだま)しゅ/g,'$1');
   const species=env.species.find(s=>canonical(s)===canonical(translated('pokemons',f.species))||canonical(env.speciesName(s))===canonical(translated('pokemons',f.species)));
   if(parseError)errors.push(parseError);if(custom)info.custom=custom;
   if(!species)errors.push('未対応のポケモン：'+f.species);
   if('nickname'in f){if(f.nickname.length>40)errors.push('ニックネームは40文字以内です。');else patch.nickname=f.nickname;}
   function integer(k,min,max){if(!f[k])return;const v=Number(f[k]);if(!/^\d+$/.test(f[k])||!Number.isSafeInteger(v)||v<min||v>max){warnings.push(headers[k][0]+'「'+f[k]+'」は反映できません。');return;}info[k]=v;}
   integer('level',1,100);integer('skillLevel',1,species?env.skillCap(species):8);integer('sleepHours',0,1000000);
   if(f.nature){const v=translated('natures',f.nature);if(!env.natures.includes(v)||species==='ミュウ'&&v!=='きまぐれ')warnings.push('せいかく「'+f.nature+'」は反映できません。');else info.nature=v;}
   info.subskills=Array(5).fill(null);const used=new Set();
   for(let i=0;i<5;i++)if(f['sub'+i]){const v=translated('subskill',f['sub'+i]);if(!env.subskills.includes(v)||used.has(v))warnings.push('Lv'+[10,25,50,70,80][i]+'のサブスキル「'+f['sub'+i]+'」は反映できません。');else{used.add(v);info.subskills[i]=v;}}
   info.ingredients=Array(3).fill(null);for(let i=0;i<3;i++)if(f['ingredients'+(i+1)]){const raw=f['ingredients'+(i+1)],v=translated('ingredients',raw);if(!Object.values(M.ingredients).includes(v))warnings.push('食材'+(i+1)+'「'+raw+'」は未対応のため元の値を保持します。');else info.ingredients[i]=v;}
   if(f.mainSkill){const v=translated('skills',f.mainSkill),skill=env.skillFind(v,species);if(skill)Object.assign(patch,env.skillFields(skill.id));else warnings.push('メインスキル「'+f.mainSkill+'」は反映できません。');}
   if(f.shiny==='0'||f.shiny==='1')info.shiny=f.shiny==='1';else if(f.shiny)warnings.push('色違い「'+f.shiny+'」は反映できません。');
   if(unknown.length)warnings.push('未対応の列：'+unknown.join('・')+'列目(取り込みません)。');
   if(info.level===undefined||info.skillLevel===undefined||!info.nature)warnings.push('レベル・スキルレベル・せいかくが揃わない場合、新規個体の詳細は未設定です。読み取れた値は補足に保持します。');
   const candidates=env.pokemon.filter(p=>p.species===species),key=JSON.stringify([species,patch.nickname||'']),repeated=seen.has(key);seen.add(key);
   const linked=custom?candidates.filter(p=>p.importedIndividual?.custom?.serialized===custom.serialized):[];
   const score=p=>Number(linked.includes(p))*100+Number(!!patch.nickname&&p.nickname===patch.nickname)*10+Number(!!info.nature&&p.profile?.nature===info.nature)*2+info.subskills.filter((v,i)=>v&&v===p.profile?.subskills?.[i]).length;
   if(linked.length)warnings.push('前回取り込んだデータと一致します。個体IDは含まれないため、更新先は確認して選択してください。');
   if(repeated)warnings.push('ファイル内に同じ種類・名前があります。別個体か確認してください。');
   return {line,species,patch,info,warnings,errors,candidates:candidates.sort((a,b)=>score(b)-score(a)).map(p=>p.id),action:errors.length||candidates.length||repeated?'skip':'add'};
  });
 }
 function apply(current,rows,env){
  const pokemon=current.pokemon.slice(),updated=new Set();let order=Math.max(-1,...pokemon.map(p=>p.registrationOrder??-1));let count=0;
  for(const row of rows){
   if(row.action==='skip')continue;
   if(row.errors.length||!row.species)throw Error('読み取れない個体は取り込めません。');
   const add=row.action==='add',old=add?null:current.pokemon.find(p=>p.id===row.action&&p.species===row.species);
   if(!add&&!old)throw Error('更新先を確認してください。');
   if(old&&updated.has(old.id))throw Error('同じ個体を複数行から更新できません。');
   if(add&&row.species==='ミュウ'&&pokemon.some(p=>p.species==='ミュウ'))throw Error('ミュウは1匹だけ登録できます。登録済みの個体を更新してください。');
   const v=row.info,p=old?{...old}:{id:env.uid(),species:row.species,nickname:'',profile:null,registrationOrder:++order};
   Object.assign(p,row.patch);
   const profile={...(p.profile||{}),subskills:p.profile?.subskills?.slice()||['','','','','']};
   for(const k of ['level','nature','skillLevel'])if(v[k]!==undefined)profile[k]=v[k];
   v.subskills.forEach((s,i)=>{if(s!==null)profile.subskills[i]=s;});
   if(env.profileValid(profile,p.species))p.profile=profile;
   else if(p.profile)throw Error('更新後の個体情報が不正です。');
   const saved=p.importedIndividual||{};p.importedIndividual={...saved,...v,fields:{...saved.fields,...v.fields},ingredients:v.ingredients.map((s,i)=>s??saved.ingredients?.[i]??null),subskills:v.subskills.map((s,i)=>s??saved.subskills?.[i]??null)};
   if(add){if(pokemon.some(x=>x.id===p.id))throw Error('個体IDが重複しました。もう一度お試しください。');pokemon.push(p);}else{updated.add(old.id);pokemon[pokemon.findIndex(x=>x.id===old.id)]=p;}count++;
  }
  if(!count)throw Error('取り込む個体を選んでください。');
  return {...current,pokemon};
 }
 return {table,preview,apply};
})();
if(typeof module!=='undefined')module.exports=IndividualImport;
