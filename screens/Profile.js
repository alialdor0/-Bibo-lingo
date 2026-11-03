import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { findGrade } from '../data/stages';
import { equippedValue } from '../data/store';
import { buildPeriods, reportHtml, subjectOf, summarize } from '../utils/results';
import { Btn, Card, Row, Txt } from '../components/UI';
import { PASS_MARK } from '../utils/exam';
import Store from './Store';
import Settings from './Settings';

export default function Profile({ onChangeGrade }) {
  const { theme, user, gradeId, progress, gems, inv } = useApp();
  const [sub, setSub] = useState(null); // null | 'store' | 'settings'
  const info = findGrade(gradeId);
  const gradeName = info ? info.grade.name : '';
  const results = (progress[gradeId] && progress[gradeId].results) || [];
  const periods = buildPeriods(results);
  const sum = summarize(results);
  const sticker = equippedValue(inv, 'sticker', '');

  useEffect(() => {
    const h = BackHandler.addEventListener('hardwareBackPress', () => { if (sub) { setSub(null); return true; } return false; });
    return () => h.remove();
  }, [sub]);

  const exportPdf = async () => {
    try {
      const Print = require('expo-print');
      const Sharing = require('expo-sharing');
      const { uri } = await Print.printToFileAsync({ html: reportHtml({ user, gradeName, results }) });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'كشف الدرجات' });
      else Alert.alert('تعذر المشاركة', 'المشاركة غير متاحة على هذا الجهاز.');
    } catch (e) {
      Alert.alert('تعذر إنشاء الملف', 'حاول مرة أخرى.');
    }
  };

  if (sub) {
    return (
      <View style={{ flex: 1 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="رجوع إلى ملفي" onPress={() => setSub(null)} style={{ padding: 16, paddingBottom: 0 }}>
          <Txt color={theme.primary} weight="700">رجوع إلى ملفي</Txt>
        </Pressable>
        {sub === 'store' ? <Store /> : <Settings onChangeGrade={onChangeGrade} />}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Txt size={26} weight="800" style={{ marginBottom: 12 }}>ملفي</Txt>
      <Card>
        <Txt size={22} weight="800">{`${sticker} ${user.name}`.trim()}</Txt>
        <Txt color={theme.sub} style={{ marginTop: 4 }}>{user.school}</Txt>
        <Txt color={theme.sub}>{`الشعبة ${user.section}، ${gradeName}`}</Txt>
        <Txt color={theme.primary} weight="700" style={{ marginTop: 8 }}>{`الجواهر: ${gems}`}</Txt>
      </Card>
      <Btn title="المتجر" onPress={() => setSub('store')} />
      <Btn title="الإعدادات" kind="outline" onPress={() => setSub('settings')} />
      <View style={{ height: 12 }} />
      <Card>
        <Row style={{ justifyContent: 'space-around' }}>
          {[['المعدل', sum.avg], ['الاختبارات', sum.exams], ['الناجحة', sum.passed]].map(([l, v]) => (
            <Txt key={l} style={{ textAlign: 'center' }} weight="700">{`${v}\n${l}`}</Txt>
          ))}
        </Row>
      </Card>
      <Txt size={20} weight="800" style={{ marginVertical: 8 }}>نتائجي</Txt>
      {periods.length === 0 ? <Card><Txt color={theme.sub}>لا توجد نتائج بعد. أجرِ اختباراً من تبويب الاختبارات أو المكتبة.</Txt></Card> : periods.map((p) => (
        <Card key={p.key}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt weight="800" size={17}>{p.label}</Txt>
            <Txt weight="800" color={p.avg >= PASS_MARK ? theme.primary : theme.danger}>{`${p.avg} من 100`}</Txt>
          </Row>
          {p.items.map((r) => <Txt key={r.examId} color={theme.sub} style={{ marginTop: 4 }}>{`${subjectOf(r)}: ${r.title.replace(/^اختبار /, '')} (${r.percent})`}</Txt>)}
        </Card>
      ))}
      <Btn title="تصدير كشف الدرجات (PDF)" disabled={results.length === 0} onPress={exportPdf} />
      <Txt size={13} color={theme.sub} style={{ marginTop: 8 }}>تُحتسب أفضل محاولة لكل اختبار.</Txt>
    </ScrollView>
  );
}
