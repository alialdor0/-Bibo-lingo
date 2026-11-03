// بيانات كل طالب محفوظة باسمه، فلا تضيع عند تسجيل الخروج، ويستطيع أكثر من طالب استخدام الجهاز.
export const DEFAULT_SETTINGS = { darkMode: false, fontSize: 'M', sfx: true, haptics: true, notifications: true, offline: false };
export const blankProfile = () => ({ user: null, gradeId: null, gems: 0, inv: { owned: [], equipped: {} }, progress: {} });
export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const userKey = (u) => [u.name, u.school, u.section].map((x) => String(x).trim().replace(/\s+/g, ' ').toLowerCase()).join('|');

export function normalizeProfile(p) {
  const b = blankProfile();
  return { ...b, user: p.user || null, gradeId: p.gradeId || null, gems: Number(p.gems) || 0, inv: { ...b.inv, ...(p.inv || {}) }, progress: p.progress || {} };
}

// تحميل الحالة من النسخة 2 أو ترحيلها من النسخة 1 (طالب واحد).
export function hydrate(v2, v1) {
  if (v2 && v2.profiles) {
    const profiles = {};
    Object.keys(v2.profiles).forEach((id) => { profiles[id] = normalizeProfile(v2.profiles[id]); });
    return { activeId: profiles[v2.activeId] ? v2.activeId : null, profiles, settings: { ...DEFAULT_SETTINGS, ...(v2.settings || {}) } };
  }
  const settings = { ...DEFAULT_SETTINGS, ...((v1 && v1.settings) || {}) };
  if (v1 && v1.user) { const id = newId(); return { activeId: id, profiles: { [id]: normalizeProfile(v1) }, settings }; }
  return { activeId: null, profiles: {}, settings };
}

export const findByUser = (s, user) => Object.keys(s.profiles).find((id) => s.profiles[id].user && userKey(s.profiles[id].user) === userKey(user));

export function loginState(s, user) {
  const found = findByUser(s, user);
  if (found) return { ...s, activeId: found };
  const id = newId();
  return { ...s, activeId: id, profiles: { ...s.profiles, [id]: { ...blankProfile(), user } } };
}
export const logoutState = (s) => ({ ...s, activeId: null });
export function deleteState(s, id) {
  const profiles = { ...s.profiles }; delete profiles[id];
  return { ...s, profiles, activeId: s.activeId === id ? null : s.activeId };
}
export function mapActive(s, fn) {
  const p = s.profiles[s.activeId];
  return p ? { ...s, profiles: { ...s.profiles, [s.activeId]: fn(p) } } : s;
}
// استعادة نسخة احتياطية: تستبدل بيانات الطالب المطابق أو تنشئ طالباً جديداً.
export function importState(s, profile) {
  const found = findByUser(s, profile.user) || newId();
  return { ...s, activeId: found, profiles: { ...s.profiles, [found]: normalizeProfile(profile) } };
}
