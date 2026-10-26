'use strict';
// 入力の再配置だけを担当。睡眠・かたまり・その他の既存フォームは移動して再利用します。
const SkillActions=(()=>{
 const drafts=new Map();
 const visible=p=>{if(p.provisional)return false;const settings=typeof state==='undefined'?{}:state.settings,key=p.species==='ミュウ'?'mew':p.species==='デリバード'?'delibird':copies(p)?'copy':metronome(p)?'metronome':'shards';return C.actionAllowed(settings,key,'displayActions')&&(!['copy','metronome'].includes(key)||settings.displayActions?.[key]!==undefined||settings.showOtherCandy!==false||settings.showShardSkill!==false);};
 const ownManual=p=>copies(p)||typeof state!=='undefined'&&state.settings.displayActions?.metronome===true;

 const copies=p=>['メタモン','バリヤード','マネネ'].includes(p.species);
 const metronome=p=>p.species!=='ミュウ'&&SK.id(SK.forPokemon(p))==='metronome';
 function copySources(p,team=currentTeam()){
  return team.filter(q=>q&&!q.provisional&&q.id!==p.id&&!copies(q)&&(q.species==='ミュウ'||q.species==='デリバード'||['dream_shard_s','aura_sphere','super_luck','metronome'].includes(SK.id(SK.forPokemon(q)))));
 }
 function capabilities(p,team=currentTeam()){
  if(metronome(p))return {candy:true,shards:true};
  const sources=copySources(p,team),keys=sources.map(q=>SK.id(SK.forPokemon(q)));
  // ミュウの追加アメは通常発動と同じ個数データを使用する。
  return {candy:sources.some(q=>['ミュウ','デリバード'].includes(q.species))||keys.includes('metronome'),shards:keys.some(k=>['dream_shard_s','aura_sphere','super_luck','metronome'].includes(k))};
 }
 const eventSkill=(actor,source=null,date=recordDate())=>typeof EventEffects==='undefined'?{effectiveLevel:Math.min(C.recordProfile(actor).skillLevel,SK.copyCap(source||actor)||C.skillCap(actor.species)),boost:0,bonuses:[]}:EventEffects.skill(actor,EventEffects.recordDay(date),source,undefined,EventEffects.recordField(EventEffects.recordDay(date),date));
 const shardAmounts=(kind,actor,source,date=recordDate())=>C.shardAmounts(kind,eventSkill(actor,source,date).effectiveLevel).map(n=>typeof EventEffects==='undefined'?n:EventEffects.shards(n,actor,C.gameDay(date)).amount);
 const copiedMewAmounts=(actor,source,date=recordDate())=>{const level=eventSkill(actor,source,date).effectiveLevel;if(!Number.isInteger(level)||level<1||level>C.skillCap('ミュウ'))return null;const amounts=C.mewAmounts(level);return Array.isArray(amounts)&&amounts.length&&amounts.every(n=>Number.isSafeInteger(n)&&n>0)?amounts:null;};
 function effect(source){
  const key=SK.id(SK.forPokemon(source));
  return source.species==='ミュウ'?'mew-copy':source.species==='デリバード'?'candy':key==='metronome'?'metronome':key==='super_luck'?'lucky':SK.shardMode(source);
 }
 const numeric=(value,name)=>{const raw=String(value??'').trim().replaceAll(',',''),n=raw===''?0:Number(raw);if(!Number.isSafeInteger(n)||n<0||n>1000000000)throw Error(name+'は0以上の整数で入力してください。');return n;};
 function build(p,data,options={}){
  const team=options.team||currentTeam(),slot=team.findIndex(q=>q?.id===p.id)+1,date=options.date||recordDate(),id=options.id||uid(),actor={...clone(p),profile:clone(C.recordProfile(p))};
  if(!slot||!Number.isFinite(date.getTime()))throw Error('編成と記録日時を確認してください。');
  const candy=numeric(data.candy,'アメ'),shards=numeric(data.shards,'ゆめのかけら'),mew=p.species==='ミュウ',only=data.only===true;
  const source=copies(p)?copySources(p,team).find(q=>q.id===data.sourceId):null,kind=source?effect(source):null;
  if(copies(p)&&!source)throw Error('コピー先を選んでください。');
  const cap=mew?{candy:recordVisible('mew'),shards:SummaryExtras.shardVisible('skill')&&['metronome','dream_shard_s'].includes(SK.id(SK.forPokemon(p)))}:capabilities(p,team);
  if(source){cap.candy=['candy','metronome','mew-copy'].includes(kind);cap.shards=kind==='mew-copy'?['metronome','dream_shard_s'].includes(SK.id(SK.forPokemon(source))):['fixed','random','lucky','metronome'].includes(kind);}
  if(!mew&&!source&&!ownManual(p)){cap.candy=cap.candy&&recordVisible('skill');cap.shards=cap.shards&&SummaryExtras.shardVisible('skill');}
  if(candy&&!cap.candy||shards&&!cap.shards)throw Error('現在の表示設定・編成では記録できない獲得物です。');
  if(only&&(!(metronome(p)||source&&['candy','lucky','metronome'].includes(kind))||candy||shards)||!only&&!candy&&!shards)throw Error('獲得数を入力してください。');
  const legacy=mew&&typeof state!=='undefined'?C.eventFor(state.events,C.gameDay(date),'mew'):{name:'通常',multiplier:1,boost:0},skillEffect=eventSkill(actor,source,date),event={...legacy,boost:Math.max(legacy.boost,skillEffect.boost),...(skillEffect.bonuses.length?{name:[...new Set(skillEffect.bonuses.map(b=>b.name))].join('・')}:{}),...(skillEffect.bonuses.length?{bonuses:skillEffect.bonuses,date:skillEffect.date,field:skillEffect.field}:{})};
  if(kind==='mew-copy'&&copiedMewAmounts(actor,source,date)&&!copiedMewAmounts(actor,source,date).includes(candy))throw Error('適用Lvに対応するアメ個数を選んでください。');
  if(kind==='mew-copy'&&!candy)throw Error('ミュウをコピーした時の実際のアメ個数と獲得先を入力してください。');
  if(mew&&!C.mewAmounts(Math.min(C.skillCap(p.species),actor.profile.skillLevel+event.boost)).includes(candy))throw Error('ミュウのスキルLvに対応するアメ個数を選んでください。');
  if(source&&kind==='candy'&&(candy&&candy!==4||shards))throw Error('プレゼントの獲得数を確認してください。');
  if(source&&['fixed','lucky'].includes(kind)&&!shardAmounts(kind,actor,source,date).includes(shards))throw Error('発動個体のスキルLvに対応する獲得数を選んでください。');
  const target=candy?team[Number(data.target)-1]:null;if(candy&&!target)throw Error('アメの獲得先を選んでください。');
  const outcome=source&&SK.find(SK.forPokemon(source))&&SK.id(SK.forPokemon(source))!=='metronome'?SK.id(SK.forPokemon(source)):String(data.outcome||'');if(outcome&&!SK.find(outcome))throw Error('発動結果を確認してください。');
  const r={id,activationId:id,activationVersion:1,datetime:date.toISOString(),method:mew?'mew':'skill',amount:candy,shardAmount:shards,resourceFlags:{candy:Boolean(candy||only&&cap.candy),shards:Boolean(shards||only&&cap.shards)},outcomeSkillId:outcome,registeredMainSkill:SK.value(SK.forPokemon(p)),mainSkillId:SK.id(SK.forPokemon(p)),recordedSkillLevel:actor.profile.skillLevel,slot:target?Number(data.target):null,pokemonId:target?.id||null,pokemon:target?storedLabel(target):'スキルのみ',species:target?.species||null,nickname:target?.nickname||'',candy:target?candyMap[target.species]:null,context:{rulesVersion:3,team:clone(team),actor,actorId:p.id,actorSlot:slot,event,...(typeof FieldHistoryUI!=='undefined'?{fieldContext:FieldHistoryUI.context(date)}:{}),effectiveLevel:source?skillEffect.effectiveLevel:Math.min(SK.copyCap(actor)||C.skillCap(p.species),actor.profile.skillLevel+event.boost)}};
  if(source&&['fixed','lucky'].includes(kind)&&typeof EventEffects!=='undefined'){const base=C.shardAmounts(kind,skillEffect.effectiveLevel).find(n=>EventEffects.shards(n,actor,C.gameDay(date)).amount===shards);r.context.shardBonus=EventEffects.shards(base,actor,C.gameDay(date));}
  if(source){r.sourcePokemonId=source.id;r.sourcePokemon=clone(source);r.sourceSkillId=SK.id(SK.forPokemon(source));}
  if(mew&&shards&&SK.id(SK.forPokemon(p))==='dream_shard_s'){r.firedSkill=SK.value('dream_shard_s');r.outcomeSkillId='dream_shard_s';}
  return r;
 }
 function save(p,data){try{const r=build(p,data);if($('auto-now').checked)$('datetime').value=C.localInput(r.datetime);if(commit({...state,records:[...state.records,r]},resourceNotice(r))){drafts.delete(p.id);renderRecord();return true;}}catch(e){notice(e.message,true);}return false;}
 function field(placeholder,value,oninput){const i=el('input');Object.assign(i,{type:'number',inputMode:'numeric',min:'0',max:'1000000000',step:'1',value:value||'',placeholder});i.setAttribute('aria-label',placeholder);i.oninput=()=>oninput(i.value);return i;}
 function title(card,p,slot){card.append(skillRecordHeading(p),skillRecordDetail(p));}
 function rewards(card,p,slot){
  const draft=drafts.get(p.id)||{candy:'',shards:'',target:'',outcome:''};drafts.set(p.id,draft);
  if(p.species==='ミュウ'){
   title(card,p,slot);
   const canShard=SummaryExtras.shardVisible('skill')&&['metronome','dream_shard_s'].includes(SK.id(SK.forPokemon(p)));
   if(canShard)card.append(field('ゆめのかけら',draft.shards,v=>draft.shards=v));
   targets(card,p,(target,amount)=>save(p,{candy:amount,shards:canShard?draft.shards:'',target}),false);return;
  }
  title(card,p,slot);
  if(copies(p)){
   const sources=el('div',undefined,'skill-choice-grid copy-targets');sources.setAttribute('aria-label','コピー先');
   for(const q of copySources(p)){const b=button(q.nickname||C.speciesName(q.species),()=>{draft.sourceId=draft.sourceId===q.id?'':q.id;draft.target='';draft.candy=draft.shards='';card.replaceChildren();rewards(card,p,slot);});b.setAttribute('aria-pressed',String(draft.sourceId===q.id));b.dataset.sourceId=q.id;sources.append(b);}card.append(sources);
   const source=copySources(p).find(q=>q.id===draft.sourceId);if(!source)return;
   const kind=effect(source),data={sourceId:source.id};card.classList.toggle('copied-mew',kind==='mew-copy');
   if(kind==='mew-copy'){
    const amounts=copiedMewAmounts(p,source),canShard=['metronome','dream_shard_s'].includes(SK.id(SK.forPokemon(source)));
    if(!amounts){manual(card,p,draft,{candy:true,shards:canShard},true);return;}
    if(canShard)card.append(field('ゆめのかけら',draft.shards,v=>draft.shards=v));
    targets(card,p,(target,candy)=>save(p,{...data,target,candy,shards:canShard?draft.shards:''}),false,amounts);return;
   }
   if(kind==='candy'){targets(card,p,(target,amount)=>save(p,{...data,target,candy:amount,only:amount===0}),true);return;}
   if(kind!=='metronome'){
    if(!visible(p))return;
    const form=el('form',undefined,'shard-skill-form copied-shard-form');
    if(kind==='random'){form.append(field('ゆめのかけら',draft.shards,v=>draft.shards=v));const submit=el('button','記録');submit.type='submit';form.append(submit);form.onsubmit=e=>{e.preventDefault();save(p,{...data,shards:draft.shards});};}
    else {form.classList.add('shard-lucky-actions');for(const amount of shardAmounts(kind,p,source))form.append(button(amount?amount.toLocaleString()+'個':'スキルのみ',()=>save(p,{...data,shards:amount,only:amount===0})));}
    card.append(form);return;
   }
  }
  manual(card,p,draft);
 }
 function manual(card,p,draft,selectedCap=null,requireCandy=false){
  const cap=selectedCap||capabilities(p);if(!selectedCap&&!ownManual(p)){cap.candy=cap.candy&&recordVisible('skill');cap.shards=cap.shards&&SummaryExtras.shardVisible('skill');}
  const form=el('form',undefined,'activation-form metronome-form'),submit=el('button','記録');submit.type='submit';
  const valid=()=>{const raw=String(draft.candy||'').replaceAll(',','').trim(),n=Number(raw);submit.disabled=!!((requireCandy&&!draft.target)||cap.candy&&draft.target&&(!raw||!Number.isSafeInteger(n)||n<=0||n>1000000000));};
  if(cap.candy){
   const choices=el('div',undefined,'skill-choice-grid candy-choices');choices.setAttribute('aria-label','アメの獲得先');
   const input=field('アメの個数',draft.candy,v=>{draft.candy=v;valid();});input.disabled=!draft.target;
   currentTeam().forEach((q,i)=>{const b=button(q?(candyMap[q.species]||'種類未確認'):'未設定',()=>{draft.target=draft.target===String(i+1)?'':String(i+1);input.disabled=!draft.target;for(const x of choices.children)x.setAttribute('aria-pressed',String(x===b&&!!draft.target));valid();});b.disabled=!q||!Object.hasOwn(candyMap,q.species);b.setAttribute('aria-pressed',String(draft.target===String(i+1)));choices.append(b);});form.append(choices,input);
  }
  if(cap.shards)form.append(field('ゆめのかけら',draft.shards,v=>{draft.shards=v;valid();}));
  form.append(submit);valid();form.onsubmit=e=>{e.preventDefault();if(submit.disabled)return;const candy=cap.candy&&draft.target?draft.candy:'',shards=cap.shards?draft.shards:'';try{save(p,{sourceId:draft.sourceId,target:draft.target,candy,shards,only:!numeric(candy,'アメ')&&!numeric(shards,'ゆめのかけら')});}catch(error){notice(error.message,true);}};card.append(form);
 }
 function targets(card,p,recordTarget,zero,amounts=null){
  const grid=el('div',undefined,'record-slots activation-targets');
  currentTeam().forEach((q,i)=>{const box=el('div',undefined,'help-card candy-target-row'),content=el('span',undefined,'record-row-content');content.append(el('strong',q?(candyMap[q.species]||'種類未確認'):'未設定'));box.append(el('small',recordPosition(i+1)),content);const actions=el('div',undefined,'mew-actions');for(const amount of (amounts||(zero?[4]:C.mewAmounts(eventSkill(p).effectiveLevel)))){const b=button(amount+'個',()=>recordTarget(i+1,amount));b.disabled=!q||!Object.hasOwn(candyMap,q.species);actions.append(b);}box.append(actions);grid.append(box);});
  if(zero){const box=el('div',undefined,'help-card candy-target-row skill-only-target'),actions=el('div',undefined,'mew-actions');actions.append(button('スキルのみ',()=>recordTarget(6,0)));box.append(actions);grid.append(box);}card.append(grid);
 }
 function setupGuide(root){
  const empty=state.pokemon.length===0;if(!empty&&currentTeam().some(Boolean))return false;
  const guide=el('div',undefined,'record-setup-guide');guide.append(el('p',empty?'ポケモンが登録されていません。':'ポケモンが編成されていません。'),button(empty?'新規登録へ':'チーム編成へ',()=>{showTab('team');TeamUI.show(empty?'register':'team');}));root.append(guide);return true;
 }
 function mount(){
  const host=$('record-main-view');if(!host)return;
  for(const [key,name] of [['skills','メインスキル'],['other','その他']])if(!$('action-'+key)){const pane=el(key==='other'?'details':'section');pane.id='action-'+key;pane.setAttribute('aria-label',name);host.append(pane);}
  const other=$('shard-other-form'),cluster=$('cluster-panel');
  // 元のフォームとハンドラーをそのまま移動。その他のみ折りたたむ。
  if(other.parentElement.tagName==='DETAILS'){
   const old=other.parentElement,box=el('div',undefined,'card shard-other-record');old.replaceWith(box);box.append(other);
  }
  if(cluster.tagName==='DETAILS'){
   const box=el('div',undefined,'card record-cluster-panel');box.id=cluster.id;cluster.replaceWith(box);box.append(el('h3','ゆめのかたまり','record-subheading'),...Array.from(cluster.children).filter(n=>n.tagName!=='SUMMARY'));
  }
  const root=$('action-other');root.classList.add('shards');
  if(!root.querySelector('summary')){const heading=el('summary','その他','record-subheading');root.prepend(heading);}
  root.append(other.parentElement,$('cluster-panel'));
  if(!root.dataset.otherLayout){
   root.dataset.otherLayout='split';
   const clusterForm=$('shard-cluster-form'),size=$('cluster-size').closest('label'),count=$('cluster-count').closest('label');
   for(const [label,input,title] of [[size,$('cluster-size'),'ゆめのかたまり'],[count,$('cluster-count'),'個数']]){for(const n of [...label.childNodes])if(n.nodeType===3)n.remove();input.setAttribute('aria-label',title);if(input.tagName==='INPUT')input.placeholder=title;}
   const clusterRow=el('div',undefined,'other-cluster-row');clusterRow.append(size,count);clusterForm.querySelector('.filters').replaceWith(clusterRow);clusterForm.querySelector('.cluster-result-label').hidden=true;
   const result=$('cluster-amount').closest('.cluster-result-row');result.hidden=false;result.querySelector('button').textContent='保存';
   const methodRow=el('div',undefined,'other-method-row'),saveRow=el('div',undefined,'other-method-row');
   methodRow.append($('shard-other-kind').closest('label'),$('shard-other-amount').closest('label'));const save=other.querySelector('button[type=submit]');save.textContent='保存';saveRow.append($('shard-other-memo').closest('label'),save);other.append(methodRow,saveRow);
   root.prepend($('cluster-panel'));root.prepend(root.querySelector('summary'));other.parentElement.prepend(el('h3','その他','record-subheading'));$('cluster-panel').querySelector('h3').textContent='ゆめのかたまり';
  }
  root.append($('cluster-panel'),other.parentElement);if($('nap-island-details'))root.append($('nap-island-details'));
  const select=$('shard-other-kind');
  for(const option of select.options)if(option.value){const enabled=SummaryExtras.otherVisible(option.value);option.hidden=!enabled;option.disabled=!enabled;}
  if(select.selectedOptions[0]?.disabled)select.value='';
  $('cluster-panel').hidden=!SummaryExtras.shardVisible('cluster');other.hidden=!SummaryExtras.shardVisible('other');other.parentElement.hidden=other.hidden;

 }
 function show(){
  if(!$('record-main-view'))return;
  if($('help-section'))$('help-section').hidden=!recordVisible('help');
  if(!$('action-skills')||!$('action-other'))return;
  $('action-skills').hidden=!C.actionAllowed(state.settings,'skills','displayActions');
  $('action-other').hidden=!C.actionAllowed(state.settings,'other','displayActions');
  let empty=$('record-empty');if(!empty){empty=el('p','表示する記録項目がありません。設定タブから変更できます。','muted');empty.id='record-empty';$('record-main-view').append(empty);}
  empty.hidden=!!($('help-section')&&!$('help-section').hidden)||!$('action-skills').hidden||!$('action-other').hidden&&(!$('cluster-panel').hidden||!$('shard-other-form').hidden||state.settings.showNapIsland===true);
  for(const id of ['record-candy-heading','record-shard-heading','shard-records','research-panel'])if($(id))$(id).hidden=true;
  for(const method of ['mew','delibird','other'])if($(method+'-section'))$(method+'-section').hidden=true;
 }
 function render(){
  mount();const root=$('action-skills');if(!root)return;const heading=el('h2','メインスキル','record-subheading');root.replaceChildren(heading);if(!C.actionAllowed(state.settings,'skills','displayActions')||setupGuide(root)){show();return;}if(typeof EventEffects!=='undefined')EventEffects.renderField(root,EventEffects.recordDay());
  const shardRows=[...$('shard-skill-inputs').querySelectorAll('.shard-skill-row')].filter(n=>!n.classList.contains('copy-skill-card'));
  currentTeam().forEach((p,i)=>{if(!p||!visible(p))return;const slot=i+1,key=SK.id(SK.forPokemon(p)),cap=capabilities(p);
   if(p.species==='ミュウ'&&recordVisible('mew')){const card=el('div',undefined,'card mew activation-card');card.dataset.actorId=p.id;rewards(card,p,slot);root.append(card);}
   else if(p.species==='デリバード'&&recordVisible('delibird')){const card=el('div',undefined,'card delibird activation-card');card.dataset.actorId=p.id;title(card,p,slot);targets(card,p,(target,n)=>record('delibird',target,n,p.id),true);root.append(card);}
   else if((metronome(p)||copies(p))&&(ownManual(p)?cap.candy||cap.shards:cap.candy&&recordVisible('skill')||cap.shards&&SummaryExtras.shardVisible('skill'))){const card=el('div',undefined,'card activation-card');card.dataset.actorId=p.id;rewards(card,p,slot);root.append(card);}
   else if(p.species!=='ミュウ'&&!copies(p)&&!metronome(p)&&SummaryExtras.shardVisible('skill')&&SK.shardMode(p)){
    const row=shardRows.find(n=>n.querySelector('.shard-record-name small')?.textContent===recordPosition(slot));if(row){row.dataset.actorId=p.id;row.querySelector('.shard-record-name').replaceWith(skillRecordHeading(p));row.insertBefore(skillRecordDetail(p),row.children[1]||null);root.append(row);}
   }
  });
  if(!root.querySelector('[data-actor-id]'))root.append(el('p','記録できるスキルのポケモンが編成にいません。','muted'));
  if($('help-section')){const heading=$('help-section').querySelector('h2');heading.textContent='アメ拾い';}
  show();
 }
 function history(root,r){
  const card=el('div',undefined,'card '+(r.amount?'skill':'shards')),actions=el('div',undefined,'history-actions');card.dataset.datetime=r.datetime;
  actions.append(button('訂正',()=>edit(r)),button('削除',()=>{if(confirm('このスキル発動の記録を削除しますか？'))commit({...state,records:state.records.filter(x=>x.id!==r.id)},'スキル記録を削除');},'danger'));
  const actor=r.context.actor;historyCard(card,{...r,slot:r.context.actorSlot,pokemonSnapshot:actor},r.method==='mew'?'ミュウ':'スキル',r.amount?r.candy:'スキルのみ',label(actor),actions);
  // 履歴は発動ごとに1枚。両獲得量・発動個体を常に残します。
  const meta=card.querySelector('.history-meta');meta.replaceChildren(qel('strong',r.amount+'個','history-amount'));if(r.amount)meta.append(el('span',r.candy));if(r.resourceFlags.shards)meta.append(qel('span','ゆめのかけら '+r.shardAmount+'個'));
  card.append(el('p',mainSkillText(actor)+' · Lv.'+r.recordedSkillLevel+(r.outcomeSkillId?' · '+SK.name(r.outcomeSkillId):' · 結果不明'),'history-supplement'));
  card.historyInfo.r=r;finishHistoryCard(card);root.append(card);
 }
 function edit(r){
  const dialog=el('dialog'),form=el('form');dialog.append(form);document.body.append(dialog);form.append(el('h2','スキル記録の訂正'));
  const date=el('input');Object.assign(date,{type:'datetime-local',value:C.localInput(r.datetime),required:true});date.setAttribute('aria-label','記録日時');
  const amount=field('アメの個数',String(r.amount),()=>{}),shards=field('ゆめのかけら',String(r.shardAmount),()=>{}),target=el('select');optionList(target,r.context.team.map((p,i)=>p?{id:String(i+1),text:position(i+1)+' · '+label(p)}:null).filter(Boolean),String(r.slot||''),'アメの獲得先');target.setAttribute('aria-label','アメの獲得先');
  amount.value=String(r.amount);shards.value=String(r.shardAmount);const error=el('p'),save=el('button','保存');save.type='submit';form.append(date,target,amount,shards,error,save,button('キャンセル',()=>dialog.close()));dialog.onclose=()=>dialog.remove();
  form.onsubmit=e=>{e.preventDefault();try{const current=state.records.find(x=>x.id===r.id);if(!current)throw Error('記録が見つかりません。');const a=numeric(amount.value,'アメ'),s=numeric(shards.value,'ゆめのかけら'),p=a?r.context.team[Number(target.value)-1]:null;if(a&&!p||r.method==='mew'&&!C.mewAmounts(r.context?.effectiveLevel??r.recordedSkillLevel).includes(a))throw Error('アメ個数と獲得先を確認してください。');const next={...current,datetime:date.value===C.localInput(r.datetime)?r.datetime:C.fromInput(date.value).toISOString(),amount:a,shardAmount:s,resourceFlags:{candy:!!a||r.resourceFlags.candy,shards:!!s||r.resourceFlags.shards},slot:p?Number(target.value):null,pokemonId:p?.id||null,pokemon:p?storedLabel(p):'スキルのみ',species:p?.species||null,nickname:p?.nickname||'',candy:p?candyMap[p.species]:null,updatedAt:new Date().toISOString()};if(next.method==='mew'&&!s){delete next.firedSkill;next.outcomeSkillId='';}else if(next.method==='mew'&&SK.id(next.registeredMainSkill)==='dream_shard_s'&&s){next.firedSkill=SK.value('dream_shard_s');next.outcomeSkillId='dream_shard_s';}if(commit({...state,records:state.records.map(x=>x.id===r.id?next:x)},'スキル記録を保存'))dialog.close();}catch(e){error.textContent=e.message;}};
  DateUI.update();dialog.showModal();
 }
 return {setupGuide,render,show,build,capabilities,copySources,copiedMewAmounts,history,edit};
})();
