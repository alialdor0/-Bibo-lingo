import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { SUBJECTS } from '../data/subjects';
import { dueLabel, dueOptions, daysUntil } from '../utils/dates';
import { newId } from '../utils/profiles';
import { Btn, Card, Chip, Field, Row, Txt } from '../components/UI';

export default function Homework({ onBack, remStatus }) {
  const { theme, gradeId, progress, updateProgress } = useApp();
  const list = (progress[gradeId] && progress[gradeId].homework) || [];
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState('homework');
  const [subject, setSubject] = useState('');
  const [title, setTitle] = useState('');
  const options = dueOptions();
  const [due, setDue] = useState(options[1].value);
  const save = (next) => updateProgress(gradeId, { homework: next });

  const pending = list.filter((h) => !h.done).sort((a, b) => a.due.localeCompare(b.due));
  const done = list.filter((h) => h.done).sort((a, b) => b.due.localeCompare(a.due)).slice(0, 10);
  const add = () => {
    save([...list, { id: newId(), kind, subject: subject.trim(), title: title.trim(), due, done: false, created: new Date().toISOString() }]);
    setSubject(''); setTitle(''); setAdding(false);
  };
  const confirmDelete = (h) => Alert.alert('حذف', 'هل تريد حذف هذا العنصر؟', [
    { text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => save(list.filter((x) => x.id !== h.id)) },
  ]);

  const Item = ({ h }) => {
    const late = !h.done && daysUntil(h.due) < 0;
    return (
      <Card>
        <Txt color={theme.sub} size={13}>{h.kind === 'exam' ? 'اختبار' : 'واجب'}</Txt>
        <Txt weight="700" size={18}>{`${h.subject}: ${h.title}`}</Txt>
        <Txt color={late ? theme.danger : theme.sub} weight={late ? '700' : '400'} style={{ marginVertical: 4 }}>{h.done ? 'تم' : dueLabel(h.due)}</Txt>
        <Row style={{ flexWrap: 'wrap' }}>
          <Chip label={h.done ? 'إعادة فتحه' : 'تم إنجازه'} active={!h.done} onPress={() => save(list.map((x) => (x.id === h.id ? { ...x, done: !x.done } : x)))} />
          <Chip label="حذف" onPress={() => confirmDelete(h)} />
        </Row>
      </Card>
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <Txt size={26} weight="800" style={{ marginBottom: 12 }}>الواجبات والاختبارات</Txt>
      {remStatus === 'denied' ? <Card><Txt color={theme.danger}>الإشعارات مغلقة من إعدادات الجهاز، فلن تصلك التذكيرات. افتح إعدادات الجهاز ثم التطبيق وفعّل الإشعارات.</Txt></Card> : null}
      {adding ? (
        <Card>
          <Row>
            <Chip label="واجب" active={kind === 'homework'} onPress={() => setKind('homework')} />
            <Chip label="اختبار" active={kind === 'exam'} onPress={() => setKind('exam')} />
          </Row>
          <Field label="المادة" value={subject} onChangeText={setSubject} placeholder="اكتب أو اختر من الأسفل" />
          <Row style={{ flexWrap: 'wrap' }}>{SUBJECTS.map((s) => <Chip key={s} label={s} active={subject === s} onPress={() => setSubject(s)} />)}</Row>
          <Field label={kind === 'exam' ? 'موضوع الاختبار' : 'عنوان الواجب'} value={title} onChangeText={setTitle} />
          <Txt weight="700" style={{ marginBottom: 8 }}>{kind === 'exam' ? 'موعد الاختبار' : 'موعد التسليم'}</Txt>
          <Row style={{ flexWrap: 'wrap' }}>{options.map((o) => <Chip key={o.value} label={o.label} active={due === o.value} onPress={() => setDue(o.value)} />)}</Row>
          <Btn title="حفظ" disabled={!subject.trim() || !title.trim()} onPress={add} />
          <Btn title="إلغاء" kind="outline" onPress={() => setAdding(false)} />
        </Card>
      ) : <Btn title="إضافة واجب أو اختبار" onPress={() => setAdding(true)} />}

      <Txt size={20} weight="800" style={{ marginTop: 16, marginBottom: 8 }}>القادمة</Txt>
      {pending.length === 0 ? <Card><Txt color={theme.sub}>لا توجد واجبات قادمة.</Txt></Card> : pending.map((h) => <Item key={h.id} h={h} />)}
      {done.length ? <View><Txt size={20} weight="800" style={{ marginTop: 8, marginBottom: 8 }}>المنجزة</Txt>{done.map((h) => <Item key={h.id} h={h} />)}</View> : null}
      <Btn title="رجوع" kind="outline" onPress={onBack} />
    </ScrollView>
  );
}
