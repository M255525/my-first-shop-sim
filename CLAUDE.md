# my-first-shop-sim — 我的第一家店：開店經營模擬

教學用經營模擬遊戲。選創業者（4 位虛構人物）→ 籌備 6 關（店型、地點、定位、損益兩平小試算、開店手續小考 3 題、資金與貸款）→ 開幕後經營 12 個月（4 月開幕；每月先處理一個隨機事件，再決定售價／備貨／員工／行銷，右側即時預估）→ 月報（損益表＋經營教練＋圖表）→ 結算評等 S～D。**每一關、每個事件、每則教練建議都附一個真實的線上工具**（24 個，全是 m255525.github.io 的工具），點開會在「🛂 工具護照」蓋章；結算時用 `#s=` 把店直接帶進開店前置清單（再從那裡可接鳳凰貸款）。

2026-11-13 建立。使用者要求「製作經營模擬遊戲，把所有創業工具串起來」。

- 純靜態：`index.html`（CSS）＋`data.js`（遊戲資料＋引擎，node 可 require）＋`app.js`（畫面）＋`watermark.js`（列印浮水印，`SOC_WATERMARK`，從開店清單複製）＋`manual.html`＋PWA。
- 本機預覽 port **8877**（`.claude/launch.json` 的 `my-first-shop-sim`）。visitor-badge `m255525.myfirstshopsim`。
- 部署：`.github/workflows/pages.yml`（push master 自動部署 GitHub Pages）：<https://m255525.github.io/my-first-shop-sim/>（2026-11-13 上線；repo 由使用者自己 `gh repo create`）。程式牆在 REPO_META（不在 LOCAL_APPS）。

## 引擎（data.js）
- **所有金額、利率、來客、事件效果都是遊戲設定**，頁面與手冊都有警語。真實法規只出現在小考：起徵點 10 萬／5 萬、勞保 5 人、就保職災 1 人、食品業者登錄（食安法 §8）、鳳凰貸款身分（女性未滿 45／45～65／65 歲以下設籍離島）＋3 年內 18 小時課程——數字來源同開店前置清單與創業貸款資格核對，改規定要同步。
- 亂數：`R(G, salt)`＝`hash(code:month:salt)` 的 mulberry32；**同一個關卡代碼＝同樣的事件與人潮起伏**（課堂比分用）。
- 需求 `demandBase()`：店型基準 × 地點 × 淡旺季 × 定位 × 售價彈性 × 口碑 × 行銷（社群粉絲累積每月 +2%，上限 20%）× 長期效果 × 事件。服務量 `capacity()`＝每人產能 ×（1＋0.9×員工）。吃的備貨沒賣完報廢，雜貨／手作留庫存。
- 評等看**平均每月損益**（老闆沒領薪水，賺的就是薪水）：S ≥ 6 萬且口碑 ≥ 0.6、A ≥ 3.3 萬、B ≥ 0、C ≥ −3 萬、其餘或沒撐完 12 個月＝D。現金負數有一次緊急周轉（`rescue`），第二次直接收店。
- 事件 `EVENTS`：`cond/months/minMonth/once/w`，選項效果 `e` 分當月（dem/cash/rep/sat）與長期（rentAdd/cogsAdd/wageAdd/satAdd/demAdd、delivery/competitor/pos 開關、loanAdd）。`tax` 事件在營收首次超過起徵點的下個月強制出現；`inspect` 依小考有沒有答對食品登錄而不同。事件池空了退回 `quiet`。
- `checklistCtx()` 對應開店前置清單的 ctx（type food/retail/online/beauty、place rent/home/spot、org 依店型建議）；接收端 `cleanCtx` 不認得的值整包丟掉，改對應表要重測。
- 平衡腳本：`node tools/sim_balance.cjs`（聰明／偷懶兩種策略 × 全部店型地點定位）、`node tools/sim_month.cjs`（每月平均損益）。目前聰明玩法平均月賺約 0.5～5 萬、偷懶多半 C/D。
- **改 data.js 後跑 `node tools/test_engine.mjs`**（隨機 3000 局：數值有限、事件條件成立、工具存在、同代碼可重現、小考答案、開店清單 ctx 合法）。

## 畫面（app.js）
- localStorage 前綴 `fss.`：`game`（整局 G，每步自動存）、`board`（排行榜前 20）、`stamps`（工具護照 {id:日期}）、`fs`、`fold`、`warnSeen`、`marquee`。⚙「🧹 清除全部資料」（首頁未完成局旁也有）清掉 fs／fold／warnSeen／marquee 以外的 `fss.*`。
- 畫面依 `G.stage`：prep／month（`V.report` 時顯示上月月報）／crisis／end。`est()` 是右側預估（不含亂數），邏輯要跟 `simulate()` 同步。
- 小考選項順序用代碼 seed 洗牌（`shuffled`），資料裡正解一律放 index 0（測試有檢查）。
- 點任何 `a[data-tool]` 都會蓋章。結算畫面只有 S/A/B 撒彩帶。
- 測試掛鉤 `window._fss`。端對端：`python tools/e2e_play.py <輸出資料夾> [寬度]`（需先開 8877，會擋掉跑馬燈請求）。

## 標準配備
跑馬燈（工作區公告 GAS，滑鼠移入暫停，不可關）、⚙ 常用設定（收合式＋關於本工具）、首訪警語＋頁面入口、`manual.html#creator` 完整版（改 `tools/manual_body.html` 後跑 `python tools/build_manual.py`）、PWA（`tools/make_icons.py`；上線改版升 `service-worker.js` 的 `CACHE_NAME`）、訪客計數器、列印浮水印。無序號、無 AI。
