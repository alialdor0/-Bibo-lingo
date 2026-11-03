import React, { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './screens/Login';
import Pick from './screens/Pick';
import Home from './screens/Home';

function Root() {
  const { hydrated, user, gradeId, setGrade, theme, settings } = useApp();
  const [stack, setStack] = useState([]); // سجل الرجوع للشاشات الفرعية
  const push = (name, params = {}) => setStack((s) => [...s, { name, ...params }]);
  const pop = () => setStack((s) => s.slice(0, -1));

  useEffect(() => { if (!user) setStack([]); }, [user]); // عند تبديل الطالب

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length) { pop(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stack]);

  let screen;
  if (!hydrated) screen = <View style={{ flex: 1, backgroundColor: theme.bg }} />;
  else if (!user) screen = <Login />;
  else {
    const top = stack[stack.length - 1];
    if (top && top.name === 'grade') {
      screen = <Pick mode="grade" stageId={top.stageId} canBack onBack={pop} onGrade={(id) => { setGrade(id); setStack([]); }} />;
    } else if ((top && top.name === 'stage') || !gradeId) {
      screen = <Pick mode="stage" canBack={!!gradeId} onBack={pop} onStage={(id) => push('grade', { stageId: id })} />;
    } else {
      screen = <Home onChangeGrade={() => push('stage')} />;
    }
  }
  return (
    <>
      <StatusBar style={settings.darkMode ? 'light' : 'dark'} />
      {screen}
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppProvider>
          <Root />
        </AppProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
