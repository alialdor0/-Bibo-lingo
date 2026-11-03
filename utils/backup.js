// نسخة احتياطية لطالب واحد كنص JSON، مع تحقق صارم قبل الاستعادة.
export const buildBackup = (p) => ({ kind: 'e-school-backup', v: 1, user: p.user, gradeId: p.gradeId, gems: p.gems, inv: p.inv, progress: p.progress });

const isStr = (x) => typeof x === 'string' && x.trim().length > 0 && x.length <= 120;

export function validateBackup(d) {
  if (!d || d.kind !== 'e-school-backup' || d.v !== 1) return null;
  const u = d.user;
  if (!u || !isStr(u.name) || !isStr(u.school) || !isStr(u.section)) return null;
  if (d.gradeId !== null && typeof d.gradeId !== 'string') return null;
  if (typeof d.gems !== 'number' || !isFinite(d.gems)) return null;
  const inv = d.inv || {};
  if (inv.owned !== undefined && !Array.isArray(inv.owned)) return null;
  if (!d.progress || typeof d.progress !== 'object' || Array.isArray(d.progress)) return null;
  const equipped = {};
  Object.keys(inv.equipped || {}).forEach((k) => { const v = inv.equipped[k]; if (typeof v === 'string') equipped[k] = v; });
  return {
    user: { name: u.name.trim(), school: u.school.trim(), section: u.section.trim() },
    gradeId: d.gradeId, gems: Math.max(0, Math.floor(d.gems)),
    inv: { owned: (inv.owned || []).filter((x) => typeof x === 'string'), equipped },
    progress: d.progress,
  };
}

export function parseBackup(text) {
  try { return validateBackup(JSON.parse(String(text).trim())); } catch (e) { return null; }
}
