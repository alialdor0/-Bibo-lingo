// تجميع النتائج حسب الفصل والشهر، وبناء كشف الدرجات.
const MONTHS = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
export const SEM_NAME = { 1: 'الفصل الأول', 2: 'الفصل الثاني' };
export const subjectOf = (r) => r.subject || 'غير محدد';

// أفضل محاولة لكل اختبار، مع تاريخ أول محاولة.
export function bestByExam(results) {
  const m = {};
  results.forEach((r) => {
    const cur = m[r.examId];
    if (!cur) m[r.examId] = { ...r, firstDate: r.date };
    else {
      const first = r.date < cur.firstDate ? r.date : cur.firstDate;
      m[r.examId] = r.percent > cur.percent ? { ...r, firstDate: first } : { ...cur, firstDate: first };
    }
  });
  return Object.values(m);
}

const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, x) => a + x.percent, 0) / arr.length) : 0);

// الأشهر تُرتَّب بحسب الأشهر التي أجرى فيها الطالب اختبارات الصفحات داخل كل فصل.
export function buildPeriods(results) {
  const best = bestByExam(results);
  const out = [];
  [1, 2].forEach((s) => {
    const pages = best.filter((r) => r.semester === s && r.kind === 'pages');
    const keys = [...new Set(pages.map((r) => r.firstDate.slice(0, 7)))].sort();
    keys.forEach((k, i) => {
      const idx = Math.min(i, MONTHS.length - 1);
      const key = `s${s}m${idx}`;
      const items = pages.filter((r) => r.firstDate.slice(0, 7) === k);
      const ex = out.find((p) => p.key === key);
      if (ex) ex.items.push(...items); else out.push({ key, semester: s, label: `${SEM_NAME[s]}: الشهر ${MONTHS[idx]}`, items });
    });
    const sem = best.filter((r) => r.semester === s && r.kind === 'semester');
    if (sem.length) out.push({ key: `s${s}end`, semester: s, label: s === 1 ? 'نصف السنة' : 'آخر السنة', items: sem });
  });
  out.forEach((p) => { p.avg = avg(p.items); });
  return out;
}

export function summarize(results) {
  const best = bestByExam(results);
  return { exams: best.length, avg: avg(best), passed: best.filter((r) => r.percent >= 50).length };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function reportHtml({ user, gradeName, results }) {
  const best = bestByExam(results);
  const periods = buildPeriods(results);
  const subjects = [...new Set(best.map(subjectOf))];
  const cell = (sub, p) => { const it = p.items.filter((r) => subjectOf(r) === sub); return it.length ? avg(it) : '—'; };
  const head = periods.map((p) => `<th>${esc(p.label)}</th>`).join('');
  const rows = subjects.map((sub) => {
    const mine = best.filter((r) => subjectOf(r) === sub);
    return `<tr><td class="s">${esc(sub)}</td>${periods.map((p) => `<td>${cell(sub, p)}</td>`).join('')}<td><b>${avg(mine)}</b></td></tr>`;
  }).join('');
  const total = summarize(results);
  return `<html dir="rtl" lang="ar"><head><meta charset="utf-8"/><style>
body{font-family:-apple-system,Arial,sans-serif;padding:24px;color:#1B2A24}
h1{text-align:center;margin:0 0 4px}p.sub{text-align:center;color:#555;margin:0 0 16px}
.info{margin:12px 0;line-height:1.9}table{width:100%;border-collapse:collapse;font-size:13px}
th,td{border:1px solid #999;padding:6px;text-align:center}th{background:#E4ECE6}td.s{text-align:right;font-weight:bold}
.note{margin-top:14px;color:#555;font-size:12px}</style></head><body>
<h1>كشف الدرجات</h1><p class="sub">درجات الاختبارات من 100، والنجاح 50</p>
<div class="info"><div>الاسم: <b>${esc(user.name)}</b></div><div>المدرسة: <b>${esc(user.school)}</b></div><div>الشعبة: <b>${esc(user.section)}</b> &nbsp; الصف: <b>${esc(gradeName)}</b></div></div>
${subjects.length ? `<table><tr><th>المادة</th>${head}<th>المعدل</th></tr>${rows}</table>` : '<p>لا توجد نتائج بعد.</p>'}
<p class="info">المعدل العام: <b>${total.avg}</b> &nbsp; الاختبارات المنجزة: <b>${total.exams}</b> &nbsp; الناجحة: <b>${total.passed}</b></p>
<p class="note">تُحتسب أفضل محاولة لكل اختبار.</p></body></html>`;
}
