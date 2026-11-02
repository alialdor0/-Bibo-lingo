// تصحيح الأسئلة وحساب الدرجات.
export const PASS_MARK = 50;
export const TYPE_LABEL = {
  fill: 'أكمل الفراغ', tf: 'صح أم خطأ', def: 'اختر التعريف الصحيح',
  mcq: 'اختر الإجابة الصحيحة', order: 'رتب كما يأتي', match: 'صِل بين العمودين',
};
export const qTitle = (q) => (q.type === 'def' ? `ما تعريف: ${q.term}؟` : q.text);

// توحيد الكتابة: حذف التشكيل والتطويل وتوحيد أشكال الألف.
const norm = (s) => String(s || '').replace(/[\u064B-\u0652\u0640]/g, '').replace(/[إأآٱ]/g, 'ا').replace(/\s+/g, ' ').trim();

export function isAnswered(a) {
  if (a === undefined || a === null) return false;
  if (typeof a === 'string') return a.trim().length > 0;
  if (Array.isArray(a)) return a.length > 0;
  if (typeof a === 'object') return Object.keys(a).length > 0;
  return true;
}

// يرجع نسبة الصحة من 0 إلى 1.
export function gradeQuestion(q, a) {
  if (!isAnswered(a)) return 0;
  switch (q.type) {
    case 'fill': return [q.answer, ...(q.accepted || [])].some((x) => norm(x) === norm(a)) ? 1 : 0;
    case 'tf': return a === q.answer ? 1 : 0;
    case 'def':
    case 'mcq': return a === q.answer ? 1 : 0;
    case 'order': return a.length === q.items.length && a.every((v, i) => v === i) ? 1 : 0;
    case 'match': return q.pairs.filter((_, i) => a[i] === i).length / q.pairs.length;
    default: return 0;
  }
}

export function gradeExam(exam, answers) {
  let score = 0; let total = 0; const details = [];
  exam.questions.forEach((q) => {
    const pts = q.points || 1; const f = gradeQuestion(q, answers[q.id]);
    total += pts; score += pts * f; details.push({ q, fraction: f });
  });
  return { score, total, percent: total ? Math.round((score / total) * 100) : 0, details };
}

export const correctText = (q) => {
  if (q.type === 'fill') return q.answer;
  if (q.type === 'tf') return q.answer ? 'صح' : 'خطأ';
  if (q.type === 'def' || q.type === 'mcq') return q.options[q.answer];
  if (q.type === 'order') return q.items.join(' ← ');
  return q.pairs.map((p) => `${p[0]} = ${p[1]}`).join('، ');
};

export const answerText = (q, a) => {
  if (!isAnswered(a)) return 'لم تجب';
  if (q.type === 'fill') return a;
  if (q.type === 'tf') return a ? 'صح' : 'خطأ';
  if (q.type === 'def' || q.type === 'mcq') return q.options[a];
  if (q.type === 'order') return a.map((i) => q.items[i]).join(' ← ');
  return Object.keys(a).map((i) => `${q.pairs[i][0]} = ${q.pairs[a[i]][1]}`).join('، ');
};

// ترتيب عشوائي ثابت لكل سؤال (لا يتغير عند الرجوع إليه).
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6d2b79f5; let t = Math.imul(h ^ (h >>> 15), 1 | h); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function shuffledIndices(n, seedStr) {
  const r = seeded(String(seedStr)); const a = [...Array(n).keys()];
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  if (n > 1 && a.every((v, i) => v === i)) a.push(a.shift()); // لا نعرض الترتيب الصحيح كما هو
  return a;
}
