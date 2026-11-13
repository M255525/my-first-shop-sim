// 引擎回歸測試：node tools/test_engine.mjs
import { createRequire } from 'module';
const S = createRequire(import.meta.url)('../data.js');
let fail = 0, games = 0, crises = 0, grades = {};
const ok = (c, m) => { if(!c){ fail++; if(fail < 15) console.log('FAIL', m); } };
const R = S.rng(12345), pick = a => a[Math.floor(R() * a.length)];
for(let i = 0; i < 3000; i++){
  const G = S.newGame({code:'T' + i, persona:pick(S.PERSONAS).id});
  const type = pick(Object.keys(S.TYPES)), loc = pick(S.TYPES[type].locs);
  Object.assign(G.c, {type, loc, pos:pick(Object.keys(S.POS)), course:R() < .7});
  const loan = pick(Object.keys(S.LOANS).filter(k => k !== 'phoenix' || S.phoenixOk(G)));
  G.c.loan = loan; G.c.loanAmt = loan === 'none' ? 0 : Math.min(S.LOANS[loan].max, Math.max(0, -S.fundingGap(G) + 300000));
  if(G.own + G.c.loanAmt - S.startCost(G.c) - (G.c.course ? 3000 : 0) < 0){ G.c.loan = 'credit'; G.c.loanAmt = 1500000; }
  G.quiz = {tax:R() < .5, food:R() < .5};
  S.openShop(G); games++;
  ok(G.stage === 'month' && G.ev.id === 'opening', 'opening event');
  let guard = 0;
  while(G.stage !== 'end' && guard++ < 40){
    if(G.stage === 'crisis'){ crises++; S.rescue(G, R() < .7); continue; }
    const e = S.EV[G.ev.id];
    ok(!!e, 'event exists ' + G.ev.id);
    if(e.cond) ok(e.cond(G) || e.id === 'tax', 'cond holds ' + e.id);
    ok(typeof S.evText(G, e) === 'string' && S.evText(G, e).length > 5, 'text ' + e.id);
    if(S.evTool(G, e)) ok(!!S.TOOLS[S.evTool(G, e)], 'tool exists ' + S.evTool(G, e));
    S.chooseEvent(G, Math.floor(R() * e.ch.length));
    const d = {price:pick([-2,-1,0,1,2]), stock:pick(['low','mid','high']), staff:Math.floor(R() * 5), mkt:pick(Object.keys(S.MKT))};
    const r = S.simulate(G, d);
    for(const k of ['revenue','cogs','profit','net','cash','sat','rep','served','demand']) ok(Number.isFinite(r[k]), 'finite ' + k);
    ok(r.served <= r.demand && r.served <= r.cap, 'served bound');
    ok(r.rep >= 0 && r.rep <= 1 && r.sat >= 0 && r.sat <= 1, 'range');
    r.tips.forEach(t => ok(!!S.TOOLS[t.tool], 'tip tool ' + t.tool));
  }
  ok(G.stage === 'end', 'ended');
  ok(G.hist.length <= 12, 'max 12 months');
  const f = S.finalScore(G);
  ok(Number.isFinite(f.score) && 'SABCD'.includes(f.grade), 'score');
  if(G.over === 'done') ok(G.hist.length === 12, 'done = 12 months');
  else ok(f.grade === 'D', 'not done = D');
  grades[f.grade] = (grades[f.grade] || 0) + 1;
  const ctx = S.checklistCtx(G);
  ok(['food','retail','online','beauty'].includes(ctx.type) && ['rent','home','spot'].includes(ctx.place), 'ctx');
  ok(/^https:\/\/m255525\.github\.io\/shop-opening-checklist\/#s=[\w-]+$/.test(S.checklistUrl(G)), 'url');
}
// 同代碼同結果
const run = () => { const G = S.newGame({code:'SAME', persona:'mei'}); Object.assign(G.c, {type:'drink', loc:'alley', pos:'standard', loan:'family', loanAmt:500000}); S.openShop(G);
  while(G.stage === 'month'){ S.chooseEvent(G, 0); S.simulate(G, S.defaultDec(G)); } return JSON.stringify(G.hist.map(h => [h.ev && h.ev.id, h.demand])); };
ok(run() === run(), 'deterministic by code');
// 小考答案
for(const t of Object.keys(S.TYPES)){ const G = S.newGame({code:'Q', persona:'mei'}); G.c.type = t; G.c.loc = S.TYPES[t].locs[0]; G.c.pos = 'standard';
  S.prepQuiz(G).forEach(q => ok(q.opts.length === 3 && q.a === 0, 'quiz ' + q.id));
  const b = S.breakEvenQuiz(G); ok(b.opts[b.a] === b.b.rev && new Set(b.opts).size === 3, 'be quiz ' + t); }
ok(S.PERSONAS.filter(p => p.phoenix).length === 3, 'phoenix personas');
console.log('games', games, 'crises', crises, 'grades', JSON.stringify(grades), fail ? 'FAILED ' + fail : 'ALL PASS');
process.exit(fail ? 1 : 0);
