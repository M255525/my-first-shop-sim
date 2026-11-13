# 產生 PWA 圖示：深藍底＋金色遮雨棚小店＋上升的長條圖
import os
from PIL import Image, ImageDraw
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons')
os.makedirs(out, exist_ok=True)

def draw(size, pad):
    s = 4 * size
    im = Image.new('RGB', (s, s), '#24305E')
    d = ImageDraw.Draw(im)
    x0, x1 = pad * s, (1 - pad) * s
    w = x1 - x0
    top = pad * s + w * .12
    # 店身
    d.rectangle([x0 + w * .1, top + w * .22, x1 - w * .1, x1 - w * .06], fill='#FBF4E6')
    # 遮雨棚
    n = 5; sw = (w * .9) / n; ah = w * .14
    for i in range(n):
        c = '#F2B134' if i % 2 == 0 else '#E8553F'
        xa = x0 + w * .05 + i * sw
        d.rectangle([xa, top, xa + sw, top + ah], fill=c)
        d.pieslice([xa, top + ah - sw / 2, xa + sw, top + ah + sw / 2], 0, 180, fill=c)
    # 門
    d.rectangle([x0 + w * .42, top + w * .5, x0 + w * .58, x1 - w * .06], fill='#8B5E3C')
    # 長條圖（櫥窗）
    base = x1 - w * .12
    for i, hgt in enumerate([.12, .2, .3]):
        bx = x0 + w * .16 + i * w * .07
        d.rectangle([bx, base - w * hgt, bx + w * .05, base], fill='#22A57F')
    for i, hgt in enumerate([.3, .2, .12]):
        bx = x0 + w * .66 + i * w * .07
        d.rectangle([bx, base - w * hgt, bx + w * .05, base], fill='#22A57F' if i == 0 else '#E8553F' if i == 2 else '#F2B134')
    return im.resize((size, size), Image.LANCZOS)

draw(192, .08).save(os.path.join(out, 'icon-192.png'))
draw(512, .08).save(os.path.join(out, 'icon-512.png'))
draw(512, .2).save(os.path.join(out, 'icon-maskable-512.png'))
print('ok')
