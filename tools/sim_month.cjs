const S = require('../data.js');
const arg = process.argv.slice(2);
for(const type of Object.keys(S.TYPES)) for(const loc of S.TYPES[type].locs){
  const G = S.newGame({code:'X1', persona:'chen'});
  Object.assign(G.c, {type, loc, pos:'standard', course:true, loan:'none'}); G.quiz={tax:1,food:1}; S.openShop(G);
  G.cash = 1e7; let sums = {}, n=0;
  while(G.stage==='month'){ S.chooseEvent(G, 0); const d=S.defaultDec(G); d.mkt='social'; const fc=S.forecast(G,d); let st=0; while(S.capacity(G,st)<fc*1.05&&st<6)st++; d.staff=st;
    const r=S.simulate(G,d); n++; for(const k of ['revenue','cogs','waste','rent','util','payroll','tax','profit','served']) sums[k]=(sums[k]||0)+r[k]; sums.staff=(sums.staff||0)+st; }
  const o = {}; for(const k in sums) o[k]=Math.round(sums[k]/n);
  console.log(type, loc, 'start', S.startCost(G.c), JSON.stringify(o), 'rep', G.rep.toFixed(2));
}
