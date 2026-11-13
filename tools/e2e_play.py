# 自動玩一局：首頁 → 籌備 6 關 → 12 個月 → 結算，逐步截圖（只在本機跑）
import sys, io, os, json
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
from playwright.sync_api import sync_playwright
OUT = sys.argv[1]; W = int(sys.argv[2]) if len(sys.argv) > 2 else 1280
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': W, 'height': 900})
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
    pg.route('**/script.google.com/**', lambda r: r.fulfill(status=200, body='{"marquee":["測試公告：跑馬燈正常"]}', headers={'content-type': 'application/json'}))
    pg.goto('http://127.0.0.1:8877/')
    pg.wait_for_timeout(800)
    shot = lambda n: pg.screenshot(path=os.path.join(OUT, n), full_page=True)
    shot('01_warn.png')
    pg.click('#modal .btn')
    shot('02_home.png')
    pg.click('[data-persona=mei]'); pg.fill('#newName', '晨光巷早午餐'); pg.fill('#newCode', 'CLASS1')
    pg.click('[data-act=start]')
    pg.click('[data-type=brunch]'); shot('03_type.png'); pg.click('[data-act=next]')
    pg.click('[data-loc=alley]'); shot('04_loc.png'); pg.click('[data-act=next]')
    pg.click('[data-pos=standard]'); pg.click('[data-act=next]')
    pg.click('[data-be="0"]'); shot('05_be.png'); pg.click('[data-act=next]')
    for qid in ['tax', 'food', 'li']:
        pg.click(f'[data-q={qid}][data-a="0"]')
    shot('06_quiz.png'); pg.click('[data-act=next]')
    pg.check('#course'); pg.click('[data-loan=phoenix]'); pg.click('[data-act=suggestLoan]')
    shot('07_fund.png')
    pg.click('[data-act=open]'); pg.wait_for_timeout(300)
    shot('08_opening.png')
    for m in range(14):
        st = pg.evaluate('_fss.G && _fss.G.stage')
        if st == 'end': break
        if st == 'crisis':
            pg.click('[data-act=rescueYes]'); continue
        if pg.locator('[data-ev]').count(): pg.click('[data-ev="0"]')
        if m == 0: shot('09_month.png')
        pg.click('[data-act=run]')
        if m in (0, 5): shot(f'10_report_{m}.png')
        pg.click('[data-act=nextMonth]')
    pg.wait_for_timeout(400)
    shot('11_end.png')
    g = pg.evaluate('JSON.stringify({stage:_fss.G.stage, over:_fss.G.over, cash:_fss.G.cash, n:_fss.G.hist.length, stamps:localStorage.getItem("fss.stamps")})')
    print(g)
    # 工具連結點擊會蓋章
    with pg.expect_popup() as pop: pg.click('.tcard[data-tool=shop-opening-checklist]')
    url = pop.value.url; pop.value.close()
    print('checklist url', url[:90])
    pg.click('[data-act=passport]'); shot('12_passport.png')
    print('scrollW', pg.evaluate('document.documentElement.scrollWidth'), 'clientW', pg.evaluate('document.documentElement.clientWidth'))
    print('errors', errs)
    b.close()
