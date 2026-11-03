import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { equippedValue } from '../data/store';
import { KIND, LEVEL, mergeNotes } from '../utils/notes';
import { Btn, Card, Chip, Field, Row, Txt } from '../components/UI';

const FILTERS = [['all', 'الكل'], ['l0', 'جديدة'], ['l1', 'قيد التعلم'], ['l2', 'متقنة'], ['fav', 'المفضلة']];

export default function Notebook() {
  const { theme, gradeId, progress, updateProgress, inv } = useApp();
  const notes = (progress[gradeId] && progress[gradeId].notes) || [];
  const [filter, setFilter] = useState('all');
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [quiz, setQuiz] = useState(null); // { queue, i, shown }
  const save = (next) => updateProgress(gradeId, { notes: next });
  const patch = (id, p) => save(notes.map((n) => (n.id === id ? { ...n, ...p } : n)));
  const cover = equippedValue(inv, 'cover', theme.primary);
  const ink = equippedValue(inv, 'pen', theme.text);

  const shown = notes.filter((n) => filter === 'all' || (filter === 'fav' ? n.fav : filter === `l${n.level}`));

  // الاختبار السريع على ما لم يُتقن بعد
  if (quiz) {
    const done = quiz.i >= quiz.queue.length;
    const n = !done && notes.find((x) => x.id === quiz.queue[quiz.i]);
    const next = (level) => { if (n) patch(n.id, { level }); setQuiz({ ...quiz, i: quiz.i + 1, shown: false }); };
    return (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Txt size={24} weight="800" style={{ marginBottom: 12 }}>اختبر نفسي</Txt>
        {done || !n ? (
          <Card><Txt size={18} weight="700">انتهى الاختبار السريع.</Txt></Card>
        ) : (
          <Card>
            <Txt color={theme.sub}>{`${quiz.i + 1} من ${quiz.queue.length}`}</Txt>
            <Txt size={20} weight="700" color={ink} style={{ marginVertical: 10 }}>{n.title}</Txt>
            {quiz.shown ? <Txt size={17}>{n.body}</Txt> : null}
          </Card>
        )}
        {!done && n && !quiz.shown ? <Btn title="أظهر الجواب" onPress={() => setQuiz({ ...quiz, shown: true })} /> : null}
        {!done && n && quiz.shown ? (
          <Row>
            <View style={{ flex: 1, marginHorizontal: 4 }}><Btn title="عرفتها" onPress={() => next(Math.min(2, n.level + 1))} /></View>
            <View style={{ flex: 1, marginHorizontal: 4 }}><Btn title="لم أعرفها" kind="outline" onPress={() => next(0)} /></View>
          </Row>
        ) : null}
        <Btn title={done || !n ? 'العودة إلى مفكرتي' : 'إنهاء'} kind="outline" onPress={() => setQuiz(null)} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <View style={{ backgroundColor: cover, borderRadius: 14, padding: 18, marginBottom: 14 }}>
        <Txt size={26} weight="800" color="#FFFFFF">مفكرتي</Txt>
        <Txt color="#FFFFFF">{`${notes.length} ملاحظة`}</Txt>
      </View>
      <Row style={{ flexWrap: 'wrap' }}>{FILTERS.map(([id, l]) => <Chip key={id} label={l} active={filter === id} onPress={() => setFilter(id)} />)}</Row>

      {adding ? (
        <Card>
          <Field label="العنوان" value={title} onChangeText={setTitle} />
          <Field label="الملاحظة" value={body} onChangeText={setBody} multiline />
          <Btn title="حفظ" disabled={!title.trim() || !body.trim()} onPress={() => {
            save(mergeNotes(notes, [{ kind: 'note', title: title.trim(), body: body.trim() }]));
            setTitle(''); setBody(''); setAdding(false);
          }} />
          <Btn title="إلغاء" kind="outline" onPress={() => setAdding(false)} />
        </Card>
      ) : (
        <>
          <Btn title="إضافة ملاحظة" onPress={() => setAdding(true)} />
          <Btn title="اختبر نفسي" kind="outline" disabled={!notes.some((n) => n.level < 2)}
            onPress={() => setQuiz({ queue: notes.filter((n) => n.level < 2).slice(0, 5).map((n) => n.id), i: 0, shown: false })} />
        </>
      )}

      <View style={{ height: 12 }} />
      {shown.length === 0 ? <Card><Txt color={theme.sub}>{notes.length ? 'لا توجد ملاحظات في هذا التصنيف.' : 'مفكرتي فارغة. تُضاف إليها الأسئلة التي تخطئ فيها وتعريفات تختارها من المكتبة، ويمكنك كتابة ملاحظاتك.'}</Txt></Card> : shown.map((n) => (
        <Card key={n.id}>
          <Txt color={theme.sub} size={13}>{`${KIND[n.kind] || 'ملاحظة'}${n.subject ? `، ${n.subject}` : ''}`}</Txt>
          <Txt weight="700" size={18} color={ink} style={{ marginTop: 2 }}>{n.title}</Txt>
          <Txt style={{ marginTop: 4, marginBottom: 8 }}>{n.body}</Txt>
          <Row style={{ flexWrap: 'wrap' }}>
            <Chip label={LEVEL[n.level]} active={n.level === 2} onPress={() => patch(n.id, { level: (n.level + 1) % 3 })} />
            <Chip label={n.fav ? 'مفضلة' : 'تفضيل'} active={n.fav} onPress={() => patch(n.id, { fav: !n.fav })} />
            <Chip label="حذف" onPress={() => Alert.alert('حذف', 'هل تريد حذف هذه الملاحظة؟', [
              { text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => save(notes.filter((x) => x.id !== n.id)) },
            ])} />
          </Row>
        </Card>
      ))}
    </ScrollView>
  );
}
