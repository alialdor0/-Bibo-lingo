"""استخراج نص عربي صحيح من صفحات PDF باستخدام pdfminer.six.
الفرق عن pdftotext: لا يعكس حروف الربط (لا لأ لإ لآ) عند إعادة ترتيب السطر، ويلصق التشكيل بحرفه، ولا يفصل حروف الكلمة."""
import re, unicodedata
from pdfminer.layout import LTChar, LTTextBox, LTTextLine, LTContainer

AR = re.compile(r'[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]')
LTR = re.compile(r'[0-9A-Za-z\u0660-\u0669]')

def _glyphs(layout):
    out = []
    def walk(o):
        if isinstance(o, LTChar): out.append(o)
        elif isinstance(o, LTContainer):
            for c in o: walk(c)
    walk(layout); return out

def _is_mark(t): return all(unicodedata.category(ch) == 'Mn' for ch in t)

def _dedupe(gl):
    # بعض الكتب ترسم الحرف مرتين لتعطي أثر الخط العريض، فيُستخرج مكرراً
    seen = {}; out = []
    for g in gl:
        k = (g.get_text(), round(g.x0 / max(g.size * 0.35, 1)), round(g.y0 / max(g.size * 0.35, 1)))
        if k in seen: continue
        seen[k] = 1; out.append(g)
    return out

def _rotated(g):
    m = g.matrix
    return abs(m[1]) > 0.15 * abs(m[0]) or abs(m[2]) > 0.15 * abs(m[3])

def page_text(layout, gap_ratio=0.18):
    gl = _dedupe([g for g in _glyphs(layout) if g.get_text() not in ('\n', '\r')])
    rot = {id(g) for g in gl if _rotated(g)}
    main = _flow([g for g in gl if id(g) not in rot], gap_ratio)
    # النص المائل (داخل الرسوم): يُجمع بحسب مربعات pdfminer حتى لا يختلط بغيره
    blocks = []
    for box in layout:
        if not isinstance(box, LTTextBox): continue
        lines = []
        for ln in box:
            if not isinstance(ln, LTTextLine): continue
            g = [c for c in ln if isinstance(c, LTChar) and id(c) in rot and c.get_text() not in ('\n', '\r')]
            if g:
                t = _finish(_line_text(g, gap_ratio))
                if t.strip(): lines.append(t)
        if lines: blocks.append(' '.join(lines))
    if blocks: main = (main + '\n\n' if main else '') + 'نص داخل الرسم:\n' + '\n'.join(blocks)
    return _post(main)

def _flow(gl, gap_ratio=0.18):
    if not gl: return ''
    # 1) سطور: عنقود بالارتفاع (المركز الرأسي)
    gl.sort(key=lambda g: -((g.y0 + g.y1) / 2))
    lines = []
    for g in gl:
        if _is_mark(g.get_text()) and lines: pass
        cy = (g.y0 + g.y1) / 2; h = max(g.size, 1)
        for ln in lines:
            if abs(ln['cy'] - cy) <= 0.55 * ln['h']:
                ln['g'].append(g); ln['cy'] = sum((x.y0 + x.y1) / 2 for x in ln['g']) / len(ln['g']); break
        else:
            lines.append({'cy': cy, 'h': h, 'g': [g]})
    lines.sort(key=lambda l: -l['cy'])
    res = []
    for ln in lines:
        res.append(_line_text(ln['g'], gap_ratio))
    # فقرات: فراغ رأسي كبير بين سطرين
    out = []; prev = None
    for ln, txt in zip(lines, res):
        txt = _finish(txt)
        if not txt.strip(): continue
        if prev is not None and (prev['cy'] - ln['cy']) > 2.1 * max(prev['h'], ln['h']): out.append('')
        out.append(txt); prev = ln
    return collapse_notes('\n'.join(out))

def _line_text(glyphs, gap_ratio):
    base = [g for g in glyphs if not _is_mark(g.get_text())]
    marks = [g for g in glyphs if _is_mark(g.get_text())]
    base.sort(key=lambda g: g.x0)
    # التشكيل يُلصق بأقرب حرف أساسي أفقياً
    attached = {id(b): [] for b in base}
    for m in marks:
        if not base: break
        cx = (m.x0 + m.x1) / 2
        b = min(base, key=lambda g: 0 if g.x0 <= cx <= g.x1 else min(abs(cx - g.x0), abs(cx - g.x1)))
        attached[id(b)].append(m)
    # كلمات: فصل بالفراغ الأفقي أو بحرف مسافة
    words = []; cur = []
    for g in base:
        t = g.get_text()
        if t.isspace():
            if cur: words.append(cur); cur = []
            continue
        if cur:
            gap = g.x0 - cur[-1].x1
            if gap > gap_ratio * max(g.size, cur[-1].size): words.append(cur); cur = []
        cur.append(g)
    if cur: words.append(cur)
    def wtxt(w):  # نص كلمة بترتيب مرئي من اليسار لليمين
        return [(g.get_text() + ''.join(m.get_text() for m in sorted(attached[id(g)], key=lambda m: m.x0))) for g in w]
    items = []
    for w in words:
        parts = wtxt(w); joined = ''.join(parts)
        if AR.search(joined): items.append(('R', ''.join(reversed(parts))))   # عربي: يُعكس ترتيب الحروف المرئي فقط
        else: items.append(('L', joined))
    # وحدات: الكلمات اللاتينية/الأرقام المتتالية تبقى بترتيبها
    units = []
    for k, t in items:
        if k == 'L' and units and units[-1][0] == 'L': units[-1] = ('L', units[-1][1] + ' ' + t)
        else: units.append((k, t))
    return ' '.join(t for _, t in reversed(units))

PRES = re.compile(r'[\uFB50-\uFDFF\uFE70-\uFEFF]')
KEEP_PRES = set('\uFDF2\uFDFA\uFDFB')
MARKS = re.compile(r'[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]')
QURAN_NOTE = '[آيات قرآنية بخط خاص، لا يتوفر نصها هنا]'

def _finish(txt):
    chars = [c for c in txt if not c.isspace()]
    if len(chars) >= 4:
        pres = [c for c in chars if PRES.match(c) and c not in KEEP_PRES]
        if len(pres) / len(chars) > 0.5: return QURAN_NOTE
    t = unicodedata.normalize('NFKC', txt)
    t = MARKS.sub('', t)   # حركات التشكيل تُحذف: مواضعها في هذه الملفات غير موثوقة وقد تغيّر النطق
    t = re.sub(r'[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', t)
    return re.sub(r'[ \t]+', ' ', t).strip()

def collapse_notes(text):
    out = []
    for ln in text.split('\n'):
        if ln == QURAN_NOTE and out and out[-1] == QURAN_NOTE: continue
        out.append(ln)
    return '\n'.join(out)

VERSE = re.compile(r'بز[\s\S]{0,500}?بر')
NOTE_RUN = re.compile(r'(\[آيات? قرآني[^\]]*\][ \t]*\n?){2,}')

def _post(t):
    # الآيات في هذه الكتب بخط خاص يخرج رموزاً بين علامتي بز ... بر
    t = VERSE.sub('[آية قرآنية بخط خاص، لا يتوفر نصها هنا]', t)
    t = t.replace('االله', 'الله')
    t = NOTE_RUN.sub(lambda m: m.group(0).split(']')[0] + ']\n', t)
    return t
