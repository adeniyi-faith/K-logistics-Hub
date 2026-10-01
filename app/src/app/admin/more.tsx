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
            lead={<IconTile name="chart" />}
            title="Finance"
            sub="Profit by day, week and month"
            rightSub={<Icon name="chev" color={colors.muted} />}
            onPress={() => router.push('/finance')}
          />
          <Row
            lead={<IconTile name="wallet" />}
            title="Rider earnings"
            sub="Each rider, day by day"
            rightSub={<Icon name="chev" color={colors.muted} />}
            onPress={() => router.push('/rider-earnings')}
          />
          <Row
            lead={<IconTile name="sliders" />}
            title="Business settings"
            sub="Delivery photo on or off"
            rightSub={<Icon name="chev" color={colors.muted} />}
            onPress={() => router.push('/settings')}
          />
        </Card>
        <ComingNext what="Reports, Staff & pay, Riders & bikes, and Users & access." />
        <SignedInMenu />
      </Screen>
    </View>
  );
}
