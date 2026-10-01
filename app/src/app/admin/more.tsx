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
            lead={<IconTile name="sliders" />}
            title="Business settings"
            sub="Delivery photo on or off"
            rightSub={<Icon name="chev" color={colors.muted} />}
            onPress={() => router.push('/settings')}
          />
        </Card>
        <ComingNext what="Expenses, Staff & pay, Riders & bikes, Finance, Reports and Users & access." />
        <SignedInMenu />
      </Screen>
    </View>
  );
}
