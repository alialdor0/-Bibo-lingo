import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useApp } from '../context/AppContext';
import { CATS, STORE_ITEMS } from '../data/store';
import { success } from '../utils/feedback';
import { Btn, Card, Chip, Row, Txt } from '../components/UI';

export default function Store() {
  const { theme, gems, inv, buy, equip } = useApp();
  const [cat, setCat] = useState('cover');
  const owned = inv.owned || []; const eq = inv.equipped || {};
  const onBuy = (it) => Alert.alert('شراء', `شراء ${it.name} مقابل ${it.price} جوهرة؟`, [
    { text: 'إلغاء', style: 'cancel' }, { text: 'شراء', onPress: () => { buy(it); success(); } },
  ]);
  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Txt size={26} weight="800">المتجر</Txt>
      <Txt color={theme.primary} weight="700" style={{ marginBottom: 12 }}>{`رصيدك: ${gems} جوهرة`}</Txt>
      <Row style={{ flexWrap: 'wrap' }}>{CATS.map(([id, l]) => <Chip key={id} label={l} active={cat === id} onPress={() => setCat(id)} />)}</Row>
      {STORE_ITEMS.filter((i) => i.cat === cat).map((it) => {
        const has = owned.includes(it.id); const on = eq[it.cat] === it.id;
        return (
          <Card key={it.id}>
            <Row>
              {it.emoji ? <Txt size={32} style={{ marginLeft: 12 }}>{it.emoji}</Txt>
                : <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: it.color, marginLeft: 12 }} />}
              <View style={{ flex: 1 }}>
                <Txt weight="700" size={18}>{it.name}</Txt>
                <Txt color={theme.sub}>{has ? 'امتلكته' : `${it.price} جوهرة`}</Txt>
              </View>
            </Row>
            {has
              ? <Btn title={on ? 'مستخدم الآن (اضغط للإلغاء)' : 'استخدام'} kind={on ? 'outline' : 'primary'} onPress={() => equip(it.cat, on ? null : it.id)} />
              : <Btn title={`شراء (${it.price} جوهرة)`} disabled={gems < it.price} onPress={() => onBuy(it)} />}
          </Card>
        );
      })}
    </ScrollView>
  );
}
