import React, { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { PERIODS, SUBJECTS } from '../data/subjects';
import { DAY_NAMES, SCHOOL_DAYS } from '../utils/dates';
import { newId } from '../utils/profiles';
import { Btn, Card, Chip, Field, Row, Txt } from '../components/UI';

export default function Schedule({ onBack }) {
  const { theme, gradeId, progress, updateProgress } = useApp();
  const list = (progress[gradeId] && progress[gradeId].schedule) || [];
  const today = new Date().getDay();
  const [day, setDay] = useState(SCHOOL_DAYS.includes(today) ? today : 0);
  const [adding, setAdding] = useState(false);
  const [period, setPeriod] = useState(1);
  const [subject, setSubject] = useState('');
  const [teacher, setTeacher] = useState('');
  const save = (next) => updateProgress(gradeId, { schedule: next });
  const dayList = list.filter((s) => s.day === day).sort((a, b) => a.period - b.period);

  const add = () => {
    // حصة واحدة لكل رقم في اليوم: الجديدة تحل محل القديمة
    save([...list.filter((s) => !(s.day === day && s.period === period)), { id: newId(), day, period, subject: subject.trim(), teacher: teacher.trim() }]);
    setSubject(''); setTeacher(''); setAdding(false);
  };
  const confirmDelete = (s) => Alert.alert('حذف الحصة', 'هل تريد حذف هذه الحصة من الجدول؟', [
    { text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => save(list.filter((x) => x.id !== s.id)) },
  ]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <Txt size={26} weight="800" style={{ marginBottom: 12 }}>جدول الحصص</Txt>
      <Row style={{ flexWrap: 'wrap' }}>{SCHOOL_DAYS.map((d) => <Chip key={d} label={DAY_NAMES[d]} active={day === d} onPress={() => { setDay(d); setAdding(false); }} />)}</Row>
      {dayList.length === 0 ? <Card><Txt color={theme.sub}>{`لا توجد حصص يوم ${DAY_NAMES[day]} بعد.`}</Txt></Card> : dayList.map((s) => (
        <Card key={s.id}>
          <Txt weight="700" size={18}>{`الحصة ${s.period}: ${s.subject}`}</Txt>
          {s.teacher ? <Txt color={theme.sub}>{`المدرّس: ${s.teacher}`}</Txt> : null}
          <Row style={{ marginTop: 6 }}><Chip label="حذف" onPress={() => confirmDelete(s)} /></Row>
        </Card>
      ))}
      {adding ? (
        <Card>
          <Txt weight="700" style={{ marginBottom: 8 }}>{`إضافة حصة يوم ${DAY_NAMES[day]}`}</Txt>
          <Row style={{ flexWrap: 'wrap' }}>{PERIODS.map((p) => <Chip key={p} label={`الحصة ${p}`} active={period === p} onPress={() => setPeriod(p)} />)}</Row>
          <Field label="المادة" value={subject} onChangeText={setSubject} placeholder="اكتب أو اختر من الأسفل" />
          <Row style={{ flexWrap: 'wrap' }}>{SUBJECTS.map((s) => <Chip key={s} label={s} active={subject === s} onPress={() => setSubject(s)} />)}</Row>
          <Field label="اسم المدرّس (اختياري)" value={teacher} onChangeText={setTeacher} />
          <Btn title="حفظ" disabled={!subject.trim()} onPress={add} />
          <Btn title="إلغاء" kind="outline" onPress={() => setAdding(false)} />
        </Card>
      ) : <Btn title="إضافة حصة" onPress={() => setAdding(true)} />}
      <Btn title="رجوع" kind="outline" onPress={onBack} />
    </ScrollView>
  );
}
