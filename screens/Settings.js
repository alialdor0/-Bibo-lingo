import React, { useState } from 'react';
import { ScrollView, Switch } from 'react-native';
import { useApp } from '../context/AppContext';
import { SECTIONS, findGrade } from '../data/stages';
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
  const { user, gradeId, settings, updateSettings, login, logout, theme } = useApp();
  const [name, setName] = useState(user.name);
  const [school, setSchool] = useState(user.school);
  const [section, setSection] = useState(user.section);
  const info = findGrade(gradeId);
  const changed = name.trim() !== user.name || school.trim() !== user.school || section !== user.section;
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
        <Btn title="حفظ التعديلات" disabled={!changed || !name.trim() || !school.trim()} onPress={() => login({ name: name.trim(), school: school.trim(), section })} />
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
        <Toggle label="المؤثرات الصوتية" value={settings.sfx} onChange={(v) => updateSettings({ sfx: v })} />
        <Toggle label="الاهتزاز" value={settings.haptics} onChange={(v) => updateSettings({ haptics: v })} />
        <Toggle label="الإشعارات" value={settings.notifications} onChange={(v) => updateSettings({ notifications: v, ...(v ? { offline: false } : {}) })} />
        <Toggle label="وضع عدم الاتصال" hint="يوقف التذكيرات" value={settings.offline} onChange={(v) => updateSettings({ offline: v, ...(v ? { notifications: false } : {}) })} />
      </Card>

      <Btn title="تسجيل الخروج" kind="outline" onPress={logout} />
    </ScrollView>
  );
}
