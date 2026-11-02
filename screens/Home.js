import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { findGrade } from '../data/stages';
import { Card, Row, Txt } from '../components/UI';
import Settings from './Settings';
import Exams from './Exams';
import ExamRun from './ExamRun';
import Library from './Library';
import Profile from './Profile';

const TABS = [
  { id: 'home', label: 'الرئيسية' },
  { id: 'library', label: 'المكتبة' },
  { id: 'exams', label: 'الاختبارات' },
  { id: 'profile', label: 'ملفي' },
  { id: 'settings', label: 'الإعدادات' },
];

const SOON = {
  library: 'ستظهر هنا كتب صفك مقسمة حسب الفصل الأول والفصل الثاني.',
  exams: 'اختبارات الصفحات واختبار الفصل الكامل، مع الدرجة ومراجعة الأخطاء.',
  profile: 'ستظهر هنا نتائجك حسب الأشهر ونصف السنة وآخر السنة.',
};

export default function Home({ onChangeGrade }) {
  const { theme, user, gradeId } = useApp();
  const [tab, setTab] = useState('home');
  const [run, setRun] = useState(null); // الاختبار الجاري
  const info = findGrade(gradeId);

  let body;
  if (run) body = <ExamRun key={run.id} exam={run} onExit={() => setRun(null)} />;
  else if (tab === 'settings') body = <Settings onChangeGrade={onChangeGrade} />;
  else if (tab === 'exams') body = <Exams onStart={setRun} />;
  else if (tab === 'library') body = <Library onStart={setRun} />;
  else if (tab === 'profile') body = <Profile />;
  else if (tab === 'home') {
    body = (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Txt size={28} weight="800" style={{ marginTop: 12 }}>أهلاً {user.name}</Txt>
        <Txt color={theme.sub} style={{ marginBottom: 4 }}>{user.school}</Txt>
        <Txt color={theme.sub} style={{ marginBottom: 18 }}>الشعبة {user.section}، {info ? info.grade.name : ''}</Txt>
        {TABS.filter((t) => SOON[t.id]).map((t) => (
          <Pressable key={t.id} accessibilityRole="button" accessibilityLabel={t.label} onPress={() => setTab(t.id)}>
            <Card><Txt size={20} weight="700">{t.label}</Txt><Txt color={theme.sub} style={{ marginTop: 4 }}>{SOON[t.id]}</Txt></Card>
          </Pressable>
        ))}
      </ScrollView>
    );
  } else {
    body = (
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Txt size={26} weight="800" style={{ marginBottom: 12 }}>{TABS.find((t) => t.id === tab).label}</Txt>
        <Card><Txt>{SOON[tab]}</Txt></Card>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <View style={{ flex: 1 }}>{body}</View>
      {run ? null : <Row style={{ borderTopWidth: 1, borderTopColor: theme.border, backgroundColor: theme.card }}>
        {TABS.map((t) => (
          <Pressable
            key={t.id} accessibilityRole="tab" accessibilityLabel={t.label} accessibilityState={{ selected: tab === t.id }}
            onPress={() => setTab(t.id)} style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderTopWidth: 3, borderTopColor: tab === t.id ? theme.accent : 'transparent' }}>
            <Txt size={13} weight={tab === t.id ? '800' : '500'} color={tab === t.id ? theme.primary : theme.sub} style={{ textAlign: 'center' }}>{t.label}</Txt>
          </Pressable>
        ))}
      </Row>}
    </SafeAreaView>
  );
}
