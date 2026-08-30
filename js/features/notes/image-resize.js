/* ── INSERT FUNCTIONS ── */
function insImg(){const i=document.createElement('input');i.type='file';i.accept='image/*';i.onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{cmd('insertHTML',`<figure><img src="${ev.target.result}" style="max-width:100%;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.1)" alt="${f.name}"/><figcaption contenteditable="true">Caption…</figcaption></figure><p></p>`);};r.readAsDataURL(f);};i.click();}
function insImgUrl(){const u=prompt('Image URL:','https://');if(!u)return;cmd('insertHTML',`<figure><img src="${u}" style="max-width:100%;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.1)"/><figcaption contenteditable="true">Caption…</figcaption></figure><p></p>`);}

