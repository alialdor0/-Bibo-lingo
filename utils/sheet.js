// كل ورقة صورة تضم عدة صفحات (أعمدة × صفوف) لتقليل عدد الملفات المرفوعة.
export function pageSlot(page, cols = 1, rows = 1) {
  const per = cols * rows; const i = page - 1; const within = i % per;
  return { sheet: Math.floor(i / per), col: within % cols, row: Math.floor(within / cols) };
}
