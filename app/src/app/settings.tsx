import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';

import { Text } from '../components/Text';

import { BusinessLogo } from '../components/BusinessLogo';
import { SwitchRow } from '../components/SwitchRow';
import { ListEditor } from '../components/ListEditor';
import { Button, Card, Chips, Field, H2, Muted, Screen, TopBar } from '../components/ui';
import { RIDER_WORDS, SALE_WORDS } from '../data/settings';
import { Settings as SettingsType } from '../data/types';
import { PAY_CATEGORY } from '../lib/pay';
import { takeDeliveryPhoto } from '../lib/photo';
import { useAccess } from '../lib/useAccess';
import { wordsFor } from '../lib/words';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

const toNumber = (t: string) => Number(t.replace(/[^\d]/g, '')) || 0;

/** Business settings (Admin): logo, lists people pick from, stock rules, own words, delivery photo. */
export default function Settings() {
  const { state, mode, updateSettings } = useStore();
  const acc = useAccess();
  const [draft, setDraft] = useState<SettingsType>(state.settings);
  const [low, setLow] = useState(String(state.settings.lowStockAt));
  const [error, setError] = useState('');

  if (!acc.canEdit('settings')) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Business settings" back />
        <Screen>
          <Muted>Only Admin can change business settings.</Muted>
        </Screen>
      </View>
    );
  }

  const set = (changes: Partial<SettingsType>) => {
    setError('');
    setDraft((d) => ({ ...d, ...changes }));
  };
  const w = wordsFor(draft.words);

  const pickLogo = async () => {
    const r = await takeDeliveryPhoto(mode === 'demo' || Platform.OS === 'web', 'the logo', 'library');
    if (!r) return;
    if ('error' in r) return setError(r.error);
    set({ logo: r.uri });
  };

  const save = () => {
    if (!draft.businessName.trim()) return setError('Enter the business name.');
    if (!draft.units.length) return setError('Keep at least one unit.');
    if (!draft.areas.length) return setError('Keep at least one delivery area.');
    if (!draft.productGroups.length) return setError('Keep at least one product group.');
    const units = draft.units;
    updateSettings({
      ...draft,
      businessName: draft.businessName.trim(),
      tagline: draft.tagline.trim(),
      location: draft.location.trim(),
      defaultUnit: units.includes(draft.defaultUnit) ? draft.defaultUnit : units[0],
      lowStockAt: toNumber(low),
    });
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Business settings" back />
      <Screen
        footer={
          <View style={{ gap: 8 }}>
            {error ? <Text style={st.error}>{error}</Text> : null}
            <Button title="Save settings" kind="accent" icon="check" onPress={save} />
          </View>
        }
      >
        <Card>
          <H2>Branding</H2>
          <View style={st.brand}>
            <PreviewLogo logo={draft.logo} saved={state.settings.logo} />
            <View style={{ flex: 1, gap: 8 }}>
              <Button title="Change logo" kind="ghost" icon="camera" onPress={pickLogo} />
              {draft.logo ? (
                <Button title="Use the K-Logistics logo" kind="ghost" onPress={() => set({ logo: undefined })} />
              ) : null}
            </View>
          </View>
          <Field label="Business name" value={draft.businessName} onChangeText={(t) => set({ businessName: t })} />
          <Field label="Slogan" value={draft.tagline} onChangeText={(t) => set({ tagline: t })} />
          <Field label="Location" value={draft.location} onChangeText={(t) => set({ location: t })} />
          <Muted>The logo and name show on the sign-in screen. The name also goes at the top of exported reports.</Muted>
        </Card>

        <Card>
          <ListEditor
            title="Expense categories"
            items={draft.expenseCategories}
            onChange={(expenseCategories) => set({ expenseCategories })}
            locked={[PAY_CATEGORY]}
            placeholder="e.g. Rent"
          />
          <Muted>"{PAY_CATEGORY}" stays: paying staff and riders uses it.</Muted>
        </Card>

        <Card>
          <H2>Products & stock</H2>
          <Text style={st.label}>Default unit for new products</Text>
          <Chips<string>
            options={draft.units.map((u) => ({ value: u, label: u }))}
            value={draft.defaultUnit}
            onChange={(defaultUnit) => set({ defaultUnit })}
          />
          <Field
            label="Warn me when stock falls to"
            value={low}
            onChangeText={(t) => (setError(''), setLow(t))}
            keyboardType="number-pad"
            helper="Used for new products. Each product can have its own number (Edit prices)."
          />
          <SwitchRow
            label={`Allow ${w.sales} when stock is 0`}
            sub={
              draft.allowZeroStock
                ? `On: a ${w.sale} can take more than what is in the store.`
                : `Off: a ${w.sale} can't take more than what is in the store. Stops mistakes when stock runs out.`
            }
            value={draft.allowZeroStock}
            onChange={(allowZeroStock) => set({ allowZeroStock })}
            onColor={colors.navy}
          />
        </Card>

        <Card>
          <ListEditor title="Units" items={draft.units} onChange={(units) => set({ units })} placeholder="e.g. sachet" />
          <Muted>Write each unit for one item, e.g. "bottle", not "bottles".</Muted>
        </Card>

        <Card>
          <ListEditor
            title="Product groups"
            items={draft.productGroups}
            onChange={(productGroups) => set({ productGroups })}
            placeholder="e.g. Baby care"
          />
        </Card>

        <Card>
          <ListEditor
            title="Delivery areas"
            items={draft.areas}
            onChange={(areas) => set({ areas })}
            placeholder="e.g. Rumuibekwe"
          />
          <Muted>Removing an area doesn't change {w.sales} or customers already saved with it.</Muted>
        </Card>

        <Card>
          <H2>Words we use</H2>
          <Text style={st.label}>Call a sale</Text>
          <Chips<string>
            options={SALE_WORDS.map((x) => ({ value: x, label: x }))}
            value={draft.words.sale}
            onChange={(sale) => set({ words: { ...draft.words, sale } })}
          />
          <Text style={st.label}>Call a rider</Text>
          <Chips<string>
            options={RIDER_WORDS.map((x) => ({ value: x, label: x }))}
            value={draft.words.rider}
            onChange={(rider) => set({ words: { ...draft.words, rider } })}
          />
          <Muted>
            The app will say "New {w.sale}", "{w.Sales}" and "{w.Riders} & bikes" on everyone's phone.
          </Muted>
        </Card>

        <Card>
          <H2>Customers</H2>
          <SwitchRow
            label={`Take customer details on each ${w.sale}`}
            sub={
              draft.customerDetails
                ? `On: each ${w.sale} needs the customer's name (phone optional).`
                : `Off: ${w.sales} are saved without a customer. Only the delivery area and address are taken.`
            }
            value={draft.customerDetails}
            onChange={(customerDetails) => set({ customerDetails })}
            onColor={colors.navy}
          />
        </Card>

        <Card>
          <H2>Proof of delivery</H2>
          <SwitchRow
            label={`Ask ${w.riders} for a delivery photo`}
            sub={
              draft.requirePhoto
                ? `On: ${w.riders} must take a photo before they can confirm a delivery.`
                : `Off: ${w.riders} confirm deliveries without a photo.`
            }
            value={draft.requirePhoto}
            onChange={(requirePhoto) => set({ requirePhoto })}
            onColor={colors.navy}
          />
        </Card>

        <Muted>Other phones get the changes when they're online.</Muted>
      </Screen>
    </View>
  );
}

/** Shows the logo being picked, before it is saved. */
function PreviewLogo({ logo, saved }: { logo?: string; saved?: string }) {
  if (logo === saved) return <BusinessLogo style={st.logo} />;
  return (
    <Image
      source={logo ? { uri: logo } : require('../../assets/logo.jpg')}
      style={st.logo}
      resizeMode="contain"
      accessibilityLabel={logo ? 'New logo' : 'K-Logistics logo'}
    />
  );
}

const st = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: { width: 80, height: 80, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.navy },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
