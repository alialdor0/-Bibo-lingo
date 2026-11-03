// ملاحظات مفكرتي: ملاحظات الطالب والتعريفات والأسئلة التي أخطأ فيها.
export const KIND = { note: 'ملاحظة', definition: 'تعريف', wrong: 'سؤال أخطأت فيه' };
export const LEVEL = ['جديدة', 'قيد التعلم', 'متقنة'];
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// يضيف ملاحظات جديدة دون تكرار الملاحظات ذات المفتاح نفسه.
export function mergeNotes(old, list) {
  const keys = new Set(old.filter((n) => n.key).map((n) => n.key));
  const out = [...old];
  list.forEach((n) => {
    if (n.key) { if (keys.has(n.key)) return; keys.add(n.key); }
    out.push({ id: newId(), level: 0, fav: false, created: new Date().toISOString(), ...n });
  });
  return out;
}
