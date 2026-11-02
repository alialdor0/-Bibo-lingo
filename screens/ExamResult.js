import React from 'react';
import { ScrollView } from 'react-native';
import { useApp } from '../context/AppContext';
import { answerText, correctText, PASS_MARK, qTitle } from '../utils/exam';
import { Btn, Card, Txt } from '../components/UI';

export default function ExamResult({ result, answers, onRetry, onExit }) {
  const { theme } = useApp();
  const pass = result.percent >= PASS_MARK;
  const wrong = result.details.filter((d) => d.fraction < 1);
  const full = result.details.length - wrong.length;
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Card style={{ alignItems: 'center' }}>
        <Txt size={52} weight="800" color={pass ? theme.primary : theme.danger} style={{ textAlign: 'center' }}>{result.percent}</Txt>
        <Txt style={{ textAlign: 'center' }}>من 100</Txt>
        <Txt size={20} weight="700" color={pass ? theme.primary : theme.danger} style={{ textAlign: 'center', marginTop: 6 }}>{pass ? 'ناجح' : 'راسب'}</Txt>
        <Txt color={theme.sub} style={{ textAlign: 'center', marginTop: 6 }}>{`إجابات صحيحة كاملة: ${full} من ${result.details.length}`}</Txt>
        {result.gems > 0 ? <Txt color={theme.primary} weight="700" style={{ textAlign: 'center', marginTop: 6 }}>{`كسبت ${result.gems} جواهر`}</Txt> : null}
      </Card>
      <Txt size={20} weight="800" style={{ marginVertical: 10 }}>مراجعة الأخطاء</Txt>
      {wrong.length === 0 ? <Card><Txt>لا توجد أخطاء. أحسنت.</Txt></Card> : wrong.map(({ q }) => (
        <Card key={q.id}>
          <Txt weight="700">{qTitle(q)}</Txt>
          <Txt color={theme.danger} style={{ marginTop: 6 }}>{`إجابتك: ${answerText(q, answers[q.id])}`}</Txt>
          <Txt color={theme.primary} style={{ marginTop: 4 }}>{`الإجابة الصحيحة: ${correctText(q)}`}</Txt>
        </Card>
      ))}
      <Btn title="إعادة الاختبار" onPress={onRetry} />
      <Btn title="العودة إلى الاختبارات" kind="outline" onPress={onExit} />
    </ScrollView>
  );
}
