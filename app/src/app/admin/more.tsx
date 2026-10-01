import { router } from 'expo-router';
import { View } from 'react-native';

import { Icon } from '../../components/Icon';
import { ComingNext, SignedInMenu } from '../../components/SignedInMenu';
import { Card, IconTile, Row, Screen, TopBar } from '../../components/ui';
import { colors } from '../../theme';

export default function More() {
  return (
    <View style={{ flex: 1 }}>
      <TopBar title="More" />
      <Screen>
        <Card style={{ paddingVertical: 4 }}>
          <Row
            first
            lead={<IconTile name="file" />}
            title="Daily record"
            sub="Each day's stock, money and rider earnings"
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
            title="Riders & bikes"
            sub="Riders, bikes and earnings"
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
            lead={<IconTile name="sliders" />}
            title="Business settings"
            sub="Delivery photo on or off"
            rightSub={<Icon name="chev" color={colors.muted} />}
            onPress={() => router.push('/settings')}
          />
        </Card>
        <ComingNext what="Users & access, and the staff app where each person only sees what Admin allows." />
        <SignedInMenu />
      </Screen>
    </View>
  );
}
