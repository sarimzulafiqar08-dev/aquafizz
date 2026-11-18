"""Builds the Deal Box pictures in public/images/products/deal-*.jpg.

    python scripts/make-deal-photos.py <folder-with-product-photos>

The folder holds each product's current cover photo as <slug>.img (any image format).
Each deal picture shows its products as tiles with the deal name, price and saving, on white.
Photos in collage/ (if present) become the Deal Boxes category picture
(public/images/categories/deal-boxes.jpg), which the Home hero also shows.
Keep DEALS in sync with supabase/data/deal_boxes.sql.
"""
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

OUT = Path(__file__).resolve().parent.parent / 'public' / 'images' / 'products'
SIZE = 800
BOLD = 'C:/Windows/Fonts/arialbd.ttf'
REGULAR = 'C:/Windows/Fonts/arial.ttf'

# file → (title, product slugs shown, full price, deal price)
DEALS = {
    'deal-family-party': ('Family Party Deal', ['pepsi-1500ml', '7up-3', 'mirinda-4', 'dew-4'], 4200, 3799),
    'deal-big-bottle': ('Big Bottle Deal', ['pepsi-2500ml', '7up-4', 'mirinda-5', 'dew-5'], 3600, 3249),
    'deal-iftar': ('Iftar Deal', ['pepsi-1500ml', 'mirinda-4', 'bravo-4', 'aquafina'], 3690, 3349),
    'deal-energy': ('Energy Deal', ['sting-red', 'sting-blue', 'dew-3'], 3720, 3399),
    'deal-lunch-box': ('Lunch Box Deal', ['pepsi-345ml', '7up', 'mirinda', 'dew'], 3400, 3049),
}


def font(path, size):
    return ImageFont.truetype(path, size)


def rs(n):
    return f'Rs {n:,}'


RED = (210, 30, 45)
INK = (25, 30, 40)


# Same studio backdrop as the 7up product photos (THEMES['7up'] in make-product-photos.py).
BACK_CENTRE = (244, 252, 247)
BACK_EDGE = (178, 222, 198)


def backdrop(w=SIZE, h=SIZE):
    """Soft mint radial gradient: bright in the middle, greener towards the corners."""
    small = 200
    g = Image.new('RGB', (small, small))
    px = g.load()
    for y in range(small):
        for x in range(small):
            d = min(1.0, (((x - small / 2) / (small * 0.62)) ** 2 + ((y - small * 0.42) / (small * 0.62)) ** 2) ** 0.5)
            px[x, y] = tuple(int(BACK_CENTRE[i] + (BACK_EDGE[i] - BACK_CENTRE[i]) * d) for i in range(3))
    return g.resize((w, h), Image.BICUBIC).convert('RGBA')


def tile(photo, w, h):
    """A white rounded card with the product photo fitted inside."""
    card = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), radius=22, fill=255)
    pic = photo.convert('RGB')
    side = min(pic.size)
    left, top = (pic.width - side) // 2, (pic.height - side) // 2
    pic = pic.crop((left, top, left + side, top + side)).resize((w, h), Image.LANCZOS)
    card.paste(pic, (0, 0), mask)
    ImageDraw.Draw(card).rounded_rectangle((0, 0, w - 1, h - 1), radius=22, outline=(228, 231, 236, 255), width=2)
    return card


def drop_shadow(canvas, box, radius=22):
    sh = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    x0, y0, x1, y1 = box
    ImageDraw.Draw(sh).rounded_rectangle((x0 + 4, y0 + 10, x1 + 4, y1 + 10), radius=radius, fill=(60, 0, 0, 110))
    canvas.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))


def build(title, photos, full, deal):
    img = backdrop()
    d = ImageDraw.Draw(img)

    # Header: small "DEAL BOX" tag + title
    tag_f = font(BOLD, 24)
    d.rounded_rectangle((40, 34, 40 + 150, 34 + 40), radius=20, fill=RED)
    d.text((40 + 75, 34 + 20), 'DEAL BOX', font=tag_f, fill=(255, 255, 255), anchor='mm')
    d.text((40, 92), title, font=font(BOLD, 58), fill=INK)

    # Product tiles
    n = len(photos)
    area_top, area_bottom = 180, 620
    gap = 18
    if n == 4:
        w = h = (area_bottom - area_top - gap) // 2
        cols = 2
    else:
        w = (SIZE - 80 - gap * (n - 1)) // n
        h = int(w * 1.0)
        cols = n
    rows = (n + cols - 1) // cols
    grid_w = cols * w + (cols - 1) * gap
    grid_h = rows * h + (rows - 1) * gap
    x_start = (SIZE - grid_w) // 2
    y_start = area_top + (area_bottom - area_top - grid_h) // 2
    for i, photo in enumerate(photos):
        r, c = divmod(i, cols)
        x, y = x_start + c * (w + gap), y_start + r * (h + gap)
        drop_shadow(img, (x, y, x + w, y + h))
        img.alpha_composite(tile(photo, w, h), (x, y))

    # Price bar
    d = ImageDraw.Draw(img)
    bar = (40, 650, SIZE - 40, 760)
    d.rounded_rectangle(bar, radius=30, fill=(248, 249, 251), outline=(230, 232, 236), width=2)
    d.text((70, 705), rs(deal), font=font(BOLD, 60), fill=RED, anchor='lm')
    old_f = font(REGULAR, 32)
    old_x = 70 + d.textlength(rs(deal), font=font(BOLD, 60)) + 24
    d.text((old_x, 712), rs(full), font=old_f, fill=(120, 120, 120), anchor='lm')
    ow = d.textlength(rs(full), font=old_f)
    d.line((old_x - 2, 712, old_x + ow + 2, 712), fill=(120, 120, 120), width=3)

    # Saving badge
    save = f'SAVE {rs(full - deal)}'
    sf = font(BOLD, 28)
    sw = d.textlength(save, font=sf) + 36
    sx1 = bar[2] - 24
    d.rounded_rectangle((sx1 - sw, 680, sx1, 730), radius=25, fill=(34, 160, 80))
    d.text((sx1 - sw / 2, 705), save, font=sf, fill=(255, 255, 255), anchor='mm')
    return img


def build_category(cuts, best_saving):
    """Wide picture for the Deal Boxes category: four bottles side by side and a DEALS sticker."""
    import math

    W, H = 1200, 750
    img = backdrop(W, H)
    th, floor = 470, 618
    scaled = [c.resize((int(c.width * th / c.height), th), Image.LANCZOS) for c in cuts]
    overlap = 0.12
    total = sum(c.width for c in scaled) - int(sum(c.width for c in scaled[1:]) * overlap)
    x, pos = (W - total) // 2, []
    for c in scaled:
        pos.append(x)
        x += int(c.width * (1 - overlap))
    for c, px in zip(scaled, pos):  # glossy floor reflection
        refl = c.transpose(Image.FLIP_TOP_BOTTOM).crop((0, 0, c.width, H - floor))
        fade = Image.linear_gradient('L').resize(refl.size).point(lambda v: int((255 - v) * 0.2))
        refl.putalpha(ImageChops.multiply(refl.getchannel('A'), fade))
        img.alpha_composite(refl, (px, floor + 2))
    sh = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse((pos[0] + 10, floor - 12, pos[-1] + scaled[-1].width - 10, floor + 16), fill=(20, 30, 50, 70))
    img.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    for c, px in zip(scaled, pos):
        img.alpha_composite(c, (px, floor - th))

    cx, cy, r = 930, 250, 112
    st = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    pts = [
        (cx + (r if i % 2 == 0 else r * 0.86) * math.cos(math.pi * 2 * i / 32),
         cy + (r if i % 2 == 0 else r * 0.86) * math.sin(math.pi * 2 * i / 32))
        for i in range(32)
    ]
    ImageDraw.Draw(st).polygon(pts, fill=RED + (255,))
    st = st.rotate(-12, center=(cx, cy), resample=Image.BICUBIC)
    shs = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shs).ellipse((cx - r + 6, cy - r + 14, cx + r + 6, cy + r + 14), fill=(20, 30, 50, 60))
    img.alpha_composite(shs.filter(ImageFilter.GaussianBlur(10)))
    img.alpha_composite(st)
    d = ImageDraw.Draw(img)
    d.text((cx, cy - 22), 'DEALS', font=font(BOLD, 46), fill=(255, 255, 255), anchor='mm')
    d.text((cx, cy + 24), 'SAVE UP TO', font=font(BOLD, 20), fill=(255, 230, 230), anchor='mm')
    d.text((cx, cy + 52), rs(best_saving), font=font(BOLD, 30), fill=(255, 255, 255), anchor='mm')
    return img


def build_collage(photos, w=1200, h=750, gap=10):
    """Side-by-side panels (e.g. cold drink, water, juice), each photo centre-cropped to fit."""
    img = Image.new('RGB', (w, h), (255, 255, 255))
    n = len(photos)
    pw = (w - gap * (n - 1)) // n
    for i, photo in enumerate(photos):
        pic = photo.convert('RGB')
        scale = max(pw / pic.width, h / pic.height)
        pic = pic.resize((int(pic.width * scale) + 1, int(pic.height * scale) + 1), Image.LANCZOS)
        left, top = (pic.width - pw) // 2, (pic.height - h) // 2
        img.paste(pic.crop((left, top, left + pw, top + h)), (i * (pw + gap), 0))
    return img


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (title, slugs, full, deal) in DEALS.items():
        photos = [Image.open(src / f'{slug}.img') for slug in slugs]
        build(title, photos, full, deal).convert('RGB').save(OUT / f'{name}.jpg', quality=86, optimize=True, progressive=True)
        print(f'public/images/products/{name}.jpg')

    # Deal Boxes category picture: collage of the photos in collage/ (sorted by file name).
    collage_files = sorted((src / 'collage').glob('*.*'))
    if collage_files:
        cat_out = OUT.parent / 'categories'
        cat_out.mkdir(parents=True, exist_ok=True)
        build_collage([Image.open(f) for f in collage_files]).save(cat_out / 'deal-boxes.jpg', quality=85, optimize=True, progressive=True)
        print('public/images/categories/deal-boxes.jpg')


if __name__ == '__main__':
    main()
