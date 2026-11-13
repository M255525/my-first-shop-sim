const S = require('../data.js');
function play(type, loc, pos, strat, code){
  const G = S.newGame({code, persona:'chen'});
  Object.assign(G.c, {type, loc, pos, course:true});
  const gap = S.fundingGap(G); const need = Math.max(0, -gap + 300000);
  G.c.loan = need ? 'phoenix' : 'none'; G.c.loanAmt = Math.min(need, 2000000);
  G.quiz = {tax:1, food:1}; S.openShop(G);
  while(G.stage !== 'end'){
    if(G.stage === 'crisis'){ S.rescue(G, true); continue; }
    S.chooseEvent(G, 0);
    const d = S.defaultDec(G);
    if(strat === 'smart'){
      d.mkt = 'social'; d.stock = 'mid'; d.price = 0;
      const fc = S.forecast(G, d); let st = 0; while(S.capacity(G, st) < fc * 1.05 && st < 6) st++; d.staff = st;
    } else if(strat === 'lazy'){ d.mkt = 'none'; d.stock = 'high'; d.staff = 3; d.price = 1; }
    S.simulate(G, d);
  }
  return S.finalScore(G);
}
const out = {};
for(const type of Object.keys(S.TYPES)) for(const loc of S.TYPES[type].locs) for(const pos of ['budget','standard','premium']) for(const strat of ['smart','lazy']){
  let g = {}, roi = 0, n = 20;
  for(let i=0;i<n;i++){ const f = play(type, loc, pos, strat, 'T'+i); g[f.grade]=(g[f.grade]||0)+1; roi += f.avg; }
  console.log(type.padEnd(7), loc.padEnd(7), pos.padEnd(9), strat.padEnd(6), 'avg', (roi/n/1000).toFixed(1).padStart(6)+"k", JSON.stringify(g));
}
