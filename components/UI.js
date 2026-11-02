import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useApp } from '../context/AppContext';

export function Txt({ size = 16, weight = '400', color, style, children, ...p }) {
  const { theme, scale } = useApp();
  return (
    <Text {...p} style={[{ fontSize: scale(size), fontWeight: weight, color: color || theme.text, textAlign: 'right', writingDirection: 'rtl' }, style]}>
      {children}
    </Text>
  );
}

export const Row = ({ style, children }) => <View style={[{ flexDirection: 'row-reverse', alignItems: 'center' }, style]}>{children}</View>;

export function Card({ style, children }) {
  const { theme } = useApp();
  return <View style={[{ backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 }, style]}>{children}</View>;
}

export function Btn({ title, onPress, kind = 'primary', disabled }) {
  const { theme } = useApp();
  const primary = kind === 'primary';
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!disabled }}
      disabled={disabled} onPress={onPress}
      style={{ backgroundColor: primary ? theme.primary : 'transparent', borderColor: theme.primary, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: 'center', opacity: disabled ? 0.45 : 1, marginTop: 8 }}>
      <Txt weight="700" color={primary ? theme.onPrimary : theme.primary} style={{ textAlign: 'center' }}>{title}</Txt>
    </Pressable>
  );
}

export function Chip({ label, active, onPress }) {
  const { theme } = useApp();
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!active }} onPress={onPress}
      style={{ minWidth: 52, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1.5, borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primary : theme.card, marginLeft: 8, marginBottom: 8, alignItems: 'center' }}>
      <Txt weight="700" color={active ? theme.onPrimary : theme.text} style={{ textAlign: 'center' }}>{label}</Txt>
    </Pressable>
  );
}

export function Field({ label, ...p }) {
  const { theme, scale } = useApp();
  return (
    <View style={{ marginBottom: 14 }}>
      <Txt weight="700" style={{ marginBottom: 6 }}>{label}</Txt>
      <TextInput
        {...p} accessibilityLabel={label} placeholderTextColor={theme.sub}
        style={{ borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.card, color: theme.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: scale(16), textAlign: 'right', writingDirection: 'rtl' }}
      />
    </View>
  );
}
