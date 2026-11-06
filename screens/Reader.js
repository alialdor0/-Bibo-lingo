import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, BackHandler, Image, PanResponder, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { searchBook, toNumber } from '../utils/bookSearch';
import { pageSlot } from '../utils/sheet';
import { Btn, Card, Chip, Field, Row, Txt } from '../components/UI';

const COLORS = { y: ['أصفر', 'rgba(255,214,0,0.42)'], g: ['أخضر', 'rgba(76,175,80,0.42)'], p: ['وردي', 'rgba(244,114,182,0.45)'] };

export default function Reader({ book, onClose }) {
  const { theme, gradeId, progress, updateProgress, scale } = useApp();
  const { width } = useWindowDimensions();
  const W = Math.round(width - 24);
  const H = Math.round(W * (book.size[1] / book.size[0]));
  const cols = (book.sheet && book.sheet.cols) || 1;
  const rows = (book.sheet && book.sheet.rows) || 1;
  const [page, setPage] = useState(1);
  const [mode, setMode] = useState('view'); // view | mark | erase
  const [color, setColor] = useState('y');
  const [panel, setPanel] = useState(null); // null | search | toc | marks
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('all'); // all | range
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [drag, setDrag] = useState(null);
  const [textMode, setTextMode] = useState(false); // عرض نص الصفحة لقارئ الشاشة
  useEffect(() => {
    // إن كان قارئ الشاشة يعمل، يُفتح نص الصفحة تلقائياً
    AccessibilityInfo.isScreenReaderEnabled().then((on) => { if (on) setTextMode(true); }).catch(() => {});
  }, []);
  const pageTxt = (book.text && book.text[String(page)]) || '';

  const allMarks = (progress[gradeId] && progress[gradeId].highlights && progress[gradeId].highlights[book.id]) || {};
  const marks = allMarks[page] || [];
  const saveMarks = (pg, list) => {
    const old = (progress[gradeId] && progress[gradeId].highlights) || {};
    const next = { ...(old[book.id] || {}) };
    if (list.length) next[pg] = list; else delete next[pg];
    updateProgress(gradeId, { highlights: { ...old, [book.id]: next } });
  };

  // مراجع للقيم الحالية داخل مستجيب اللمس
  const live = useRef({});
  live.current = { mode, color, page, marks, saveMarks, W, H };
  const start = useRef(null);
  const rectOf = (s, x, y) => {
    const { W: w, H: h } = live.current;
    const x1 = Math.max(0, Math.min(w, Math.min(s.x, x))); const x2 = Math.max(0, Math.min(w, Math.max(s.x, x)));
    const y1 = Math.max(0, Math.min(h, Math.min(s.y, y))); const y2 = Math.max(0, Math.min(h, Math.max(s.y, y)));
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => live.current.mode === 'mark',
    onMoveShouldSetPanResponder: () => live.current.mode === 'mark',
    onPanResponderGrant: (e) => { start.current = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY }; setDrag({ x: start.current.x, y: start.current.y, w: 0, h: 0 }); },
    onPanResponderMove: (e, g) => { if (start.current) setDrag(rectOf(start.current, start.current.x + g.dx, start.current.y + g.dy)); },
    onPanResponderRelease: (e, g) => {
      const s = start.current; start.current = null; setDrag(null);
      if (!s) return;
      const r = rectOf(s, s.x + g.dx, s.y + g.dy); const L = live.current;
      if (r.w > 8 && r.h > 6) L.saveMarks(L.page, [...L.marks, { x: r.x / L.W, y: r.y / L.H, w: r.w / L.W, h: r.h / L.H, c: L.color }]);
    },
    onPanResponderTerminate: () => { start.current = null; setDrag(null); },
  })).current;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { if (panel) setPanel(null); else onClose(); return true; });
    return () => sub.remove();
  }, [panel, onClose]);

  const slot = pageSlot(page, cols, rows);
  const go = (p) => { setPage(Math.max(1, Math.min(book.count, p))); setPanel(null); };
  const printed = (p) => p - book.offset;
  const label = (p) => (printed(p) >= 1 ? `صفحة ${printed(p)}` : `غلاف أو مقدمة (${p})`);

  const num = toNumber(query);
  const results = useMemo(() => (num === null && query.trim()
    ? searchBook(book, query, scope === 'range' ? { from: toNumber(from) || undefined, to: toNumber(to) || undefined } : {}) : []), [query, scope, from, to]);

  // ----- اللوحات -----
  if (panel) {
    return (
      <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
        <Txt size={24} weight="800" style={{ marginBottom: 10 }}>{panel === 'search' ? 'بحث في الكتاب' : panel === 'toc' ? 'المحتويات' : 'تظليلاتي'}</Txt>
        {panel === 'search' ? (
          <View>
            <Field label="رقم صفحة أو موضوع" value={query} onChangeText={setQuery} placeholder="مثال: 12 أو التمثيل الضوئي" />
            <Row>
              <Chip label="الكتاب كاملاً" active={scope === 'all'} onPress={() => setScope('all')} />
              <Chip label="من صفحة إلى صفحة" active={scope === 'range'} onPress={() => setScope('range')} />
            </Row>
            {scope === 'range' ? (
              <Row>
                <View style={{ flex: 1, marginLeft: 8 }}><Field label="من" value={from} onChangeText={setFrom} keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><Field label="إلى" value={to} onChangeText={setTo} keyboardType="numeric" /></View>
              </Row>
            ) : null}
            {num !== null ? (
              num + book.offset >= 1 && num + book.offset <= book.count
                ? <Btn title={`اذهب إلى صفحة ${num}`} onPress={() => go(num + book.offset)} />
                : <Card><Txt color={theme.danger}>{`لا توجد صفحة بهذا الرقم. صفحات الكتاب من 1 إلى ${book.count - book.offset}.`}</Txt></Card>
            ) : null}
            {num === null && query.trim().length >= 2 && results.length === 0 ? <Card><Txt color={theme.sub}>لا توجد نتائج. جرّب كلمة أقصر أو راجع المحتويات.</Txt></Card> : null}
            {results.map((r) => (
              <Pressable key={r.page} accessibilityRole="button" accessibilityLabel={`${label(r.page)}، ${r.snippet}`} onPress={() => go(r.page)}>
                <Card><Txt weight="700" color={theme.primary}>{label(r.page)}</Txt><Txt color={theme.sub} style={{ marginTop: 4 }}>{r.snippet}</Txt></Card>
              </Pressable>
            ))}
          </View>
        ) : null}
        {panel === 'toc' ? (book.toc && book.toc.length ? book.toc.map((t, i) => (
          <Pressable key={i} accessibilityRole="button" accessibilityLabel={`${t.title}، ${label(t.page)}`} onPress={() => go(t.page)}>
            <Card><Txt weight="700">{t.title}</Txt><Txt color={theme.sub}>{label(t.page)}</Txt></Card>
          </Pressable>
        )) : <Card><Txt color={theme.sub}>لا يوجد فهرس لهذا الكتاب. استخدم البحث برقم الصفحة أو بالموضوع.</Txt></Card>) : null}
        {panel === 'marks' ? (Object.keys(allMarks).length ? Object.keys(allMarks).map(Number).sort((a, b) => a - b).map((p) => (
          <Pressable key={p} accessibilityRole="button" accessibilityLabel={`${label(p)}، ${allMarks[p].length} تظليل`} onPress={() => go(p)}>
            <Card><Txt weight="700">{label(p)}</Txt><Txt color={theme.sub}>{`${allMarks[p].length} تظليل`}</Txt></Card>
          </Pressable>
        )) : <Card><Txt color={theme.sub}>لم تظلل شيئاً بعد. اختر «تظليل» ثم اسحب بإصبعك فوق الجزء المهم.</Txt></Card>) : null}
        <Btn title="رجوع إلى الصفحة" kind="outline" onPress={() => setPanel(null)} />
      </ScrollView>
    );
  }

  // ----- الصفحة -----
  return (
    <View style={{ flex: 1 }}>
      <Row style={{ justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 }}>
        <Txt weight="800" size={17} style={{ flex: 1 }} numberOfLines={1}>{book.title}</Txt>
        <Pressable accessibilityRole="button" accessibilityLabel="إغلاق الكتاب" onPress={onClose}><Txt color={theme.danger} weight="700">إغلاق</Txt></Pressable>
      </Row>
      <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
        <Row style={{ flexWrap: 'wrap' }}>
          <Chip label={textMode ? 'عرض الصورة' : 'نص الصفحة'} active={textMode} onPress={() => setTextMode(!textMode)} />
          {textMode ? null : <Chip label="تصفح" active={mode === 'view'} onPress={() => setMode('view')} />}
          {textMode ? null : <Chip label="تظليل" active={mode === 'mark'} onPress={() => setMode('mark')} />}
          {textMode ? null : <Chip label="ممحاة" active={mode === 'erase'} onPress={() => setMode('erase')} />}
          <Chip label="بحث" onPress={() => setPanel('search')} />
          <Chip label="المحتويات" onPress={() => setPanel('toc')} />
          <Chip label="تظليلاتي" onPress={() => setPanel('marks')} />
        </Row>
        {!textMode && mode === 'mark' ? (
          <Row style={{ flexWrap: 'wrap' }}>{Object.keys(COLORS).map((k) => <Chip key={k} label={COLORS[k][0]} active={color === k} onPress={() => setColor(k)} />)}</Row>
        ) : null}
        {!textMode && mode === 'erase' ? <Txt size={13} color={theme.sub}>اضغط على أي تظليل لحذفه.</Txt> : null}
      </View>
      {textMode ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Txt weight="800" size={18} accessibilityRole="header" style={{ marginBottom: 8 }}>{label(page)}</Txt>
          {pageTxt.trim().length > 20 ? (
            <View>
              {Array.isArray(book.ocr) && book.ocr.includes(page) ? <Txt size={14} color={theme.sub} accessibilityLanguage="ar" style={{ marginBottom: 8 }}>هذا النص استُخرج آلياً من صورة الصفحة، وقد يحتوي أخطاء.</Txt> : null}
              <Txt selectable accessibilityLanguage="ar" size={19} style={{ lineHeight: Math.round(scale(19) * 1.75) }}>{pageTxt}</Txt>
            </View>
          ) : (
            <Card><Txt accessibilityLanguage="ar">لا يتوفر نص لهذه الصفحة، فهي صورة أو رسم. اضغط عرض الصورة لرؤيتها.</Txt></Card>
          )}
        </ScrollView>
      ) : (
      <ScrollView scrollEnabled={mode !== 'mark'} maximumZoomScale={3} minimumZoomScale={1} contentContainerStyle={{ alignItems: 'center', paddingVertical: 8 }}>
        <View style={{ width: W, height: H, backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
          <Image source={book.images[slot.sheet]} resizeMode="stretch" accessibilityLabel={`صورة ${label(page)}. لقراءة النص اضغط نص الصفحة.`}
            style={{ position: 'absolute', width: W * cols, height: H * rows, left: -slot.col * W, top: -slot.row * H }} />
          {marks.map((m, i) => (
            <Pressable key={i} disabled={mode !== 'erase'} pointerEvents={mode === 'mark' ? 'none' : 'auto'}
              accessibilityRole="button" accessibilityLabel="حذف التظليل"
              onPress={() => saveMarks(page, marks.filter((_, j) => j !== i))}
              style={{ position: 'absolute', left: m.x * W, top: m.y * H, width: m.w * W, height: m.h * H, backgroundColor: COLORS[m.c] ? COLORS[m.c][1] : COLORS.y[1], borderWidth: mode === 'erase' ? 2 : 0, borderColor: theme.danger }} />
          ))}
          {drag ? <View pointerEvents="none" style={{ position: 'absolute', left: drag.x, top: drag.y, width: drag.w, height: drag.h, backgroundColor: COLORS[color][1] }} /> : null}
          {mode === 'mark' ? <View {...pan.panHandlers} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} /> : null}
        </View>
      </ScrollView>
      )}
      <Row style={{ padding: 12 }}>
        <View style={{ flex: 1, marginHorizontal: 4 }}><Btn title="التالي" disabled={page >= book.count} onPress={() => go(page + 1)} /></View>
        <View style={{ flex: 2, marginHorizontal: 4 }}><Txt weight="700" style={{ textAlign: 'center' }}>{`${label(page)} من ${book.count - book.offset}`}</Txt></View>
        <View style={{ flex: 1, marginHorizontal: 4 }}><Btn title="السابق" kind="outline" disabled={page <= 1} onPress={() => go(page - 1)} /></View>
      </Row>
    </View>
  );
}
