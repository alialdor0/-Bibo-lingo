import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadJSON, saveJSON } from '../utils/storage';
import { THEMES, FONT_SCALES } from '../theme';

const KEY = 'school:state:v1';
const DEFAULTS = {
  user: null, // { name, school, section }
  gradeId: null,
  gems: 0, // جواهر يكسبها الطالب من اختباراته
  progress: {}, // تقدم كل صف منفصل: { [gradeId]: {...} }
  settings: { darkMode: false, fontSize: 'M', sfx: true, haptics: true, notifications: true, offline: false },
};
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [state, setState] = useState(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await loadJSON(KEY, null);
      if (saved) setState({ ...DEFAULTS, ...saved, settings: { ...DEFAULTS.settings, ...(saved.settings || {}) } });
      setHydrated(true);
    })();
  }, []);
  useEffect(() => { if (hydrated) saveJSON(KEY, state); }, [state, hydrated]);

  const login = useCallback((user) => setState((s) => ({ ...s, user })), []);
  const logout = useCallback(() => setState((s) => ({ ...DEFAULTS, settings: s.settings })), []);
  const setGrade = useCallback((gradeId) => setState((s) => ({ ...s, gradeId })), []);
  const updateSettings = useCallback((patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })), []);
  const addGems = useCallback((n) => setState((s) => ({ ...s, gems: (s.gems || 0) + n })), []);
  const updateProgress = useCallback((gradeId, patch) => setState((s) => ({ ...s, progress: { ...s.progress, [gradeId]: { ...(s.progress[gradeId] || {}), ...patch } } })), []);

  const value = useMemo(() => {
    const k = FONT_SCALES[state.settings.fontSize] || 1;
    return {
      ...state, hydrated, login, logout, setGrade, updateSettings, updateProgress, addGems,
      theme: state.settings.darkMode ? THEMES.dark : THEMES.light,
      scale: (n) => Math.round(n * k),
    };
  }, [state, hydrated, login, logout, setGrade, updateSettings, updateProgress, addGems]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
