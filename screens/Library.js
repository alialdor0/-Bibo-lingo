import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { chapterExam, getBooks, isSampleContent, semesterExam } from '../data/books';
import { mergeNotes } from '../utils/notes';
import { PDF_BOOKS, getPdfBooks } from '../data/pdfbooks';
import { findGrade } from '../data/stages';
import Reader from './Reader';
import { Btn, Card, Chip, Row, Txt } from '../components/UI';

export default function Library({ onStart }) {
  const { theme, gradeId, progress, updateProgress } = useApp();
  const books = getBooks(gradeId);
  const [bookId, setBookId] = useState(null);
  const [chapterId, setChapterId] = useState(null);
  const [sem, setSem] = useState(1);
  const [section, setSection] = useState(null); // null | books | summaries
  const [reading, setReading] = useState(null); // كتاب PDF مفتوح
  const book = books.find((b) => b.id === bookId);
  const ch = book && book.chapters.find((c) => c.id === chapterId);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (reading) return false; // القارئ يعالج زر الرجوع بنفسه
      if (chapterId) { setChapterId(null); return true; }
      if (bookId) { setBookId(null); return true; }
      if (section) { setSection(null); return true; }
      return false;
    });
    return () => sub.remove();
  }, [bookId, chapterId, section, reading]);

  const pdfBooks = getPdfBooks(gradeId);
  const gradeInfo = findGrade(gradeId);
  const byGrade = {};
  PDF_BOOKS.forEach((b) => (Array.isArray(b.grades) ? b.grades : []).forEach((g) => { byGrade[g] = (byGrade[g] || 0) + 1; }));
  const summary = Object.keys(byGrade).map((g) => { const i = findGrade(g); return `${i ? i.grade.name : g}: ${byGrade[g]}`; }).join('، ');
  const hl = (progress[gradeId] && progress[gradeId].highlights) || {};

  // الشاشة الأولى: الكتب أو الملخصات
  if (!section) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Txt size={26} weight="800" style={{ marginBottom: 12 }}>المكتبة</Txt>
        <Pressable accessibilityRole="button" accessibilityLabel="الكتب" onPress={() => setSection('books')}>
          <Card><Txt size={34}>📖</Txt><Txt size={22} weight="800">الكتب</Txt><Txt color={theme.sub} style={{ marginTop: 4 }}>{`كتب صفك بصفحاتها، مع التظليل والبحث. (${pdfBooks.length})`}</Txt></Card>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="الملخصات" onPress={() => setSection('summaries')}>
          <Card><Txt size={34}>📝</Txt><Txt size={22} weight="800">الملخصات</Txt><Txt color={theme.sub} style={{ marginTop: 4 }}>ملخصات الأبواب مع تعريفات مهمة واختبار لكل باب.</Txt></Card>
        </Pressable>
      </ScrollView>
    );
  }

  // الكتب
  if (section === 'books') {
    const open = pdfBooks.find((b) => b.id === reading);
    if (open) return <Reader book={open} onClose={() => setReading(null)} />;
    return (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Txt size={26} weight="800" style={{ marginBottom: 12 }}>الكتب</Txt>
        <Card>
          <Txt weight="700">{`صفك الحالي: ${gradeInfo ? gradeInfo.grade.name : ''}`}</Txt>
          <Txt color={theme.sub} style={{ marginTop: 4 }}>{`الكتب الموجودة في التطبيق حسب الصف: ${summary || 'لا توجد كتب بعد'}`}</Txt>
        </Card>
        {pdfBooks.some((b) => b.sample) ? <Card><Txt color={theme.sub}>هذا كتاب تجريبي لعرض الشكل. نضع كتب صفك الحقيقية لاحقاً.</Txt></Card> : null}
        {pdfBooks.length === 0 ? <Card><Txt color={theme.sub}>لا توجد كتب لهذا الصف بعد.</Txt></Card> : null}
        {pdfBooks.map((b) => {
          const n = Object.keys(hl[b.id] || {}).length;
          return (
            <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`كتاب ${b.title}`} onPress={() => setReading(b.id)}>
              <Card>
                <Txt size={20} weight="700">{b.title}</Txt>
                <Txt color={theme.sub} style={{ marginTop: 4 }}>{`${b.subject ? `${b.subject}، ` : ''}${b.count - b.offset} صفحة`}</Txt>
                {n ? <Txt color={theme.primary} style={{ marginTop: 4 }}>{`تظليلات في ${n} صفحات`}</Txt> : null}
              </Card>
            </Pressable>
          );
        })}
        <Btn title="رجوع" kind="outline" onPress={() => setSection(null)} />
      </ScrollView>
    );
  }

  const addDef = (b, c, d) => {
    const old = (progress[gradeId] && progress[gradeId].notes) || [];
    const key = `def:${b.id}:${c.id}:${d.term}`;
    if (old.some((n) => n.key === key)) return Alert.alert('مفكرتي', 'هذا التعريف موجود في مفكرتي.');
    updateProgress(gradeId, { notes: mergeNotes(old, [{ kind: 'definition', key, title: d.term, body: d.def, subject: b.title }]) });
    Alert.alert('مفكرتي', 'أُضيف التعريف إلى مفكرتي.');
  };

  // شاشة الملخص
  if (book && ch) {
    const s = ch.summary; const exam = chapterExam(gradeId, book, ch);
    return (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Txt size={24} weight="800">{ch.title}</Txt>
        <Txt color={theme.sub} style={{ marginBottom: 12 }}>{`${book.title}، الصفحات ${ch.pages[0]} إلى ${ch.pages[1]}`}</Txt>
        <Card><Txt>{s.intro}</Txt></Card>
        {s.sections.map((x) => <Card key={x.h}><Txt weight="700" size={18}>{x.h}</Txt><Txt style={{ marginTop: 4 }}>{x.body}</Txt></Card>)}
        {s.definitions && s.definitions.length ? (
          <Card>
            <Txt weight="800" size={18} color={theme.primary} style={{ marginBottom: 6 }}>تعريفات مهمة</Txt>
            {s.definitions.map((d) => (
              <View key={d.term} style={{ marginBottom: 10 }}>
                <Txt><Txt weight="700">{`${d.term}: `}</Txt>{d.def}</Txt>
                <Row style={{ marginTop: 6 }}><Chip label="أضف إلى مفكرتي" onPress={() => addDef(book, ch, d)} /></Row>
              </View>
            ))}
          </Card>
        ) : null}
        {exam.questions.length ? <Btn title={`اختبر نفسك (الصفحات ${ch.pages[0]} إلى ${ch.pages[1]})`} onPress={() => onStart(exam)} /> : null}
        <Btn title="رجوع" kind="outline" onPress={() => setChapterId(null)} />
      </ScrollView>
    );
  }

  // شاشة الكتاب: الفصول والأبواب
  if (book) {
    const chs = book.chapters.filter((c) => c.semester === sem);
    const semEx = semesterExam(gradeId, book, sem);
    return (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Txt size={26} weight="800" style={{ marginBottom: 12 }}>{book.title}</Txt>
        <Row>{[1, 2].map((n) => <Chip key={n} label={n === 1 ? 'الفصل الأول' : 'الفصل الثاني'} active={sem === n} onPress={() => setSem(n)} />)}</Row>
        {chs.length === 0 ? <Card><Txt color={theme.sub}>لا توجد أبواب في هذا الفصل بعد.</Txt></Card> : chs.map((c) => (
          <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`${c.title}، الصفحات ${c.pages[0]} إلى ${c.pages[1]}`} onPress={() => setChapterId(c.id)}>
            <Card><Txt size={18} weight="700">{c.title}</Txt><Txt color={theme.sub} style={{ marginTop: 4 }}>{`الصفحات ${c.pages[0]} إلى ${c.pages[1]}`}</Txt></Card>
          </Pressable>
        ))}
        {semEx.questions.length ? <Btn title={`اختبار ${sem === 1 ? 'الفصل الأول' : 'الفصل الثاني'} الشامل`} onPress={() => onStart(semEx)} /> : null}
        <Btn title="رجوع" kind="outline" onPress={() => setBookId(null)} />
      </ScrollView>
    );
  }

  // قائمة الكتب
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Txt size={26} weight="800" style={{ marginBottom: 12 }}>الملخصات</Txt>
      {isSampleContent(gradeId) ? <Card><Txt color={theme.sub}>الكتب الحالية نماذج تجريبية لعرض الشكل. نضع ملخصات كتب صفك لاحقاً.</Txt></Card> : null}
      {books.map((b) => (
        <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`كتاب ${b.title}`} onPress={() => { setBookId(b.id); setSem(1); }}>
          <Card><Txt size={20} weight="700">{b.title}</Txt><Txt color={theme.sub} style={{ marginTop: 4 }}>{`${b.chapters.length} أبواب`}</Txt></Card>
        </Pressable>
      ))}
      <Btn title="رجوع" kind="outline" onPress={() => setSection(null)} />
    </ScrollView>
  );
}
