// البحث داخل نص الكتاب. بعض ملفات PDF تفصل حروف الكلمة بمسافات (مثل «ال ع ل م»)، فيتجاهل البحث المسافات تماماً.
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const toNumber = (s) => {
  const t = String(s).trim().replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d));
  return /^\d+$/.test(t) ? parseInt(t, 10) : null;
};
// الأشكال المتقاربة: أ إ آ ← ا ، ى ← ي ، ة ← ه ، (لا) و(ال) تُوحَّدان لأن بعض ملفات PDF تخرج (لا) معكوسة.
const keep = (s) => s.replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/لا/g, 'ال').toLowerCase();
export const canonQuery = (q) => keep(String(q).replace(/[\u064B-\u0652\u0670\u0640]/g, '')).replace(/\s+/g, '');

const cache = new WeakMap();
// لكل صفحة: نص موحَّد بلا مسافات + موضع كل حرف في النص الأصلي (لاقتطاع المقتطف).
function index(book) {
  if (!cache.has(book)) {
    const m = {};
    Object.keys(book.text).forEach((k) => {
      const t = keep(book.text[k]); let flat = ''; const pos = [];
      for (let i = 0; i < t.length; i++) { if (!/\s/.test(t[i])) { flat += t[i]; pos.push(i); } }
      m[k] = { flat, pos };
    });
    cache.set(book, m);
  }
  return cache.get(book);
}

// يرجع صفحة واحدة لكل نتيجة مع مقتطف. from/to بأرقام الصفحات المطبوعة (اختياري).
export function searchBook(book, query, { from, to, limit = 60 } = {}) {
  const q = canonQuery(query);
  if (q.length < 2) return [];
  const idx = index(book); const out = [];
  for (let p = 1; p <= book.count && out.length < limit; p++) {
    const printed = p - book.offset;
    if (from && printed < from) continue;
    if (to && printed > to) continue;
    const e = idx[String(p)];
    const at = e ? e.flat.indexOf(q) : -1;
    if (at < 0) continue;
    const o = e.pos[at]; const t = book.text[String(p)];
    out.push({ page: p, snippet: ((o > 40 ? '…' : '') + t.slice(Math.max(0, o - 40), o + q.length + 70) + '…').replace(/\s+/g, ' ') });
  }
  return out;
}
