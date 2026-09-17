/* ==========================================================================
   The Little Founder — simulation engine
   A lemonade & hot dog empire for young founders: 24 adventures, extra
   stands to open, and a decision to make (almost) every day.
   ========================================================================== */
(function () {
'use strict';

/* ───────────────────────────── config ───────────────────────────── */

/* Names and descriptions for everything below live in i18n.js, keyed by id. */
var SUPPLIES = {
  lemons:   { emoji:'🍋', pack:10, packPrice:3.00,  spoil:0.12, makes:'lemonade' },
  sugar:    { emoji:'🥄', pack:20, packPrice:2.00,  spoil:0.00, makes:'lemonade' },
  cups:     { emoji:'🥤', pack:25, packPrice:2.00,  spoil:0.00, makes:'lemonade' },
  ice:      { emoji:'🧊', pack:20, packPrice:1.00,  spoil:0.60, makes:'lemonade' },
  sausages: { emoji:'🌭', pack:10, packPrice:11.00, spoil:0.18, makes:'hotdog'   },
  buns:     { emoji:'🥖', pack:10, packPrice:3.50,  spoil:0.25, makes:'hotdog'   },
  toppings: { emoji:'🧅', pack:20, packPrice:4.00,  spoil:0.06, makes:'hotdog'   }
};
var SUP_KEYS = Object.keys(SUPPLIES);

var RECIPES = {
  lemonade: [
    { parts:{ lemons:1, sugar:1, cups:1, ice:1 }, sat:0.78, fair:0.86 },
    { parts:{ lemons:2, sugar:2, cups:1, ice:1 }, sat:1.00, fair:1.00 },
    { parts:{ lemons:3, sugar:3, cups:1, ice:2 }, sat:1.18, fair:1.24 }
  ],
  hotdog: [
    { parts:{ sausages:1, buns:1 },             sat:0.80, fair:0.86 },
    { parts:{ sausages:1, buns:1, toppings:1 }, sat:1.00, fair:1.00 },
    { parts:{ sausages:1, buns:1, toppings:3 }, sat:1.18, fair:1.26 }
  ]
};
var PRODS = ['lemonade', 'hotdog'];

var PRODUCTS = {
  lemonade: { emoji:'🥤', baseFair:2.00, cls:'prod-lem' },
  hotdog:   { emoji:'🌭', baseFair:3.50, cls:'prod-dog' }
};

var UPGRADES = [
  { id:'sign',     emoji:'🎨', cost:35 },
  { id:'register', emoji:'💵', cost:30 },
  { id:'cooler',   emoji:'🧊', cost:40 },
  { id:'bunbox',   emoji:'🍞', cost:25 },
  { id:'grill',    emoji:'🔥', cost:70 },
  { id:'umbrella', emoji:'⛱️', cost:55 }
];

/* translated-label accessors */
function supName(k) { return t('sup.' + k + '.name'); }
function supUnit(k) { return t('sup.' + k + '.unit'); }
function prodName(p) { return t('prod.' + p + '.name'); }
function upgName(id) { return t('upg.' + id + '.name'); }
function upgDesc(id) { return t('upg.' + id + '.desc'); }

var WEATHER = {
  scorching:{ emoji:'🥵', t:[95,103], traffic:1.16, lem:0.94, dog:0.30, lemFair:1.20, dogFair:0.90, sky:['#FFC978','#FFEDD0'] },
  hot:      { emoji:'☀️', t:[86,94],  traffic:1.26, lem:0.80, dog:0.42, lemFair:1.12, dogFair:0.97, sky:['#7FCDF2','#DFF4FF'] },
  warm:     { emoji:'🌤️', t:[76,85],  traffic:1.10, lem:0.62, dog:0.55, lemFair:1.00, dogFair:1.00, sky:['#8FD3F4','#E4F6FF'] },
  mild:     { emoji:'⛅', t:[66,75],  traffic:0.94, lem:0.45, dog:0.66, lemFair:0.92, dogFair:1.05, sky:['#A9D6EC','#E8F3F8'] },
  cloudy:   { emoji:'☁️', t:[58,68],  traffic:0.78, lem:0.32, dog:0.74, lemFair:0.86, dogFair:1.09, sky:['#B9C4CE','#E6EBEF'] },
  rainy:    { emoji:'🌧️', t:[52,62],  traffic:0.46, lem:0.22, dog:0.64, lemFair:0.82, dogFair:1.06, sky:['#8C99A6','#C9D3DA'] },
  chilly:   { emoji:'🧣', t:[36,48],  traffic:0.82, lem:0.20, dog:0.84, lemFair:0.80, dogFair:1.12, sky:['#A7B8C8','#DDE6EE'] },
  snowy:    { emoji:'❄️', t:[18,32],  traffic:0.70, lem:0.14, dog:0.92, lemFair:0.76, dogFair:1.16, sky:['#9FB3C8','#E9F0F6'] }
};
function wName(k) { return t('w.' + k); }

/* 14-day weather pools; the first entry is always day 1, the rest get shuffled */
var WEATHER_POOLS = {
  summer: ['warm','warm','hot','hot','mild','warm','hot','scorching','mild','cloudy','warm','hot','rainy','mild'],
  beach:  ['hot','hot','scorching','warm','hot','scorching','hot','warm','hot','scorching','mild','hot','rainy','hot'],
  mild:   ['warm','mild','mild','warm','cloudy','mild','warm','rainy','mild','warm','cloudy','mild','warm','rainy'],
  rainy:  ['mild','rainy','cloudy','warm','rainy','mild','cloudy','rainy','warm','mild','rainy','cloudy','mild','rainy'],
  autumn: ['mild','cloudy','chilly','mild','rainy','cloudy','chilly','mild','cloudy','rainy','chilly','mild','cloudy','chilly'],
  winter: ['chilly','snowy','snowy','cloudy','chilly','snowy','chilly','snowy','cloudy','snowy','chilly','snowy','snowy','chilly'],
  desert: ['hot','scorching','scorching','hot','scorching','hot','scorching','hot','scorching','warm','hot','scorching','hot','scorching'],
  tropical: ['hot','hot','rainy','warm','hot','rainy','hot','warm','rainy','hot','hot','rainy','warm','hot'],
  alpine: ['mild','chilly','mild','cloudy','chilly','mild','warm','chilly','cloudy','mild','chilly','mild','rainy','chilly'],
  monsoon: ['cloudy','rainy','rainy','cloudy','mild','rainy','cloudy','rainy','rainy','mild','cloudy','rainy','cloudy','rainy']
};

var EVENTS = {
  parade:   { emoji:'🎉', traffic:1.85 },
  game:     { emoji:'⚾', traffic:1.50, dog:1.35 },
  trip:     { emoji:'🎒', traffic:1.42, lem:1.30 },
  market:   { emoji:'🧺', traffic:1.32, supplyOff:0.80 },
  truck:    { emoji:'🚚', traffic:0.66 },
  quiet:    { emoji:'😴', traffic:0.70 },
  heat:     { emoji:'📰', traffic:1.10, lem:1.40 },
  match:    { emoji:'⚽', traffic:2.30, dog:1.30 },
  concert:  { emoji:'🎸', traffic:1.70 },
  exam:     { emoji:'📚', traffic:0.60 },
  cruise:   { emoji:'🛳️', traffic:1.75 },
  snowday:  { emoji:'⛄', traffic:1.40, dog:1.20 },
  tourists: { emoji:'📸', traffic:1.40 },
  delay:    { emoji:'🚧', traffic:1.55 },
  holiday:  { emoji:'🎈', traffic:1.50 },
  sale:     { emoji:'🏷️', traffic:1.45 },
  birthday: { emoji:'🎂', traffic:1.20, lem:1.30 },
  movie:    { emoji:'🎬', traffic:1.65 },
  race:     { emoji:'🏃', traffic:1.45, lem:1.40 },
  storm:    { emoji:'⛈️', traffic:0.40 },
  show:     { emoji:'🎪', traffic:1.80 },
  fireworks:{ emoji:'🎆', traffic:1.90, dog:1.20 },
  wedding:  { emoji:'💒', traffic:1.50 },
  harvest:  { emoji:'🍇', traffic:1.30, supplyOff:0.85 },
  blackout: { emoji:'🔌', traffic:0.55 },
  safari:   { emoji:'🚙', traffic:1.50 },
  competition:{ emoji:'🏅', traffic:1.70 },
  premiere: { emoji:'🎭', traffic:1.80 },
  launch:   { emoji:'🚀', traffic:2.00 },
  celebrity:{ emoji:'🌟', traffic:1.70 },
  strike:   { emoji:'🚫', traffic:0.55 },
  freeze:   { emoji:'🥶', traffic:0.60, dog:1.30 },
  kite:     { emoji:'🪁', traffic:1.40, lem:1.20 },
  spooky:   { emoji:'👻', traffic:1.90, dog:1.20 }
};
var BASE_EVENTS = ['parade','game','trip','market','truck','quiet','heat'];

/* day-of-week rhythm; index 0 is Saturday */
var DOW_PROFILES = {
  weekend: [1.24, 1.18, 0.84, 0.86, 0.92, 0.95, 1.08],
  strong:  [1.50, 1.45, 0.70, 0.72, 0.76, 0.82, 1.02],
  weekday: [0.55, 0.45, 1.12, 1.14, 1.18, 1.14, 1.22],
  school:  [0.35, 0.30, 1.10, 1.12, 1.12, 1.16, 1.28],
  flat:    [1.06, 1.02, 0.98, 0.98, 0.98, 1.00, 1.06]
};

var DIFFS = {
  easy:   { cash:200, profit:225, rent:10, sens:0.95 },
  normal: { cash:150, profit:325, rent:12, sens:1.15 },
  hard:   { cash:100, profit:390, rent:12, sens:1.25 }
};

/* ───────────────────────────── the 100 adventures ────────────────────────────
   Every number is a multiplier on the classic street corner (mode 'street').
   traffic  — how many people walk past        rent    — × the difficulty rent
   lem/dog  — appetite for each product        supply  — × every pack price
   lemFair/dogFair — what people expect to pay sens    — added price sensitivity
   cap      — × your serving capacity          repMult — how fast word spreads
   spoil    — per-supply overnight loss override (beach ice melts, snow ice doesn't)
   indoor   — weather barely matters           every   — a guaranteed big event every n days
   spots    — the two extra places you can open a stand at
*/
function spot(id, emoji, open, rent, traffic, from) {
  return { id:id, emoji:emoji, open:open, rent:rent, traffic:traffic, cap:30, from:from };
}

var MODE_DEFAULTS = {
  days:14, weather:'summer', dow:'weekend', backdrop:'street', group:'sun', stars:1,
  traffic:1, rent:1, lem:1, dog:1, lemFair:1, dogFair:1, supply:1, sens:0, cap:1, repMult:1,
  spoil:null, indoor:false, rainLove:false, night:false, events:BASE_EVENTS, every:null, tags:[], goal:1
};

var MODES = [
  /* ☀️ in the sun */
  { id:'street',   emoji:'🏘️', group:'sun', stars:1,
    spots:[ spot('corner','🌳',45,12,0.55,3), spot('bus','🚌',65,16,0.70,6) ] },
  { id:'beach',    emoji:'🏖️', group:'sun', stars:1, backdrop:'beach', weather:'beach', traffic:1.25, rent:1.3,
    lem:1.25, dog:0.85, lemFair:1.10, supply:1.1, spoil:{ ice:0.90 }, tags:['hot'],
    events:['heat','tourists','storm','trip','quiet','truck'],
    spots:[ spot('lifeguard','🏊',60,16,0.60,3), spot('pier','🎣',80,20,0.75,6) ] },
  { id:'park',     emoji:'🌳', group:'sun', stars:1, backdrop:'park', dow:'strong', traffic:1.05, rent:0.9,
    tags:['hot','mascot'], events:['race','birthday','parade','quiet','truck','game'],
    spots:[ spot('playground','🤸',45,12,0.50,3), spot('lake','🦆',60,15,0.60,6) ] },
  { id:'pool',     emoji:'🏊', group:'sun', stars:1, backdrop:'pool', weather:'beach', traffic:0.95, rent:1.1,
    lem:1.30, dog:0.80, sens:0.1, spoil:{ ice:0.80 }, tags:['hot'],
    events:['heat','birthday','trip','quiet','race'],
    spots:[ spot('slide','🌊',50,14,0.55,3), spot('kidspool','👶',45,12,0.50,6) ] },
  { id:'camp',     emoji:'🏕️', group:'sun', stars:1, backdrop:'forest', days:10, traffic:0.9, rent:0.5,
    lem:1.2, dog:1.1, supply:1.2, events:['trip','race','quiet','birthday','game'],
    spots:[ spot('lake','🛶',40,10,0.55,3), spot('campfire','🔥',40,10,0.50,5) ] },
  { id:'village',  emoji:'🐄', group:'sun', stars:1, backdrop:'village', weather:'mild', traffic:0.7, rent:0.4,
    lemFair:0.9, dogFair:0.9, supply:0.9, repMult:1.4, events:['market','quiet','holiday','parade'],
    spots:[ spot('church','⛪',35,8,0.60,3), spot('mill','🌾',30,8,0.50,6) ] },
  { id:'waterpark', emoji:'🌊', group:'sun', stars:2, backdrop:'waterpark', weather:'beach', dow:'strong', traffic:1.3, rent:1.5,
    lem:1.35, dog:0.9, lemFair:1.1, spoil:{ ice:0.85 }, tags:['hot','mascot'],
    events:['heat','birthday','trip','storm','quiet','holiday'],
    spots:[ spot('bigslide','🎢',65,18,0.65,3), spot('wavepool','🌊',60,16,0.60,6) ] },
  { id:'lakeside', emoji:'🛶', group:'sun', stars:1, backdrop:'lakeside', dow:'strong', traffic:0.95, rent:0.7, lem:1.1,
    events:['race','birthday','trip','quiet','storm','kite'],
    spots:[ spot('dock','⛵',45,12,0.55,3), spot('picnic','🧺',40,10,0.50,6) ] },
  { id:'orchard',  emoji:'🍎', group:'sun', stars:1, backdrop:'orchard', weather:'mild', traffic:0.8, rent:0.5,
    supply:0.85, lemFair:0.95, dogFair:0.95, repMult:1.2, events:['market','harvest','trip','quiet','birthday'],
    spots:[ spot('gate','🚜',35,9,0.55,3), spot('barn','🏚️',35,9,0.50,6) ] },
  { id:'sunflower', emoji:'🌻', group:'sun', stars:2, backdrop:'sunflower', weather:'beach', traffic:0.85, rent:0.6,
    lem:1.2, dog:0.9, spoil:{ ice:0.85 }, tags:['hot'], events:['tourists','heat','wedding','quiet','storm'],
    spots:[ spot('photo','📸',40,10,0.60,3), spot('road','🚗',45,12,0.50,6) ] },

  /* 🏙️ in the city */
  { id:'downtown', emoji:'🏙️', group:'city', stars:2, backdrop:'city', dow:'weekday', traffic:1.2, rent:1.5,
    dog:1.1, lemFair:1.1, dogFair:1.1, events:['tourists','parade','market','truck','quiet'],
    spots:[ spot('office','🏢',75,22,0.75,3), spot('plaza','⛲',60,18,0.60,6) ] },
  { id:'station',  emoji:'🚉', group:'city', stars:2, backdrop:'station', dow:'flat', traffic:1.15, rent:1.2,
    cap:0.85, tags:['travel'], events:['delay','tourists','quiet','market','truck'],
    spots:[ spot('platform','🚆',60,18,0.70,3), spot('taxi','🚕',50,15,0.50,6) ] },
  { id:'mall',     emoji:'🛍️', group:'city', stars:1, backdrop:'mall', indoor:true, weather:'mild', traffic:1.05,
    rent:2.0, lemFair:1.1, dogFair:1.1, tags:['discount'],
    events:['sale','holiday','quiet','tourists','birthday'],
    spots:[ spot('foodcourt','🍽️',70,22,0.75,3), spot('entrance','🎟️',55,18,0.60,6) ] },
  { id:'cinema',   emoji:'🎬', group:'city', stars:2, backdrop:'cinema', indoor:true, night:true, weather:'rainy',
    traffic:0.9, rent:1.3, dog:1.15, lem:0.9, every:{ n:4, id:'movie' },
    events:['holiday','quiet','sale','birthday'],
    spots:[ spot('lobby','🍿',55,16,0.60,3), spot('arcade','🕹️',50,14,0.50,6) ] },
  { id:'campus',   emoji:'🎓', group:'city', stars:2, backdrop:'campus', dow:'weekday', traffic:1.15, rent:0.9,
    sens:0.15, dog:1.15, lemFair:0.92, dogFair:0.92, events:['exam','concert','race','market','quiet'],
    spots:[ spot('library','📚',50,14,0.60,3), spot('dorms','🛏️',55,15,0.65,6) ] },
  { id:'school',   emoji:'🏫', group:'city', stars:1, backdrop:'school', weather:'mild', dow:'school', traffic:1.4,
    rent:0.6, sens:0.2, lem:1.15, dog:0.9, lemFair:0.85, dogFair:0.85,
    events:['trip','exam','game','holiday','birthday'],
    spots:[ spot('gym','🏀',40,10,0.50,3), spot('library','📚',40,10,0.45,6) ] },
  { id:'oldtown',  emoji:'🏰', group:'city', stars:2, backdrop:'oldtown', weather:'mild', traffic:1.1, rent:1.4,
    lemFair:1.15, dogFair:1.15, tags:['travel'], events:['tourists','parade','market','holiday','quiet','wedding'],
    spots:[ spot('square','⛲',65,18,0.70,3), spot('tower','🕰️',55,16,0.55,6) ] },
  { id:'metro',    emoji:'🚇', group:'city', stars:2, backdrop:'metro', indoor:true, dow:'weekday', traffic:1.25, rent:1.3,
    cap:0.8, tags:['travel'], events:['delay','strike','quiet','tourists','holiday'],
    spots:[ spot('exit','🚶',60,18,0.70,3), spot('platform','🚆',55,16,0.55,6) ] },
  { id:'office',   emoji:'🏢', group:'city', stars:2, backdrop:'office', dow:'weekday', traffic:1.2, rent:1.6,
    lemFair:1.1, dogFair:1.2, events:['quiet','holiday','market','truck','celebrity'],
    spots:[ spot('lobby','🛎️',70,20,0.75,3), spot('foodtrucks','🚚',60,18,0.60,6) ] },
  { id:'library',  emoji:'📚', group:'city', stars:1, backdrop:'library', indoor:true, rainLove:true, weather:'rainy',
    traffic:0.75, rent:0.8, sens:0.1, events:['trip','exam','quiet','holiday','celebrity'],
    spots:[ spot('kids','🧸',40,10,0.55,3), spot('cafe','☕',45,12,0.50,6) ] },

  /* 🎉 big crowds */
  { id:'fair',     emoji:'🎪', group:'crowd', stars:2, backdrop:'fair', days:10, traffic:1.35, rent:2.0,
    lemFair:1.25, dogFair:1.25, supply:1.15, tags:['discount','mascot'],
    events:['parade','holiday','concert','quiet','truck'],
    spots:[ spot('wheel','🎡',80,24,0.70,3), spot('carousel','🎠',70,22,0.65,5) ] },
  { id:'stadium',  emoji:'🏟️', group:'crowd', stars:2, backdrop:'stadium', traffic:0.75, rent:1.4, dog:1.2,
    dogFair:1.15, every:{ n:3, id:'match' }, tags:['mascot'], events:['quiet','truck','tourists'],
    spots:[ spot('gate','🚪',70,20,0.80,3), spot('parking','🅿️',60,18,0.60,6) ] },
  { id:'festival', emoji:'🎸', group:'crowd', stars:3, backdrop:'festival', night:true, days:7, traffic:1.9,
    rent:1.8, lemFair:1.3, dogFair:1.3, supply:1.15, sens:-0.1,
    events:['concert','storm','heat','tourists'],
    spots:[ spot('stage','🎤',60,22,0.90,2), spot('camping','⛺',50,18,0.60,3) ] },
  { id:'harbor',   emoji:'⚓', group:'crowd', stars:2, backdrop:'harbor', weather:'beach', traffic:1.1, rent:1.2,
    lem:1.05, dog:1.05, every:{ n:4, id:'cruise' }, tags:['hot'],
    events:['storm','tourists','market','quiet'],
    spots:[ spot('ferry','🛳️',70,20,0.80,3), spot('fishmarket','🐟',50,15,0.50,6) ] },
  { id:'airport',  emoji:'✈️', group:'crowd', stars:3, backdrop:'airport', indoor:true, dow:'flat', traffic:1.1,
    rent:2.4, lemFair:1.35, dogFair:1.35, supply:1.2, tags:['travel'],
    events:['delay','holiday','tourists','storm','quiet'],
    spots:[ spot('gate12','🛫',90,28,0.85,3), spot('arrivals','🧳',70,22,0.65,6) ] },
  { id:'circus',   emoji:'🤹', group:'crowd', stars:2, backdrop:'circus', traffic:0.8, rent:1.3, every:{ n:2, id:'show' },
    tags:['mascot'], events:['quiet','birthday','tourists'],
    spots:[ spot('bigtop','🎪',65,18,0.75,3), spot('animals','🐘',55,16,0.55,6) ] },
  { id:'carnival', emoji:'🎭', group:'crowd', stars:2, backdrop:'carnival', days:7, traffic:1.7, rent:1.8,
    lemFair:1.2, dogFair:1.2, tags:['mascot','discount'], events:['parade','concert','fireworks','storm'],
    spots:[ spot('paraderoute','🥁',75,22,0.80,2), spot('masks','🎭',60,18,0.55,4) ] },
  { id:'newyear',  emoji:'🎆', group:'crowd', stars:3, backdrop:'newyear', night:true, days:7, weather:'winter',
    traffic:1.5, rent:1.8, dog:1.3, lem:0.6, dogFair:1.2, supply:1.15, spoil:{ ice:0 }, every:{ n:7, id:'fireworks' },
    tags:['snow'], events:['concert','holiday','storm','quiet','freeze'],
    spots:[ spot('stage','🎤',80,24,0.80,2), spot('clock','🕛',70,20,0.65,4) ] },
  { id:'market',   emoji:'🧺', group:'crowd', stars:1, backdrop:'marketplace', weather:'mild', dow:'strong', traffic:1.15, rent:0.9,
    supply:0.85, lemFair:0.95, dogFair:0.95, tags:['discount'], events:['market','harvest','holiday','quiet','storm','parade'],
    spots:[ spot('fishstall','🐟',45,12,0.55,3), spot('flowers','💐',45,12,0.50,6) ] },
  { id:'expo',     emoji:'🏛️', group:'crowd', stars:2, backdrop:'expo', indoor:true, dow:'weekday', traffic:1.3, rent:1.7,
    lemFair:1.25, dogFair:1.25, tags:['travel'], events:['celebrity','tourists','quiet','holiday','sale'],
    spots:[ spot('hallA','🅰️',75,22,0.75,3), spot('entrance','🎟️',65,18,0.60,6) ] },

  /* ❄️ winter */
  { id:'ski',      emoji:'🎿', group:'winter', stars:2, backdrop:'snow', weather:'winter', traffic:1.0, rent:1.2,
    lem:0.6, dog:1.4, supply:1.15, spoil:{ ice:0 }, tags:['snow'], events:['snowday','holiday','quiet','storm'],
    spots:[ spot('lift','🚡',60,18,0.70,3), spot('lodge','🏠',55,16,0.60,6) ] },
  { id:'rink',     emoji:'⛸️', group:'winter', stars:1, backdrop:'rink', indoor:true, weather:'winter', traffic:0.8,
    rent:1.0, lem:0.7, dog:1.25, spoil:{ ice:0 }, tags:['snow'],
    events:['holiday','birthday','snowday','quiet'],
    spots:[ spot('rental','🥾',45,12,0.50,3), spot('bleachers','🪑',45,12,0.50,6) ] },
  { id:'xmas',     emoji:'🎄', group:'winter', stars:3, backdrop:'xmas', night:true, days:12, weather:'winter',
    traffic:1.2, rent:2.4, dog:1.35, lem:0.55, lemFair:1.2, dogFair:1.2, supply:1.2, spoil:{ ice:0 },
    tags:['snow'], events:['snowday','holiday','concert','storm','tourists'],
    spots:[ spot('tree','🎄',80,24,0.80,3), spot('gifts','🎁',70,20,0.65,6) ] },
  { id:'lodge',    emoji:'🏔️', group:'winter', stars:1, backdrop:'lodge', weather:'winter', traffic:0.85, rent:0.9,
    dog:1.35, lem:0.5, spoil:{ ice:0 }, tags:['snow'], events:['snowday','holiday','storm','quiet','freeze'],
    spots:[ spot('fireplace','🔥',45,12,0.60,3), spot('terrace','🪑',45,12,0.50,6) ] },
  { id:'sledhill', emoji:'🛷', group:'winter', stars:1, backdrop:'sledhill', weather:'winter', dow:'strong', traffic:1.0, rent:0.6,
    dog:1.3, lem:0.55, spoil:{ ice:0 }, tags:['snow'], events:['snowday','holiday','freeze','quiet','birthday'],
    spots:[ spot('top','⛰️',40,10,0.55,3), spot('bottom','🛷',40,10,0.55,6) ] },
  { id:'icefest',  emoji:'🧊', group:'winter', stars:2, backdrop:'icefest', night:true, weather:'winter', traffic:1.2, rent:1.5,
    lemFair:1.15, dogFair:1.15, dog:1.2, lem:0.6, spoil:{ ice:0 }, tags:['snow'],
    events:['tourists','holiday','storm','concert','freeze'],
    spots:[ spot('castle','🏰',65,18,0.70,3), spot('lights','🏮',55,16,0.55,6) ] },
  { id:'hockey',   emoji:'🏒', group:'winter', stars:2, backdrop:'hockey', indoor:true, weather:'winter', traffic:0.8, rent:1.2,
    dog:1.25, lem:0.75, spoil:{ ice:0 }, every:{ n:3, id:'match' }, tags:['snow','mascot'], events:['quiet','birthday','holiday'],
    spots:[ spot('stands','🪑',60,16,0.75,3), spot('lockers','🥅',50,14,0.50,6) ] },
  { id:'snowpark', emoji:'🏂', group:'winter', stars:2, backdrop:'snowpark', weather:'winter', traffic:0.95, rent:1.1,
    dog:1.2, lem:0.7, sens:0.1, lemFair:0.95, dogFair:0.95, spoil:{ ice:0 }, tags:['snow'],
    events:['snowday','storm','holiday','concert','competition'],
    spots:[ spot('halfpipe','🏂',55,15,0.65,3), spot('chairlift','🚡',55,15,0.60,6) ] },
  { id:'santavillage', emoji:'🎅', group:'winter', stars:3, backdrop:'santavillage', weather:'winter', traffic:1.4, rent:2.0,
    lemFair:1.3, dogFair:1.3, supply:1.25, dog:1.2, lem:0.7, spoil:{ ice:0 }, tags:['snow','mascot'],
    events:['tourists','holiday','storm','snowday','freeze'],
    spots:[ spot('workshop','🎁',80,24,0.80,3), spot('reindeer','🦌',70,20,0.65,6) ] },
  { id:'thermal',  emoji:'♨️', group:'winter', stars:1, backdrop:'thermal', weather:'winter', traffic:0.9, rent:1.0,
    lem:1.1, dog:1.0, spoil:{ ice:0.3 }, tags:['snow'], events:['holiday','snowday','quiet','tourists','freeze'],
    spots:[ spot('bigpool','♨️',50,14,0.60,3), spot('sauna','🧖',45,12,0.50,6) ] },

  /* 🌧️ autumn & rain */
  { id:'autumn',   emoji:'🎃', group:'rain', stars:2, backdrop:'autumn', days:12, weather:'autumn', traffic:1.0,
    rent:1.0, dog:1.3, lem:0.75, events:['parade','market','holiday','quiet','birthday'],
    spots:[ spot('pumpkins','🎃',50,14,0.60,3), spot('hayride','🚜',45,12,0.50,6) ] },
  { id:'museum',   emoji:'🏛️', group:'rain', stars:2, backdrop:'museum', indoor:true, rainLove:true, weather:'rainy',
    traffic:0.8, rent:1.1, lemFair:1.15, dogFair:1.15, events:['tourists','trip','quiet','holiday'],
    spots:[ spot('garden','🌷',50,14,0.50,3), spot('dinos','🦕',60,16,0.60,6) ] },
  { id:'highway',  emoji:'🛣️', group:'rain', stars:2, backdrop:'highway', weather:'autumn', dow:'flat', traffic:1.0,
    rent:1.0, dog:1.2, tags:['travel'], events:['delay','holiday','truck','quiet','tourists'],
    spots:[ spot('gas','⛽',60,18,0.70,3), spot('picnic','🧺',45,12,0.45,6) ] },
  { id:'harvest',  emoji:'🍇', group:'rain', stars:1, backdrop:'harvest', weather:'autumn', traffic:0.9, rent:0.6,
    supply:0.85, dog:1.15, events:['harvest','market','holiday','quiet','storm'],
    spots:[ spot('press','🍇',40,10,0.60,3), spot('cellar','🛢️',40,10,0.50,6) ] },
  { id:'halloween', emoji:'👻', group:'rain', stars:2, backdrop:'halloween', night:true, days:7, weather:'autumn', traffic:1.4, rent:1.0,
    dog:1.2, lem:0.8, every:{ n:7, id:'spooky' }, tags:['mascot'], events:['parade','holiday','storm','quiet'],
    spots:[ spot('hauntedhouse','🏚️',45,12,0.70,2), spot('pumpkinpatch','🎃',40,10,0.55,3) ] },
  { id:'aquarium', emoji:'🐠', group:'rain', stars:1, backdrop:'aquarium', indoor:true, rainLove:true, weather:'rainy',
    traffic:0.9, rent:1.2, events:['trip','tourists','quiet','holiday','birthday'],
    spots:[ spot('sharks','🦈',55,15,0.65,3), spot('touchpool','🐚',45,12,0.50,6) ] },
  { id:'greenhouse', emoji:'🌱', group:'rain', stars:1, backdrop:'greenhouse', indoor:true, weather:'rainy', traffic:0.7, rent:0.7,
    lem:1.15, supply:0.9, repMult:1.2, spoil:{ buns:0.35 }, events:['trip','tourists','quiet','birthday','holiday'],
    spots:[ spot('cactus','🌵',40,10,0.55,3), spot('butterflies','🦋',40,10,0.50,6) ] },
  { id:'bookfair', emoji:'📖', group:'rain', stars:2, backdrop:'bookfair', indoor:true, days:10, weather:'rainy', traffic:1.2, rent:1.5,
    sens:0.1, tags:['discount'], events:['celebrity','quiet','holiday','trip','sale'],
    spots:[ spot('signing','✍️',60,16,0.70,3), spot('kidscorner','🧸',50,14,0.55,5) ] },
  { id:'steamtrain', emoji:'🚂', group:'rain', stars:2, backdrop:'steamtrain', weather:'autumn', dow:'strong', traffic:1.0, rent:1.0,
    dog:1.1, tags:['travel'], events:['tourists','delay','storm','holiday','quiet'],
    spots:[ spot('platform','🚂',55,15,0.65,3), spot('museum','🛤️',50,14,0.50,6) ] },
  { id:'umbrella', emoji:'☔', group:'rain', stars:2, backdrop:'umbrella', weather:'monsoon', rainLove:true, traffic:1.3, rent:1.1,
    dog:1.1, lem:0.7, dogFair:1.1, events:['storm','market','parade','quiet','holiday'],
    spots:[ spot('arcades','🏛️',55,15,0.65,3), spot('tram','🚋',50,14,0.55,6) ] },

  /* 🌍 around the world */
  { id:'desert',   emoji:'🏜️', group:'world', stars:2, backdrop:'desert', weather:'desert', traffic:0.8, rent:0.8,
    lem:1.4, dog:0.7, lemFair:1.25, supply:1.3, spoil:{ ice:0.95 }, tags:['hot'], events:['heat','tourists','storm','quiet','trip'],
    spots:[ spot('camels','🐪',50,14,0.60,3), spot('well','💧',45,12,0.55,6) ] },
  { id:'jungle',   emoji:'🌴', group:'world', stars:2, backdrop:'jungle', weather:'tropical', traffic:0.85, rent:0.7,
    lem:1.2, dog:0.9, lemFair:1.1, supply:1.2, spoil:{ lemons:0.25, buns:0.40 }, tags:['hot'], events:['storm','tourists','trip','quiet','heat'],
    spots:[ spot('bridge','🌉',45,12,0.60,3), spot('waterfall','💦',45,12,0.55,6) ] },
  { id:'safari',   emoji:'🦓', group:'world', stars:2, backdrop:'safari', weather:'desert', dow:'flat', traffic:0.9, rent:1.0,
    lemFair:1.2, dogFair:1.2, tags:['hot','mascot'], events:['safari','tourists','heat','quiet','storm'],
    spots:[ spot('lodge','🏕️',55,15,0.65,3), spot('waterhole','🦛',50,14,0.55,6) ] },
  { id:'island',   emoji:'🏝️', group:'world', stars:1, backdrop:'island', weather:'tropical', traffic:0.9, rent:0.8,
    lem:1.3, lemFair:1.15, dogFair:1.1, supply:1.3, every:{ n:4, id:'cruise' }, tags:['hot'], events:['storm','tourists','quiet','heat'],
    spots:[ spot('jetty','⛵',50,14,0.65,3), spot('hammocks','🌴',40,10,0.50,6) ] },
  { id:'venice',   emoji:'🚣', group:'world', stars:2, backdrop:'venice', weather:'mild', traffic:1.1, rent:1.5,
    lemFair:1.2, dogFair:1.2, tags:['travel'], events:['tourists','parade','storm','holiday','wedding'],
    spots:[ spot('bridge','🌉',65,18,0.70,3), spot('gondola','🚣',60,16,0.60,6) ] },
  { id:'neoncity', emoji:'🌃', group:'world', stars:3, backdrop:'neoncity', night:true, weather:'mild', dow:'flat', traffic:1.4, rent:2.0,
    lemFair:1.3, dogFair:1.3, sens:-0.05, supply:1.15, events:['concert','celebrity','tourists','sale','quiet'],
    spots:[ spot('crossing','🚦',85,26,0.85,3), spot('arcade','🕹️',70,20,0.65,6) ] },
  { id:'pyramids', emoji:'🐫', group:'world', stars:2, backdrop:'pyramids', weather:'desert', traffic:1.0, rent:1.1,
    lem:1.3, dog:0.8, lemFair:1.2, spoil:{ ice:0.9 }, tags:['hot','travel'], events:['tourists','heat','storm','quiet','trip'],
    spots:[ spot('sphinx','🗿',60,16,0.70,3), spot('buses','🚌',55,15,0.60,6) ] },
  { id:'fjord',    emoji:'⛰️', group:'world', stars:1, backdrop:'fjord', weather:'alpine', traffic:0.8, rent:0.9,
    dog:1.2, lem:0.8, every:{ n:5, id:'cruise' }, events:['tourists','storm','quiet','kite'],
    spots:[ spot('ferry','⛴️',50,14,0.65,3), spot('viewpoint','🔭',45,12,0.50,6) ] },
  { id:'bazaar',   emoji:'🕌', group:'world', stars:2, backdrop:'bazaar', weather:'desert', traffic:1.3, rent:1.0,
    sens:0.25, lemFair:0.9, dogFair:0.9, supply:0.8, tags:['hot','discount'], events:['market','tourists','holiday','quiet','heat'],
    spots:[ spot('spices','🌶️',50,14,0.65,3), spot('carpets','🧶',45,12,0.55,6) ] },
  { id:'outback',  emoji:'🦘', group:'world', stars:2, backdrop:'outback', weather:'desert', dow:'flat', traffic:0.6, rent:0.4,
    lem:1.2, dog:1.1, supply:1.25, repMult:1.5, tags:['hot','travel'], events:['heat','tourists','quiet','storm','delay'],
    spots:[ spot('roadhouse','⛽',35,9,0.65,3), spot('kangaroo','🦘',35,9,0.55,6) ] },

  /* 🐾 nature & animals */
  { id:'zoo',      emoji:'🦁', group:'nature', stars:1, backdrop:'zoo', traffic:1.1, rent:1.1, lem:1.1,
    repMult:1.3, tags:['mascot','hot'], events:['birthday','trip','tourists','quiet','holiday'],
    spots:[ spot('monkeys','🐒',55,15,0.60,3), spot('penguins','🐧',55,15,0.55,6) ] },
  { id:'farm',     emoji:'🚜', group:'nature', stars:1, backdrop:'farm', weather:'mild', traffic:0.8, rent:0.5,
    supply:0.8, dog:1.1, tags:['mascot'], events:['market','harvest','trip','birthday','quiet'],
    spots:[ spot('barn','🐄',35,9,0.55,3), spot('pettingzoo','🐐',40,10,0.55,6) ] },
  { id:'forest',   emoji:'🌲', group:'nature', stars:1, backdrop:'forest', weather:'alpine', dow:'strong', traffic:0.75, rent:0.4,
    dog:1.15, events:['race','trip','storm','quiet','holiday'],
    spots:[ spot('trailhead','🥾',35,9,0.60,3), spot('hut','🏠',35,9,0.50,6) ] },
  { id:'stables',  emoji:'🐴', group:'nature', stars:1, backdrop:'stables', weather:'mild', traffic:0.7, rent:0.7,
    dog:1.1, repMult:1.3, events:['birthday','trip','holiday','quiet','competition'],
    spots:[ spot('arena','🏇',40,10,0.60,3), spot('paddock','🐎',40,10,0.50,6) ] },
  { id:'birdlake', emoji:'🦆', group:'nature', stars:1, backdrop:'birdlake', weather:'autumn', traffic:0.65, rent:0.4,
    dog:1.1, repMult:1.2, events:['tourists','quiet','storm','trip'],
    spots:[ spot('hide','🔭',30,8,0.60,3), spot('boats','🛶',30,8,0.50,6) ] },
  { id:'butterfly', emoji:'🦋', group:'nature', stars:1, backdrop:'butterfly', indoor:true, weather:'rainy', traffic:0.8, rent:1.0,
    lem:1.2, spoil:{ buns:0.35 }, events:['trip','birthday','tourists','quiet','holiday'],
    spots:[ spot('garden','🌺',45,12,0.55,3), spot('cocoons','🐛',40,10,0.50,6) ] },
  { id:'dogpark',  emoji:'🐕', group:'nature', stars:1, backdrop:'dogpark', dow:'strong', traffic:0.9, rent:0.6,
    dog:1.2, events:['race','birthday','holiday','quiet','competition'],
    spots:[ spot('agility','🏅',40,10,0.55,3), spot('fountain','💦',40,10,0.50,6) ] },
  { id:'dolphins', emoji:'🐬', group:'nature', stars:2, backdrop:'dolphins', weather:'beach', traffic:0.8, rent:1.3,
    lem:1.2, every:{ n:2, id:'show' }, tags:['hot','mascot'], events:['quiet','birthday','tourists'],
    spots:[ spot('stands','🪑',60,16,0.70,3), spot('gift','🎁',50,14,0.55,6) ] },
  { id:'cavepark', emoji:'🦇', group:'nature', stars:2, backdrop:'cavepark', indoor:true, weather:'alpine', traffic:0.7, rent:0.9,
    dog:1.2, lem:0.8, spoil:{ ice:0.1 }, events:['tourists','trip','storm','quiet','holiday'],
    spots:[ spot('entrance','🕯️',45,12,0.60,3), spot('lake','💧',45,12,0.55,6) ] },
  { id:'dinopark', emoji:'🦕', group:'nature', stars:2, backdrop:'dinopark', dow:'strong', traffic:1.15, rent:1.3,
    lemFair:1.15, dogFair:1.15, tags:['mascot'], events:['trip','birthday','tourists','holiday','quiet'],
    spots:[ spot('trex','🦖',60,16,0.70,3), spot('digsite','⛏️',55,15,0.55,6) ] },

  /* 🏅 sports */
  { id:'marathon', emoji:'🏃', group:'sport', stars:2, backdrop:'marathon', traffic:0.9, rent:1.0,
    lem:1.3, every:{ n:7, id:'race' }, events:['quiet','holiday','heat'],
    spots:[ spot('finish','🏁',55,15,0.70,3), spot('km30','💧',45,12,0.60,6) ] },
  { id:'tennis',   emoji:'🎾', group:'sport', stars:1, backdrop:'tennis', traffic:0.75, rent:1.2,
    lemFair:1.25, dogFair:1.2, sens:-0.1, events:['celebrity','competition','quiet','holiday'],
    spots:[ spot('centercourt','🏆',55,15,0.65,3), spot('clubhouse','🍹',50,14,0.55,6) ] },
  { id:'skatepark', emoji:'🛹', group:'sport', stars:1, backdrop:'skatepark', dow:'strong', traffic:1.0, rent:0.6,
    sens:0.2, lemFair:0.85, dogFair:0.85, tags:['discount'], events:['concert','competition','quiet','holiday','birthday'],
    spots:[ spot('bowl','🛹',40,10,0.55,3), spot('rails','🎧',40,10,0.50,6) ] },
  { id:'swimmeet', emoji:'🥇', group:'sport', stars:2, backdrop:'swimmeet', indoor:true, traffic:0.8, rent:1.1,
    lem:1.2, dog:0.9, every:{ n:3, id:'competition' }, events:['quiet','birthday','holiday'],
    spots:[ spot('stands','🪑',55,15,0.70,3), spot('warmup','🏊',45,12,0.55,6) ] },
  { id:'cycling',  emoji:'🚴', group:'sport', stars:2, backdrop:'cycling', weather:'alpine', dow:'flat', traffic:0.85, rent:0.7,
    lem:1.1, dog:1.1, every:{ n:4, id:'race' }, events:['quiet','tourists','storm'],
    spots:[ spot('summit','⛰️',45,12,0.65,3), spot('village','🏘️',45,12,0.55,6) ] },
  { id:'gym',      emoji:'🏋️', group:'sport', stars:1, backdrop:'gym', indoor:true, dow:'weekday', traffic:0.9, rent:1.1,
    lem:1.2, dog:0.7, lemFair:1.1, events:['quiet','holiday','competition','celebrity'],
    spots:[ spot('reception','🛎️',50,14,0.60,3), spot('classes','🧘',45,12,0.50,6) ] },
  { id:'basketball', emoji:'🏀', group:'sport', stars:1, backdrop:'basketball', dow:'strong', traffic:1.0, rent:0.6,
    sens:0.15, lemFair:0.9, dogFair:0.9, tags:['mascot'], events:['game','birthday','quiet','holiday','concert'],
    spots:[ spot('bleachers','🪑',40,10,0.55,3), spot('court2','🏀',40,10,0.50,6) ] },
  { id:'karting',  emoji:'🏎️', group:'sport', stars:2, backdrop:'karting', traffic:0.9, rent:1.3,
    lemFair:1.15, dogFair:1.15, tags:['mascot'], events:['birthday','birthday','race','holiday','quiet'],
    spots:[ spot('pitlane','🔧',55,15,0.65,3), spot('podium','🏆',50,14,0.55,6) ] },
  { id:'golf',     emoji:'⛳', group:'sport', stars:1, backdrop:'golf', weather:'mild', dow:'strong', traffic:0.6, rent:1.0,
    lemFair:1.35, dogFair:1.35, sens:-0.15, events:['competition','celebrity','quiet','storm'],
    spots:[ spot('hole9','⛳',55,15,0.65,3), spot('clubhouse','🏌️',50,14,0.55,6) ] },
  { id:'climbing', emoji:'🧗', group:'sport', stars:2, backdrop:'climbing', indoor:true, rainLove:true, weather:'rainy', traffic:0.8, rent:1.0,
    lem:1.15, events:['competition','birthday','quiet','holiday'],
    spots:[ spot('boulder','🧱',45,12,0.60,3), spot('kidswall','🧒',45,12,0.55,6) ] },

  /* 🎭 fun & arts */
  { id:'themepark', emoji:'🎢', group:'fun', stars:3, backdrop:'themepark', dow:'strong', traffic:1.5, rent:2.2,
    lemFair:1.35, dogFair:1.35, supply:1.15, tags:['mascot','discount'], events:['holiday','tourists','storm','birthday','quiet'],
    spots:[ spot('coaster','🎢',90,28,0.85,3), spot('parade','🎠',75,22,0.65,6) ] },
  { id:'theater',  emoji:'🎭', group:'fun', stars:2, backdrop:'theater', indoor:true, night:true, weather:'rainy', traffic:0.8, rent:1.3,
    lemFair:1.2, dogFair:1.2, every:{ n:5, id:'premiere' }, events:['quiet','holiday','celebrity'],
    spots:[ spot('foyer','🥂',55,15,0.70,3), spot('stagedoor','🚪',50,14,0.50,6) ] },
  { id:'arcade',   emoji:'🕹️', group:'fun', stars:1, backdrop:'arcade', indoor:true, rainLove:true, weather:'rainy', dow:'strong', traffic:1.0, rent:1.1,
    sens:0.15, lemFair:0.9, dogFair:0.9, tags:['discount'], events:['birthday','holiday','quiet','sale'],
    spots:[ spot('prizes','🧸',45,12,0.60,3), spot('dance','🕺',45,12,0.55,6) ] },
  { id:'comiccon', emoji:'🦸', group:'fun', stars:2, backdrop:'comiccon', indoor:true, days:7, traffic:1.6, rent:1.9,
    lemFair:1.25, dogFair:1.25, tags:['mascot','discount'], events:['celebrity','tourists','quiet','holiday'],
    spots:[ spot('mainstage','🎤',75,22,0.80,2), spot('artists','🖌️',60,18,0.60,4) ] },
  { id:'balloonfest', emoji:'🎈', group:'fun', stars:2, backdrop:'balloonfest', weather:'mild', days:7, traffic:1.3, rent:1.2,
    lem:1.1, events:['storm','holiday','tourists','quiet','kite'],
    spots:[ spot('launch','🎈',55,15,0.70,2), spot('hill','⛰️',45,12,0.55,4) ] },
  { id:'filmset',  emoji:'🎥', group:'fun', stars:2, backdrop:'filmset', dow:'flat', traffic:0.7, rent:0.8,
    lemFair:1.2, dogFair:1.2, events:['celebrity','quiet','delay','storm'],
    spots:[ spot('catering','🍽️',45,12,0.65,3), spot('trailers','🚐',45,12,0.55,6) ] },
  { id:'puppet',   emoji:'🧸', group:'fun', stars:1, backdrop:'puppet', indoor:true, weather:'mild', dow:'flat', traffic:1.0, rent:0.6,
    sens:0.2, lemFair:0.85, dogFair:0.85, tags:['mascot'], events:['trip','birthday','holiday','quiet'],
    spots:[ spot('lobby','🎟️',40,10,0.55,3), spot('garden','🌷',40,10,0.50,6) ] },
  { id:'artfair',  emoji:'🎨', group:'fun', stars:2, backdrop:'artfair', weather:'mild', traffic:0.9, rent:1.2,
    lemFair:1.3, dogFair:1.25, sens:-0.1, events:['tourists','celebrity','storm','quiet','sale'],
    spots:[ spot('sculptures','🗿',55,15,0.60,3), spot('vip','🥂',50,14,0.55,6) ] },
  { id:'musicschool', emoji:'🎻', group:'fun', stars:1, backdrop:'musicschool', indoor:true, dow:'weekday', traffic:0.85, rent:0.7,
    sens:0.1, events:['concert','exam','birthday','quiet','holiday'],
    spots:[ spot('hall','🎹',35,8,0.60,3), spot('practice','🎺',35,8,0.50,6) ] },
  { id:'flea',     emoji:'🛒', group:'fun', stars:1, backdrop:'flea', weather:'mild', dow:'strong', traffic:1.2, rent:0.5,
    sens:0.2, lemFair:0.85, dogFair:0.85, supply:0.85, tags:['discount'], events:['market','sale','storm','quiet','holiday'],
    spots:[ spot('antiques','🕰️',40,10,0.60,3), spot('toys','🧸',40,10,0.55,6) ] },

  /* 🚀 wild adventures */
  { id:'moonbase', emoji:'🌕', group:'wild', stars:3, backdrop:'moonbase', indoor:true, weather:'mild', dow:'flat', traffic:0.8, rent:2.0,
    lemFair:1.6, dogFair:1.6, supply:1.6, cap:0.8, spoil:{ ice:0, lemons:0, buns:0, sausages:0 },
    events:['launch','blackout','quiet','tourists'],
    spots:[ spot('airlock','🚪',70,14,0.75,3), spot('rover','🛸',60,12,0.65,6) ] },
  { id:'pirateship', emoji:'🦜', group:'wild', stars:2, backdrop:'pirateship', weather:'beach', traffic:0.9, rent:1.0,
    lem:1.1, dog:1.1, tags:['hot','mascot'], events:['storm','tourists','holiday','quiet','birthday'],
    spots:[ spot('deck','🗡️',50,14,0.65,3), spot('treasure','💰',50,14,0.55,6) ] },
  { id:'castle',   emoji:'🏯', group:'wild', stars:2, backdrop:'castle', weather:'mild', dow:'strong', traffic:1.0, rent:1.2,
    lemFair:1.15, dogFair:1.15, tags:['travel'], events:['tourists','wedding','holiday','storm','quiet'],
    spots:[ spot('drawbridge','🌉',55,15,0.65,3), spot('courtyard','🛡️',50,14,0.55,6) ] },
  { id:'lighthouse', emoji:'🌅', group:'wild', stars:1, backdrop:'lighthouse', weather:'alpine', traffic:0.6, rent:0.5,
    dog:1.1, repMult:1.3, events:['storm','tourists','quiet','kite'],
    spots:[ spot('pier','🎣',30,7,0.60,3), spot('top','🔭',30,7,0.50,6) ] },
  { id:'volcano',  emoji:'🌋', group:'wild', stars:2, backdrop:'volcano', weather:'desert', traffic:0.85, rent:1.0,
    lem:1.35, dog:0.8, spoil:{ ice:0.9 }, tags:['hot'], events:['tourists','heat','storm','trip','quiet'],
    spots:[ spot('crater','🌋',50,14,0.65,3), spot('lava','🔥',45,12,0.55,6) ] },
  { id:'spacecenter', emoji:'🚀', group:'wild', stars:2, backdrop:'spacecenter', indoor:true, dow:'strong', traffic:1.0, rent:1.4,
    lemFair:1.2, dogFair:1.2, every:{ n:5, id:'launch' }, events:['trip','tourists','quiet','holiday'],
    spots:[ spot('rocketgarden','🚀',60,16,0.70,3), spot('simulator','🕹️',55,15,0.55,6) ] },
  { id:'treehouse', emoji:'🏡', group:'wild', stars:1, backdrop:'treehouse', weather:'mild', dow:'strong', traffic:0.7, rent:0.5,
    repMult:1.3, events:['trip','birthday','storm','quiet','holiday'],
    spots:[ spot('zipline','🌉',35,9,0.60,3), spot('bigtree','🌳',35,9,0.55,6) ] },
  { id:'robotfactory', emoji:'🤖', group:'wild', stars:2, backdrop:'robotfactory', indoor:true, dow:'weekday', traffic:0.9, rent:1.3,
    cap:1.3, lemFair:1.1, dogFair:1.1, events:['trip','tourists','blackout','quiet','holiday'],
    spots:[ spot('showroom','🤖',55,15,0.65,3), spot('assembly','🔧',50,14,0.55,6) ] },
  { id:'underwater', emoji:'🐙', group:'wild', stars:3, backdrop:'underwater', indoor:true, weather:'beach', traffic:0.75, rent:1.8,
    lemFair:1.4, dogFair:1.4, supply:1.4, cap:0.8, spoil:{ ice:0.2 }, tags:['travel'], events:['tourists','storm','quiet','celebrity'],
    spots:[ spot('tunnel','🐠',70,18,0.75,3), spot('elevator','🔽',60,14,0.60,6) ] },
  { id:'wizardfair', emoji:'🧙', group:'wild', stars:2, backdrop:'wizardfair', night:true, days:10, weather:'autumn', traffic:1.2, rent:1.3,
    dog:1.15, lem:0.9, lemFair:1.1, dogFair:1.1, tags:['mascot'], events:['parade','holiday','storm','concert','celebrity'],
    spots:[ spot('potions','🧪',55,15,0.65,3), spot('dragon','🐉',55,15,0.60,5) ] }
];
var MODE_GROUPS = ['sun', 'city', 'crowd', 'winter', 'rain', 'world', 'nature', 'sport', 'fun', 'wild'];

/* cash goal per adventure, as a multiplier on the difficulty's profit target.
   Generated by the headless balance run (scratch/balance.js) so that a
   plain "buy for a normal day, answer no to every card" season lands
   just under the Founder goal and a stand-opening season lands over it. */
var MODE_GOALS = {
  street:1.30, beach:1.15, park:1.25, pool:1.15, camp:1.20, village:0.95,
  waterpark:1.20, lakeside:1.20, orchard:1.20, sunflower:1.35, downtown:1.35, station:1.10,
  mall:1.20, cinema:1.15, campus:1.00, school:0.85, oldtown:1.65, metro:0.80,
  office:1.55, library:1.10, fair:1.55, stadium:1.20, festival:1.60, harbor:1.25,
  airport:1.45, circus:0.95, carnival:1.95, newyear:1.85, market:1.15, expo:2.15,
  ski:1.20, rink:1.25, xmas:1.75, lodge:1.25, sledhill:1.70, icefest:2.00,
  hockey:1.35, snowpark:1.15, santavillage:2.25, thermal:1.00, autumn:1.35, museum:1.55,
  highway:1.25, harvest:1.45, halloween:1.35, aquarium:1.20, greenhouse:1.15, bookfair:1.30,
  steamtrain:0.95, umbrella:1.65, desert:1.45, jungle:0.85, safari:2.10, island:1.00,
  venice:1.65, neoncity:1.85, pyramids:1.85, fjord:1.05, bazaar:1.45, outback:1.00,
  zoo:1.35, farm:1.45, forest:1.10, stables:0.95, birdlake:0.75, butterfly:1.05,
  dogpark:1.40, dolphins:1.05, cavepark:0.85, dinopark:1.55, marathon:1.15, tennis:1.55,
  skatepark:0.90, swimmeet:1.05, cycling:1.20, gym:1.00, basketball:1.00, karting:1.45,
  golf:1.05, climbing:1.15, themepark:1.70, theater:1.45, arcade:0.90, comiccon:2.35,
  balloonfest:1.15, filmset:1.35, puppet:1.00, artfair:1.55, musicschool:1.05, flea:1.10,
  moonbase:1.05, pirateship:1.25, castle:1.25, lighthouse:0.75, volcano:1.20, spacecenter:1.90,
  treehouse:0.80, robotfactory:1.05, underwater:0.80, wizardfair:1.60
};

var MODES_BY_ID = {};
MODES.forEach(function (m) {
  for (var k in MODE_DEFAULTS) if (m[k] === undefined) m[k] = MODE_DEFAULTS[k];
  if (MODE_GOALS[m.id]) m.goal = MODE_GOALS[m.id];
  MODES_BY_ID[m.id] = m;
});

/* ───────────────────────────── decision cards ─────────────────────────────
   One card may show up on a day. Each option is a bag of effects:
   cash (now), rep (at closing), traffic (× today), cap (± today), noSpoil,
   supplyOff {key: ×}, revShare (slice of revenue), priceOff (× your prices),
   preorder {prod, n, price}, prize {items, cash}, loan {get, pay, days}, awareness.
   Cards with tags only appear in adventures that share a tag. */
var CARDS = {
  party:     { emoji:'🎂', yes:{ preorder:{ prod:'lemonade', n:20, price:1.50 } } },
  bigorder:  { emoji:'👷', yes:{ preorder:{ prod:'hotdog',   n:15, price:2.75 } } },
  charity:   { emoji:'💝', yes:{ preorder:{ prod:'lemonade', n:15, price:0 }, rep:10 } },
  team:      { emoji:'🏆', yes:{ cash:-20, rep:8 } },
  fridge:    { emoji:'🧊', yes:{ cash:-6, noSpoil:true } },
  flyers:    { emoji:'📄', yes:{ cash:-8, traffic:1.20 } },
  cousin:    { emoji:'🧑‍🤝‍🧑', yes:{ cap:35, revShare:0.10 } },
  complaint: { emoji:'😠', yes:{ cash:-5, rep:2 }, no:{ rep:-4 } },
  farmer:    { emoji:'🌾', yes:{ supplyOff:{ lemons:0.5 } } },
  butcher:   { emoji:'🥩', yes:{ supplyOff:{ sausages:0.7 } } },
  balloon:   { emoji:'🎈', yes:{ cash:-15, traffic:1.30 } },
  musician:  { emoji:'🎻', yes:{ cash:-10, traffic:1.15, rep:3 } },
  loan:      { emoji:'🏦', yes:{ loan:{ get:50, pay:60, days:3 } }, minLeft:4 },
  tv:        { emoji:'📺', yes:{ cash:-30, awareness:0.35, traffic:1.10 } },
  cleanup:   { emoji:'🧹', yes:{ cap:-12, rep:6 } },
  contest:   { emoji:'🎯', yes:{ cash:-10, prize:{ items:40, cash:40 } } },
  mascot:    { emoji:'🦁', tags:['mascot'],   yes:{ cash:-12, traffic:1.25, rep:2 } },
  snowplow:  { emoji:'⛄', tags:['snow'],     yes:{ cash:-8 }, no:{ traffic:0.60 } },
  umbrellas: { emoji:'⛱️', tags:['hot'],      yes:{ cash:-7, rep:3, traffic:1.10 } },
  stranded:  { emoji:'🕰️', tags:['travel'],   yes:{ cash:-6, traffic:1.35 } },
  discount:  { emoji:'🏷️', tags:['discount'], yes:{ priceOff:0.8, traffic:1.40 } }
};
var CARD_IDS = Object.keys(CARDS);

var BASE_TRAFFIC = 22;
var BASE_CAP     = 40;
var STAFF_COST   = 25;
var STAFF_CAP    = 35;
var SAVE_KEY     = 'bossOfTheBlock.save.v2';
var PROGRESS_KEY = 'bossOfTheBlock.progress.v1';

/* ───────────────────────────── helpers ───────────────────────────── */

var $  = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
var round2 = function (v) { return Math.round(v * 100) / 100; };
var roundQ = function (v) { return Math.round(v * 4) / 4; };

function money(n, force) {
  var neg = n < -0.004;
  var s = '$' + Math.abs(n).toFixed(2);
  return neg ? '−' + s : (force && n > 0.004 ? '+' + s : s);
}
function money0(n) {
  var neg = n < -0.5;
  return (neg ? '−$' : '$') + Math.round(Math.abs(n)).toLocaleString();
}
function pct(n) { return Math.round(n * 100) + '%'; }
function stars(n) { return n === 3 ? '⭐⭐⭐' : n === 2 ? '⭐⭐' : '⭐'; }

/* deterministic PRNG so a given season replays identically */
function mulberry(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

/* ───────────────────────────── state ───────────────────────────── */

var S = null;
var sim = null;

function MODE() { return MODES_BY_ID[S.mode] || MODES_BY_ID.street; }
function totalDays() { return MODE().days; }
function goalFor(modeId, diff) {
  var m = MODES_BY_ID[modeId], d = DIFFS[diff];
  return Math.round((d.cash + d.profit * m.goal * (m.days / 14)) / 5) * 5;
}
function rentFor() { return Math.round(DIFFS[S.diff].rent * MODE().rent); }

function newState(name, diff, modeId) {
  var seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
  var rng = mulberry(seed);
  var d = DIFFS[diff];
  var m = MODES_BY_ID[modeId] || MODES_BY_ID.street;

  return {
    v: 2,
    seed: seed,
    name: name,
    diff: diff,
    mode: m.id,
    day: 1,
    cash: d.cash,
    rep: 50,
    awareness: 0,
    season: buildSeason(rng, m),
    stock: zeroStock(),
    prices: { lemonade: roundQ(2.00 * m.lemFair), hotdog: roundQ(3.50 * m.dogFair) },
    recipe: { lemonade: 1, hotdog: 1 },
    order: zeroStock(),
    marketing: 0,
    staff: false,
    upgrades: [],
    spots: {},          /* spotId -> { open: bool } once bought */
    cardPick: null,     /* 'yes' | 'no' | null for today's card */
    loans: [],          /* { due, pay, get } */
    history: [],
    spent: 0,
    earned: 0,
    intro: true
  };
}

function zeroStock() {
  var o = {};
  SUP_KEYS.forEach(function (k) { o[k] = 0; });
  return o;
}

function buildSeason(rng, m) {
  var pool = WEATHER_POOLS[m.weather].slice();
  /* shuffle but keep day 1 friendly */
  for (var i = pool.length - 1; i > 1; i--) {
    var j = 1 + Math.floor(rng() * i);
    var t = pool[i]; pool[i] = pool[j]; pool[j] = t;
  }

  var cardCount = {}, lastCard = null;
  var days = [];
  for (var d = 0; d < m.days; d++) {
    var w = WEATHER[pool[d]];
    var ev = null;
    if (m.every && (d + 1) % m.every.n === 0) ev = m.every.id;
    else if (d >= 1 && rng() < 0.42) {
      ev = pick(rng, m.events);
      if (ev === 'heat' && w.lem < 0.6) ev = null;       /* no heat advisory when it is cold */
      if (ev === 'quiet' && d < 3) ev = null;            /* let them find their feet */
      if (ev === 'storm' && d < 2) ev = null;
    }

    /* today's decision card, if any */
    var card = null;
    if (d >= 1 && rng() < 0.55) {
      var ok = CARD_IDS.filter(function (id) {
        var c = CARDS[id];
        if (id === lastCard || (cardCount[id] || 0) >= 2) return false;
        if (c.minLeft && m.days - d < c.minLeft) return false;
        if (!c.tags) return true;
        return c.tags.some(function (tg) { return m.tags.indexOf(tg) !== -1; });
      });
      if (ok.length) { card = pick(rng, ok); cardCount[card] = (cardCount[card] || 0) + 1; }
    }
    lastCard = card;

    days.push({
      key: pool[d],
      temp: Math.round(w.t[0] + rng() * (w.t[1] - w.t[0])),
      dowIdx: d % 7,
      event: ev,
      card: card,
      noise: 0.90 + rng() * 0.20
    });
  }
  return days;
}

function today() { return S.season[S.day - 1]; }
function todayEvent() { var d = today(); return d.event ? EVENTS[d.event] : null; }
function todayCard() { var d = today(); return d.card ? CARDS[d.card] : null; }

/* ───────────────────────────── derived numbers ───────────────────────────── */

function packPrice(k) { return round2(SUPPLIES[k].packPrice * MODE().supply); }
function unitPrice(k) { return packPrice(k) / SUPPLIES[k].pack; }

function recipeOf(prod) { return RECIPES[prod][S.recipe[prod]]; }

function unitCost(prod, lvl) {
  var r = RECIPES[prod][lvl === undefined ? S.recipe[prod] : lvl];
  var c = 0;
  for (var k in r.parts) c += r.parts[k] * unitPrice(k);
  return round2(c);
}

/* how many units the given stock can build */
function buildable(prod, stock) {
  var r = recipeOf(prod), n = Infinity;
  for (var k in r.parts) n = Math.min(n, Math.floor((stock[k] || 0) / r.parts[k]));
  return n === Infinity ? 0 : n;
}

function stockAfterOrder() {
  var o = {};
  SUP_KEYS.forEach(function (k) { o[k] = S.stock[k] + S.order[k] * SUPPLIES[k].pack; });
  return o;
}

function bulkRate(packs) { return packs >= 10 ? 0.15 : packs >= 5 ? 0.10 : 0; }

/* today's purchase discount on one supply: market day, farmer card… */
function supplyOff(k) {
  var ev = todayEvent(), mods = dayMods();
  var off = (ev && ev.supplyOff) ? ev.supplyOff : 1;
  if (mods.supplyOff && mods.supplyOff[k]) off *= mods.supplyOff[k];
  return off;
}

function orderCost() {
  var gross = 0, net = 0;
  SUP_KEYS.forEach(function (k) {
    var packs = S.order[k];
    if (!packs) return;
    var g = packs * packPrice(k) * supplyOff(k);
    gross += g;
    net += g * (1 - bulkRate(packs));
  });
  return { gross: round2(gross), net: round2(net), saved: round2(gross - net) };
}

/* overnight loss rate for one supply, after upgrades and today's card */
function spoilRate(k) {
  var m = MODE();
  var rate = (m.spoil && m.spoil[k] !== undefined) ? m.spoil[k] : SUPPLIES[k].spoil;
  if (has('cooler') && k === 'ice') rate = round2(rate * 0.34);
  if (has('cooler') && k === 'lemons') rate = 0.04;
  if (has('bunbox') && k === 'buns') rate = 0.08;
  if (dayMods().noSpoil) rate = 0;
  return rate;
}

function has(id) { return S.upgrades.indexOf(id) !== -1; }

/* extra stands */
function spotDef(id) {
  var list = MODE().spots;
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}
function openSpots() {
  return MODE().spots.filter(function (sp) { return S.spots[sp.id] && S.spots[sp.id].open; });
}
function spotTraffic() { return openSpots().reduce(function (a, sp) { return a + sp.traffic; }, 0); }
function spotRent() { return openSpots().reduce(function (a, sp) { return a + sp.rent; }, 0); }
function spotCap() { return openSpots().reduce(function (a, sp) { return a + sp.cap; }, 0); }

function capacity() {
  var c = BASE_CAP;
  if (S.staff) c += STAFF_CAP;
  if (has('register')) c += 15;
  if (has('grill')) c += 25;
  c = Math.round(c * MODE().cap) + spotCap() + (dayMods().cap || 0);
  return Math.max(5, c);
}

/* effects of today's decision card, given what the player picked */
function cardEffects(pickOpt) {
  var c = todayCard();
  if (!c) return {};
  var opt = pickOpt === undefined ? S.cardPick : pickOpt;
  if (!opt) return {};
  return c[opt] || {};
}
function dayMods() { return cardEffects(); }

/* weather the way this adventure feels it: indoors it is mostly background */
function feltWeather() {
  var day = today(), w = WEATHER[day.key], m = MODE();
  var f = { traffic: w.traffic, lem: w.lem, dog: w.dog, lemFair: w.lemFair, dogFair: w.dogFair };
  var wet = day.key === 'rainy' || day.key === 'snowy' || day.key === 'cloudy';
  if (m.indoor) {
    f.traffic = 1 + (w.traffic - 1) * 0.25 + (wet ? 0.15 : 0);
    f.lem = 0.50 + (w.lem - 0.50) * 0.35;
    f.dog = 0.60 + (w.dog - 0.60) * 0.35;
    f.lemFair = 1 + (w.lemFair - 1) * 0.4;
    f.dogFair = 1 + (w.dogFair - 1) * 0.4;
  }
  if (m.rainLove && wet) f.traffic += 0.25;
  return f;
}

/* the price customers actually pay today (a discount card can lower it) */
function effPrice(prod) {
  var off = dayMods().priceOff || 1;
  return round2(S.prices[prod] * off);
}

function fairPrice(prod) {
  var w = feltWeather(), m = MODE();
  var base = PRODUCTS[prod].baseFair;
  var wf = prod === 'lemonade' ? w.lemFair * m.lemFair : w.dogFair * m.dogFair;
  var repF = 0.90 + (S.rep / 100) * 0.20;
  return base * recipeOf(prod).fair * wf * repF;
}

function fixedCosts() {
  return rentFor() + (S.staff ? STAFF_COST : 0) + S.marketing + spotRent();
}

/* Core demand model. `noise` = 1 for the planning estimate. */
function demandFor(prod, noise) {
  var day = today(), m = MODE();
  var w = feltWeather();
  var ev = todayEvent();
  var mods = dayMods();

  var traffic = BASE_TRAFFIC * m.traffic * w.traffic * DOW_PROFILES[m.dow][day.dowIdx];
  if (ev) traffic *= ev.traffic;
  if (has('sign')) traffic *= 1.15;
  traffic *= 1 + spotTraffic();
  if (mods.traffic) traffic *= mods.traffic;

  traffic *= 1 + 0.50 * (1 - Math.exp(-S.marketing / 20)) + S.awareness * 0.20;
  traffic *= 0.72 + (S.rep / 100) * 0.56;
  traffic *= noise;

  var interest = prod === 'lemonade' ? w.lem * m.lem : w.dog * m.dog;
  if (ev && ev[prod === 'lemonade' ? 'lem' : 'dog']) interest *= ev[prod === 'lemonade' ? 'lem' : 'dog'];

  var fair = fairPrice(prod);
  var price = effPrice(prod);
  var sens = Math.max(0.5, DIFFS[S.diff].sens + m.sens);
  var pf = clamp(1 - ((price - fair) / fair) * sens, 0.02, 1.55);
  var qf = 0.85 + recipeOf(prod).sat * 0.15;

  return Math.max(0, traffic * interest * pf * qf);
}

/* Run a full day. noiseOn=false gives the deterministic planning estimate. */
function runDay(noiseOn) {
  var day = today();
  var stock = stockAfterOrder();
  var cap = capacity();
  var mods = dayMods();
  var prices = { lemonade: effPrice('lemonade'), hotdog: effPrice('hotdog') };

  /* a pre-order is made first thing in the morning, straight from stock */
  var pre = null;
  if (mods.preorder) {
    var po = mods.preorder;
    var got = Math.min(po.n, buildable(po.prod, stock));
    pre = { prod: po.prod, want: po.n, got: got, price: po.price };
    var pr = recipeOf(po.prod);
    for (var pk in pr.parts) stock[pk] -= pr.parts[pk] * got;
  }

  var want = { lemonade: demandFor('lemonade', noiseOn ? day.noise : 1),
               hotdog:   demandFor('hotdog',   noiseOn ? day.noise : 1) };

  var able = { lemonade: buildable('lemonade', stock), hotdog: buildable('hotdog', stock) };

  /* stock limit first, then the service-capacity ceiling shared between products */
  var sold = { lemonade: Math.min(Math.round(want.lemonade), able.lemonade),
               hotdog:   Math.min(Math.round(want.hotdog),   able.hotdog) };

  var lostCap = 0;
  var total = sold.lemonade + sold.hotdog;
  if (total > cap) {
    var keep = cap / total;
    lostCap = total - cap;
    sold.lemonade = Math.floor(sold.lemonade * keep);
    sold.hotdog   = Math.floor(sold.hotdog * keep);
  }

  var lostStock = Math.max(0, Math.round(want.lemonade) - sold.lemonade) +
                  Math.max(0, Math.round(want.hotdog) - sold.hotdog) - lostCap;
  lostStock = Math.max(0, lostStock);

  /* consume ingredients */
  var made = { lemonade: sold.lemonade, hotdog: sold.hotdog };
  if (pre) made[pre.prod] += pre.got;
  var left = {};
  SUP_KEYS.forEach(function (k) { left[k] = stock[k]; });
  PRODS.forEach(function (p) {
    var r = recipeOf(p);
    for (var k in r.parts) left[k] -= r.parts[k] * sold[p];
  });
  SUP_KEYS.forEach(function (k) { left[k] = Math.max(0, left[k]); });

  var preRev = pre ? round2(pre.got * pre.price) : 0;
  var revenue = round2(sold.lemonade * prices.lemonade + sold.hotdog * prices.hotdog + preRev);
  var cogsL = round2(made.lemonade * unitCost('lemonade'));
  var cogsD = round2(made.hotdog * unitCost('hotdog'));

  /* overnight spoilage on what is left */
  var waste = 0, kept = {};
  SUP_KEYS.forEach(function (k) {
    var lose = Math.floor(left[k] * spoilRate(k));
    waste += lose * unitPrice(k);
    kept[k] = left[k] - lose;
  });
  waste = round2(waste);

  /* the day's special money lines */
  var share = mods.revShare ? round2(revenue * mods.revShare) : 0;
  var served = sold.lemonade + sold.hotdog + (pre ? pre.got : 0);
  var prize = (mods.prize && served >= mods.prize.items) ? mods.prize.cash : 0;
  var cardCash = mods.loan ? 0 : (mods.cash || 0);         /* the loan is financing, not a cost */
  var loanGet = mods.loan ? mods.loan.get : 0;
  var loanPay = 0, loanInterest = 0;
  S.loans.forEach(function (l) { if (l.due === S.day) { loanPay += l.pay; loanInterest += l.pay - l.get; } });

  var fixed = fixedCosts();
  var gross = round2(revenue - cogsL - cogsD);
  var net = round2(gross - fixed - waste - share - loanInterest + prize + cardCash);

  /* reputation */
  var repDelta = 0, walkups = sold.lemonade + sold.hotdog;
  if (walkups > 0) {
    PRODS.forEach(function (p) {
      if (!sold[p]) return;
      var value = recipeOf(p).sat * (fairPrice(p) / prices[p]);
      repDelta += (clamp(value, 0.4, 1.6) - 1) * 13 * (sold[p] / walkups);
    });
  } else repDelta -= 2;
  var missed = lostStock + lostCap;
  var missRate = missed / Math.max(1, walkups + missed);
  if (missRate > 0.05) repDelta -= Math.min(7, missRate * 13);
  /* word of mouth: serve nearly everyone who showed up and the block starts to notice */
  else if (walkups > 0 && repDelta > -0.5) repDelta += 1.2;
  if (repDelta > 0 && has('umbrella')) repDelta *= 1.5;
  repDelta *= MODE().repMult;
  if (pre && pre.got < pre.want) repDelta -= 3;
  repDelta += mods.rep || 0;
  repDelta = clamp(repDelta, -12, 14);

  return {
    day: S.day, sold: sold, want: want, cap: cap, able: able, pre: pre,
    lostStock: lostStock, lostCap: lostCap,
    revenue: revenue, preRev: preRev, cogsL: cogsL, cogsD: cogsD, cogs: round2(cogsL + cogsD),
    gross: gross, rent: rentFor(), spotRent: spotRent(), staff: S.staff ? STAFF_COST : 0,
    marketing: S.marketing, waste: waste, fixed: fixed, net: net,
    share: share, prize: prize, cardCash: cardCash, loanGet: loanGet, loanPay: loanPay, loanInterest: loanInterest,
    card: day.card, cardPick: S.cardPick,
    repDelta: repDelta, kept: kept,
    prices: prices, listPrices: { lemonade: S.prices.lemonade, hotdog: S.prices.hotdog },
    recipe: { lemonade: S.recipe.lemonade, hotdog: S.recipe.hotdog },
    weather: day.key, event: day.event, spots: openSpots().map(function (sp) { return sp.id; }),
    awareness: mods.awareness || 0,
    supplySpend: orderCost().net
  };
}

/* book the day into the state — pure, so it can be tested without a page */
function applyResult(res) {
  S.cash = round2(S.cash + res.revenue - res.fixed - res.share - res.loanPay + res.prize);
  res.cashEnd = S.cash;
  S.earned = round2(S.earned + res.revenue + res.prize);
  S.spent = round2(S.spent + res.fixed + res.share);
  S.stock = res.kept;
  S.rep = clamp(round2(S.rep + res.repDelta), 5, 100);
  S.awareness = clamp(S.awareness * 0.5 + S.marketing / 100 + res.awareness, 0, 0.6);
  S.loans = S.loans.filter(function (l) { return l.due > S.day; });
  S.history.push(res);
}

/* the "stock for a … day" shortcut, as pure numbers */
function autoOrderFor(level) {
  var mult = level === 'light' ? 0.65 : level === 'heavy' ? 1.45 : 1.0;
  var target = { lemonade: Math.ceil(demandFor('lemonade', 1) * mult),
                 hotdog:   Math.ceil(demandFor('hotdog', 1) * mult) };
  var mods = dayMods();
  if (mods.preorder) target[mods.preorder.prod] += mods.preorder.n;

  var need = zeroStock();
  PRODS.forEach(function (p) {
    var r = recipeOf(p);
    for (var k in r.parts) need[k] += r.parts[k] * target[p];
  });

  var order = zeroStock();
  SUP_KEYS.forEach(function (k) {
    var short = Math.max(0, need[k] - S.stock[k]);
    order[k] = Math.min(40, Math.ceil(short / SUPPLIES[k].pack));
  });
  return order;
}

/* ───────────────────────────── screens ───────────────────────────── */

function show(id) {
  $$('.screen').forEach(function (s) { s.classList.toggle('is-active', s.id === id); });
  window.scrollTo({ top: 0, behavior: 'instant' in document.body.style ? 'instant' : 'auto' });
}

function toast(msg, kind) {
  var t = document.createElement('div');
  t.className = 'toast' + (kind ? ' ' + kind : '');
  t.textContent = msg;
  $('#toastStack').appendChild(t);
  setTimeout(function () {
    t.style.transition = 'opacity .3s, transform .3s';
    t.style.opacity = '0'; t.style.transform = 'translateY(10px)';
    setTimeout(function () { t.remove(); }, 320);
  }, 2300);
}

/* ───────────────────────────── progress (stars on the map) ───────────────────────────── */

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch (e) { return {}; }
}
function recordProgress(modeId, won, cash) {
  var p = loadProgress();
  var cur = p[modeId] || { won: false, best: 0, plays: 0 };
  cur.plays++;
  cur.won = cur.won || won;
  cur.best = Math.max(cur.best, Math.round(cash));
  p[modeId] = cur;
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {}
}

/* ───────────────────────────── start screen ───────────────────────────── */

var chosenDiff = 'easy';
var chosenMode = 'street';

var WORLD_KEY = 'bossOfTheBlock.world';
var chosenWorld = (function () {
  try { var w = localStorage.getItem(WORLD_KEY); if (w && MODE_GROUPS.indexOf(w) !== -1) return w; } catch (e) {}
  return MODE_GROUPS[0];
})();

function buildModeMap() {
  var prog = loadProgress();
  var wonCount = MODES.filter(function (x) { return prog[x.id] && prog[x.id].won; }).length;
  $('#modeCount').textContent = t('start.wonCount', { n: wonCount, total: MODES.length });

  var tabs = $('#worldTabs');
  tabs.innerHTML = '';
  MODE_GROUPS.forEach(function (g) {
    var b = document.createElement('button');
    b.className = 'world-tab' + (g === chosenWorld ? ' is-on' : '');
    b.dataset.world = g;
    var won = MODES.filter(function (x) { return x.group === g && prog[x.id] && prog[x.id].won; }).length;
    b.innerHTML = '<span class="wt-emoji">' + t('group.' + g + '.emoji') + '</span>' +
                  '<span class="wt-name">' + t('group.' + g) + '</span>' +
                  (won ? '<span class="wt-won">' + won + '/10</span>' : '');
    b.addEventListener('click', function () { chooseWorld(g); });
    tabs.appendChild(b);
  });
  renderWorldTiles();
  renderModePick();
}

function chooseWorld(g) {
  chosenWorld = g;
  try { localStorage.setItem(WORLD_KEY, g); } catch (e) {}
  $$('.world-tab').forEach(function (b) { b.classList.toggle('is-on', b.dataset.world === g); });
  renderWorldTiles();
}

function renderWorldTiles() {
  var grid = $('#modeGrid');
  var prog = loadProgress();
  grid.innerHTML = '';
  MODES.filter(function (m) { return m.group === chosenWorld; }).forEach(function (m) {
    var b = document.createElement('button');
    b.className = 'mode-tile' + (m.id === chosenMode ? ' is-on' : '');
    b.dataset.mode = m.id;
    b.setAttribute('aria-pressed', m.id === chosenMode ? 'true' : 'false');
    b.innerHTML = '<span class="mt-emoji">' + m.emoji + '</span>' +
                  '<span class="mt-name">' + t('mode.' + m.id + '.name') + '</span>' +
                  '<span class="mt-stars">' + stars(m.stars) + '</span>' +
                  (prog[m.id] && prog[m.id].won ? '<span class="mt-won">🏆</span>' : '');
    b.addEventListener('click', function () { chooseMode(m.id); });
    grid.appendChild(b);
  });
}

function chooseMode(id) {
  chosenMode = id;
  var m = MODES_BY_ID[id];
  if (m.group !== chosenWorld) chooseWorld(m.group);
  $$('.mode-tile').forEach(function (b) {
    var on = b.dataset.mode === id;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  renderModePick();
}

/* the dice: any adventure not yet won, or any at all once they are all done */
function randomMode() {
  var prog = loadProgress();
  var pool = MODES.filter(function (m) { return !(prog[m.id] && prog[m.id].won) && m.id !== chosenMode; });
  if (!pool.length) pool = MODES.filter(function (m) { return m.id !== chosenMode; });
  chooseMode(pool[Math.floor(Math.random() * pool.length)].id);
  $('#modePick').classList.remove('mp-flash');
  void $('#modePick').offsetWidth;
  $('#modePick').classList.add('mp-flash');
}

function renderModePick() {
  var m = MODES_BY_ID[chosenMode];
  var prog = loadProgress()[m.id];
  var chips = [
    '<span class="mp-chip">' + t('group.' + m.group + '.emoji') + ' ' + t('group.' + m.group) + '</span>',
    '<span class="mp-chip">📅 ' + nDe(m.days, t('unit.days')) + '</span>',
    '<span class="mp-chip">' + stars(m.stars) + ' ' + t('stars.' + m.stars) + '</span>',
    '<span class="mp-chip">🏪 ' + t('mp.spots', { n: m.spots.length }) + '</span>'
  ];
  if (prog && prog.won) chips.push('<span class="mp-chip mp-won">🏆 ' + t('mp.won', { v: money0(prog.best) }) + '</span>');
  else if (prog && prog.plays) chips.push('<span class="mp-chip">🔁 ' + t('mp.tried', { v: money0(prog.best) }) + '</span>');

  $('#modePick').innerHTML =
    '<div class="mp-emoji">' + m.emoji + '</div>' +
    '<div class="mp-body"><div class="mp-name">' + t('mode.' + m.id + '.name') + '</div>' +
    '<div class="mp-twist">' + t('mode.' + m.id + '.twist') + '</div>' +
    '<div class="mp-chips">' + chips.join('') + '</div></div>';
  renderDiffNotes();
}

function renderDiffNotes() {
  ['easy', 'normal', 'hard'].forEach(function (d) {
    var el = $('#difficulty [data-diff="' + d + '"] .seg-note');
    if (el) el.textContent = t('diff.' + d + '.note', { cash: money0(DIFFS[d].cash), goal: money0(goalFor(chosenMode, d)) });
  });
}

function initStart() {
  buildModeMap();

  $$('#difficulty .seg-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      chosenDiff = b.dataset.diff;
      $$('#difficulty .seg-btn').forEach(function (o) {
        o.classList.toggle('is-on', o === b);
        o.setAttribute('aria-checked', o === b ? 'true' : 'false');
      });
    });
  });

  $('#btnStart').addEventListener('click', function () {
    var n = $('#standName').value.trim() || t('start.defaultName');
    S = newState(n, chosenDiff, chosenMode);
    startDay();
  });

  $$('.lang-btn').forEach(function (b) {
    b.addEventListener('click', function () { switchLang(b.dataset.lang); });
  });

  $('#btnRandom').addEventListener('click', randomMode);
  $('#btnHowStart').addEventListener('click', openHow);
  $('#btnHow').addEventListener('click', openHow);
  $('#howClose').addEventListener('click', closeHow);
  $('#howGo').addEventListener('click', closeHow);
  $('#howModal').addEventListener('click', function (e) { if (e.target === $('#howModal')) closeHow(); });

  $('#introGo').addEventListener('click', closeIntro);
  $('#introModal').addEventListener('click', function (e) { if (e.target === $('#introModal')) closeIntro(); });

  $('#btnMenu').addEventListener('click', openMenu);
  $('#menuClose').addEventListener('click', closeMenu);
  $('#menuModal').addEventListener('click', function (e) { if (e.target === $('#menuModal')) closeMenu(); });
  $('#btnNewStand').addEventListener('click', newStand);
  $('#btnRestartSame').addEventListener('click', restartSeason);
  $('#btnRename').addEventListener('click', function () {
    var n = $('#renameInput').value.trim();
    if (!n) return;
    S.name = n;
    $('#tbStandName').textContent = n;
    $('#signText').textContent = n.length > 18 ? n.slice(0, 17) + '…' : n;
    save();
    closeMenu();
    toast(t('sm.renamed', { name: n }), 'good');
  });
  $('#renameInput').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); $('#btnRename').click(); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeHow(); closeMenu(); closeIntro(); }
  });

  offerResume();
}

function openHow()  { $('#howModal').hidden = false; }
function closeHow() { $('#howModal').hidden = true; }

/* a short welcome to the adventure, shown once on day 1 */
function openIntro() {
  var m = MODE();
  $('#introEmoji').textContent = m.emoji;
  $('#introTitle').textContent = t('intro.title', { name: t('mode.' + m.id + '.name') });
  $('#introTwist').textContent = t('mode.' + m.id + '.twist');
  $('#introTips').innerHTML = [
    t('intro.tip1', { n: m.days }),
    t('intro.tip2', { goal: money0(goalFor(m.id, S.diff)) }),
    t('intro.tip3', { day: m.spots[0].from })
  ].map(function (s) { return '<li>' + s + '</li>'; }).join('');
  $('#introModal').hidden = false;
}
function closeIntro() {
  $('#introModal').hidden = true;
  if (S && S.intro) { S.intro = false; save(); }
}

function openMenu() {
  $('#renameInput').value = S ? S.name : '';
  $('#menuProgress').textContent = S
    ? t('sm.progress', { day: S.day, total: totalDays(), cash: money0(S.cash), mode: t('mode.' + S.mode + '.name') })
    : '';
  markLangButtons();
  $('#menuModal').hidden = false;
}

function markLangButtons() {
  $$('.lang-btn').forEach(function (b) {
    b.classList.toggle('is-on', b.dataset.lang === LANG);
  });
}

/* swap language without losing the game in progress */
function switchLang(code) {
  if (code === LANG) return;
  setLang(code);
  applyStaticStrings();
  markLangButtons();
  if (S) {
    buildPlanStatic();
    renderPlan();
    if ($('#screen-report').classList.contains('is-active') && S.history.length) {
      renderReport(S.history[S.history.length - 1]);
    }
    if ($('#screen-finale').classList.contains('is-active')) renderFinale();
  } else {
    $$('#screen-start .btn-go').forEach(function (b) { b.remove(); });
    buildModeMap();
    offerResume();
  }
}
function closeMenu() { $('#menuModal').hidden = true; }

/* back to the title screen for a fresh name, adventure and difficulty */
function newStand() {
  clearSave();
  S = null;
  closeMenu();
  $$('#screen-start .btn-go').forEach(function (b) { b.remove(); });
  $('#standName').value = '';
  buildModeMap();
  show('screen-start');
}

/* same name, adventure and difficulty, season rerolled from day 1 */
function restartSeason() {
  var name = S.name, diff = S.diff, mode = S.mode;
  clearSave();
  S = newState(name, diff, mode);
  S.intro = false;
  closeMenu();
  toast(t('sm.restarted'));
  startDay();
}

function offerResume() {
  var raw;
  try { raw = localStorage.getItem(SAVE_KEY); } catch (e) { return; }
  if (!raw) return;
  var save;
  try { save = JSON.parse(raw); } catch (e) { return; }
  if (!save || !save.name || !MODES_BY_ID[save.mode]) return;
  /* closed the tab on the report screen? pick up on the following morning */
  if (save.history && save.history.length >= save.day) save.day = save.history.length + 1;
  if (save.day > MODES_BY_ID[save.mode].days) return;

  var btn = document.createElement('button');
  btn.className = 'btn btn-go btn-xl btn-block';
  btn.textContent = t('start.continue', { name: save.name, day: save.day, mode: t('mode.' + save.mode + '.name') });
  btn.addEventListener('click', function () { S = save; startDay(); });
  $('#btnStart').parentNode.insertBefore(btn, $('#btnStart'));
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* private mode */ }
}
function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
}

/* ───────────────────────────── plan screen ───────────────────────────── */

function startDay() {
  S.order = zeroStock();
  S.marketing = 0;
  S.staff = false;      /* the helper is hired one day at a time */
  S.cardPick = null;
  if (!S.spots) S.spots = {};
  if (!S.loans) S.loans = [];
  save();
  buildPlanStatic();
  renderPlan();
  show('screen-plan');
  if (S.intro && S.day === 1) openIntro();
}

function buildPlanStatic() {
  var m = MODE();
  $('#tbStandName').textContent = S.name;
  $('#tbLogo').textContent = m.emoji;
  $('#tbRole').textContent = t('mode.' + m.id + '.name') + ' · ' + t('tb.role');
  $('#tbDayTotal').textContent = totalDays();
  $('#signText').textContent = S.name.length > 18 ? S.name.slice(0, 17) + '…' : S.name;
  buildMenu();
  buildSupplies();
  buildUpgrades();
  buildCard();
  buildSpots();

  var mk = $('#mkSlider');
  if (!mk.dataset.bound) {
    mk.dataset.bound = '1';
    mk.addEventListener('input', function () { S.marketing = +mk.value; renderPlan(); });
    $('#stToggle').addEventListener('click', function () { S.staff = !S.staff; renderPlan(); });
    $('#btnOpen').addEventListener('click', openStand);
    $$('[data-auto]').forEach(function (b) {
      b.addEventListener('click', function () { autoStock(b.dataset.auto); });
    });
  }
}

function buildMenu() {
  var g = $('#menuGrid');
  g.innerHTML = '';
  PRODS.forEach(function (p) {
    var P = PRODUCTS[p];
    var el = document.createElement('div');
    el.className = 'prod ' + P.cls;
    el.innerHTML =
      '<div class="prod-head"><span class="prod-emoji">' + P.emoji + '</span>' +
        '<div><div class="prod-name">' + prodName(p) + '</div>' +
        '<div class="prod-sub">' + t('prod.' + p + '.sub') + '</div></div></div>' +
      '<div class="rec-label">' + t('menu.recipe') + '</div>' +
      '<div class="rec-opts" data-rec="' + p + '"></div>' +
      '<div class="price-row">' +
        '<button class="step" data-price="' + p + '" data-dir="-1" aria-label="' + t('menu.lowerPrice') + '">−</button>' +
        '<div class="price-mid"><div class="price-k">' + t('menu.yourPrice') + '</div>' +
        '<div class="price-v" id="pv-' + p + '">$0</div></div>' +
        '<button class="step" data-price="' + p + '" data-dir="1" aria-label="' + t('menu.raisePrice') + '">+</button>' +
      '</div>' +
      '<div class="econ">' +
        '<div><span>' + t('menu.costs') + '</span><b id="uc-' + p + '">$0</b></div>' +
        '<div><span>' + t('menu.keep') + '</span><b id="up-' + p + '">$0</b></div>' +
        '<div><span>' + t('menu.margin') + '</span><b id="um-' + p + '">0%</b></div>' +
      '</div>' +
      '<div class="demand-meter"><div class="dm-track"><div class="dm-fill" id="dm-' + p + '"></div></div>' +
      '<div class="dm-txt" id="dt-' + p + '"></div></div>';
    g.appendChild(el);

    var ro = $('.rec-opts', el);
    RECIPES[p].forEach(function (r, i) {
      var b = document.createElement('button');
      b.className = 'rec-btn';
      b.dataset.lvl = i;
      b.innerHTML = '<b>' + t('rec.' + p + '.' + i + '.name') + '</b>' +
                    '<small>' + money(unitCost(p, i)) + '</small>';
      b.addEventListener('click', function () { S.recipe[p] = i; renderPlan(); });
      ro.appendChild(b);
    });
  });

  $$('[data-price]').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = b.dataset.price;
      S.prices[p] = clamp(round2(S.prices[p] + (+b.dataset.dir) * 0.25), 0.25, 12);
      renderPlan();
    });
  });
}

function buildSupplies() {
  var g = $('#supplyGrid');
  g.innerHTML = '';
  SUP_KEYS.forEach(function (k) {
    var s = SUPPLIES[k];
    var el = document.createElement('div');
    el.className = 'sup';
    el.id = 'sup-' + k;
    el.innerHTML =
      '<div class="sup-top"><span class="sup-emoji">' + s.emoji + '</span>' +
        '<div><div class="sup-name">' + supName(k) + '</div>' +
        '<div class="sup-price" id="spp-' + k + '"></div></div>' +
        '<span class="sup-spoil" id="sp-' + k + '" hidden></span>' +
      '</div>' +
      '<div class="sup-ctrl">' +
        '<button class="step" data-sup="' + k + '" data-dir="-1" aria-label="' +
          t('sup.buyLess', { name: supName(k) }) + '">−</button>' +
        '<div class="sup-qty"><b id="oq-' + k + '">0</b><small id="ol-' + k + '"></small></div>' +
        '<button class="step" data-sup="' + k + '" data-dir="1" aria-label="' +
          t('sup.buyMore', { name: supName(k) }) + '">+</button>' +
      '</div>' +
      '<div class="sup-have"><span>' + t('sup.inCart') + '</span><b id="oh-' + k + '">0</b></div>';
    g.appendChild(el);
  });

  $$('[data-sup]').forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.dataset.sup;
      S.order[k] = clamp(S.order[k] + (+b.dataset.dir), 0, 40);
      renderPlan();
    });
  });
}

function buildUpgrades() {
  var g = $('#upgradeGrid');
  g.innerHTML = '';
  UPGRADES.forEach(function (u) {
    var owned = has(u.id);
    var el = document.createElement('div');
    el.className = 'upg' + (owned ? ' owned' : '');
    el.innerHTML =
      '<div class="upg-top"><span class="upg-emoji">' + u.emoji + '</span>' +
      '<div class="upg-name">' + upgName(u.id) + '</div></div>' +
      '<div class="upg-desc">' + upgDesc(u.id) + '</div>';
    if (owned) {
      el.insertAdjacentHTML('beforeend', '<div class="upg-own">' + t('grow.owned') + '</div>');
    } else {
      var b = document.createElement('button');
      b.className = 'btn btn-soft btn-sm';
      b.textContent = t('grow.buy', { price: money0(u.cost) });
      b.disabled = S.cash < u.cost;
      b.addEventListener('click', function () { buyUpgrade(u); });
      el.appendChild(b);
    }
    g.appendChild(el);
  });
}

function buyUpgrade(u) {
  if (S.cash < u.cost) return;
  S.cash -= u.cost;
  S.spent += u.cost;
  S.upgrades.push(u.id);
  toast(t('grow.installed', { emoji: u.emoji, name: upgName(u.id) }), 'good');
  buildUpgrades();
  renderPlan();
  save();
}

/* ───── today's decision card ───── */

/* plain-words summary of an option's effects, e.g. "💵 −$20 · ⭐ +8" */
function effectChips(fx) {
  var out = [];
  if (fx.cash) out.push('💵 ' + (fx.cash > 0 ? '+' : '') + money0(fx.cash));
  if (fx.loan) out.push('💵 +' + money0(fx.loan.get) + ' → ' + t('fx.loan', { pay: money0(fx.loan.pay), days: fx.loan.days }));
  if (fx.preorder) out.push('📦 ' + nDe(fx.preorder.n, prodName(fx.preorder.prod).toLowerCase()) + ' × ' + money(fx.preorder.price));
  if (fx.rep) out.push('⭐ ' + (fx.rep > 0 ? '+' : '−') + Math.abs(fx.rep));
  if (fx.traffic) out.push('👥 ' + (fx.traffic >= 1 ? '+' : '−') + Math.round(Math.abs(fx.traffic - 1) * 100) + '%');
  if (fx.cap) out.push('⚡ ' + (fx.cap > 0 ? '+' : '−') + Math.abs(fx.cap));
  if (fx.noSpoil) out.push('🧊 ' + t('fx.noSpoil'));
  if (fx.supplyOff) for (var k in fx.supplyOff) out.push(SUPPLIES[k].emoji + ' −' + pct(1 - fx.supplyOff[k]));
  if (fx.revShare) out.push('🤝 −' + pct(fx.revShare) + ' ' + t('fx.ofSales'));
  if (fx.priceOff) out.push('🏷️ −' + pct(1 - fx.priceOff) + ' ' + t('fx.onPrices'));
  if (fx.prize) out.push('🎯 ' + t('fx.prize', { n: fx.prize.items, v: money0(fx.prize.cash) }));
  if (fx.awareness) out.push('📣 ' + t('fx.aware'));
  return out.length ? out.join(' · ') : t('fx.nothing');
}

function buildCard() {
  var box = $('#cardBox');
  var id = today().card;
  if (!id) { box.hidden = true; return; }
  var c = CARDS[id];
  box.hidden = false;
  box.innerHTML =
    '<div class="dc-head"><span class="dc-emoji">' + c.emoji + '</span>' +
      '<div><div class="dc-eyebrow">' + t('card.eyebrow') + '</div>' +
      '<div class="dc-title">' + t('card.' + id + '.title') + '</div></div></div>' +
    '<p class="dc-text">' + t('card.' + id + '.text') + '</p>' +
    '<div class="dc-opts">' +
      '<button class="dc-opt" data-pick="yes"><b>' + t('card.' + id + '.yes') + '</b><small>' + effectChips(c.yes || {}) + '</small></button>' +
      '<button class="dc-opt" data-pick="no"><b>' + t('card.' + id + '.no') + '</b><small>' + effectChips(c.no || {}) + '</small></button>' +
    '</div>';
  $$('.dc-opt', box).forEach(function (b) {
    b.addEventListener('click', function () { pickCard(b.dataset.pick); });
  });
}

/* cash effects land the moment you pick, so you can shop with the money */
function pickCard(opt) {
  if (S.cardPick === opt) return;
  var before = cardEffects(S.cardPick), after = cardEffects(opt);
  S.cash = round2(S.cash - (before.cash || 0) - (before.loan ? before.loan.get : 0)
                         + (after.cash || 0)  + (after.loan  ? after.loan.get  : 0));
  S.cardPick = opt;
  renderPlan();
  save();
}

/* ───── extra stands ───── */

function buildSpots() {
  var g = $('#spotGrid');
  g.innerHTML = '';
  var m = MODE();

  var main = document.createElement('div');
  main.className = 'spot spot-main';
  main.innerHTML = '<div class="spot-top"><span class="spot-emoji">' + m.emoji + '</span>' +
    '<div><div class="spot-name">' + t('spots.main') + '</div><div class="spot-sub">' + t('spots.mainSub') + '</div></div></div>' +
    '<div class="spot-own">✓ ' + t('spots.here') + '</div>';
  g.appendChild(main);

  m.spots.forEach(function (sp) {
    var st = S.spots[sp.id];
    var el = document.createElement('div');
    el.className = 'spot' + (st ? ' owned' : '') + (st && st.open ? ' open' : '');
    el.id = 'spot-' + sp.id;
    el.innerHTML =
      '<div class="spot-top"><span class="spot-emoji">' + sp.emoji + '</span>' +
        '<div><div class="spot-name">' + t('spot.' + m.id + '.' + sp.id + '.name') + '</div>' +
        '<div class="spot-sub">' + t('spot.' + m.id + '.' + sp.id + '.desc') + '</div></div></div>' +
      '<div class="spot-facts">' +
        '<span>👥 +' + Math.round(sp.traffic * 100) + '% ' + t('unit.customers') + '</span>' +
        '<span>⚡ +' + sp.cap + '</span>' +
        '<span>🏠 ' + t('spots.rent', { v: money0(sp.rent) }) + '</span>' +
      '</div>';
    if (st) {
      var tg = document.createElement('button');
      tg.className = 'toggle spot-toggle';
      tg.setAttribute('role', 'switch');
      tg.innerHTML = '<span class="toggle-knob"></span><span class="toggle-txt"></span>';
      tg.addEventListener('click', function () { S.spots[sp.id].open = !S.spots[sp.id].open; renderPlan(); save(); });
      el.appendChild(tg);
    } else {
      var b = document.createElement('button');
      b.className = 'btn btn-soft btn-sm';
      b.addEventListener('click', function () { buySpot(sp); });
      el.appendChild(b);
    }
    g.appendChild(el);
  });
}

function buySpot(sp) {
  if (S.day < sp.from || S.cash < sp.open) return;
  S.cash = round2(S.cash - sp.open);
  S.spent += sp.open;
  S.spots[sp.id] = { open: true };
  toast(t('spots.opened', { emoji: sp.emoji, name: t('spot.' + S.mode + '.' + sp.id + '.name') }), 'good');
  buildSpots();
  renderPlan();
  save();
}

function autoStock(level) {
  S.order = autoOrderFor(level);
  renderPlan();
  toast(t('sup.autoDone', { kind: t('sup.kind.' + level) }));
}

/* ───────────────────────────── plan rendering ───────────────────────────── */

function renderPlan() {
  var day = today(), m = MODE();
  var w = WEATHER[day.key], fw = feltWeather();
  var ev = todayEvent();
  var mods = dayMods();

  /* topbar */
  $('#tbDay').textContent = S.day;
  $('#tbCash').textContent = money0(S.cash);
  $('#tbRepVal').textContent = Math.round(S.rep);
  $('#tbRepFill').style.width = S.rep + '%';
  $('#tbRepFace').textContent = S.rep >= 80 ? '🤩' : S.rep >= 62 ? '😀' : S.rep >= 42 ? '🙂' : S.rep >= 25 ? '😕' : '😞';

  var dots = $('#dayDots');
  if (dots.childElementCount !== totalDays()) {
    dots.innerHTML = '';
    for (var i = 0; i < totalDays(); i++) dots.appendChild(document.createElement('i'));
  }
  $$('#dayDots i').forEach(function (el, i) {
    el.className = '';
    if (i < S.history.length) el.className = 'done' + (S.history[i].net < 0 ? ' lost' : '');
    else if (i === S.day - 1) el.className = 'now';
  });

  /* forecast */
  $('#fcEmoji').textContent = w.emoji;
  $('#fcWeather').textContent = wName(day.key);
  $('#fcTemp').textContent = temp(day.temp) + ' · ' + t('dow.' + day.dowIdx) +
    (m.indoor ? ' · ' + t('fc.indoor') : '');

  var crowd = m.traffic * fw.traffic * DOW_PROFILES[m.dow][day.dowIdx] * (ev ? ev.traffic : 1) * (1 + spotTraffic()) * (mods.traffic || 1);
  $('#fcCrowd').lastElementChild.textContent = t(
    crowd >= 1.7 ? 'crowd.packed' : crowd >= 1.25 ? 'crowd.busy' :
    crowd >= 0.95 ? 'crowd.steady' : crowd >= 0.7 ? 'crowd.slow' : 'crowd.dead');

  var lemPull = fw.lem * m.lem * (ev && ev.lem ? ev.lem : 1);
  var dogPull = fw.dog * m.dog * (ev && ev.dog ? ev.dog : 1);
  $('#fcThirst').lastElementChild.textContent = t(
    lemPull > dogPull * 1.25 ? 'thirst.lem' : dogPull > lemPull * 1.25 ? 'thirst.dog' : 'thirst.both');

  var tm = S.day < totalDays() ? S.season[S.day] : null;
  $('#fcTomorrow').lastElementChild.textContent =
    tm ? WEATHER[tm.key].emoji + ' ' + wName(tm.key) : t('fc.lastDay');

  var fe = $('#fcEvent');
  if (ev) {
    fe.hidden = false;
    fe.innerHTML = ev.emoji + '  <b>' + t('ev.' + day.event + '.name') + '</b> — ' + t('ev.' + day.event + '.text');
  } else fe.hidden = true;
  $('#fcTwist').innerHTML = m.emoji + ' <b>' + t('fc.twistK') + '</b> ' + t('mode.' + m.id + '.twist');

  /* decision card */
  $$('#cardBox .dc-opt').forEach(function (b) {
    b.classList.toggle('is-on', b.dataset.pick === S.cardPick);
  });

  /* menu */
  PRODS.forEach(function (p) {
    $$('[data-rec="' + p + '"] .rec-btn').forEach(function (b, i) {
      b.classList.toggle('is-on', i === S.recipe[p]);
    });
    $$('[data-rec="' + p + '"] .rec-btn small').forEach(function (el, i) {
      el.textContent = money(unitCost(p, i));
    });
    var cost = unitCost(p), price = effPrice(p), keep = round2(price - cost);
    $('#pv-' + p).textContent = money(S.prices[p]) +
      (mods.priceOff ? ' → ' + money(price) : '');
    $('#uc-' + p).textContent = money(cost);
    $('#up-' + p).textContent = money(keep);
    $('#up-' + p).className = keep > 0 ? 'pos' : 'neg';
    $('#um-' + p).textContent = price > 0 ? pct(keep / price) : '—';
    $('#um-' + p).className = keep > 0 ? 'pos' : 'neg';

    var fair = fairPrice(p);
    var ratio = price / fair;
    var fill = clamp((1.6 - ratio) / 1.1, 0, 1);
    $('#dm-' + p).style.width = (fill * 100).toFixed(0) + '%';
    $('#dt-' + p).innerHTML = t(
      ratio > 1.30 ? 'demand.veryHigh' :
      ratio > 1.12 ? 'demand.high' :
      ratio > 0.92 ? 'demand.fair' :
      ratio > 0.75 ? 'demand.low' : 'demand.veryLow');

    $$('[data-price="' + p + '"]').forEach(function (b) {
      b.disabled = (+b.dataset.dir === -1 && S.prices[p] <= 0.25) || (+b.dataset.dir === 1 && S.prices[p] >= 12);
    });
  });

  /* supplies */
  var oc = orderCost();
  var afterStock = stockAfterOrder();
  SUP_KEYS.forEach(function (k) {
    var s = SUPPLIES[k], packs = S.order[k];
    var off = supplyOff(k);
    $('#spp-' + k).innerHTML = off < 1
      ? '<s>' + money(packPrice(k)) + '</s> <b class="pos">' + t('sup.perPack', { price: money(round2(packPrice(k) * off)), n: s.pack }) + '</b>'
      : t('sup.perPack', { price: money(packPrice(k)), n: s.pack });
    $('#oq-' + k).textContent = packs;
    $('#ol-' + k).textContent = t(packs === 1 ? 'sup.pack' : 'sup.packs');
    $('#oh-' + k).textContent = afterStock[k] + ' ' + supUnit(k);
    $('#sup-' + k).classList.toggle('has', packs > 0);
    var badge = $('#sp-' + k), rate = spoilRate(k);
    badge.hidden = !(rate >= 0.10 || (s.spoil >= 0.10 && rate < s.spoil));
    badge.textContent = rate === 0 ? t('sup.noSpoil') : t('sup.spoils', { pct: pct(rate) });
    badge.classList.toggle('sup-spoil-hot', rate >= 0.5);
    badge.classList.toggle('sup-spoil-ok', rate < 0.10);
    if (packs >= 5) $('#ol-' + k).textContent = t('sup.packs') + ' · −' + pct(bulkRate(packs));
  });

  $('#sfBasket').textContent = money(oc.gross);
  $('#sfBulk').textContent = oc.saved > 0 ? '−' + money(oc.saved) : money(0);
  var after = round2(S.cash - oc.net);
  $('#sfAfter').textContent = money(after);
  $('#sfAfter').className = after < 0 ? 'neg' : '';

  /* growth */
  $('#mkVal').textContent = money0(S.marketing);
  $('#mkSlider').value = S.marketing;
  var lift = 0.50 * (1 - Math.exp(-S.marketing / 20));
  $('#mkNote').innerHTML = S.marketing === 0
    ? t('grow.mk.none')
    : t('grow.mk.some', { pct: pct(lift) });

  var st = $('#stToggle');
  st.setAttribute('aria-checked', S.staff ? 'true' : 'false');
  $('.toggle-txt', st).textContent = t(S.staff ? 'grow.staff.on' : 'grow.staff.off');
  var alone = Math.round((BASE_CAP + (has('register') ? 15 : 0) + (has('grill') ? 25 : 0)) * m.cap);
  $('#stNote').innerHTML = t('grow.staff.note', { alone: nDe(alone, t('unit.customers')), extra: STAFF_CAP });

  $$('#upgradeGrid .btn').forEach(function (b, i) {
    var list = UPGRADES.filter(function (u) { return !has(u.id); });
    if (list[i]) b.disabled = S.cash - oc.net < list[i].cost;
  });

  /* extra stands */
  m.spots.forEach(function (sp) {
    var el = $('#spot-' + sp.id), st = S.spots[sp.id];
    if (!el) return;
    el.classList.toggle('open', !!(st && st.open));
    if (st) {
      var tg = $('.spot-toggle', el);
      tg.setAttribute('aria-checked', st.open ? 'true' : 'false');
      $('.toggle-txt', tg).textContent = t(st.open ? 'spots.openToday' : 'spots.closedToday');
    } else {
      var b = $('.btn', el);
      if (S.day < sp.from) { b.disabled = true; b.textContent = t('spots.fromDay', { d: sp.from }); }
      else { b.disabled = S.cash - oc.net < sp.open; b.textContent = t('spots.buy', { price: money0(sp.open) }); }
    }
  });

  renderProjection(oc, afterStock);
}

function renderProjection(oc, afterStock) {
  var est = runDay(false);
  var mods = dayMods();
  var cardCost = mods.cash && mods.cash < 0 && !mods.loan ? -mods.cash : 0;
  var costs = round2(oc.net + fixedCosts() + cardCost);

  /* break-even: how many average items must be sold to cover today's outlay */
  var mix = est.want.lemonade + est.want.hotdog;
  var avgProfit = mix > 0
    ? ((est.want.lemonade * (effPrice('lemonade') - unitCost('lemonade'))) +
       (est.want.hotdog   * (effPrice('hotdog')   - unitCost('hotdog')))) / mix
    : 0;
  var be = avgProfit > 0.01 ? Math.ceil((fixedCosts() + cardCost) / avgProfit) : 0;

  $('#beNum').textContent = avgProfit > 0.01 ? be : '∞';
  $('#beSub').textContent = t('plan.beSub', { v: money(fixedCosts() + cardCost) });
  $('#planBE').title = t('plan.beTip', { v: money(avgProfit) });

  $('#prSupplies').textContent = money(oc.net);
  $('#prRent').textContent = money(rentFor());
  $('#prSpots').textContent = money(spotRent());
  $('#prSpots').parentNode.hidden = spotRent() === 0;
  $('#prStaff').textContent = money(S.staff ? STAFF_COST : 0);
  $('#prMarketing').textContent = money(S.marketing);
  $('#prCard').textContent = money(cardCost);
  $('#prCard').parentNode.hidden = cardCost === 0;
  $('#prTotal').textContent = money(costs);

  $('#canLem').textContent = buildable('lemonade', afterStock);
  $('#canDog').textContent = buildable('hotdog', afterStock);
  $('#canCap').textContent = capacity();

  var box = $('.plan-est');
  box.classList.toggle('neg', est.net < 0);
  $('#peVal').textContent = money(est.net, true);
  $('#peBand').textContent = t('plan.estBand', {
    lo: money(est.net - Math.abs(est.revenue) * 0.14),
    hi: money(est.net + Math.abs(est.revenue) * 0.14) });

  /* warnings */
  var warn = [];
  if (round2(S.cash - oc.net) < 0) warn.push(['e', '💸', t('warn.broke')]);
  PRODS.forEach(function (p) {
    if (effPrice(p) <= unitCost(p)) {
      warn.push(['e', '⚠️', t('warn.belowCost', { name: prodName(p).toLowerCase() })]);
    }
  });
  if (today().card && !S.cardPick) warn.push(['w', '🃏', t('warn.card')]);
  if (est.pre && est.pre.got < est.pre.want) {
    warn.push(['w', '📦', t('warn.preorder', { n: est.pre.want - est.pre.got, name: prodName(est.pre.prod).toLowerCase() })]);
  }
  if (est.lostStock > 2) warn.push(['w', '📦', t('warn.stockout', { n: nDe(Math.round(est.lostStock), t('unit.customers')) })]);
  if (est.lostCap > 2) warn.push(['w', '⏱️', t('warn.capacity', { n: Math.round(est.lostCap) })]);
  var leftoverVal = 0;
  SUP_KEYS.forEach(function (k) {
    var used = 0;
    PRODS.forEach(function (p) {
      var r = recipeOf(p);
      if (r.parts[k]) used += r.parts[k] * Math.round(est.want[p]);
    });
    if (est.pre) { var pr = recipeOf(est.pre.prod); if (pr.parts[k]) used += pr.parts[k] * est.pre.got; }
    leftoverVal += Math.max(0, afterStock[k] - used) * unitPrice(k) * spoilRate(k);
  });
  if (leftoverVal > 4) warn.push(['w', '🗑️', t('warn.waste', { v: money(leftoverVal) })]);
  if (!warn.length && est.net > 0) warn.push(['g', '✅', t('warn.ok')]);

  $('#planWarn').innerHTML = warn.map(function (x) {
    return '<li class="' + x[0] + '"><span>' + x[1] + '</span><span>' + x[2] + '</span></li>';
  }).join('');

  $('#btnOpen').disabled = round2(S.cash - oc.net) < 0;
}

/* ───────────────────────────── the day itself ───────────────────────────── */

function openStand() {
  var oc = orderCost();
  if (round2(S.cash - oc.net) < 0) return;
  if (today().card && !S.cardPick) S.cardPick = 'no';   /* undecided means "no thanks" */
  var mods = dayMods();

  /* cash before the decision card and before a single cent is spent today */
  var cashStart = round2(S.cash - (mods.loan ? mods.loan.get : (mods.cash || 0)));
  if (mods.loan) S.loans.push({ due: S.day + mods.loan.days, pay: mods.loan.pay, get: mods.loan.get });

  S.cash = round2(S.cash - oc.net);
  S.spent = round2(S.spent + oc.net);
  SUP_KEYS.forEach(function (k) { S.stock[k] += S.order[k] * SUPPLIES[k].pack; });
  S.order = zeroStock();

  var result = runDay(true);
  /* runDay reads the cart, which is now empty — record the real spend here */
  result.supplySpend = oc.net;
  result.cashStart = cashStart;
  startSim(result);
}

/* ───────────────────────────── animated day ───────────────────────────── */

/* a big emoji as scenery */
function prop(emoji, x, y, size, opacity) {
  return '<text x="' + x + '" y="' + y + '" font-size="' + (size || 44) + '" text-anchor="middle"' +
         (opacity ? ' opacity="' + opacity + '"' : '') + '>' + emoji + '</text>';
}
function houses() {
  return '<g opacity=".55">' +
    '<rect x="40"  y="212" width="86" height="90" rx="6" fill="#D8CFC0"/><polygon points="30,214 83,178 136,214" fill="#B7A894"/>' +
    '<rect x="176" y="228" width="70" height="74" rx="6" fill="#E3DACB"/><polygon points="168,230 211,200 254,230" fill="#C4B5A1"/>' +
    '<rect x="640" y="220" width="94" height="82" rx="6" fill="#DED5C6"/><polygon points="630,222 687,188 744,222" fill="#BEAF9B"/></g>';
}
function tree(x, y, s, col) {
  s = s || 1; col = col || '#5FAE4E';
  return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
    '<rect x="-7" y="-30" width="14" height="40" rx="4" fill="#8B5A2B"/>' +
    '<circle cx="0" cy="-48" r="30" fill="' + col + '"/><circle cx="-20" cy="-36" r="22" fill="' + col + '"/><circle cx="20" cy="-36" r="22" fill="' + col + '"/></g>';
}
function pine(x, y, s, snow) {
  s = s || 1;
  return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')">' +
    '<rect x="-5" y="-14" width="10" height="20" fill="#6B4423"/>' +
    '<polygon points="0,-90 -34,-30 34,-30" fill="#2F7A46"/><polygon points="0,-70 -40,-10 40,-10" fill="#2F7A46"/>' +
    (snow ? '<polygon points="0,-90 -18,-58 18,-58" fill="#fff" opacity=".8"/>' : '') + '</g>';
}
function building(x, w, h, col) {
  var out = '<rect x="' + x + '" y="' + (302 - h) + '" width="' + w + '" height="' + h + '" rx="4" fill="' + col + '"/>';
  for (var r = 0; r < Math.floor(h / 26); r++)
    for (var c = 0; c < Math.floor(w / 22); c++)
      out += '<rect x="' + (x + 8 + c * 22) + '" y="' + (312 - h + r * 26) + '" width="10" height="12" rx="2" fill="#FFF3B0" opacity=".85"/>';
  return out;
}
function bunting() {
  var out = '<path d="M0 60 Q450 120 900 60" stroke="#fff" stroke-width="2" fill="none"/>';
  var cols = ['#EF5A3C', '#FFC93C', '#4A9BE8', '#2F9E44', '#E87BA4'];
  for (var i = 0; i < 18; i++) {
    var x = 25 + i * 50, y = 60 + Math.sin((i / 17) * Math.PI) * 60 * 0.98;
    out += '<polygon points="' + (x - 9) + ',' + y + ' ' + (x + 9) + ',' + y + ' ' + x + ',' + (y + 18) + '" fill="' + cols[i % 5] + '"/>';
  }
  return out;
}

/* ground colours + scenery for each adventure; sky is set from the weather */
var BACKDROPS = {
  street:  { ground:['#96D67F','#6FBF5C'], draw: function () { return houses(); } },
  beach:   { ground:['#F6E2A8','#E9CC7A'], draw: function () {
    return '<rect x="0" y="236" width="900" height="70" fill="#4FB3E8"/><path d="M0 240 Q60 228 120 240 T240 240 T360 240 T480 240 T600 240 T720 240 T840 240 T960 240 V306 H0Z" fill="#7CCBF0"/>' +
           prop('🌴', 60, 296, 96) +
           prop('⛱️', 700, 300, 64) + prop('⛵', 820, 250, 40, 0.9); } },
  park:    { ground:['#96D67F','#6FBF5C'], draw: function () { return tree(90, 300, 1.1) + tree(210, 300, 0.85) + tree(690, 300, 1) + tree(810, 300, 1.15) + prop('🪑', 150, 300, 30, 0.8); } },
  pool:    { ground:['#DCEBF5','#C4DCEC'], draw: function () {
    return '<rect x="0" y="246" width="900" height="60" fill="#5BC0EB"/><rect x="0" y="246" width="900" height="8" fill="#9EDCF7"/>' +
           prop('🌊', 130, 250, 70) + prop('🏊', 720, 288, 46) + prop('🏐', 830, 262, 38); } },
  forest:  { ground:['#8BC66F','#5F9E4B'], draw: function () { return pine(70, 300, 1.1) + pine(170, 300, 0.8) + pine(730, 300, 0.9) + pine(830, 300, 1.2) + prop('⛺', 640, 300, 64) + prop('🔥', 600, 305, 30); } },
  village: { ground:['#A8D97F','#7DBF5C'], draw: function () {
    return '<rect x="40" y="226" width="90" height="76" rx="4" fill="#F7EBD3"/><polygon points="30,228 85,182 140,228" fill="#C8482E"/>' +
           '<rect x="700" y="236" width="80" height="66" rx="4" fill="#F1E3C8"/><polygon points="690,238 740,196 790,238" fill="#B84A32"/>' +
           '<g stroke="#9A6A3A" stroke-width="4"><line x1="150" y1="270" x2="290" y2="270"/><line x1="150" y1="286" x2="290" y2="286"/></g>' +
           prop('🐄', 200, 300, 44) + prop('🐓', 830, 300, 30); } },
  city:    { ground:['#C9CBD1','#A9ADB6'], draw: function () { return building(20, 90, 220, '#8E9BB0') + building(130, 70, 160, '#A7B2C4') + building(650, 80, 190, '#9AA6BA') + building(760, 110, 240, '#8090A8') + prop('🚕', 850, 300, 34); } },
  station: { ground:['#D2D4D8','#B4B7BD'], draw: function () {
    return '<rect x="0" y="200" width="900" height="16" fill="#8D97A5"/><rect x="0" y="216" width="900" height="6" fill="#6C7683"/>' +
           '<rect x="20" y="222" width="220" height="60" rx="10" fill="#3D6DB5"/><rect x="36" y="234" width="188" height="24" rx="6" fill="#DDEBFF"/>' +
           '<rect x="660" y="222" width="220" height="60" rx="10" fill="#3D6DB5"/><rect x="676" y="234" width="188" height="24" rx="6" fill="#DDEBFF"/>' +
           '<rect x="0" y="286" width="900" height="16" fill="#E9E5DC"/>' + prop('🚉', 450, 190, 40, 0.8); } },
  mall:    { ground:['#F3E9DD','#E2D5C4'], wall:['#FBF3E6','#F1E3D0'], draw: function () {
    return '<rect x="0" y="0" width="900" height="300" fill="#FBF3E6"/><rect x="0" y="150" width="900" height="6" fill="#E7D8C4"/>' +
           '<rect x="30" y="180" width="200" height="120" rx="8" fill="#FFE1EA"/><rect x="670" y="180" width="200" height="120" rx="8" fill="#DDF1FF"/>' +
           prop('🛍️', 130, 250, 54) + prop('👟', 770, 250, 50) + prop('🌿', 280, 300, 40) + prop('🌿', 620, 300, 40); } },
  cinema:  { ground:['#5A3A6E','#3E2850'], wall:['#2B2140','#4A3560'], draw: function () {
    return '<rect x="0" y="0" width="900" height="300" fill="#2B2140"/>' +
           '<rect x="60" y="90" width="220" height="90" rx="12" fill="#FFF4C2" stroke="#FFC93C" stroke-width="6"/>' + prop('🎬', 170, 155, 56) +
           '<rect x="620" y="90" width="220" height="90" rx="12" fill="#FFF4C2" stroke="#FFC93C" stroke-width="6"/>' + prop('🍿', 730, 155, 56) +
           prop('🎟️', 850, 300, 40) + prop('⭐', 450, 60, 30) + prop('⭐', 380, 40, 20) + prop('⭐', 520, 46, 22); } },
  campus:  { ground:['#A8D98A','#7CBF63'], draw: function () {
    return '<rect x="560" y="200" width="320" height="102" fill="#F1E7D2"/><rect x="540" y="190" width="360" height="14" fill="#D8CBB0"/>' +
           '<g fill="#E4D8BE"><rect x="590" y="214" width="20" height="88"/><rect x="650" y="214" width="20" height="88"/><rect x="710" y="214" width="20" height="88"/><rect x="770" y="214" width="20" height="88"/><rect x="830" y="214" width="20" height="88"/></g>' +
           tree(90, 300, 1) + prop('🎓', 200, 290, 40) + prop('🚲', 300, 300, 34); } },
  school:  { ground:['#D9D3C4','#BFB8A6'], draw: function () {
    return '<rect x="30" y="196" width="300" height="106" rx="8" fill="#F4C67A"/><rect x="150" y="248" width="60" height="54" rx="6" fill="#8B5A2B"/>' +
           '<g fill="#DDF0FF"><rect x="60" y="216" width="40" height="30" rx="3"/><rect x="250" y="216" width="40" height="30" rx="3"/><rect x="60" y="256" width="40" height="30" rx="3"/><rect x="250" y="256" width="40" height="30" rx="3"/></g>' +
           '<circle cx="180" cy="220" r="14" fill="#fff" stroke="#8B5A2B" stroke-width="3"/>' +
           prop('🏀', 700, 300, 36) + prop('🎒', 780, 300, 36) + tree(850, 300, 0.9); } },
  fair:    { ground:['#F2D9A4','#DFC080'], draw: function () { return bunting() + prop('🎡', 120, 300, 150) + prop('🎠', 760, 300, 110) + prop('🎈', 300, 240, 36) + prop('🍭', 850, 300, 30); } },
  stadium: { ground:['#8BD46E','#5FB84A'], draw: function () {
    var out = '';
    for (var r = 0; r < 5; r++) out += '<rect x="0" y="' + (300 - 90 + r * 18) + '" width="900" height="16" fill="' + (r % 2 ? '#C8D3E0' : '#B0BFD0') + '"/>';
    out += '<rect x="0" y="210" width="900" height="6" fill="#7F8EA3"/>';
    return out + prop('⚽', 90, 300, 36) + prop('🏟️', 800, 200, 60, 0.9) + prop('📣', 830, 300, 32); } },
  festival:{ ground:['#7AA86A','#4E8447'], wall:['#2A1C4E','#5B3E8E'], draw: function () {
    return '<rect x="0" y="0" width="900" height="300" fill="#2A1C4E"/>' +
           '<g fill="#fff"><circle cx="80" cy="50" r="2"/><circle cx="200" cy="90" r="1.6"/><circle cx="330" cy="40" r="2.2"/><circle cx="520" cy="70" r="1.8"/><circle cx="700" cy="36" r="2.4"/><circle cx="820" cy="96" r="1.6"/></g>' +
           '<rect x="560" y="170" width="320" height="132" rx="10" fill="#4A3570"/><rect x="580" y="150" width="280" height="30" rx="8" fill="#6B4FB0"/>' +
           '<g fill="#FFC93C" opacity=".9"><circle cx="600" cy="165" r="6"/><circle cx="660" cy="165" r="6"/><circle cx="720" cy="165" r="6"/><circle cx="780" cy="165" r="6"/><circle cx="840" cy="165" r="6"/></g>' +
           prop('🎸', 660, 270, 56) + prop('🎤', 780, 270, 48) + prop('⛺', 110, 300, 60) + prop('⛺', 210, 300, 46); } },
  zoo:     { ground:['#A9D98C','#7DBF63'], draw: function () {
    return '<g stroke="#8B5A2B" stroke-width="5" fill="none"><line x1="0" y1="250" x2="330" y2="250"/><line x1="0" y1="280" x2="330" y2="280"/><line x1="40" y1="230" x2="40" y2="302"/><line x1="120" y1="230" x2="120" y2="302"/><line x1="200" y1="230" x2="200" y2="302"/><line x1="280" y1="230" x2="280" y2="302"/></g>' +
           prop('🦁', 80, 300, 52) + prop('🐘', 220, 300, 60) + tree(720, 300, 1) + prop('🐒', 720, 236, 36) + prop('🐧', 840, 300, 40); } },
  harbor:  { ground:['#C9A46B','#A98650'], draw: function () {
    return '<rect x="0" y="232" width="900" height="70" fill="#3E9BD6"/><path d="M0 238 Q60 226 120 238 T240 238 T360 238 T480 238 T600 238 T720 238 T840 238 T960 238 V302 H0Z" fill="#62B4E6"/>' +
           '<g stroke="#8B5A2B" stroke-width="6"><line x1="60" y1="300" x2="60" y2="250"/><line x1="140" y1="300" x2="140" y2="250"/><line x1="760" y1="300" x2="760" y2="250"/><line x1="840" y1="300" x2="840" y2="250"/></g>' +
           prop('🛳️', 220, 262, 70) + prop('⛵', 720, 258, 48) + prop('⚓', 850, 300, 34); } },
  airport: { ground:['#DDE3EA','#C4CCD6'], wall:['#EEF3F8','#DCE5EE'], draw: function () {
    return '<rect x="0" y="0" width="900" height="300" fill="#EEF3F8"/><rect x="0" y="80" width="900" height="130" fill="#BFE0F7"/>' +
           '<g stroke="#9DB2C6" stroke-width="4"><line x1="150" y1="80" x2="150" y2="210"/><line x1="300" y1="80" x2="300" y2="210"/><line x1="600" y1="80" x2="600" y2="210"/><line x1="750" y1="80" x2="750" y2="210"/></g>' +
           prop('✈️', 220, 170, 70) + prop('🧳', 720, 300, 40) + prop('🛫', 840, 300, 36) + '<rect x="0" y="210" width="900" height="6" fill="#9DB2C6"/>'; } },
  snow:    { ground:['#FFFFFF','#DCE9F4'], draw: function () { return prop('🏔️', 780, 260, 130, 0.9) + pine(80, 300, 1.1, true) + pine(180, 300, 0.8, true) + prop('🚡', 660, 150, 44) + '<line x1="0" y1="120" x2="900" y2="180" stroke="#7F8EA3" stroke-width="2"/>'; } },
  rink:    { ground:['#EAF6FF','#CFE6F7'], wall:['#DDE9F5','#C5D8EA'], draw: function () {
    return '<rect x="0" y="0" width="900" height="300" fill="#DDE9F5"/><rect x="0" y="200" width="900" height="100" fill="#F4FBFF"/><rect x="0" y="196" width="900" height="8" fill="#B8CCE0"/>' +
           prop('⛸️', 120, 292, 50) + prop('⛸️', 760, 292, 42) + prop('🧣', 840, 292, 34) + prop('❄️', 450, 90, 40, 0.7); } },
  autumn:  { ground:['#D9B36A','#B98F45'], draw: function () { return tree(90, 300, 1.1, '#E58A2A') + tree(210, 300, 0.85, '#C9522B') + tree(700, 300, 1, '#F2B134') + prop('🎃', 810, 300, 50) + prop('🍂', 300, 300, 30) + prop('🚜', 850, 250, 40, 0.9); } },
  xmas:    { ground:['#FFFFFF','#DCE9F4'], wall:['#1E2A4A','#3C4E7A'], draw: function () {
    return '<rect x="0" y="0" width="900" height="300" fill="#1E2A4A"/>' +
           '<g fill="#fff"><circle cx="80" cy="50" r="2"/><circle cx="200" cy="90" r="1.6"/><circle cx="330" cy="40" r="2.2"/><circle cx="520" cy="70" r="1.8"/><circle cx="700" cy="36" r="2.4"/><circle cx="820" cy="96" r="1.6"/></g>' +
           '<path d="M0 100 Q450 40 900 100" stroke="#FFD75E" stroke-width="2" fill="none"/>' +
           '<g fill="#FFD75E"><circle cx="100" cy="88" r="4"/><circle cx="250" cy="72" r="4"/><circle cx="400" cy="62" r="4"/><circle cx="550" cy="62" r="4"/><circle cx="700" cy="72" r="4"/><circle cx="850" cy="90" r="4"/></g>' +
           prop('🎄', 120, 300, 120) + prop('🎁', 230, 300, 40) + prop('⛄', 760, 300, 64) + prop('🎁', 850, 300, 36); } },
  museum:  { ground:['#E7E2D6','#CFC8B8'], wall:['#F5F1E8','#E4DDCF'], draw: function () {
    return '<rect x="0" y="0" width="900" height="300" fill="#F5F1E8"/><rect x="0" y="120" width="900" height="6" fill="#D9CDB6"/>' +
           '<g fill="#E4DBC6"><rect x="60" y="130" width="26" height="170"/><rect x="180" y="130" width="26" height="170"/><rect x="700" y="130" width="26" height="170"/><rect x="820" y="130" width="26" height="170"/></g>' +
           '<rect x="240" y="150" width="120" height="90" rx="4" fill="#fff" stroke="#C9A87C" stroke-width="6"/>' + prop('🖼️', 300, 220, 50) +
           prop('🦕', 780, 292, 70) + prop('🏺', 130, 292, 40); } },
  highway: { ground:['#8E9399','#6B7076'], draw: function () {
    return prop('🏔️', 120, 250, 110, 0.85) + prop('🏔️', 760, 250, 130, 0.85) +
           '<rect x="0" y="300" width="900" height="120" fill="#5E646B"/><line x1="0" y1="360" x2="900" y2="360" stroke="#FFD75E" stroke-width="4" stroke-dasharray="40 30"/>' +
           prop('🚗', 90, 300, 40) + prop('🚚', 820, 300, 46) + prop('⛽', 700, 300, 40); } }
};

/* ───── data-driven scenery for the newer adventures ─────
   { ground:[top,bottom], wall:[top,bottom] (indoor / night sky), base:[...], props:[[emoji,x,y,size,opacity],...] }
   bases are reusable set pieces; props are emoji placed on the 900×420 stage (ground line is y=300). */
var GROUNDS = {
  grass:['#96D67F','#6FBF5C'], sand:['#F6E2A8','#E9CC7A'], desert:['#F1CF86','#DDB35C'], snow:['#FFFFFF','#DCE9F4'],
  paving:['#C9CBD1','#A9ADB6'], floor:['#F3E9DD','#E2D5C4'], coolfloor:['#DDE3EA','#C4CCD6'], autumn:['#D9B36A','#B98F45'],
  jungle:['#6FB35B','#4A8A3C'], dark:['#5A3A6E','#3E2850'], ice:['#EAF6FF','#CFE6F7'], deck:['#C9A46B','#A98650'],
  rock:['#8E9399','#6B7076'], moon:['#C8C8CF','#9A9AA3'], carpet:['#7A2E3A','#5A1F29'], clay:['#D9855A','#B8683F'],
  lava:['#5B4A45','#3D2F2B'], gravel:['#D6CDBB','#B9AE9A'], meadow:['#B7DC7A','#8FC45A'], mud:['#A88A5C','#8A6E44']
};
var WALLS = {
  night:['#1E2A4A','#3C4E7A'], deepnight:['#2A1C4E','#5B3E8E'], warm:['#FBF3E6','#F1E3D0'], cool:['#EEF3F8','#DCE5EE'],
  dark:['#2B2140','#4A3560'], cave:['#3B3230','#5A4B46'], space:['#0B1026','#1E2A4A'], sea:['#0B3D6E','#1C6AA8'],
  glass:['#DFF3E4','#C5E8CF'], concrete:['#D9DCE1','#C3C8CF'], red:['#5A1F29','#8A3340']
};

function sceneBase(kind) {
  switch (kind) {
    case 'houses': return houses();
    case 'trees': return tree(90, 300, 1.1) + tree(210, 300, 0.85) + tree(690, 300, 1) + tree(810, 300, 1.15);
    case 'autumntrees': return tree(90, 300, 1.1, '#E58A2A') + tree(210, 300, 0.85, '#C9522B') + tree(700, 300, 1, '#F2B134');
    case 'pines': return pine(70, 300, 1.1) + pine(170, 300, 0.8) + pine(730, 300, 0.9) + pine(830, 300, 1.2);
    case 'snowpines': return pine(80, 300, 1.1, true) + pine(180, 300, 0.8, true) + pine(760, 300, 1, true) + pine(850, 300, 0.85, true);
    case 'city': return building(20, 90, 220, '#8E9BB0') + building(130, 70, 160, '#A7B2C4') + building(650, 80, 190, '#9AA6BA') + building(760, 110, 240, '#8090A8');
    case 'skyline': return building(0, 60, 150, '#6E7A92') + building(70, 50, 110, '#7F8BA3') + building(130, 80, 200, '#5F6B84') + building(220, 60, 130, '#7F8BA3') +
                           building(620, 70, 170, '#6E7A92') + building(700, 90, 230, '#5F6B84') + building(800, 60, 140, '#7F8BA3') + building(860, 40, 110, '#6E7A92');
    case 'water': return '<rect x="0" y="236" width="900" height="70" fill="#4FB3E8"/><path d="M0 240 Q60 228 120 240 T240 240 T360 240 T480 240 T600 240 T720 240 T840 240 T960 240 V306 H0Z" fill="#7CCBF0"/>';
    case 'lake': return '<ellipse cx="450" cy="300" rx="420" ry="40" fill="#5BB8E8"/><ellipse cx="450" cy="296" rx="380" ry="28" fill="#8AD1F2" opacity=".7"/>';
    case 'stars': return '<g fill="#fff"><circle cx="80" cy="50" r="2"/><circle cx="200" cy="90" r="1.6"/><circle cx="330" cy="40" r="2.2"/><circle cx="520" cy="70" r="1.8"/><circle cx="700" cy="36" r="2.4"/><circle cx="820" cy="96" r="1.6"/><circle cx="430" cy="120" r="1.4"/><circle cx="610" cy="130" r="1.6"/></g>';
    case 'hills': return prop('🏔️', 120, 250, 110, 0.85) + prop('🏔️', 760, 250, 130, 0.85);
    case 'greenhills': return '<ellipse cx="120" cy="300" rx="280" ry="90" fill="#7FBF63"/><ellipse cx="780" cy="300" rx="320" ry="110" fill="#6FB257"/>';
    case 'dunes': return '<ellipse cx="150" cy="300" rx="280" ry="70" fill="#EBCB8B"/><ellipse cx="760" cy="300" rx="320" ry="90" fill="#E3BD74"/>';
    case 'stands': { var out = ''; for (var r = 0; r < 5; r++) out += '<rect x="0" y="' + (210 + r * 18) + '" width="900" height="16" fill="' + (r % 2 ? '#C8D3E0' : '#B0BFD0') + '"/>'; return out + '<rect x="0" y="210" width="900" height="6" fill="#7F8EA3"/>'; }
    case 'bunting': return bunting();
    case 'fence': return '<g stroke="#8B5A2B" stroke-width="5" fill="none"><line x1="0" y1="250" x2="330" y2="250"/><line x1="0" y1="280" x2="330" y2="280"/><line x1="40" y1="230" x2="40" y2="302"/><line x1="120" y1="230" x2="120" y2="302"/><line x1="200" y1="230" x2="200" y2="302"/><line x1="280" y1="230" x2="280" y2="302"/></g>';
    case 'longfence': return '<g stroke="#9A6A3A" stroke-width="4"><line x1="0" y1="266" x2="900" y2="266"/><line x1="0" y1="284" x2="900" y2="284"/><line x1="60" y1="250" x2="60" y2="302"/><line x1="180" y1="250" x2="180" y2="302"/><line x1="720" y1="250" x2="720" y2="302"/><line x1="840" y1="250" x2="840" y2="302"/></g>';
    case 'tents': return prop('⛺', 110, 300, 60) + prop('⛺', 210, 300, 46) + prop('⛺', 760, 300, 52);
    case 'shelves': return '<rect x="0" y="120" width="900" height="6" fill="#D9CDB6"/><g fill="#E4DBC6"><rect x="60" y="130" width="26" height="170"/><rect x="180" y="130" width="26" height="170"/><rect x="700" y="130" width="26" height="170"/><rect x="820" y="130" width="26" height="170"/></g>';
    case 'windows': return '<rect x="0" y="80" width="900" height="130" fill="#BFE0F7"/><g stroke="#9DB2C6" stroke-width="4"><line x1="150" y1="80" x2="150" y2="210"/><line x1="300" y1="80" x2="300" y2="210"/><line x1="600" y1="80" x2="600" y2="210"/><line x1="750" y1="80" x2="750" y2="210"/></g><rect x="0" y="210" width="900" height="6" fill="#9DB2C6"/>';
    case 'stage': return '<rect x="560" y="170" width="320" height="132" rx="10" fill="#4A3570"/><rect x="580" y="150" width="280" height="30" rx="8" fill="#6B4FB0"/><g fill="#FFC93C" opacity=".9"><circle cx="600" cy="165" r="6"/><circle cx="660" cy="165" r="6"/><circle cx="720" cy="165" r="6"/><circle cx="780" cy="165" r="6"/><circle cx="840" cy="165" r="6"/></g>';
    case 'lights': return '<path d="M0 100 Q450 40 900 100" stroke="#FFD75E" stroke-width="2" fill="none"/><g fill="#FFD75E"><circle cx="100" cy="88" r="4"/><circle cx="250" cy="72" r="4"/><circle cx="400" cy="62" r="4"/><circle cx="550" cy="62" r="4"/><circle cx="700" cy="72" r="4"/><circle cx="850" cy="90" r="4"/></g>';
    case 'rails': return '<rect x="0" y="286" width="900" height="16" fill="#E9E5DC"/><rect x="0" y="200" width="900" height="16" fill="#8D97A5"/><rect x="0" y="216" width="900" height="6" fill="#6C7683"/>';
    case 'road': return '<rect x="0" y="300" width="900" height="120" fill="#5E646B"/><line x1="0" y1="360" x2="900" y2="360" stroke="#FFD75E" stroke-width="4" stroke-dasharray="40 30"/>';
    case 'pool': return '<rect x="0" y="246" width="900" height="60" fill="#5BC0EB"/><rect x="0" y="246" width="900" height="8" fill="#9EDCF7"/>';
    case 'icefloor': return '<rect x="0" y="200" width="900" height="100" fill="#F4FBFF"/><rect x="0" y="196" width="900" height="8" fill="#B8CCE0"/>';
    case 'bubbles': return '<g fill="#fff" opacity=".35"><circle cx="120" cy="80" r="6"/><circle cx="160" cy="140" r="4"/><circle cx="700" cy="60" r="7"/><circle cx="760" cy="150" r="5"/><circle cx="450" cy="40" r="4"/><circle cx="820" cy="220" r="6"/></g>';
    case 'pillars': return '<g fill="#E9DFCB"><rect x="70" y="120" width="30" height="180"/><rect x="200" y="120" width="30" height="180"/><rect x="670" y="120" width="30" height="180"/><rect x="800" y="120" width="30" height="180"/></g><rect x="40" y="104" width="820" height="18" fill="#D9CDB6"/>';
    case 'wall': return '<rect x="0" y="180" width="900" height="122" fill="#A89478"/><g fill="#8E7B62"><rect x="0" y="196" width="900" height="4"/><rect x="0" y="230" width="900" height="4"/><rect x="0" y="264" width="900" height="4"/></g>';
    case 'court': return '<rect x="0" y="300" width="900" height="120" fill="#D9855A"/><g stroke="#fff" stroke-width="4" fill="none" opacity=".8"><line x1="0" y1="340" x2="900" y2="340"/><rect x="330" y="308" width="240" height="60" rx="30"/></g>';
    case 'track': return '<rect x="0" y="300" width="900" height="120" fill="#C9553C"/><g stroke="#fff" stroke-width="3" opacity=".7"><line x1="0" y1="330" x2="900" y2="330"/><line x1="0" y1="360" x2="900" y2="360"/><line x1="0" y1="390" x2="900" y2="390"/></g>';
    case 'stall': return '<rect x="30" y="200" width="200" height="100" rx="8" fill="#E9D8B4"/><path d="M20 200 L40 160 H220 L240 200Z" fill="#4A9BE8"/><rect x="670" y="200" width="200" height="100" rx="8" fill="#E9D8B4"/><path d="M660 200 L680 160 H860 L880 200Z" fill="#2F9E44"/>';
    case 'balloons': return prop('🎈', 120, 170, 70) + prop('🎈', 300, 130, 50) + prop('🎈', 680, 150, 60) + prop('🎈', 820, 190, 44);
    default: return '';
  }
}

function scene(spec) {
  return {
    ground: GROUNDS[spec.ground] || spec.ground,
    wall: spec.wall ? (WALLS[spec.wall] || spec.wall) : undefined,
    draw: function () {
      var out = spec.wall ? '<rect x="0" y="0" width="900" height="300" fill="' + (WALLS[spec.wall] || spec.wall)[0] + '"/>' : '';
      (spec.base || []).forEach(function (b) { out += sceneBase(b); });
      (spec.props || []).forEach(function (p) { out += prop(p[0], p[1], p[2], p[3], p[4]); });
      return out;
    }
  };
}

var SCENES = {
  /* sun */
  waterpark:  { ground:'paving', base:['pool'], props:[['🎢',110,250,90],['🌊',760,262,60],['🏐',840,300,30],['🌴',300,300,60]] },
  lakeside:   { ground:'grass', base:['lake'], props:[['⛵',150,262,54],['🦆',720,272,34],['🧺',830,300,36],['🌳',60,300,60]] },
  orchard:    { ground:'meadow', props:[['🌳',80,300,84],['🍎',80,228,26],['🌳',200,300,70],['🍎',200,238,22],['🌳',720,300,80],['🍎',720,232,26],['🌳',840,300,66],['🧺',300,300,30]] },
  sunflower:  { ground:'meadow', props:[['🌻',60,300,60],['🌻',130,290,48],['🌻',200,300,56],['🌻',260,292,40],['🌻',680,300,58],['🌻',750,290,46],['🌻',820,300,60],['🌻',870,292,42],['📸',560,300,34]] },
  /* city */
  oldtown:    { ground:'gravel', base:['houses'], props:[['⛲',150,300,60],['🕰️',760,220,54],['🏰',820,300,70]] },
  metro:      { ground:'coolfloor', wall:'concrete', base:['rails'], props:[['🚇',180,280,70],['🚶',760,300,40],['🎫',840,300,30]] },
  office:     { ground:'paving', base:['skyline'], props:[['🏢',120,300,80],['🚚',760,300,50],['💼',850,300,30]] },
  library:    { ground:'floor', wall:'warm', base:['shelves'], props:[['📚',130,250,54],['📚',770,250,54],['🧸',300,300,34],['☕',600,300,30]] },
  /* crowds */
  circus:     { ground:'grass', base:['bunting'], props:[['🎪',140,300,140],['🐘',740,300,70],['🤹',840,300,44],['🎈',300,240,34]] },
  carnival:   { ground:'paving', base:['bunting','houses'], props:[['🎭',110,300,64],['🥁',210,300,44],['🎉',720,300,54],['🎺',820,300,44]] },
  newyear:    { ground:'snow', wall:'night', base:['stars','skyline'], props:[['🎆',150,160,80],['🎆',720,140,70],['🕛',820,300,60],['🎉',120,300,44]] },
  marketplace:{ ground:'gravel', base:['stall'], props:[['🍎',130,270,34],['🥕',770,270,34],['🐟',280,300,34],['💐',620,300,34]] },
  expo:       { ground:'coolfloor', wall:'cool', base:['windows'], props:[['🏛️',130,300,60],['🎟️',770,300,44],['🅰️',280,250,36],['🧳',620,300,34]] },
  /* winter */
  lodge:      { ground:'snow', base:['snowpines','hills'], props:[['🏠',740,300,90],['🔥',680,300,30],['🪑',830,300,30]] },
  sledhill:   { ground:'snow', props:[['⛰️',760,270,120,0.8],['🛷',120,300,50],['🛷',220,280,36],['⛄',820,300,50],['🌲',60,300,60]] },
  icefest:    { ground:'ice', wall:'night', base:['stars','lights'], props:[['🏰',140,300,110],['🧊',300,300,40],['🏮',700,240,40],['🏮',820,240,40],['🧊',760,300,48]] },
  hockey:     { ground:'ice', wall:'cool', base:['icefloor'], props:[['🏒',130,292,50],['🥅',770,292,50],['🪑',280,250,30],['🪑',620,250,30]] },
  snowpark:   { ground:'snow', base:['hills'], props:[['🏂',150,300,60],['🚡',700,150,44],['🏂',780,300,44],['🌲',850,300,50]] },
  santavillage:{ ground:'snow', wall:'night', base:['stars','lights','snowpines'], props:[['🎅',140,300,70],['🎁',240,300,36],['🦌',740,300,60],['🎄',840,300,64]] },
  thermal:    { ground:'snow', base:['pool'], props:[['♨️',150,262,60],['♨️',740,262,50],['🧖',840,300,44],['🌲',60,300,50]] },
  /* rain */
  harvest:    { ground:'autumn', base:['longfence'], props:[['🍇',120,300,50],['🍇',220,300,44],['🛢️',720,300,50],['🚜',830,300,54]] },
  halloween:  { ground:'autumn', wall:'deepnight', base:['stars'], props:[['🏚️',140,300,110],['🎃',260,300,44],['👻',720,230,54],['🎃',780,300,50],['🦇',600,140,30],['🦇',820,110,26]] },
  aquarium:   { ground:'coolfloor', wall:'sea', base:['bubbles'], props:[['🦈',150,150,80],['🐠',300,90,44],['🐙',740,140,64],['🐚',830,300,34],['🐠',620,70,36]] },
  greenhouse: { ground:'floor', wall:'glass', base:['windows'], props:[['🌵',130,300,60],['🌿',250,300,50],['🌺',740,300,54],['🦋',680,200,36],['🌱',840,300,40]] },
  bookfair:   { ground:'floor', wall:'warm', base:['shelves'], props:[['📖',130,250,54],['📚',770,250,54],['✍️',300,300,34],['🧸',620,300,30]] },
  steamtrain: { ground:'autumn', base:['rails','autumntrees'], props:[['🚂',200,282,90],['🛤️',780,300,40]] },
  umbrella:   { ground:'paving', base:['houses'], props:[['☔',130,200,60],['☔',240,170,48],['☔',700,190,56],['☔',820,160,44],['🚋',780,300,60]] },
  /* world */
  desert:     { ground:'desert', base:['dunes'], props:[['🌴',120,300,80],['🐪',740,300,64],['🌵',830,300,50],['💧',300,300,26]] },
  jungle:     { ground:'jungle', base:['trees'], props:[['🌴',150,300,90],['🐒',150,220,34],['🌴',760,300,84],['🦜',760,230,32],['💦',300,300,40]] },
  safari:     { ground:'desert', props:[['🌳',120,300,80],['🦓',240,300,50],['🦒',720,300,80],['🚙',830,300,50],['🦛',600,300,40]] },
  island:     { ground:'sand', base:['water'], props:[['🌴',80,300,96],['🌴',820,300,90],['⛵',700,258,44],['🐚',300,300,26]] },
  venice:     { ground:'deck', base:['water','houses'], props:[['🚣',200,266,60],['🌉',720,240,80],['🕊️',600,120,26]] },
  neoncity:   { ground:'paving', wall:'dark', base:['stars','skyline'], props:[['🌃',130,300,60],['🚦',260,300,44],['🏮',700,220,40],['🕹️',820,300,44]] },
  pyramids:   { ground:'desert', base:['dunes'], props:[['🔺',150,300,150],['🔺',330,300,90],['🗿',720,300,60],['🐫',830,300,54]] },
  fjord:      { ground:'rock', base:['water','hills'], props:[['⛴️',200,262,64],['🏠',760,300,50],['🔭',840,300,30]] },
  bazaar:     { ground:'gravel', base:['stall'], props:[['🕌',150,150,60],['🌶️',130,270,34],['🧶',770,270,34],['🏺',620,300,34],['🐪',300,300,40]] },
  outback:    { ground:'desert', props:[['🌵',120,300,60],['🦘',240,300,56],['🌵',720,300,50],['⛽',820,300,50],['🌵',860,300,36]] },
  /* nature */
  farm:       { ground:'meadow', base:['longfence'], props:[['🏚️',140,300,90],['🐄',240,300,44],['🐐',720,300,40],['🐓',800,300,30],['🚜',860,300,44]] },
  stables:    { ground:'mud', base:['longfence'], props:[['🐴',140,300,64],['🐎',740,300,56],['🏠',830,300,60]] },
  birdlake:   { ground:'autumn', base:['lake','autumntrees'], props:[['🦆',300,286,34],['🦢',600,286,36],['🔭',830,300,30]] },
  butterfly:  { ground:'jungle', wall:'glass', base:['windows'], props:[['🦋',140,150,56],['🦋',300,90,40],['🌺',130,300,54],['🦋',720,120,48],['🌸',770,300,54],['🐛',840,300,30]] },
  dogpark:    { ground:'grass', base:['trees'], props:[['🐕',150,300,50],['🐩',300,300,40],['🐕',720,300,44],['💦',830,300,36]] },
  dolphins:   { ground:'paving', base:['pool'], props:[['🐬',140,240,70],['🐬',760,250,56],['🪑',300,300,30],['🎁',840,300,30]] },
  cavepark:   { ground:'rock', wall:'cave', props:[['🕯️',130,300,44],['🦇',300,140,40],['🦇',600,110,32],['💧',740,300,44],['🗿',820,300,50]] },
  dinopark:   { ground:'jungle', base:['trees'], props:[['🦖',140,300,100],['🦕',740,300,110],['⛏️',300,300,30]] },
  /* sport */
  marathon:   { ground:'paving', base:['houses'], props:[['🏁',150,300,54],['🏃',260,300,44],['💧',720,300,36],['🏃',820,300,40]] },
  tennis:     { ground:'clay', base:['court'], props:[['🎾',150,300,40],['🏆',760,300,44],['🍹',840,300,30]] },
  skatepark:  { ground:'paving', props:[['🛹',150,300,50],['🛹',300,280,36],['🎧',720,300,34],['🛹',820,300,44]] },
  swimmeet:   { ground:'coolfloor', wall:'cool', base:['pool'], props:[['🥇',150,300,40],['🏊',300,270,40],['🏊',700,270,40],['🪑',830,300,30]] },
  cycling:    { ground:'grass', base:['road','hills'], props:[['🚴',150,300,50],['🚴',260,300,40],['🏘️',760,300,64]] },
  gym:        { ground:'coolfloor', wall:'cool', props:[['🏋️',150,300,56],['🧘',300,300,40],['🛎️',720,300,30],['🚴',820,300,44]] },
  basketball: { ground:'clay', base:['court'], props:[['🏀',150,300,44],['🪑',300,300,30],['🏀',820,300,40]] },
  karting:    { ground:'rock', base:['track'], props:[['🏎️',150,300,60],['🔧',300,300,30],['🏆',760,300,44],['🏁',840,300,40]] },
  golf:       { ground:'grass', base:['greenhills'], props:[['⛳',150,300,56],['🏌️',760,300,50],['🌳',850,300,60]] },
  climbing:   { ground:'coolfloor', wall:'cool', base:['wall'], props:[['🧗',140,250,60],['🧱',300,300,30],['🧒',760,260,40],['🧗',840,240,44]] },
  /* fun */
  themepark:  { ground:'paving', base:['bunting'], props:[['🎢',130,300,140],['🎠',760,300,90],['🎡',850,300,70],['🎈',300,240,30]] },
  theater:    { ground:'carpet', wall:'red', base:['lights'], props:[['🎭',150,150,70],['🥂',300,300,34],['🎭',740,150,60],['🚪',840,300,44]] },
  arcade:     { ground:'dark', wall:'dark', base:['stars'], props:[['🕹️',150,300,60],['🧸',300,300,36],['🕺',720,300,48],['🎰',830,300,50]] },
  comiccon:   { ground:'coolfloor', wall:'cool', base:['windows'], props:[['🦸',150,300,60],['🖌️',300,300,30],['🦹',740,300,56],['🎤',840,300,34]] },
  balloonfest:{ ground:'meadow', base:['balloons','greenhills'], props:[['🎈',600,120,44],['⛰️',820,300,60,0.8]] },
  filmset:    { ground:'gravel', props:[['🎥',150,300,60],['🎬',260,300,40],['🍽️',700,300,36],['🚐',820,300,54]] },
  puppet:     { ground:'floor', wall:'warm', base:['lights'], props:[['🧸',150,300,60],['🎟️',280,300,30],['🎭',740,150,50],['🌷',830,300,36]] },
  artfair:    { ground:'paving', base:['trees'], props:[['🎨',150,300,56],['🗿',280,300,50],['🖼️',720,240,56],['🥂',840,300,30]] },
  musicschool:{ ground:'floor', wall:'warm', props:[['🎻',150,300,56],['🎹',300,300,48],['🎺',720,300,40],['🎼',820,220,40]] },
  flea:       { ground:'gravel', base:['stall'], props:[['🕰️',130,270,34],['🧸',770,270,34],['🛒',620,300,40],['📻',300,300,30]] },
  /* wild */
  moonbase:   { ground:'moon', wall:'space', base:['stars'], props:[['🌍',150,170,56],['🚀',740,300,70],['🛸',300,190,48],['🚪',840,300,40]] },
  pirateship: { ground:'deck', base:['water'], props:[['🦜',150,240,44],['🗡️',280,300,34],['⚓',740,300,50],['💰',840,300,36],['🏴',150,300,44]] },
  castle:     { ground:'grass', props:[['🏯',150,300,140],['🛡️',300,300,34],['🌉',740,300,80],['🦢',840,300,30]] },
  lighthouse: { ground:'rock', base:['water'], props:[['🗼',150,300,120],['🌅',150,150,50],['⛵',700,258,40],['🎣',830,300,36]] },
  volcano:    { ground:'lava', props:[['🌋',150,300,160],['🔥',300,300,40],['🌋',780,300,110],['🦎',850,300,30]] },
  spacecenter:{ ground:'coolfloor', wall:'cool', base:['windows'], props:[['🚀',150,300,90],['🛰️',300,150,40],['🕹️',720,300,40],['👩‍🚀',830,300,50]] },
  treehouse:  { ground:'grass', base:['trees'], props:[['🏡',150,190,70],['🌳',150,300,90],['🌉',450,200,60],['🏡',760,180,60],['🌳',760,300,84]] },
  robotfactory:{ ground:'coolfloor', wall:'concrete', props:[['🤖',150,300,60],['🔧',300,300,34],['⚙️',720,220,44],['🤖',830,300,50]] },
  underwater: { ground:'coolfloor', wall:'sea', base:['bubbles'], props:[['🐙',150,150,70],['🐠',300,100,40],['🐟',600,80,36],['🦈',760,150,70],['🐚',840,300,30]] },
  wizardfair: { ground:'autumn', wall:'deepnight', base:['stars','lights','bunting'], props:[['🧙',150,300,64],['🧪',280,300,36],['🐉',740,300,80],['🔮',840,300,36]] }
};
Object.keys(SCENES).forEach(function (k) { BACKDROPS[k] = scene(SCENES[k]); });

function paintBackdrop(kind, weatherKey) {
  var b = BACKDROPS[kind] || BACKDROPS.street;
  var w = WEATHER[weatherKey], m = MODE();
  var wet = weatherKey === 'rainy', snow = weatherKey === 'snowy';
  var grey = wet || snow || weatherKey === 'cloudy';

  $('#skyTop').setAttribute('stop-color', b.wall ? b.wall[0] : w.sky[0]);
  $('#skyBottom').setAttribute('stop-color', b.wall ? b.wall[1] : w.sky[1]);
  $('#groundTop').setAttribute('stop-color', b.ground[0]);
  $('#groundBottom').setAttribute('stop-color', b.ground[1]);
  $('#groundLine').setAttribute('fill', b.ground[1]);
  $('#bgGroup').innerHTML = b.draw();

  $('#sunGroup').style.opacity = (grey || m.indoor || m.night) ? 0 : 1;
  buildClouds((m.indoor || m.night) ? 0 : grey ? 5 : weatherKey === 'warm' || weatherKey === 'mild' || weatherKey === 'chilly' ? 2 : 0);
  buildRain(m.indoor ? false : wet ? 'rain' : snow ? 'snow' : false);

  /* the extra stands you own, as little tents in the background */
  var g = $('#extraStands');
  g.innerHTML = '';
  openSpots().forEach(function (sp, i) {
    var x = 255 - i * 80, y = 296;
    g.insertAdjacentHTML('beforeend',
      '<g transform="translate(' + x + ',' + y + ')">' +
      '<rect x="-30" y="-36" width="60" height="36" rx="5" fill="#F6E3C4" stroke="#C9A87C" stroke-width="2"/>' +
      '<path d="M-36 -36 L-24 -60 H24 L36 -36 Z" fill="#EF5A3C"/>' +
      '<text x="0" y="-62" font-size="24" text-anchor="middle">' + sp.emoji + '</text>' +
      '<text x="0" y="-12" font-size="11" text-anchor="middle" font-family="Nunito,system-ui" font-weight="800" fill="#33261A">' + t('spots.mini') + '</text></g>');
  });
}

function startSim(res) {
  show('screen-sim');
  paintBackdrop(MODE().backdrop, res.weather);

  $('#simTicker').innerHTML = '';
  $('#simLem').textContent = '0';
  $('#simDog').textContent = '0';
  $('#simRev').textContent = '$0.00';
  $('#peopleGroup').innerHTML = '';
  $('#popGroup').innerHTML = '';

  var total = res.sold.lemonade + res.sold.hotdog;
  var queue = [];
  for (var i = 0; i < res.sold.lemonade; i++) queue.push('lemonade');
  for (var j = 0; j < res.sold.hotdog; j++) queue.push('hotdog');
  /* shuffle buyers, then sprinkle in the ones who walk away */
  var r = mulberry(S.seed + S.day * 977);
  for (var k = queue.length - 1; k > 0; k--) {
    var m = Math.floor(r() * (k + 1)); var tmp = queue[k]; queue[k] = queue[m]; queue[m] = tmp;
  }
  var walkers = Math.min(30, Math.max(6, total));
  var perWalker = total > 0 ? total / walkers : 0;

  sim = {
    res: res, r: r, t0: performance.now(), dur: 9000,
    total: total, queue: queue, spawned: 0, walkers: walkers, perWalker: perWalker,
    soldL: 0, soldD: 0, rev: 0, people: [], nextSpawn: 0, done: false, skipped: false,
    missed: res.lostStock + res.lostCap, missedShown: 0, ticks: {}
  };

  /* the morning pre-order goes out before the first customer shows up */
  if (res.pre && res.pre.got > 0) {
    if (res.pre.prod === 'lemonade') sim.soldL = res.pre.got; else sim.soldD = res.pre.got;
    sim.preRev = res.preRev;
    addTick(t('sim.preorder', { n: nDe(res.pre.got, prodName(res.pre.prod).toLowerCase()), v: money(res.preRev) }));
  }
  paintHud();

  $('#btnSkip').onclick = function () { finishSim(); };

  /* rAF stops in a hidden tab. This makes sure the day always closes. */
  sim.watchdog = setInterval(function () {
    if (!sim) return;
    if (performance.now() - sim.t0 > sim.dur + 4000) finishSim();
  }, 500);

  lastFrame = 0;
  requestAnimationFrame(simFrame);
}

function buildClouds(n) {
  var g = $('#cloudGroup');
  g.innerHTML = '';
  g.style.opacity = n ? 1 : 0;
  for (var i = 0; i < n; i++) {
    var x = 40 + i * 190 + (i % 2) * 60, y = 44 + (i % 3) * 34, s = 0.75 + (i % 3) * 0.22;
    g.insertAdjacentHTML('beforeend',
      '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')" opacity=".9">' +
      '<ellipse cx="0" cy="0" rx="42" ry="22" fill="#fff"/>' +
      '<ellipse cx="30" cy="6" rx="32" ry="17" fill="#fff"/>' +
      '<ellipse cx="-28" cy="7" rx="27" ry="15" fill="#fff"/></g>');
  }
}

/* kind: false | 'rain' | 'snow' */
function buildRain(kind) {
  var g = $('#rainGroup');
  g.innerHTML = '';
  g.style.opacity = kind ? 1 : 0;
  if (!kind) return;
  for (var i = 0; i < 60; i++) {
    var x = Math.random() * 900, y = Math.random() * 420;
    var dur = (kind === 'snow' ? 3 + Math.random() * 2 : 0.7 + Math.random() * 0.5) + 's';
    var shape = kind === 'snow'
      ? '<circle cx="' + x + '" cy="' + y + '" r="' + (2 + Math.random() * 2.5) + '" fill="#fff" opacity=".85">'
      : '<line x1="' + x + '" y1="' + y + '" x2="' + (x - 5) + '" y2="' + (y + 15) + '" stroke="#CFE6F5" stroke-width="2" opacity=".65">';
    var tag = kind === 'snow' ? '</circle>' : '</line>';
    g.insertAdjacentHTML('beforeend', shape +
      '<animateTransform attributeName="transform" type="translate" from="0 -60" to="0 420" dur="' + dur + '" repeatCount="indefinite"/>' + tag);
  }
}

var SHIRTS = ['#EF5A3C','#4A9BE8','#2F9E44','#6C4FD8','#E87BA4','#F2A81D','#14A38B','#D9534F'];
var SKINS  = ['#F3C9A0','#E0A878','#C08552','#8D5524','#FFDFC4','#A9714B'];

function spawnWalker(buys, type) {
  var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  var r = sim.r;
  var shirt = SHIRTS[Math.floor(r() * SHIRTS.length)];
  var skin  = SKINS[Math.floor(r() * SKINS.length)];
  var kid = r() < 0.45;
  var s = kid ? 0.78 : 1;
  g.setAttribute('class', 'walker');
  g.innerHTML =
    '<g transform="scale(' + s + ')">' +
    '<ellipse cx="0" cy="2" rx="13" ry="4" fill="#33261A" opacity=".13"/>' +
    '<rect x="-4" y="-14" width="3.5" height="14" rx="1.6" fill="#4A3524"/>' +
    '<rect x="1" y="-14" width="3.5" height="14" rx="1.6" fill="#4A3524"/>' +
    '<rect x="-10" y="-34" width="20" height="22" rx="8" fill="' + shirt + '"/>' +
    '<circle cx="0" cy="-43" r="10" fill="' + skin + '"/>' +
    '<path d="M-10 -46 a10 10 0 0 1 20 0 z" fill="#3A2A1C" opacity=".85"/>' +
    '<g class="carry" opacity="0"></g></g>';

  var w = {
    el: g, x: 960, y: 372 + Math.floor(r() * 16), buys: buys, type: type,
    speed: 105 + r() * 45, state: 'in', wait: 0, bob: r() * 6.28
  };
  $('#peopleGroup').appendChild(g);
  sim.people.push(w);
}

function giveItem(w) {
  var c = $('.carry', w.el);
  if (!c) return;
  c.innerHTML = w.type === 'lemonade'
    ? '<g transform="translate(11,-30)"><path d="M-4 -7 h8 l-1.2 11 h-5.6 z" fill="#FFD75E" stroke="#E2A400" stroke-width="1.4"/></g>'
    : '<g transform="translate(11,-28)"><rect x="-5" y="-3" width="11" height="6" rx="3" fill="#F2C27E"/><rect x="-4" y="-1.6" width="9" height="3" rx="1.5" fill="#E05C3E"/></g>';
  c.setAttribute('opacity', '1');
}

function popMoney(x, amount) {
  var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('class', 'pop');
  t.setAttribute('x', x);
  t.setAttribute('y', 330);
  t.setAttribute('text-anchor', 'middle');
  t.textContent = '+' + money(amount);
  $('#popGroup').appendChild(t);
  var start = performance.now();
  (function rise(now) {
    var p = (now - start) / 1100;
    if (p >= 1) { t.remove(); return; }
    t.setAttribute('y', 330 - p * 52);
    t.setAttribute('opacity', 1 - p * p);
    requestAnimationFrame(rise);
  })(start);
}

function addTick(txt) {
  var d = document.createElement('div');
  d.className = 'tick';
  d.innerHTML = txt;
  var box = $('#simTicker');
  box.appendChild(d);
  while (box.childElementCount > 3) box.firstElementChild.remove();
}

var lastFrame = 0;
function simFrame(now) {
  if (!sim) return;
  if (sim.skipped) { finishSim(); return; }

  var dt = Math.min(0.05, (now - (lastFrame || now)) / 1000);
  lastFrame = now;
  var p = clamp((now - sim.t0) / sim.dur, 0, 1);

  $('#simBarFill').style.width = (p * 100) + '%';
  var mins = 10 * 60 + p * 7 * 60;
  var hh = Math.floor(mins / 60), mm = Math.floor(mins % 60);
  $('#simClock').textContent = LANG === 'ro'
    ? hh + ':' + (mm < 10 ? '0' : '') + mm
    : (hh > 12 ? hh - 12 : hh) + ':' + (mm < 10 ? '0' : '') + mm + (hh >= 12 ? ' PM' : ' AM');

  /* spawn */
  if (sim.spawned < sim.walkers && p < 0.94 && now >= sim.nextSpawn) {
    var buys = sim.queue.length > 0;
    var type = buys ? sim.queue[0] : null;
    spawnWalker(buys, type);
    sim.spawned++;
    sim.nextSpawn = now + (sim.dur * 0.9) / sim.walkers * (0.6 + sim.r() * 0.8);
  }

  /* move */
  for (var i = sim.people.length - 1; i >= 0; i--) {
    var w = sim.people[i];
    w.bob += dt * 9;
    if (w.state === 'in') {
      w.x -= w.speed * dt;
      if (w.x <= 470) {
        if (w.buys) { w.state = 'wait'; w.wait = 0.45 + sim.r() * 0.3; }
        else { w.state = 'out'; }
      }
    } else if (w.state === 'wait') {
      w.wait -= dt;
      if (w.wait <= 0) {
        w.state = 'out';
        sellOne(w);
      }
    } else {
      w.x -= w.speed * dt;
      if (w.x < -60) { w.el.remove(); sim.people.splice(i, 1); continue; }
    }
    var bob = w.state === 'wait' ? 0 : Math.sin(w.bob) * 1.6;
    w.el.setAttribute('transform', 'translate(' + w.x.toFixed(1) + ',' + (w.y + bob).toFixed(1) + ')');
  }

  /* keep the counters in step with elapsed time even if walkers lag */
  var preL = sim.res.pre && sim.res.pre.prod === 'lemonade' ? sim.res.pre.got : 0;
  var preD = sim.res.pre && sim.res.pre.prod === 'hotdog' ? sim.res.pre.got : 0;
  var targetL = preL + Math.round(sim.res.sold.lemonade * p);
  var targetD = preD + Math.round(sim.res.sold.hotdog * p);
  if (sim.soldL < targetL - 3) { sim.soldL = targetL - 3; }
  if (sim.soldD < targetD - 3) { sim.soldD = targetD - 3; }
  paintHud();

  /* missed-customer notes */
  if (sim.missed > 0 && p > 0.55 && !sim.ticks.missed) {
    sim.ticks.missed = 1;
    if (sim.res.lostStock > 2) addTick(t('sim.soldOut', { n: nDe(Math.round(sim.res.lostStock), t('unit.people')) }));
    else if (sim.res.lostCap > 2) addTick(t('sim.queue', { n: Math.round(sim.res.lostCap) }));
  }
  if (p > 0.25 && !sim.ticks.q) {
    sim.ticks.q = 1;
    addTick(t(sim.total > 25 ? 'sim.busy' : sim.total > 10 ? 'sim.steady' : 'sim.quiet'));
  }
  if (p > 0.72 && !sim.ticks.spots && sim.res.spots.length) {
    sim.ticks.spots = 1;
    addTick(t('sim.spots', { n: sim.res.spots.length }));
  }

  if (p >= 1 && sim.people.length === 0) { finishSim(); return; }
  if (p >= 1 && now - sim.t0 > sim.dur + 3000) { finishSim(); return; }
  requestAnimationFrame(simFrame);
}

function sellOne(w) {
  if (!sim.queue.length) return;
  var type = sim.queue.shift();
  w.type = type;
  giveItem(w);
  /* one walker on screen can stand in for a small group of real customers */
  var count = Math.max(1, Math.round(sim.perWalker));
  var groupL = 0, groupD = 0;
  for (var i = 0; i < count - 1 && sim.queue.length; i++) {
    var extra = sim.queue.shift();
    if (extra === 'lemonade') groupL++; else groupD++;
  }
  if (type === 'lemonade') groupL++; else groupD++;

  var preL = sim.res.pre && sim.res.pre.prod === 'lemonade' ? sim.res.pre.got : 0;
  var preD = sim.res.pre && sim.res.pre.prod === 'hotdog' ? sim.res.pre.got : 0;
  sim.soldL = Math.min(preL + sim.res.sold.lemonade, sim.soldL + groupL);
  sim.soldD = Math.min(preD + sim.res.sold.hotdog, sim.soldD + groupD);
  popMoney(470, groupL * sim.res.prices.lemonade + groupD * sim.res.prices.hotdog);
  paintHud();
}

function paintHud() {
  var preL = sim.res.pre && sim.res.pre.prod === 'lemonade' ? sim.res.pre.got : 0;
  var preD = sim.res.pre && sim.res.pre.prod === 'hotdog' ? sim.res.pre.got : 0;
  sim.rev = round2((sim.soldL - preL) * sim.res.prices.lemonade + (sim.soldD - preD) * sim.res.prices.hotdog + (sim.preRev || 0));
  $('#simLem').textContent = sim.soldL;
  $('#simDog').textContent = sim.soldD;
  $('#simRev').textContent = money(sim.rev);
}

function finishSim() {
  if (!sim || sim.done) return;
  sim.done = true;
  clearInterval(sim.watchdog);
  var res = sim.res;
  sim = null;
  closeDay(res);
}

/* ───────────────────────────── closing the books ───────────────────────────── */

function closeDay(res) {
  applyResult(res);
  save();
  renderReport(res);
  show('screen-report');
}

function negCell(v) { return '<span class="neg">' + money(-v) + '</span>'; }

function renderReport(res) {
  $('#rpDay').textContent = res.day;

  $('#rpTitle').textContent = t(
    res.net > 45 ? 'rp.title.great' : res.net > 15 ? 'rp.title.good' :
    res.net > 0  ? 'rp.title.ok'    : res.net > -12 ? 'rp.title.small' : 'rp.title.bad');
  $('#rpProfit').textContent = money(res.net, true);
  $('#rpHero').classList.toggle('neg', res.net < 0);
  var margin = res.revenue > 0 ? res.net / res.revenue : 0;
  $('#rpProfitSub').textContent = res.revenue > 0
    ? t('rp.profitSubPct', { n: nDe(Math.round(margin * 100), t('unit.cents')) })
    : t('rp.noSales');

  var cardTitle = res.card ? t('card.' + res.card + '.title') : '';

  /* P&L */
  var rows = [];
  rows.push(['head', t('pnl.in'), '']);
  rows.push(['', prodName('lemonade') + ' &nbsp;<small>' +
    t('pnl.each', { n: res.sold.lemonade, v: money(res.prices.lemonade) }) + '</small>',
    money(res.sold.lemonade * res.prices.lemonade)]);
  rows.push(['', prodName('hotdog') + ' &nbsp;<small>' +
    t('pnl.each', { n: res.sold.hotdog, v: money(res.prices.hotdog) }) + '</small>',
    money(res.sold.hotdog * res.prices.hotdog)]);
  if (res.pre) rows.push(['', t('pnl.preorder') + ' &nbsp;<small>' +
    t('pnl.each', { n: res.pre.got, v: money(res.pre.price) }) + '</small>', money(res.preRev)]);
  rows.push(['sum', t('pnl.revenue'), money(res.revenue)]);

  rows.push(['head', t('pnl.cogs'), '']);
  var madeL = res.sold.lemonade + (res.pre && res.pre.prod === 'lemonade' ? res.pre.got : 0);
  var madeD = res.sold.hotdog + (res.pre && res.pre.prod === 'hotdog' ? res.pre.got : 0);
  rows.push(['', t('pnl.cogsLem') + ' <span class="why">' +
    t('pnl.cogsWhyLem', { n: madeL, v: money(unitCostOf(res, 'lemonade')) }) + '</span>', negCell(res.cogsL)]);
  rows.push(['', t('pnl.cogsDog') + ' <span class="why">' +
    t('pnl.cogsWhyDog', { n: madeD, v: money(unitCostOf(res, 'hotdog')) }) + '</span>', negCell(res.cogsD)]);
  rows.push(['sum', t('pnl.gross'), money(res.gross)]);

  rows.push(['head', t('pnl.fixed'), '']);
  rows.push(['', t('pnl.rent'), negCell(res.rent)]);
  if (res.spotRent)  rows.push(['', t('pnl.spots'), negCell(res.spotRent)]);
  if (res.staff)     rows.push(['', t('pnl.staff'), negCell(res.staff)]);
  if (res.marketing) rows.push(['', t('pnl.marketing'), negCell(res.marketing)]);
  if (res.cardCash < 0) rows.push(['', t('pnl.card') + ' <span class="why">' + cardTitle + '</span>', negCell(-res.cardCash)]);
  if (res.share)     rows.push(['', t('pnl.share') + ' <span class="why">' + cardTitle + '</span>', negCell(res.share)]);
  if (res.loanInterest) rows.push(['', t('pnl.interest'), negCell(res.loanInterest)]);
  if (res.waste)     rows.push(['', t('pnl.waste') + ' <span class="why">' + t('pnl.wasteWhy') + '</span>', negCell(res.waste)]);
  if (res.prize)     rows.push(['', t('pnl.prize') + ' <span class="why">' + cardTitle + '</span>',
    '<span class="pos">' + money(res.prize, true) + '</span>']);
  rows.push(['total', t('pnl.net'),
    '<span class="' + (res.net >= 0 ? 'pos' : 'neg') + '">' + money(res.net, true) + '</span>']);

  $('#pnlBody').innerHTML = rows.map(function (r) {
    return '<tr class="' + r[0] + '"><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>';
  }).join('');

  /* cash, step by step — this must tie out exactly, or the numbers lose all trust */
  var cf = [[t('cf.start'), money(res.cashStart), '']];
  if (res.loanGet)      cf.push([t('cf.loanGet'), money(res.loanGet, true), 'pos']);
  if (res.cardCash < 0) cf.push([t('cf.card', { name: cardTitle }), money(res.cardCash), 'neg']);
  cf.push([t('cf.supplies'), money(-res.supplySpend), 'neg']);
  cf.push([t('cf.revenue'), money(res.revenue, true), 'pos']);
  if (res.prize)   cf.push([t('cf.prize'), money(res.prize, true), 'pos']);
  cf.push([t('cf.rent'), money(-res.rent), 'neg']);
  if (res.spotRent)  cf.push([t('cf.spots'), money(-res.spotRent), 'neg']);
  if (res.staff)     cf.push([t('cf.staff'), money(-res.staff), 'neg']);
  if (res.marketing) cf.push([t('cf.marketing'), money(-res.marketing), 'neg']);
  if (res.share)     cf.push([t('cf.share'), money(-res.share), 'neg']);
  if (res.loanPay)   cf.push([t('cf.loanPay'), money(-res.loanPay), 'neg']);
  cf.push([t('cf.end'), money(res.cashEnd), 'tot']);

  $('#cashFlow').innerHTML = cf.map(function (r) {
    return '<tr class="' + (r[2] === 'tot' ? 'cf-total' : '') + '"><td>' + r[0] +
           '</td><td class="' + (r[2] === 'tot' ? '' : r[2]) + '">' + r[1] + '</td></tr>';
  }).join('');

  var stockVal = 0;
  SUP_KEYS.forEach(function (k) { stockVal += res.kept[k] * unitPrice(k); });
  var rd = res.repDelta;
  var repTxt = Math.abs(rd) < 0.05
    ? '<span style="color:var(--ink-3)">' + t('cf.unchanged') + '</span>'
    : rd > 0 ? '<span style="color:var(--good-ink)">▲ +' + rd.toFixed(1) + '</span>'
             : '<span style="color:var(--bad)">▼ −' + Math.abs(rd).toFixed(1) + '</span>';
  /* profit and cash rarely match — say why, in plain words */
  var cashMoved = round2(res.cashEnd - res.cashStart);
  var gap = round2(res.net - cashMoved);
  var why = '';
  if (res.loanGet) why = t('cf.gapLoan', { v: money(res.loanGet) });
  else if (res.loanPay) why = t('cf.gapLoanPay', { v: money(res.loanPay - res.loanInterest) });
  else if (Math.abs(gap) >= 1) {
    why = t(gap > 0 ? 'cf.gapUp' : 'cf.gapDown', {
      profit: money(res.net, true), cash: money(cashMoved, true), gap: money(Math.abs(gap)) });
  }
  $('#cashLine').innerHTML = t('cf.repLine', { rep: repTxt, v: money(stockVal) }) + why;

  renderMoneyFlow(res);
  renderCoach(res);
  drawProfitChart($('#chartHolder'), S.history);

  $('#btnNextDay').textContent = t(S.day >= totalDays() ? 'rp.finish' : 'rp.next');
}

function unitCostOf(res, prod) {
  var r = RECIPES[prod][res.recipe[prod]], c = 0;
  for (var k in r.parts) c += r.parts[k] * unitPrice(k);
  return round2(c);
}

function renderMoneyFlow(res) {
  var costs = [
    { k: t('mf.ingredients'), v: res.cogs,       c: 'var(--dv-1)' },
    { k: t('mf.rent'),        v: res.rent,       c: 'var(--dv-2)' },
    { k: t('mf.spots'),       v: res.spotRent,   c: 'var(--dv-6)' },
    { k: t('mf.staff'),       v: res.staff,      c: 'var(--dv-3)' },
    { k: t('mf.marketing'),   v: res.marketing,  c: 'var(--dv-4)' },
    { k: t('mf.card'),        v: (res.cardCash < 0 ? -res.cardCash : 0) + res.share + res.loanInterest, c: 'var(--dv-7)' },
    { k: t('mf.waste'),       v: res.waste,      c: 'var(--dv-waste)' }
  ].filter(function (s) { return s.v > 0.004; });

  var costTotal = round2(costs.reduce(function (a, s) { return a + s.v; }, 0));
  var income = round2(res.revenue + res.prize);
  var segs, total, hint, note = '';

  if (res.net >= 0) {
    /* costs + profit add up to exactly the income */
    segs = costs.concat([{ k: t('mf.profit'), v: res.net, c: 'var(--dv-5)' }]);
    total = income || 1;
    hint = t('mf.hintProfit', { v: money(income) });
  } else {
    /* costs overshot income, so the bar shows the spending instead */
    segs = costs;
    total = costTotal || 1;
    hint = t('mf.hintLoss', { spent: money(costTotal), got: money(income) });
    note = '<li style="color:var(--bad)"><i style="background:var(--bad)"></i>' + t('mf.short') +
           '<b>' + money(-res.net) + '</b><em></em></li>';
  }

  $('#mfHint').innerHTML = hint;

  $('#moneyFlow').innerHTML = segs.map(function (s) {
    var share = s.v / total;
    return '<div class="mf-seg" style="flex:' + s.v + ' 1 0;background:' + s.c + '">' +
           (share > 0.12 ? '<span>' + Math.round(share * 100) + '%</span>' : '') + '</div>';
  }).join('');

  $('#mfLegend').innerHTML = segs.map(function (s) {
    return '<li><i style="background:' + s.c + '"></i>' + s.k +
           '<b>' + money(s.v) + '</b><em>' + Math.round((s.v / total) * 100) + '%</em></li>';
  }).join('') + note;
}

/* ───────────────────────────── Coach Ollie ───────────────────────────── */

function renderCoach(res) {
  var tip = null, term = null;
  var m = MODE();
  var margin = res.revenue > 0 ? res.net / res.revenue : 0;
  var sold = res.sold.lemonade + res.sold.hotdog;

  var priceHigh = null, priceLow = null;
  PRODS.forEach(function (p) {
    var w = WEATHER[res.weather];
    var fair = PRODUCTS[p].baseFair * RECIPES[p][res.recipe[p]].fair *
               (p === 'lemonade' ? w.lemFair * m.lemFair : w.dogFair * m.dogFair);
    var ratio = res.prices[p] / fair;
    if (ratio > 1.22) priceHigh = p;
    if (ratio < 0.72) priceLow = p;
  });

  /* did the extra stands earn their rent? */
  var spotShare = spotTraffic() / (1 + spotTraffic());
  var spotGain = res.spotRent ? round2(res.gross * spotShare) : 0;
  var nextSpot = m.spots.filter(function (sp) { return !S.spots[sp.id]; })[0];

  if (res.revenue === 0) {
    tip = t('coach.nothing'); term = t('coach.nothing.t');
  } else if (res.prize) {
    tip = t('coach.prize', { v: money(res.prize) }); term = t('coach.prize.t');
  } else if (res.lostStock > 3) {
    var missedMoney = res.lostStock * ((res.prices.lemonade + res.prices.hotdog) / 2);
    tip = t('coach.stockout', { n: nDe(Math.round(res.lostStock), t('unit.customers')), v: money(missedMoney) });
    term = t('coach.stockout.t');
  } else if (res.lostCap > 3) {
    tip = t('coach.capacity', { n: nDe(Math.round(res.lostCap), t('unit.people')),
      cost: money(STAFF_COST), cap: nDe(STAFF_CAP, t('unit.customers')) });
    term = t('coach.capacity.t');
  } else if (res.spotRent && spotGain < res.spotRent) {
    tip = t('coach.spotLoss', { rent: money(res.spotRent), got: money(spotGain) }); term = t('coach.spotLoss.t');
  } else if (res.waste > 6) {
    tip = t('coach.waste', { v: money(res.waste) }); term = t('coach.waste.t');
  } else if (priceHigh && margin < 0.30) {
    tip = t('coach.priceHigh', { name: prodName(priceHigh).toLowerCase() });
    term = t('coach.priceHigh.t');
  } else if (priceLow) {
    tip = t('coach.priceLow', { name: prodName(priceLow).toLowerCase() });
    term = t('coach.priceLow.t');
  } else if (res.net < 0) {
    tip = t('coach.loss', { v: money(-res.net),
      why: t(res.gross < res.fixed ? 'coach.loss.whyFixed' : 'coach.loss.whyCogs') });
    term = t('coach.loss.t');
  } else if (res.loanGet) {
    tip = t('coach.loan', { get: money(res.loanGet) }); term = t('coach.loan.t');
  } else if (res.marketing > 0 && res.marketing > res.net * 0.6) {
    tip = t('coach.mkROI', { spent: money(res.marketing), net: money(res.net) });
    term = t('coach.mkROI.t');
  } else if (res.staff && res.net < 20) {
    tip = t('coach.staff', { cost: money(res.staff), n: nDe(sold, t('unit.customers')) }); term = t('coach.staff.t');
  } else if (res.spotRent && spotGain > res.spotRent * 1.5) {
    tip = t('coach.spotWin', { rent: money(res.spotRent), got: money(spotGain) }); term = t('coach.spotWin.t');
  } else if (nextSpot && S.day + 1 >= nextSpot.from && S.day < totalDays() - 2 && S.cash > nextSpot.open + 60 && S.rep >= 55 && res.net > 15) {
    tip = t('coach.spotHint', { name: t('spot.' + m.id + '.' + nextSpot.id + '.name'), cost: money0(nextSpot.open),
      rent: money0(nextSpot.rent), pct: Math.round(nextSpot.traffic * 100) });
    term = t('coach.spotHint.t');
  } else if (margin > 0.40 && res.net > 25) {
    tip = t('coach.great', { n: nDe(Math.round(margin * 100), t('unit.cents')) }); term = t('coach.great.t');
  } else {
    tip = t('coach.steady'); term = t('coach.steady.t');
  }

  $('#coachTxt').innerHTML = tip;
  $('#coachTerm').innerHTML = term;
}

/* ───────────────────────────── profit chart ───────────────────────────── */

function drawProfitChart(holder, history) {
  var W = 640, H = 210, padL = 40, padR = 10, padT = 14, padB = 26;
  var iw = W - padL - padR, ih = H - padT - padB;
  var N = totalDays();

  var vals = history.map(function (h) { return h.net; });
  var max = Math.max(10, Math.max.apply(null, vals.concat([0])));
  var min = Math.min(0, Math.min.apply(null, vals.concat([0])));
  var span = (max - min) || 1;
  var y0 = padT + ih * (max / span);                       /* the zero line */
  var slot = iw / N;
  var bw = Math.min(26, slot * 0.62);

  function yOf(v) { return padT + ih * ((max - v) / span); }

  var svg = ['<svg class="chart-svg" viewBox="0 0 ' + W + ' ' + H +
             '" role="img" aria-label="' + t('chart.title') + '">'];

  /* recessive gridlines */
  [max, (max + min) / 2, min].forEach(function (g) {
    if (Math.abs(g) < 0.01 && g !== 0) return;
    svg.push('<line class="ct-grid" x1="' + padL + '" y1="' + yOf(g).toFixed(1) + '" x2="' + (W - padR) + '" y2="' + yOf(g).toFixed(1) + '"/>');
    svg.push('<text class="ct-lab" x="' + (padL - 7) + '" y="' + (yOf(g) + 4).toFixed(1) + '" text-anchor="end">' + money0(g) + '</text>');
  });
  svg.push('<line class="ct-base" x1="' + padL + '" y1="' + y0.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + y0.toFixed(1) + '"/>');

  for (var d = 0; d < N; d++) {
    var cx = padL + slot * (d + 0.5);
    svg.push('<text class="ct-lab" x="' + cx.toFixed(1) + '" y="' + (H - 8) + '" text-anchor="middle">' + (d + 1) + '</text>');
    if (d >= history.length) continue;

    var v = history[d].net;
    var top = v >= 0 ? yOf(v) : y0;
    var h = Math.max(2.5, Math.abs(yOf(v) - y0));
    var col = v >= 0 ? 'var(--good)' : 'var(--bad)';
    /* 4px rounded data-end, square against the baseline */
    var r = Math.min(4, h / 2);
    svg.push('<rect class="ct-bar" x="' + (cx - bw / 2).toFixed(1) + '" y="' + top.toFixed(1) +
             '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" rx="' + r.toFixed(1) +
             '" fill="' + col + '" data-d="' + d + '"/>');
    if (v >= 0) svg.push('<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + (y0 - Math.min(r, h)).toFixed(1) +
             '" width="' + bw.toFixed(1) + '" height="' + Math.min(r, h).toFixed(1) + '" fill="' + col + '"/>');
    else svg.push('<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + y0.toFixed(1) +
             '" width="' + bw.toFixed(1) + '" height="' + Math.min(r, h).toFixed(1) + '" fill="' + col + '"/>');

    svg.push('<rect class="ct-hit" x="' + (cx - slot / 2).toFixed(1) + '" y="' + padT + '" width="' + slot.toFixed(1) +
             '" height="' + ih + '" data-tip="' + d + '"/>');
  }
  svg.push('</svg>');

  holder.className = 'chart-holder chart-wrap';
  holder.innerHTML = svg.join('');

  var tip = document.createElement('div');
  tip.className = 'chart-tip';
  tip.style.display = 'none';
  holder.appendChild(tip);

  $$('.ct-hit', holder).forEach(function (hit) {
    hit.addEventListener('mouseenter', function () {
      var h = history[+hit.dataset.tip];
      var box = holder.getBoundingClientRect();
      var r = hit.getBoundingClientRect();
      tip.style.display = 'block';
      tip.style.left = (r.left - box.left + r.width / 2) + 'px';
      tip.style.top = (r.top - box.top + 24) + 'px';
      tip.innerHTML = t('chart.tipDay', { d: h.day }) + ' · ' + WEATHER[h.weather].emoji + '<br>' +
        t('chart.tipProfit', { v: money(h.net, true) }) + '<br>' +
        '<span style="opacity:.7">' + t('chart.tipItems', { n: nDe(h.sold.lemonade + h.sold.hotdog, t('unit.items')) }) + '</span>';
    });
    hit.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
  });
}

/* ───────────────────────────── finale ───────────────────────────── */

function nextDay() {
  if (S.day >= totalDays()) {
    recordProgress(S.mode, S.cash >= goalFor(S.mode, S.diff), S.cash);
    renderFinale(); show('screen-finale'); clearSave();
    return;
  }
  S.day++;
  startDay();
}

function renderFinale() {
  var m = MODE();
  var goal = goalFor(S.mode, S.diff);
  var won = S.cash >= goal;
  var profits = S.history.map(function (h) { return h.net; });
  var totalProfit = round2(profits.reduce(function (a, b) { return a + b; }, 0));
  var best = S.history.reduce(function (a, b) { return b.net > a.net ? b : a; }, S.history[0]);
  var items = S.history.reduce(function (a, h) { return a + h.sold.lemonade + h.sold.hotdog + (h.pre ? h.pre.got : 0); }, 0);
  var waste = round2(S.history.reduce(function (a, h) { return a + h.waste; }, 0));
  var spotsOwned = Object.keys(S.spots || {}).length;

  $('#finEmoji').textContent = won ? '🏆' : S.cash >= goal * 0.7 ? '🌟' : m.emoji;
  $('#finTitle').textContent = t(won ? 'fin.won' : S.cash >= goal * 0.7 ? 'fin.close' : 'fin.done');
  $('#finSub').innerHTML = t(won ? 'fin.wonSub' : 'fin.lostSub',
    { name: S.name, cash: money0(S.cash), goal: money0(goal), mode: m.emoji + ' ' + t('mode.' + m.id + '.name') });
  $('#finSeason').textContent = t('fin.season', { n: totalDays() });

  $('#finStats').innerHTML = [
    [t('fin.stat.cash'), money0(S.cash), won ? 'var(--good-ink)' : 'var(--ink)'],
    [t('fin.stat.profit'), money0(totalProfit), totalProfit >= 0 ? 'var(--good-ink)' : 'var(--bad)'],
    [t('fin.stat.items'), items.toLocaleString(), 'var(--ink)'],
    [t('fin.stat.best'), money0(best ? best.net : 0) +
      ' <small>' + t('fin.stat.bestDay', { d: best ? best.day : 1 }) + '</small>', 'var(--ink)'],
    [t('fin.stat.rep'), Math.round(S.rep) + ' / 100', 'var(--ink)'],
    [t('fin.stat.spots'), String(1 + spotsOwned), 'var(--ink)'],
    [t('fin.stat.waste'), money0(waste), waste > 30 ? 'var(--bad)' : 'var(--ink)']
  ].map(function (s) {
    return '<div class="fstat"><span>' + s[0] + '</span><b style="color:' + s[2] + '">' + s[1] + '</b></div>';
  }).join('');

  drawProfitChart($('#finChart'), S.history);

  var everyDayProfit = profits.every(function (v) { return v > 0; });
  var badges = [
    ['🎯', 'goal',   won],
    ['📈', 'green',  everyDayProfit],
    ['⭐', 'fav',    S.rep >= 85],
    ['💥', 'big',    profits.some(function (v) { return v >= 60; })],
    ['♻️', 'waste',  waste < 25],
    ['🏗️', 'empire', S.upgrades.length >= 3],
    ['🏪', 'chain',  spotsOwned >= 2],
    ['🧠', 'pricer',
      S.history.length && (totalProfit / Math.max(1, S.history.reduce(function (a, h) { return a + h.revenue; }, 0))) > 0.30]
  ];
  $('#finBadges').innerHTML = badges.map(function (b) {
    return '<div class="badge' + (b[2] ? ' got' : '') + '"><span class="badge-em">' + b[0] + '</span>' +
           '<div><b>' + t('badge.' + b[1] + '.name') + '</b>' +
           '<small>' + t('badge.' + b[1] + '.desc') + '</small></div></div>';
  }).join('');

  /* the sticker album: which adventures are done, one row per world */
  var prog = loadProgress();
  var wonCount = MODES.filter(function (x) { return prog[x.id] && prog[x.id].won; }).length;
  $('#finMap').innerHTML = '<div class="fin-map-k">' + t('fin.map', { n: wonCount, total: MODES.length }) + '</div>' +
    MODE_GROUPS.map(function (g) {
      return '<div class="fin-map-row"><span class="fin-map-world" title="' + t('group.' + g) + '">' + t('group.' + g + '.emoji') + '</span>' +
        MODES.filter(function (x) { return x.group === g; }).map(function (x) {
          var p = prog[x.id];
          return '<span class="fin-map-tile' + (p && p.won ? ' won' : p && p.plays ? ' tried' : '') + (x.id === S.mode ? ' here' : '') +
                 '" title="' + t('mode.' + x.id + '.name') + '">' + x.emoji + '</span>';
        }).join('') + '</div>';
    }).join('');
}

/* ───────────────────────────── boot ───────────────────────────── */

if (typeof document !== 'undefined' && document.getElementById('btnNextDay')) {
  $('#btnNextDay').addEventListener('click', nextDay);
  $('#btnReplay').addEventListener('click', newStand);
  $('#btnAgain').addEventListener('click', function () { restartSeason(); });
  applyStaticStrings();
  markLangButtons();
  initStart();
}

/* test hook: lets a headless script play seasons and check the balance */
if (typeof globalThis !== 'undefined') {
  globalThis.BOB = {
    MODES: MODES, DIFFS: DIFFS, CARDS: CARDS, SUPPLIES: SUPPLIES, UPGRADES: UPGRADES,
    newState: newState, goalFor: goalFor, runDay: runDay, applyResult: applyResult,
    autoOrderFor: autoOrderFor, demandFor: demandFor, fairPrice: fairPrice, capacity: capacity,
    orderCost: orderCost, unitCost: unitCost, cardEffects: cardEffects, zeroStock: zeroStock,
    getS: function () { return S; }, setS: function (s) { S = s; }
  };
}

})();
