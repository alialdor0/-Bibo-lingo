import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Login      from '../screens/Login';
import Onboarding from '../screens/Onboarding';
import TrackSelect from '../screens/TrackSelect';
import Main       from '../screens/Main';
import Story      from '../screens/Story';
import Dict       from '../screens/Dict';
import Rescue     from '../screens/Rescue';
import Leaderboard from '../screens/Leaderboard';
import Coop       from '../screens/Coop';
import Store      from '../screens/Store';

export default function AppNavigator() {
  const { user, setUser, track } = useApp();
  const [screen, setScreen] = useState('login');

  const go = (s) => setScreen(s);

  const handleLogin = (type) => {
    setScreen('onboarding');
  };

  const handleOnboardingDone = (userData) => {
    setUser(userData);
    setScreen('trackselect');
  };

  const handleTrackSelect = (selectedTrack) => {
    setScreen('main');
  };

  const handleNav = (dest) => {
    const screens = ['story','dict','rescue','leaderboard','coop','store'];
    if (screens.includes(dest)) setScreen(dest);
  };

  if (screen === 'login')       return <Login       onLogin={handleLogin} />;
  if (screen === 'onboarding')  return <Onboarding  onDone={handleOnboardingDone} />;
  if (screen === 'trackselect') return <TrackSelect  onSelect={handleTrackSelect} />;
  if (screen === 'main')        return <Main         onNav={handleNav} />;
  if (screen === 'story')       return <Story        onLeave={() => go('main')} />;
  if (screen === 'dict')        return <Dict         onBack={() => go('main')} />;
  if (screen === 'rescue')      return <Rescue       onBack={() => go('main')} />;
  if (screen === 'leaderboard') return <Leaderboard  onBack={() => go('main')} />;
  if (screen === 'coop')        return <Coop         onBack={() => go('main')} />;
  if (screen === 'store')       return <Store        onBack={() => go('main')} />;

  return <Login onLogin={handleLogin} />;
}
