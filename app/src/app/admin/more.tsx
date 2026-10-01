import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '../../components/Icon';
import { SignedInMenu } from '../../components/SignedInMenu';
import { Card, IconTile, Row, Screen, TopBar } from '../../components/ui';
import { colors } from '../../theme';
import { useWords } from '../../lib/words';

export default function More() {
  const w = useWords();
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="More" />
      <Screen>
        <Card style={{ paddingVertical: 4 }}>
          <Row
            first
            lead={<IconTile name="file" />}
            title="Daily record"
            sub={`Each day's stock, money and ${w.rider} earnings`}
            rightSub={<Icon name="chev" color={colors.muted} />}
            onPress={() => router.push('/day-record')}
          />
          <Row
            lead={<IconTile name="receipt" />}
            title="Expenses"
            sub="Fuel, repairs, pay"
            rightSub={<Icon name="chev" color={colors.muted} />}
            onPress={() => router.push('/expenses')}
          />
          <Row
            lead={<IconTile name="users" />}
            title="Staff & pay"
            sub="Salaries and payments"
            rightSub={<Icon name="chev" color={colors.muted} />}
            onPress={() => router.push('/staff-pay')}
          />
          <Row
            lead={<IconTile name="bike" />}
            title={`${w.Riders} & bikes`}
            sub={`${w.Riders}, bikes and earnings`}
            rightSub={<Icon name="chev" color={colors.muted} />}
            onPress={() => router.push('/riders')}
          />
          <Row
            lead={<IconTile name="chart" />}
            title="Finance"
            sub="Profit by day, week and month"
            rightSub={<Icon name="chev" color={colors.muted} />}
            onPress={() => router.push('/finance')}
          />
          <Row
            lead={<IconTile name="file" />}
            title="Reports"
            sub="Filter, then save as PDF or Excel"
            rightSub={<Icon name="chev" color={colors.muted} />}
            onPress={() => router.push('/reports')}
          />
          <Row
            lead={<IconTile name="shield" />}
            title="Users & access"
            sub="Who can see and change what"
            rightSub={<Icon name="chev" color={colors.muted} />}
            onPress={() => router.push('/users')}
          />
          <Row
            lead={<IconTile name="sliders" />}
            title="Business settings"
            sub="Logo, lists, words and delivery photo"
            rightSub={<Icon name="chev" color={colors.muted} />}
            onPress={() => router.push('/settings')}
          />
        </Card>
        <SignedInMenu />
      </Screen>
    </View>
  );
}
