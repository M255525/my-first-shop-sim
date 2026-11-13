/* 我的第一家店：畫面 */
(function(){
'use strict';
var D = window.SIM, $ = function(id){ return document.getElementById(id); };
var PFX = 'fss.';
function lsGet(k){ try{ return localStorage.getItem(PFX + k); }catch(e){ return null; } }
function lsSet(k, v){ try{ localStorage.setItem(PFX + k, v); }catch(e){} }
function lsDel(k){ try{ localStorage.removeItem(PFX + k); }catch(e){} }
function lsJson(k, d){ try{ var v = JSON.parse(lsGet(k)); return v == null ? d : v; }catch(e){ return d; } }
function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]; }); }
var money = D.money, pct = D.pct;
function yuan(n){ return money(n) + ' 元'; }
function wan(n){ var v = Math.round(n / 1000) / 10; return (v % 1 ? v.toFixed(1) : v) + ' 萬'; }
function signed(n){ return (n > 0 ? '+' : '') + money(n); }
function stars(r){ var n = Math.round(r * 5); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;

var G = loadGame();
var V = {home:!G, report:false, newPersona:'mei', newName:'', newCode:D.newCode(), quiz:{}};
var STAMPS = lsJson('stamps', {});
function loadGame(){ var g = lsJson('game', null); return g && g.v === 1 && g.c ? g : null; }
function save(){ if(G) lsSet('game', JSON.stringify(G)); else lsDel('game'); }

var STEP_NAMES = ['店型', '地點', '定位', '損益兩平', '開店手續', '資金'];
var PRICE = [{v:-2, n:'大降'}, {v:-1, n:'小降'}, {v:0, n:'原價'}, {v:1, n:'小漲'}, {v:2, n:'大漲'}];

/* ---------- 共用片段 ---------- */
function topBar(){
  var n = Object.keys(STAMPS).length;
  return '<div class="top noprint"><h1>🏪 我的第一家店 <small>開店經營模擬</small></h1>' +
    (G && !V.home ? '<button class="ibtn" data-act="home">🏠 首頁</button>' : '') +
    '<button class="ibtn" data-act="passport">🛂 工具護照 <span class="badge">' + n + '</span></button>' +
    '<a class="ibtn" href="manual.html">📖 操作手冊</a><button class="ibtn" data-act="settings" aria-label="常用設定">⚙</button></div>' +
    '<p class="warn-line noprint">遊戲裡的金額、利率、來客數都是遊戲設定，用來練習經營判斷，不是真實行情。<button data-act="warn">⚠ 使用警語</button></p>';
}
function toolCard(id, href){
  var t = D.TOOLS[id]; if(!t) return '';
  return '<a class="tcard" data-tool="' + id + '" href="' + esc(href || D.toolUrl(id)) + '" target="_blank" rel="noopener">' +
    (STAMPS[id] ? '<span class="st">✔ 已蓋章</span>' : '') + '<span class="ti">' + t.ic + '</span><span><b>' + (t.lic ? '<span class="lic" title="需序號"></span>' : '') + esc(t.n) + '</b><small>' + esc(t.d) + '</small></span></a>';
}
function toolsBox(ids, title, extra){
  return '<div class="tools"><h3>🔧 ' + (title || '這一關對應的真實工具（點開會在工具護照蓋章）') + '</h3><div class="tgrid">' + (extra || '') + ids.map(function(i){ return toolCard(i); }).join('') + '</div></div>';
}
function footer(){
  return '<footer class="foot noprint">👤 創作者 Mark Tsai（蔡豐全）<a href="mailto:tsaimark@gmail.com">tsaimark@gmail.com</a><br><a href="manual.html">📖 操作手冊</a><a href="#" data-act="warn">⚠ 使用警語</a>' +
    (standalone ? '' : '<a href="#" data-act="install">📲 加入主畫面</a>') + '<a href="' + D.toolUrl('startup-island') + '" target="_blank" rel="noopener" data-tool="startup-island">🏝 創業島</a>' +
    '<br><img src="https://visitor-badge.laobi.icu/badge?page_id=m255525.myfirstshopsim" alt="訪客次數" height="20" loading="lazy" style="vertical-align:middle;margin-top:.4rem"></footer>';
}

/* ---------- 首頁 ---------- */
function homeView(){
  var board = lsJson('board', []);
  var h = topBar() + '<section class="card"><div class="hero"><div>' +
    '<h2 class="ttl">開一家店，<br>撐過<span>第一年</span>。</h2>' +
    '<p class="lead">從選店型、找地點、算損益兩平、辦手續、借錢開店，到經營 12 個月：颱風、負評、房東漲租、外送平台找上門……每一關都連到一個你真的用得到的創業工具。</p>' +
    '<div class="flow"><b>籌備 6 關</b><i>→</i><b>開幕</b><i>→</i><b>經營 12 個月</b><i>→</i><b>結算評等</b><i>→</i><b>帶去真實工具</b></div></div>' +
    '<div>' + sceneSvg(null) + '</div></div>' +
    (G ? '<div class="alert warn" style="margin-top:1rem">你有一局還沒玩完：<b>' + esc(shopTitle(G)) + '</b>（' + progressText(G) + '）<div class="go" style="margin-top:.5rem"><button class="btn" data-act="resume">▶ 繼續上一局</button><button class="btn alt" data-act="wipeAll">🧹 清除全部資料</button></div></div>' : '') +
    '</section>' +
    '<section class="card"><h2>👤 選一位創業者</h2><p class="lead">四位都是虛構人物，自有資金和能不能申請鳳凰貸款都不一樣。</p><div class="pick">' +
    D.PERSONAS.map(function(p){ return '<button class="opt" data-persona="' + p.id + '" aria-pressed="' + (V.newPersona === p.id) + '"><span class="oi">' + p.ic + '</span><span><b>' + p.n + '</b><small>' + p.desc + '</small><span class="nums"><span>自有資金 ' + wan(p.own) + '</span></span></span></button>'; }).join('') + '</div>' +
    '<div class="row2"><label class="fld">店名（可以先空著）<input id="newName" maxlength="20" value="' + esc(V.newName) + '" placeholder="例如：晨光巷早午餐"></label>' +
    '<label class="fld">關卡代碼<input id="newCode" maxlength="8" value="' + esc(V.newCode) + '" style="text-transform:uppercase;letter-spacing:.15em"></label></div>' +
    '<p class="small">👩‍🏫 上課用：全班輸入<b>同一個關卡代碼</b>，每個月遇到的事件和人潮起伏都一樣，比分數才公平。</p>' +
    '<div class="go"><button class="btn gold big" data-act="start">🏁 開始創業</button>' + (G ? '<span class="small">開新局會蓋掉上一局的進度</span>' : '') + '</div></section>';
  if(board.length) h += '<section class="card"><h2>🏆 這台裝置的排行榜</h2><div class="tblwrap"><table class="board"><tr><th>#</th><th>店</th><th>評等</th><th>分數</th><th>平均月損益</th><th>代碼</th><th>日期</th></tr>' +
    board.slice(0, 10).map(function(b, i){ return '<tr><td>' + (i + 1) + '</td><td>' + esc(b.shop) + '</td><td><b>' + b.grade + '</b></td><td class="n">' + b.score + '</td><td class="n">' + signed(b.avg) + '</td><td>' + esc(b.code) + '</td><td>' + esc(b.date) + '</td></tr>'; }).join('') + '</table></div></section>';
  h += '<section class="card"><h2>🗺 這個遊戲串起來的工具</h2><p class="lead">玩的時候遇到哪一關，就會提示對應的工具。點開過的工具會在「🛂 工具護照」蓋章。</p>' +
    toolsBox(['startup-island', 'shop-opening-checklist', 'restaurant-feasibility-calculator', 'phoenix-loan-generator'], '從這幾個開始') + '</section>';
  return h + footer();
}
function shopTitle(g){ return g.name || (D.persona(g).n + (g.c.type ? '的' + D.TYPES[g.c.type].n : '的店')); }
function progressText(g){ return g.stage === 'prep' ? '籌備第 ' + (g.step + 1) + ' 關' : g.stage === 'end' ? '已結算' : '經營第 ' + (g.month + 1) + ' 個月'; }

/* ---------- 籌備 ---------- */
function stepsBar(){ return '<div class="steps">' + STEP_NAMES.map(function(n, i){ return '<span class="' + (i < G.step ? 'ok' : i === G.step ? 'on' : '') + '">' + (i < G.step ? '✔ ' : (i + 1) + '. ') + n + '</span>'; }).join('') + '</div>'; }
function prepView(){
  var c = G.c, per = D.persona(G), h = topBar() + stepsBar() + '<section class="card">';
  var ok = false, tools = [];
  if(G.step === 0){
    h += '<h2>第 1 關：要開什麼店？</h2><p class="lead">' + per.ic + ' ' + per.n + '，自有資金 ' + wan(per.own) + '。每種店的賺錢方式很不一樣。</p><div class="pick">' +
      Object.keys(D.TYPES).map(function(k){ var t = D.TYPES[k]; return '<button class="opt" data-type="' + k + '" aria-pressed="' + (c.type === k) + '"><span class="oi">' + t.ic + '</span><span><b>' + t.n + '</b><small>' + t.desc + '</small><span class="nums"><span>客單價約 ' + t.ticket + ' 元</span><span>進貨成本 ' + pct(t.cogs) + '</span><span>開辦費約 ' + wan(t.start) + '</span></span></span></button>'; }).join('') + '</div>';
    ok = !!c.type; tools = ['business-idea-generator', 'business-model-canvas-generator'];
  } else if(G.step === 1){
    var t = D.TYPES[c.type];
    h += '<h2>第 2 關：店開在哪裡？</h2><p class="lead">' + t.ic + ' ' + t.n + '可以選的地點。人潮越多，租金和開辦費也越高。</p><div class="pick">' +
      t.locs.map(function(k){ var l = D.LOCS[k], cc = {type:c.type, loc:k}; var g2 = {c:cc, p:{rentAdd:0}}; return '<button class="opt" data-loc="' + k + '" aria-pressed="' + (c.loc === k) + '"><span class="oi">' + l.ic + '</span><span><b>' + l.n + '</b><small>' + l.desc + '</small><span class="nums"><span>月租 ' + (D.rentOf(g2) ? wan(D.rentOf(g2)) : '0') + '</span><span>開辦費 ' + wan(D.startCost(cc)) + '</span><span>人潮 ×' + ({'salon:home':.45, 'craft:alley':1.4}[c.type + ':' + k] || l.traffic) + '</span></span></span></button>'; }).join('') + '</div>';
    ok = !!c.loc; tools = ['restaurant-feasibility-calculator', 'startup-island'];
  } else if(G.step === 2){
    h += '<h2>第 3 關：你的店走什麼路線？</h2><p class="lead">定位決定了價格、客人多寡與滿意度，開幕後就不能改（售價還是可以每月微調）。</p><div class="pick">' +
      Object.keys(D.POS).map(function(k){ var p = D.POS[k]; return '<button class="opt" data-pos="' + k + '" aria-pressed="' + (c.pos === k) + '"><span class="oi">' + p.ic + '</span><span><b>' + p.n + '</b><small>' + p.desc + '</small><span class="nums"><span>客單價 ×' + p.ticket + '</span><span>人潮 ×' + p.demand + '</span><span>成本率 ' + (p.cogs > 0 ? '+' : '') + Math.round(p.cogs * 100) + '%</span></span></span></button>'; }).join('') + '</div>';
    ok = !!c.pos; tools = ['where-what-how-strategy-studio', 'swot-game', 'business-model-pattern-studio'];
  } else if(G.step === 3){
    var q = D.breakEvenQuiz(G), b = q.b, ans = G.qa && G.qa.be;
    h += '<h2>第 4 關：每個月要賣多少才不會虧？</h2><p class="lead">開店前一定要算的數字：<b>損益兩平營業額</b>＝每月固定開銷 ÷ 毛利率。</p>' +
      '<dl class="calc"><dt>租金</dt><dd>' + yuan(D.rentOf({c:c, p:{rentAdd:0}})) + '</dd><dt>水電雜支</dt><dd>' + yuan(D.utilOf({c:c}) + D.MISC) + '</dd>' +
      '<dt>員工 ' + D.TYPES[c.type].staff + ' 位（含雇主負擔）</dt><dd>' + yuan(D.payrollOf({p:{wageAdd:0}}, D.TYPES[c.type].staff)) + '</dd>' +
      '<dt class="t">每月固定開銷</dt><dd class="t">' + yuan(b.fixed) + '</dd><dt>毛利率（1 − 進貨成本率）</dt><dd>' + pct(b.margin) + '</dd></dl>' +
      '<div class="qbox"><p class="q">每月營業額至少要多少，才會打平？</p><div class="qopts">' +
      q.opts.map(function(v, i){ var cls = ans == null ? '' : i === q.a ? ' class="right"' : i === ans ? ' class="wrong"' : ''; return '<button data-be="' + i + '"' + cls + (ans != null ? ' disabled' : '') + '>' + yuan(v) + '</button>'; }).join('') + '</div>' +
      (ans != null ? '<p class="exp ' + (ans === q.a ? 'ok' : 'no') + '">' + (ans === q.a ? '⭐ 答對了！' : '答錯了，') + '固定開銷 ' + yuan(b.fixed) + ' ÷ 毛利率 ' + pct(b.margin) + ' ≈ <b>' + yuan(b.rev) + '</b>。只算固定開銷不算進貨成本，就會以為賣到 ' + yuan(b.fixed) + ' 就夠了。另外注意：<b>老闆自己的薪水還沒算進去</b>。</p>' : '') + '</div>';
    ok = ans != null; tools = ['restaurant-feasibility-calculator', 'restaurant-menu-mix-calculator', 'employer-payroll-cost-calculator'];
  } else if(G.step === 4){
    var qs = D.prepQuiz(G), qa = G.qa || {}, all = true;
    h += '<h2>第 5 關：開店手續小考</h2><p class="lead">開店前要跑的手續很多，先考你三題（答對的可以在開店後少踩雷）。</p>';
    qs.forEach(function(qq){
      var order = shuffled(qq.id, qq.opts.length), a = qa[qq.id];
      if(a == null) all = false;
      h += '<div class="qbox"><p class="q">' + esc(qq.q) + '</p><div class="qopts">' + order.map(function(oi){
        var cls = a == null ? '' : oi === qq.a ? ' class="right"' : oi === a ? ' class="wrong"' : '';
        return '<button data-q="' + qq.id + '" data-a="' + oi + '"' + cls + (a != null ? ' disabled' : '') + '>' + esc(qq.opts[oi]) + '</button>'; }).join('') + '</div>' +
        (a != null ? '<p class="exp ' + (a === qq.a ? 'ok' : 'no') + '">' + (a === qq.a ? '⭐ 答對了！' : '答錯了。') + esc(qq.exp) + '<br><span class="small">依據：' + esc(qq.src) + '（2026 年查證，以主管機關最新公告為準）</span></p>' : '') + '</div>';
    });
    ok = all; tools = ['loan-eligibility-checker'];
    h += toolsBox(tools, '把你的店帶去「開店前置清單」，排出真正要跑的手續', toolCard('shop-opening-checklist', D.checklistUrl(G)));
    tools = null;
  } else {
    h += fundView(); ok = cashAtOpen() >= 0; tools = null;
  }
  if(tools) h += toolsBox(tools);
  h += '<div class="go">' + (G.step > 0 ? '<button class="btn alt" data-act="back">← 上一關</button>' : '') +
    (G.step < 5 ? '<button class="btn" data-act="next"' + (ok ? '' : ' disabled') + '>下一關 →</button>' : '<button class="btn gold big" data-act="open"' + (ok ? '' : ' disabled') + '>🎉 開幕！</button>') + '</div></section>';
  return h + footer();
}
function shuffled(salt, n){ var r = D.rng(D.hash(G.code + ':' + salt)), a = []; for(var i = 0; i < n; i++) a.push(i); for(var j = n - 1; j > 0; j--){ var k = Math.floor(r() * (j + 1)), t = a[j]; a[j] = a[k]; a[k] = t; } return a; }
function fixedEst(){ var c = G.c, t = D.TYPES[c.type]; var g = {c:c, p:{rentAdd:0, wageAdd:0}}; return D.rentOf(g) + D.utilOf(g) + D.MISC + D.payrollOf(g, t.staff); }
function cashAtOpen(){ var c = G.c, amt = c.loan === 'none' ? 0 : c.loanAmt; return G.own + amt - D.startCost(c) - (c.course ? 3000 : 0); }
function fundView(){
  var c = G.c, per = D.persona(G), cost = D.startCost(c), fx = fixedEst();
  if(c.loan === 'phoenix' && !D.phoenixOk(G)) c.loan = 'none';
  var L = D.LOANS[c.loan];
  if(c.loan === 'none') c.loanAmt = 0; else c.loanAmt = D.clamp(c.loanAmt, 0, L.max);
  var cash = cashAtOpen(), months = fx ? cash / fx : 0;
  var h = '<h2>第 6 關：錢從哪裡來？</h2><p class="lead">開店的錢不只開辦費，還要留<b>周轉金</b>：開幕頭幾個月通常還沒賺錢，房租、薪水照樣要付。</p>' +
    '<dl class="calc"><dt>' + per.n + '的自有資金</dt><dd>' + yuan(per.own) + '</dd><dt>開辦費（裝潢、設備、押金、首批貨）</dt><dd>− ' + yuan(cost) + '</dd>' +
    (c.course ? '<dt>創業課程費用</dt><dd>− 3,000 元</dd>' : '') + '<dt class="t">還差</dt><dd class="t">' + (D.fundingGap(G) >= 0 ? '不差，還剩 ' + yuan(D.fundingGap(G)) : yuan(-D.fundingGap(G))) + '</dd>' +
    '<dt>每月固定開銷約</dt><dd>' + yuan(fx) + '</dd></dl>' +
    '<label class="toggle"><input type="checkbox" id="course"' + (c.course ? ' checked' : '') + '><span>開店前先去上 <b>18 小時政府創業課程</b>（3,000 元）<br><span class="small">鳳凰貸款要求 3 年內上過 18 小時創業研習課程。</span></span></label>' +
    '<div class="pick" style="margin-top:.8rem">' + Object.keys(D.LOANS).map(function(k){
      var l = D.LOANS[k], dis = k === 'phoenix' && !D.phoenixOk(G);
      var why = k === 'phoenix' ? (per.phoenix ? (G.c.course ? '✔ 身分符合：' + per.why : '要先勾上面的 18 小時創業課程') : '✘ 身分不符：' + per.why) : '';
      return '<button class="opt" data-loan="' + k + '" aria-pressed="' + (c.loan === k) + '"' + (dis ? ' disabled' : '') + '><span class="oi">' + l.ic + '</span><span><b>' + l.n + '</b><small>' + l.desc + '</small><span class="nums">' + (l.max ? '<span>上限 ' + wan(l.max) + '</span><span>年利率 ' + (l.rate * 100).toFixed(1) + '%（遊戲設定）</span>' : '') + '</span>' + (why ? '<small style="font-weight:700;color:' + (dis ? 'var(--bad)' : 'var(--good)') + '">' + why + '</small>' : '') + '</span></button>';
    }).join('') + '</div>';
  if(c.loan !== 'none'){
    var p = D.pmt(c.loanAmt, L.rate);
    h += '<div class="range"><label for="loanAmt"><b>借多少</b></label><input type="range" id="loanAmt" min="0" max="' + L.max + '" step="10000" value="' + c.loanAmt + '"><b id="loanAmtV">' + wan(c.loanAmt) + '</b></div>' +
      '<p class="small">分 5 年（60 期）攤還，每月約還 <b id="loanPmt">' + yuan(p) + '</b>。<button class="ibtn" data-act="suggestLoan" style="min-height:2rem">💡 幫我算：補足差額＋3 個月周轉金</button></p>';
  }
  h += '<div class="alert ' + (cash < 0 ? 'bad' : months < 2 ? 'warn' : 'ok') + '">開幕當天手上現金：' + yuan(cash) + (cash < 0 ? '　→ 錢不夠，開不了店！請借錢，或回上一關換便宜一點的地點。' : '　→ 大約撐得了 ' + months.toFixed(1) + ' 個月的固定開銷' + (months < 2 ? '，有點危險，建議多留一些周轉金。' : '。')) + '</div>';
  h += toolsBox(['loan-eligibility-checker', 'phoenix-loan-generator', 'credit-5c-risk-diagnosis']);
  return h;
}

/* ---------- 街景 ---------- */
var TYPE_COLOR = {brunch:['#F6E7C8', '#E8553F'], drink:['#DFF3EA', '#22A57F'], select:['#EDE4F7', '#7A4FB5'], craft:['#FFF0E0', '#F2B134'], salon:['#E3EEFB', '#2F6FC0']};
function sceneSvg(g, res){
  var W = 640, H = 230, type = g ? g.c.type : 'brunch', loc = g ? g.c.loc : 'alley';
  var ev = g && g.ev ? g.ev.id : '', m = g ? D.calMonth(g) : 4;
  var stormy = ev === 'typhoon' || ev === 'plum', night = loc === 'market';
  var sky = stormy ? '#8C98A8' : night ? '#283A6E' : m >= 6 && m <= 9 ? '#9ED8F2' : m === 12 || m <= 2 ? '#C9DCEB' : '#BFE3F5';
  var col = TYPE_COLOR[type], name = g ? (g.name || D.TYPES[type].n) : '我的第一家店';
  if(name.length > 9) name = name.slice(0, 9) + '…';
  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="店面街景"><rect width="' + W + '" height="' + H + '" fill="' + sky + '"/>';
  if(night){ for(var i = 0; i < 18; i++) s += '<circle cx="' + ((i * 97) % W) + '" cy="' + (10 + (i * 37) % 60) + '" r="1.3" fill="#fff" opacity=".7"/>'; }
  else if(!stormy) s += '<circle cx="560" cy="42" r="22" fill="#FFD866"/><g fill="#fff" opacity=".9"><ellipse cx="120" cy="40" rx="34" ry="11"/><ellipse cx="145" cy="33" rx="22" ry="11"/><ellipse cx="420" cy="55" rx="28" ry="9"/></g>';
  else s += '<g fill="#6D7787"><ellipse cx="130" cy="30" rx="80" ry="20"/><ellipse cx="420" cy="26" rx="110" ry="22"/></g>';
  // 鄰居
  s += '<rect x="20" y="70" width="150" height="120" fill="#D9CDB5"/><rect x="20" y="62" width="150" height="10" fill="#B9AA8E"/>';
  for(var w = 0; w < 3; w++) s += '<rect x="' + (35 + w * 45) + '" y="85" width="30" height="26" fill="' + (night ? '#FFE9A8' : '#EAF4FA') + '" stroke="#B9AA8E"/>';
  var comp = g && g.p.competitor;
  s += '<rect x="470" y="60" width="160" height="130" fill="' + (comp ? '#F4D6D0' : '#CFC3AA') + '"/>';
  if(comp) s += '<rect x="480" y="72" width="140" height="26" rx="4" fill="#C8372D"/><text x="550" y="90" font-size="14" fill="#fff" text-anchor="middle" font-weight="700">新店開幕 全品項8折</text><rect x="500" y="110" width="100" height="80" fill="#FBEDEA" stroke="#C8372D"/>';
  else for(var w2 = 0; w2 < 3; w2++) s += '<rect x="' + (485 + w2 * 45) + '" y="80" width="30" height="30" fill="' + (night ? '#FFE9A8' : '#EAF4FA') + '" stroke="#A8997D"/>';
  // 主角店
  if(loc === 'market'){
    s += '<rect x="215" y="95" width="210" height="95" fill="' + col[0] + '"/><path d="M200 95 L320 62 L440 95 Z" fill="' + col[1] + '"/>';
    for(var l = 0; l < 5; l++) s += '<g class="bob" style="animation-delay:' + (l * .1) + 's"><line x1="' + (235 + l * 42) + '" y1="95" x2="' + (235 + l * 42) + '" y2="104" stroke="#555"/><ellipse cx="' + (235 + l * 42) + '" cy="112" rx="8" ry="10" fill="#E8553F"/></g>';
    s += '<rect x="230" y="150" width="180" height="40" fill="#8B5E3C"/>';
  } else if(loc === 'home'){
    s += '<rect x="225" y="90" width="190" height="100" fill="' + col[0] + '"/><path d="M210 92 L320 40 L430 92 Z" fill="' + col[1] + '"/><rect x="300" y="135" width="40" height="55" fill="#8B5E3C"/>' +
      '<rect x="240" y="110" width="44" height="34" fill="#EAF4FA" stroke="#999"/><rect x="356" y="110" width="44" height="34" fill="#EAF4FA" stroke="#999"/>';
    if(type === 'craft') s += '<rect x="250" y="178" width="22" height="14" fill="#C9A26B"/><rect x="262" y="168" width="22" height="12" fill="#D8B57E"/>';
  } else {
    s += '<rect x="200" y="50" width="240" height="140" fill="' + col[0] + '"/><rect x="200" y="44" width="240" height="10" fill="#9C8F75"/>' +
      '<rect x="230" y="58" width="180" height="30" rx="6" fill="#24305E"/>';
    for(var a = 0; a < 8; a++) s += '<path d="M' + (200 + a * 30) + ' 94 h30 v14 a15 8 0 0 1 -30 0z" fill="' + (a % 2 ? '#fff' : col[1]) + '"/>';
    s += '<rect x="215" y="122" width="80" height="58" fill="' + (night ? '#FFE9A8' : '#EAF4FA') + '" stroke="#555"/><rect x="345" y="122" width="80" height="58" fill="' + (night ? '#FFE9A8' : '#EAF4FA') + '" stroke="#555"/>' +
      '<rect x="300" y="122" width="40" height="68" fill="#8B5E3C"/><text x="255" y="160" font-size="26" text-anchor="middle">' + D.TYPES[type].ic + '</text>';
  }
  var signY = loc === 'market' ? 128 : loc === 'home' ? 80 : 78;
  if(loc === 'home') s += '<rect x="250" y="64" width="140" height="22" rx="5" fill="#24305E"/>';
  if(loc === 'market') s += '<rect x="240" y="114" width="160" height="24" rx="5" fill="#24305E"/>';
  s += '<text x="320" y="' + signY + '" font-size="16" fill="#FFE9A8" text-anchor="middle" font-weight="700">' + esc(name) + '</text>';
  if(g) s += '<text x="320" y="' + (loc === 'home' ? 60 : loc === 'market' ? 58 : 42) + '" font-size="13" fill="#F2B134" text-anchor="middle">' + stars(g.rep) + '</text>';
  // 地面
  s += '<rect x="0" y="190" width="' + W + '" height="14" fill="#B9B2A3"/><rect x="0" y="204" width="' + W + '" height="26" fill="#6E6E73"/>';
  for(var d = 0; d < 9; d++) s += '<rect x="' + (d * 80 + 10) + '" y="215" width="40" height="4" fill="#E8E2D2"/>';
  // 客人
  var n = 4;
  if(res) n = Math.max(1, Math.min(14, Math.round(res.served / Math.max(res.cap, 1) * 12)));
  else if(g && g.hist.length){ var lr = g.hist[g.hist.length - 1]; n = Math.max(1, Math.min(14, Math.round(lr.served / Math.max(lr.cap, 1) * 12))); }
  var colors = ['#E8553F', '#22A57F', '#2F6FC0', '#F2B134', '#7A4FB5', '#24305E'];
  for(var k = 0; k < n; k++){
    var enter = k % 2 === 0, dur = 7 + (k * 3) % 6, delay = -(k * 1.7) % dur;
    s += '<g class="walker' + (enter ? ' in' : '') + '" style="--door:' + (300 + (k % 3) * 8) + 'px;animation-duration:' + (enter ? 6 + (k % 3) : dur) + 's;animation-delay:' + delay.toFixed(1) + 's">' +
      '<g transform="translate(0 ' + (172 + (k % 3) * 4) + ')"><circle cx="0" cy="0" r="6" fill="#F3C9A5"/><rect x="-6" y="6" width="12" height="16" rx="4" fill="' + colors[k % colors.length] + '"/></g></g>';
  }
  if(g && g.p.delivery) s += '<g class="walker" style="animation-duration:5s"><text x="0" y="222" font-size="22">🛵</text></g>';
  if(stormy) s += '<g class="rain" stroke="#E6EEF7" stroke-width="1.4" opacity=".7">' + Array.apply(null, Array(40)).map(function(_, i){ return '<line x1="' + ((i * 53) % W) + '" y1="' + ((i * 29) % 180) + '" x2="' + ((i * 53) % W - 6) + '" y2="' + ((i * 29) % 180 + 14) + '" style="animation-delay:-' + (i % 6) / 10 + 's"/>'; }).join('') + '</g>';
  return s + '</svg>';
}

/* ---------- 每月經營 ---------- */
function est(dec){
  var c = G.c, t = D.TYPES[c.type], m = (G.ev && G.ev.mul) || {};
  var fc = D.forecast(G, dec), cap = D.capacity(G, dec.staff), ticket = D.ticketOf(G, dec.price), cr = D.cogsRate(G);
  var stock = Infinity, buy = 0;
  if(t.goods){ var target = Math.round(fc * D.STOCK[dec.stock].k); if(t.goods === 'food'){ stock = target; buy = target * ticket * cr; } else { stock = Math.max(G.inv, target); buy = Math.max(0, target - G.inv) * ticket * cr; } }
  var served = Math.max(0, Math.min(fc, cap, stock)), rev = served * ticket;
  var cogs = t.goods ? buy : rev * cr;
  var fee = G.p.delivery ? rev * (.25 / 1.25) * .3 : 0, tax = rev >= D.threshold(c.type) ? rev * .01 : 0;
  var interest = G.loan ? G.loan.left * G.loan.rate / 12 : 0, loanPay = G.loan && G.loan.left > 0 ? G.loan.pmt : 0;
  var fixed = D.rentOf(G) + D.utilOf(G) + D.MISC + D.payrollOf(G, dec.staff) + D.MKT[dec.mkt].cost;
  var profit = rev - cogs - fixed - fee - tax - interest + (m.cash || 0);
  return {fc:fc, cap:cap, served:served, rev:Math.round(rev), cogs:Math.round(cogs), fixed:fixed, fee:Math.round(fee + tax), profit:Math.round(profit), cash:Math.round(G.cash + rev - cogs - fixed - fee - tax - loanPay + (m.cash || 0)), ticket:ticket, lostCap:Math.max(0, Math.min(fc, stock) - cap)};
}
function hud(){
  var last = G.hist[G.hist.length - 1];
  return '<div class="hud"><div><span>💰 現金</span><b' + (G.cash < 0 ? ' class="neg"' : '') + '>' + wan(G.cash) + '</b></div>' +
    '<div><span>⭐ 口碑</span><b class="stars">' + stars(G.rep) + '</b></div>' +
    '<div><span>📊 上個月損益</span><b' + (last && last.profit < 0 ? ' class="neg"' : '') + '>' + (last ? (last.profit > 0 ? '+' : '') + wan(last.profit) : '—') + '</b></div>' +
    '<div><span>🏦 貸款餘額</span><b>' + (G.loan ? wan(G.loan.left) : '0') + '</b></div></div>';
}
function monthLabel(g, i){ var cm = ((D.START_MONTH - 1 + i) % 12) + 1; return '第 ' + (i + 1) + ' 個月・' + cm + ' 月'; }
function monthView(){
  var e = D.EV[G.ev.id], t = D.TYPES[G.c.type], dec = G.dec, chosen = G.ev.ch != null;
  var h = topBar() + hud() + '<div class="scene">' + sceneSvg(G) + '<span class="mlabel">' + monthLabel(G, G.month) + '</span></div>';
  h += '<section class="event"><h2><span class="ei">' + e.ic + '</span>' + esc(e.title) + '</h2><p>' + esc(D.evText(G, e)) + '</p>';
  if(!chosen) h += '<div class="chs">' + e.ch.map(function(c, i){ return '<button data-ev="' + i + '">' + esc(c.t) + '</button>'; }).join('') + '</div>';
  else h += '<div class="result">👉 你選了「' + esc(e.ch[G.ev.ch].t) + '」<br>' + esc(G.ev.note || '') + '</div>';
  var tid = D.evTool(G, e);
  if(tid) h += '<div class="tgrid" style="margin-top:.6rem">' + toolCard(tid) + '</div>';
  h += '</section>';
  if(!chosen) return h + '<p class="small" style="text-align:center;margin-top:1rem">先處理上面的事件，再安排這個月的營業。</p>' + footer();
  var x = est(dec), goods = !!t.goods;
  h += '<section class="card"><h2>📋 安排這個月的營業</h2><div class="decs"><div>' +
    '<div class="dec"><b>💲 售價<small>目前客單價 ' + x.ticket + ' 元</small></b><div class="seg">' + PRICE.map(function(p){ return '<button data-price="' + p.v + '" aria-pressed="' + (dec.price === p.v) + '">' + p.n + '</button>'; }).join('') + '</div></div>' +
    (goods ? '<div class="dec"><b>📦 備貨<small>' + (t.goods === 'food' ? '食材當月沒用完就報廢' : '沒賣完的留到下個月（庫存 ' + Math.round(G.inv) + '）') + '</small></b><div class="seg">' + Object.keys(D.STOCK).map(function(k){ return '<button data-stock="' + k + '" aria-pressed="' + (dec.stock === k) + '">' + D.STOCK[k].n + '（' + Math.round(D.STOCK[k].k * 100) + '%）</button>'; }).join('') + '</div></div>' : '') +
    '<div class="dec"><b>👥 員工<small>老闆自己算 1 人；每位月薪 ' + money(D.WAGE + G.p.wageAdd) + ' 元，雇主另付約 2 成勞健保等</small></b><div class="stepper"><button data-staff="-1"' + (dec.staff <= 0 ? ' disabled' : '') + ' aria-label="少一位">−</button><span class="people">🧑‍💼' + '🧑‍🍳'.repeat(dec.staff) + '</span><b>' + dec.staff + ' 位</b><button data-staff="1"' + (dec.staff >= 6 ? ' disabled' : '') + ' aria-label="多一位">＋</button></div><p class="small">最多可以服務約 ' + money(x.cap) + ' ' + t.unit + '</p></div>' +
    '<div class="dec"><b>📣 行銷</b><div class="mkts">' + Object.keys(D.MKT).map(function(k){ var mk = D.MKT[k]; return '<button class="opt" data-mkt="' + k + '" aria-pressed="' + (dec.mkt === k) + '"><span class="oi">' + mk.ic + '</span><span><b>' + mk.n + '</b><small>' + (mk.cost ? money(mk.cost) + ' 元・' : '') + mk.desc + '</small></span></button>'; }).join('') + '</div>' +
    (G.p.followers > 0 ? '<p class="small">社群已累積 ' + Math.floor(G.p.followers) + ' 個月，粉絲讓人潮多 ' + Math.round(Math.min(G.p.followers * 2, 20)) + '%</p>' : '') + '</div>' +
    '</div><aside class="fc"><h3>🔮 本月預估</h3><dl><dt>預估想上門</dt><dd>' + money(x.fc) + ' ' + t.unit + '</dd><dt>能服務</dt><dd>' + money(x.served) + '</dd>' +
    '<dt>預估營收</dt><dd>' + money(x.rev) + '</dd><dt>進貨成本</dt><dd>−' + money(x.cogs) + '</dd><dt>房租水電薪水行銷</dt><dd>−' + money(x.fixed) + '</dd>' +
    (x.fee ? '<dt>稅與平台抽成</dt><dd>−' + money(x.fee) + '</dd>' : '') + (G.loan ? '<dt>貸款利息</dt><dd>−' + money(Math.round(G.loan.left * G.loan.rate / 12)) + '</dd>' : '') +
    (G.ev.mul && G.ev.mul.cash ? '<dt>事件收支</dt><dd>' + signed(G.ev.mul.cash) + '</dd>' : '') +
    '<dt class="t">預估損益</dt><dd class="t ' + (x.profit < 0 ? 'neg' : 'pos') + '">' + signed(x.profit) + '</dd><dt>月底現金</dt><dd' + (x.cash < 0 ? ' class="neg"' : '') + '>' + money(x.cash) + '</dd></dl>' +
    (x.lostCap > 0 ? '<div class="warnline">⚠ 人手不夠，約 ' + money(x.lostCap) + ' ' + t.unit + '會等不到而離開</div>' : '') +
    (x.cash < 0 ? '<div class="warnline">⚠ 月底現金可能變負數！</div>' : '') +
    '<p class="small" style="color:#C8D0F0;margin:.4rem 0 0">實際人潮會有 ±12% 的起伏。</p><button class="btn gold big" data-act="run">▶ 開始營業這個月</button></aside></div></section>';
  return h + footer();
}

/* ---------- 月報 ---------- */
function plRow(n, v, cls){ return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td>' + n + '</td><td class="n' + (v < 0 && cls === 't' ? ' neg' : v > 0 && cls === 't' ? ' pos' : '') + '">' + signed(v) + '</td></tr>'; }
function reportView(){
  var r = G.hist[G.hist.length - 1], t = D.TYPES[G.c.type], e = r.ev ? D.EV[r.ev.id] : null;
  var h = topBar() + hud() + '<div class="scene">' + sceneSvg(G, r) + '<span class="mlabel">' + monthLabel(G, r.month) + '・結算</span></div>';
  h += '<section class="card"><p class="bigmsg ' + (r.profit >= 0 ? 'pos' : 'neg') + '">' + (r.profit >= 0 ? '這個月賺了 ' : '這個月虧了 ') + yuan(Math.abs(r.profit)) + '</p>' +
    '<p style="text-align:center;margin:0">想上門 ' + money(r.demand) + '（預估 ' + money(r.forecast) + '）・實際服務 ' + money(r.served) + ' ' + t.unit + '・客人滿意度 ' + pct(r.sat) + '・口碑 ' + (r.dRep >= 0 ? '↑' : '↓') + '</p>' +
    '<div class="report"><div><h3>📒 損益表</h3><table class="pl">' + plRow('營業收入', r.revenue) + plRow('進貨成本' + (r.waste ? '（含報廢 ' + money(r.waste) + '）' : ''), -r.cogs) +
    plRow('房租', -r.rent) + plRow('水電雜支', -(r.util + r.misc)) + plRow('員工薪資（含雇主負擔）', -r.payroll) + (r.mkt ? plRow('行銷', -r.mkt) : '') +
    (r.tax ? plRow('營業稅（遊戲簡化 1%）', -r.tax) : '') + (r.fee ? plRow('外送平台抽成', -r.fee) : '') + (r.interest ? plRow('貸款利息', -r.interest) : '') + (r.oneOff ? plRow('事件收支', r.oneOff) : '') +
    plRow('本月損益', r.profit, 't') + '</table>' +
    (r.loanPay ? '<p class="small">另外還了貸款本金 ' + money(r.loanPay - r.interest) + ' 元（不算費用，但現金會減少）。月底現金 <b>' + yuan(r.cash) + '</b>。</p>' : '<p class="small">月底現金 <b>' + yuan(r.cash) + '</b>。</p>') +
    '<p class="small">💡 老闆自己的薪水沒有算在裡面——賺的錢就是你的薪水。</p></div>' +
    '<div><h3>🧑‍🏫 經營教練</h3>' + r.tips.map(function(tp){ var tt = D.TOOLS[tp.tool]; return '<div class="tip"><span>' + esc(tp.t) + '</span>' + (tt ? '<a class="tl" data-tool="' + tp.tool + '" href="' + D.toolUrl(tp.tool) + '" target="_blank" rel="noopener">' + tt.ic + ' ' + esc(tt.n) + ' ↗</a>' : '') + '</div>'; }).join('') +
    (e ? '<p class="small" style="margin-top:.6rem">本月事件：' + e.ic + ' ' + esc(e.title) + ' → ' + esc(e.ch[r.ev.ch].t) + '</p>' : '') +
    '<h3 style="margin-top:.8rem">📈 每月損益與現金</h3><div class="chart">' + chartSvg() + '</div></div></div>' +
    '<div class="go" style="justify-content:center"><button class="btn gold big" data-act="nextMonth">' + (G.stage === 'end' ? '🏁 看年度結算' : G.stage === 'crisis' ? '😰 現金不夠了…' : '➡ 進入' + monthLabel(G, G.month)) + '</button></div></section>';
  return h + footer();
}
function chartSvg(){
  var hs = G.hist, W = 360, H = 160, pad = 24, top = 18, bot = H - 16, n = D.MONTHS, bw = (W - pad * 2) / n;
  var maxP = Math.max(10000, Math.max.apply(null, hs.map(function(h){ return h.profit; }))), minP = Math.min(0, Math.min.apply(null, hs.map(function(h){ return h.profit; })));
  if(minP < 0) minP = Math.min(minP, -maxP * .15);
  var y = function(v){ return top + (maxP - v) / (maxP - minP) * (bot - top); }, zero = y(0);
  var cashes = hs.map(function(h){ return h.cash; }), maxC = Math.max.apply(null, cashes.concat([1])), minC = Math.min.apply(null, cashes.concat([0]));
  var yc = function(v){ return top + (maxC - v) / ((maxC - minC) || 1) * (bot - top); };
  var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="每月損益長條與現金折線"><line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + zero + '" y2="' + zero + '" stroke="#999"/>';
  hs.forEach(function(h, i){ var a = y(Math.max(h.profit, 0)), b = y(Math.min(h.profit, 0)); s += '<rect x="' + (pad + i * bw + 3) + '" y="' + a.toFixed(1) + '" width="' + (bw - 6) + '" height="' + Math.max(1, b - a).toFixed(1) + '" fill="' + (h.profit >= 0 ? '#22A57F' : '#E8553F') + '" rx="2"><title>' + h.cal + ' 月損益 ' + signed(h.profit) + ' 元</title></rect>'; });
  var pts = cashes.map(function(c, i){ return (pad + i * bw + bw / 2).toFixed(1) + ',' + yc(c).toFixed(1); }).join(' ');
  if(hs.length > 1) s += '<polyline points="' + pts + '" fill="none" stroke="#24305E" stroke-width="2.5" stroke-dasharray="5 3"/>';
  for(var i = 0; i < n; i++) s += '<text x="' + (pad + i * bw + bw / 2) + '" y="' + (H - 3) + '" font-size="9" text-anchor="middle" fill="#5D6385">' + (((D.START_MONTH - 1 + i) % 12) + 1) + '月</text>';
  return s + '<text x="' + pad + '" y="11" font-size="10" fill="#5D6385">■ 每月損益（綠賺紅虧）　- - 月底現金（另一個刻度）</text></svg>';
}
function evLine(e, ci){ return e.ic + ' ' + esc(e.title) + (/[！？]$/.test(e.title) ? ' ' : '：') + esc(e.ch[ci].t); }

/* ---------- 危機 ---------- */
function crisisView(){
  var r = G.hist[G.hist.length - 1];
  return topBar() + hud() + '<section class="card"><h2>😰 現金見底了</h2><p>' + monthLabel(G, r.month) + '結束時，帳上現金變成 <b style="color:var(--bad)">' + yuan(G.cash) + '</b>。房租和薪水付不出來了。</p>' +
    '<p>你可以向銀行申請<b>緊急周轉貸款</b>（年利率 8%，遊戲設定），把店撐下去；或是現在收掉，停止損失。</p>' +
    '<div class="alert warn">銀行會用 5C 看你：品格、還款能力、資本、擔保、經營條件。連續虧損的店很難借到錢——這次是遊戲給你的最後一次機會，下次現金再變負數就只能收店。</div>' +
    toolsBox(['credit-5c-risk-diagnosis', 'expense-tracker-pwa'], '先看看銀行會怎麼評估你') +
    '<div class="go"><button class="btn" data-act="rescueYes">🏦 申請周轉，繼續經營</button><button class="btn red" data-act="rescueNo">🚪 收掉店，看結算</button></div></section>' + footer();
}

/* ---------- 結算 ---------- */
function endView(){
  var f = D.finalScore(G), t = D.TYPES[G.c.type], per = D.persona(G);
  if(!G.saved){ G.saved = true; addBoard(f); save(); if('SAB'.indexOf(f.grade) >= 0) setTimeout(confetti, 200); }
  var title = G.over === 'done' ? '撐過第一年了！' : G.over === 'closed' ? '店收掉了' : '店撐不下去了';
  var h = topBar() + '<section class="card"><div class="grade"><div class="g ' + f.grade + '">' + f.grade + '</div><div style="flex:1 1 16rem"><h2>' + title + '</h2>' +
    '<p style="margin:.2rem 0">' + esc(shopTitle(G)) + '｜' + per.ic + ' ' + per.n + '｜' + D.LOCS[G.c.loc].n + '・' + D.POS[G.c.pos].n + '</p><p class="lead">' + D.GRADE_TXT[f.grade] + '</p></div></div>' +
    '<div class="kp"><div><span>總分</span><b>' + f.score + '</b></div><div><span>平均每月損益</span><b style="color:' + (f.avg >= 0 ? 'var(--good)' : 'var(--bad)') + '">' + signed(f.avg) + '</b></div>' +
    '<div><span>全年營收</span><b>' + wan(f.totalRev) + '</b></div><div><span>全年損益</span><b>' + signed(f.totalProfit) + '</b></div>' +
    '<div><span>有賺錢的月份</span><b>' + f.prof + ' / ' + f.months + '</b></div><div><span>開辦費回本</span><b>' + Math.round(Math.max(0, f.payback) * 100) + '%</b></div>' +
    '<div><span>最後口碑</span><b class="stars">' + stars(G.rep) + '</b></div><div><span>籌備小考</span><b>⭐ ' + G.stars + ' / 4</b></div></div>' +
    '<p class="small">評等標準：S＝平均每月賺 6 萬以上且口碑好；A＝賺到一份薪水（3.3 萬以上）；B＝有賺；C＝小虧；D＝大虧或沒撐完 12 個月。關卡代碼 <b>' + esc(G.code) + '</b>。</p>' +
    '<div class="chart" style="max-width:34rem">' + chartSvg() + '</div></section>';
  h += '<section class="card"><h2>📜 這一年發生的事</h2><ul class="logl">' + G.hist.map(function(r){ var e = r.ev ? D.EV[r.ev.id] : null; return '<li><span class="m">' + r.cal + ' 月</span><span>' + (e ? evLine(e, r.ev.ch) : '') + '</span><span class="p" style="color:' + (r.profit >= 0 ? 'var(--good)' : 'var(--bad)') + '">' + signed(r.profit) + '</span></li>'; }).join('') + '</ul></section>';
  h += '<section class="card"><h2>🚀 換真的來：把你的店帶去真實工具</h2><p class="lead">遊戲裡的決定，在真實世界都有對應的工具。下面第一個會把你的店型、員工數、營業額<b>直接帶進</b>開店前置清單，從那裡還能再一鍵帶到鳳凰貸款申請書。</p>' +
    '<div class="tgrid" style="margin-top:.5rem">' + toolCard('shop-opening-checklist', D.checklistUrl(G)) + toolCard(G.c.type === 'brunch' || G.c.type === 'drink' ? 'restaurant-feasibility-calculator' : 'business-model-canvas-generator') +
    toolCard(D.phoenixOk(G) ? 'phoenix-loan-generator' : 'loan-eligibility-checker') + toolCard('credit-5c-risk-diagnosis') + toolCard('annual-marketing-calendar') + toolCard('startup-island') + '</div>' +
    '<div class="go noprint"><button class="btn gold" data-act="copyResult">📋 複製成績（交給老師）</button><button class="btn alt" data-act="print">🖨 列印／存成 PDF</button><button class="btn alt" data-act="passport">🛂 看工具護照</button><button class="btn" data-act="again">🔁 再玩一次</button><button class="btn alt" data-act="sameCode">🎯 同一個代碼換個玩法</button></div></section>';
  return h + footer();
}
function resultText(){ var f = D.finalScore(G), t = D.TYPES[G.c.type]; return '【我的第一家店】代碼 ' + G.code + '｜' + shopTitle(G) + '（' + t.n + '・' + D.LOCS[G.c.loc].n + '・' + D.POS[G.c.pos].n + '）｜評等 ' + f.grade + '｜總分 ' + f.score + '｜平均每月損益 ' + signed(f.avg) + ' 元｜撐了 ' + f.months + ' 個月｜工具護照 ' + Object.keys(STAMPS).length + ' 章'; }
function addBoard(f){
  var b = lsJson('board', []), d = new Date();
  b.push({shop:shopTitle(G), grade:f.grade, score:f.score, avg:f.avg, code:G.code, date:(d.getMonth() + 1) + '/' + d.getDate()});
  b.sort(function(a, c){ return c.score - a.score; }); lsSet('board', JSON.stringify(b.slice(0, 20)));
}
function confetti(){ var w = document.createElement('div'); w.className = 'confetti'; var cs = ['#E8553F', '#F2B134', '#22A57F', '#2F6FC0', '#7A4FB5']; for(var i = 0; i < 70; i++){ var p = document.createElement('i'); p.style.left = Math.random() * 100 + '%'; p.style.background = cs[i % cs.length]; p.style.animationDelay = Math.random() * .8 + 's'; w.appendChild(p); } document.body.appendChild(w); setTimeout(function(){ w.remove(); }, 3800); }

/* ---------- 工具護照 ---------- */
function passportHtml(){
  var ids = Object.keys(D.TOOLS), got = ids.filter(function(i){ return STAMPS[i]; }).length;
  return '<h2>🛂 工具護照 ' + got + ' / ' + ids.length + '</h2><p class="small">在遊戲裡點開過的真實工具會蓋章。紅點＝需要序號才能完整使用。全部都在 <a href="' + D.toolUrl('startup-island') + '" target="_blank" rel="noopener" data-tool="startup-island">🏝 創業島</a> 地圖上。</p><div class="pass">' +
    ids.map(function(i){ var t = D.TOOLS[i]; return '<a class="' + (STAMPS[i] ? 'got' : '') + '" data-tool="' + i + '" href="' + D.toolUrl(i) + '" target="_blank" rel="noopener"><span class="ti">' + t.ic + '</span><b>' + (t.lic ? '<span class="lic"></span>' : '') + esc(t.n) + '</b>' + (STAMPS[i] ? '<span class="small">' + esc(STAMPS[i]) + '</span>' : '') + '</a>'; }).join('') +
    '</div><div class="stack"><button class="btn" data-act="close">關閉</button></div>';
}
function stamp(id){ if(!D.TOOLS[id] || STAMPS[id]) return; var d = new Date(); STAMPS[id] = d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate(); lsSet('stamps', JSON.stringify(STAMPS)); toast('🛂 工具護照蓋章：' + D.TOOLS[id].n); setTimeout(render, 50); }

/* ---------- 彈窗、設定 ---------- */
function openModal(h){ $('modalBox').innerHTML = h; $('modal').classList.add('show'); $('modalBox').scrollTop = 0; }
function closeModal(){ $('modal').classList.remove('show'); }
var toastT;
function toast(m){ var o = document.querySelector('.toast'); if(o) o.remove(); var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = m; document.body.appendChild(t); clearTimeout(toastT); toastT = setTimeout(function(){ t.remove(); }, 3000); }
var WARN_HTML = '<h2>⚠ 使用警語</h2><p><b>這是教學用的模擬遊戲，不是投資、財務、法律或稅務建議。</b></p><ul>' +
  '<li>遊戲裡的客單價、來客數、租金、開辦費、薪水、利率、平台抽成、事件效果<b>都是遊戲設定</b>，為了讓人練習判斷而簡化，和真實行情不同；真實開店請用對應的試算工具，或請教會計師、記帳士。</li>' +
  '<li>籌備小考的法規數字（營業稅起徵點每月 10 萬／5 萬元、勞保 5 人強制、就保與職災 1 人以上、食品業者登錄、鳳凰貸款身分與 18 小時課程條件）依 2026 年 11 月查證，之後可能修正，請以主管機關最新公告為準。</li>' +
  '<li>遊戲把營業稅簡化成「達起徵點按 1% 計」（小規模營業人查定課徵的稅率），使用統一發票的營業人稅率不同。</li>' +
  '<li>四位創業者、店家與事件內容全部是虛構的。</li>' +
  '<li>遊戲進度、排行榜與工具護照<b>只存在這台裝置的瀏覽器</b>，不會上傳。清除瀏覽器資料就會不見。</li>' +
  '<li>連到的工具都是另外的網站，部分需要序號（紅點）；帶到「開店前置清單」的只有店型、員工數、營業額等遊戲設定，不含個人資料。</li></ul>';
function showWarn(){ openModal(WARN_HTML + '<div class="stack"><button class="btn" data-act="close">我知道了</button></div>'); }
function sec(id, title, val, body){ return '<details class="set-sec" data-sec="' + id + '"><summary><span class="sst">' + title + '</span><span class="ssv">' + esc(val) + '</span></summary><div class="set-body">' + body + '</div></details>'; }
function openSettings(){
  var board = lsJson('board', []);
  var h = '<div class="top"><h2 style="flex:1 1 0">⚙ 常用設定</h2><button class="ibtn" data-act="foldall">全部展開／收合</button></div>' +
    sec('view', '顯示', lsGet('fs') === 'xl' ? '大字' : '標準字', '<div class="stack"><button class="btn' + (lsGet('fs') === 'xl' ? ' alt' : '') + '" data-fontsize="m">標準字</button><button class="btn' + (lsGet('fs') === 'xl' ? '' : ' alt') + '" data-fontsize="xl">大字（投影用）</button></div>') +
    sec('game', '遊戲進度', G ? shopTitle(G) + '・' + progressText(G) : '沒有進行中的遊戲', '<p class="small">進度每一步都會自動存在這台裝置。</p><div class="stack">' + (G ? '<button class="btn alt" data-act="copyCode">複製關卡代碼 ' + esc(G.code) + '</button><button class="btn red" data-act="abandon">放棄這一局</button>' : '<button class="btn" data-act="home">回首頁開新局</button>') + '</div>') +
    sec('board', '排行榜', board.length + ' 筆', '<div class="stack"><button class="btn red" data-act="clearBoard">清除排行榜</button></div>') +
    sec('pass', '工具護照', Object.keys(STAMPS).length + ' 章', '<div class="stack"><button class="btn alt" data-act="passport">打開工具護照</button><button class="btn red" data-act="clearStamps">清除所有蓋章</button></div>') +
    sec('wipe', '🧹 清除全部資料', '', '<p class="small">一次清掉這台裝置上的遊戲進度、排行榜和工具護照，回到首頁重新開始。字體設定會保留。</p><div class="stack"><button class="btn red" data-act="wipeAll">清除全部資料，重新開始</button></div>') +
    sec('about', '關於本工具', '', '<p>👤 創作者 Mark Tsai（蔡豐全）<br><a href="mailto:tsaimark@gmail.com">tsaimark@gmail.com</a></p><div class="stack"><a class="btn alt" href="manual.html">📖 操作手冊</a><a class="btn alt" href="manual.html#creator">👤 創作者資訊</a><button class="btn alt" data-act="warn">⚠ 使用警語</button>' +
      (standalone ? '' : '<button class="btn alt" data-act="install">📲 加入主畫面</button>') + '</div><p class="small" style="margin-top:.5rem">訪客數 <img src="https://visitor-badge.laobi.icu/badge?page_id=m255525.myfirstshopsim" alt="訪客次數" height="20" loading="lazy" style="vertical-align:middle"></p>') +
    '<div class="stack"><button class="btn" data-act="close">關閉</button></div>';
  openModal(h);
  var open = lsJson('fold', []);
  document.querySelectorAll('.set-sec').forEach(function(d){ d.open = open.indexOf(d.dataset.sec) >= 0; d.addEventListener('toggle', saveFold); });
}
function saveFold(){ var o = []; document.querySelectorAll('.set-sec').forEach(function(d){ if(d.open) o.push(d.dataset.sec); }); lsSet('fold', JSON.stringify(o)); }
function applyView(){ document.documentElement.dataset.fs = lsGet('fs') === 'xl' ? 'xl' : 'm'; }
function confirmBox(msg, act){ openModal('<h2>確定嗎？</h2><p>' + msg + '</p><div class="stack"><button class="btn red" data-act="' + act + '">確定</button><button class="btn alt" data-act="close">取消</button></div>'); }
function copyText(s, ok){ var done = function(){ toast(ok || '已複製'); }; if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(s).then(done, function(){ fallbackCopy(s); done(); }); else { fallbackCopy(s); done(); } }
function fallbackCopy(s){ var t = document.createElement('textarea'); t.value = s; document.body.appendChild(t); t.select(); try{ document.execCommand('copy'); }catch(e){} t.remove(); }
function install(){
  if(window._dp){ window._dp.prompt(); window._dp = null; return; }
  openModal('<h2>📲 加入主畫面</h2><ul><li><b>iPhone／iPad（Safari）</b>：按下方「分享」→「加入主畫面」。</li><li><b>Android（Chrome）</b>：右上角「⋮」→「安裝應用程式」或「加到主畫面」。</li><li><b>電腦（Chrome／Edge）</b>：網址列右邊的安裝圖示。</li></ul><p class="small">加入後可以像 App 一樣打開，進度一樣存在這台裝置。</p><div class="stack"><button class="btn" data-act="close">知道了</button></div>');
}

/* ---------- 主繪製 ---------- */
function render(){
  var h;
  if(!G || V.home) h = homeView();
  else if(G.stage === 'prep') h = prepView();
  else if(V.report) h = reportView();
  else if(G.stage === 'month') h = monthView();
  else if(G.stage === 'crisis') h = crisisView();
  else h = endView();
  $('app').innerHTML = h;
}
function go(fn){ fn(); save(); render(); window.scrollTo(0, 0); }

/* ---------- 事件處理 ---------- */
document.addEventListener('click', function(e){
  var el = e.target.closest('[data-tool]');
  if(el && el.tagName === 'A'){ stamp(el.dataset.tool); return; }
  el = e.target.closest('button,a[data-act]');
  if(!el) return;
  var ds = el.dataset;
  if(ds.persona){ V.newPersona = ds.persona; keepNew(); render(); return; }
  if(ds.fontsize){ lsSet('fs', ds.fontsize); applyView(); openSettings(); return; }
  if(G && G.stage === 'prep' && !V.home){
    if(ds.type){ G.c.type = ds.type; if(G.c.loc && D.TYPES[ds.type].locs.indexOf(G.c.loc) < 0) G.c.loc = null; G.qa = {}; save(); render(); return; }
    if(ds.loc){ G.c.loc = ds.loc; G.qa = G.qa || {}; delete G.qa.be; save(); render(); return; }
    if(ds.pos){ G.c.pos = ds.pos; G.qa = G.qa || {}; delete G.qa.be; save(); render(); return; }
    if(ds.be != null){ G.qa = G.qa || {}; G.qa.be = +ds.be; save(); render(); return; }
    if(ds.q){ G.qa = G.qa || {}; G.qa[ds.q] = +ds.a; save(); render(); return; }
    if(ds.loan){ G.c.loan = ds.loan; if(ds.loan !== 'none' && !G.c.loanAmt) G.c.loanAmt = suggestLoan(); save(); render(); return; }
  }
  if(G && G.stage === 'month' && !V.report && !V.home){
    if(ds.ev != null){ go(function(){ D.chooseEvent(G, +ds.ev); }); return; }
    if(ds.price != null){ G.dec.price = +ds.price; save(); render(); return; }
    if(ds.stock){ G.dec.stock = ds.stock; save(); render(); return; }
    if(ds.staff){ G.dec.staff = D.clamp(G.dec.staff + (+ds.staff), 0, 6); save(); render(); return; }
    if(ds.mkt){ G.dec.mkt = ds.mkt; save(); render(); return; }
  }
  var a = ds.act; if(!a) return;
  if(el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();
  if(A[a]) A[a](el);
});
document.addEventListener('input', function(e){
  if(e.target.id === 'loanAmt'){ G.c.loanAmt = +e.target.value; save(); var L = D.LOANS[G.c.loan]; $('loanAmtV').textContent = wan(G.c.loanAmt); $('loanPmt').textContent = yuan(D.pmt(G.c.loanAmt, L.rate)); }
  if(e.target.id === 'newName' || e.target.id === 'newCode') keepNew();
});
document.addEventListener('change', function(e){
  if(e.target.id === 'loanAmt') render();
  if(e.target.id === 'course'){ G.c.course = e.target.checked; save(); render(); }
});
$('modal').addEventListener('click', function(e){ if(e.target.id === 'modal') closeModal(); });
document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });
function keepNew(){ var n = $('newName'), c = $('newCode'); if(n) V.newName = n.value; if(c) V.newCode = c.value; }
function suggestLoan(){ var need = -D.fundingGap(G) + 3 * fixedEst(); var L = D.LOANS[G.c.loan] || {max:0}; return D.clamp(Math.ceil(Math.max(0, need) / 10000) * 10000, 0, L.max); }
function startNew(code){
  keepNew();
  G = D.newGame({code:D.cleanCode(code) || D.newCode(), persona:V.newPersona, name:V.newName.trim()});
  V.home = false; V.report = false; save(); render(); window.scrollTo(0, 0);
}
var A = {
  close:closeModal, warn:function(){ showWarn(); }, settings:openSettings, install:function(){ closeModal(); install(); },
  passport:function(){ openModal(passportHtml()); },
  home:function(){ closeModal(); V.home = true; V.newCode = D.newCode(); render(); window.scrollTo(0, 0); },
  resume:function(){ V.home = false; render(); window.scrollTo(0, 0); },
  start:function(){ keepNew(); startNew(V.newCode); },
  next:function(){ go(function(){ G.step = Math.min(5, G.step + 1); if(G.step === 5 && G.c.loan === 'none' && D.fundingGap(G) < 0 && D.phoenixOk(G)){ G.c.loan = 'phoenix'; G.c.loanAmt = suggestLoan(); } }); },
  back:function(){ go(function(){ G.step = Math.max(0, G.step - 1); }); },
  suggestLoan:function(){ G.c.loanAmt = suggestLoan(); save(); render(); },
  open:function(){
    if(cashAtOpen() < 0) return;
    var qs = D.prepQuiz(G), qa = G.qa || {}, be = D.breakEvenQuiz(G);
    G.quiz = {}; G.stars = qa.be === be.a ? 1 : 0;
    qs.forEach(function(q){ var ok = qa[q.id] === q.a; G.quiz[q.id] = ok; if(ok) G.stars++; });
    go(function(){ D.openShop(G); }); confetti();
  },
  run:function(){ go(function(){ D.simulate(G, G.dec); V.report = true; }); },
  nextMonth:function(){ go(function(){ V.report = false; }); },
  rescueYes:function(){ go(function(){ D.rescue(G, true); }); toast('借到周轉金 ' + wan(G.rescueAmt)); },
  rescueNo:function(){ go(function(){ D.rescue(G, false); }); },
  again:function(){ V.home = true; V.newCode = D.newCode(); V.newPersona = G.persona; render(); window.scrollTo(0, 0); },
  sameCode:function(){ V.newPersona = G.persona; V.newName = G.name; startNew(G.code); },
  copyResult:function(){ copyText(resultText(), '成績已複製，可以貼到 LINE 或表單'); },
  copyCode:function(){ copyText(G.code, '關卡代碼已複製'); },
  print:function(){ window.print(); },
  abandon:function(){ confirmBox('這一局的進度會刪掉（排行榜和工具護照不受影響）。', 'abandonYes'); },
  wipeAll:function(){ confirmBox('遊戲進度、排行榜、工具護照的蓋章都會刪掉，無法復原（字體設定會保留）。', 'wipeAllYes'); },
  wipeAllYes:function(){
    var keep = {fs:1, fold:1, warnSeen:1, marquee:1};
    try{ Object.keys(localStorage).forEach(function(k){ if(k.indexOf(PFX) === 0 && !keep[k.slice(PFX.length)]) localStorage.removeItem(k); }); }catch(e){}
    G = null; STAMPS = {}; V.home = true; V.report = false; V.newName = ''; V.newPersona = 'mei'; V.newCode = D.newCode();
    closeModal(); render(); window.scrollTo(0, 0); toast('資料已清除，可以開新的一局了');
  },
  abandonYes:function(){ G = null; save(); closeModal(); V.home = true; render(); },
  clearBoard:function(){ confirmBox('排行榜會全部清空。', 'clearBoardYes'); },
  clearBoardYes:function(){ lsDel('board'); closeModal(); render(); toast('排行榜已清除'); },
  clearStamps:function(){ confirmBox('工具護照的蓋章會全部清空。', 'clearStampsYes'); },
  clearStampsYes:function(){ STAMPS = {}; lsDel('stamps'); closeModal(); render(); toast('蓋章已清除'); },
  foldall:function(){ var all = document.querySelectorAll('.set-sec'), any = [].some.call(all, function(d){ return !d.open; }); all.forEach(function(d){ d.open = any; }); }
};

/* ---------- 跑馬燈（工作區共用公告，不可關） ---------- */
function initMarquee(){
  var URL_ = "https://script.google.com/macros/s/AKfycbwKX0DNNbY8y4nf90BFTHtxgfqJcHHcZasRrgycl4QAe52_hkjMWSkYk4xOsqU-JPCROw/exec";
  var REFRESH = 20 * 60 * 1000, bar = $('marqueeBar'), track = $('marqueeTrack'), lastKey = null;
  function appendText(c, text){ var re = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, li = 0, m; while((m = re.exec(text))){ if(m.index > li) c.appendChild(document.createTextNode(text.slice(li, m.index))); var a = document.createElement('a'); a.href = m[2]; a.textContent = m[1]; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.style.color = 'inherit'; a.style.textDecoration = 'underline'; c.appendChild(a); li = re.lastIndex; } if(li < text.length) c.appendChild(document.createTextNode(text.slice(li))); }
  function renderM(items){
    if(!items || !items.length) return;
    var k = JSON.stringify(items); if(k === lastKey) return; lastKey = k; track.innerHTML = '';
    var fr = document.createDocumentFragment();
    function pass(){ items.forEach(function(it, i){ if(i > 0) fr.appendChild(document.createTextNode('　★　')); appendText(fr, String(it)); }); }
    pass(); fr.appendChild(document.createTextNode('　★　')); pass(); track.appendChild(fr);
    bar.classList.add('show'); document.body.classList.add('has-marquee');
    track.style.animationDuration = Math.max(track.scrollWidth / 2 / 60, 12) + 's';
  }
  function fetchM(){ fetch(URL_, {method:'POST', body:JSON.stringify({serial:''})}).then(function(r){ return r.json(); }).then(function(d){ if(d && Array.isArray(d.marquee) && d.marquee.length){ lsSet('marquee', JSON.stringify(d.marquee)); renderM(d.marquee); } }).catch(function(){}); }
  renderM(lsJson('marquee', [])); fetchM(); setInterval(fetchM, REFRESH);
}

window.addEventListener('beforeinstallprompt', function(e){ e.preventDefault(); window._dp = e; });
if('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('service-worker.js').catch(function(){});
(function(){ if(!window.SOC_WATERMARK) return; var w = document.createElement('div'); w.id = 'printWm'; w.setAttribute('aria-hidden', 'true'); w.innerHTML = '<img alt="" src="' + window.SOC_WATERMARK + '">'; document.body.appendChild(w); })();
applyView(); render(); initMarquee();
if(!lsGet('warnSeen')){ lsSet('warnSeen', '1'); showWarn(); }
window._fss = {get G(){ return G; }, set G(v){ G = v; }, V:V, render:render, est:function(d){ return est(d); }, A:A};
})();
