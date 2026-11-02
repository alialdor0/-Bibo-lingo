import { SAMPLE_BOOKS } from './sample';

// لاحقاً: كتب حقيقية لكل صف تُحمَّل عند الحاجة فقط.
export const getBooks = (gradeId) => SAMPLE_BOOKS;
export const isSampleContent = (gradeId) => true;

const inPages = (q, [from, to]) => q.pageRef >= from && q.pageRef <= to;

// اختبار صفحات باب واحد.
export function chapterExam(gradeId, book, ch) {
  return {
    id: `${gradeId}-${book.id}-${ch.id}`, title: `اختبار ${book.title}: ${ch.title}`, kind: 'pages', semester: ch.semester,
    questions: book.questions.filter((q) => inPages(q, ch.pages)),
  };
}

// اختبار الفصل الدراسي الكامل للكتاب.
export function semesterExam(gradeId, book, semester) {
  const chs = book.chapters.filter((c) => c.semester === semester);
  return {
    id: `${gradeId}-${book.id}-sem${semester}`, title: `اختبار ${book.title}: الفصل ${semester === 1 ? 'الأول' : 'الثاني'} الشامل`, kind: 'semester', semester,
    questions: book.questions.filter((q) => chs.some((c) => inPages(q, c.pages))),
  };
}
