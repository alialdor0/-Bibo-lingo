import React from 'react';
import { Pressable, Text, View } from 'react-native';

// شاشة لطيفة بدل الشاشة البيضاء عند حدوث خطأ غير متوقع.
export default class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F6F7F2' }}>
        <Text style={{ fontSize: 24, fontWeight: '800', textAlign: 'right', writingDirection: 'rtl', color: '#1B2A24' }}>حدث خطأ غير متوقع</Text>
        <Text style={{ fontSize: 16, textAlign: 'right', writingDirection: 'rtl', color: '#5B6B63', marginVertical: 12 }}>بياناتك محفوظة. اضغط إعادة المحاولة، وإن تكرر الخطأ فأغلق التطبيق وافتحه من جديد.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="إعادة المحاولة" onPress={() => this.setState({ error: null })}
          style={{ backgroundColor: '#1F5C4A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' }}>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>إعادة المحاولة</Text>
        </Pressable>
      </View>
    );
  }
}
