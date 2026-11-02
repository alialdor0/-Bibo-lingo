import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { SECTIONS } from '../data/stages';
import { Btn, Chip, Field, Row, Txt } from '../components/UI';

export default function Login() {
  const { theme, login } = useApp();
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [section, setSection] = useState('');
  const ok = name.trim() && school.trim() && section;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Txt size={28} weight="800" style={{ marginTop: 24, marginBottom: 6 }}>أهلاً بك في مدرستك</Txt>
        <Txt color={theme.sub} style={{ marginBottom: 22 }}>اكتب بياناتك لتبدأ.</Txt>
        <Field label="الاسم" value={name} onChangeText={setName} placeholder="اسمك" />
        <Field label="المدرسة" value={school} onChangeText={setSchool} placeholder="اسم مدرستك" />
        <Txt weight="700" style={{ marginBottom: 8 }}>الشعبة</Txt>
        <Row style={{ flexWrap: 'wrap' }}>
          {SECTIONS.map((s) => <Chip key={s} label={s} active={section === s} onPress={() => setSection(s)} />)}
        </Row>
        <Btn title="دخول" disabled={!ok} onPress={() => login({ name: name.trim(), school: school.trim(), section })} />
      </ScrollView>
    </SafeAreaView>
  );
}
