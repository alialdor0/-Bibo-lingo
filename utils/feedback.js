// اهتزاز وأصوات قصيرة. تتبع إعدادي «الاهتزاز» و«المؤثرات الصوتية»، وأي فشل صامت لا يوقف التطبيق.
let cfg = { sfx: true, haptics: true };
export const setFeedbackSettings = (s) => { cfg = { sfx: !!s.sfx, haptics: !!s.haptics }; };

const SOUNDS = { ok: () => require('../assets/sfx/success.wav'), bad: () => require('../assets/sfx/fail.wav') };
const players = {};

function buzz(kind) {
  if (!cfg.haptics) return;
  try {
    const H = require('expo-haptics');
    if (kind === 'light') H.impactAsync(H.ImpactFeedbackStyle.Light);
    else H.notificationAsync(kind === 'ok' ? H.NotificationFeedbackType.Success : H.NotificationFeedbackType.Error);
  } catch (e) {}
}
function play(name) {
  if (!cfg.sfx) return;
  try {
    const { createAudioPlayer } = require('expo-audio');
    if (!players[name]) players[name] = createAudioPlayer(SOUNDS[name]());
    const p = players[name];
    p.seekTo(0); p.play();
  } catch (e) {}
}

export const tap = () => buzz('light');
export const success = () => { buzz('ok'); play('ok'); };
export const fail = () => { buzz('bad'); play('bad'); };
