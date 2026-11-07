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

def page_blocks(layout, gap_ratio=0.18):
    """كتل الصفحة بترتيب القراءة: [(نوع, نص)] حيث النوع h عنوان، p فقرة، l بند مرقّم، n ملاحظة، d نص داخل رسم."""
    gl = _dedupe([g for g in _glyphs(layout) if g.get_text() not in ('\n', '\r')])
    rot = {id(g) for g in gl if _rotated(g)}
    blocks = _flow_blocks([g for g in gl if id(g) not in rot], gap_ratio)
    # النص المائل (داخل الرسوم): يُجمع بحسب مربعات pdfminer حتى لا يختلط بغيره
    drawing = []
    for box in layout:
        if not isinstance(box, LTTextBox): continue
        lines = []
        for ln in box:
            if not isinstance(ln, LTTextLine): continue
            g = [c for c in ln if isinstance(c, LTChar) and id(c) in rot and c.get_text() not in ('\n', '\r')]
            if g:
                t = _finish(_line_text(g, gap_ratio))
                if t.strip(): lines.append(t)
        if lines: drawing.append(' '.join(lines))
    if drawing:
        blocks.append(('n', 'نص داخل الرسم:'))
        blocks += [('d', t) for t in drawing]
    out = []
    for t, s in blocks:
        s = _post(s).strip()
        if not s: continue
        if s.startswith('[آي') and t in ('p', 'l'): t = 'n'
        if out and s == out[-1][1] and s.startswith('['): continue
        out.append((t, s))
    return out

def page_text(layout, gap_ratio=0.18):
    return '\n'.join(s for _, s in page_blocks(layout, gap_ratio))

def text_to_blocks(text):
    """كتل مبسّطة لنص جاهز (التعرف الضوئي أو الاحتياطي): الفقرات مفصولة بسطر فارغ."""
    paras = re.split(r'\n\s*\n', text.strip()) if '\n' in text else [text]
    return [('p', re.sub(r'\s+', ' ', p).strip()) for p in paras if p.strip()]

NUMBERED = re.compile(r'^\s*[\(\[]?([0-9\u0660-\u0669]{1,2}|[\u0621-\u064A])\s*[\.\-\)\]\u0640:]')
PAGENUM = re.compile(r'^[0-9\u0660-\u0669]{1,4}$')

def _median(v):
    v = sorted(v); return v[len(v) // 2] if v else 0

def _flow_blocks(gl, gap_ratio=0.18):
    if not gl: return []
    gl = sorted(gl, key=lambda g: -((g.y0 + g.y1) / 2))
    rows = []
    for g in gl:
        cy = (g.y0 + g.y1) / 2; h = max(g.size, 1)
        for r in rows:
            if abs(r['cy'] - cy) <= 0.55 * r['h']:
                r['g'].append(g); r['cy'] = sum((x.y0 + x.y1) / 2 for x in r['g']) / len(r['g']); break
        else: rows.append({'cy': cy, 'h': h, 'g': [g]})
    rows.sort(key=lambda r: -r['cy'])
    lines = []
    for r in rows:
        base = [g for g in r['g'] if not _is_mark(g.get_text())] or r['g']
        txt = _finish(_line_text(r['g'], gap_ratio))
        if not txt.strip(): continue
        names = [str(getattr(g, 'fontname', '')).lower() for g in base]
        bold = sum(1 for n in names if 'bold' in n or 'black' in n or 'heavy' in n) / max(len(names), 1)
        lines.append({'t': txt, 'x0': min(g.x0 for g in base), 'x1': max(g.x1 for g in base), 'cy': r['cy'],
                      'size': _median([round(g.size * 2) / 2 for g in base]), 'bold': bold, 'n': len(txt)})
    # أرقام الصفحات المنفردة تُحذف (يعرضها القارئ في رأس الصفحة)
    lines = [l for l in lines if not PAGENUM.match(l['t'])]
    if not lines: return []
    cnt = {}
    for l in lines: cnt[l['size']] = cnt.get(l['size'], 0) + l['n']
    body = max(cnt, key=cnt.get)
    wide = [l for l in lines if l['n'] >= 25] or lines
    right = sorted(l['x1'] for l in wide)[int(len(wide) * 0.8) - 1 if len(wide) > 1 else 0]
    left = sorted(l['x0'] for l in wide)[int(len(wide) * 0.2)]
    col = max(right - left, 1)
    pitches = [lines[i]['cy'] - lines[i + 1]['cy'] for i in range(len(lines) - 1) if 0 < lines[i]['cy'] - lines[i + 1]['cy'] < 3 * body]
    pitch = _median(pitches) or 1.4 * body
    def kind(l):
        if l['t'] == QURAN_NOTE: return 'n'
        if l['size'] >= 1.15 * body: return 'h'
        if l['bold'] > 0.85 and (l['x1'] - l['x0']) <= 0.92 * col and l['n'] <= 90: return 'h'
        if NUMBERED.match(l['t']): return 'l'
        return 'p'
    blocks = []; prev = None
    for l in lines:
        k = kind(l)
        new = prev is None
        if prev is not None:
            gap = prev['cy'] - l['cy']
            if k != blocks[-1][0] or k in ('l', 'n'): new = True
            elif gap > 1.6 * pitch: new = True
            elif k == 'h': new = gap > 1.25 * max(l['size'], prev['size']) * 1.4
            elif prev['x0'] > left + 0.18 * col: new = True                 # السطر السابق انتهى مبكراً: انتهت الفقرة
            elif l['x1'] < right - 1.6 * body and prev['x0'] <= left + 0.08 * col: new = True   # سطر أول مُزاح
        if new: blocks.append([k, l['t']])
        else: blocks[-1][1] += ' ' + l['t']
        prev = l
    return [(k, t) for k, t in blocks]

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

def _fix_ltr(w):
    # في السياق العربي تظهر علامة الترقيم يسار الرقم (مثل «-1») وترتيبها المنطقي بعده: «1-»
    m = re.match(r'^([^\w\s]+)(\d+)$', w)
    if m and m.group(1) not in ('(', ')', '[', ']'): return m.group(2) + m.group(1)
    if len(w) >= 3 and w[0] == ')' and w[-1] == '(': return '(' + w[1:-1] + ')'
    return w

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
        else: items.append(('L', _fix_ltr(joined)))
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
