// اهتزاز وأصوات قصيرة. تتبع إعدادي «الاهتزاز» و«المؤثرات الصوتية»، وأي فشل صامت لا يوقف التطبيق.
let cfg = { sfx: true, haptics: true };
export const setFeedbackSettings = (s) => { cfg = { sfx: !!s.sfx, haptics: !!s.haptics }; };

const SOUNDS = { ok: () => require('../assets/sfx/success.wav'), bad: () => require('../assets/sfx/fail.wav') };
const players = {};
let modeReady = false;

function buzz(kind) {
  if (!cfg.haptics) return;
  try {
    const H = require('expo-haptics');
    if (kind === 'light') H.impactAsync(H.ImpactFeedbackStyle.Light);
    else H.notificationAsync(kind === 'ok' ? H.NotificationFeedbackType.Success : H.NotificationFeedbackType.Error);
  } catch (e) {}
}

// على الآيفون لا يُسمع الصوت إن كان مفتاح الصامت مفعّلاً، إلا بهذا الإعداد.
async function ensureMode(audio) {
  if (modeReady) return;
  modeReady = true;
  try { await audio.setAudioModeAsync({ playsInSilentMode: true }); } catch (e) {}
}

async function playOrThrow(name) {
  const audio = require('expo-audio');
  await ensureMode(audio);
  if (!players[name]) players[name] = audio.createAudioPlayer(SOUNDS[name]());
  const p = players[name];
  p.seekTo(0);
  p.play();
}
function play(name) {
  if (!cfg.sfx) return;
  playOrThrow(name).catch(() => {});
}

export const tap = () => buzz('light');
export const success = () => { buzz('ok'); play('ok'); };
export const fail = () => { buzz('bad'); play('bad'); };

// لزر «جرّب الصوت» في الإعدادات: يرجع نص الخطأ إن فشل، أو null عند النجاح.
export async function testSound() {
  if (!cfg.sfx) return 'المؤثرات الصوتية مغلقة. فعّلها أولاً.';
  try { await playOrThrow('ok'); return null; } catch (e) { return String((e && e.message) || e); }
}
