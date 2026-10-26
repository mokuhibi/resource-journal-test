'use strict';
// Lucide Icons 0.468.0 (ISC / Feather MIT), commit f12b0de177fbc2a6795e99be065887e72b237123. License: THIRD_PARTY_NOTICES.txt
const TabIcons=(()=>{
 const paths={
 "notebook-pen": "<path d=\"M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4\" />\n  <path d=\"M2 6h4\" />\n  <path d=\"M2 10h4\" />\n  <path d=\"M2 14h4\" />\n  <path d=\"M2 18h4\" />\n  <path d=\"M21.378 5.626a1 1 0 1 0-3.004-3.004l-5.01 5.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z\" />",
 "candy": "<path d=\"m9.5 7.5-2 2a4.95 4.95 0 1 0 7 7l2-2a4.95 4.95 0 1 0-7-7Z\" />\n  <path d=\"M14 6.5v10\" />\n  <path d=\"M10 7.5v10\" />\n  <path d=\"m16 7 1-5 1.37.68A3 3 0 0 0 19.7 3H21v1.3c0 .46.1.92.32 1.33L22 7l-5 1\" />\n  <path d=\"m8 17-1 5-1.37-.68A3 3 0 0 0 4.3 21H3v-1.3a3 3 0 0 0-.32-1.33L2 17l5-1\" />",
 "diamond": "<path d=\"M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z\" />",
 "history": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\" />\n  <path d=\"M3 3v5h5\" />\n  <path d=\"M12 7v5l4 2\" />",
 "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\" />\n  <circle cx=\"9\" cy=\"7\" r=\"4\" />\n  <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\" />\n  <path d=\"M16 3.13a4 4 0 0 1 0 7.75\" />",
 "settings": "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\" />\n  <circle cx=\"12\" cy=\"12\" r=\"3\" />",
 "moon": "<path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\" />",
 "mountain": "<path d=\"m8 3 4 8 5-5 5 15H2L8 3z\" />"
};
 paths['list']="<path d=\"M3 12h.01\" />\n  <path d=\"M3 18h.01\" />\n  <path d=\"M3 6h.01\" />\n  <path d=\"M8 12h13\" />\n  <path d=\"M8 18h13\" />\n  <path d=\"M8 6h13\" />";
 paths['calendar-days']="<path d=\"M8 2v4\" />\n  <path d=\"M16 2v4\" />\n  <rect width=\"18\" height=\"18\" x=\"3\" y=\"4\" rx=\"2\" />\n  <path d=\"M3 10h18\" />\n  <path d=\"M8 14h.01\" />\n  <path d=\"M12 14h.01\" />\n  <path d=\"M16 14h.01\" />\n  <path d=\"M8 18h.01\" />\n  <path d=\"M12 18h.01\" />\n  <path d=\"M16 18h.01\" />";
 paths['user-round-plus']="<path d=\"M2 21a8 8 0 0 1 13.292-6\" />\n  <circle cx=\"10\" cy=\"8\" r=\"5\" />\n  <path d=\"M19 16v6\" />\n  <path d=\"M22 19h-6\" />";
 paths['map']="<path d=\"M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z\" />\n  <path d=\"M15 5.764v15\" />\n  <path d=\"M9 3.236v15\" />";
 // file-pen-line only: current official geometry (last changed 0.575.0), same ISC license.
 paths['file-pen-line']='<path d="M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z" /><path d="M14.487 7.858A1 1 0 0 1 14 7V2" /><path d="M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516" /><path d="M8 18h1" />';
 paths["mail"]="<rect width=\"20\" height=\"16\" x=\"2\" y=\"4\" rx=\"2\" />\n  <path d=\"m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7\" />";
 paths["image-plus"]="<path d=\"M16 5h6\" />\n  <path d=\"M19 2v6\" />\n  <path d=\"M21 11.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5\" />\n  <path d=\"m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21\" />\n  <circle cx=\"9\" cy=\"9\" r=\"2\" />";
 const main={record:'notebook-pen',summary:'candy',shards:'diamond',history:'history',team:'users',settings:'settings'},record={main:'notebook-pen',sleep:'moon',social:'mail',nap:'mountain'};
 function add(button,name){
  if(!paths[name]||button.querySelector('.tab-icon'))return;
  const label=document.createElement('span');label.className='tab-label';while(button.firstChild)label.append(button.firstChild);
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');for(const [k,v] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'2','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false',class:'tab-icon'}))svg.setAttribute(k,v);
  svg.innerHTML=paths[name].replace(/>\s+</g,'><').trim();button.classList.add('has-tab-icon');button.append(svg,label);
 }
 function recordTab(button,key){add(button,record[key]);}
 for(const button of document.querySelectorAll('button[data-tab]'))add(button,main[button.dataset.tab]);
 return {recordTab,add};
})();
