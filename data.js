/* 我的第一家店：開店經營模擬 — 遊戲資料＋規則引擎（瀏覽器與 node 都能用）
   所有金額、利率、來客數都是「遊戲設定」，用來練習經營判斷，不是真實行情。 */
(function(root){
'use strict';

/* ---------- 亂數：同一個關卡代碼＝同樣的事件與起伏 ---------- */
function hash(s){ var h = 2166136261 >>> 0; s = String(s); for(var i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
function rng(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function R(G, salt){ return rng(hash(G.code + ':' + G.month + ':' + salt)); }
var CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode(rand){ rand = rand || Math.random; var s = ''; for(var i = 0; i < 6; i++) s += CODE_CHARS[Math.floor(rand() * CODE_CHARS.length)]; return s; }
function cleanCode(s){ return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8); }
function clamp(v, a, b){ return v < a ? a : v > b ? b : v; }
function r100(v){ return Math.round(v / 100) * 100; }

/* ---------- 工具（全部是 m255525.github.io 上的線上工具） ---------- */
var TOOLS = {
  'startup-island':            {n:'創業島', ic:'🏝', d:'44 個創業工具的總地圖，從這裡逛全部工具'},
  'business-idea-generator':   {n:'商業創意產生器', ic:'💡', lic:true, d:'用關鍵字組合出創業點子，再用五個構面評分'},
  'business-model-canvas-generator': {n:'商業模式圖產生器', ic:'🧩', d:'把你的店畫成九宮格商業模式圖'},
  'business-model-pattern-studio':   {n:'商業模式組合工作室', ic:'🧬', d:'從幾十種商業模式裡挑出適合你的組合'},
  'swot-game':                 {n:'SWOT 卡牌配對', ic:'🃏', d:'用卡牌練習分辨優勢、劣勢、機會、威脅'},
  'where-what-how-strategy-studio': {n:'商業策略工作室', ic:'🧭', d:'想清楚賣給誰、賣什麼、怎麼贏'},
  'new-product-strategy-studio':    {n:'新品開發策略工作室', ic:'🧪', lic:true, d:'新品五層次、SWOT、定價、競品比較'},
  'restaurant-feasibility-calculator': {n:'餐飲店經營評估試算', ic:'🍳', d:'坪效、人事、租金、損益兩平一次算清楚'},
  'restaurant-menu-mix-calculator':    {n:'餐飲菜單組合計算機', ic:'🧾', d:'每道菜的毛利、損益兩平與菜單工程矩陣'},
  'shop-opening-checklist':    {n:'開店前置清單', ic:'📋', d:'依店型排出登記、稅籍、勞健保、食安到開幕的倒數清單'},
  'loan-eligibility-checker':  {n:'創業貸款資格核對', ic:'✅', d:'對照鳳凰貸款與就業保險創業貸款的資格'},
  'phoenix-loan-generator':    {n:'鳳凰貸款申請書產生器', ic:'🐦', d:'填表產生微型創業鳳凰貸款申請書與計畫書'},
  'credit-5c-risk-diagnosis':  {n:'信用 5C 財務風險診斷', ic:'🏦', d:'用銀行的角度看你的店值不值得借錢'},
  'annual-marketing-calendar': {n:'全年度行銷行事曆', ic:'📅', d:'52 週檔期：節日、季節、在地活動'},
  'coffee-ig-planner':         {n:'社群內容規劃報告', ic:'📸', d:'品牌社群一個月的內容規劃'},
  'SocialPost':                {n:'社群貼文產生器', ic:'✍', d:'一鍵產生各平台的貼文文案'},
  'social-post-grader':        {n:'社群貼文健診站', ic:'🩺', d:'貼文發出前先打分數、找出可以改的地方'},
  'amazon-review-reply-generator': {n:'客評／客訴回覆信產生器', ic:'💬', lic:true, d:'原為亞馬遜設計，回覆負評的原則一樣適用'},
  'private-domain-rfm-studio': {n:'私域流量與 RFM 分析', ic:'👥', lic:true, d:'把老客人分群，找出該回訪的人'},
  'IPA_Kano':                  {n:'IPA × Kano 滿意度分析', ic:'📊', lic:true, d:'問卷分析出該先改善哪些地方'},
  'company-digital-transformation-analyzer': {n:'企業數位轉型分析', ic:'💻', d:'算導入系統能省多少人力、多久回本'},
  'employer-payroll-cost-calculator': {n:'雇主人事成本試算', ic:'🧮', d:'請一個人老闆實際要付多少：勞健保、職災、勞退一次算清'},
  'expense-tracker-pwa':       {n:'隨手記帳', ic:'🪙', d:'手機記收支，月底看得到錢去哪了'},
  'product-title-generator':   {n:'跨境商品標題產生器', ic:'🏷', lic:true, d:'網店商品標題的關鍵字結構'}
};
function toolUrl(id){ return 'https://m255525.github.io/' + id + '/'; }

/* ---------- 創業者身分（虛構人物） ---------- */
var PERSONAS = [
  {id:'mei',  n:'林小美', ic:'👩', age:32, desc:'32 歲女性，在連鎖餐飲做了 8 年店長', own:600000,  phoenix:true,  why:'女性未滿 45 歲'},
  {id:'chen', n:'陳大哥', ic:'👨‍🦳', age:52, desc:'52 歲男性，工廠退休想圓開店夢', own:1000000, phoenix:true,  why:'年滿 45～65 歲（不分性別）'},
  {id:'ming', n:'王阿明', ic:'🧑', age:28, desc:'28 歲男性，設籍台北的上班族', own:400000,  phoenix:false, why:'男性未滿 45 歲、也不是設籍離島'},
  {id:'qi',   n:'許小琪', ic:'👧', age:26, desc:'26 歲女性，設籍澎湖想回家鄉開店', own:350000,  phoenix:true,  why:'女性未滿 45 歲（也符合設籍離島 65 歲以下）'}
];

/* ---------- 店型（遊戲設定） ----------
   ticket 客單價、cogs 進貨成本率、base 巷弄標準定位的月來客、cap 每人每月能服務的客數、
   util 水電雜支、start 開辦費、goods 有沒有庫存（food＝賣不完報廢、keep＝留到下個月）、svc 勞務業（起徵點 5 萬） */
var TYPES = {
  brunch:{n:'早午餐店', ic:'🍳', ticket:170, cogs:.36, base:1300, cap:700,  util:12000, start:1200000, goods:'food', staff:1, svc:false, locs:['alley','street'],
    season:[1,.95,1,1,1,.95,.9,.9,1,1.05,1,1.05], unit:'位客人', ck:'food', desc:'客單價中等、來客穩，最吃人手與備料'},
  drink: {n:'手搖飲料店', ic:'🧋', ticket:65, cogs:.30, base:2600, cap:1800, util:9000, start:800000, goods:'food', staff:1, svc:false, locs:['alley','street','market'],
    season:[.75,.75,.9,1,1.15,1.3,1.4,1.4,1.2,1,.85,.8], unit:'杯', ck:'food', desc:'單價低靠杯數，夏天旺、冬天淡'},
  select:{n:'選物雜貨店', ic:'🎁', ticket:420, cogs:.55, base:450, cap:400,  util:6000, start:700000, goods:'keep', staff:0, svc:false, locs:['alley','street','market'],
    season:[1.1,1.15,.9,.9,1.05,.95,.9,.9,1,1,1.1,1.35], unit:'筆', ck:'retail', desc:'毛利薄、庫存壓資金，節日檔期很重要'},
  craft: {n:'手作飾品網店', ic:'💍', ticket:650, cogs:.35, base:95, cap:130,   util:2500, start:120000, goods:'keep', staff:0, svc:false, locs:['home','alley'],
    season:[1,1.2,.9,.9,1.15,.9,.85,.9,1,1,1.15,1.4], unit:'筆訂單', ck:'online', desc:'開辦便宜，但客人要靠社群一個一個找'},
  salon: {n:'美髮工作室', ic:'💇', ticket:700, cogs:.12, base:130, cap:130,  util:7000, start:600000, goods:null, staff:1, svc:true, locs:['alley','street','home'],
    season:[1.35,1.1,.9,.95,1,.95,1,.95,.95,1,1,1.2], unit:'位客人', ck:'beauty', desc:'毛利高，但一個人一天剪不了幾顆頭'}
};
var LOCS = {
  alley: {n:'巷弄店面', ic:'🏘', rent:30000, traffic:1,   start:1,    util:1,  ck:'rent', desc:'租金適中，靠熟客與口碑'},
  street:{n:'商圈大街', ic:'🏙', rent:70000, traffic:2,   start:1.35, util:1.2, ck:'rent', desc:'人潮多、租金貴，賭得大'},
  market:{n:'夜市攤位', ic:'🏮', rent:25000, traffic:1.15, start:.55,  util:.7, ck:'spot', desc:'開辦便宜、晚上才營業，風雨影響大'},
  home:  {n:'住家／網路', ic:'🏠', rent:0,    traffic:1,   start:.35,  util:.4, ck:'home', desc:'不用租金，客人要自己找上門'}
};
/* 個別店型在個別地點的人潮修正 */
var LOC_FIX = {'salon:home':.45, 'craft:alley':1.4};
var POS = {
  budget:  {n:'平價走量', ic:'🪙', ticket:.85, demand:1.32, sat:.64, cogs:-.03, desc:'便宜大碗，客人多、單價低、人手要夠'},
  standard:{n:'中價品質', ic:'⚖', ticket:1,   demand:1,    sat:.66, cogs:0,    desc:'不貴也不便宜，穩紮穩打'},
  premium: {n:'高價特色', ic:'💎', ticket:1.3, demand:.66,  sat:.70, cogs:.06,  desc:'做出特色賣好價，客人少但滿意度高'}
};
var MKT = {
  none:  {n:'不做行銷', ic:'😴', cost:0,     desc:'省錢，但沒人知道你'},
  social:{n:'經營社群', ic:'📱', cost:3000,  desc:'每月固定發文，粉絲慢慢累積（越久越有效）'},
  ads:   {n:'投放廣告', ic:'📣', cost:15000, desc:'這個月人潮明顯增加，停了就沒了'},
  member:{n:'會員集點', ic:'🎟', cost:6000,  desc:'留住老客人，口碑上升'}
};
var STOCK = {low:{n:'保守', k:.85}, mid:{n:'剛好', k:1}, high:{n:'多備', k:1.2}};
var WAGE = 33000;          // 遊戲設定的員工月薪
var EMP_LOAD = 1.2;        // 雇主另付的勞健保、勞退等（遊戲用約略倍數）
var MISC = 5000;
var LOANS = {
  none:   {n:'不借錢', ic:'🙅', rate:0,    max:0,       desc:'全部用自己的錢，沒有還款壓力'},
  phoenix:{n:'鳳凰貸款', ic:'🐦', rate:.015, max:2000000, desc:'政策性創業貸款，利率低；要身分符合，並在 3 年內上過 18 小時創業課程'},
  family: {n:'跟親友借', ic:'👪', rate:0,    max:500000,  desc:'不用利息，但人情壓力大，最多 50 萬'},
  credit: {n:'銀行信用貸款', ic:'💳', rate:.07, max:1500000, desc:'好申請但利率高'}
};
var TERM = 60;   // 貸款 5 年攤還（遊戲設定）
var START_MONTH = 4;   // 4 月開幕
var MONTHS = 12;

function pmt(amt, rate){ if(!amt) return 0; var r = rate / 12; return r ? Math.round(amt * r / (1 - Math.pow(1 + r, -TERM))) : Math.round(amt / TERM); }
function calMonth(G){ return ((START_MONTH - 1 + G.month) % 12) + 1; }   // 1～12
function startCost(c){ var t = TYPES[c.type], l = LOCS[c.loc]; return r100(t.start * l.start); }
function rentOf(G){ var c = G.c; return Math.round(LOCS[c.loc].rent * (c.type === 'craft' && c.loc === 'alley' ? .6 : 1) * (1 + G.p.rentAdd)); }
function utilOf(G){ return Math.round(TYPES[G.c.type].util * LOCS[G.c.loc].util); }
function payrollOf(G, staff){ return Math.round(staff * (WAGE + G.p.wageAdd) * EMP_LOAD); }
function threshold(type){ return TYPES[type].svc ? 50000 : 100000; }
function cogsRate(G){ return clamp(TYPES[G.c.type].cogs + POS[G.c.pos].cogs + G.p.cogsAdd - (G.p.pos ? .01 : 0), .05, .9); }
function ticketOf(G, price){ return Math.round(TYPES[G.c.type].ticket * POS[G.c.pos].ticket * (1 + .07 * (price || 0))); }
function capacity(G, staff){ return Math.round(TYPES[G.c.type].cap * (1 + .9 * staff) * (G.p.pos ? 1.15 : 1)); }

/* 損益兩平（籌備期試算題用：巷弄或所選地點、預設人手、標準售價、不做行銷、不含貸款） */
function breakEven(c){
  var G = {c:c, p:blankPersist()};
  var t = TYPES[c.type];
  var fixed = rentOf(G) + utilOf(G) + MISC + payrollOf(G, t.staff);
  var margin = 1 - cogsRate(G);
  return {fixed:fixed, margin:margin, rev:Math.round(fixed / margin / 1000) * 1000};
}
function blankPersist(){ return {rentAdd:0, cogsAdd:0, wageAdd:0, satAdd:0, demAdd:0, delivery:false, competitor:false, pos:false, foodReg:false, taxAware:false, taxNoticed:false, followers:0, emergency:false}; }

/* ---------- 新遊戲 ---------- */
function newGame(o){
  var per = PERSONAS.filter(function(p){ return p.id === o.persona; })[0] || PERSONAS[0];
  return {v:1, code:cleanCode(o.code) || newCode(), persona:per.id, name:String(o.name || '').slice(0, 20),
    stage:'prep', step:0, c:{type:null, loc:null, pos:null, loan:'none', loanAmt:0, course:false},
    quiz:{}, stars:0, cash:0, own:per.own, loan:null, month:0, rep:.5, inv:0, p:blankPersist(),
    hist:[], used:{}, ev:null, dec:null, last:null, over:null, created:Date.now()};
}
function persona(G){ return PERSONAS.filter(function(p){ return p.id === G.persona; })[0] || PERSONAS[0]; }
function phoenixOk(G){ return persona(G).phoenix && G.c.course; }
/* 開幕：付開辦費、撥貸款 */
function openShop(G){
  var c = G.c, cost = startCost(c), L = LOANS[c.loan];
  var amt = c.loan === 'none' ? 0 : clamp(Math.round(c.loanAmt / 10000) * 10000, 0, L.max);
  G.loan = amt ? {kind:c.loan, amt:amt, rate:L.rate, pmt:pmt(amt, L.rate), left:amt} : null;
  G.cash = G.own + amt - cost - (c.course ? 3000 : 0);
  G.p.foodReg = !!G.quiz.food; G.p.taxAware = !!G.quiz.tax;
  G.stage = 'month'; G.month = 0; G.ev = pickEvent(G); G.dec = defaultDec(G);
  return G;
}
function fundingGap(G){ var c = G.c; return G.own - startCost(c) - (c.course ? 3000 : 0); }

function defaultDec(G){
  var last = G.hist.length ? G.hist[G.hist.length - 1].dec : null;
  return last ? {price:last.price, stock:last.stock, staff:last.staff, mkt:last.mkt} : {price:0, stock:'mid', staff:TYPES[G.c.type].staff, mkt:'social'};
}

/* ---------- 需求 ---------- */
function demandBase(G, dec, evMul){
  var c = G.c, t = TYPES[c.type], l = LOCS[c.loc], p = G.p;
  var d = t.base * (LOC_FIX[c.type + ':' + c.loc] || l.traffic) * t.season[calMonth(G) - 1] * POS[c.pos].demand;
  d *= 1 - .1 * dec.price;
  d *= .6 + .8 * G.rep;
  var mk = 1 + Math.min(p.followers * .02, .2);
  if(dec.mkt === 'social') mk += .05;
  if(dec.mkt === 'ads') mk += .25;
  if(dec.mkt === 'member') mk += .05;
  d *= mk;
  if(p.competitor) d *= .85;
  if(p.delivery) d *= 1.25;
  d *= 1 + p.demAdd;
  d *= evMul || 1;
  return d;
}
function forecast(G, dec){ return Math.round(demandBase(G, dec, G.ev && G.ev.mul ? G.ev.mul.dem : 1)); }

/* ---------- 每月結算 ---------- */
function simulate(G, dec){
  var c = G.c, t = TYPES[c.type], p = G.p, ev = G.ev || {mul:{}}, m = ev.mul || {};
  G.dec = dec;
  var rand = R(G, 'noise');
  var noise = .88 + rand() * .24;
  var fc = forecast(G, dec);
  var demand = Math.round(demandBase(G, dec, m.dem || 1) * noise);
  var cap = capacity(G, dec.staff);
  var ticket = ticketOf(G, dec.price), cr = cogsRate(G), unitCost = ticket * cr;
  var stockUnits = Infinity, buy = 0, waste = 0;
  if(t.goods){
    var target = Math.round(fc * STOCK[dec.stock].k);
    if(t.goods === 'food'){ stockUnits = target; buy = target * unitCost; }
    else { var need = Math.max(0, target - G.inv); stockUnits = G.inv + need; buy = need * unitCost; }
  }
  var served = Math.max(0, Math.min(demand, cap, stockUnits));
  var lostCap = Math.max(0, Math.min(demand, stockUnits) - cap);
  var lostStock = Math.max(0, Math.min(demand, cap) - stockUnits);
  if(t.goods === 'food') waste = Math.max(0, stockUnits - served) * unitCost;
  if(t.goods === 'keep') G.inv = Math.max(0, stockUnits - served);
  var revenue = served * ticket;
  var platformFee = p.delivery ? Math.round(revenue * (.25 / 1.25) * .3) : 0;   // 外送那一份抽成 30%（遊戲設定）
  var cogs = t.goods ? Math.round(buy) : Math.round(revenue * cr);
  var rent = rentOf(G), util = utilOf(G), payroll = payrollOf(G, dec.staff), mkt = MKT[dec.mkt].cost;
  var tax = revenue >= threshold(c.type) ? Math.round(revenue * .01) : 0;   // 遊戲簡化：小規模營業人查定課徵 1%
  var loanPay = G.loan && G.loan.left > 0 ? Math.min(G.loan.pmt, Math.round(G.loan.left * (1 + G.loan.rate / 12))) : 0;
  var interest = G.loan ? Math.round(G.loan.left * G.loan.rate / 12) : 0;
  var oneOff = m.cash || 0;
  var costs = cogs + rent + util + MISC + payroll + mkt + tax + platformFee + loanPay - oneOff;
  var net = revenue - costs;
  var profit = revenue - (cogs + rent + util + MISC + payroll + mkt + tax + platformFee + interest - oneOff);   // 損益（還本金不算費用）
  if(G.loan && loanPay){ G.loan.left = Math.max(0, G.loan.left - (loanPay - interest)); }
  G.cash += net;
  // 滿意度與口碑
  var sat = POS[c.pos].sat + p.satAdd - .04 * dec.price + (m.sat || 0);
  if(demand > 0){ sat -= .45 * lostCap / demand; sat -= .3 * lostStock / demand; }
  if(dec.staff === 0 && t.staff > 0) sat -= .03;
  sat = clamp(sat, 0, 1);
  var dRep = .2 * (sat - .65) + (dec.mkt === 'member' ? .02 : 0) + (dec.mkt === 'social' ? .005 : 0) + (m.rep || 0);
  G.rep = clamp(G.rep + dRep, 0, 1);
  if(dec.mkt === 'social') p.followers += 1; else p.followers = Math.max(0, p.followers - .5);
  var res = {month:G.month, cal:calMonth(G), dec:dec, ev:ev.id ? {id:ev.id, ch:ev.ch} : null, forecast:fc, demand:demand, cap:cap, served:served,
    lostCap:lostCap, lostStock:lostStock, ticket:ticket, revenue:revenue, cogs:cogs, waste:Math.round(waste), rent:rent, util:util, misc:MISC,
    payroll:payroll, mkt:mkt, tax:tax, fee:platformFee, loanPay:loanPay, interest:interest, oneOff:oneOff, net:net, profit:profit,
    cash:G.cash, sat:sat, rep:G.rep, dRep:dRep, inv:G.inv};
  res.tips = tips(G, res);
  G.hist.push(res); G.last = res;
  if(G.cash < 0){
    if(!p.emergency){ G.stage = 'crisis'; }
    else { G.stage = 'end'; G.over = 'bankrupt'; }
  } else advance(G);
  return res;
}
function advance(G){
  G.month += 1;
  if(G.month >= MONTHS){ G.stage = 'end'; G.over = 'done'; G.ev = null; return; }
  G.stage = 'month'; G.ev = pickEvent(G); G.dec = defaultDec(G);
}
/* 現金見底：一次緊急周轉 */
function rescue(G, take){
  G.p.emergency = true;
  if(take){
    var amt = Math.max(200000, Math.ceil(-G.cash / 10000) * 10000 + 100000);
    var rate = .08;
    if(G.loan){ G.loan.left += amt; G.loan.amt += amt; G.loan.rate = Math.max(G.loan.rate, rate); G.loan.pmt = pmt(G.loan.left, G.loan.rate); }
    else G.loan = {kind:'credit', amt:amt, rate:rate, pmt:pmt(amt, rate), left:amt};
    G.cash += amt; G.rescueAmt = amt; advance(G);
  } else { G.stage = 'end'; G.over = 'closed'; }
}

/* ---------- 經營教練（規則式） ---------- */
function tips(G, r){
  var t = TYPES[G.c.type], out = [];
  var be = r.revenue ? (r.revenue - r.profit) : 0;
  if(r.lostCap > r.demand * .08) out.push({k:'cap', t:'人手不夠：有 ' + r.lostCap + ' ' + t.unit + '等不到就走了。下個月考慮多請一位，或用系統加快出餐。', tool:'restaurant-feasibility-calculator'});
  if(r.lostStock > r.demand * .06) out.push({k:'stock', t:'備貨不夠：賣完了還有 ' + r.lostStock + ' ' + t.unit + '想買。把備貨調成「剛好」或「多備」。', tool:t.goods === 'food' ? 'restaurant-menu-mix-calculator' : 'expense-tracker-pwa'});
  if(r.waste > r.revenue * .06) out.push({k:'waste', t:'報廢太多：丟掉了 ' + money(r.waste) + ' 元的食材。備貨調保守一點。', tool:'restaurant-menu-mix-calculator'});
  if(t.goods === 'keep' && r.inv * r.ticket * cogsRate(G) > Math.max(r.revenue * .8, 30000)) out.push({k:'inv', t:'庫存壓了約 ' + money(Math.round(r.inv * r.ticket * cogsRate(G))) + ' 元的錢在架上，先別多備。', tool:'expense-tracker-pwa'});
  if(r.dec.staff > 0 && r.served < capacity(G, r.dec.staff - 1) * .85) out.push({k:'idle', t:'人手偏多：少一個人也接得住這些客人，可以省下約 ' + money(Math.round((WAGE + G.p.wageAdd) * EMP_LOAD)) + ' 元。', tool:'employer-payroll-cost-calculator'});
  if(r.sat < .55) out.push({k:'sat', t:'客人不太滿意（' + pct(r.sat) + '），口碑會往下掉。檢查價格、等候與品質。', tool:'IPA_Kano'});
  if(r.profit < 0 && r.served < r.cap * .7 && r.dec.mkt === 'none') out.push({k:'mkt', t:'店裡有空位卻沒客人：開始經營社群，粉絲是越早累積越有效。', tool:'SocialPost'});
  if(r.profit < 0 && be > 0) out.push({k:'be', t:'這個月虧損 ' + money(-r.profit) + ' 元。總開銷 ' + money(be) + ' 元，要賣到這個數字才打平。', tool:'restaurant-feasibility-calculator'});
  var burn = r.net < 0 ? Math.floor(G.cash / -r.net) : 99;
  if(burn < 3) out.push({k:'cash', t:'照這個月的速度，現金只撐得了約 ' + Math.max(burn, 0) + ' 個月。先砍開銷，必要時找銀行談周轉。', tool:'credit-5c-risk-diagnosis'});
  if(!out.length) out.push({k:'good', t: r.profit > 0 ? '這個月有賺錢（' + money(r.profit) + ' 元）！記得老闆自己還沒領薪水，賺的錢先留一部分當周轉金。' : '打平邊緣，繼續觀察來客與成本。', tool:'expense-tracker-pwa'});
  return out.slice(0, 3);
}

/* ---------- 隨機事件 ----------
   每個事件：cond(G) 能不能出現、w 權重、once 只出一次、ch 選項 {t, r 結果說明, e 效果}
   效果 e：dem 這個月人潮倍數、cash 一次性收支、rep 口碑、sat 這個月滿意度、rentAdd/cogsAdd/wageAdd/satAdd/demAdd 長期、
           delivery/competitor/pos/foodReg/taxAware 開關、loanAdd 增貸 */
function isFood(G){ return TYPES[G.c.type].goods === 'food'; }
function hasStore(G){ return G.c.loc !== 'home'; }
var EVENTS = [
  {id:'opening', ic:'🎉', title:'開幕了！', w:0, tool:'annual-marketing-calendar',
    text:function(G){ return (G.name || '你的店') + '今天正式開門。要不要辦個開幕活動，讓街坊鄰居先認識你？'; },
    ch:[{t:'辦開幕優惠＋試吃', r:'花了 1 萬元，第一個月人潮多兩成，大家都知道開了新店。', e:{cash:-10000, dem:1.2, rep:.03}},
        {t:'在社群上宣布就好', r:'沒花錢，來的大多是朋友和路過的人。', e:{dem:1.05}},
        {t:'低調開門，慢慢來', r:'省下了錢，但頭一個月有點冷清。', e:{dem:.9}}]},
  {id:'typhoon', ic:'🌀', title:'颱風來了', w:3, months:[7,8,9], cond:hasStore, tool:'expense-tracker-pwa',
    text:function(){ return '氣象署發布陸上颱風警報，明後天風雨最大。'; },
    ch:[{t:'停業一天、先把門窗固定好', r:'少做一天生意，但人和店都平安，客人覺得你很負責。', e:{dem:.93, rep:.01}},
        {t:'照常營業', r:'沒什麼客人，招牌被吹歪修了 6000 元，員工冒雨上班也有怨言。', e:{dem:.96, cash:-6000, sat:-.04}}]},
  {id:'plum', ic:'🌧', title:'梅雨季，天天下雨', w:2, months:[5,6], cond:function(G){ return G.c.loc === 'market' || G.c.type === 'drink' || G.c.type === 'brunch'; }, tool:'annual-marketing-calendar',
    text:function(){ return '連續下了兩個禮拜的雨，路上行人少了很多。'; },
    ch:[{t:'推「雨天外帶折 10 元」', r:'花了約 3000 元的折扣，人潮回來一些。', e:{dem:.97, cash:-3000}},
        {t:'等雨停', r:'這個月人潮少了一成。', e:{dem:.9}}]},
  {id:'influencer', ic:'🤳', title:'網紅想來拍片', w:2, once:true, tool:'SocialPost',
    text:function(){ return '一位有 5 萬粉絲的美食／生活網紅私訊你，說想來拍，但希望「免費招待」。'; },
    ch:[{t:'招待，但請他照實評價', r:'花了 3000 元，影片很真實，帶來一波新客人。', e:{cash:-3000, dem:1.15, rep:.04}},
        {t:'付 2 萬元做業配', r:'影片很漂亮，這個月人潮多了三成，但有人留言「業配文」。', e:{cash:-20000, dem:1.3, rep:.01}},
        {t:'婉拒', r:'什麼都沒發生。', e:{}}]},
  {id:'badreview', ic:'⭐', title:'Google 出現一星負評', w:3, once:true, tool:'amazon-review-reply-generator',
    text:function(){ return '有客人留了一星：「等了 25 分鐘，店員態度很差。」底下已經有人按讚。'; },
    ch:[{t:'公開誠懇回覆，說明怎麼改善', r:'其他客人看到回覆，覺得老闆有在用心，口碑反而加分。', e:{rep:.01}},
        {t:'不理它', r:'負評掛在最上面，新客人看了猶豫。', e:{rep:-.04, dem:.97}},
        {t:'回嘴：「那天很忙你不會等一下嗎」', r:'截圖被轉到地方社團，罵聲一片。', e:{rep:-.1, dem:.88}}]},
  {id:'costup', ic:'📈', title:'原物料漲價了', w:3, once:true, tool:function(G){ return isFood(G) ? 'restaurant-menu-mix-calculator' : 'new-product-strategy-studio'; },
    text:function(){ return '供應商通知：下個月起進貨價全面調漲約一成。'; },
    ch:[{t:'自己吸收，售價不動', r:'客人沒感覺，但每一筆的毛利都變薄了。（之後也可以自己調售價）', e:{cogsAdd:.04}},
        {t:'換一家比較便宜的供應商', r:'成本守住了，但品質有落差，客人感覺得出來。', e:{satAdd:-.04}},
        {t:'調整品項，把低毛利的拿掉', r:'花 5000 元重做菜單／價目，成本只上升一點點。', e:{cash:-5000, cogsAdd:.01}}]},
  {id:'rentup', ic:'🏠', title:'房東要漲租', w:2, once:true, minMonth:5, cond:function(G){ return LOCS[G.c.loc].rent > 0; }, tool:'restaurant-feasibility-calculator',
    text:function(G){ return '房東說附近行情漲了，下個月起租金要從 ' + money(rentOf(G)) + ' 元漲 15%。'; },
    ch:[{t:'接受', r:'租金漲 15%。', e:{rentAdd:.15}},
        {t:'簽三年長約，換只漲 5%', r:'房東同意了，租金漲 5%。', e:{rentAdd:.05}},
        {t:'硬談不漲', r:'談了三次，房東還是漲了 10%，關係也有點僵。', e:{rentAdd:.1}}]},
  {id:'staffquit', ic:'🙋', title:'員工想加薪', w:3, once:true, cond:function(G){ var l = G.hist[G.hist.length - 1]; return !!l && l.dec.staff > 0; }, tool:'employer-payroll-cost-calculator',
    text:function(){ return '做最久的那位員工說：「別家多給 3000，老闆你能不能也調一下？不然我月底可能就走了。」'; },
    ch:[{t:'加薪 3000 留人', r:'每位員工月薪 +3000（雇主另付的保費也跟著漲）。', e:{wageAdd:3000, sat:.02}},
        {t:'讓他走，再找新人', r:'招募花了 5000 元，新人手腳慢，這個月客人等比較久。', e:{cash:-5000, sat:-.06}}]},
  {id:'inspect', ic:'🔍', title:'衛生局來稽查', w:3, once:true, cond:isFood, tool:'shop-opening-checklist',
    text:function(G){ return G.p.foodReg ? '衛生局人員來店抽查。你開店前就辦好了食品業者登錄，資料都在。' : '衛生局人員來店抽查，問你有沒有辦「食品業者登錄」……你開店前好像沒注意到這件事。'; },
    ch:[{t:'配合稽查', r:'', e:{}}]},
  {id:'tax', ic:'🧾', title:'國稅局寄信來了', w:0, once:true, tool:'shop-opening-checklist',
    text:function(G){ return '上個月營業額超過了 ' + (TYPES[G.c.type].svc ? '5' : '10') + ' 萬元（營業稅起徵點）。國稅局通知你要開始繳營業稅。' + (G.p.taxAware ? '你開店前就知道這件事，早有準備。' : '你完全沒想到這筆錢……'); },
    ch:[{t:'找記帳士處理', r:'記帳士幫你把帳理清楚，一次花了 6000 元。', e:{cash:-6000, taxAware:true}},
        {t:'自己上網研究', r:'省了錢，但花了好幾個晚上，白天做生意沒精神。', e:{dem:.97, taxAware:true}}]},
  {id:'festival', ic:'🎊', title:'節日檔期快到了', w:4, months:[2,5,9,12], tool:'annual-marketing-calendar',
    text:function(G){ return ({2:'情人節', 5:'母親節', 9:'中秋節', 12:'聖誕節'})[calMonth(G)] + '快到了，街上的店都在準備檔期活動。'; },
    ch:[{t:'推檔期限定組合', r:'準備物料與佈置花了 8000 元，這個月人潮多兩成。', e:{cash:-8000, dem:1.2}},
        {t:'跟平常一樣', r:'客人被別家的活動吸走了一些。', e:{dem:.97}}]},
  {id:'delivery', ic:'🛵', title:'外送平台來邀約', w:3, once:true, cond:function(G){ return isFood(G) && !G.p.delivery; }, tool:'restaurant-menu-mix-calculator',
    text:function(){ return '外送平台業務說：「上架之後訂單可以多兩成五！」但每一筆外送訂單平台要抽 30%（遊戲設定）。'; },
    ch:[{t:'上架外送', r:'之後每個月訂單多 25%，但外送那一份被抽 30%。毛利夠的品項才划算。', e:{delivery:true}},
        {t:'先不要', r:'專心做店裡的客人。', e:{}}]},
  {id:'rival', ic:'🥊', title:'對面開了同類型的新店', w:3, once:true, minMonth:3, cond:hasStore, tool:'swot-game',
    text:function(){ return '對面開了一家跟你很像的店，開幕全品項打八折。'; },
    ch:[{t:'做出差異化（新招牌品項、包裝）', r:'花了 1.5 萬元，客人知道你們不一樣，影響很小。', e:{cash:-15000, rep:.02}},
        {t:'跟著降價', r:'這個月守住了人潮，但大家都變得更便宜，之後每筆毛利變薄。', e:{competitor:true, cogsAdd:.03, dem:1.12}},
        {t:'不理它', r:'之後每個月客人少了 15%。', e:{competitor:true}}]},
  {id:'regulars', ic:'👋', title:'老客人好像變少了', w:2, once:true, minMonth:4, tool:'private-domain-rfm-studio',
    text:function(){ return '翻了一下集點卡，幾個常客已經一個多月沒出現。'; },
    ch:[{t:'把會員分群，傳訊息邀他們回來', r:'花 4000 元送回訪券，好幾位常客回來了。', e:{cash:-4000, rep:.03, dem:1.05}},
        {t:'新客人比較重要', r:'常客默默流失。', e:{rep:-.03}}]},
  {id:'survey', ic:'📝', title:'客人意見很多', w:2, once:true, tool:'IPA_Kano',
    text:function(){ return '意見箱滿了：有人說座位太擠、有人說口味偏淡、有人說結帳太慢。'; },
    ch:[{t:'做滿意度問卷，找出最該先改的', r:'花 1000 元做問卷分析，先改最重要的兩項，之後客人滿意度提升。', e:{cash:-1000, satAdd:.03}},
        {t:'全部都改', r:'花了 2 萬元，有的改到重點、有的白花。', e:{cash:-20000, satAdd:.02}},
        {t:'看看就好', r:'沒有改變。', e:{}}]},
  {id:'digital', ic:'💻', title:'要不要導入 POS／線上點餐？', w:2, once:true, minMonth:2, cond:function(G){ return G.c.type !== 'craft'; }, tool:'company-digital-transformation-analyzer',
    text:function(){ return '系統廠商來推銷：一次 3 萬元，點餐結帳更快、報表自動出、備料更準。'; },
    ch:[{t:'導入', r:'花了 3 萬元。之後同樣人手可以多接 15% 的客人，成本率也降一點。', e:{cash:-30000, pos:true}},
        {t:'先不要', r:'繼續用紙本和收銀機。', e:{}}]},
  {id:'viral', ic:'🔥', title:'一篇貼文意外爆紅', w:2, once:true, cond:function(G){ return G.p.followers >= 2; }, tool:'social-post-grader',
    text:function(){ return '你上週隨手拍的一篇貼文被轉發了上千次！'; },
    ch:[{t:'加碼投廣告、趁勢推出限定品', r:'花 5000 元，這個月人潮多三成。', e:{cash:-5000, dem:1.3, rep:.02}},
        {t:'順其自然', r:'這個月人潮多一成。', e:{dem:1.1, rep:.01}}]},
  {id:'bank', ic:'🏦', title:'銀行打電話來', w:2, once:true, minMonth:5, tool:'credit-5c-risk-diagnosis',
    text:function(G){ return '銀行理專說：「看你們生意不錯，要不要再借 20 萬當周轉金？」（年利率 4%，遊戲設定）。目前現金 ' + money(G.cash) + ' 元。'; },
    ch:[{t:'借 20 萬', r:'現金多了 20 萬，每月還款也增加了。', e:{loanAdd:200000}},
        {t:'不用，謝謝', r:'維持現狀。', e:{}}]},
  {id:'newitem', ic:'🧁', title:'客人敲碗新品', w:2, once:true, tool:'new-product-strategy-studio',
    text:function(){ return '好幾位客人問：「你們會不會出 ○○？」'; },
    ch:[{t:'花 1 萬元開發新品', r:'新品成為話題，之後每個月人潮多 5%。', e:{cash:-10000, demAdd:.05, rep:.01}},
        {t:'先把現有的做好', r:'專注本業。', e:{}}]},
  {id:'online', ic:'🛒', title:'要不要上電商平台？', w:3, once:true, cond:function(G){ return G.c.type === 'craft' || G.c.type === 'select'; }, tool:'product-title-generator',
    text:function(){ return '朋友建議你把商品也上到購物平台，平台抽成約 1 成（遊戲設定）。'; },
    ch:[{t:'上架，好好寫商品標題', r:'花了幾個晚上整理商品頁，之後每個月訂單多一成。', e:{demAdd:.1, cogsAdd:.02}},
        {t:'先不要', r:'專心經營自己的通路。', e:{}}]},
  {id:'quiet', ic:'☕', title:'平靜的一個月', w:3, tool:'business-model-canvas-generator',
    text:function(){ return '這個月沒什麼特別的事。正好可以靜下來，想想店的下一步。'; },
    ch:[{t:'好好經營', r:'', e:{}}]}
];
var EV = {}; EVENTS.forEach(function(e){ EV[e.id] = e; });
function evText(G, e){ return typeof e.text === 'function' ? e.text(G) : e.text; }
function evTool(G, e){ return typeof e.tool === 'function' ? e.tool(G) : e.tool; }

function pickEvent(G){
  if(G.month === 0) return {id:'opening', ch:null, mul:{}};
  var last = G.hist[G.hist.length - 1];
  if(last && !G.p.taxNoticed && last.revenue >= threshold(G.c.type)){ G.p.taxNoticed = true; return {id:'tax', ch:null, mul:{}}; }
  var seen = {}; G.hist.forEach(function(h){ if(h.ev) seen[h.ev.id] = 1; });
  var m = calMonth(G), pool = [], tot = 0;
  EVENTS.forEach(function(e){
    if(!e.w) return;
    if(e.once && seen[e.id]) return;
    if(e.months && e.months.indexOf(m) < 0) return;
    if(e.minMonth && G.month < e.minMonth) return;
    if(e.cond && !e.cond(G)) return;
    if(last && last.ev && last.ev.id === e.id) return;
    pool.push(e); tot += e.w;
  });
  if(!pool.length) return {id:'quiet', ch:null, mul:{}};
  var r = R(G, 'event')() * tot, pick = pool[pool.length - 1];
  for(var i = 0; i < pool.length; i++){ r -= pool[i].w; if(r < 0){ pick = pool[i]; break; } }
  return {id:pick.id, ch:null, mul:{}};
}
/* 選擇事件選項：一次性效果記在 ev.mul（這個月結算時套用），長期效果直接寫進 G.p */
function chooseEvent(G, i){
  var e = EV[G.ev.id], c = e.ch[i] || e.ch[0], x = c.e || {}, mul = {dem:x.dem || 1, cash:x.cash || 0, rep:x.rep || 0, sat:x.sat || 0};
  var note = c.r;
  if(e.id === 'inspect'){
    if(G.p.foodReg){ mul.rep = .02; note = '稽查順利通過，稽查員還稱讚你資料齊全。'; }
    else { mul.cash = -6000; mul.sat = -.03; G.p.foodReg = true; note = '被要求限期補辦食品業者登錄，跑程序、找代辦花了 6000 元，還被客人看到。'; }
  }
  if(e.id === 'tax' && G.p.taxAware && i === 1){ mul.dem = 1; note = '你開店前就研究過，很快就搞定，沒有影響生意。'; }
  ['rentAdd', 'cogsAdd', 'wageAdd', 'satAdd', 'demAdd'].forEach(function(k){ if(x[k]) G.p[k] += x[k]; });
  ['delivery', 'competitor', 'pos', 'foodReg', 'taxAware'].forEach(function(k){ if(x[k]) G.p[k] = true; });
  if(x.loanAdd){
    var amt = x.loanAdd, rate = .04;
    if(G.loan){ var left = G.loan.left + amt; G.loan.rate = (G.loan.rate * G.loan.left + rate * amt) / left; G.loan.left = left; G.loan.amt += amt; G.loan.pmt = pmt(left, G.loan.rate); }
    else G.loan = {kind:'credit', amt:amt, rate:rate, pmt:pmt(amt, rate), left:amt};
    G.cash += amt;
  }
  G.ev = {id:e.id, ch:i, mul:mul, note:note};
  return G.ev;
}

/* ---------- 結算 ---------- */
function invValue(G){ return TYPES[G.c.type].goods === 'keep' ? Math.round(G.inv * ticketOf(G, 0) * cogsRate(G)) : 0; }
function finalScore(G){
  var equity = G.cash + invValue(G) - (G.loan ? G.loan.left : 0);
  var months = G.hist.length, prof = G.hist.filter(function(h){ return h.profit > 0; }).length;
  var totalProfit = G.hist.reduce(function(s, h){ return s + h.profit; }, 0);
  var totalRev = G.hist.reduce(function(s, h){ return s + h.revenue; }, 0);
  var avg = months ? totalProfit / months : 0;
  var payback = totalProfit / startCost(G.c);   // 開辦費回本進度
  var done = G.over === 'done';
  var grade = !done ? 'D' : avg >= 60000 && G.rep >= .6 ? 'S' : avg >= WAGE ? 'A' : avg >= 0 ? 'B' : avg >= -30000 ? 'C' : 'D';
  var score = Math.round(Math.max(0, 500 + totalProfit / 1000 + G.rep * 300 + G.stars * 40 + prof * 15 - (done ? 0 : 300) - (G.rescueAmt ? 100 : 0)));
  return {equity:equity, months:months, prof:prof, totalProfit:totalProfit, totalRev:totalRev, avg:Math.round(avg), payback:payback, score:score, grade:grade, rep:G.rep};
}
var GRADE_TXT = {
  S:'經營之神！平均每月賺超過 6 萬、口碑又好，可以開始想第二家店了。',
  A:'老闆賺到了一份薪水（平均每月超過 3.3 萬），第一年就站穩腳步。',
  B:'有賺錢，但還不到一份薪水。很多店第一年都是這樣，關鍵在第二年。',
  C:'平均每月小虧，等於拿存款在養店。虧了不少，但你學到的比賠掉的多。看看哪幾個月出問題。',
  D:'店沒能撐下去。回頭看看籌備期的選擇和每月教練的提醒，再挑戰一次。'
};

/* ---------- 籌備期題目 ---------- */
function prepQuiz(G){
  var t = TYPES[G.c.type], food = t.goods === 'food';
  var qs = [];
  qs.push({id:'tax', q:'營業稅「起徵點」：' + t.n + '每月營業額大約多少以下，可以先不用繳營業稅？',
    opts:t.svc ? ['5 萬元', '10 萬元', '20 萬元'] : ['10 萬元', '5 萬元', '20 萬元'], a:0,
    exp:'2025 年起，賣東西的店（銷售貨物業）起徵點是每月 10 萬元，提供服務的店（勞務業）是 5 萬元。未達起徵點也要辦稅籍登記。20 萬元是「免用統一發票」的門檻，不一樣喔。', src:'財政部'});
  if(food) qs.push({id:'food', q:'開一家賣吃喝的店，開幕前一定要在衛福部系統完成哪一項？',
    opts:['食品業者登錄', '商標註冊', '著作權登記'], a:0, exp:'食品安全衛生管理法第 8 條：食品業者要先完成「食品業者登錄」才能營業。', src:'食品安全衛生管理法'});
  else qs.push({id:'food', q:'請了 1 位員工，下面哪一項是一定要幫他投保的？',
    opts:['就業保險與職災保險', '只要勞保', '員工不到 5 人什麼都不用保'], a:0, exp:'僱用 1 人以上就要投保就業保險與職災保險；勞保則是 5 人以上強制、未滿 5 人可自願。', src:'就業保險法、勞工職業災害保險及保護法'});
  qs.push({id:'li', q:'勞工保險：僱用幾人以上，就是「強制」投保單位？', opts:['5 人', '1 人', '10 人'], a:0,
    exp:'勞工保險條例：僱用 5 人以上強制投保；未滿 5 人可自願加保，一旦加入就要幫全部員工保。', src:'勞工保險條例'});
  return qs;
}
function breakEvenQuiz(G){
  var b = breakEven(G.c);
  var right = b.rev, w1 = Math.round(b.fixed / 1000) * 1000, w2 = Math.round(b.fixed / cogsRate({c:G.c, p:blankPersist()}) / 1000) * 1000;
  if(w2 === right || w2 === w1) w2 = Math.round(right * 1.4 / 1000) * 1000;
  var opts = [right, w1, w2], order = [0, 1, 2], r = rng(hash(G.code + ':be'));
  for(var i = 2; i > 0; i--){ var j = Math.floor(r() * (i + 1)); var tmp = order[i]; order[i] = order[j]; order[j] = tmp; }
  return {b:b, opts:order.map(function(k){ return opts[k]; }), a:order.indexOf(0)};
}

/* ---------- 帶到真實工具 ---------- */
var ORG_FOR = {brunch:'ltd', drink:'sole', select:'sole', craft:'small', salon:'sole'};
function checklistCtx(G){
  var c = G.c, t = TYPES[c.type], last = G.hist[G.hist.length - 1], staff = last ? last.dec.staff : t.staff;
  var avg = G.hist.length ? G.hist.reduce(function(s, h){ return s + h.revenue; }, 0) / G.hist.length : breakEven(c).rev;
  return {name:G.name || (persona(G).n + '的' + t.n), type:t.ck, org:ORG_FOR[c.type], sales:Math.round(avg / 1000) / 10,
    staff:staff <= 0 ? '0' : staff < 5 ? '1-4' : '5-29', place:LOCS[c.loc].ck === 'home' ? (c.type === 'craft' ? 'home' : 'home') : LOCS[c.loc].ck,
    reno:c.loc !== 'home' && c.loc !== 'market', sign:c.loc !== 'home', music:c.type !== 'craft', member:true, delivery:!!G.p.delivery && isFood(G), food:false};
}
function b64u(s){
  var b = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(s))) : Buffer.from(s, 'utf8').toString('base64');
  return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function checklistUrl(G){ return toolUrl('shop-opening-checklist') + '#s=' + b64u(JSON.stringify(checklistCtx(G))); }

function money(n){ n = Math.round(n || 0); return (n < 0 ? '-' : '') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function pct(v){ return Math.round(v * 100) + '%'; }

var API = {hash:hash, rng:rng, newCode:newCode, cleanCode:cleanCode, clamp:clamp, money:money, pct:pct,
  TOOLS:TOOLS, toolUrl:toolUrl, PERSONAS:PERSONAS, TYPES:TYPES, LOCS:LOCS, POS:POS, MKT:MKT, STOCK:STOCK, LOANS:LOANS, EVENTS:EVENTS, EV:EV,
  WAGE:WAGE, EMP_LOAD:EMP_LOAD, MISC:MISC, START_MONTH:START_MONTH, MONTHS:MONTHS, TERM:TERM, GRADE_TXT:GRADE_TXT,
  newGame:newGame, persona:persona, phoenixOk:phoenixOk, openShop:openShop, fundingGap:fundingGap, startCost:startCost, pmt:pmt,
  calMonth:calMonth, rentOf:rentOf, utilOf:utilOf, payrollOf:payrollOf, threshold:threshold, cogsRate:cogsRate, ticketOf:ticketOf, capacity:capacity,
  breakEven:breakEven, forecast:forecast, simulate:simulate, rescue:rescue, defaultDec:defaultDec, pickEvent:pickEvent, chooseEvent:chooseEvent,
  evText:evText, evTool:evTool, invValue:invValue, finalScore:finalScore, prepQuiz:prepQuiz, breakEvenQuiz:breakEvenQuiz,
  checklistCtx:checklistCtx, checklistUrl:checklistUrl, b64u:b64u};
if(typeof module === 'object' && module.exports) module.exports = API; else root.SIM = API;
})(this);
