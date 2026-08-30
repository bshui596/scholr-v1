/* ── HELPERS ── */
function g(id){return document.getElementById(id);}
function setText(id,v){const e=g(id);if(e)e.textContent=v;}
function setValue(id,v){const e=g(id);if(e)e.value=v||'';}
function setSel(id,val){const e=g(id);if(!e)return;for(let o of e.options)if(o.value===val||o.text===val){o.selected=true;return;}}

