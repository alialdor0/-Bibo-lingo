import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { STAGES } from '../data/stages';
import { Btn, Card, Txt } from '../components/UI';

// mode='stage': اختيار المرحلة. mode='grade': اختيار الصف داخل المرحلة.
export default function Pick({ mode, stageId, canBack, onBack, onStage, onGrade }) {
  const { theme, gradeId } = useApp();
  const stage = STAGES.find((s) => s.id === stageId);
  const items = mode === 'stage' ? STAGES : stage ? stage.grades : [];
  const title = mode === 'stage' ? 'اختر المرحلة الدراسية' : `اختر الصف (${stage ? stage.name : ''})`;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Txt size={26} weight="800" style={{ marginTop: 16, marginBottom: 18 }}>{title}</Txt>
        {items.map((it) => (
          <Pressable
            key={it.id} accessibilityRole="button" accessibilityLabel={it.name}
            accessibilityState={{ selected: it.id === gradeId }}
            onPress={() => (mode === 'stage' ? onStage(it.id) : onGrade(it.id))}>
            <Card style={{ borderColor: it.id === gradeId ? theme.primary : theme.border, borderWidth: it.id === gradeId ? 2 : 1 }}>
              <Txt size={20} weight="700">{it.name}</Txt>
            </Card>
          </Pressable>
        ))}
        {canBack ? <Btn title="رجوع" kind="outline" onPress={onBack} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
