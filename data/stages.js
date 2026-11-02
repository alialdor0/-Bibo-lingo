// المراحل والصفوف في العراق.
export const STAGES = [
  { id: 'primary', name: 'ابتدائية', grades: ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'].map((n, i) => ({ id: `p${i + 1}`, name: `${n} الابتدائي` })) },
  { id: 'middle', name: 'متوسطة', grades: ['الأول', 'الثاني', 'الثالث'].map((n, i) => ({ id: `m${i + 1}`, name: `${n} المتوسط` })) },
  { id: 'prep', name: 'إعدادية', grades: ['الرابع', 'الخامس', 'السادس'].map((n, i) => ({ id: `h${i + 4}`, name: `${n} الإعدادي` })) },
];
export const SECTIONS = ['أ', 'ب', 'ج', 'د', 'هـ'];
export const findGrade = (gradeId) => {
  for (const s of STAGES) { const g = s.grades.find((x) => x.id === gradeId); if (g) return { stage: s, grade: g }; }
  return null;
};
