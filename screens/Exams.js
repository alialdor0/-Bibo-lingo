import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { getExams } from '../data/exams';
import { Card, Txt } from '../components/UI';

export default function Exams({ onStart }) {
  const { theme, gradeId, progress } = useApp();
  const results = (progress[gradeId] && progress[gradeId].results) || [];
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Txt size={26} weight="800" style={{ marginBottom: 12 }}>الاختبارات</Txt>
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
