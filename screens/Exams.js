import React from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { getExams } from '../data/exams';
import { buildMinisterialExam, ministerialBooks, minutesFor } from '../data/ministerial';
import { Card, Txt } from '../components/UI';

export default function Exams({ onStart }) {
  const { theme, gradeId, progress } = useApp();
  const results = (progress[gradeId] && progress[gradeId].results) || [];
  const mBooks = ministerialBooks(gradeId);
  const startMinisterial = (b) => {
    const ex = buildMinisterialExam(gradeId, b);
    Alert.alert('بدء الامتحان', `مدته ${ex.minutes} دقيقة ولا يتوقف المؤقت. هل أنت مستعد؟`, [{ text: 'لاحقاً', style: 'cancel' }, { text: 'ابدأ', onPress: () => onStart(ex) }]);
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Txt size={26} weight="800" style={{ marginBottom: 12 }}>الاختبارات</Txt>
      {mBooks.length ? (
        <View>
          <Txt size={20} weight="800" style={{ marginBottom: 8 }}>الامتحان الوزاري</Txt>
          <Card><Txt color={theme.sub}>امتحان شامل لكل المنهج بمؤقت. لا تظهر النتيجة إلا بعد التسليم، ويُسلَّم تلقائياً عند انتهاء الوقت.</Txt></Card>
          {mBooks.map((b) => {
            const n = Math.min(b.questions.length, 30);
            return (
              <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`الامتحان الوزاري ${b.title}، ${n} سؤالاً، ${minutesFor(n)} دقيقة`} onPress={() => startMinisterial(b)}>
                <Card><Txt size={18} weight="700">{`امتحان ${b.title} الوزاري`}</Txt><Txt color={theme.sub} style={{ marginTop: 4 }}>{`${n} سؤالاً، ${minutesFor(n)} دقيقة`}</Txt></Card>
              </Pressable>
            );
          })}
          <Txt size={20} weight="800" style={{ marginVertical: 8 }}>اختبارات التدريب</Txt>
        </View>
      ) : null}
      <Card><Txt color={theme.sub}>الأسئلة الحالية تجريبية لعرض الشكل. نضع أسئلة كتب صفك لاحقاً.</Txt></Card>
      {getExams(gradeId).map((ex) => {
        const last = [...results].reverse().find((r) => r.examId === ex.id);
        return (
          <Pressable key={ex.id} accessibilityRole="button" accessibilityLabel={`${ex.title}، ${ex.questions.length} أسئلة`} onPress={() => onStart(ex)}>
            <Card>
              <Txt size={18} weight="700">{ex.title}</Txt>
              <Txt color={theme.sub} style={{ marginTop: 4 }}>{`${ex.kind === 'semester' ? 'اختبار فصل' : 'اختبار صفحات'}، الفصل ${ex.semester === 1 ? 'الأول' : 'الثاني'}، ${ex.questions.length} أسئلة`}</Txt>
              {last ? <Txt color={theme.primary} weight="700" style={{ marginTop: 6 }}>{`آخر درجة: ${last.percent} من 100`}</Txt> : null}
            </Card>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
