#!/usr/bin/env python3
"""يعمل داخل GitHub Actions قبل نشر التحديث.
يقرأ كل ملف books/<الصف>/<اسم الكتاب>.pdf، ويحوّله إلى أوراق صور + نص للبحث، ويولّد data/pdfbooks.
لا يعيد تحويل كتاب لم يتغير (يقارن بصمة الملف)، ويحذف ما حُذف مصدره.
ملف اختياري بجانب الكتاب: <اسم الكتاب>.json مثل {"offset": 0, "toc": [{"title": "...", "page": 3}]}"""
import argparse, glob, hashlib, json, os, re, shutil, subprocess, sys, tempfile, unicodedata
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from collections import Counter
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('--books', default='books'); ap.add_argument('--out', default='data/pdfbooks')
ap.add_argument('--width', type=int, default=720); ap.add_argument('--quality', type=int, default=62)
ap.add_argument('--cols', type=int, default=2); ap.add_argument('--rows', type=int, default=3)
a = ap.parse_args()
OCR_LANG = os.environ.get('OCR_LANG', 'ara+eng')
VERSION = 4  # يتغير عند تغيير طريقة التحويل ليُعاد تحويل الكتب

def sha1(path):
    h = hashlib.sha1()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''): h.update(chunk)
    return h.hexdigest()

def clean(t):
    t = unicodedata.normalize('NFKC', t)
    t = re.sub(r'[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', t)
    t = re.sub(r'[\u064B-\u0652\u0670\u0640]', '', t)
    return re.sub(r'\s+', ' ', t).strip()

def extract_text(pdf, n):
    """نص كل صفحة. الأفضل: استخراج عربي صحيح (حروف لا/لأ سليمة، بلا مسافات داخل الكلمات). الاحتياط: pdftotext."""
    def fallback(i):
        r = subprocess.run(['pdftotext', '-f', str(i), '-l', str(i), pdf, '-'], capture_output=True, text=True)
        return clean(r.stdout)
    text = {}
    try:
        from pdfminer.high_level import extract_pages
        from pdfminer.layout import LAParams
        from arabic_text import page_text
        lp = LAParams(char_margin=2.0, line_margin=0.5, boxes_flow=None)
        for i, layout in enumerate(extract_pages(pdf, laparams=lp), 1):
            try: t = page_text(layout)
            except Exception: t = ''
            text[str(i)] = t if t.strip() else fallback(i)
        for i in range(len(text) + 1, n + 1): text[str(i)] = fallback(i)
    except Exception as e:
        print('تعذر pdfminer، سيُستخدم pdftotext:', e, file=sys.stderr)
        text = {str(i): fallback(i) for i in range(1, n + 1)}
    return text

def ocr_missing(pdf, text, ink):
    """الصفحات التي فيها صورة بلا نص (مثل الصفحات الممسوحة) تُقرأ بالتعرف الضوئي إن توفر tesseract. يرجع أرقامها."""
    pages = []
    try: import pytesseract
    except Exception: return pages
    for i in range(1, len(ink) + 1):
        if len(text.get(str(i), '').strip()) >= 40 or ink[i - 1] < 0.02: continue
        tmp = tempfile.mkdtemp()
        try:
            subprocess.run(['pdftoppm', '-f', str(i), '-l', str(i), '-r', '200', '-gray', '-png', pdf, os.path.join(tmp, 'o')], check=True)
            png = glob.glob(os.path.join(tmp, 'o-*.png'))[0]
            t = pytesseract.image_to_string(Image.open(png), lang=OCR_LANG, timeout=90)
            t = unicodedata.normalize('NFKC', t)
            t = re.sub(r'[\u064B-\u065F\u0670\u0640\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', t)
            t = '\n'.join(ln.strip() for ln in t.split('\n') if ln.strip())
            if len(t) >= 20: text[str(i)] = t; pages.append(i)
        except Exception as e:
            print('تعذر التعرف الضوئي للصفحة', i, e, file=sys.stderr)
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    return pages

def convert(pdf, out, meta_base, side):
    os.makedirs(out, exist_ok=True)
    for f in glob.glob(os.path.join(out, 's*.jpg')): os.remove(f)
    tmp = tempfile.mkdtemp()
    subprocess.run(['pdftoppm', '-png', '-scale-to-x', str(a.width), '-scale-to-y', '-1', pdf, os.path.join(tmp, 'pg')], check=True)
    files = sorted(glob.glob(os.path.join(tmp, 'pg-*.png')), key=lambda p: int(re.search(r'(\d+)\.png$', p).group(1)))
    n = len(files); W, H = Counter(Image.open(f).size for f in files).most_common(1)[0][0]
    per = a.cols * a.rows; sheets = (n + per - 1) // per
    for s in range(sheets):
        sheet = Image.new('RGB', (W * a.cols, H * a.rows), 'white')
        for k in range(per):
            i = s * per + k
            if i >= n: break
            im = Image.open(files[i]).convert('RGB')
            if im.size != (W, H):
                im.thumbnail((W, H)); bg = Image.new('RGB', (W, H), 'white'); bg.paste(im, ((W - im.width) // 2, 0)); im = bg
            sheet.paste(im, ((k % a.cols) * W, (k // a.cols) * H))
        sheet.save(os.path.join(out, f's{s + 1}.jpg'), 'JPEG', quality=a.quality, optimize=True)
    ink = []
    for f in files:
        g = Image.open(f).convert('L').resize((72, 100)); px = list(g.getdata())
        ink.append(sum(1 for v in px if v < 200) / len(px))
    shutil.rmtree(tmp)
    text = extract_text(pdf, n)
    ocr_pages = ocr_missing(pdf, text, ink)
    meta = dict(meta_base, count=n, offset=int(side.get('offset', 0)), size=[W, H], sheet={'cols': a.cols, 'rows': a.rows},
                sample=False, toc=side.get('toc', []), ocr=ocr_pages, text=text)
    json.dump(meta, open(os.path.join(out, 'book.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    imgs = ', '.join(f"require('./s{s + 1}.jpg')" for s in range(sheets))
    open(os.path.join(out, 'index.js'), 'w', encoding='utf-8').write(
        "// مُولَّد تلقائياً. لا تعدّله يدوياً.\nimport meta from './book.json';\n\nexport default { ...meta, images: [" + imgs + "] };\n")
    return n, sheets

os.makedirs(a.out, exist_ok=True)
wanted = {}   # id -> (pdf, grade, title, side)
for pdf in sorted(glob.glob(os.path.join(a.books, '*', '*.pdf'))):
    grade = os.path.basename(os.path.dirname(pdf)); stem = os.path.splitext(os.path.basename(pdf))[0]
    bid = f"{grade}-{hashlib.sha1(stem.encode('utf-8')).hexdigest()[:8]}"
    side = {}
    sp = os.path.splitext(pdf)[0] + '.json'
    if os.path.exists(sp):
        try: side = json.load(open(sp, encoding='utf-8'))
        except Exception as e: print('تجاهل ملف إعداد تالف:', sp, e)
    wanted[bid] = (pdf, grade, stem, side)

# احذف كتباً لم يعد لها مصدر
for d in glob.glob(os.path.join(a.out, '*', 'book.json')):
    bid = os.path.basename(os.path.dirname(d))
    if bid not in wanted: shutil.rmtree(os.path.dirname(d)); print('حُذف:', bid)

failed = 0
for bid, (pdf, grade, title, side) in wanted.items():
    out = os.path.join(a.out, bid); stamp = f"{VERSION}:{a.width}:{a.quality}:{a.cols}x{a.rows}:{sha1(pdf)}:{json.dumps(side, sort_keys=True, ensure_ascii=False)}"
    sf = os.path.join(out, '.stamp')
    if os.path.exists(sf) and open(sf, encoding='utf-8').read() == stamp and os.path.exists(os.path.join(out, 'book.json')):
        print('بلا تغيير:', bid, title); continue
    try:
        meta_base = {'id': bid, 'title': side.get('title', title), 'subject': side.get('subject', title), 'grades': [grade]}
        n, sheets = convert(pdf, out, meta_base, side)
        open(sf, 'w', encoding='utf-8').write(stamp)
        print(f'تم: {bid} {title} -> {n} صفحة، {sheets} ورقة')
    except Exception as e:
        failed += 1; shutil.rmtree(out, ignore_errors=True); print('فشل تحويل', pdf, e, file=sys.stderr)

# السجل: مرتب بالصف ثم بالعنوان
items = []
for d in glob.glob(os.path.join(a.out, '*', 'book.json')):
    m = json.load(open(d, encoding='utf-8')); items.append((m['grades'][0], m['title'], os.path.basename(os.path.dirname(d))))
lines = ['// ملف مُولَّد تلقائياً. كل كتاب في مجلده، والكتاب غير الموجود يُتجاهل بصمت.', 'export const PDF_BOOKS = [];', 'let b;']
for _, _, bid in sorted(items):
    lines.append(f"try {{ b = require('./{bid}'); if (b && b.default) PDF_BOOKS.push(b.default); }} catch (e) {{}}")
lines += ['', "export const getPdfBooks = (gradeId) => PDF_BOOKS.filter((b) => b.grades === 'all' || b.grades.includes(gradeId));", '']
open(os.path.join(a.out, 'index.js'), 'w', encoding='utf-8').write('\n'.join(lines))
print(f'المجموع: {len(items)} كتاب، فشل {failed}')
sys.exit(1 if failed else 0)
