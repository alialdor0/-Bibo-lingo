// الامتحان الوزاري: للصفوف المنتهية في كل مرحلة، يشمل المنهج كله بمؤقت.
import { getBooks } from './books';

export const MINISTERIAL_GRADES = ['p6', 'm3', 'h6']; // السادس الابتدائي، الثالث المتوسط، السادس الإعدادي
export const isMinisterial = (gradeId) => MINISTERIAL_GRADES.includes(gradeId);
export const TARGET_QUESTIONS = 30;
export const minutesFor = (n) => Math.max(5, Math.round(n * 2)); // دقيقتان لكل سؤال، وخمس دقائق على الأقل

const chapterTitleOf = (book, q) => {
  const ch = book.chapters.find((c) => q.pageRef >= c.pages[0] && q.pageRef <= c.pages[1]);
  return ch ? ch.title : undefined;
};

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// امتحان وزاري لمادة واحدة: أسئلة عشوائية من الكتاب كله بترتيب جديد في كل محاولة.
export function buildMinisterialExam(gradeId, book, rng = Math.random) {
  const pool = book.questions.map((q) => ({ ...q, chapterTitle: chapterTitleOf(book, q) }));
  const picked = shuffle(pool, rng).slice(0, TARGET_QUESTIONS);
  return {
    id: `${gradeId}-${book.id}-min`, title: `الامتحان الوزاري: ${book.title}`, kind: 'ministerial', semester: 0,
    subject: book.title, minutes: minutesFor(picked.length), questions: picked,
  };
}

export const ministerialBooks = (gradeId) => (isMinisterial(gradeId) ? getBooks(gradeId).filter((b) => b.questions.length) : []);
