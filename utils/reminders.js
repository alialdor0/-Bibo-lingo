// تذكيرات الواجبات والاختبارات: إشعار في الخامسة مساءً قبل الموعد بيوم، دون رسائل ضغط.
import { parseYmd } from './dates';

export const REMIND_HOUR = 17;
const MAX_SCHEDULED = 50; // الآيفون يسمح بحوالي 64 إشعاراً مجدولاً

export function remindAtFor(item, now = new Date()) {
  if (!item || item.done || !item.due) return null;
  const at = parseYmd(item.due);
  at.setDate(at.getDate() - 1);
  at.setHours(REMIND_HOUR, 0, 0, 0);
  return at.getTime() > now.getTime() ? at : null;
}

export function reminderText(item) {
  const exam = item.kind === 'exam';
  return exam
    ? { title: 'تذكير باختبار', body: `غداً اختبار ${item.subject}: ${item.title}` }
    : { title: 'تذكير بواجب', body: `غداً موعد تسليم واجب ${item.subject}: ${item.title}` };
}

let N = null;
try { N = require('expo-notifications'); } catch (e) {}
let ready = false;
function setup() {
  if (ready || !N) return;
  ready = true;
  try {
    N.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
  } catch (e) {}
}
async function ensurePermission() {
  const { status: cur } = await N.getPermissionsAsync();
  if (cur === 'granted') return true;
  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
}

// يلغي تذكيرات الواجبات القديمة ويجدول الحالية. يرجع { ok, reason }.
export async function syncReminders(items, enabled) {
  if (!N) return { ok: false, reason: 'unavailable' };
  setup();
  try {
    const all = await N.getAllScheduledNotificationsAsync();
    for (const n of all) if (String(n.identifier).startsWith('hw-')) await N.cancelScheduledNotificationAsync(n.identifier);
    if (!enabled) return { ok: true, count: 0 };
    const todo = items.map((it) => ({ it, at: remindAtFor(it) })).filter((x) => x.at).sort((a, b) => a.at - b.at).slice(0, MAX_SCHEDULED);
    if (!todo.length) return { ok: true, count: 0 };
    if (!(await ensurePermission())) return { ok: false, reason: 'denied' };
    const type = N.SchedulableTriggerInputTypes ? N.SchedulableTriggerInputTypes.DATE : 'date';
    for (const { it, at } of todo) {
      await N.scheduleNotificationAsync({ identifier: `hw-${it.id}`, content: reminderText(it), trigger: { type, date: at } });
    }
    return { ok: true, count: todo.length };
  } catch (e) {
    return { ok: false, reason: 'error' };
  }
}
