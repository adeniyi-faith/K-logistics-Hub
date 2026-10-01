import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { DOC_KINDS, Rider } from '../data/types';
import { dayLabel } from '../lib/format';
import { uuid } from '../lib/id';
import { takeDeliveryPhoto } from '../lib/photo';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { ProofPhoto } from './ProofPhoto';
import { Text } from './Text';
import { Button, Card, Chips, H2, LinkText, Muted } from './ui';

/** A rider's papers (licence, ID, bike papers…). canAdd: can upload and remove them. */
export function DocumentsCard({ rider, canAdd, mine }: { rider: Rider; canAdd: boolean; mine?: boolean }) {
  const { state, mode, updateRider } = useStore();
  const docs = rider.documents ?? [];
  const [open, setOpen] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState(DOC_KINDS[0]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setError('');
    setBusy(true);
    try {
      const r = await takeDeliveryPhoto(mode === 'demo' || Platform.OS === 'web', 'documents');
      if (!r) return;
      if ('error' in r) return setError(r.error);
      const doc = { id: uuid(), kind, photo: r.uri, day: state.day };
      updateRider(rider.id, { documents: [...docs, doc] });
      setAdding(false);
      setOpen(doc.id);
    } catch {
      setError('Could not add the photo. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = (id: string) => updateRider(rider.id, { documents: docs.filter((d) => d.id !== id) });

  return (
    <Card>
      <H2 right={canAdd && !adding ? <LinkText onPress={() => setAdding(true)}>+ Add</LinkText> : undefined}>
        {mine ? 'My documents' : 'Documents'}
      </H2>
      {docs.length === 0 && !adding ? (
        <Muted>{mine ? "Add your driver's licence, ID and bike papers." : 'No documents uploaded yet.'}</Muted>
      ) : null}

      {docs.map((d) => (
        <View key={d.id} style={st.doc}>
          <Pressable
            onPress={() => setOpen(open === d.id ? null : d.id)}
            accessibilityRole="button"
            accessibilityLabel={`${d.kind}, ${open === d.id ? 'hide' : 'show'} photo`}
            style={st.docRow}
          >
            <View style={st.tile}>
              <Icon name="file" size={20} color={colors.orangeText} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={st.docName} numberOfLines={1}>
                {d.kind}
              </Text>
              <Muted>Added {dayLabel(d.day)}</Muted>
            </View>
            <Icon name={open === d.id ? 'up' : 'down'} size={18} color={colors.muted} />
          </Pressable>
          {open === d.id ? (
            <View style={{ gap: 8 }}>
              <ProofPhoto photo={d.photo} label={d.kind} />
              {canAdd ? <Button title="Remove" kind="danger" icon="x" onPress={() => remove(d.id)} /> : null}
            </View>
          ) : null}
        </View>
      ))}

      {adding ? (
        <View style={st.add}>
          <Text style={st.label}>Which document?</Text>
          <Chips<string> options={DOC_KINDS.map((k) => ({ value: k, label: k }))} value={kind} onChange={setKind} />
          {error ? <Text style={st.error}>{error}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button title="Cancel" kind="ghost" onPress={() => setAdding(false)} />
            </View>
            <View style={{ flex: 2 }}>
              <Button title={busy ? 'Opening…' : 'Add photo'} icon="camera" onPress={add} disabled={busy} />
            </View>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const st = StyleSheet.create({
  doc: { gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  tile: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.orangeBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
  add: { gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.navy },
  error: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
});
