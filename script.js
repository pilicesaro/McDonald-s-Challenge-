/* ═══════════════════════════════════════════════════════════════
   McDONALD'S CHALLENGE — script.js v5 PAPA'S EDITION
   Modos: Hamburguesa | Milkshake | Pizza
   - Bebida por memoria (sin mostrar qué era)
   - Derrota instantánea por ingrediente incorrecto
   - Sistema de puntuación Papa's Burgeria por etapa
   - Dificultad progresiva
   - Corrección de selección de personaje
═══════════════════════════════════════════════════════════════ */
'use strict';

/* ── MÁQUINA DE ESTADOS ──────────────────────────────────────── */
const STATES = {
  IDLE:'IDLE',
  CHARACTER_SELECT:'CHARACTER_SELECT',
  MODE_SELECT:'MODE_SELECT',
  // Burger flow
  ORDER:'ORDER', MEAT:'MEAT', FRIES:'FRIES', DRINK:'DRINK',
  BURGER:'BURGER', DELIVERY:'DELIVERY',
  // Milkshake flow
  MS_ORDER:'MS_ORDER', MS_FLAVOR:'MS_FLAVOR', MS_CUP:'MS_CUP',
  MS_FILL:'MS_FILL', MS_TOPPINGS:'MS_TOPPINGS', MS_DELIVERY:'MS_DELIVERY',
  // Pizza flow
  PZ_ORDER:'PZ_ORDER', PZ_DOUGH:'PZ_DOUGH', PZ_TOPPINGS:'PZ_TOPPINGS',
  PZ_BAKE:'PZ_BAKE', PZ_CUT:'PZ_CUT', PZ_DELIVERY:'PZ_DELIVERY',
  // Shared
  RESULT:'RESULT', WIN:'WIN', LOSE:'LOSE',
};

/* ── ESTADO GLOBAL ───────────────────────────────────────────── */
const G = {
  client:1, total:5, lives:3, sat:100, score:0, errors:0,
  startTime:null, elapsed:0, paused:false,
  order:null, results:{}, stageScores:{},
  timers:[], timerRaf:null, animRaf:null, activeScreen:null,
  drinkCleanup:null,
  character: null,   // 'male' | 'female'
  gameMode: null,    // 'burger' | 'milkshake' | 'pizza'
  money: 0,
  stars: [],
  clientScores: [],
  rushHourActive: false,
  loseReason: '',
  streak: 0,
  maxStreak: 0,
  gameOver: false,
  state: STATES.IDLE,   // ← State Machine
  difficulty: 'medium', // 'easy' | 'medium' | 'hard'
  // Milkshake state
  ms: {},
  // Pizza state
  pz: {},
};

/* ── DATOS ───────────────────────────────────────────────────── */
const CLIENTS = [
  { name:'Don Roberto', tag:'El amigable',  speech:'¡Buen día! Quiero pedir...',       skin:'#F5CBA7', hair:'#9B8B7A', shirt:'#5B8DD9', mood:'happy', glasses:true,  beard:false, hairStyle:'bald',  patience:1.0 },
  { name:'Sofía',       tag:'La apurada',   speech:'¡Rápido por favor, tengo prisa!',  skin:'#C68642', hair:'#2C1810', shirt:'#E8A0BF', mood:'rush',  glasses:false, beard:false, hairStyle:'long',  patience:0.75 },
  { name:'Mateo',       tag:'El indeciso',  speech:'A ver... creo que quiero...',       skin:'#FDBCB4', hair:'#5C3D2E', shirt:'#6BCB77', mood:'think', glasses:false, beard:false, hairStyle:'short', patience:0.9 },
  { name:'La abuela',   tag:'La exigente',  speech:'¡Todo bien hecho, ¿eh? ¡Ojo!',    skin:'#D4A574', hair:'#D0D0D0', shirt:'#C3B1E1', mood:'strict',glasses:true,  beard:false, hairStyle:'bun',   patience:0.6 },
  { name:'El CEO',      tag:'El VIP',       speech:'¡Soy cliente premium! Apúrense.',  skin:'#FDBCB4', hair:'#1A1A1A', shirt:'#2C3E50', mood:'boss',  glasses:false, beard:true,  hairStyle:'back',  patience:0.5 },
];

const BURGERS = [
  { name:'Hamburguesa clásica',   icon:'🍔', price:850,  ingredients:['pan_inf','carne','sal','pan_sup'] },
  { name:'Hamburguesa con queso', icon:'🍔', price:980,  ingredients:['pan_inf','carne','queso','pan_sup'] },
  { name:'Hamburguesa doble',     icon:'🍔', price:1250, ingredients:['pan_inf','carne','carne','queso','pan_sup'] },
  { name:'Hamburguesa especial',  icon:'🍔', price:1450, ingredients:['pan_inf','carne','queso','lechuga','tomate','pan_sup'] },
  { name:'Hamburguesa completa',  icon:'🍔', price:1780, ingredients:['pan_inf','carne','carne','queso','lechuga','tomate','pepinillo','salsa','pan_sup'] },
];
const FRIES = [
  { name:'Papas pequeñas', icon:'🍟', price:320 },
  { name:'Papas medianas', icon:'🍟', price:420 },
  { name:'Papas grandes',  icon:'🍟', price:520 },
];
const DRINKS_BURGER = [
  { name:'Coca-Cola', icon:'🥤', price:380, liquid:'#8B0000', foam:'#cc2222' },
  { name:'Sprite',    icon:'🥤', price:380, liquid:'#155a15', foam:'#22aa22' },
  { name:'Agua',      icon:'💧', price:250, liquid:'#1a4a9a', foam:'#4488cc' },
  { name:'Fanta',     icon:'🥤', price:380, liquid:'#cc4400', foam:'#ff7700' },
  { name:'Coca Zero', icon:'🥤', price:380, liquid:'#2a0000', foam:'#660000' },
];

const MILKSHAKE_FLAVORS = [
  { name:'Chocolate',    icon:'🍫', color:'#5C2D00', foam:'#8B4513', price:750 },
  { name:'Frutilla',     icon:'🍓', color:'#C0002A', foam:'#FF4466', price:750 },
  { name:'Vainilla',     icon:'🍦', color:'#F5DEB3', foam:'#FFFACD', price:750 },
  { name:'Oreo',         icon:'🍪', color:'#2A2A2A', foam:'#888888', price:800 },
  { name:'Dulce de leche',icon:'🍮',color:'#8B5A00', foam:'#C8860A', price:800 },
];
const MILKSHAKE_SIZES = [
  { name:'Pequeño', icon:'🥛', size:'sm', height:120, price:650 },
  { name:'Mediano',  icon:'🥛', size:'md', height:160, price:750 },
  { name:'Grande',   icon:'🥛', size:'lg', height:200, price:850 },
];
const MILKSHAKE_TOPPINGS = [
  { name:'Crema',       icon:'🍦', id:'cream'     },
  { name:'Chips',       icon:'🍫', id:'chips'     },
  { name:'Cereza',      icon:'🍒', id:'cherry'    },
  { name:'Grajeas',     icon:'🌈', id:'sprinkles' },
  { name:'Caramelo',    icon:'🍯', id:'caramel'   },
  { name:'Nueces',      icon:'🥜', id:'nuts'      },
];

const PIZZA_DOUGHS = [
  { name:'Clásica',        icon:'🍕', id:'classic',   price:400 },
  { name:'Delgada',        icon:'🔪', id:'thin',      price:380 },
  { name:'Rellena',        icon:'🎂', id:'stuffed',   price:500 },
  { name:'Integral',       icon:'🌾', id:'whole',     price:420 },
];
const PIZZA_INGREDIENTS = [
  { name:'Queso mozzarella',id:'queso',      icon:'🧀', color:'#FFE066' },
  { name:'Jamón',           id:'jamon',      icon:'🥩', color:'#E07070' },
  { name:'Pepperoni',       id:'pepperoni',  icon:'🔴', color:'#C03030' },
  { name:'Aceitunas',       id:'aceitunas',  icon:'🫒', color:'#2A4A1A' },
  { name:'Cebolla',         id:'cebolla',    icon:'🧅', color:'#D090C0' },
  { name:'Morrón',          id:'morron',     icon:'🫑', color:'#20A040' },
  { name:'Tomate',          id:'tomate',     icon:'🍅', color:'#CC2222' },
  { name:'Champiñones',     id:'champinones',icon:'🍄', color:'#8B6040' },
];
const PIZZA_PRESETS = [
  { name:'Mozzarella',    dough:'classic',  toppings:['queso'],                            price:1200 },
  { name:'Pepperoni',     dough:'classic',  toppings:['queso','pepperoni'],                price:1400 },
  { name:'Especial',      dough:'thin',     toppings:['queso','jamon','morron'],           price:1600 },
  { name:'Vegetariana',   dough:'whole',    toppings:['queso','tomate','morron','aceitunas'], price:1500 },
  { name:'Completa',      dough:'stuffed',  toppings:['queso','jamon','pepperoni','aceitunas','cebolla'], price:1900 },
];

const INGR = {
  pan_inf:  {label:'Pan inferior', icon:'🍞'}, carne:    {label:'Carne',       icon:'🥩'},
  queso:    {label:'Queso',        icon:'🧀'}, lechuga:  {label:'Lechuga',     icon:'🥬'},
  tomate:   {label:'Tomate',       icon:'🍅'}, pepinillo:{label:'Pepinillo',   icon:'🥒'},
  salsa:    {label:'Salsa',        icon:'🥫'}, sal:      {label:'Sal',         icon:'🧂'},
  cebolla:  {label:'Cebolla',      icon:'🧅'}, huevo:    {label:'Huevo',       icon:'🍳'},
  pan_sup:  {label:'Pan superior', icon:'🍞'},
};
const INGR_SVG = {
  pan_inf: `<svg viewBox="0 0 80 28" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bni" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#F5D78A"/><stop offset="100%" stop-color="#C8850A"/></radialGradient></defs><ellipse cx="40" cy="18" rx="38" ry="13" fill="#A05A0A"/><ellipse cx="40" cy="16" rx="38" ry="13" fill="url(#bni)" stroke="#8B5E00" stroke-width="1.5"/><ellipse cx="40" cy="12" rx="34" ry="9" fill="#F5D78A" opacity=".5"/></svg>`,
  pan_sup: `<svg viewBox="0 0 80 44" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="bsi" cx="45%" cy="30%" r="65%"><stop offset="0%" stop-color="#F5D478"/><stop offset="100%" stop-color="#C07808"/></radialGradient></defs><ellipse cx="40" cy="38" rx="38" ry="8" fill="#B06808"/><path d="M4 36 Q6 16 40 10 Q74 16 76 36 Z" fill="url(#bsi)" stroke="#8B5E00" stroke-width="1.5"/></svg>`,
  carne:   `<svg viewBox="0 0 80 22" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="mti" cx="45%" cy="40%" r="70%"><stop offset="0%" stop-color="#8B3A00"/><stop offset="100%" stop-color="#4A1A00"/></radialGradient></defs><ellipse cx="40" cy="14" rx="38" ry="11" fill="#3A1000"/><ellipse cx="40" cy="12" rx="38" ry="11" fill="url(#mti)" stroke="#2C0A00" stroke-width="1.5"/></svg>`,
  queso:   `<svg viewBox="0 0 80 16" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="qsi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFE44A"/><stop offset="100%" stop-color="#D4A800"/></linearGradient></defs><path d="M2 4 Q40 2 78 4 Q82 10 78 16 Q40 18 2 16 Q-2 10 2 4 Z" fill="url(#qsi)" stroke="#B8900A" stroke-width="1.5"/></svg>`,
  lechuga: `<svg viewBox="0 0 80 14" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="lci" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6BCB60"/><stop offset="100%" stop-color="#2E7D1E"/></linearGradient></defs><path d="M2 7 Q10 2 20 6 Q28 1 38 5 Q48 1 58 6 Q66 2 78 7 Q66 13 58 9 Q48 14 38 10 Q28 14 20 10 Q10 13 2 7 Z" fill="url(#lci)" stroke="#1E6010" stroke-width="1.5"/></svg>`,
  tomate:  `<svg viewBox="0 0 80 18" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="tmi" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#FF6B6B"/><stop offset="100%" stop-color="#CC1A1A"/></radialGradient></defs><ellipse cx="40" cy="11" rx="37" ry="10" fill="url(#tmi)" stroke="#8B0000" stroke-width="1.5"/></svg>`,
  pepinillo:`<svg viewBox="0 0 80 14" xmlns="http://www.w3.org/2000/svg"><ellipse cx="40" cy="8" rx="37" ry="7" fill="#4A9A20" stroke="#1E5A08" stroke-width="1.5"/><circle cx="20" cy="8" r="2.5" fill="rgba(30,100,10,.35)"/><circle cx="40" cy="8" r="2.5" fill="rgba(30,100,10,.35)"/><circle cx="60" cy="8" r="2.5" fill="rgba(30,100,10,.35)"/></svg>`,
  salsa:   `<svg viewBox="0 0 80 12" xmlns="http://www.w3.org/2000/svg"><path d="M4 6 Q14 2 24 7 Q34 1 44 6 Q54 2 64 7 Q70 3 78 5 Q72 10 64 8 Q54 12 44 8 Q34 12 24 8 Q14 11 4 8 Z" fill="#CC1A1A" stroke="#660000" stroke-width="1.5"/></svg>`,
  sal:     `<svg viewBox="0 0 80 10" xmlns="http://www.w3.org/2000/svg"><ellipse cx="40" cy="5" rx="37" ry="5" fill="rgba(240,235,220,.7)" stroke="rgba(180,170,150,.5)" stroke-width="1"/><circle cx="18" cy="5" r="1.5" fill="white"/><circle cx="38" cy="5" r="1.5" fill="white"/><circle cx="58" cy="5" r="1.5" fill="white"/></svg>`,
  cebolla: `<svg viewBox="0 0 80 14" xmlns="http://www.w3.org/2000/svg"><ellipse cx="40" cy="8" rx="36" ry="7" fill="#D0A0C8" stroke="#6A3070" stroke-width="1.5"/></svg>`,
  huevo:   `<svg viewBox="0 0 80 20" xmlns="http://www.w3.org/2000/svg"><ellipse cx="40" cy="11" rx="37" ry="10" fill="#FFFAE0" stroke="#C8A858" stroke-width="1.5"/><ellipse cx="36" cy="10" rx="10" ry="8" fill="#FFD020" stroke="#C8A000" stroke-width="1.5"/></svg>`,
};

const DISTRACTORS=[[], [], ['cebolla'], ['cebolla','huevo'], ['cebolla','huevo','pepinillo']];

/* ── PRESETS DE DIFICULTAD ───────────────────────────────────── */
const DIFFICULTY_PRESETS = {
  easy: {
    label:'Fácil', emoji:'😊',
    description:'Tiempos generosos, sin memoria, referencia visible siempre.',
    lives:5, totalClients:5, rushHour:false,
    instantKillOnWrongIngredient:false,
    diff:[
      {spd:.22,gs:.32,ge:.72,oT:12000,mT:20000,fT:20000,dT:30000,bT:45000,dlT:35000,dis:0,showOrderRef:true, memoryDrink:false},
      {spd:.24,gs:.33,ge:.70,oT:12000,mT:18000,fT:18000,dT:28000,bT:42000,dlT:32000,dis:0,showOrderRef:true, memoryDrink:false},
      {spd:.26,gs:.34,ge:.68,oT:11000,mT:17000,fT:17000,dT:26000,bT:40000,dlT:30000,dis:0,showOrderRef:true, memoryDrink:false},
      {spd:.28,gs:.35,ge:.67,oT:10000,mT:16000,fT:16000,dT:24000,bT:38000,dlT:28000,dis:0,showOrderRef:true, memoryDrink:false},
      {spd:.30,gs:.36,ge:.66,oT:10000,mT:15000,fT:15000,dT:22000,bT:36000,dlT:26000,dis:0,showOrderRef:true, memoryDrink:false},
    ],
  },
  medium: {
    label:'Intermedio', emoji:'😤',
    description:'Dificultad balanceada. Bebida por memoria desde el cliente 2.',
    lives:3, totalClients:5, rushHour:true,
    instantKillOnWrongIngredient:false,
    diff:[
      {spd:.35,gs:.40,ge:.64,oT:8000, mT:14000,fT:14000,dT:22000,bT:32000,dlT:25000,dis:0,showOrderRef:true, memoryDrink:false},
      {spd:.45,gs:.42,ge:.60,oT:6000, mT:12000,fT:12000,dT:18000,bT:26000,dlT:20000,dis:0,showOrderRef:true, memoryDrink:true},
      {spd:.55,gs:.44,ge:.57,oT:5000, mT:10000,fT:10000,dT:14000,bT:22000,dlT:16000,dis:1,showOrderRef:true, memoryDrink:true},
      {spd:.65,gs:.45,ge:.55,oT:4000, mT: 8000,fT: 8000,dT:11000,bT:18000,dlT:13000,dis:2,showOrderRef:false,memoryDrink:true},
      {spd:.75,gs:.46,ge:.53,oT:3000, mT: 6500,fT: 6500,dT: 9000,bT:14000,dlT:10000,dis:3,showOrderRef:false,memoryDrink:true},
    ],
  },
  hard: {
    label:'Difícil', emoji:'🔥',
    description:'Sin referencias, memoria total, hora pico desde el cliente 3.',
    lives:3, totalClients:7, rushHour:true,
    instantKillOnWrongIngredient:true,
    diff:[
      {spd:.55,gs:.43,ge:.58,oT:5000, mT:10000,fT:10000,dT:14000,bT:22000,dlT:16000,dis:1,showOrderRef:true, memoryDrink:true},
      {spd:.65,gs:.44,ge:.55,oT:4000, mT: 8000,fT: 8000,dT:11000,bT:18000,dlT:13000,dis:2,showOrderRef:false,memoryDrink:true},
      {spd:.75,gs:.45,ge:.53,oT:3000, mT: 6500,fT: 6500,dT: 9000,bT:14000,dlT:10000,dis:3,showOrderRef:false,memoryDrink:true},
      {spd:.82,gs:.45,ge:.52,oT:2800, mT: 6000,fT: 6000,dT: 8000,bT:12000,dlT: 9000,dis:3,showOrderRef:false,memoryDrink:true},
      {spd:.88,gs:.46,ge:.51,oT:2500, mT: 5500,fT: 5500,dT: 7500,bT:11000,dlT: 8000,dis:3,showOrderRef:false,memoryDrink:true},
      {spd:.92,gs:.46,ge:.51,oT:2200, mT: 5000,fT: 5000,dT: 7000,bT:10000,dlT: 7500,dis:3,showOrderRef:false,memoryDrink:true},
      {spd:.96,gs:.47,ge:.50,oT:2000, mT: 4500,fT: 4500,dT: 6500,bT: 9000,dlT: 7000,dis:3,showOrderRef:false,memoryDrink:true},
    ],
  },
};

/** Preset activo — se asigna al elegir dificultad */
let ACTIVE_PRESET = DIFFICULTY_PRESETS.medium;

/* Dificultad progresiva (legacy — ya no se usa directamente) */
const DIFF = DIFFICULTY_PRESETS.medium.diff;

/* ═══════════════════════════════════════════════════════════════
   SVG PERSONAJES (compactos, reutilizados del original)
═══════════════════════════════════════════════════════════════ */
let _svgId = 0;
function uid(){ return 'sg'+(++_svgId); }

function clientSVG(c, w=150) {
  const sk=c.skin, hr=c.hair, sh=c.shirt;
  const pants=['#3A7BC8','#1E2D42','#5C3A28','#7B3FA0','#1A3050'][CLIENTS.indexOf(c)%5];
  const id = uid();
  const skDark  = sk==='#F5CBA7'?'#D4956A':sk==='#C68642'?'#8C5018':sk==='#FDBCB4'?'#D4857A':sk==='#D4A574'?'#A86A30':'#C06830';
  const skLight = sk==='#F5CBA7'?'#FDE8CC':sk==='#C68642'?'#E09050':sk==='#FDBCB4'?'#FFD0C8':sk==='#D4A574'?'#ECC898':'#F0B878';
  const shDark  = sh==='#5B8DD9'?'#2A5A9A':sh==='#E8A0BF'?'#B06080':sh==='#6BCB77'?'#3A8A45':sh==='#C3B1E1'?'#7A60B0':'#102030';
  const mouthMap={
    happy: `<path d="M53 96 Q70 114 87 96" stroke="#9A3C10" stroke-width="3.5" fill="rgba(180,60,20,.2)" stroke-linecap="round"/>`,
    rush:  `<path d="M56 96 Q70 108 84 96" stroke="#9A3C10" stroke-width="3" fill="rgba(180,60,20,.12)" stroke-linecap="round"/>`,
    think: `<path d="M58 97 Q65 100 72 98 Q79 96 84 98" stroke="#9A3C10" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
    strict:`<path d="M54 101 Q70 91 86 101" stroke="#9A3C10" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    boss:  `<path d="M51 96 Q70 116 89 96" stroke="#8A2C08" stroke-width="4" fill="rgba(180,50,10,.2)" stroke-linecap="round"/>`,
  };
  const browCol = hr&&hr!=='#D0D0D0'?hr:'#5C3010';
  const browMap={
    happy: `<path d="M44 69 Q55 62 66 69" stroke="${browCol}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M74 69 Q85 62 96 69" stroke="${browCol}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    rush:  `<path d="M44 65 Q55 58 66 64" stroke="${browCol}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M74 64 Q85 58 96 65" stroke="${browCol}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    think: `<path d="M44 69 Q55 62 66 69" stroke="${browCol}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M74 67 Q85 71 96 67" stroke="${browCol}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    strict:`<path d="M44 66 L66 72" stroke="${browCol}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M74 72 L96 66" stroke="${browCol}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    boss:  `<path d="M44 66 Q55 59 66 66" stroke="${browCol}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M74 66 Q85 59 96 66" stroke="${browCol}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
  };
  const hairMap={
    bald:  `<ellipse cx="70" cy="54" rx="38" ry="24" fill="${hr}" opacity=".4"/>`,
    long:  `<path d="M28 72 Q24 108 28 132 Q44 152 70 155 Q96 152 112 132 Q116 108 112 72 Q96 26 70 30 Q44 26 28 72 Z" fill="${hr}"/><path d="M30 70 Q70 28 110 70 Q108 50 70 38 Q32 50 30 70 Z" fill="${hr}"/>`,
    short: `<path d="M29 68 Q70 28 111 68 Q109 50 70 40 Q31 50 29 68 Z" fill="${hr}"/>`,
    bun:   `<path d="M30 68 Q70 34 110 68" fill="none" stroke="${hr}" stroke-width="16" stroke-linecap="round"/><ellipse cx="70" cy="36" rx="19" ry="16" fill="${hr}"/>`,
    back:  `<path d="M30 66 Q70 28 110 66 Q106 50 70 42 Q34 50 30 66 Z" fill="${hr}"/>`,
  };
  const glasses = c.glasses ? `<rect x="40" y="70" width="28" height="20" rx="9" fill="rgba(180,220,255,.18)" stroke="#2C1810" stroke-width="2.5"/><rect x="72" y="70" width="28" height="20" rx="9" fill="rgba(180,220,255,.18)" stroke="#2C1810" stroke-width="2.5"/><line x1="68" y1="80" x2="72" y2="80" stroke="#2C1810" stroke-width="2.5"/>` : '';
  const beard = c.beard ? `<path d="M48 102 Q70 124 92 102 Q90 122 70 130 Q50 122 48 102 Z" fill="${hr}" opacity=".88"/>` : '';
  const h=Math.round(w*1.5);
  return `<svg width="${w}" height="${h}" viewBox="0 0 140 210" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="sk${id}" cx="38%" cy="30%" r="65%"><stop offset="0%" stop-color="${skLight}"/><stop offset="60%" stop-color="${sk}"/><stop offset="100%" stop-color="${skDark}"/></radialGradient>
    <radialGradient id="sh${id}" cx="38%" cy="20%" r="75%"><stop offset="0%" stop-color="${sh}"/><stop offset="100%" stop-color="${shDark}"/></radialGradient>
    <radialGradient id="pt${id}" cx="50%" cy="15%" r="85%"><stop offset="0%" stop-color="${pants}"/><stop offset="100%" stop-color="#0E1520"/></radialGradient>
    <filter id="drp${id}"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="rgba(42,26,14,.38)"/></filter>
  </defs>
  <ellipse cx="70" cy="207" rx="46" ry="6" fill="rgba(42,26,14,.25)"/>
  <ellipse cx="47" cy="203" rx="21" ry="9" fill="#100804"/><ellipse cx="93" cy="203" rx="21" ry="9" fill="#100804"/>
  <rect x="35" y="167" width="25" height="38" rx="10" fill="url(#pt${id})" stroke="#0E1520" stroke-width="2"/>
  <rect x="80" y="167" width="25" height="38" rx="10" fill="url(#pt${id})" stroke="#0E1520" stroke-width="2"/>
  <path d="M20 122 Q18 172 33 177 L107 177 Q122 172 120 122 Q103 109 70 107 Q37 109 20 122 Z" fill="url(#sh${id})" stroke="${shDark}" stroke-width="2.5" filter="url(#drp${id})"/>
  <path d="M55 105 Q70 120 85 105 L83 113 Q70 126 57 113 Z" fill="url(#sk${id})" stroke="${skDark}" stroke-width="1.5"/>
  <ellipse cx="70" cy="76" rx="40" ry="42" fill="url(#sk${id})" stroke="${skDark}" stroke-width="2.5" filter="url(#drp${id})"/>
  ${hairMap[c.hairStyle]||''}
  <ellipse cx="30" cy="80" rx="11" ry="14" fill="url(#sk${id})" stroke="${skDark}" stroke-width="2"/>
  <ellipse cx="110" cy="80" rx="11" ry="14" fill="url(#sk${id})" stroke="${skDark}" stroke-width="2"/>
  <ellipse cx="56" cy="79" rx="13" ry="14" fill="white" stroke="${skDark}" stroke-width="2.5"/>
  <circle cx="57" cy="80" r="8.5" fill="#2C1A08"/><circle cx="57" cy="80" r="3" fill="#0A0402"/>
  <circle cx="61" cy="75" r="3.5" fill="white"/>
  <ellipse cx="84" cy="79" rx="13" ry="14" fill="white" stroke="${skDark}" stroke-width="2.5"/>
  <circle cx="85" cy="80" r="8.5" fill="#2C1A08"/><circle cx="85" cy="80" r="3" fill="#0A0402"/>
  <circle cx="89" cy="75" r="3.5" fill="white"/>
  ${browMap[c.mood]||browMap.happy}
  <ellipse cx="41" cy="92" rx="13" ry="9" fill="rgba(255,110,100,.28)"/>
  <ellipse cx="99" cy="92" rx="13" ry="9" fill="rgba(255,110,100,.28)"/>
  <path d="M66 88 Q70 95 74 88" stroke="${skDark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  ${mouthMap[c.mood]||mouthMap.happy}
  ${glasses}${beard}
  <path d="M20 125 Q4 138 3 155 Q3 168 15 171 Q27 167 32 156 Q36 142 38 130 Z" fill="url(#sh${id})" stroke="${shDark}" stroke-width="2"/>
  <path d="M120 125 Q136 138 137 155 Q137 168 125 171 Q113 167 108 156 Q104 142 102 130 Z" fill="url(#sh${id})" stroke="${shDark}" stroke-width="2"/>
  <ellipse cx="10" cy="172" rx="14" ry="12" fill="url(#sk${id})" stroke="${skDark}" stroke-width="2"/>
  <ellipse cx="130" cy="172" rx="14" ry="12" fill="url(#sk${id})" stroke="${skDark}" stroke-width="2"/>
</svg>`;
}

function maleSVG(w=150) {
  const h=Math.round(w*1.5); const id=uid();
  return `<svg width="${w}" height="${h}" viewBox="0 0 140 210" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="msk${id}" cx="42%" cy="35%" r="62%"><stop offset="0%" stop-color="#FDDCB8"/><stop offset="100%" stop-color="#D9955A"/></radialGradient>
    <radialGradient id="msh${id}" cx="50%" cy="20%" r="75%"><stop offset="0%" stop-color="#EF4444"/><stop offset="100%" stop-color="#9B1C1C"/></radialGradient>
    <radialGradient id="mcap${id}" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#EF3A2A"/><stop offset="100%" stop-color="#8B1010"/></radialGradient>
    <filter id="mdrp${id}"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="rgba(61,30,10,.4)"/></filter>
  </defs>
  <ellipse cx="70" cy="207" rx="44" ry="5" fill="rgba(61,43,31,.28)"/>
  <ellipse cx="47" cy="202" rx="20" ry="9" fill="#111"/><ellipse cx="93" cy="202" rx="20" ry="9" fill="#111"/>
  <rect x="35" y="168" width="24" height="36" rx="9" fill="#1a1a2a" stroke="#0a0a18" stroke-width="2"/>
  <rect x="81" y="168" width="24" height="36" rx="9" fill="#1a1a2a" stroke="#0a0a18" stroke-width="2"/>
  <path d="M20 122 Q18 172 34 176 L106 176 Q122 172 120 122 Q104 110 70 108 Q36 110 20 122 Z" fill="url(#msh${id})" stroke="#7B1010" stroke-width="2.5" filter="url(#mdrp${id})"/>
  <path d="M56 106 Q70 120 84 106 L82 113 Q70 124 58 113 Z" fill="url(#msk${id})" stroke="#C07840" stroke-width="1.5"/>
  <ellipse cx="70" cy="75" rx="39" ry="41" fill="url(#msk${id})" stroke="#C07840" stroke-width="2.5" filter="url(#mdrp${id})"/>
  <path d="M30 65 Q70 28 110 65 Q108 50 70 40 Q32 50 30 65 Z" fill="#2A1208"/>
  <path d="M28 60 L112 60 Q112 42 70 42 Q28 42 28 60 Z" fill="url(#mcap${id})" stroke="#6B0E0E" stroke-width="2.5"/>
  <path d="M20 68 Q70 55 120 68 L118 76 Q70 63 22 76 Z" fill="url(#mcap${id})" stroke="#6B0E0E" stroke-width="2.5"/>
  <circle cx="70" cy="46" r="13" fill="#FFC72C" stroke="#8B5E00" stroke-width="2"/>
  <path d="M61 52 L61 40 Q61 36 65 36 Q69 36 69 40 L69 52" fill="#DA291C"/><path d="M71 52 L71 40 Q71 36 75 36 Q79 36 79 40 L79 52" fill="#DA291C"/>
  <ellipse cx="31" cy="80" rx="10" ry="13" fill="url(#msk${id})" stroke="#C07840" stroke-width="2"/>
  <ellipse cx="109" cy="80" rx="10" ry="13" fill="url(#msk${id})" stroke="#C07840" stroke-width="2"/>
  <ellipse cx="56" cy="79" rx="12" ry="13" fill="white" stroke="#2C1810" stroke-width="2.5"/>
  <ellipse cx="84" cy="79" rx="12" ry="13" fill="white" stroke="#2C1810" stroke-width="2.5"/>
  <circle cx="57" cy="80" r="7.5" fill="#2C1A08"/><circle cx="60" cy="76" r="3.5" fill="white"/>
  <circle cx="85" cy="80" r="7.5" fill="#2C1A08"/><circle cx="88" cy="76" r="3.5" fill="white"/>
  <path d="M46 69 Q56 63 66 69" stroke="#2A1208" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M74 69 Q84 63 94 69" stroke="#2A1208" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="43" cy="91" rx="11" ry="8" fill="rgba(255,120,100,.32)"/>
  <ellipse cx="97" cy="91" rx="11" ry="8" fill="rgba(255,120,100,.32)"/>
  <path d="M67 88 Q70 93 73 88" stroke="#C07840" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M48 97 Q70 118 92 97" stroke="#A04820" stroke-width="4" fill="rgba(200,80,40,.2)" stroke-linecap="round"/>
  <path d="M52 97 Q70 114 88 97 Q70 103 52 97 Z" fill="rgba(255,255,255,.45)"/>
  <polygon points="70,116 61,128 70,157 79,128" fill="#FFC72C" stroke="#8B5E00" stroke-width="2"/>
  <path d="M20 124 Q4 136 3 152 Q3 165 14 168 Q25 164 30 154 Q34 140 36 128 Z" fill="url(#msh${id})" stroke="#7B1010" stroke-width="2"/>
  <path d="M120 124 Q136 136 137 152 Q137 165 126 168 Q115 164 110 154 Q106 140 104 128 Z" fill="url(#msh${id})" stroke="#7B1010" stroke-width="2"/>
  <ellipse cx="10" cy="169" rx="13" ry="11" fill="url(#msk${id})" stroke="#C07840" stroke-width="2"/>
  <ellipse cx="130" cy="169" rx="13" ry="11" fill="url(#msk${id})" stroke="#C07840" stroke-width="2"/>
</svg>`;
}

function femaleSVG(w=150) {
  const h=Math.round(w*1.5); const id=uid();
  return `<svg width="${w}" height="${h}" viewBox="0 0 140 210" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="fsk${id}" cx="42%" cy="35%" r="62%"><stop offset="0%" stop-color="#FDDCB8"/><stop offset="100%" stop-color="#D9955A"/></radialGradient>
    <radialGradient id="fsh${id}" cx="50%" cy="20%" r="75%"><stop offset="0%" stop-color="#EF4444"/><stop offset="100%" stop-color="#9B1C1C"/></radialGradient>
    <radialGradient id="fcap${id}" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#EF3A2A"/><stop offset="100%" stop-color="#8B1010"/></radialGradient>
    <radialGradient id="fhr${id}" cx="40%" cy="25%" r="70%"><stop offset="0%" stop-color="#A0622A"/><stop offset="100%" stop-color="#5A3010"/></radialGradient>
    <filter id="fdrp${id}"><feDropShadow dx="2" dy="5" stdDeviation="4" flood-color="rgba(61,30,10,.4)"/></filter>
  </defs>
  <ellipse cx="70" cy="207" rx="44" ry="5" fill="rgba(61,43,31,.28)"/>
  <ellipse cx="47" cy="202" rx="20" ry="9" fill="#111"/><ellipse cx="93" cy="202" rx="20" ry="9" fill="#111"/>
  <rect x="35" y="168" width="24" height="36" rx="9" fill="#1a1a2a" stroke="#0a0a18" stroke-width="2"/>
  <rect x="81" y="168" width="24" height="36" rx="9" fill="#1a1a2a" stroke="#0a0a18" stroke-width="2"/>
  <path d="M20 122 Q18 172 34 176 L106 176 Q122 172 120 122 Q104 110 70 108 Q36 110 20 122 Z" fill="url(#fsh${id})" stroke="#7B1010" stroke-width="2.5" filter="url(#fdrp${id})"/>
  <path d="M100 62 Q108 56 116 60 Q132 64 136 86 Q140 110 134 132 Q128 150 120 162 Q112 142 114 120 Q116 98 110 78 Q104 66 100 62 Z" fill="url(#fhr${id})" stroke="#4A2808" stroke-width="1.5"/>
  <path d="M56 106 Q70 120 84 106 L82 113 Q70 124 58 113 Z" fill="url(#fsk${id})" stroke="#C07840" stroke-width="1.5"/>
  <ellipse cx="70" cy="75" rx="39" ry="41" fill="url(#fsk${id})" stroke="#C07840" stroke-width="2.5" filter="url(#fdrp${id})"/>
  <path d="M30 70 Q22 90 24 116 Q30 132 38 142 Q34 116 32 88 Q30 76 30 70 Z" fill="url(#fhr${id})" stroke="#4A2808" stroke-width="1"/>
  <path d="M28 60 L112 60 Q112 42 70 42 Q28 42 28 60 Z" fill="url(#fcap${id})" stroke="#6B0E0E" stroke-width="2.5"/>
  <path d="M20 68 Q70 55 120 68 L118 76 Q70 63 22 76 Z" fill="url(#fcap${id})" stroke="#6B0E0E" stroke-width="2.5"/>
  <circle cx="108" cy="66" r="7" fill="#DA291C" stroke="#8B0000" stroke-width="2.5"/>
  <circle cx="70" cy="46" r="13" fill="#FFC72C" stroke="#8B5E00" stroke-width="2"/>
  <path d="M61 52 L61 40 Q61 36 65 36 Q69 36 69 40 L69 52" fill="#DA291C"/><path d="M71 52 L71 40 Q71 36 75 36 Q79 36 79 40 L79 52" fill="#DA291C"/>
  <ellipse cx="31" cy="80" rx="10" ry="13" fill="url(#fsk${id})" stroke="#C07840" stroke-width="2"/>
  <ellipse cx="109" cy="80" rx="10" ry="13" fill="url(#fsk${id})" stroke="#C07840" stroke-width="2"/>
  <ellipse cx="56" cy="79" rx="13" ry="14" fill="white" stroke="#2C1810" stroke-width="2.5"/>
  <ellipse cx="84" cy="79" rx="13" ry="14" fill="white" stroke="#2C1810" stroke-width="2.5"/>
  <circle cx="57" cy="80" r="8" fill="#2C1A08"/><circle cx="60" cy="76" r="3.5" fill="white"/>
  <circle cx="85" cy="80" r="8" fill="#2C1A08"/><circle cx="88" cy="76" r="3.5" fill="white"/>
  <path d="M44 68 Q55 60 67 66" stroke="#7B4A2A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M73 66 Q85 60 96 68" stroke="#7B4A2A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="43" cy="92" rx="13" ry="9" fill="rgba(255,120,140,.4)"/>
  <ellipse cx="97" cy="92" rx="13" ry="9" fill="rgba(255,120,140,.4)"/>
  <path d="M67 88 Q70 93 73 88" stroke="#C07840" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M50 96 Q70 115 90 96" stroke="#A04820" stroke-width="3.5" fill="rgba(200,80,40,.2)" stroke-linecap="round"/>
  <polygon points="70,116 61,128 70,154 79,128" fill="#FFC72C" stroke="#8B5E00" stroke-width="2"/>
  <path d="M20 124 Q4 136 3 152 Q3 165 14 168 Q25 164 30 154 Q34 140 36 128 Z" fill="url(#fsh${id})" stroke="#7B1010" stroke-width="2"/>
  <path d="M120 124 Q136 136 137 152 Q137 165 126 168 Q115 164 110 154 Q106 140 104 128 Z" fill="url(#fsh${id})" stroke="#7B1010" stroke-width="2"/>
  <ellipse cx="10" cy="169" rx="13" ry="11" fill="url(#fsk${id})" stroke="#C07840" stroke-width="2"/>
  <ellipse cx="130" cy="169" rx="13" ry="11" fill="url(#fsk${id})" stroke="#C07840" stroke-width="2"/>
</svg>`;
}

function employeeSVG(w=150){ return G.character==='female'?femaleSVG(w):maleSVG(w); }

function registerSVG(){
  return `<svg width="190" height="200" viewBox="0 0 190 200" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="112" width="174" height="80" rx="14" fill="#4A3728" stroke="#3D2B1F" stroke-width="3"/>
    <rect x="16" y="120" width="158" height="64" rx="10" fill="#2C1810"/>
    <rect x="14" y="22" width="162" height="68" rx="10" fill="#4A3728" stroke="#3D2B1F" stroke-width="3"/>
    <rect x="20" y="28" width="150" height="56" rx="8" fill="#001a00"/>
    <text x="95" y="48" text-anchor="middle" font-size="11" fill="#00ff41" font-family="monospace" font-weight="bold">McDONALD'S®</text>
    <text x="95" y="64" text-anchor="middle" font-size="9" fill="#00cc33" font-family="monospace" id="register-display">Bienvenido</text>
    <text x="95" y="78" text-anchor="middle" font-size="8" fill="#009922" font-family="monospace">HORA PICO</text>
    <rect x="114" y="124" width="58" height="42" rx="8" fill="#22c55e" stroke="#166534" stroke-width="2.5"/>
    <text x="143" y="148" text-anchor="middle" font-size="11" fill="white" font-weight="900" font-family="sans-serif">COBRAR</text>
  </svg>`;
}

function grillSVG(meatColor='#8B0000', innerColor='#A0522D'){
  return `<svg width="300" height="210" viewBox="0 0 300 210" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="110" width="280" height="88" rx="16" fill="#4A3728" stroke="#3D2B1F" stroke-width="3.5"/>
    <rect x="20" y="120" width="260" height="70" rx="12" fill="#2C1810"/>
    <rect x="14" y="22" width="272" height="92" rx="12" fill="#555" stroke="#3D2B1F" stroke-width="3.5"/>
    <rect x="20" y="28" width="260" height="80" rx="10" fill="#444"/>
    <line x1="20" y1="44" x2="280" y2="44" stroke="#2a2a2a" stroke-width="4"/><line x1="20" y1="58" x2="280" y2="58" stroke="#2a2a2a" stroke-width="4"/>
    <line x1="20" y1="72" x2="280" y2="72" stroke="#2a2a2a" stroke-width="4"/><line x1="20" y1="86" x2="280" y2="86" stroke="#2a2a2a" stroke-width="4"/>
    <ellipse cx="150" cy="64" rx="68" ry="38" fill="${meatColor}" stroke="#2C1810" stroke-width="2.5" id="meat-outer"/>
    <ellipse cx="150" cy="64" rx="54" ry="28" fill="${innerColor}" id="meat-inner"/>
  </svg>`;
}

function fryerSVG(fryColor='#F5DEB3'){
  return `<svg width="260" height="230" viewBox="0 0 260 230" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="22" width="240" height="196" rx="16" fill="#3D2B1F" stroke="#2C1810" stroke-width="3.5"/>
    <rect x="18" y="30" width="224" height="180" rx="12" fill="#2C1810"/>
    <rect x="26" y="38" width="208" height="124" rx="10" fill="#b8860b"/>
    <rect x="36" y="44" width="188" height="112" rx="6" fill="none" stroke="#aaa" stroke-width="3"/>
    <rect x="52" y="52" width="12" height="72" rx="5" fill="${fryColor}" id="fry1"/>
    <rect x="68" y="46" width="12" height="78" rx="5" fill="${fryColor}" id="fry2"/>
    <rect x="84" y="54" width="12" height="70" rx="5" fill="${fryColor}" id="fry3"/>
    <rect x="100" y="48" width="12" height="76" rx="5" fill="${fryColor}" id="fry4"/>
    <rect x="116" y="52" width="12" height="72" rx="5" fill="${fryColor}" id="fry5"/>
    <rect x="132" y="46" width="12" height="78" rx="5" fill="${fryColor}" id="fry6"/>
    <rect x="148" y="54" width="12" height="70" rx="5" fill="${fryColor}" id="fry7"/>
    <rect x="164" y="50" width="12" height="74" rx="5" fill="${fryColor}" id="fry8"/>
    <rect x="180" y="52" width="12" height="72" rx="5" fill="${fryColor}" id="fry9"/>
  </svg>`;
}

function dispenserSVG(drinkName='Bebida'){
  return `<svg width="150" height="240" viewBox="0 0 150 240" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="26" width="106" height="168" rx="12" fill="#4A3728" stroke="#3D2B1F" stroke-width="3"/>
    <rect x="30" y="34" width="90" height="152" rx="10" fill="#3A2C20"/>
    <rect x="34" y="38" width="82" height="52" rx="6" fill="#001122" stroke="#3D2B1F" stroke-width="2"/>
    <text x="75" y="56" text-anchor="middle" font-size="9" fill="#00aaff" font-family="monospace">BEBIDAS</text>
    <text x="75" y="70" text-anchor="middle" font-size="8" fill="#0088cc" font-family="monospace" id="dispenser-display">${drinkName}</text>
    <text x="75" y="82" text-anchor="middle" font-size="7" fill="#006699" font-family="monospace">LLENANDO...</text>
    <rect x="46" y="148" width="58" height="26" rx="8" fill="#555" stroke="#3D2B1F" stroke-width="2"/>
    <rect x="54" y="154" width="42" height="14" rx="6" fill="#FFC72C" stroke="#3D2B1F" stroke-width="1.5"/>
    <rect x="62" y="174" width="26" height="20" rx="4" fill="#555" stroke="#3D2B1F" stroke-width="2"/>
  </svg>`;
}

function cupSVG(drinkData){
  const liq=drinkData.liquid||'#8B0000', foam=drinkData.foam||'#cc2222';
  return `<svg id="cup-svg" width="140" height="270" viewBox="0 0 140 270" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="cupClip"><path d="M18 14 L122 14 L106 258 L34 258 Z"/></clipPath></defs>
    <rect id="cup-liquid" x="0" y="258" width="140" height="0" fill="${liq}" clip-path="url(#cupClip)" style="transition:none"/>
    <rect id="cup-foam" x="0" y="258" width="140" height="0" fill="${foam}" clip-path="url(#cupClip)" opacity=".4" style="transition:none"/>
    <path d="M18 14 L122 14 L106 258 L34 258 Z" fill="rgba(255,255,255,.18)" stroke="#3D2B1F" stroke-width="4" stroke-linejoin="round"/>
    <line id="limit-line" x1="20" y1="76" x2="120" y2="76" stroke="#DA291C" stroke-width="3" stroke-dasharray="7,4"/>
    <rect x="104" y="66" width="36" height="16" rx="4" fill="#DA291C"/>
    <text x="122" y="78" text-anchor="middle" font-size="8" fill="white" font-weight="900">LÍMITE</text>
    <rect x="12" y="6" width="116" height="14" rx="5" fill="rgba(255,255,255,.2)" stroke="#3D2B1F" stroke-width="3"/>
    <rect x="52" y="0" width="36" height="12" rx="6" fill="rgba(255,255,255,.25)" stroke="#3D2B1F" stroke-width="2.5"/>
  </svg>`;
}

function ovenSVG(){
  return `<svg width="300" height="240" viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="20" width="280" height="200" rx="16" fill="#3A3A3A" stroke="#2A2A2A" stroke-width="3"/>
    <rect x="20" y="30" width="260" height="160" rx="12" fill="#1A1A1A"/>
    <rect x="30" y="40" width="240" height="140" rx="8" fill="#0A0A0A"/>
    <!-- Calor visual -->
    <rect x="30" y="40" width="240" height="140" rx="8" fill="url(#oven-heat)" id="oven-heat-rect" opacity="0"/>
    <defs>
      <radialGradient id="oven-heat" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#FF4400" stop-opacity=".8"/>
        <stop offset="100%" stop-color="#CC2200" stop-opacity=".1"/>
      </radialGradient>
    </defs>
    <!-- Puerta del horno - ventana -->
    <rect x="60" y="55" width="180" height="110" rx="8" fill="#111" stroke="#555" stroke-width="2"/>
    <text x="150" y="120" text-anchor="middle" font-size="48" id="oven-pizza-display">🍕</text>
    <!-- Controles -->
    <rect x="20" y="192" width="260" height="20" rx="6" fill="#2A2A2A"/>
    <circle cx="60" cy="202" r="8" fill="#555" stroke="#444" stroke-width="2"/>
    <circle cx="240" cy="202" r="8" fill="#FF4400" stroke="#CC2200" stroke-width="2"/>
    <text x="150" y="207" text-anchor="middle" font-size="9" fill="#FF8866" font-family="monospace">TEMPERATURA: 250°C</text>
  </svg>`;
}

/* ═══════════════════════════════════════════════════════════════
   AUDIO
═══════════════════════════════════════════════════════════════ */
let actx=null;
function getCtx(){if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();return actx;}
function tone(f,d,t='sine',v=.14){
  try{const c=getCtx(),o=c.createOscillator(),g=c.createGain();
  o.connect(g);g.connect(c.destination);o.type=t;
  o.frequency.setValueAtTime(f,c.currentTime);
  g.gain.setValueAtTime(v,c.currentTime);
  g.gain.exponentialRampToValueAtTime(.001,c.currentTime+d);
  o.start();o.stop(c.currentTime+d);}catch(e){}
}
function playSuccess(){tone(523,.12);setTimeout(()=>tone(659,.12),120);setTimeout(()=>tone(784,.22),240);}
function playError()  {tone(180,.28,'sawtooth',.14);}
function playWarn()   {tone(440,.15,'triangle',.1);}
function playClick()  {tone(900,.07,'square',.07);}
function playFanfare(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.3),i*130));}
function playSizzle() {
  try{const c=getCtx(),buf=c.createBuffer(1,c.sampleRate*.4,c.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.08;
  const s=c.createBufferSource(),g=c.createGain();
  s.buffer=buf;s.connect(g);g.connect(c.destination);
  g.gain.setValueAtTime(.12,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.4);
  s.start();}catch(e){}
}
function playComboFanfare(){[784,1047,1175,1319,1568].forEach((f,i)=>setTimeout(()=>tone(f,.4,'sine',.2),i*100));}

/* ═══════════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════════ */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>{s.classList.remove('active');s.classList.add('hidden');});
  const el=document.getElementById(id);
  if(el){el.classList.remove('hidden');requestAnimationFrame(()=>el.classList.add('active'));}
  if(!id.includes('pause')) G.activeScreen=id;
}
function toast(msg,type='',dur=2200){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='toast '+type;
  setTimeout(()=>t.classList.add('hidden'),dur);
}
/**
 * Transición de estado. Devuelve el nuevo estado para usar en closures:
 *   const s=setState(STATES.MEAT);
 *   setTimeout(()=>{if(!G.gameOver&&G.state===s) goFries();}, 900);
 */
function setState(s){
  G.state=s;
  return s;
}

/** Guard: retorna true si el estado actual no coincide con el esperado. */
function wrongState(expected){
  return G.gameOver || G.state!==expected;
}

function clearTimers(){
  if(G.drinkCleanup){G.drinkCleanup();G.drinkCleanup=null;}
  G.timers.forEach(id=>{clearInterval(id);clearTimeout(id);});
  G.timers=[];
  if(G.timerRaf){cancelAnimationFrame(G.timerRaf);G.timerRaf=null;}
  if(G.animRaf){cancelAnimationFrame(G.animRaf);G.animRaf=null;}
}
function diff(){
  const p=ACTIVE_PRESET;
  return p.diff[Math.min(G.client-1, p.diff.length-1)];
}
function fmtT(ms){const s=Math.floor(ms/1000);return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
function bubble(cont){
  const b=document.createElement('div');
  b.style.cssText=`position:absolute;border-radius:50%;background:rgba(218,170,0,.4);width:${7+Math.random()*12}px;height:${7+Math.random()*12}px;left:${8+Math.random()*82}%;bottom:${Math.random()*30}%;animation:bubble ${.7+Math.random()*.9}s ease-out forwards;pointer-events:none;`;
  cont.appendChild(b);setTimeout(()=>b.remove(),1700);
}
function steam(cont){
  const s=document.createElement('div');
  s.style.cssText=`position:absolute;border-radius:50%;background:rgba(255,255,255,.35);width:${12+Math.random()*16}px;height:${12+Math.random()*16}px;left:${20+Math.random()*60}%;bottom:${25+Math.random()*25}%;animation:steam-r ${.8+Math.random()*.8}s ease-out forwards;pointer-events:none;`;
  cont.appendChild(s);setTimeout(()=>s.remove(),1700);
}
function floatMoney(amount){
  const layer=document.getElementById('money-float-layer');
  const el=document.createElement('div');el.className='money-float';
  el.textContent=`+$${amount.toLocaleString('es-AR')}`;
  el.style.left=(60+Math.random()*20)+'%';el.style.top=(40+Math.random()*20)+'%';
  layer.appendChild(el);setTimeout(()=>el.remove(),1500);
}
function activateRushHour(){
  if(!ACTIVE_PRESET.rushHour)return;
  if(G.rushHourActive)return;G.rushHourActive=true;
  const banner=document.getElementById('rush-banner');
  banner.classList.remove('hidden');setTimeout(()=>banner.classList.add('hidden'),3200);
  document.getElementById('hud-rush-badge').classList.remove('hidden');
  toast('¡HORA PICO activada! ¡Máxima velocidad!','error',2800);
  playError();
}
function showComboPerfect(callback){
  const overlay=document.getElementById('combo-overlay');
  const sparklesEl=document.getElementById('combo-sparkles');
  sparklesEl.innerHTML='';
  const cols=['#FFC72C','#DA291C','#fff','#6BCB77','#74B9E0'];
  for(let i=0;i<60;i++){
    const p=document.createElement('div');p.className='sparkle-piece';
    p.style.cssText=`left:${Math.random()*100}%;top:-10px;background:${cols[Math.floor(Math.random()*cols.length)]};width:${8+Math.random()*14}px;height:${8+Math.random()*14}px;animation-duration:${1.8+Math.random()*2}s;animation-delay:${Math.random()*.8}s;`;
    sparklesEl.appendChild(p);
  }
  overlay.classList.remove('hidden');playComboFanfare();
  G.score+=500;G.money+=500;updateHUD();
  setTimeout(()=>{overlay.classList.add('hidden');sparklesEl.innerHTML='';if(callback)callback();},2500);
}

/* ═══════════════════════════════════════════════════════════════
   HUD
═══════════════════════════════════════════════════════════════ */
function getMultiplier(){if(G.streak>=10)return 3;if(G.streak>=6)return 2;if(G.streak>=3)return 1.5;return 1;}
function updateStreak(ok){if(ok){G.streak++;G.maxStreak=Math.max(G.maxStreak,G.streak);}else G.streak=0;}
function updateHUD(){
  document.getElementById('hud-client').textContent=`${G.client}/${G.total}`;
  const heartSVG=(filled)=>`<svg width="18" height="18" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle"><path d="M10 17 C10 17 2 11 2 6 A4 4 0 0 1 10 4 A4 4 0 0 1 18 6 C18 11 10 17 10 17Z" fill="${filled?'#DA291C':'#6B4C3B'}" stroke="${filled?'#8B0E0E':'#3D2B1F'}" stroke-width="1.5"/></svg>`;
  document.getElementById('hud-lives').innerHTML=heartSVG(true).repeat(G.lives)+heartSVG(false).repeat(Math.max(0,3-G.lives));
  document.getElementById('hud-progress-fill').style.width=((G.client-1)/G.total*100)+'%';
  const satEl=document.getElementById('hud-satisfaction');
  satEl.textContent=G.sat+'%';satEl.classList.toggle('low',G.sat<=30);
  const sf=document.getElementById('hud-sat-fill');
  sf.style.width=G.sat+'%';sf.style.background=G.sat>60?'#6BCB77':G.sat>30?'#FFD166':'#F4947A';
  document.getElementById('hud-score').textContent=G.score;
  document.getElementById('hud-money').textContent='$'+G.money.toLocaleString('es-AR');
  const multEl=document.getElementById('hud-mult');
  if(multEl){const mult=getMultiplier();multEl.textContent=`x${mult.toFixed(mult%1===0?0:1)}`;multEl.parentElement.classList.toggle('hud-mult-active',mult>1);}
  const diffEl=document.getElementById('hud-diff');
  if(diffEl)diffEl.textContent=ACTIVE_PRESET.emoji+' '+ACTIVE_PRESET.label;
}
function regError(pen=15,reason=''){
  G.errors++;G.sat=Math.max(0,G.sat-pen);
  if(reason)G.loseReason=reason;
  G.streak=0;G.lives=Math.max(0,G.lives-1);
  playError();updateHUD();
  if(G.sat<=0||G.lives<=0){endGame(false);return true;}
  return false;
}
function addScore(pts,lbl=''){
  const mult=getMultiplier();const finalPts=Math.round(pts*mult);
  G.score+=finalPts;
  if(lbl){const multTxt=mult>1?` (x${mult.toFixed(mult%1===0?0:1)})`:'';toast(`+${finalPts} pts${multTxt} — ${lbl}`,'success',1600);}
  updateHUD();
}

/* ── CALIFICACIÓN POR ETAPA (estilo Papa's) ──────────────────── */
function recordStageScore(key, pct){
  G.stageScores[key] = Math.round(pct);
}

/* ── RESUMEN PAPA'S STYLE ────────────────────────────────────── */
function showStageScore(stageData, onNext){
  setState(STATES.RESULT);
  clearTimers();
  showScreen('screen-stage-score');

  // stageData: [{label, score, icon}]
  const avg = Math.round(stageData.reduce((s,x)=>s+x.score,0)/stageData.length);
  const stars = avg>=95?3:avg>=75?2:1;

  G.stars.push(stars);
  G.clientScores.push(avg);

  const faceSVGs={
    1:`<svg viewBox="0 0 60 60" width="48" height="48" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="28" fill="#FFD84A" stroke="#C89800" stroke-width="2"/><circle cx="22" cy="24" r="4" fill="#3D2B1F"/><circle cx="38" cy="24" r="4" fill="#3D2B1F"/><line x1="20" y1="42" x2="40" y2="42" stroke="#3D2B1F" stroke-width="2.5"/></svg>`,
    2:`<svg viewBox="0 0 60 60" width="48" height="48" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="28" fill="#FFD84A" stroke="#C89800" stroke-width="2"/><circle cx="22" cy="24" r="4" fill="#3D2B1F"/><circle cx="38" cy="24" r="4" fill="#3D2B1F"/><path d="M18 40 Q30 50 42 40" fill="none" stroke="#3D2B1F" stroke-width="2.5"/></svg>`,
    3:`<svg viewBox="0 0 60 60" width="48" height="48" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="28" fill="#FFD84A" stroke="#C89800" stroke-width="2"/><circle cx="22" cy="22" r="5" fill="#3D2B1F"/><circle cx="38" cy="22" r="5" fill="#3D2B1F"/><path d="M16 38 Q30 54 44 38" fill="#DA291C" stroke="#8B0E0E" stroke-width="1.5"/></svg>`,
  };

  const titleEl=document.getElementById('ss-title');
  titleEl.innerHTML=faceSVGs[stars]+` <span>${avg>=95?'¡Pedido Perfecto!':avg>=75?'¡Buen Trabajo!':'Completado'}</span>`;

  const list=document.getElementById('ss-list');list.innerHTML='';
  stageData.forEach(item=>{
    const li=document.createElement('li');li.className='ss-item';
    const bar=`<div class="ss-bar-wrap"><div class="ss-bar-fill" style="width:${item.score}%;background:${item.score>=90?'#22c55e':item.score>=70?'#facc15':'#f87171'}"></div></div>`;
    li.innerHTML=`<span class="ss-icon">${item.icon}</span><span class="ss-label">${item.label}</span>${bar}<span class="ss-pct" style="color:${item.score>=90?'#4ade80':item.score>=70?'#facc15':'#f87171'}">${item.score}%</span>`;
    list.appendChild(li);
  });

  document.getElementById('ss-total').textContent=`Promedio: ${avg}%`;

  const sr=document.getElementById('ss-stars');sr.innerHTML='';
  for(let i=1;i<=3;i++){
    const s=document.createElement('span');s.className='star';
    s.innerHTML=`<svg viewBox="0 0 24 24" width="36" height="36" xmlns="http://www.w3.org/2000/svg"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="${i<=stars?'#FFC72C':'#D0C0A0'}" stroke="${i<=stars?'#C89800':'#A0907A'}" stroke-width="1.5"/></svg>`;
    if(i>stars)s.style.filter='grayscale(1)';
    sr.appendChild(s);
    if(i<=stars)setTimeout(()=>s.classList.add('lit'),i*220);
  }

  const nb=document.getElementById('ss-next-btn');
  const resultS=G.state;
  if(G.client>=G.total){nb.textContent='Ver resultado final';nb.onclick=()=>{if(wrongState(resultS))return;playClick();endGame(true);};}
  else{nb.textContent=`Cliente ${G.client+1} →`;nb.onclick=()=>{if(wrongState(resultS))return;playClick();G.client++;startCycle();};}
}

/* ═══════════════════════════════════════════════════════════════
   PERSONAJE
═══════════════════════════════════════════════════════════════ */
function initCharacterScreen(){
  setState(STATES.CHARACTER_SELECT);
  document.getElementById('char-male-svg').innerHTML=maleSVG(120);
  document.getElementById('char-female-svg').innerHTML=femaleSVG(120);
  const startBtn=document.getElementById('char-start-btn');

  ['male','female'].forEach(ch=>{
    const card=document.getElementById('char-card-'+ch);
    card.addEventListener('click',()=>{
      playClick();
      document.querySelectorAll('.char-card').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      G.character=ch;
      startBtn.disabled=false;
    });
  });

  startBtn.addEventListener('click',()=>{
    if(!G.character)return;
    playClick();
    showScreen('screen-mode');
  });
}

/* ── MODO ────────────────────────────────────────────────────── */
function initModeScreen(){
  setState(STATES.MODE_SELECT);
  const startBtn=document.getElementById('mode-start-btn');
  ['burger','milkshake','pizza'].forEach(mode=>{
    const card=document.getElementById('mode-'+mode);
    card.addEventListener('click',()=>{
      playClick();
      document.querySelectorAll('.mode-card').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      G.gameMode=mode;
      startBtn.disabled=false;
    });
  });
  startBtn.addEventListener('click',()=>{
    if(!G.gameMode)return;
    playClick();
    showScreen('screen-welcome');
    const modes={burger:'HAMBURGUESAS',milkshake:'MILKSHAKES',pizza:'PIZZAS'};
    document.getElementById('wlc-mode-ribbon').textContent=`${modes[G.gameMode]} · ${ACTIVE_PRESET.label.toUpperCase()}`;
    const emp=document.getElementById('wlc-employee-svg');
    if(emp)emp.innerHTML=employeeSVG(140);
    const q=document.getElementById('wlc-queue');
    if(q){q.innerHTML='';CLIENTS.forEach(c=>{const d=document.createElement('div');d.className='q-client';d.innerHTML=clientSVG(c,62);q.appendChild(d);});}
  });
}

/* ═══════════════════════════════════════════════════════════════
   INICIO / CICLO
═══════════════════════════════════════════════════════════════ */
document.getElementById('start-btn').addEventListener('click',()=>{playClick();initGame();});
document.getElementById('welcome-lb-btn').addEventListener('click',()=>{playClick();showLeaderboard();});

function initGame(){
  const p=ACTIVE_PRESET;
  Object.assign(G,{
    client:1,lives:p.lives,sat:100,score:0,errors:0,
    startTime:Date.now(),results:{},stageScores:{},paused:false,
    money:0,stars:[],clientScores:[],rushHourActive:false,loseReason:'',
    streak:0,maxStreak:0,ms:{},pz:{},gameOver:false,
    state:STATES.IDLE,
    total:p.totalClients,
    difficulty:G.difficulty,
  });
  clearTimers();
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('hud-rush-badge').classList.add('hidden');
  document.getElementById('rush-banner').classList.add('hidden');
  updateHUD();
  startCycle();
}

function startCycle(){
  G.gameOver=false; // New cycle — re-enable callbacks
  clearTimers();
  const rushThreshold=ACTIVE_PRESET===DIFFICULTY_PRESETS.hard?3:4;
  if(G.client>=rushThreshold&&!G.rushHourActive)activateRushHour();
  G.order=genOrder(G.client-1);G.results={};G.stageScores={};updateHUD();

  if(G.gameMode==='burger')      showOrderScreen();
  else if(G.gameMode==='milkshake') showMSOrder();
  else if(G.gameMode==='pizza')  showPZOrder();
}

function genOrder(ci){
  return {
    burger:BURGERS[Math.min(ci,BURGERS.length-1)],
    fries: FRIES[ci<=1?0:ci<=3?1:2],
    drink: DRINKS_BURGER[Math.floor(Math.random()*DRINKS_BURGER.length)],
  };
}

/* ── TIMER DE ETAPA ──────────────────────────────────────────── */
function stageTimer(fillId,txtId,totalMs,onDone){
  if(G.timerRaf){cancelAnimationFrame(G.timerRaf);G.timerRaf=null;}
  const fill=document.getElementById(fillId),txt=document.getElementById(txtId);
  if(!fill)return;
  const start=performance.now();
  function tick(now){
    if(G.gameOver)return;
    if(G.paused){G.timerRaf=requestAnimationFrame(tick);return;}
    const ratio=Math.min((now-start)/totalMs,1);
    const rem=Math.max(0,totalMs-(now-start));
    fill.style.width=(1-ratio)*100+'%';
    fill.style.background=ratio>.75?'#F4947A':ratio>.5?'#FFD166':'#6BCB77';
    if(txt)txt.textContent=Math.ceil(rem/1000)+'s';
    if(ratio>=1){onDone();return;}
    G.timerRaf=requestAnimationFrame(tick);
  }
  G.timerRaf=requestAnimationFrame(tick);
}

/* ═══════════════════════════════════════════════════════════════
   ██████████████  MODO HAMBURGUESA  ██████████████
═══════════════════════════════════════════════════════════════ */

function showOrderScreen(){
  setState(STATES.ORDER);
  const ci=G.client-1,cli=CLIENTS[ci],ord=G.order,d=diff();
  showScreen('screen-order');
  document.getElementById('client-svg-wrap').innerHTML=clientSVG(cli,140);
  document.getElementById('speech-bubble').textContent=cli.speech;
  document.getElementById('customer-name').textContent=cli.name;
  document.getElementById('customer-personality').textContent=cli.tag;
  document.getElementById('ticket-num').textContent=String(G.client).padStart(3,'0');
  const regCol=document.getElementById('register-col');
  if(regCol)regCol.innerHTML=registerSVG();
  const total=ord.burger.price+ord.fries.price+ord.drink.price;
  document.getElementById('ticket-total').textContent='Total: $'+total.toLocaleString('es-AR');
  const list=document.getElementById('ticket-items');list.innerHTML='';
  [{icon:ord.burger.icon,name:ord.burger.name,price:ord.burger.price},
   {icon:ord.fries.icon,name:ord.fries.name,price:ord.fries.price},
   {icon:ord.drink.icon,name:ord.drink.name,price:ord.drink.price}
  ].forEach(item=>{
    const li=document.createElement('li');
    li.innerHTML=`<span>${item.icon}</span><span style="flex:1">${item.name}</span><span style="color:#DA291C;font-weight:900">$${item.price}</span>`;
    list.appendChild(li);
  });

  // Memorizar bebida; el timer de pedido es largo para poder leer bien
  const orderS=G.state;
  stageTimer('order-timer-fill','order-timer-txt',d.oT,()=>{if(wrongState(orderS))return;toast('¡Tiempo! A cocinar.','warning');recordStageScore('pedido',50);goMeat();});
  document.getElementById('order-ok-btn').onclick=()=>{if(wrongState(orderS))return;playClick();clearTimers();recordStageScore('pedido',100);goMeat();};
}

/* ── CARNE ─────────────────────────────────────────────────── */
function goMeat(){
  setState(STATES.MEAT);
  clearTimers();showScreen('screen-meat');
  document.getElementById('grill-wrap').innerHTML=grillSVG();
  document.getElementById('steam-wrap').innerHTML='';
  cookingStage({
    indId:'meat-indicator',lblId:'meat-state-label',timerF:'meat-timer-fill',timerT:'meat-timer-txt',
    btnId:'meat-btn',prtclId:'steam-wrap',key:'meat',isMeat:true,
    maxMs:diff().mT,onDone:goFries,
    rawLbl:'Cruda',okLbl:'Perfecta',burnLbl:'Quemada',
    scoreKey:'carne',
  });
}

/* ── PAPAS ──────────────────────────────────────────────────── */
function goFries(){
  setState(STATES.FRIES);
  clearTimers();showScreen('screen-fries');
  document.getElementById('fryer-wrap').innerHTML=fryerSVG();
  document.getElementById('bubble-wrap').innerHTML='';
  cookingStage({
    indId:'fries-indicator',lblId:'fries-state-label',timerF:'fries-timer-fill',timerT:'fries-timer-txt',
    btnId:'fries-btn',prtclId:'bubble-wrap',key:'fries',isMeat:false,
    maxMs:diff().fT,onDone:goDrink,
    rawLbl:'Crudas',okLbl:'Perfectas',burnLbl:'Quemadas',
    scoreKey:'papas',
  });
}

function cookingStage(cfg){
  const d=diff();
  const ind=document.getElementById(cfg.indId);
  const lbl=document.getElementById(cfg.lblId);
  const prtclCont=cfg.prtclId?document.getElementById(cfg.prtclId):null;
  let pos=0,dir=1,done=false;

  // ── FASE 2 FIX: align visual zone widths to match actual gs/ge ──
  // Needle travels pos*93% across the bar, so zones must match that scale.
  const cookBar=ind?ind.closest('.cook-bar'):null;
  if(cookBar){
    const rawEl=cookBar.querySelector('.z-raw');
    const perfEl=cookBar.querySelector('.z-perfect');
    const burnEl=cookBar.querySelector('.z-burnt');
    if(rawEl&&perfEl&&burnEl){
      rawEl.style.flex=`0 0 ${(d.gs*93).toFixed(2)}%`;
      perfEl.style.flex=`0 0 ${((d.ge-d.gs)*93).toFixed(2)}%`;
      burnEl.style.flex=`1 1 auto`;
    }
  }

  if(prtclCont){
    const pInt=setInterval(()=>{if(G.paused||done)return;if(cfg.isMeat)steam(prtclCont);else bubble(prtclCont);},380);
    G.timers.push(pInt);
  }
  playSizzle();
  const sInt=setInterval(()=>{if(!G.paused&&!done)playSizzle();},1900);G.timers.push(sInt);

  stageTimer(cfg.timerF,cfg.timerT,cfg.maxMs,()=>{if(!done){done=true;evalCook(cfg,.95);}});

  let lastT=performance.now();
  function anim(now){
    if(done)return;
    if(!G.paused){
      const dt=(now-lastT)/1000;lastT=now;
      pos+=dir*d.spd*dt;
      if(pos>=1){pos=1;dir=-1;}if(pos<=0){pos=0;dir=1;}
      ind.style.left=(pos*93)+'%';
      const zone=pos<d.gs?'raw':pos<=d.ge?'perfect':'burnt';
      ind.className=`cook-needle zone-${zone}`;
      lbl.className=`state-badge zone-${zone}`;
      if(cfg.isMeat){
        const oc=document.getElementById('meat-outer');const ic=document.getElementById('meat-inner');
        if(zone==='raw'){if(oc)oc.setAttribute('fill','#8B0000');if(ic)ic.setAttribute('fill','#A0522D');lbl.textContent=cfg.rawLbl;}
        else if(zone==='perfect'){if(oc)oc.setAttribute('fill','#8B3A00');if(ic)ic.setAttribute('fill','#CD853F');lbl.textContent=cfg.okLbl;}
        else{if(oc)oc.setAttribute('fill','#1A1A1A');if(ic)ic.setAttribute('fill','#333');lbl.textContent=cfg.burnLbl;}
      }else{
        const fc=zone==='raw'?'#F5DEB3':zone==='perfect'?'#DAA520':'#2C1810';
        ['fry1','fry2','fry3','fry4','fry5','fry6','fry7','fry8','fry9'].forEach(id=>{const el=document.getElementById(id);if(el)el.setAttribute('fill',fc);});
        lbl.textContent=zone==='raw'?cfg.rawLbl:zone==='perfect'?cfg.okLbl:cfg.burnLbl;
      }
    }else{lastT=performance.now();}
    G.animRaf=requestAnimationFrame(anim);
  }
  G.animRaf=requestAnimationFrame(anim);

  function retire(){if(done||G.paused)return;done=true;clearTimers();evalCook(cfg,pos);}
  document.getElementById(cfg.btnId).onclick=retire;
  function onSpc(e){if(e.code==='Space'&&!e.repeat){e.preventDefault();retire();}}
  document.addEventListener('keydown',onSpc,{once:true});
}

function evalCook(cfg,pos){
  const d=diff();let result,pts,scoreVal;
  if(pos>=d.gs&&pos<=d.ge){result='perfect';pts=120;scoreVal=100;playSuccess();updateStreak(true);}
  else if(pos<d.gs){result='raw';pts=0;scoreVal=30;toast(cfg.isMeat?'Carne cruda — ¡faltó cocción!':'Papas crudas','error');regError(10,cfg.isMeat?'Carne cruda':'Papas crudas');updateStreak(false);}
  else{result='burnt';pts=0;scoreVal=0;toast(cfg.isMeat?'¡Carne quemada!':'¡Papas quemadas!','error');regError(12,cfg.isMeat?'Carne quemada':'Papas quemadas');updateStreak(false);}
  G.results[cfg.key]=result;
  if(pts>0)addScore(pts,cfg.isMeat?'Carne perfecta':'Papas perfectas');
  recordStageScore(cfg.scoreKey,scoreVal);
  const cookState=G.state;
  const tid=setTimeout(()=>{if(!G.gameOver&&G.state===cookState){clearTimers();cfg.onDone();}},900);
  G.timers.push(tid);
}

/* ── BEBIDA (MEMORIA) ────────────────────────────────────────── */
function goDrink(){
  setState(STATES.DRINK);
  clearTimers();showScreen('screen-drink');
  const d=diff();
  const drink=G.order.drink;

  // Mostrar panel de elección
  document.getElementById('drink-choice-panel').style.display='flex';
  document.getElementById('drink-fill-panel').style.display='none';
  document.getElementById('drink-hint-text').textContent=d.memoryDrink?'¿Qué bebida pidió el cliente?':'Recordás: '+drink.name;

  // Construir opciones (siempre mostrar todas para elección)
  const grid=document.getElementById('drink-options-grid');grid.innerHTML='';
  const options=[...DRINKS_BURGER].sort(()=>Math.random()-.5);

  options.forEach(opt=>{
    const btn=document.createElement('button');
    btn.className='drink-option-btn';
    btn.innerHTML=`<span class="drink-opt-icon">${opt.icon}</span><span class="drink-opt-name">${opt.name}</span>`;
    const drinkS=G.state;
    btn.addEventListener('click',()=>{
      if(wrongState(drinkS))return;
      if(opt.name===drink.name){
        // Correcto: avanzar a llenar
        playSuccess();toast('¡Bebida correcta!','success',1200);
        recordStageScore('bebida_eleccion',100);
        startDrinkFill(drink,d);
      }else{
        btn.classList.add('wrong-answer');
        playError();
        toast(`✗ Era ${drink.name}, no ${opt.name}. ¡Perdiste el pedido!`,'error',2500);
        recordStageScore('bebida_eleccion',0);
        G.results.drink='wrong_choice';
        clearTimers();
        const lost=regError(20,'Bebida incorrecta');
        if(!lost){
          recordStageScore('bebida_llenado',0);
          G.results.drink='wrong';
          G.results.drinkFill='wrong';
          const tid=setTimeout(()=>{if(!G.gameOver&&G.state===drinkS)goBurger();},2500);
          G.timers.push(tid);
        }
      }
    });
    grid.appendChild(btn);
  });

  // Timer para elegir
  const drinkS=G.state;
  stageTimer('drink-timer-fill','drink-timer-txt',d.dT,()=>{
    if(wrongState(drinkS))return;
    if(document.getElementById('drink-choice-panel').style.display!=='none'){
      toast('¡Tiempo! Bebida incorrecta','error');
      recordStageScore('bebida_eleccion',0);
      recordStageScore('bebida_llenado',0);
      G.results.drink='timeout';
      regError(15,'No eligió bebida a tiempo');
      const tid=setTimeout(()=>{if(!G.gameOver&&G.state===drinkS)goBurger();},1000);
      G.timers.push(tid);
    }
  });
}

function startDrinkFill(drink,d){
  document.getElementById('drink-choice-panel').style.display='none';
  document.getElementById('drink-fill-panel').style.display='flex';
  document.getElementById('drink-name-label').textContent=drink.name;
  document.getElementById('dispenser-wrap').innerHTML=dispenserSVG(drink.name);
  document.getElementById('cup-svg-wrap').innerHTML=cupSVG(drink);

  const liquid=document.getElementById('cup-liquid');
  const foam=document.getElementById('cup-foam');
  const pctEl=document.getElementById('fill-pct');
  const stEl=document.getElementById('drink-state-label');
  const btn=document.getElementById('drink-btn');

  const CUP_H=244,LIMIT_PCT=74.6;
  let fillPct=0,filling=false,done=false;
  const RATE=18;

  function updateCup(){
    const pixH=(fillPct/100)*CUP_H;const yPos=258-pixH;
    if(liquid){liquid.setAttribute('y',String(yPos));liquid.setAttribute('height',String(pixH));}
    if(foam){foam.setAttribute('y',String(yPos-4));foam.setAttribute('height','8');}
    if(pctEl)pctEl.textContent=Math.round(fillPct)+'%';
    if(fillPct>=100){filling=false;stEl.textContent='¡Se derramó!';stEl.style.color='#DA291C';}
    else if(fillPct>=LIMIT_PCT){stEl.textContent='¡Ya casi! Soltá';stEl.style.color='#8B5E3C';}
    else{stEl.textContent='Mantené presionado para llenar';stEl.style.color='';}
  }

  // Single fill animation loop using animRaf
  let lastT=performance.now();
  function loop(now){
    if(done)return;
    const dt=(now-lastT)/1000;lastT=now;
    if(!G.paused&&filling&&fillPct<100){fillPct=Math.min(100,fillPct+RATE*dt);updateCup();}
    G.animRaf=requestAnimationFrame(loop);
  }
  G.animRaf=requestAnimationFrame(loop);

  // Stage timer uses timerRaf — separate from animRaf, no conflict
  stageTimer('drink-timer-fill','drink-timer-txt',d.dT,()=>{if(!done){done=true;filling=false;finalizeDrink(fillPct,LIMIT_PCT);}});

  function startF(e){e.preventDefault();if(done||G.paused)return;filling=true;lastT=performance.now();playSizzle();}
  function stopF(){if(!filling||done)return;filling=false;done=true;clearTimers();finalizeDrink(fillPct,LIMIT_PCT);}

  btn.addEventListener('mousedown',startF);
  btn.addEventListener('touchstart',startF,{passive:false});
  window.addEventListener('mouseup',stopF);
  window.addEventListener('touchend',stopF);

  let spHeld=false;
  function spDown(e){if(e.code==='Space'&&!e.repeat&&!done){e.preventDefault();spHeld=true;startF(e);}}
  function spUp(e){if(e.code==='Space'&&spHeld){spHeld=false;stopF();}}
  document.addEventListener('keydown',spDown);
  document.addEventListener('keyup',spUp);
  G.drinkCleanup=()=>{
    document.removeEventListener('keydown',spDown);
    document.removeEventListener('keyup',spUp);
    window.removeEventListener('mouseup',stopF);
    window.removeEventListener('touchend',stopF);
  };
}

function finalizeDrink(fillPct,limitPct){
  if(G.drinkCleanup){G.drinkCleanup();G.drinkCleanup=null;}
  const low=limitPct-18,high=limitPct+6;
  let result,pts,scoreVal;
  if(fillPct>=low&&fillPct<=high){result='perfect';pts=100;scoreVal=100;toast('¡Bebida perfecta! +100','success');playSuccess();updateStreak(true);}
  else if(fillPct<low){result='low';pts=20;scoreVal=40;toast('Muy poco líquido','error');regError(10,'Poca bebida');updateStreak(false);}
  else{result='spilled';pts=0;scoreVal=0;toast('¡Se derramó!','error');regError(15,'Bebida derramada');updateStreak(false);}
  G.results.drink=result;
  recordStageScore('bebida_llenado',scoreVal);
  if(pts>0)addScore(pts,'Bebida correcta');
  const fillState=G.state;
  const tid=setTimeout(()=>{if(!G.gameOver&&G.state===fillState){clearTimers();goBurger();}},1000);
  G.timers.push(tid);
}

/* ── HAMBURGUESA ─────────────────────────────────────────────── */
function goBurger(){
  setState(STATES.BURGER);
  clearTimers();showScreen('screen-burger');
  const d=diff(),ord=G.order,correct=ord.burger.ingredients;
  const distr=DISTRACTORS[d.dis]||[];

  const countMap={};
  correct.forEach(k=>{countMap[k]=(countMap[k]||0)+1;});

  let pool=[];
  Object.entries(countMap).forEach(([key,count])=>{for(let i=0;i<count;i++)pool.push({key,btnIndex:i});});
  distr.forEach(k=>{if(!countMap[k])pool.push({key:k,btnIndex:0});});
  pool=pool.sort(()=>Math.random()-.5);

  let built=[];

  // Mostrar referencia según dificultad
  const refEl=document.getElementById('burger-order-ref');
  if(d.showOrderRef){
    refEl.innerHTML='Orden: '+correct.map(k=>`<span class="ref-ing">${INGR[k]?.label||k}</span>`).join('<span class="ref-arr">→</span>');
    refEl.style.display='';
  }else{
    refEl.innerHTML='<span style="color:rgba(255,100,100,.6)">🧠 ¡Recordá el orden del pedido!</span>';
    refEl.style.display='';
  }

  const poolEl=document.getElementById('ingredients-pool');poolEl.innerHTML='';
  const allBtns=[];

  pool.forEach(({key,btnIndex})=>{
    const ing=INGR[key];if(!ing)return;
    const btn=document.createElement('button');
    btn.className='ing-btn'+(distr.includes(key)?' distractor':'');
    btn.dataset.key=key;btn.dataset.btnIndex=String(btnIndex);
    const totalNeeded=countMap[key]||1;
    const countBadge=totalNeeded>1?`<span class="ing-count-badge">×${totalNeeded}</span>`:'';
    const svgIcon=INGR_SVG[key]||`<span style="font-size:26px">${ing.icon}</span>`;
    btn.innerHTML=`<span class="ing-svg-wrap">${svgIcon}${countBadge}</span><span class="ing-lbl">${ing.label}</span>`;
    btn.addEventListener('click',()=>ingClick(key,btn,correct,built,allBtns,countMap));
    poolEl.appendChild(btn);allBtns.push(btn);
  });
  renderStack(built);
  document.getElementById('burger-undo-btn').onclick=()=>{
    if(!built.length)return;playClick();
    const removedKey=built.pop();renderStack(built);
    const usedOfType=allBtns.filter(b=>b.dataset.key===removedKey&&b.classList.contains('used'));
    if(usedOfType.length)usedOfType[usedOfType.length-1].classList.remove('used');
  };
  stageTimer('burger-timer-fill','burger-timer-txt',d.bT,()=>{toast('¡Tiempo!','warning');finalizeBurger(built,correct);});
}

function ingClick(key,btn,correct,built,allBtns,countMap){
  if(G.paused)return;
  const nextExpected=correct[built.length];
  if(key===nextExpected){
    const alreadyUsed=allBtns.filter(b=>b.dataset.key===key&&b.classList.contains('used')).length;
    const totalNeeded=countMap[key]||1;
    if(alreadyUsed>=totalNeeded){
      btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),500);
      playError();toast(`✗ Ya pusiste todas las ${INGR[key]?.label}`,'error',1200);return;
    }
    playClick();built.push(key);btn.classList.add('used');renderStack(built);
    if(built.length===correct.length){clearTimers();const burgerS=G.state;const t=setTimeout(()=>{if(!G.gameOver&&G.state===burgerS)finalizeBurger(built,correct);},400);G.timers.push(t);}
  }else{
    btn.classList.add('wrong');
    playError();
    if(ACTIVE_PRESET.instantKillOnWrongIngredient){
      // Hard: derrota instantánea, pierde el pedido completo
      toast(`✗ ¡${INGR[key]?.label} no va ahí! Pedido perdido.`,'error',3000);
      G.results.burger='instant_fail';
      recordStageScore('hamburguesa',0);
      clearTimers();
      const lost=regError(25,'Ingrediente incorrecto en hamburguesa');
      if(!lost){
        const burgerS=G.state;
        const tid=setTimeout(()=>{if(!G.gameOver&&G.state===burgerS)goDelivery();},2000);
        G.timers.push(tid);
      }
    }else{
      // Fácil/Intermedio: penalización leve, puede seguir intentando
      setTimeout(()=>btn.classList.remove('wrong'),600);
      toast(`✗ ${INGR[key]?.label} no va ahí — seguí intentando`,'error',1800);
      regError(ACTIVE_PRESET===DIFFICULTY_PRESETS.easy?8:15,'Ingrediente incorrecto en hamburguesa');
      updateStreak(false);
      // El jugador puede continuar armando la hamburguesa
    }
  }
}

function renderStack(stack){
  const el=document.getElementById('burger-stack');el.innerHTML='';
  stack.forEach((key,idx)=>{
    const d=document.createElement('div');d.className='stack-layer';d.dataset.key=key;
    const svgContent=INGR_SVG[key];
    if(svgContent)d.innerHTML=svgContent;else d.textContent=INGR[key]?.label||key;
    d.style.animation=`drop-in .38s cubic-bezier(.22,.68,0,1.25) ${idx*0.05}s both`;
    el.appendChild(d);
  });
}

function finalizeBurger(built,correct){
  clearTimers();
  const burgerS=G.state;
  if(G.results.burger==='instant_fail'){recordStageScore('hamburguesa',0);const t=setTimeout(()=>{if(!G.gameOver&&G.state===burgerS)goDelivery();},500);G.timers.push(t);return;}
  const ok=built.join(',')===correct.join(',');let pts=0,scoreVal=0;
  if(ok){pts=150;scoreVal=100;playSuccess();toast('¡Hamburguesa perfecta! +150','success');G.results.burger='perfect';updateStreak(true);}
  else{
    const m=built.filter((k,i)=>k===correct[i]).length;
    if(m>=correct.length*.6){pts=50;scoreVal=60;G.results.burger='partial';toast('Casi perfecta — +50','warning');updateStreak(false);}
    else{scoreVal=20;G.results.burger='wrong';toast('Hamburguesa incorrecta','error');regError(15,'Hamburguesa incorrecta');updateStreak(false);}
  }
  if(pts>0)addScore(pts,'Hamburguesa');
  recordStageScore('hamburguesa',scoreVal);
  const tid=setTimeout(()=>{if(!G.gameOver&&G.state===burgerS)goDelivery();},1000);
  G.timers.push(tid);
}

/* ── ENTREGA ─────────────────────────────────────────────────── */
function slotIconSVG(item){
  if(item==='burger')return `<span style="font-size:36px">🍔</span>`;
  if(item==='fries')return `<span style="font-size:36px">🍟</span>`;
  return `<span style="font-size:36px">🥤</span>`;
}

function goDelivery(){
  setState(STATES.DELIVERY);
  clearTimers();showScreen('screen-delivery');
  const d=diff(),ci=G.client-1,cli=CLIENTS[ci],drink=G.order.drink;
  document.getElementById('drag-drink-label').textContent=drink.name;
  const defig=document.getElementById('delivery-client-svg');
  if(defig)defig.innerHTML=clientSVG(cli,120);
  const dsp=document.getElementById('delivery-speech');
  if(dsp)dsp.textContent='¿Dónde está mi pedido?';

  const slots={burger:false,fries:false,drink:false};let dragItem=null;

  ['burger','fries','drink'].forEach(item=>{
    const el=document.getElementById('drag-'+item);
    el.classList.remove('placed');el.setAttribute('draggable',true);
  });
  ['burger','fries','drink'].forEach(s=>{
    const el=document.getElementById('slot-'+s);el.classList.remove('filled');
    const h={burger:'Burg.',fries:'Papas',drink:'Bebida'};
    el.innerHTML=`<span class="slot-hint">${h[s]}</span>`;
  });
  document.getElementById('deliver-btn').classList.add('hidden');

  document.querySelectorAll('.drag-card').forEach(el=>{
    el.addEventListener('dragstart',e=>{if(el.classList.contains('placed')){e.preventDefault();return;}dragItem=el.dataset.item;el.classList.add('dragging');e.dataTransfer.effectAllowed='move';});
    el.addEventListener('dragend',()=>el.classList.remove('dragging'));
  });
  document.querySelectorAll('.tray-slot').forEach(slot=>{
    slot.addEventListener('dragover',e=>{e.preventDefault();slot.classList.add('drag-over');});
    slot.addEventListener('dragleave',()=>slot.classList.remove('drag-over'));
    slot.addEventListener('drop',e=>{
      e.preventDefault();slot.classList.remove('drag-over');
      const sn=slot.dataset.slot;if(!dragItem)return;
      if(slots[sn]){toast('Slot ocupado','warning');return;}
      slots[sn]=true;document.getElementById('drag-'+dragItem).classList.add('placed');
      slot.classList.add('filled');slot.innerHTML=`<span class="slot-icon">${slotIconSVG(dragItem)}</span>`;
      playClick();dragItem=null;checkTray(slots,dsp);
    });
  });
  document.querySelectorAll('.drag-card').forEach(el=>{
    el.addEventListener('click',()=>{
      if(el.classList.contains('placed'))return;
      const item=el.dataset.item;if(slots[item])return;
      slots[item]=true;el.classList.add('placed');
      const slot=document.getElementById('slot-'+item);
      slot.classList.add('filled');slot.innerHTML=`<span class="slot-icon">${slotIconSVG(item)}</span>`;
      playClick();checkTray(slots,dsp);
    });
  });

  const delivS=G.state;
  stageTimer('delivery-timer-fill','delivery-timer-txt',d.dlT,()=>{if(wrongState(delivS))return;toast('¡Tiempo!','warning');finalizeDelivery(slots);});
  document.getElementById('deliver-btn').onclick=()=>{if(wrongState(delivS))return;playClick();clearTimers();finalizeDelivery(slots);};
}

function checkTray(slots,dsp){
  if(Object.values(slots).every(Boolean)){
    document.getElementById('deliver-btn').classList.remove('hidden');
    if(dsp)dsp.textContent='¡Todo listo! ¡Gracias!';
    playSuccess();toast('¡Todo en la bandeja! Entregá el pedido','success');
  }
}

function finalizeDelivery(slots){
  clearTimers();
  const ok=Object.values(slots).every(Boolean);
  G.results.delivery=ok?'complete':'incomplete';
  const scoreVal=ok?100:30;
  recordStageScore('entrega',scoreVal);
  if(ok){addScore(110,'Entrega completa');updateStreak(true);}
  else{regError(10,'Entrega incompleta');toast('Entrega incompleta','error');updateStreak(false);}

  const earned=calcEarnedMoney();
  G.money+=earned;updateHUD();floatMoney(earned);

  // Chequear combo
  const r=G.results;
  const allPerfect=r.meat==='perfect'&&r.fries==='perfect'&&(r.drink==='perfect')&&r.burger==='perfect'&&r.delivery==='complete';

  const stageData=[
    {label:'Pedido',      icon:'🧾', score:G.stageScores.pedido||100},
    {label:'Carne',       icon:'🍳', score:G.stageScores.carne||0},
    {label:'Papas',       icon:'🍟', score:G.stageScores.papas||0},
    {label:'Bebida',      icon:'🥤', score:Math.round(((G.stageScores.bebida_eleccion||0)+(G.stageScores.bebida_llenado||0))/2)},
    {label:'Hamburguesa', icon:'🍔', score:G.stageScores.hamburguesa||0},
    {label:'Entrega',     icon:'🛎️', score:scoreVal},
  ];

  const delivFinS=G.state;
  if(allPerfect){
    const tid=setTimeout(()=>{if(!G.gameOver&&G.state===delivFinS)showComboPerfect(()=>{if(!G.gameOver)showStageScore(stageData,null);});},800);
    G.timers.push(tid);
  }else{
    const tid=setTimeout(()=>{if(!G.gameOver&&G.state===delivFinS)showStageScore(stageData,null);},800);
    G.timers.push(tid);
  }
}

function calcEarnedMoney(){
  const r=G.results;const ord=G.order;
  if(!ord)return 0;
  const base=ord.burger.price+ord.fries.price+ord.drink.price;
  const meatMod=r.meat==='perfect'?1.0:0.7;
  const friesMod=r.fries==='perfect'?1.0:0.7;
  const drinkMod=r.drink==='perfect'?1.0:0.7;
  const burgerMod=r.burger==='perfect'?1.0:r.burger==='partial'?0.8:0.6;
  const delivMod=r.delivery==='complete'?1.0:0.7;
  return Math.round(base*meatMod*friesMod*drinkMod*burgerMod*delivMod);
}

/* ═══════════════════════════════════════════════════════════════
   ██████████████  MODO MILKSHAKE  ██████████████
═══════════════════════════════════════════════════════════════ */

function genMSOrder(ci){
  const flavor=MILKSHAKE_FLAVORS[Math.floor(Math.random()*MILKSHAKE_FLAVORS.length)];
  const sizeIdx=ci<=1?0:ci<=3?1:2;
  const size=MILKSHAKE_SIZES[sizeIdx];
  // Toppings: 0 a 2 al principio, hasta 3 al final
  const maxTop=Math.min(ci,3);
  const nTop=Math.floor(Math.random()*(maxTop+1));
  const tops=[...MILKSHAKE_TOPPINGS].sort(()=>Math.random()-.5).slice(0,nTop);
  return {flavor,size,toppings:tops,price:flavor.price+size.price};
}

function showMSOrder(){
  setState(STATES.MS_ORDER);
  clearTimers();
  G.ms.order=genMSOrder(G.client-1);
  const ord=G.ms.order,ci=G.client-1,cli=CLIENTS[ci],d=diff();
  showScreen('screen-ms-order');

  document.getElementById('ms-client-svg-wrap').innerHTML=clientSVG(cli,140);
  document.getElementById('ms-speech-bubble').textContent=cli.speech;
  document.getElementById('ms-customer-name').textContent=cli.name;
  document.getElementById('ms-customer-personality').textContent=cli.tag;
  document.getElementById('ms-ticket-num').textContent=String(G.client).padStart(3,'0');

  const list=document.getElementById('ms-ticket-items');list.innerHTML='';
  const items=[
    {icon:ord.flavor.icon,name:'Milkshake '+ord.flavor.name+' ('+ord.size.name+')'},
    ...ord.toppings.map(t=>({icon:t.icon,name:'Con '+t.name})),
  ];
  items.forEach(item=>{
    const li=document.createElement('li');
    li.innerHTML=`<span>${item.icon}</span><span style="flex:1">${item.name}</span>`;
    list.appendChild(li);
  });

  const msOrdS=G.state;
  stageTimer('ms-order-timer-fill','ms-order-timer-txt',d.oT,()=>{if(wrongState(msOrdS))return;recordStageScore('ms_pedido',50);showMSFlavor();});
  document.getElementById('ms-order-ok-btn').onclick=()=>{if(wrongState(msOrdS))return;playClick();clearTimers();recordStageScore('ms_pedido',100);showMSFlavor();};
}

function showMSFlavor(){
  setState(STATES.MS_FLAVOR);
  clearTimers();showScreen('screen-ms-flavor');
  const ord=G.ms.order,d=diff();
  const grid=document.getElementById('ms-flavor-grid');grid.innerHTML='';

  const msFlvS=G.state;
  MILKSHAKE_FLAVORS.forEach(fl=>{
    const btn=document.createElement('button');btn.className='ms-option-btn';
    btn.innerHTML=`<span class="ms-opt-icon">${fl.icon}</span><span>${fl.name}</span>`;
    btn.style.setProperty('--fl-color',fl.color);
    btn.addEventListener('click',()=>{
      if(wrongState(msFlvS))return;
      if(fl.name===ord.flavor.name){
        playSuccess();toast('¡Sabor correcto!','success',1200);
        recordStageScore('ms_sabor',100);
        G.ms.flavor=fl;showMSCup();
      }else{
        btn.classList.add('wrong-answer');playError();
        toast(`✗ Era ${ord.flavor.name}. ¡Pedido perdido!`,'error',2500);
        recordStageScore('ms_sabor',0);
        G.ms.flavor=fl;
        clearTimers();
        const lost=regError(20,'Sabor incorrecto');
        if(!lost){
          recordStageScore('ms_vaso',0);recordStageScore('ms_llenado',0);recordStageScore('ms_toppings',0);
          const tid=setTimeout(()=>{if(!G.gameOver&&G.state===msFlvS)showMSDelivery();},2000);
          G.timers.push(tid);
        }
      }
    });
    grid.appendChild(btn);
  });

  stageTimer('ms-flavor-timer-fill','ms-flavor-timer-txt',d.dT,()=>{
    if(wrongState(msFlvS))return;
    recordStageScore('ms_sabor',0);toast('¡Tiempo!','error');
    regError(15,'No eligió sabor a tiempo');
    const tid=setTimeout(()=>{if(!G.gameOver&&G.state===msFlvS)showMSDelivery();},1000);
    G.timers.push(tid);
  });
}

function showMSCup(){
  setState(STATES.MS_CUP);
  clearTimers();showScreen('screen-ms-cup');
  const ord=G.ms.order,d=diff();
  const grid=document.getElementById('ms-cup-grid');grid.innerHTML='';
  document.getElementById('ms-cup-prompt').textContent=`Tamaño pedido: ${d.memoryDrink?'???':ord.size.name}`;

  const msCupS=G.state;
  MILKSHAKE_SIZES.forEach(sz=>{
    const btn=document.createElement('button');btn.className='ms-cup-btn';
    const h=sz.height;
    btn.innerHTML=`<svg width="60" height="${Math.round(h*.7+20)}" viewBox="0 0 60 ${h+20}" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 4 L52 4 L44 ${h+10} L16 ${h+10} Z" fill="${ord.flavor.color||'#8B0000'}" stroke="#3D2B1F" stroke-width="3" opacity=".8"/>
      <rect x="8" y="0" width="44" height="8" rx="4" fill="rgba(255,255,255,.3)" stroke="#3D2B1F" stroke-width="2"/>
      <rect x="22" y="-4" width="16" height="8" rx="4" fill="rgba(255,255,255,.35)" stroke="#3D2B1F" stroke-width="2"/>
    </svg><span>${sz.name}</span>`;
    btn.addEventListener('click',()=>{
      if(wrongState(msCupS))return;
      if(sz.name===ord.size.name){
        playSuccess();toast('¡Tamaño correcto!','success',1200);
        recordStageScore('ms_vaso',100);G.ms.size=sz;showMSFill();
      }else{
        btn.classList.add('wrong-answer');playError();
        toast(`✗ Era ${ord.size.name}. Penalización.`,'error',2000);
        recordStageScore('ms_vaso',0);G.ms.size=sz;
        const lostSz=regError(12,'Tamaño incorrecto');
        if(!lostSz){const t=setTimeout(()=>{if(!G.gameOver&&G.state===msCupS)showMSFill();},1500);G.timers.push(t);}
      }
    });
    grid.appendChild(btn);
  });

  stageTimer('ms-cup-timer-fill','ms-cup-timer-txt',d.dT*.7,()=>{
    if(wrongState(msCupS))return;
    recordStageScore('ms_vaso',0);toast('¡Tiempo!','error');
    regError(10,'No eligió vaso a tiempo');
    G.ms.size=MILKSHAKE_SIZES[0];
    const tid=setTimeout(()=>{if(!G.gameOver&&G.state===msCupS)showMSFill();},800);
    G.timers.push(tid);
  });
}

function showMSFill(){
  setState(STATES.MS_FILL);
  clearTimers();showScreen('screen-ms-fill');
  const fl=G.ms.flavor||G.ms.order.flavor;
  const d=diff();

  const display=document.getElementById('ms-cup-display');
  display.innerHTML=`<svg width="120" height="220" viewBox="0 0 120 220" xmlns="http://www.w3.org/2000/svg">
    <defs><clipPath id="msCupClip"><path d="M15 10 L105 10 L90 210 L30 210 Z"/></clipPath></defs>
    <rect id="ms-liquid" x="0" y="210" width="120" height="0" fill="${fl.color}" clip-path="url(#msCupClip)" style="transition:none"/>
    <path d="M15 10 L105 10 L90 210 L30 210 Z" fill="rgba(255,255,255,.15)" stroke="#3D2B1F" stroke-width="3" stroke-linejoin="round"/>
    <line x1="15" y1="60" x2="105" y2="60" stroke="#DA291C" stroke-width="2.5" stroke-dasharray="6,4"/>
    <rect x="88" y="52" width="32" height="14" rx="3" fill="#DA291C"/>
    <text x="104" y="63" text-anchor="middle" font-size="7" fill="white" font-weight="900">LÍMITE</text>
    <rect x="10" y="4" width="100" height="12" rx="5" fill="rgba(255,255,255,.2)" stroke="#3D2B1F" stroke-width="2.5"/>
    <rect x="44" y="0" width="32" height="10" rx="5" fill="rgba(255,255,255,.25)" stroke="#3D2B1F" stroke-width="2"/>
  </svg>`;

  const msLiquid=display.querySelector('#ms-liquid');
  const CUP_H=200,LIMIT_PCT=71;
  let fillPct=0,filling=false,done=false;const RATE=16;

  const btn=document.getElementById('ms-fill-btn');
  const stEl=document.getElementById('ms-fill-state');
  const pctEl=document.getElementById('ms-fill-pct');

  function updateMSCup(){
    const pixH=(fillPct/100)*CUP_H;const yPos=210-pixH;
    if(msLiquid){msLiquid.setAttribute('y',String(yPos));msLiquid.setAttribute('height',String(pixH));}
    if(pctEl)pctEl.textContent=Math.round(fillPct)+'%';
    stEl.textContent=fillPct>=100?'¡Se derramó!':fillPct>=LIMIT_PCT?'¡Ya casi! Soltá':'Mantené presionado para llenar';
  }

  let lastT=performance.now();
  function loop(now){
    if(done)return;
    const dt=(now-lastT)/1000;lastT=now;
    if(!G.paused&&filling&&fillPct<100){fillPct=Math.min(100,fillPct+RATE*dt);updateMSCup();}
    G.animRaf=requestAnimationFrame(loop);
  }
  G.animRaf=requestAnimationFrame(loop);

  stageTimer('ms-fill-timer-fill','ms-fill-timer-txt',d.dT,()=>{if(!done){done=true;filling=false;finalizeMSFill(fillPct,LIMIT_PCT);}});

  function startF(e){e.preventDefault();if(done||G.paused)return;filling=true;lastT=performance.now();playSizzle();}
  function stopF(){if(!filling||done)return;filling=false;done=true;clearTimers();finalizeMSFill(fillPct,LIMIT_PCT);}
  btn.addEventListener('mousedown',startF);btn.addEventListener('touchstart',startF,{passive:false});
  window.addEventListener('mouseup',stopF);window.addEventListener('touchend',stopF);
  let spHeld=false;
  function spDown(e){if(e.code==='Space'&&!e.repeat&&!done){e.preventDefault();spHeld=true;startF(e);}}
  function spUp(e){if(e.code==='Space'&&spHeld){spHeld=false;stopF();}}
  document.addEventListener('keydown',spDown);document.addEventListener('keyup',spUp);
  G.drinkCleanup=()=>{
    document.removeEventListener('keydown',spDown);
    document.removeEventListener('keyup',spUp);
    window.removeEventListener('mouseup',stopF);
    window.removeEventListener('touchend',stopF);
  };
}

function finalizeMSFill(fillPct,limitPct){
  if(G.drinkCleanup){G.drinkCleanup();G.drinkCleanup=null;}
  const low=limitPct-16,high=limitPct+8;
  let scoreVal;
  if(fillPct>=low&&fillPct<=high){scoreVal=100;playSuccess();toast('¡Llenado perfecto!','success');updateStreak(true);}
  else if(fillPct<low){scoreVal=40;toast('Muy poco','error');regError(10,'Milkshake poco llenado');updateStreak(false);}
  else{scoreVal=0;toast('¡Se derramó!','error');regError(15,'Milkshake derramado');updateStreak(false);}
  recordStageScore('ms_llenado',scoreVal);
  G.ms.fillScore=scoreVal;
  if(scoreVal===100)addScore(80,'Llenado perfecto');
  const msFillS=G.state;
  const tid=setTimeout(()=>{if(!G.gameOver&&G.state===msFillS)showMSToppings();},900);
  G.timers.push(tid);
}

function showMSToppings(){
  setState(STATES.MS_TOPPINGS);
  clearTimers();showScreen('screen-ms-toppings');
  const ord=G.ms.order,fl=G.ms.flavor||ord.flavor,d=diff();

  document.getElementById('ms-toppings-cup').innerHTML=`<div style="font-size:60px;text-align:center;margin:8px 0">${fl.icon}</div><div style="text-align:center;font-size:13px;font-weight:700;opacity:.7">${fl.name}</div>`;

  const msTopS=G.state;

  if(ord.toppings.length===0){
    document.getElementById('ms-toppings-prompt').textContent='No lleva toppings. Confirmá así.';
    document.getElementById('ms-topping-grid').innerHTML='<p style="opacity:.5;text-align:center;padding:16px">Sin toppings en este pedido</p>';
    recordStageScore('ms_toppings',100);
    document.getElementById('ms-toppings-ok-btn').onclick=()=>{if(wrongState(msTopS))return;playClick();clearTimers();showMSDelivery();};
    return;
  }

  document.getElementById('ms-toppings-prompt').textContent=d.memoryDrink?'¿Qué toppings pidió el cliente?':'Seleccioná los toppings del pedido';

  const grid=document.getElementById('ms-topping-grid');grid.innerHTML='';
  const selected=new Set();

  MILKSHAKE_TOPPINGS.forEach(top=>{
    const btn=document.createElement('button');btn.className='ms-topping-btn';
    btn.innerHTML=`${top.icon} ${top.name}`;
    btn.dataset.id=top.id;
    btn.addEventListener('click',()=>{
      btn.classList.toggle('selected');
      if(btn.classList.contains('selected'))selected.add(top.id);
      else selected.delete(top.id);
      playClick();
    });
    grid.appendChild(btn);
  });

  document.getElementById('ms-toppings-ok-btn').onclick=()=>{
    if(wrongState(msTopS))return;
    const ordIds=new Set(ord.toppings.map(t=>t.id));
    let correct=0,wrong=0;
    ordIds.forEach(id=>{if(selected.has(id))correct++;});
    selected.forEach(id=>{if(!ordIds.has(id))wrong++;});
    const missed=ordIds.size-correct;
    const scoreVal=ordIds.size===0?100:Math.max(0,Math.round(100-(wrong*20)-(missed*20)));

    playClick();
    recordStageScore('ms_toppings',scoreVal);
    if(scoreVal===100){playSuccess();toast('¡Toppings perfectos!','success');}
    else if(scoreVal>50){toast('Toppings casi correctos','warning');regError(5,'Toppings parcialmente incorrectos');}
    else{toast('Toppings incorrectos','error');regError(12,'Toppings incorrectos');}
    clearTimers();
    const tidTop=setTimeout(()=>{if(!G.gameOver&&G.state===msTopS)showMSDelivery();},800);
    G.timers.push(tidTop);
  };

  stageTimer('ms-toppings-timer-fill','ms-toppings-timer-txt',d.bT*.5,()=>{
    if(wrongState(msTopS))return;
    recordStageScore('ms_toppings',0);regError(10,'Tiempo toppings');
    const tid=setTimeout(()=>{if(!G.gameOver&&G.state===msTopS)showMSDelivery();},800);
    G.timers.push(tid);
  });
}

function showMSDelivery(){
  setState(STATES.MS_DELIVERY);
  clearTimers();showScreen('screen-ms-delivery');
  const ord=G.ms.order,ci=G.client-1,cli=CLIENTS[ci],d=diff();
  document.getElementById('ms-delivery-client').innerHTML=clientSVG(cli,120);
  document.getElementById('ms-delivery-speech').textContent='¿Mi milkshake?';

  const fl=G.ms.flavor||ord.flavor;
  document.getElementById('ms-delivery-shake-preview').innerHTML=`<div style="font-size:80px;text-align:center;filter:drop-shadow(0 8px 20px rgba(0,0,0,.5))">${fl.icon}</div><div style="text-align:center;font-size:14px;font-weight:800;color:#fff">${fl.name} — ${ord.size.name}</div>`;

  const summary=document.getElementById('ms-delivery-summary');
  const avgScore=Math.round([G.stageScores.ms_pedido||0,G.stageScores.ms_sabor||0,G.stageScores.ms_vaso||0,G.stageScores.ms_llenado||0,G.stageScores.ms_toppings||0].reduce((a,b)=>a+b,0)/5);
  summary.innerHTML=`<div style="font-family:var(--font-d);font-size:24px;color:var(--yellow);font-weight:900">Calidad: ${avgScore}%</div>`;

  const msDelS=G.state;
  stageTimer('ms-delivery-timer-fill','ms-delivery-timer-txt',d.dlT,()=>{
    if(wrongState(msDelS))return;
    recordStageScore('ms_entrega',0);regError(10,'Entrega tardía');
    finalizeMSDelivery(false);
  });
  document.getElementById('ms-deliver-btn').onclick=()=>{
    if(wrongState(msDelS))return;
    playClick();clearTimers();recordStageScore('ms_entrega',100);finalizeMSDelivery(true);
  };
}

function finalizeMSDelivery(ok){
  clearTimers();
  if(ok){addScore(100,'Milkshake entregado');updateStreak(true);}
  else{regError(10,'No entregó milkshake');updateStreak(false);}
  const earned=Math.round((G.ms.order.price||800)*([G.stageScores.ms_sabor||50,G.stageScores.ms_llenado||50].reduce((a,b)=>a+b,0)/200));
  G.money+=earned;updateHUD();floatMoney(earned);

  const stageData=[
    {label:'Pedido',    icon:'🧾', score:G.stageScores.ms_pedido||0},
    {label:'Sabor',     icon:'🍫', score:G.stageScores.ms_sabor||0},
    {label:'Vaso',      icon:'🥛', score:G.stageScores.ms_vaso||0},
    {label:'Llenado',   icon:'🥤', score:G.stageScores.ms_llenado||0},
    {label:'Toppings',  icon:'🍓', score:G.stageScores.ms_toppings||0},
    {label:'Entrega',   icon:'🛎️', score:G.stageScores.ms_entrega||0},
  ];
  const msDelFinS=G.state;
  const tidMS=setTimeout(()=>{if(!G.gameOver&&G.state===msDelFinS)showStageScore(stageData,null);},800);
  G.timers.push(tidMS);
}

/* ═══════════════════════════════════════════════════════════════
   ██████████████  MODO PIZZA  ██████████████
═══════════════════════════════════════════════════════════════ */

function genPZOrder(ci){
  const preset=PIZZA_PRESETS[Math.min(ci,PIZZA_PRESETS.length-1)];
  return {
    preset,
    dough:PIZZA_DOUGHS.find(d=>d.id===preset.dough)||PIZZA_DOUGHS[0],
    toppings:preset.toppings.map(id=>PIZZA_INGREDIENTS.find(i=>i.id===id)).filter(Boolean),
    price:preset.price,
  };
}

function showPZOrder(){
  setState(STATES.PZ_ORDER);
  clearTimers();
  G.pz.order=genPZOrder(G.client-1);
  G.pz.placedToppings=[];
  const ord=G.pz.order,ci=G.client-1,cli=CLIENTS[ci],d=diff();
  showScreen('screen-pz-order');

  document.getElementById('pz-client-svg-wrap').innerHTML=clientSVG(cli,140);
  document.getElementById('pz-speech-bubble').textContent=cli.speech;
  document.getElementById('pz-customer-name').textContent=cli.name;
  document.getElementById('pz-customer-personality').textContent=cli.tag;
  document.getElementById('pz-ticket-num').textContent=String(G.client).padStart(3,'0');

  const list=document.getElementById('pz-ticket-items');list.innerHTML='';
  const items=[
    {icon:'🍕',name:`Pizza ${ord.preset.name} (${ord.dough.name})`},
    ...ord.toppings.map(t=>({icon:t.icon,name:t.name})),
  ];
  items.forEach(item=>{
    const li=document.createElement('li');
    li.innerHTML=`<span>${item.icon}</span><span style="flex:1">${item.name}</span>`;
    list.appendChild(li);
  });

  const pzOrdS=G.state;
  stageTimer('pz-order-timer-fill','pz-order-timer-txt',d.oT,()=>{if(wrongState(pzOrdS))return;recordStageScore('pz_pedido',50);showPZDough();});
  document.getElementById('pz-order-ok-btn').onclick=()=>{if(wrongState(pzOrdS))return;playClick();clearTimers();recordStageScore('pz_pedido',100);showPZDough();};
}

function showPZDough(){
  setState(STATES.PZ_DOUGH);
  clearTimers();showScreen('screen-pz-dough');
  const ord=G.pz.order,d=diff();
  document.getElementById('pz-dough-prompt').textContent=d.memoryDrink?'¿Qué masa pidió?':'Masa: '+ord.dough.name;

  const grid=document.getElementById('pz-dough-grid');grid.innerHTML='';
  const pzDghS=G.state;
  PIZZA_DOUGHS.forEach(dgh=>{
    const btn=document.createElement('button');btn.className='pz-option-btn';
    btn.innerHTML=`<span style="font-size:32px">${dgh.icon}</span><span>${dgh.name}</span>`;
    btn.addEventListener('click',()=>{
      if(wrongState(pzDghS))return;
      if(dgh.id===ord.dough.id){
        playSuccess();toast('¡Masa correcta!','success',1200);
        recordStageScore('pz_masa',100);G.pz.dough=dgh;showPZToppings();
      }else{
        btn.classList.add('wrong-answer');playError();
        toast(`✗ Era ${ord.dough.name}. Penalización.`,'error',2000);
        recordStageScore('pz_masa',0);G.pz.dough=dgh;
        const lostDgh=regError(12,'Masa incorrecta');
        if(!lostDgh){const t=setTimeout(()=>{if(!G.gameOver&&G.state===pzDghS)showPZToppings();},1500);G.timers.push(t);}
      }
    });
    grid.appendChild(btn);
  });

  stageTimer('pz-dough-timer-fill','pz-dough-timer-txt',d.dT*.7,()=>{
    if(wrongState(pzDghS))return;
    recordStageScore('pz_masa',0);regError(10,'No eligió masa');
    G.pz.dough=PIZZA_DOUGHS[0];
    const tid=setTimeout(()=>{if(!G.gameOver&&G.state===pzDghS)showPZToppings();},800);
    G.timers.push(tid);
  });
}

function showPZToppings(){
  setState(STATES.PZ_TOPPINGS);
  clearTimers();showScreen('screen-pz-toppings');
  const ord=G.pz.order,d=diff();
  const placed=G.pz.placedToppings=[];

  // Pizza display
  const base=document.getElementById('pz-pizza-base');
  base.innerHTML=renderPizzaSVG(placed,[]);

  // Order ref
  const refEl=document.getElementById('pz-order-ref');
  if(d.showOrderRef){
    refEl.innerHTML='Orden: '+ord.toppings.map(t=>`<span class="ref-ing">${t.icon} ${t.name}</span>`).join('<span class="ref-arr">→</span>');
  }else{
    refEl.innerHTML='<span style="color:rgba(255,100,100,.6)">🧠 ¡Recordá los ingredientes!</span>';
  }

  // Ingredient grid
  const grid=document.getElementById('pz-ing-grid');grid.innerHTML='';

  // Extras/distractors based on difficulty
  const wrongOpts=PIZZA_INGREDIENTS.filter(i=>!ord.toppings.find(t=>t.id===i.id));
  const distrs=wrongOpts.slice(0,d.dis);
  const pool=[...ord.toppings,...distrs].sort(()=>Math.random()-.5);

  const pzTopS=G.state;
  pool.forEach(ing=>{
    const btn=document.createElement('button');btn.className='pz-ing-btn';
    btn.innerHTML=`<span style="font-size:24px">${ing.icon}</span><span style="font-size:11px">${ing.name}</span>`;
    btn.dataset.id=ing.id;
    btn.addEventListener('click',()=>{if(!wrongState(pzTopS))pzIngClick(ing,btn,ord,placed,grid);});
    grid.appendChild(btn);
  });

  document.getElementById('pz-undo-btn').onclick=()=>{
    if(!placed.length)return;
    playClick();const removed=placed.pop();
    base.innerHTML=renderPizzaSVG(placed,[]);
    const prevBtn=grid.querySelector(`[data-id="${removed.id}"].used`);
    if(prevBtn)prevBtn.classList.remove('used');
  };

  stageTimer('pz-toppings-timer-fill','pz-toppings-timer-txt',d.bT,()=>{
    if(wrongState(pzTopS))return;
    toast('¡Tiempo!','warning');finalizePZToppings(placed,ord);
  });
}

function pzIngClick(ing,btn,ord,placed,grid){
  if(G.paused)return;
  const nextExpected=ord.toppings[placed.length];

  if(!nextExpected){
    // Ya pusimos todos
    toast('Ya están todos los ingredientes','warning');return;
  }

  if(ing.id===nextExpected.id){
    // Correcto
    playClick();placed.push(ing);btn.classList.add('used');
    document.getElementById('pz-pizza-base').innerHTML=renderPizzaSVG(placed,[]);
    if(placed.length===ord.toppings.length){
      clearTimers();recordStageScore('pz_ingredientes',100);
      toast('¡Pizza lista para hornear!','success');
      const pzTopFinS=G.state;
      const tid=setTimeout(()=>{if(!G.gameOver&&G.state===pzTopFinS)showPZBake();},600);
      G.timers.push(tid);
    }
  }else{
    // Incorrecto — para pizza es penalización (no derrota instantánea para mantener jugabilidad)
    btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),500);
    playError();toast(`✗ ${ing.name} no es lo siguiente`,'error',1200);
    regError(8,'Ingrediente de pizza incorrecto');
  }
}

function finalizePZToppings(placed,ord){
  clearTimers();
  const pzTopFinS=G.state;
  const correct=placed.filter((p,i)=>ord.toppings[i]&&p.id===ord.toppings[i].id).length;
  const score=ord.toppings.length===0?100:Math.round((correct/ord.toppings.length)*100);
  recordStageScore('pz_ingredientes',score);
  const tid=setTimeout(()=>{if(!G.gameOver&&G.state===pzTopFinS)showPZBake();},800);
  G.timers.push(tid);
}

function renderPizzaSVG(placed,all){
  const colors=placed.map(i=>i.color||'#FFE066');
  const dotGroups=placed.map((ing,idx)=>{
    const c=ing.color||'#FFE066';
    const dots=[];const n=3+idx%3;
    for(let i=0;i<n;i++){
      const angle=(i/n)*2*Math.PI+(idx*.4);
      const r=30+Math.random()*30;
      const x=100+Math.cos(angle)*r;const y=100+Math.sin(angle)*r;
      dots.push(`<circle cx="${Math.round(x)}" cy="${Math.round(y)}" r="${6+idx%3}" fill="${c}" opacity=".9"/>`);
    }
    return dots.join('');
  }).join('');

  return `<svg width="180" height="180" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="95" fill="#C8860A"/>
    <circle cx="100" cy="100" r="82" fill="#E8A020"/>
    <circle cx="100" cy="100" r="76" fill="#FFFAE0"/>
    ${placed.length>0?`<circle cx="100" cy="100" r="68" fill="#FFE066" opacity=".7"/>`:''}
    ${dotGroups}
  </svg>`;
}

function showPZBake(){
  setState(STATES.PZ_BAKE);
  clearTimers();showScreen('screen-pz-bake');
  document.getElementById('oven-wrap').innerHTML=ovenSVG();

  cookingStage({
    indId:'pz-bake-indicator',lblId:'pz-bake-state',timerF:'pz-bake-timer-fill',timerT:'pz-bake-timer-txt',
    btnId:'pz-bake-btn',prtclId:null,key:'pz_bake',isMeat:false,
    maxMs:diff().mT,onDone:showPZCut,
    rawLbl:'Sin hornear',okLbl:'¡Perfecta!',burnLbl:'¡Quemada!',
    scoreKey:'pz_horneado',
    // Override particle rendering for oven
    customParticle:true,
  });
}

function showPZCut(){
  setState(STATES.PZ_CUT);
  clearTimers();showScreen('screen-pz-cut');
  const d=diff();
  const TARGET=6;let cuts=0;

  document.getElementById('pz-cut-target').textContent=TARGET;
  document.getElementById('pz-cut-count').textContent='0';
  document.getElementById('pz-cut-ok-btn').disabled=true;

  const base=document.getElementById('pz-pizza-cut-base');
  base.innerHTML=renderPizzaSVG(G.pz.placedToppings||[],[]);

  const canvas=document.getElementById('pz-cut-canvas');
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,260,260);

  canvas.addEventListener('click',(e)=>{
    if(cuts>=TARGET)return;
    const rect=canvas.getBoundingClientRect();
    const x=e.clientX-rect.left,y=e.clientY-rect.top;
    const cx=130,cy=130;
    const angle=Math.atan2(y-cy,x-cx);
    const snapAngle=Math.round(angle/(Math.PI/3))*(Math.PI/3);
    playClick();cuts++;
    document.getElementById('pz-cut-count').textContent=cuts;

    // Draw cut line
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(snapAngle)*10,cy+Math.sin(snapAngle)*10);
    ctx.lineTo(cx+Math.cos(snapAngle)*120,cy+Math.sin(snapAngle)*120);
    ctx.moveTo(cx-Math.cos(snapAngle)*10,cy-Math.sin(snapAngle)*10);
    ctx.lineTo(cx-Math.cos(snapAngle)*120,cy-Math.sin(snapAngle)*120);
    ctx.strokeStyle='rgba(200,100,0,.8)';ctx.lineWidth=2;ctx.stroke();

    if(cuts>=TARGET){
      playSuccess();toast('¡Pizza bien cortada!','success');
      document.getElementById('pz-cut-ok-btn').disabled=false;
      recordStageScore('pz_corte',100);
    }
  });

  const pzCutS=G.state;
  document.getElementById('pz-cut-ok-btn').onclick=()=>{
    if(wrongState(pzCutS))return;
    playClick();clearTimers();
    if(cuts<TARGET){recordStageScore('pz_corte',Math.round((cuts/TARGET)*100));regError(8,'Pocos cortes');}
    const tid=setTimeout(()=>{if(!G.gameOver&&G.state===pzCutS)showPZDelivery();},400);G.timers.push(tid);
  };

  stageTimer('pz-cut-timer-fill','pz-cut-timer-txt',diff().bT*.5,()=>{
    if(wrongState(pzCutS))return;
    if(cuts<TARGET)recordStageScore('pz_corte',Math.round((cuts/TARGET)*70));
    const tid=setTimeout(()=>{if(!G.gameOver&&G.state===pzCutS)showPZDelivery();},600);G.timers.push(tid);
  });
}

function showPZDelivery(){
  setState(STATES.PZ_DELIVERY);
  clearTimers();showScreen('screen-pz-delivery');
  const ci=G.client-1,cli=CLIENTS[ci],d=diff();
  document.getElementById('pz-delivery-client').innerHTML=clientSVG(cli,120);
  document.getElementById('pz-delivery-speech').textContent='¿Dónde está mi pizza? 🍕';

  const avgScore=Math.round(Object.entries(G.stageScores).filter(([k])=>k.startsWith('pz_')).map(([,v])=>v).reduce((a,b)=>a+b,0)/5||50);
  document.getElementById('pz-delivery-summary').innerHTML=`<div style="font-family:var(--font-d);font-size:22px;color:var(--yellow);font-weight:900">Calidad: ${avgScore}%</div>`;

  const pzDelS=G.state;
  stageTimer('pz-delivery-timer-fill','pz-delivery-timer-txt',d.dlT,()=>{
    if(wrongState(pzDelS))return;
    recordStageScore('pz_entrega',0);regError(10,'Entrega tardía');finalizePZDelivery(false);
  });
  document.getElementById('pz-deliver-btn').onclick=()=>{
    if(wrongState(pzDelS))return;
    playClick();clearTimers();recordStageScore('pz_entrega',100);finalizePZDelivery(true);
  };
}

function finalizePZDelivery(ok){
  clearTimers();
  if(ok){addScore(110,'Pizza entregada');updateStreak(true);}
  else{regError(10,'Pizza no entregada');updateStreak(false);}
  const earned=Math.round((G.pz.order.price||1200)*0.7);
  G.money+=earned;updateHUD();floatMoney(earned);

  const stageData=[
    {label:'Pedido',       icon:'🧾', score:G.stageScores.pz_pedido||0},
    {label:'Masa',         icon:'🍕', score:G.stageScores.pz_masa||0},
    {label:'Ingredientes', icon:'🧀', score:G.stageScores.pz_ingredientes||0},
    {label:'Horneado',     icon:'🔥', score:G.stageScores.pz_horneado||0},
    {label:'Corte',        icon:'✂️', score:G.stageScores.pz_corte||0},
    {label:'Entrega',      icon:'🛎️', score:G.stageScores.pz_entrega||0},
  ];
  const pzDelFinS=G.state;
  const tidPZ=setTimeout(()=>{if(!G.gameOver&&G.state===pzDelFinS)showStageScore(stageData,null);},800);
  G.timers.push(tidPZ);
}

/* ═══════════════════════════════════════════════════════════════
   FIN DE JUEGO
═══════════════════════════════════════════════════════════════ */
function endGame(win){
  G.gameOver=true;
  setState(win?STATES.WIN:STATES.LOSE);
  clearTimers();
  document.getElementById('hud').classList.add('hidden');
  G.elapsed=Date.now()-G.startTime;
  if(win){
    const overallAvg=G.clientScores.length
      ?Math.round(G.clientScores.reduce((a,b)=>a+b,0)/G.clientScores.length)
      :70;
    const isF=G.character==='female';
    let endTitle,endMsg;
    if(overallAvg>=85){
      endTitle=isF?'EMPLEADA DEL MES':'EMPLEADO DEL MES';
      endMsg=`${isF?'Valentina':'Carlos'} fue un crack — promedio ${overallAvg}%. ¡Desempeño de élite!`;
      playFanfare();confetti();fireworks();
    }else if(overallAvg>=60){
      endTitle='TURNO COMPLETADO';
      endMsg=`Buen trabajo — promedio ${overallAvg}%. Mejorá para llegar a Empleado del Mes (necesitás 85%).`;
      playSuccess();
    }else{
      endTitle='TURNO COMPLETADO';
      endMsg=`Promedio bajo: ${overallAvg}%. Necesitás mejorar para mantener el empleo. ¡Seguí practicando!`;
      playWarn();
    }
    showScreen('screen-win');
    document.getElementById('win-title').textContent=endTitle;
    document.getElementById('win-msg').textContent=endMsg;
    document.getElementById('win-stats').innerHTML=winStatsHTML();
    const totalStars=G.stars.reduce((a,b)=>a+b,0);
    const maxStars=G.total*3;
    document.getElementById('win-stars-total').innerHTML=`<svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg" style="vertical-align:middle;margin-right:4px"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" fill="#FFC72C" stroke="#C89800" stroke-width="1.5"/></svg> ${totalStars} / ${maxStars} estrellas · Promedio: ${overallAvg}%`;
    const sb=document.getElementById('save-score-btn');
    sb.disabled=false;sb.textContent='Guardar Puntaje';
    sb.onclick=()=>{const nm=document.getElementById('player-name').value.trim()||'Anónimo';saveLB(nm,G.score);toast('¡Guardado!','success');sb.disabled=true;sb.textContent='Guardado';};
    document.getElementById('win-retry-btn').onclick=()=>{playClick();restart();};
    document.getElementById('win-lb-btn').onclick=()=>{playClick();showLeaderboard();};
    showCoupon(overallAvg);
  }else{
    playError();showScreen('screen-lose');
    document.getElementById('lose-msg').textContent=G.loseReason
      ?`Razón: ${G.loseReason}. No lograste mantener el nivel de servicio.`
      :'No lograste mantener el nivel de servicio durante la hora pico.';
    document.getElementById('lose-stats').innerHTML=loseStatsHTML();
    document.getElementById('lose-retry-btn').onclick=()=>{playClick();restart();};
    document.getElementById('lose-lb-btn').onclick=()=>{playClick();showLeaderboard();};
  }
}

/* ── CUPÓN McDONALD'S ────────────────────────────────────────── */
function genCouponCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code='';
  for(let i=0;i<4;i++){
    if(i>0)code+='-';
    for(let j=0;j<4;j++)code+=chars[Math.floor(Math.random()*chars.length)];
  }
  return 'MC-'+code;
}

function showCoupon(avg){
  // Determinar descuento según rendimiento
  let pct, detail, isGold=false;
  if(avg>=85){
    pct='30%'; detail='¡Premio Empleado del Mes!'; isGold=true;
  }else if(avg>=70){
    pct='20%'; detail='En combo o pedido mayor a $1.500';
  }else{
    pct='10%'; detail='En tu próxima visita al local';
  }

  const code=genCouponCode();

  const coupon=document.getElementById('coupon');
  document.getElementById('coupon-pct').textContent=pct;
  document.getElementById('coupon-detail').textContent=detail;
  document.getElementById('coupon-code').textContent=code;
  coupon.classList.toggle('tier-gold',isGold);

  // Botón copiar
  const copyBtn=document.getElementById('coupon-copy-btn');
  copyBtn.onclick=()=>{
    navigator.clipboard.writeText(code).then(()=>{
      copyBtn.textContent='✅';
      toast('¡Código copiado!','success',1800);
      setTimeout(()=>copyBtn.textContent='📋',2000);
    }).catch(()=>{
      // Fallback para contextos sin clipboard API
      toast(`Código: ${code}`,'success',4000);
    });
  };

  // También al hacer click en el código
  document.getElementById('coupon-code').onclick=()=>copyBtn.click();
}

function winStatsHTML(){
  const el=G.elapsed||(Date.now()-G.startTime);
  return `<div class="stat-item"><div class="stat-val">${G.score}</div><div class="stat-lbl">Puntaje</div></div>
    <div class="stat-item"><div class="stat-val money">$${G.money.toLocaleString('es-AR')}</div><div class="stat-lbl">Recaudado</div></div>
    <div class="stat-item"><div class="stat-val">${fmtT(el)}</div><div class="stat-lbl">Tiempo</div></div>
    <div class="stat-item"><div class="stat-val">${G.errors}</div><div class="stat-lbl">Errores</div></div>`;
}
function loseStatsHTML(){
  const el=G.elapsed||(Date.now()-G.startTime);
  return `<div class="stat-item"><div class="stat-val">${Math.max(0,G.client-1)}/${G.total}</div><div class="stat-lbl">Clientes</div></div>
    <div class="stat-item"><div class="stat-val money">$${G.money.toLocaleString('es-AR')}</div><div class="stat-lbl">Recaudado</div></div>
    <div class="stat-item"><div class="stat-val">${G.score}</div><div class="stat-lbl">Puntaje</div></div>
    <div class="stat-item"><div class="stat-val">${G.errors}</div><div class="stat-lbl">Errores</div></div>`;
}

function restart(){
  G.gameOver=true; // Cancel any pending callbacks from previous game
  setState(STATES.IDLE);
  clearTimers();
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('hud-rush-badge').classList.add('hidden');
  document.getElementById('rush-banner').classList.add('hidden');
  showScreen('screen-difficulty');
  G.character=null;G.gameMode=null;G.difficulty=null;
  ACTIVE_PRESET=DIFFICULTY_PRESETS.medium;
  document.querySelectorAll('.diff-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById('diff-start-btn').disabled=true;
  document.querySelectorAll('.char-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById('char-start-btn').disabled=true;
  document.querySelectorAll('.mode-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById('mode-start-btn').disabled=true;
}

/* ── CONFETTI & FIREWORKS ────────────────────────────────────── */
function confetti(){
  const w=document.getElementById('confetti-wrap');w.innerHTML='';
  const cols=['#DA291C','#FFC72C','#6BCB77','#74B9E0','#C3B1E1','#F4947A','#FFFFFF'];
  for(let i=0;i<100;i++){
    const p=document.createElement('div');p.className='confetti-piece';
    p.style.cssText=`left:${Math.random()*100}%;background:${cols[Math.floor(Math.random()*cols.length)]};width:${7+Math.random()*11}px;height:${7+Math.random()*11}px;animation-duration:${2+Math.random()*3}s;animation-delay:${Math.random()*1.5}s;border-radius:${Math.random()>.5?'50%':'3px'};`;
    w.appendChild(p);
  }
}
function fireworks(){
  const wrap=document.getElementById('fireworks-wrap');if(!wrap)return;
  wrap.innerHTML='';
  const cols=['#FFC72C','#DA291C','#6BCB77','#74B9E0','#fff'];
  function burst(){
    const cx=20+Math.random()*60,cy=10+Math.random()*50;
    for(let i=0;i<18;i++){
      const p=document.createElement('div');p.className='firework-particle';
      const angle=(i/18)*2*Math.PI,dist=80+Math.random()*80;
      const tx=Math.cos(angle)*dist,ty=Math.sin(angle)*dist;
      p.style.cssText=`left:${cx}%;top:${cy}%;background:${cols[Math.floor(Math.random()*cols.length)]};--fx:translate(${tx}px,${ty}px) scale(0);animation-duration:${.7+Math.random()*.5}s;animation-delay:${Math.random()*.3}s;`;
      wrap.appendChild(p);setTimeout(()=>p.remove(),1500);
    }
  }
  burst();
  const t1=setTimeout(burst,600),t2=setTimeout(burst,1200),t3=setTimeout(burst,1800);
  G.timers.push(t1,t2,t3);
}

/* ── LEADERBOARD ─────────────────────────────────────────────── */
const LBK='mcdo_lb_v5';
function loadLB(){try{return JSON.parse(localStorage.getItem(LBK))||[];}catch{return[];}}
function saveLB(name,score){
  const lb=loadLB();lb.push({name,score,date:new Date().toLocaleDateString('es-AR')});
  lb.sort((a,b)=>b.score-a.score);
  try{localStorage.setItem(LBK,JSON.stringify(lb.slice(0,10)));}catch{}
}
function showLeaderboard(){
  const lb=loadLB(),list=document.getElementById('lb-list');list.innerHTML='';
  if(!lb.length){list.innerHTML='<li class="lb-empty">Aún no hay puntajes.</li>';}
  else{
    const m=['1°','2°','3°'];
    lb.forEach((e,i)=>{
      const li=document.createElement('li');
      li.innerHTML=`<span class="lb-rank">${m[i]||(i+1)+'.'}</span><span class="lb-name">${e.name}</span><span class="lb-pts">${e.score} pts</span>`;
      list.appendChild(li);
    });
  }
  document.getElementById('leaderboard-overlay').classList.remove('hidden');
}
document.getElementById('lb-close-btn').addEventListener('click',()=>document.getElementById('leaderboard-overlay').classList.add('hidden'));

/* ── PAUSA ───────────────────────────────────────────────────── */
document.getElementById('pause-btn').addEventListener('click',togglePause);
document.getElementById('resume-btn').addEventListener('click',togglePause);
document.getElementById('pause-lb-btn').addEventListener('click',()=>showLeaderboard());
function togglePause(){
  G.paused=!G.paused;
  const ps=document.getElementById('screen-pause');
  if(G.paused){ps.classList.remove('hidden');requestAnimationFrame(()=>ps.classList.add('active'));playWarn();}
  else{ps.classList.remove('active');ps.classList.add('hidden');if(G.activeScreen){const prev=document.getElementById(G.activeScreen);if(prev){prev.classList.remove('hidden');requestAnimationFrame(()=>prev.classList.add('active'));}}}
}

/* ── TECLADO ─────────────────────────────────────────────────── */
document.addEventListener('keydown',e=>{
  if(e.code==='Escape'){
    const gs=['screen-order','screen-meat','screen-fries','screen-drink','screen-burger','screen-delivery',
              'screen-ms-order','screen-ms-flavor','screen-ms-cup','screen-ms-fill','screen-ms-toppings','screen-ms-delivery',
              'screen-pz-order','screen-pz-dough','screen-pz-toppings','screen-pz-bake','screen-pz-cut','screen-pz-delivery'];
    if(gs.some(s=>{const el=document.getElementById(s);return el&&el.classList.contains('active');})||G.paused)togglePause();
  }
});

/* ── SELECCIÓN DE DIFICULTAD ─────────────────────────────────── */
function initDifficultyScreen(){
  setState(STATES.IDLE);
  const cards=document.querySelectorAll('.diff-card');
  const startBtn=document.getElementById('diff-start-btn');

  cards.forEach(card=>{
    card.addEventListener('click',()=>{
      playClick();
      cards.forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      G.difficulty=card.dataset.diff;
      ACTIVE_PRESET=DIFFICULTY_PRESETS[G.difficulty];
      startBtn.disabled=false;
      // Actualizar chip visual de vidas/clientes en la card
      document.getElementById('diff-info-lives').textContent=ACTIVE_PRESET.lives;
      document.getElementById('diff-info-clients').textContent=ACTIVE_PRESET.totalClients;
    });
  });

  startBtn.addEventListener('click',()=>{
    if(!G.difficulty)return;
    playClick();
    showScreen('screen-character');
  });
}

/* ── ARRANQUE ────────────────────────────────────────────────── */
window.addEventListener('load',()=>{
  initDifficultyScreen();
  initCharacterScreen();
  initModeScreen();
});
showScreen('screen-difficulty');
