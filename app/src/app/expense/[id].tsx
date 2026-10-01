import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ProofPhoto } from '../../components/ProofPhoto';
import { Card, H2, Muted, Row, Screen, TopBar } from '../../components/ui';
import { frequencyLabel } from '../../lib/expenses';
import { clock, dayLabel, naira } from '../../lib/format';
import { payeeName } from '../../lib/pay';
import { useStore } from '../../store/AppStore';
import { useAccess } from '../../lib/useAccess';

export default function ExpenseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useStore();
  const acc = useAccess();
  const e = state.expenses.find((x) => x.id === id);

  if (!e || !(e.payee ? acc.canView('staffpay') : acc.canView('expenses'))) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Expense" back />
        <Screen>
          <Muted>This expense can't be found.</Muted>
        </Screen>
      </View>
    );
  }

  const paid = payeeName(state, e.payee);
  return (
    <View style={{ flex: 1 }}>
      <TopBar title={e.category} back />
      <Screen>
        <Card style={{ paddingVertical: 4 }}>
          <Row first title="Amount" right={naira(e.amount)} />
          <Row title="Date" right={dayLabel(e.day)} />
          <Row title="How often" right={frequencyLabel(e.frequency)} />
          {e.bike ? <Row title="Bike" right={e.bike} /> : null}
          {paid ? <Row title="Paid to" right={paid} /> : null}
          {e.note ? <Row title="Note" sub={e.note} /> : null}
          <Row title="Written down by" right={[e.by, e.at && clock(e.at)].filter(Boolean).join(' · ')} />
        </Card>
        {e.receipt ? (
          <Card>
            <H2>Receipt photo</H2>
            <ProofPhoto photo={e.receipt} label="Receipt photo" />
          </Card>
        ) : null}
      </Screen>
    </View>
  );
}
