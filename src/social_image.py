"""Make a 1080x1350 NextGen social image (Instagram/Facebook).

Usage (from repo root):
  python3 src/social_image.py <slug> "<label>" "<headline>" ["<sub line>"]
Writes social/<slug>.png, served at https://nextgenca.co.uk/social/<slug>.png
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'
F = R + 'src/fonts/'
NAVY = (18, 40, 74); NAVY_DEEP = (11, 27, 52); GOLD = (201, 162, 77); WHITE = (255, 255, 255); MIST = (201, 211, 227)
W, H = 1080, 1350


def font(name, size):
    return ImageFont.truetype(F + name, size)


def wrap(draw, text, fnt, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if draw.textlength(t, font=fnt) <= width:
            cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines


def make(slug, label, headline, sub=''):
    img = Image.new('RGB', (W, H), NAVY)
    d = ImageDraw.Draw(img)
    # subtle diagonal band
    d.polygon([(W * 0.62, 0), (W, 0), (W, H), (W * 0.38, H)], fill=NAVY_DEEP)
    pad = 90
    # label
    lf = font('Inter-Bold.otf', 30)
    d.line([(pad, 168), (pad + 60, 168)], fill=GOLD, width=3)
    d.text((pad + 80, 150), label.upper(), font=lf, fill=GOLD)
    # headline: shrink to fit
    size = 92
    while True:
        hf = font('LiberationSerif-Bold.ttf', size)
        lines = wrap(d, headline, hf, W - 2 * pad)
        if len(lines) * size * 1.12 <= 640 or size <= 52:
            break
        size -= 4
    y = 250
    for ln in lines:
        d.text((pad, y), ln, font=hf, fill=WHITE)
        y += int(size * 1.12)
    if sub:
        sf = font('Inter-Regular.otf', 36)
        y += 30
        for ln in wrap(d, sub, sf, W - 2 * pad)[:4]:
            d.text((pad, y), ln, font=sf, fill=MIST)
            y += 50
    # footer
    d.line([(pad, H - 250), (W - pad, H - 250)], fill=GOLD, width=2)
    chip = Image.new('RGB', (150, 112), WHITE)
    mark = Image.open(R + 'img/mark.jpg').convert('RGB'); mark.thumbnail((136, 100))
    chip.paste(mark, ((150 - mark.width) // 2, (112 - mark.height) // 2))
    img.paste(chip, (pad, H - 200))
    d.text((pad + 180, H - 196), 'NextGen Chartered Accountant', font=font('Inter-Bold.otf', 38), fill=WHITE)
    d.text((pad + 180, H - 146), 'By Sheryar Ahmed ACA FCCA  ·  nextgenca.co.uk', font=font('Inter-Regular.otf', 30), fill=MIST)
    os.makedirs(R + 'social', exist_ok=True)
    out = R + 'social/' + slug + '.png'
    img.save(out, optimize=True)
    return out


if __name__ == '__main__':
    print(make(*sys.argv[1:5]))
