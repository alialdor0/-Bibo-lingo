import React, { useState } from 'react';
import { Alert, ScrollView, Share, Switch } from 'react-native';
import { useApp } from '../context/AppContext';
import { SECTIONS, findGrade } from '../data/stages';
import { parseBackup } from '../utils/backup';
import { testSound } from '../utils/feedback';
import { Btn, Card, Chip, Field, Row, Txt } from '../components/UI';

function Toggle({ label, hint, value, onChange }) {
  const { theme } = useApp();
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 8 }}>
      <Txt style={{ flex: 1 }}>{label}{hint ? `\n${hint}` : ''}</Txt>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: theme.primary }} />
    </Row>
  );
}

export default function Settings({ onChangeGrade }) {
  const { user, gradeId, activeId, settings, updateSettings, updateUser, logout, deleteStudent, importStudent, exportStudent, theme } = useApp();
  const [name, setName] = useState(user.name);
  const [school, setSchool] = useState(user.school);
  const [section, setSection] = useState(user.section);
  const [restore, setRestore] = useState('');
  const [showRestore, setShowRestore] = useState(false);
  const info = findGrade(gradeId);
  const changed = name.trim() !== user.name || school.trim() !== user.school || section !== user.section;

  const doTestSound = async () => {
    const err = await testSound();
    Alert.alert('تجربة الصوت', err ? `تعذر تشغيل الصوت: ${err}` : 'تم تشغيل الصوت. إن لم تسمعه فارفع صوت الجهاز.');
  };
  const doExport = async () => {
    try { await Share.share({ message: JSON.stringify(exportStudent()), title: 'نسخة احتياطية من بياناتي' }); }
    catch (e) { Alert.alert('تعذر التصدير', 'حاول مرة أخرى.'); }
  };
  const doRestore = () => {
    const data = parseBackup(restore);
    if (!data) return Alert.alert('نسخة غير صالحة', 'تأكد من لصق النص كاملاً كما تم تصديره.');
    Alert.alert('استعادة النسخة', `ستُستبدل بيانات ${data.user.name} على هذا الجهاز بالنسخة الاحتياطية.`, [
      { text: 'إلغاء', style: 'cancel' }, { text: 'استعادة', onPress: () => { importStudent(data); setRestore(''); setShowRestore(false); } },
    ]);
  };
  const doDelete = () => Alert.alert('حذف بياناتي', 'سيُحذف كل شيء عن هذا الطالب من الجهاز: الدرجات والجواهر والملاحظات والتظليلات. لا يمكن التراجع.', [
    { text: 'إلغاء', style: 'cancel' }, { text: 'حذف', style: 'destructive', onPress: () => deleteStudent(activeId) },
  ]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
      <Txt size={26} weight="800" style={{ marginBottom: 16 }}>الإعدادات</Txt>

      <Card>
        <Txt weight="700" size={18} style={{ marginBottom: 10 }}>الملف الشخصي</Txt>
        <Field label="الاسم" value={name} onChangeText={setName} />
        <Field label="المدرسة" value={school} onChangeText={setSchool} />
        <Txt weight="700" style={{ marginBottom: 8 }}>الشعبة</Txt>
        <Row style={{ flexWrap: 'wrap' }}>
          {SECTIONS.map((s) => <Chip key={s} label={s} active={section === s} onPress={() => setSection(s)} />)}
        </Row>
        <Btn title="حفظ التعديلات" disabled={!changed || !name.trim() || !school.trim()} onPress={() => updateUser({ name: name.trim(), school: school.trim(), section })} />
      </Card>

      <Card>
        <Txt weight="700" size={18} style={{ marginBottom: 6 }}>المرحلة والصف</Txt>
        <Txt color={theme.sub}>{info ? `${info.grade.name} (${info.stage.name})` : ''}</Txt>
        <Btn title="تغيير المرحلة الدراسية أو الصف" kind="outline" onPress={onChangeGrade} />
      </Card>

      <Card>
        <Txt weight="700" size={18} style={{ marginBottom: 6 }}>العرض</Txt>
        <Toggle label="الوضع الليلي" value={settings.darkMode} onChange={(v) => updateSettings({ darkMode: v })} />
        <Txt weight="700" style={{ marginTop: 8, marginBottom: 8 }}>حجم الخط</Txt>
        <Row>
          {[['S', 'صغير'], ['M', 'متوسط'], ['L', 'كبير']].map(([k, l]) => (
            <Chip key={k} label={l} active={settings.fontSize === k} onPress={() => updateSettings({ fontSize: k })} />
          ))}
        </Row>
      </Card>

      <Card>
        <Txt weight="700" size={18} style={{ marginBottom: 6 }}>الصوت والتنبيهات</Txt>
        <Toggle label="المؤثرات الصوتية" hint="عند نتيجة الاختبار" value={settings.sfx} onChange={(v) => updateSettings({ sfx: v })} />
        <Btn title="جرّب الصوت" kind="outline" onPress={doTestSound} />
        <Toggle label="الاهتزاز" hint="عند الضغط على الأزرار ونتيجة الاختبار" value={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} />
        <Toggle label="الإشعارات" value={settings.notifications} onChange={(v) => updateSettings({ notifications: v, ...(v ? { offline: false } : {}) })} />
        <Toggle label="وضع عدم الاتصال" hint="يوقف التذكيرات" value={settings.offline} onChange={(v) => updateSettings({ offline: v, ...(v ? { notifications: false } : {}) })} />
      </Card>

      <Card>
        <Txt weight="700" size={18} style={{ marginBottom: 6 }}>نسخة احتياطية</Txt>
        <Txt color={theme.sub}>احفظ نسخة من درجاتك وجواهرك وملاحظاتك وتظليلاتك، لتستعيدها إن حذفت التطبيق أو غيّرت الهاتف.</Txt>
        <Btn title="تصدير نسخة احتياطية" onPress={doExport} />
        {showRestore ? (
          <>
            <Field label="الصق النسخة الاحتياطية هنا" value={restore} onChangeText={setRestore} multiline />
            <Btn title="استعادة" disabled={!restore.trim()} onPress={doRestore} />
            <Btn title="إلغاء" kind="outline" onPress={() => { setShowRestore(false); setRestore(''); }} />
          </>
        ) : <Btn title="استعادة من نسخة احتياطية" kind="outline" onPress={() => setShowRestore(true)} />}
      </Card>

      <Btn title="تسجيل الخروج (بياناتي تبقى محفوظة)" kind="outline" onPress={logout} />
      <Btn title="حذف بياناتي من هذا الجهاز" kind="outline" onPress={doDelete} />
    </ScrollView>
  );
}
