// ملف مُولَّد تلقائياً من سكربت تحضير الكتب. لا تعدّله يدوياً.
const B = (meta, images) => ({ ...meta, images });
export const PDF_BOOKS = [
  B(require('./sample-sci/book.json'), [require('./sample-sci/p1.jpg'), require('./sample-sci/p2.jpg'), require('./sample-sci/p3.jpg'), require('./sample-sci/p4.jpg'), require('./sample-sci/p5.jpg'), require('./sample-sci/p6.jpg')]),
]

export const getPdfBooks = (gradeId) => PDF_BOOKS.filter((b) => b.grades === 'all' || b.grades.includes(gradeId));
