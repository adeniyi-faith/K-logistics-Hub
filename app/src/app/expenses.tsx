import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { CategoryBar } from '../components/CategoryBar';
import { Badge, Button, Card, Chips, H2, IconTile, Muted, Row, Screen, Stat, TopBar } from '../components/ui';
import { Frequency, FREQUENCIES } from '../data/types';
import { categoryIcon, frequencyLabel } from '../lib/expenses';
import { dayLabel, naira } from '../lib/format';
import { byCategory, expensesIn, periodOf, shortNaira } from '../lib/money';
import { notSynced } from '../lib/stock';
import { useStore } from '../store/AppStore';

export default function Expenses() {
  const { state } = useStore();
  const [show, setShow] = useState<Frequency | 'all'>('all');

  if (state.session?.role === 'rider') {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Expenses" back />
        <Screen>
          <Muted>Only Admin and Staff can see expenses.</Muted>
        </Screen>
      </View>
    );
  }

  const total = (kind: 'day' | 'week' | 'month') =>
    expensesIn(state, periodOf(kind, state.day)).reduce((s, e) => s + e.amount, 0);
  const week = byCategory(expensesIn(state, periodOf('week', state.day)));
  const list = state.expenses
    .filter((e) => show === 'all' || e.frequency === show)
    .sort((a, b) => b.day.localeCompare(a.day) || b.at.localeCompare(a.at));

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Expenses" back />
      <Screen footer={<Button title="Add expense" kind="accent" icon="plus" onPress={() => router.push('/add-expense')} />}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Stat label="Today" value={shortNaira(total('day'))} />
          <Stat label="This week" value={shortNaira(total('week'))} />
          <Stat label="This month" value={shortNaira(total('month'))} />
        </View>

        <Card>
          <H2>This week by category</H2>
          <CategoryBar rows={week} />
        </Card>

        <Chips<Frequency | 'all'> options={[{ value: 'all', label: 'All' }, ...FREQUENCIES]} value={show} onChange={setShow} />

        <Card style={{ paddingVertical: 4 }}>
          {list.length === 0 ? <Muted style={{ paddingVertical: 12 }}>No expenses here yet.</Muted> : null}
          {list.map((e, i) => (
            <Row
              key={e.id}
              first={i === 0}
              lead={<IconTile name={categoryIcon(e.category)} />}
              title={e.bike ? `${e.category} · ${e.bike}` : e.category}
              sub={[frequencyLabel(e.frequency), e.note].filter(Boolean).join(' · ')}
              right={naira(e.amount)}
              rightSub={
                notSynced(state, e.id) ? (
                  <Badge kind="amber">Not synced</Badge>
                ) : (
                  <Muted>{e.day === state.day ? 'Today' : dayLabel(e.day)}</Muted>
                )
              }
            />
          ))}
        </Card>
      </Screen>
    </View>
  );
}
