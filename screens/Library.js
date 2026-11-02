import React, { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { chapterExam, getBooks, isSampleContent, semesterExam } from '../data/books';
import { Btn, Card, Chip, Row, Txt } from '../components/UI';

export default function Library({ onStart }) {
  const { theme, gradeId } = useApp();
  const books = getBooks(gradeId);
  const [bookId, setBookId] = useState(null);
  const [chapterId, setChapterId] = useState(null);
  const [sem, setSem] = useState(1);
  const book = books.find((b) => b.id === bookId);
  const ch = book && book.chapters.find((c) => c.id === chapterId);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (chapterId) { setChapterId(null); return true; }
      if (bookId) { setBookId(null); return true; }
      return false;
    });
    return () => sub.remove();
  }, [bookId, chapterId]);

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
            {s.definitions.map((d) => <Txt key={d.term} style={{ marginBottom: 6 }}><Txt weight="700">{`${d.term}: `}</Txt>{d.def}</Txt>)}
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
      <Txt size={26} weight="800" style={{ marginBottom: 12 }}>المكتبة</Txt>
      {isSampleContent(gradeId) ? <Card><Txt color={theme.sub}>الكتب الحالية نماذج تجريبية لعرض الشكل. نضع ملخصات كتب صفك لاحقاً.</Txt></Card> : null}
      {books.map((b) => (
        <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`كتاب ${b.title}`} onPress={() => { setBookId(b.id); setSem(1); }}>
          <Card><Txt size={20} weight="700">{b.title}</Txt><Txt color={theme.sub} style={{ marginTop: 4 }}>{`${b.chapters.length} أبواب`}</Txt></Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}
