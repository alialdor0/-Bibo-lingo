// تواريخ الواجبات والجدول. أيام الدراسة في العراق من الأحد إلى الخميس.
export const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const SCHOOL_DAYS = [0, 1, 2, 3, 4];
const pad = (n) => String(n).padStart(2, '0');
export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const shortDate = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
export const daysUntil = (due, today = new Date()) => Math.round((parseYmd(due) - parseYmd(ymd(today))) / 86400000);

export function dueLabel(due, today = new Date()) {
  const n = daysUntil(due, today);
  if (n === 0) return 'اليوم';
  if (n === 1) return 'غداً';
  if (n === 2) return 'بعد يومين';
  if (n > 2) return n <= 10 ? `بعد ${n} أيام` : `بعد ${n} يوماً`;
  if (n === -1) return 'متأخر منذ يوم';
  if (n === -2) return 'متأخر منذ يومين';
  return -n <= 10 ? `متأخر منذ ${-n} أيام` : `متأخر منذ ${-n} يوماً`;
}

// خيارات موعد التسليم: اليوم وسبعة أيام قادمة.
export function dueOptions(today = new Date()) {
  return [...Array(8).keys()].map((i) => {
    const d = addDays(today, i);
    return { value: ymd(d), label: i === 0 ? 'اليوم' : i === 1 ? `غداً ${shortDate(d)}` : `${DAY_NAMES[d.getDay()]} ${shortDate(d)}` };
  });
}
