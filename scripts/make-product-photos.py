"""Builds product photos in public/images/products/ from real packshots.

    python scripts/make-product-photos.py <folder-with-source-photos>

The source folder has one sub-folder per brand (pepsi/, 7up/) holding the files named in
PRODUCTS below. Source photos come from Open Food Facts (CC BY-SA 3.0, see
public/images/products/CREDITS.txt). Each one gets its background removed and is placed on the
same clean white square with a size badge, so every size looks different but the catalogue
still looks consistent.
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

OUT = Path(__file__).resolve().parent.parent / 'public' / 'images' / 'products'
SIZE = 800
RED = (227, 41, 52)
FONT = 'C:/Windows/Fonts/arialbd.ttf'

# Each entry: output file → how to build it.
#   src    brand/file in the source folder ('PACK' = five copies of `pack_of`)
#   label  text on the size badge
#   share  how tall the product stands, as a share of the canvas (bigger bottle → taller)
#   mode   'cut' (remove plain background, `tol` = colour tolerance), 'can' (crop a close-up can)
#          or 'photo' (an already-styled photo: just take its centre square)
#   crop   optional (left, top, right, bottom) fractions to trim the photo first
PRODUCTS = {
    # Pepsi
    # 345ml–2.5L: studio photos supplied by the store owner, cropped above their floor reflection.
    'pepsi-345ml': dict(src='pepsi/user-345ml.png', label='345 ml', share=0.62, tol=18, crop=(420 / 1024, 15 / 572, 620 / 1024, 502 / 572)),
    'pepsi-500ml': dict(src='pepsi/user-500ml.png', label='500 ml', share=0.68, tol=18, crop=(420 / 1024, 15 / 572, 620 / 1024, 502 / 572)),
    'pepsi-1l': dict(src='pepsi/user-1l.png', label='1 Litre', share=0.76, tol=18, crop=(420 / 1024, 15 / 572, 620 / 1024, 502 / 572)),
    'pepsi-1500ml': dict(src='pepsi/user-1500ml.png', label='1.5 Litre', share=0.83, tol=18, crop=(420 / 1024, 15 / 572, 620 / 1024, 502 / 572)),
    'pepsi-2500ml': dict(src='pepsi/user-2500ml.png', label='2.5 Litre', share=0.9, tol=18, crop=(420 / 1024, 15 / 572, 620 / 1024, 502 / 572)),
    # TenPacks: can studio shots supplied by the store owner, used as-is (centre square).
    'pepsi-tenpack': dict(src='pepsi/user-can.png', label='10 × 250 ml', mode='photo'),
    'pepsi-tenpack-diet': dict(src='pepsi/user-can-diet.png', label='Diet · 10 × 250 ml', mode='photo'),
    # 7up
    # 345ml: finished studio shot supplied by the store owner, used as-is (centre square).
    '7up-345ml': dict(src='7up/can-user.png', label='345 ml', mode='photo'),
    '7up-500ml': dict(src='7up/bottle-1l-user.png', label='500 ml', share=0.64, tol=18, crop=(420 / 1024, 20 / 572, 620 / 1024, 502 / 572)),
    # 500ml / 1L / 1.5L: studio photo supplied by the store owner (1024×572), cropped above its floor reflection.
    '7up-1l': dict(src='7up/bottle-1l-user.png', label='1 Litre', share=0.76, tol=18, crop=(420 / 1024, 20 / 572, 620 / 1024, 502 / 572)),
    '7up-1500ml': dict(src='7up/bottle-1l-user.png', label='1.5 Litre', share=0.84, tol=18, crop=(420 / 1024, 20 / 572, 620 / 1024, 502 / 572)),
    '7up-2500ml': dict(src='7up/bottle-2500ml-user.png', label='2.5 Litre', share=0.9, tol=18, crop=(425 / 1024, 20 / 572, 620 / 1024, 507 / 572)),
    # Dew
    # All sizes: studio photos supplied by the store owner, cropped above their floor reflection.
    'dew-345ml': dict(src='dew/user-345ml.png', label='345 ml', share=0.62, tol=18, crop=(420 / 1024, 15 / 572, 620 / 1024, 502 / 572)),
    'dew-500ml': dict(src='dew/user-500ml.png', label='500 ml', share=0.68, tol=18, crop=(420 / 1024, 15 / 572, 620 / 1024, 502 / 572)),
    'dew-1l': dict(src='dew/user-1l.png', label='1 Litre', share=0.76, tol=18, crop=(420 / 1024, 15 / 572, 620 / 1024, 502 / 572)),
    'dew-1500ml': dict(src='dew/user-1500ml.png', label='1.5 Litre', share=0.83, tol=18, crop=(420 / 1024, 15 / 572, 620 / 1024, 502 / 572)),
    'dew-2500ml': dict(src='dew/user-2500ml.png', label='2.5 Litre', share=0.9, tol=18, crop=(420 / 1024, 15 / 572, 620 / 1024, 502 / 572)),
    # Bravo
    # All sizes: studio shots supplied by the store owner, used as-is (square around the bottle).
    'bravo-tetra-200ml': dict(src='bravo/user-200ml.png', label='200 ml', mode='photo', crop=(226 / 1024, 0, 798 / 1024, 1)),
    'bravo-300ml': dict(src='bravo/user-300ml.png', label='300 ml', mode='photo', crop=(226 / 1024, 0, 798 / 1024, 1)),
    'bravo-500ml': dict(src='bravo/user-500ml.png', label='500 ml', mode='photo', crop=(233 / 1024, 0, 791 / 1024, 1)),
    'bravo-1000ml': dict(src='bravo/user-1000ml.png', label='1 Litre', mode='photo', crop=(233 / 1024, 0, 791 / 1024, 1)),
    'bravo-1500ml': dict(src='bravo/user-1500ml.png', label='1.5 Litre', mode='photo', crop=(233 / 1024, 0, 791 / 1024, 1)),
    'bravo-2000ml': dict(src='bravo/user-2000ml.png', label='2 Litre', mode='photo', crop=(233 / 1024, 0, 791 / 1024, 1)),
    # Sting
    # Red 500ml: product shot supplied by the store owner (white background), used as-is.
    'sting-red-500ml': dict(src='sting/user-red-500ml.png', label='500 ml', mode='photo'),
    # Mirinda
    # All Mirinda sizes: studio shots (bottle + glass) supplied by the store owner; square around both.
    'mirinda-345ml': dict(src='mirinda/bottle-345ml-user.png', label='345 ml', mode='photo', crop=(448 / 1024, 0, 1020 / 1024, 1)),
    'mirinda-500ml': dict(src='mirinda/bottle-500ml-user.png', label='500 ml', mode='photo', crop=(448 / 1024, 0, 1020 / 1024, 1)),
    'mirinda-1l': dict(src='mirinda/bottle-user.png', label='1 Litre', mode='photo', crop=(436 / 1024, 0, 1008 / 1024, 1)),
    'mirinda-1500ml': dict(src='mirinda/bottle-1500ml-user.png', label='1.5 Litre', mode='photo', crop=(436 / 1024, 0, 1008 / 1024, 1)),
    'mirinda-2500ml': dict(src='mirinda/bottle-2500ml-user.png', label='2.5 Litre', mode='photo', crop=(436 / 1024, 0, 1008 / 1024, 1)),
}


def cut_out(img, tol):
    """Removes a plain background by flood-filling from the photo's edges; returns RGBA."""
    rgb = img.convert('RGB')
    marked = rgb.copy()
    magic = (1, 254, 3)
    w, h = rgb.size
    step = max(1, min(w, h) // 60)
    edge = [(x, 0) for x in range(0, w, step)] + [(x, h - 1) for x in range(0, w, step)]
    edge += [(0, y) for y in range(0, h, step)] + [(w - 1, y) for y in range(0, h, step)]
    # Only start from edge pixels that look like the background (similar to a corner), so a
    # product touching the photo's edge isn't flooded away with it.
    corners = [rgb.getpixel(p) for p in [(1, 1), (w - 2, 1), (1, h - 2), (w - 2, h - 2)]]

    def is_bg(px):
        return any(sum(abs(a - b) for a, b in zip(px, c)) <= tol * 2 for c in corners)

    for xy in edge:
        px = marked.getpixel(xy)
        if px != magic and is_bg(px):
            ImageDraw.floodfill(marked, xy, magic, thresh=tol)
    r, g, b = marked.split()
    bg = ImageChops.multiply(
        ImageChops.multiply(r.point(lambda v: 255 if v == 1 else 0), g.point(lambda v: 255 if v == 254 else 0)),
        b.point(lambda v: 255 if v == 3 else 0),
    )
    solid = ImageChops.invert(bg).filter(ImageFilter.MinFilter(3))
    # Keep only the product itself: the blob under the image centre. Stray specks of
    # background (table edges, shelf bits) that weren't caught above are dropped.
    keep = solid.point(lambda v: 255 if v > 127 else 0)
    seed = (w // 2, h // 2)
    if keep.getpixel(seed) == 255:
        ImageDraw.floodfill(keep, seed, 128)
        keep = keep.point(lambda v: 255 if v == 128 else 0)
    alpha = ImageChops.multiply(solid, keep).filter(ImageFilter.GaussianBlur(1.2))
    out = rgb.convert('RGBA')
    out.putalpha(alpha)
    return out.crop(alpha.getbbox())


def can_crop(img, box=(0.04, 0.06, 0.96, 0.97)):
    """For a close-up can photo: crop to the can body (fractions of the photo), rounded corners."""
    rgb = img.convert('RGB')
    w, h = rgb.size
    body = rgb.crop((int(w * box[0]), int(h * box[1]), int(w * box[2]), int(h * box[3]))).convert('RGBA')
    mask = Image.new('L', body.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, body.width - 1, body.height - 1), radius=body.width // 12, fill=255)
    body.putalpha(mask.filter(ImageFilter.GaussianBlur(1)))
    return body


def pack_of(bottle, count=5):
    """Lines up several copies of one small bottle (back row slightly smaller) as a multipack."""
    bw, bh = bottle.size
    gap = int(bw * 0.78)
    width = gap * (count - 1) + bw + gap // 2
    canvas = Image.new('RGBA', (width, int(bh * 1.08)), (0, 0, 0, 0))
    back = bottle.resize((int(bw * 0.92), int(bh * 0.92)), Image.LANCZOS)
    for i in range(count):
        canvas.alpha_composite(back, (gap // 2 + i * gap, 0))
    for i in range(count):
        canvas.alpha_composite(bottle, (i * gap, canvas.height - bh))
    return canvas.crop(canvas.getchannel('A').getbbox())


# Studio look per brand: soft glowing backdrop, glossy floor reflection, and (for 7up) citrus.
THEMES = {
    'pepsi': dict(centre=(246, 251, 255), edge=(176, 212, 240), fruit=False),
    '7up': dict(centre=(244, 252, 247), edge=(178, 222, 198), fruit=True),
    'dew': dict(centre=(244, 252, 247), edge=(178, 222, 198), fruit=False),  # same backdrop as 7up
}


def backdrop(theme):
    """Radial gradient: bright in the middle, brand tint towards the corners."""
    small = 200
    g = Image.new('RGB', (small, small))
    px = g.load()
    c, e = theme['centre'], theme['edge']
    for y in range(small):
        for x in range(small):
            d = min(1.0, (((x - small / 2) / (small * 0.62)) ** 2 + ((y - small * 0.42) / (small * 0.62)) ** 2) ** 0.5)
            px[x, y] = tuple(int(c[i] + (e[i] - c[i]) * d) for i in range(3))
    return g.resize((SIZE, SIZE), Image.BICUBIC).convert('RGBA')


def citrus_slice(r, rind, pith, flesh, half=False):
    """A cut lemon/lime seen face-on: rind, pith ring, juicy segments. `half` gives a wedge."""
    size = r * 2 + 4
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = size / 2
    d.ellipse((c - r, c - r, c + r, c + r), fill=rind)
    d.ellipse((c - r * 0.9, c - r * 0.9, c + r * 0.9, c + r * 0.9), fill=pith)
    d.ellipse((c - r * 0.82, c - r * 0.82, c + r * 0.82, c + r * 0.82), fill=flesh)
    light = tuple(min(255, v + 45) for v in flesh[:3]) + (255,)
    for k in range(10):  # segment walls
        a = k * 36
        d.pieslice((c - r * 0.8, c - r * 0.8, c + r * 0.8, c + r * 0.8), a + 3, a + 33, fill=light)
    d.ellipse((c - r * 0.1, c - r * 0.1, c + r * 0.1, c + r * 0.1), fill=pith)
    if half:
        mask = Image.new('L', img.size, 0)
        ImageDraw.Draw(mask).pieslice((0, 0, size, size), 180, 360, fill=255)
        img.putalpha(ImageChops.multiply(img.getchannel('A'), mask))
        img = img.crop(img.getchannel('A').getbbox())
    return img


def place(product, height_share, theme=THEMES['pepsi']):
    canvas = backdrop(theme)
    max_h = int(SIZE * height_share * 0.9)
    max_w = int(SIZE * 0.8)
    scale = min(max_h / product.height, max_w / product.width)
    p = product.resize((max(1, int(product.width * scale)), max(1, int(product.height * scale))), Image.LANCZOS)
    floor = int(SIZE * 0.8)
    x, y = (SIZE - p.width) // 2, floor - p.height

    # Glossy floor: a faded, flipped copy of the product under it.
    refl = p.transpose(Image.FLIP_TOP_BOTTOM).crop((0, 0, p.width, min(p.height, SIZE - floor)))
    fade = Image.linear_gradient('L').resize(refl.size).point(lambda v: int((255 - v) * 0.28))
    refl.putalpha(ImageChops.multiply(refl.getchannel('A'), fade))
    canvas.alpha_composite(refl, (x, floor + 2))

    shadow = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse((x + p.width * 0.1, floor - 8, x + p.width * 0.9, floor + 10), fill=(0, 0, 0, 60))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(8)))
    canvas.alpha_composite(p, (x, y))

    if theme['fruit']:
        r = int(min(110, max(70, p.width * 0.42)))
        lime = citrus_slice(r, (92, 160, 40, 255), (232, 245, 200, 255), (176, 214, 92, 255))
        lemon = citrus_slice(int(r * 0.95), (240, 196, 30, 255), (252, 246, 210, 255), (250, 220, 90, 255), half=True)
        lemon = lemon.rotate(-28, expand=True, resample=Image.BICUBIC)
        for fruit, fx in ((lemon, x - fruit_w(lemon) * 0.7), (lime, x + p.width - lime.width * 0.3)):
            fy = floor - fruit.height + int(fruit.height * 0.06)
            sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
            ImageDraw.Draw(sh).ellipse((fx + 10, floor - 6, fx + fruit.width - 10, floor + 8), fill=(0, 0, 0, 55))
            canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
            canvas.alpha_composite(fruit, (int(fx), int(fy)))
    return canvas


def fruit_w(img):
    return img.width


def badge(img, text):
    f = ImageFont.truetype(FONT, 38)
    d = ImageDraw.Draw(img)
    l, t, r, b = d.textbbox((0, 0), text, font=f)
    pad_x, pad_y = 24, 14
    w, h = (r - l) + 2 * pad_x, (b - t) + 2 * pad_y
    x0, y0 = SIZE - w - 32, 32
    d.rounded_rectangle((x0, y0, x0 + w, y0 + h), radius=h // 2, fill=RED)
    d.text((x0 + pad_x - l, y0 + pad_y - t), text, font=f, fill=(255, 255, 255))


def load(src, spec, key='src'):
    photo = Image.open(src / spec[key])
    if spec.get('crop'):
        l, t, r, b = spec['crop']
        photo = photo.crop((int(photo.width * l), int(photo.height * t), int(photo.width * r), int(photo.height * b)))
    return photo


def build(src, spec):
    if spec['src'] == 'PACK':
        return pack_of(cut_out(Image.open(src / spec['pack_of']), spec['tol']))
    photo = load(src, spec)
    if spec.get('mode') == 'can':
        return can_crop(photo)
    out = cut_out(photo, spec['tol'])
    if spec.get('erode'):  # shave the outline to drop a ragged fringe of background
        out.putalpha(out.getchannel('A').filter(ImageFilter.MinFilter(spec['erode'])).filter(ImageFilter.GaussianBlur(1.5)))
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    only = set(sys.argv[2:])  # optional: build just these outputs
    OUT.mkdir(parents=True, exist_ok=True)
    for name, spec in PRODUCTS.items():
        if only and name not in only:
            continue
        if spec.get('mode') == 'photo':
            photo = load(src, spec).convert('RGB')
            side = min(photo.size)
            left, top = (photo.width - side) // 2, (photo.height - side) // 2
            img = photo.crop((left, top, left + side, top + side)).resize((SIZE, SIZE), Image.LANCZOS).convert('RGBA')
        else:
            theme = THEMES[next((t for t in THEMES if name.startswith(t + '-')), 'pepsi')]
            img = place(build(src, spec), spec['share'], theme)
        badge(img, spec['label'])
        img.convert('RGB').save(OUT / f'{name}.jpg', quality=86, optimize=True, progressive=True)
        print(f'public/images/products/{name}.jpg')


if __name__ == '__main__':
    main()
