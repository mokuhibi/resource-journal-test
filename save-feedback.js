'use strict';
// Visual feedback only; all writes stay in the existing commit handlers.
const SaveFeedback=(()=>{
 const originals=new WeakMap();let active=null,ready=false;
 const eligible=root=>root&&!['sleep-form','sleep-shard-form'].includes(root.id);
 const snapshot=root=>JSON.stringify([...root.querySelectorAll('input,select,textarea')].filter(n=>n.type!=='file'&&!n.classList.contains('comma-input')).map(n=>[n.id||n.name,n.type==='checkbox'||n.type==='radio'?n.checked:n.value]));
 const buttons=root=>root.id==='register-panel'?[$('add-pokemon')]:[...root.querySelectorAll('button[type=submit]'),...(root.id?document.querySelectorAll('button[form="'+root.id+'"]'):[])];
 function paint(root){if(!eligible(root))return;if(!originals.has(root))originals.set(root,snapshot(root));const dirty=snapshot(root)!==originals.get(root);for(const b of buttons(root)){b.classList.toggle('save-dirty',dirty);b.classList.toggle('save-idle',!dirty);}}
 function reset(root){if(!eligible(root))return;originals.set(root,snapshot(root));paint(root);}
 function saved(){const root=active;if(root)queueMicrotask(()=>reset(root));}
 function init(){if(ready)return;ready=true;const scan=()=>{for(const root of [...document.querySelectorAll('form'),$('register-panel')])if(eligible(root)&&!originals.has(root))reset(root);};scan();new MutationObserver(scan).observe(document.body,{subtree:true,childList:true});for(const name of ['input','change'])document.addEventListener(name,e=>paint(e.target.closest('form')||e.target.closest('#register-panel')));document.addEventListener('submit',e=>{active=e.target;queueMicrotask(()=>{active=null;});},true);document.addEventListener('click',e=>{if(e.target.closest('#add-pokemon')){active=$('register-panel');queueMicrotask(()=>{active=null;});}},true);}
 return {init,reset,saved};
})();
