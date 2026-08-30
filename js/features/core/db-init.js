
/* ═══════════════════════════════════════
   SCHOLR v4 — COMPLETE JS
   KEY FIX: DB initialized at parse time, not in DOMContentLoaded
   This means all onclick handlers work immediately.
═══════════════════════════════════════ */
const KEY = 'BShui596';
const PAL = ['#1D4ED8','#0F6B30','#6D28D9','#BE185D','#B45309','#0F766E','#374151','#C05418','#901818','#0369A1'];
const THEMES = [{id:'forest',e:'🌿',c:'#0F6B30'},{id:'ocean',e:'🌊',c:'#1750A8'},{id:'sunset',e:'🌅',c:'#C05418'},{id:'rose',e:'🌸',c:'#B5185B'},{id:'violet',e:'💜',c:'#6820D8'},{id:'slate',e:'🪨',c:'#2C4A62'},{id:'teal',e:'🐬',c:'#0C706A'},{id:'midnight',e:'🌙',c:'#7B9CF8'},{id:'aurora',e:'🧊',c:'#5B46EA'},{id:'ember',e:'🔥',c:'#C14B0D'},{id:'retro',e:'📼',c:'#A35B12'},{id:'moonrise',e:'🌌',c:'#6B8CF8'},{id:'cherry',e:'🍒',c:'#901818'},{id:'gold',e:'✨',c:'#8A5000'},{id:'noir',e:'🖤',c:'#444'},{id:'mint',e:'🌱',c:'#0F7A4A'},{id:'paper',e:'📄',c:'#6B4C1A'},{id:'candy',e:'🍬',c:'#C03078'},{id:'custom',e:'🎨',c:'#888'}];
const FONTS = [
  {id:'outfit',l:'Outfit',s:'Outfit'},{id:'dm',l:'DM Sans',s:'DM Sans'},
  {id:'jakarta',l:'Jakarta',s:'Plus Jakarta Sans'},{id:'nunito',l:'Nunito',s:'Nunito'},
  {id:'slab',l:'Zilla Slab',s:'Zilla Slab'},{id:'mono',l:'Mono',s:'JetBrains Mono'},
  {id:'cormorant',l:'Cormorant',s:'Cormorant Garamond'},{id:'spectral',l:'Spectral',s:'Spectral'},
  {id:'grotesk',l:'Grotesk',s:'Space Grotesk'},{id:'bitter',l:'Bitter',s:'Bitter'},
  {id:'inter',l:'Inter',s:'Inter'},{id:'libre',l:'Libre',s:'Libre Franklin'},
  {id:'raleway',l:'Raleway',s:'Raleway'},{id:'josefin',l:'Josefin',s:'Josefin Sans'},
  {id:'eb',l:'EB Garamond',s:'EB Garamond'},{id:'merriweather',l:'Merriweather',s:'Merriweather'},
  {id:'rubik',l:'Rubik',s:'Rubik'},{id:'poppins',l:'Poppins',s:'Poppins'}
];
const FONT_URLS = {
  outfit:'Outfit:wght@300;400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600',
  dm:'DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1',
  jakarta:'Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,600;1,400',
  nunito:'Nunito:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700',
  slab:'Zilla+Slab:wght@400;500;600;700',
  mono:'JetBrains+Mono:wght@400;500;600',
  cormorant:'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600',
  spectral:'Spectral:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;1,200;1,400',
  grotesk:'Space+Grotesk:wght@300;400;500;600;700',
  bitter:'Bitter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400',
  inter:'Inter:wght@300;400;500;600;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400',
  libre:'Libre+Franklin:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400',
  raleway:'Raleway:wght@300;400;500;600;700;800',
  josefin:'Josefin+Sans:wght@300;400;500;600;700',
  eb:'EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500',
  merriweather:'Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400',
  rubik:'Rubik:wght@300;400;500;600;700',
  poppins:'Poppins:wght@300;400;500;600;700'
};
const AVATARS = ['🎓','📚','🦊','🐻','🦁','🐯','🦋','🌟','🎯','🚀','⚡','🌈','🎸','🏆','🦄','🧑‍💻','🧪','✏️','🎵','🖕','🫃','🫄','🍑','🥜'];
// Legacy rubric strands removed. Homework now uses links and custom fields.
const DP_COL = {Study:'#1D4ED8',Class:'#0F6B30',Break:'#B45309',Exercise:'#BE185D',Meal:'#0F766E',Other:'#374151',Overdue:'#B91C1C',Exam:'#7C3AED'};
const GR_CLR = {A:{bg:'#D1FAE5',fg:'#065F46'},B:{bg:'#DBEAFE',fg:'#1E40AF'},C:{bg:'#FEF3C7',fg:'#92400E'},D:{bg:'#FEE2E2',fg:'#B91C1C'},F:{bg:'#FECACA',fg:'#7F1D1D'}};
const DEF_SLOTS = ['8:35 AM','9:15 AM','9:55 AM','10:45 AM','11:25 AM','12:05 PM','1:05 PM','1:45 PM','2:25 PM','3:05 PM'];

