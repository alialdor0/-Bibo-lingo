import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { findGrade } from '../data/stages';
import { Card, Row, Txt } from '../components/UI';
import Exams from './Exams';
import ExamRun from './ExamRun';
import Library from './Library';
import Notebook from './Notebook';
import Profile from './Profile';

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
  const { theme, user, gradeId, gems } = useApp();
  const [tab, setTab] = useState('home');
  const [run, setRun] = useState(null); // الاختبار الجاري
  const info = findGrade(gradeId);

  let body;
  if (run) body = <ExamRun key={run.id} exam={run} onExit={() => setRun(null)} />;
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
        {Object.keys(DESC).map((id) => (
          <Pressable key={id} accessibilityRole="button" accessibilityLabel={TABS.find((t) => t.id === id).label} onPress={() => setTab(id)}>
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
              onPress={() => setTab(t.id)} style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderTopWidth: 3, borderTopColor: tab === t.id ? theme.accent : 'transparent' }}>
              <Txt size={13} weight={tab === t.id ? '800' : '500'} color={tab === t.id ? theme.primary : theme.sub} style={{ textAlign: 'center' }}>{t.label}</Txt>
            </Pressable>
          ))}
        </Row>
      )}
    </SafeAreaView>
  );
}
