import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { Field, Txt } from './UI';
import { qTitle, shuffledIndices, TYPE_LABEL } from '../utils/exam';

function Opt({ label, selected, onPress, disabled }) {
  const { theme } = useApp();
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!selected, disabled: !!disabled }}
      disabled={disabled} onPress={onPress}
      style={{ borderWidth: 1.5, borderColor: selected ? theme.primary : theme.border, backgroundColor: selected ? theme.primary : theme.card, borderRadius: 12, padding: 14, marginBottom: 10, opacity: disabled ? 0.45 : 1 }}>
      <Txt color={selected ? theme.onPrimary : theme.text} weight={selected ? '700' : '400'}>{label}</Txt>
    </Pressable>
  );
}

const Fill = ({ answer, onChange }) => <Field label="إجابتك" value={answer || ''} onChangeText={onChange} placeholder="اكتب الإجابة" />;

const TF = ({ answer, onChange }) => (
  <View>
    <Opt label="صح" selected={answer === true} onPress={() => onChange(true)} />
    <Opt label="خطأ" selected={answer === false} onPress={() => onChange(false)} />
  </View>
);

function Choice({ q, answer, onChange }) {
  const order = useMemo(() => shuffledIndices(q.options.length, q.id), [q.id]);
  return <View>{order.map((i) => <Opt key={i} label={q.options[i]} selected={answer === i} onPress={() => onChange(i)} />)}</View>;
}

function Order({ q, answer, onChange }) {
  const { theme } = useApp();
  const shown = useMemo(() => shuffledIndices(q.items.length, q.id), [q.id]);
  const chosen = answer || [];
  return (
    <View>
      <Txt weight="700" style={{ marginBottom: 8 }}>ترتيبك</Txt>
      {chosen.length === 0
        ? <Txt color={theme.sub} style={{ marginBottom: 8 }}>اضغط العناصر بالترتيب الصحيح. اضغط عنصراً مرتباً لإزالته.</Txt>
        : chosen.map((i, n) => <Opt key={i} selected label={`${n + 1}. ${q.items[i]}`} onPress={() => onChange(chosen.filter((x) => x !== i))} />)}
      <Txt weight="700" style={{ marginTop: 10, marginBottom: 8 }}>العناصر</Txt>
      {shown.filter((i) => !chosen.includes(i)).map((i) => <Opt key={i} label={q.items[i]} onPress={() => onChange([...chosen, i])} />)}
    </View>
  );
}

function Match({ q, answer, onChange }) {
  const { theme } = useApp();
  const [sel, setSel] = useState(null);
  const rights = useMemo(() => shuffledIndices(q.pairs.length, q.id), [q.id]);
  const a = answer || {};
  const assign = (r) => {
    if (sel === null) return;
    const next = {};
    Object.keys(a).forEach((k) => { if (a[k] !== r) next[k] = a[k]; });
    next[sel] = r;
    onChange(next);
    setSel(null);
  };
  return (
    <View>
      <Txt weight="700" style={{ marginBottom: 8 }}>اختر عنصراً ثم اختر ما يناسبه</Txt>
      {q.pairs.map((p, i) => (
        <Opt key={i} selected={sel === i} label={a[i] !== undefined ? `${p[0]} ← ${q.pairs[a[i]][1]}` : p[0]} onPress={() => setSel(sel === i ? null : i)} />
      ))}
      <Txt weight="700" color={theme.text} style={{ marginTop: 10, marginBottom: 8 }}>الخيارات</Txt>
      {rights.map((r) => <Opt key={r} label={q.pairs[r][1]} disabled={sel === null} onPress={() => assign(r)} />)}
    </View>
  );
}

const BODY = { fill: Fill, tf: TF, def: Choice, mcq: Choice, order: Order, match: Match };

export default function Question({ q, answer, onChange }) {
  const { theme } = useApp();
  const Body = BODY[q.type];
  return (
    <View>
      <Txt size={14} color={theme.sub} style={{ marginBottom: 6 }}>{TYPE_LABEL[q.type]}</Txt>
      <Txt size={20} weight="700" style={{ marginBottom: 16 }}>{qTitle(q)}</Txt>
      <Body q={q} answer={answer} onChange={onChange} />
    </View>
  );
}
