import React from 'react';
import { ScrollView, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { answerText, chapterReport, correctText, fmtTime, PASS_MARK, qTitle, WEAK_BELOW } from '../utils/exam';
import { Btn, Card, Row, Txt } from '../components/UI';

export default function ExamResult({ result, answers, onRetry, onExit }) {
  const { theme } = useApp();
  const pass = result.percent >= PASS_MARK;
  const wrong = result.details.filter((d) => d.fraction < 1);
  const full = result.details.length - wrong.length;
  const report = chapterReport(result.details);
  const weak = report.filter((c) => c.percent < WEAK_BELOW);
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Card style={{ alignItems: 'center' }}>
        <Txt size={52} weight="800" color={pass ? theme.primary : theme.danger} style={{ textAlign: 'center' }}>{result.percent}</Txt>
        <Txt style={{ textAlign: 'center' }}>من 100</Txt>
        <Txt size={20} weight="700" color={pass ? theme.primary : theme.danger} style={{ textAlign: 'center', marginTop: 6 }}>{pass ? 'ناجح' : 'راسب'}</Txt>
        <Txt color={theme.sub} style={{ textAlign: 'center', marginTop: 6 }}>{`إجابات صحيحة كاملة: ${full} من ${result.details.length}`}</Txt>
        {result.seconds ? <Txt color={theme.sub} style={{ textAlign: 'center', marginTop: 4 }}>{`الزمن المستغرق: ${fmtTime(result.seconds)}`}</Txt> : null}
        {result.gems > 0 ? <Txt color={theme.primary} weight="700" style={{ textAlign: 'center', marginTop: 6 }}>{`كسبت ${result.gems} جواهر`}</Txt> : null}
      </Card>
      {report.length ? (
        <View>
          <Txt size={20} weight="800" style={{ marginVertical: 10 }}>تقرير الأبواب</Txt>
          {report.map((c) => (
            <Card key={c.title}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt weight="700" style={{ flex: 1 }}>{c.title}</Txt>
                <Txt weight="800" color={c.percent < WEAK_BELOW ? theme.danger : theme.primary}>{`${c.percent}%`}</Txt>
              </Row>
              {c.percent < WEAK_BELOW ? <Txt color={theme.danger} style={{ marginTop: 4 }}>راجع هذا الباب</Txt> : null}
            </Card>
          ))}
          <Txt color={theme.sub}>{weak.length ? `ابدأ مراجعتك بهذه الأبواب: ${weak.map((c) => c.title).join('، ')}.` : 'مستواك جيد في كل الأبواب.'}</Txt>
        </View>
      ) : null}
      <Txt size={20} weight="800" style={{ marginVertical: 10 }}>مراجعة الأخطاء</Txt>
      {wrong.length ? <Txt color={theme.sub} style={{ marginBottom: 8 }}>أُضيفت الأسئلة التي أخطأت فيها إلى مفكرتي.</Txt> : null}
      {wrong.length === 0 ? <Card><Txt>لا توجد أخطاء. أحسنت.</Txt></Card> : wrong.map(({ q }) => (
        <Card key={q.id}>
          <Txt weight="700">{qTitle(q)}</Txt>
          <Txt color={theme.danger} style={{ marginTop: 6 }}>{`إجابتك: ${answerText(q, answers[q.id])}`}</Txt>
          <Txt color={theme.primary} style={{ marginTop: 4 }}>{`الإجابة الصحيحة: ${correctText(q)}`}</Txt>
        </Card>
      ))}
      <Btn title={exam && exam.minutes ? 'إعادة الامتحان' : 'إعادة الاختبار'} onPress={onRetry} />
      <Btn title="العودة إلى الاختبارات" kind="outline" onPress={onExit} />
    </ScrollView>
  );
}
