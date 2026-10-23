'use strict';
// 文字入力だけの補助。保存せず、既存inputイベントで検索・下書きを更新する。
const TextClear=(()=>{
 const bound=new WeakSet();
 function attach(input){
  if(bound.has(input)||input.readOnly||input.hidden||input.disabled||input.matches('.comma-input,[inputmode=numeric],[inputmode=decimal]')||input.closest('.sleep-search,.text-clear-field'))return;
  bound.add(input);const wrap=el('span',undefined,'text-clear-field'),clear=button('×',()=>{input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));sync();input.focus({preventScroll:true});},'text-clear-button');clear.setAttribute('aria-label',(input.getAttribute('aria-label')||input.placeholder||'入力')+'を消去');clear.onpointerdown=e=>e.preventDefault();
  input.before(wrap);wrap.append(input,clear);input.classList.add('has-text-clear');
  const sync=()=>{clear.hidden=!input.value||input.disabled||input.readOnly;};const descriptor=Object.getOwnPropertyDescriptor(input,'value')||Object.getOwnPropertyDescriptor(input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value');if(descriptor?.get&&descriptor?.set)Object.defineProperty(input,'value',{configurable:true,get(){return descriptor.get.call(this);},set(v){descriptor.set.call(this,v);sync();}});input.addEventListener('input',sync);input.addEventListener('change',sync);input.addEventListener('focus',sync);new MutationObserver(sync).observe(input,{attributes:true,attributeFilter:['disabled','readonly']});sync();
 }
 function scan(){document.querySelectorAll('input:not([type]),input[type=text],input[type=search],textarea').forEach(attach);}
 function init(){scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});document.addEventListener('click',()=>scan());}
 return {init};
})();
TextClear.init();
