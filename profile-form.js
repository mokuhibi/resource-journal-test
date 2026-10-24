// 新規登録・個体編集は同じprofile形式と検証を使用します。
const ProfileForm=(()=>{
 const skillCap=p=>SK.copyCap(p)??(SK.shardMode(p)==='lucky'?7:C.skillCap(p.species));
 function skillLevels(id,p,value=$(id).value){const select=$(id),cap=skillCap(p);select.replaceChildren();select.add(new Option('スキルLv.',''));for(let n=1;n<=cap;n++)select.add(new Option('Lv.'+n,String(n)));select.max=String(cap);select.value=value===''?'':String(Math.min(Number(value)||1,cap));}
 function read(prefix,species,optional=false){
  const level=$(prefix+'level').value,nature=$(prefix+'nature').value,skill=$(prefix+'skill').value;
  const subs=Array.from({length:5},(_,i)=>$(prefix==='profile-'?'subskill-'+i:'register-subskill-'+i).value);
  if(optional&&!level&&!skill&&(!nature||species==='ミュウ')&&!subs.some(Boolean))return null;
  const profile={level:level===''?1:Number(level),nature:species==='ミュウ'?'きまぐれ':nature||'未設定',skillLevel:skill===''?1:Number(skill),subskills:subs};
  if(!C.profileValid(profile,species)||profile.skillLevel>Number($(prefix+'skill').max))throw Error('個体情報の値と、サブスキルの重複を確認してください。');
  return profile;
 }
 function refresh(species){const p={species,...SK.fields($('register-main-skill').value)},show=!!species;const root=$('register-details');root.hidden=!show;for(const label of $('register-top-grid')?.children||[])label.hidden=label!==$('pokemon-search').closest('label')&&!show;for(const input of root.querySelectorAll('input,select'))input.disabled=!show;for(const id of ['nickname','register-level','register-skill','register-nature'])$(id).disabled=!show;$('register-nature').disabled=!show||species==='ミュウ';skillLevels('register-skill',p);}
 function reset(species){for(const input of [...$('register-details').querySelectorAll('input,select'),...['register-level','register-skill','register-nature'].map($)]){if(input.type==='checkbox')input.checked=false;else input.value='';} $('register-nature').value=species==='ミュウ'?'きまぐれ':'';refresh(species);}
 function extra(prefix,p){
  const v=p?.importedIndividual||{};
  for(let i=0;i<3;i++)$(prefix+'ingredient-'+i).value=v.ingredients?.[i]||'';
  $(prefix+'sleep-hours').value=v.sleepHours??'';$(prefix+'shiny').checked=v.shiny===true;
 }
 function supplemental(prefix,p){
  if(p)return {...p.importedIndividual,shiny:$(prefix+'shiny').checked};
  const value=$(prefix+'sleep-hours').value;
  if(value!==''&&(!Number.isInteger(Number(value))||Number(value)<0||Number(value)>1000000))throw Error('一緒に眠った時間を確認してください。');
  const v={...p?.importedIndividual,ingredients:Array.from({length:3},(_,i)=>$(prefix+'ingredient-'+i).value),shiny:$(prefix+'shiny').checked};
  if(value!=='')v.sleepHours=Number(value);else delete v.sleepHours;
  return v;
 }
 function layout(prefix){
  const edit=prefix==='profile-',grid=el('div',undefined,'individual-top-grid');grid.id=prefix+'top-grid';
  const ids=edit?['profile-species-select','profile-nickname','profile-main-skill','profile-skill','profile-level','profile-nature']:['pokemon-search','nickname','register-main-skill','register-skill','register-level','register-nature'];
  const titles=['ポケモン名','ニックネーム','メインスキル名','スキルレベル','ポケモンのレベル','性格'];
  for(const [i,id] of ids.entries()){
   const input=$(id),wrap=input.closest('label');for(const node of [...wrap.childNodes])if(node!==input)node.remove();wrap.classList.add('individual-field');wrap.hidden=false;
   input.setAttribute('aria-label',titles[i]);input.title=titles[i];if(input.tagName==='INPUT')input.placeholder=titles[i];else if(input.options[0]?.value==='')input.options[0].textContent=titles[i];
   if(i===4){const hint=el('span','Lv.','individual-field-hint');hint.setAttribute('aria-hidden','true');wrap.append(hint);wrap.classList.add('individual-number-field');}
   grid.append(wrap);if(!edit&&i===0)wrap.append($('pokemon-search-results'));
  }
  if(edit){$('profile-form').prepend(grid);$('profile-species').hidden=true;}else{$('register-panel').insertBefore(grid,$('registration-fields'));$('selected-name').hidden=true;}
  const subs=$(edit?'subskill-fields':'register-subskill-fields');subs.classList.add('individual-subskills');
  for(const [i,label] of [...subs.children].entries()){const select=label.querySelector('select'),title='サブスキル'+[10,25,50,70,80][i];select.setAttribute('aria-label',title);select.title=title;}
 }
 function init(){
  const old=$('profile-skill'),levels=el('select');levels.id=old.id;levels.setAttribute('aria-label','スキルレベル');old.replaceWith(levels);

  const detail=$('profile-details'),ingredients=el('div',undefined,'profile-ingredients');ingredients.hidden=true;
  const choices=[...new Set(Object.values(IndividualImportMaps.ingredients))];
  for(let i=0;i<3;i++){const l=el('label','食材'+(i+1)),input=el('input');input.id='profile-ingredient-'+i;input.setAttribute('list','individual-ingredients');l.append(input);ingredients.append(l);}
  const list=el('datalist');list.id='individual-ingredients';for(const v of choices)list.append(new Option(v,v));document.body.append(list);detail.append(ingredients);
  const hours=el('label','一緒に眠った時間'),h=el('input');h.type='number';h.min='0';h.max='1000000';h.id='profile-sleep-hours';hours.append(h);hours.hidden=true;
  const shiny=el('label','色違い','check'),c=el('input');c.type='checkbox';c.id='profile-shiny';shiny.prepend(c);detail.append(hours,shiny);
  const speciesLabel=el('label','ポケモン名'),select=el('select');select.id='profile-species-select';for(const s of names)select.add(new Option(C.speciesName(s),s));speciesLabel.append(select);$('profile-species').after(speciesLabel);
  select.onchange=()=>{const species=select.value;SkillUI.editProfile({species});$('profile-nature').value=species==='ミュウ'?'きまぐれ':$('profile-nature').value;};
  const source=$('profile-details'),root=source.cloneNode(true);root.id='register-details';for(const input of root.querySelectorAll('[id]'))input.id=input.id.startsWith('subskill-')?'register-'+input.id:input.id.replace('profile-','register-');$('add-pokemon').before(root);$('register-main-skill').addEventListener('change',()=>refresh(selected));layout('profile-');layout('register-');reset('');}
 return {skillCap,skillLevels,read,refresh,reset,init,extra,supplemental};
})();
