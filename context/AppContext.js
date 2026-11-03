import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadJSON, saveJSON } from '../utils/storage';
import { THEMES, FONT_SCALES } from '../theme';
import { setFeedbackSettings } from '../utils/feedback';
import { buildBackup } from '../utils/backup';
import { DEFAULT_SETTINGS, blankProfile, deleteState, hydrate, importState, loginState, logoutState, mapActive } from '../utils/profiles';

const KEY = 'school:state:v2';
const OLD_KEY = 'school:state:v1';
const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export function AppProvider({ children }) {
  const [state, setState] = useState({ activeId: null, profiles: {}, settings: DEFAULT_SETTINGS });
  const [hydrated, setHydrated] = useState(false);
  const live = useRef(state); live.current = state;

  useEffect(() => {
    (async () => {
      const v2 = await loadJSON(KEY, null);
      const v1 = v2 ? null : await loadJSON(OLD_KEY, null);
      setState(hydrate(v2, v1));
      setHydrated(true);
    })();
  }, []);
  useEffect(() => { if (hydrated) saveJSON(KEY, state); }, [state, hydrated]);
  useEffect(() => { setFeedbackSettings(state.settings); }, [state.settings]);

  const act = useCallback((fn) => setState((s) => mapActive(s, fn)), []);
  const login = useCallback((user) => setState((s) => loginState(s, user)), []);
  const logout = useCallback(() => setState(logoutState), []);
  const deleteStudent = useCallback((id) => setState((s) => deleteState(s, id)), []);
  const importStudent = useCallback((profile) => setState((s) => importState(s, profile)), []);
  const updateUser = useCallback((user) => act((p) => ({ ...p, user })), [act]);
  const setGrade = useCallback((gradeId) => act((p) => ({ ...p, gradeId })), [act]);
  const addGems = useCallback((n) => act((p) => ({ ...p, gems: (p.gems || 0) + n })), [act]);
  const updateProgress = useCallback((gradeId, patch) => act((p) => ({ ...p, progress: { ...p.progress, [gradeId]: { ...(p.progress[gradeId] || {}), ...patch } } })), [act]);
  const buy = useCallback((item) => act((p) => ((p.gems || 0) < item.price || p.inv.owned.includes(item.id) ? p : { ...p, gems: p.gems - item.price, inv: { ...p.inv, owned: [...p.inv.owned, item.id] } })), [act]);
  const equip = useCallback((cat, id) => act((p) => ({ ...p, inv: { ...p.inv, equipped: { ...p.inv.equipped, [cat]: id } } })), [act]);
  const updateSettings = useCallback((patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })), []);
  const exportStudent = useCallback(() => { const s = live.current; return s.profiles[s.activeId] ? buildBackup(s.profiles[s.activeId]) : null; }, []);

  const value = useMemo(() => {
    const p = state.profiles[state.activeId] || blankProfile();
    const k = FONT_SCALES[state.settings.fontSize] || 1;
    const students = Object.keys(state.profiles).filter((id) => state.profiles[id].user).map((id) => ({ id, user: state.profiles[id].user, gradeId: state.profiles[id].gradeId }));
    return {
      hydrated, activeId: state.activeId, user: state.profiles[state.activeId] ? p.user : null, gradeId: p.gradeId, gems: p.gems, inv: p.inv, progress: p.progress,
      settings: state.settings, students,
      login, logout, deleteStudent, importStudent, updateUser, setGrade, addGems, updateProgress, buy, equip, updateSettings, exportStudent,
      theme: state.settings.darkMode ? THEMES.dark : THEMES.light,
      scale: (n) => Math.round(n * k),
    };
  }, [state, hydrated, login, logout, deleteStudent, importStudent, updateUser, setGrade, addGems, updateProgress, buy, equip, updateSettings, exportStudent]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
