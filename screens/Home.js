import React, { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { findGrade } from '../data/stages';
import { dueLabel, daysUntil } from '../utils/dates';
import { syncReminders } from '../utils/reminders';
import { Card, Row, Txt } from '../components/UI';
import Exams from './Exams';
import ExamRun from './ExamRun';
import Homework from './Homework';
import Library from './Library';
import Notebook from './Notebook';
import Profile from './Profile';
import Schedule from './Schedule';

const TABS = [
  { id: 'home', label: 'الرئيسية' },
  { id: 'library', label: 'المكتبة' },
  { id: 'exams', label: 'الاختبارات' },
  { id: 'notebook', label: 'مفكرتي' },
  { id: 'profile', label: 'ملفي' },
];

const DESC = {
  library: 'ملخصات كتب صفك مقسمة حسب الفصل الأول والفصل الثاني.',
  exams: 'اختبارات الصفحات واختبار الفصل الكامل، مع الدرجة ومراجعة الأخطاء.',
  notebook: 'دفترك الخاص: الأسئلة التي أخطأت فيها وتعريفاتك وملاحظاتك.',
};

export default function Home({ onChangeGrade }) {
  const { theme, user, gradeId, gems, progress, settings } = useApp();
  const [tab, setTab] = useState('home');
  const [sub, setSub] = useState(null); // null | homework | schedule
  const [run, setRun] = useState(null); // الاختبار الجاري
  const [remStatus, setRemStatus] = useState(null);
  const info = findGrade(gradeId);
  const gp = progress[gradeId] || {};
  const homework = gp.homework || [];
  const schedule = gp.schedule || [];

  // مزامنة التذكيرات عند تغيّر الواجبات أو إعدادات الإشعارات
  const sig = JSON.stringify(homework.map((h) => [h.id, h.due, h.done, h.subject, h.title, h.kind]));
  const enabled = settings.notifications && !settings.offline;
  useEffect(() => {
    let alive = true;
    syncReminders(homework, enabled).then((r) => { if (alive) setRemStatus(r.ok ? 'ok' : r.reason); });
    return () => { alive = false; };
  }, [sig, enabled]);

  useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => { if (sub) { setSub(null); return true; } return false; });
    return () => h.remove();
  }, [sub]);

  const todayClasses = schedule.filter((s) => s.day === new Date().getDay()).sort((a, b) => a.period - b.period);
  const upcoming = homework.filter((h) => !h.done).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3);
  const go = (id) => { setSub(null); setTab(id); };

  let body;
  if (run) body = <ExamRun key={run.id} exam={run} onExit={() => setRun(null)} />;
  else if (tab === 'home' && sub === 'homework') body = <Homework onBack={() => setSub(null)} remStatus={remStatus} />;
  else if (tab === 'home' && sub === 'schedule') body = <Schedule onBack={() => setSub(null)} />;
  else if (tab === 'exams') body = <Exams onStart={setRun} />;
  else if (tab === 'library') body = <Library onStart={setRun} />;
  else if (tab === 'notebook') body = <Notebook />;
  else if (tab === 'profile') body = <Profile onChangeGrade={onChangeGrade} />;
  else {
    body = (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Txt size={28} weight="800" style={{ marginTop: 12 }}>أهلاً {user.name}</Txt>
        <Txt color={theme.sub}>{user.school}</Txt>
        <Txt color={theme.sub}>{`الشعبة ${user.section}، ${info ? info.grade.name : ''}`}</Txt>
        <Txt color={theme.primary} weight="700" style={{ marginBottom: 14 }}>{`الجواهر: ${gems}`}</Txt>

        <Pressable accessibilityRole="button" accessibilityLabel="جدول حصص اليوم" onPress={() => setSub('schedule')}>
          <Card>
            <Txt size={20} weight="700">حصص اليوم</Txt>
            {todayClasses.length === 0
              ? <Txt color={theme.sub} style={{ marginTop: 4 }}>{schedule.length ? 'لا توجد حصص اليوم.' : 'أضف جدول حصصك لتظهر هنا حصص كل يوم.'}</Txt>
              : todayClasses.map((s) => <Txt key={s.id} style={{ marginTop: 4 }}>{`الحصة ${s.period}: ${s.subject}`}</Txt>)}
          </Card>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="الواجبات والاختبارات" onPress={() => setSub('homework')}>
          <Card>
            <Txt size={20} weight="700">الواجبات والاختبارات</Txt>
            {upcoming.length === 0
              ? <Txt color={theme.sub} style={{ marginTop: 4 }}>لا توجد واجبات قادمة. اضغط للإضافة.</Txt>
              : upcoming.map((h) => <Txt key={h.id} color={daysUntil(h.due) < 0 ? theme.danger : theme.text} style={{ marginTop: 4 }}>{`${h.subject}: ${h.title} (${dueLabel(h.due)})`}</Txt>)}
          </Card>
        </Pressable>

        {Object.keys(DESC).map((id) => (
          <Pressable key={id} accessibilityRole="button" accessibilityLabel={TABS.find((t) => t.id === id).label} onPress={() => go(id)}>
            <Card><Txt size={20} weight="700">{TABS.find((t) => t.id === id).label}</Txt><Txt color={theme.sub} style={{ marginTop: 4 }}>{DESC[id]}</Txt></Card>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flex: 1 }}>{body}</View>
      {run ? null : (
        <Row style={{ borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.card }}>
          {TABS.map((t) => (
            <Pressable
              key={t.id} accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{ selected: tab === t.id }}
              onPress={() => go(t.id)} style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderTopWidth: 3, borderTopColor: tab === t.id ? theme.accent : 'transparent' }}>
              <Txt size={13} weight={tab === t.id ? '800' : '500'} color={tab === t.id ? theme.primary : theme.sub} style={{ textAlign: 'center' }}>{t.label}</Txt>
            </Pressable>
          ))}
        </Row>
      )}
    </SafeAreaView>
  );
}
