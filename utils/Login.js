import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { SECTIONS } from '../data/stages';
import { Btn, Card, Chip, Field, Row, Txt } from '../components/UI';

export default function Login() {
  const { theme, login, students, deleteStudent } = useApp();
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [section, setSection] = useState('');
  const ok = name.trim() && school.trim() && section;
  const confirmDelete = (s) => Alert.alert('حذف البيانات', `هل تريد حذف كل بيانات ${s.user.name} من هذا الجهاز؟ لا يمكن التراجع.`, [
    { text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => deleteStudent(s.id) },
  ]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Txt size={28} weight="800" style={{ marginTop: 24, marginBottom: 6 }}>أهلاً بك في مدرستك</Txt>
        {students.length ? (
          <View>
            <Txt color={theme.sub} style={{ marginBottom: 14 }}>اختر اسمك للدخول، أو أضف طالباً جديداً.</Txt>
            {students.map((s) => (
              <Card key={s.id}>
                <Pressable accessibilityRole="button" accessibilityLabel={`دخول ${s.user.name}`} onPress={() => login(s.user)}>
                  <Txt size={19} weight="700">{s.user.name}</Txt>
                  <Txt color={theme.sub}>{`${s.user.school}، الشعبة ${s.user.section}`}</Txt>
                </Pressable>
                <Row style={{ marginTop: 8 }}><Chip label="حذف بياناته" onPress={() => confirmDelete(s)} /></Row>
              </Card>
            ))}
            <Txt size={20} weight="800" style={{ marginTop: 16, marginBottom: 4 }}>طالب جديد</Txt>
          </View>
        ) : null}
        <Txt color={theme.sub} style={{ marginBottom: 14 }}>اكتب بياناتك. إن كتبت الاسم والمدرسة والشعبة نفسها فستعود إليك بياناتك المحفوظة.</Txt>
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
