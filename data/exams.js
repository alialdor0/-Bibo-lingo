import { getBooks, chapterExam, semesterExam } from './books';

// كل الاختبارات المتاحة للصف: اختبار لكل باب، واختبار شامل لكل فصل.
export function getExams(gradeId) {
  const out = [];
  getBooks(gradeId).forEach((book) => {
    book.chapters.forEach((ch) => out.push(chapterExam(gradeId, book, ch)));
    [1, 2].forEach((s) => { const ex = semesterExam(gradeId, book, s); if (ex.questions.length) out.push(ex); });
  });
  return out.filter((e) => e.questions.length);
}
