// أسئلة تجريبية لعرض الشكل فقط. تُستبدل لاحقاً بأسئلة كتب كل صف.
const QUESTIONS = [
  { id: 'q1', type: 'fill', pageRef: 10, text: 'عاصمة العراق هي ____', answer: 'بغداد' },
  { id: 'q2', type: 'tf', pageRef: 12, text: 'يمر نهر دجلة في مدينة بغداد.', answer: true },
  { id: 'q3', type: 'def', pageRef: 14, term: 'الفاعل', options: ['اسم مرفوع يدل على من قام بالفعل', 'اسم منصوب يدل على من وقع عليه الفعل', 'حرف يجر الاسم الذي بعده', 'اسم يدل على مكان وقوع الحدث'], answer: 0 },
  { id: 'q4', type: 'mcq', pageRef: 15, text: 'ما ناتج 7 × 8؟', options: ['54', '56', '64', '48'], answer: 1 },
  { id: 'q5', type: 'order', pageRef: 18, text: 'رتب مراحل نمو النبات:', items: ['البذرة', 'الإنبات', 'النبتة الصغيرة', 'النبات الكامل'] },
  { id: 'q6', type: 'match', pageRef: 20, text: 'صِل كل دولة بعاصمتها:', pairs: [['مصر', 'القاهرة'], ['السعودية', 'الرياض'], ['الأردن', 'عمّان'], ['سوريا', 'دمشق']] },
  { id: 'q7', type: 'tf', pageRef: 22, text: 'يغلي الماء عند 100 درجة مئوية عند مستوى سطح البحر.', answer: true },
  { id: 'q8', type: 'fill', pageRef: 25, text: 'عدد أيام الأسبوع ____ أيام', answer: 'سبعة', accepted: ['7', '٧'] },
];

export function getExams(gradeId) {
  return [
    { id: `${gradeId}-pages-1`, title: 'اختبار الصفحات 10 إلى 25', kind: 'pages', semester: 1, questions: QUESTIONS.slice(0, 5) },
    { id: `${gradeId}-sem-1`, title: 'اختبار الفصل الأول الشامل', kind: 'semester', semester: 1, questions: QUESTIONS },
  ];
}
