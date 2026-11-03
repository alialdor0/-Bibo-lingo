import React, { useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { correctText, gradeExam, isAnswered, qTitle } from '../utils/exam';
import { mergeNotes } from '../utils/notes';
import Question from '../components/Questions';
import { Btn, Row, Txt } from '../components/UI';
import ExamResult from './ExamResult';

export default function ExamRun({ exam, onExit }) {
  const { theme, gradeId, progress, updateProgress, addGems } = useApp();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const saved = useRef(false);
  const qs = exam.questions;
  const q = qs[idx];

  const confirmExit = () => Alert.alert('الخروج من الاختبار', 'ستفقد إجاباتك إن خرجت الآن.', [
    { text: 'البقاء', style: 'cancel' }, { text: 'خروج', style: 'destructive', onPress: onExit },
  ]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (result) onExit(); else confirmExit(); return true; });
    return () => sub.remove();
  }, [result]);

  const finish = () => {
    if (saved.current) return;
    saved.current = true;
    const r = gradeExam(exam, answers);
    const old = (progress[gradeId] && progress[gradeId].results) || [];
    // الجواهر: أول محاولة 2 + درجتك÷10، وفي الإعادة تُكسب فقط عند تحسّن الدرجة.
    const prev = old.filter((x) => x.examId === exam.id).map((x) => x.percent);
    const gems = prev.length ? Math.max(0, Math.floor((r.percent - Math.max(...prev)) / 10)) : 2 + Math.floor(r.percent / 10);
    if (gems) addGems(gems);
    // الأسئلة الخاطئة تُضاف تلقائياً إلى مفكرتي.
    const oldNotes = (progress[gradeId] && progress[gradeId].notes) || [];
    const wrongNotes = r.details.filter((d) => d.fraction < 1).map((d) => ({ kind: 'wrong', key: `wrong:${d.q.id}`, title: qTitle(d.q), body: correctText(d.q), subject: exam.subject }));
    updateProgress(gradeId, { notes: mergeNotes(oldNotes, wrongNotes), results: [...old, {
      examId: exam.id, subject: exam.subject, gems, title: exam.title, kind: exam.kind, semester: exam.semester, date: new Date().toISOString(),
      score: Math.round(r.score * 10) / 10, total: r.total, percent: r.percent,
      wrong: r.details.filter((d) => d.fraction < 1).map((d) => d.q.id),
    }] });
    setResult({ ...r, gems });
  };
  const askFinish = () => {
    const left = qs.filter((x) => !isAnswered(answers[x.id])).length;
    if (!left) return finish();
    Alert.alert('إنهاء الاختبار', `لم تجب عن ${left} من الأسئلة. هل تريد الإنهاء؟`, [
      { text: 'متابعة', style: 'cancel' }, { text: 'إنهاء', onPress: finish },
    ]);
  };

  if (result) {
    return <ExamResult result={result} answers={answers} onExit={onExit}
      onRetry={() => { saved.current = false; setAnswers({}); setIdx(0); setResult(null); }} />;
  }
  const last = idx === qs.length - 1;
  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 20, paddingBottom: 8 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt weight="700">{`سؤال ${idx + 1} من ${qs.length}`}</Txt>
          <Pressable accessibilityRole="button" accessibilityLabel="خروج من الاختبار" onPress={confirmExit}><Txt color={theme.danger} weight="700">خروج</Txt></Pressable>
        </Row>
        <View style={{ height: 6, backgroundColor: theme.border, borderRadius: 3, marginTop: 10 }}>
          <View style={{ height: 6, width: `${((idx + 1) / qs.length) * 100}%`, backgroundColor: theme.accent, borderRadius: 3 }} />
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 12 }} keyboardShouldPersistTaps="handled">
        <Question key={q.id} q={q} answer={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
      </ScrollView>
      <Row style={{ padding: 16 }}>
        <View style={{ flex: 1, marginHorizontal: 4 }}><Btn title={last ? 'إنهاء الاختبار' : 'التالي'} onPress={last ? askFinish : () => setIdx(idx + 1)} /></View>
        <View style={{ flex: 1, marginHorizontal: 4 }}><Btn title="السابق" kind="outline" disabled={idx === 0} onPress={() => setIdx(idx - 1)} /></View>
      </Row>
    </View>
  );
}
