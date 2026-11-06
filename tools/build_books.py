#!/usr/bin/env python3
import argparse, glob, hashlib, json, os, re, shutil, subprocess, sys, tempfile, unicodedata
from collections import Counter
from PIL import Image
import pytesseract

ap = argparse.ArgumentParser()
ap.add_argument('--books', default='books')
ap.add_argument('--out', default='data/pdfbooks')
ap.add_argument('--width', type=int, default=720)
ap.add_argument('--quality', type=int, default=62)
ap.add_argument('--cols', type=int, default=2)
ap.add_argument('--rows', type=int, default=3)
a = ap.parse_args()
VERSION = 3

def sha1(path):
    h = hashlib.sha1()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()

def clean(t):
    t = unicodedata.normalize('NFKC', t)
    t = re.sub(r'[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', t)
    t = re.sub(r'[\u064B-\u0652\u0670\u0640]', '', t)
    return re.sub(r'\s+', ' ', t).strip()

def convert(pdf, out, meta_base, side):
    os.makedirs(out, exist_ok=True)
    for f in glob.glob(os.path.join(out, 's*.jpg')):
        os.remove(f)
    tmp = tempfile.mkdtemp()
    subprocess.run(['pdftoppm', '-png', '-scale-to-x', str(a.width), '-scale-to-y', '-1', pdf, os.path.join(tmp, 'pg')], check=True)
    files = sorted(glob.glob(os.path.join(tmp, 'pg-*.png')), key=lambda p: int(re.search(r'(\d+)\.png$', p).group(1)))
    n = len(files)
    W, H = Counter(Image.open(f).size for f in files).most_common(1)[0][0]
    per = a.cols * a.rows
    sheets = (n + per - 1) // per
    for s in range(sheets):
        sheet = Image.new('RGB', (W * a.cols, H * a.rows), 'white')
        for k in range(per):
            i = s * per + k
            if i >= n:
                break
            im = Image.open(files[i]).convert('RGB')
            if im.size != (W, H):
                im.thumbnail((W, H))
                bg = Image.new('RGB', (W, H), 'white')
                bg.paste(im, ((W - im.width) // 2, 0))
                im = bg
            sheet.paste(im, ((k % a.cols) * W, (k // a.cols) * H))
        sheet.save(os.path.join(out, f's{s + 1}.jpg'), 'JPEG', quality=a.quality, optimize=True)
    
    text = {}
    for i, img_path in enumerate(files, start=1):
        r = subprocess.run(['pdftotext', '-f', str(i), '-l', str(i), pdf, '-'], capture_output=True, text=True)
        extracted = clean(r.stdout)
        if not extracted:
            try:
                ocr_text = pytesseract.image_to_string(Image.open(img_path), lang='ara+eng')
                extracted = clean(ocr_text)
            except Exception:
                extracted = ""
        text[str(i)] = extracted

    shutil.rmtree(tmp)
    meta = dict(meta_base, count=n, offset=int(side.get('offset', 0)), size=[W, H], sheet={'cols': a.cols, 'rows': a.rows}, sample=False, toc=side.get('toc', []), text=text)
    json.dump(meta, open(os.path.join(out, 'book.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    imgs = ', '.join(f"require('./s{s + 1}.jpg')" for s in range(sheets))
    open(os.path.join(out, 'index.js'), 'w', encoding='utf-8').write("import meta from './book.json';\n\nexport default { ...meta, images: [" + imgs + "] };\n")
    return n, sheets

os.makedirs(a.out, exist_ok=True)
wanted = {}
for pdf in sorted(glob.glob(os.path.join(a.books, '*', '*.pdf'))):
    grade = os.path.basename(os.path.dirname(pdf))
    stem = os.path.splitext(os.path.basename(pdf))[0]
    bid = f"{grade}-{hashlib.sha1(stem.encode('utf-8')).hexdigest()[:8]}"
    side = {}
    sp = os.path.splitext(pdf)[0] + '.json'
    if os.path.exists(sp):
        try:
            side = json.load(open(sp, encoding='utf-8'))
        except Exception:
            pass
    wanted[bid] = (pdf, grade, stem, side)

for d in glob.glob(os.path.join(a.out, '*', 'book.json')):
    bid = os.path.basename(os.path.dirname(d))
    if bid not in wanted:
        shutil.rmtree(os.path.dirname(d))

failed = 0
for bid, (pdf, grade, title, side) in wanted.items():
    out = os.path.join(a.out, bid)
    stamp = f"{VERSION}:{a.width}:{a.quality}:{a.cols}x{a.rows}:{sha1(pdf)}:{json.dumps(side, sort_keys=True, ensure_ascii=False)}"
    sf = os.path.join(out, '.stamp')
    if os.path.exists(sf) and open(sf, encoding='utf-8').read() == stamp and os.path.exists(os.path.join(out, 'book.json')):
        continue
    try:
        meta_base = {'id': bid, 'title': side.get('title', title), 'subject': side.get('subject', title), 'grades': [grade]}
        n, sheets = convert(pdf, out, meta_base, side)
        open(sf, 'w', encoding='utf-8').write(stamp)
    except Exception:
        failed += 1
        shutil.rmtree(out, ignore_errors=True)

items = []
for d in glob.glob(os.path.join(a.out, '*', 'book.json')):
    m = json.load(open(d, encoding='utf-8'))
    items.append((m['grades'][0], m['title'], os.path.basename(os.path.dirname(d))))
lines = ['export const PDF_BOOKS = [];', 'let b;']
for _, _, bid in sorted(items):
    lines.append(f"try {{ b = require('./{bid}'); if (b && b.default) PDF_BOOKS.push(b.default); }} catch (e) {{}}")
lines += ['', "export const getPdfBooks = (gradeId) => PDF_BOOKS.filter((b) => b.grades === 'all' || b.grades.includes(gradeId));", '']
open(os.path.join(a.out, 'index.js'), 'w', encoding='utf-8').write('\n'.join(lines))
sys.exit(1 if failed else 0)

