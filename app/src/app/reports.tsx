import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PeriodPicker } from '../components/PeriodPicker';
import { Button, Card, Chips, H2, Muted, Screen, TopBar } from '../components/ui';
import { exportExcel, exportPdf, shareReport } from '../lib/exporter';
import { Period, periodOf } from '../lib/money';
import { buildReport, FILTERS, Filters, ReportKind, REPORTS } from '../lib/report';
import { useStore } from '../store/AppStore';
import { colors, fonts } from '../theme';

const SHOW = 50;

export default function Reports() {
  const { state } = useStore();
  const isAdmin = state.session?.role === 'admin';
  const [kind, setKind] = useState<ReportKind>('sales');
  const [period, setPeriod] = useState<Period>(() => periodOf('week', state.day));
  const [filters, setFilters] = useState<Filters>({});
  const [message, setMessage] = useState('');

  if (state.session?.role === 'rider') {
    return (
      <View style={{ flex: 1 }}>
        <TopBar title="Reports" back />
        <Screen>
          <Muted>Only Admin and Staff can see reports.</Muted>
        </Screen>
      </View>
    );
  }

  const report = buildReport(state, kind, period, filters);
  const options = {
    product: state.products.map((p) => ({ value: p.id, label: p.name })),
    customer: state.customers.map((c) => ({ value: c.id, label: c.name })),
    staff: [...new Set(state.orders.map((o) => o.takenBy).filter(Boolean))].map((n) => ({ value: n, label: n })),
    rider: state.riders.map((r) => ({ value: r.id, label: r.name })),
  };
  const names = { product: 'Product', customer: 'Customer', staff: 'Staff (who took the order)', rider: 'Rider' };
  const run = async (fn: typeof exportPdf) => {
    setMessage('');
    setMessage((await fn(report)) ?? '');
  };

  return (
    <View style={{ flex: 1 }}>
      <TopBar title="Reports" back />
      <Screen>
        <View style={{ gap: 8 }}>
          <Text style={st.label}>Report</Text>
          <Chips<ReportKind>
            options={REPORTS.filter((r) => isAdmin || !r.adminOnly)}
            value={kind}
            onChange={(k) => {
              setKind(k);
              setFilters({});
              setMessage('');
            }}
          />
        </View>

        <PeriodPicker value={period} onChange={setPeriod} />

        {FILTERS[kind].map((key) => (
          <View key={key} style={{ gap: 8 }}>
            <Text style={st.label}>{names[key]}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Chips<string>
                options={[...(key === 'customer' && kind === 'customer' ? [] : [{ value: '', label: `All` }]), ...options[key]]}
                value={filters[key] ?? ''}
                onChange={(v) => setFilters((f) => ({ ...f, [key]: v || undefined }))}
              />
            </ScrollView>
          </View>
        ))}

        <Card>
          <H2>{`${report.title} · ${report.period}`}</H2>
          <View style={st.summary}>
            {report.summary.map(([k, v]) => (
              <View key={k} style={st.sumItem}>
                <Text style={st.sumLabel}>{k}</Text>
                <Text style={st.sumValue}>{v}</Text>
              </View>
            ))}
          </View>
        </Card>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Button title="PDF" kind="ghost" icon="download" disabled={!report.rows.length} onPress={() => run(exportPdf)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Excel" kind="ghost" icon="download" disabled={!report.rows.length} onPress={() => run(exportExcel)} />
          </View>
          <View style={{ flex: 1 }}>
            <Button title="Share" kind="ghost" icon="share" disabled={!report.summary.length} onPress={() => run(shareReport)} />
          </View>
        </View>
        {message ? <Muted>{message}</Muted> : null}

        <Card style={{ paddingHorizontal: 0 }}>
          {report.rows.length === 0 ? (
            <Muted style={{ paddingHorizontal: 16 }}>{report.empty ?? 'Nothing to show.'}</Muted>
          ) : (
            <ScrollView horizontal>
              <View style={{ paddingHorizontal: 16 }}>
                <TableRow cells={report.columns} columns={report.columns} numeric={report.numeric} head />
                {report.rows.slice(0, SHOW).map((row, i) => (
                  <TableRow key={i} cells={row} columns={report.columns} numeric={report.numeric} />
                ))}
                {report.total ? <TableRow cells={report.total} columns={report.columns} numeric={report.numeric} total /> : null}
              </View>
            </ScrollView>
          )}
          {report.rows.length > SHOW ? (
            <Muted style={{ paddingHorizontal: 16 }}>
              Showing {SHOW} of {report.rows.length} rows. The PDF and Excel files have them all.
            </Muted>
          ) : null}
        </Card>
      </Screen>
    </View>
  );
}

const WIDE = ['Customer', 'Items', 'Product', 'Note', 'Paid to', 'Rider'];

function TableRow({
  cells,
  columns,
  numeric,
  head,
  total,
}: {
  cells: string[];
  columns: string[];
  numeric: number[];
  head?: boolean;
  total?: boolean;
}) {
  return (
    <View style={[st.tr, total && st.total]}>
      {cells.map((c, i) => (
        <Text
          key={i}
          numberOfLines={2}
          style={[
            head ? st.th : total ? st.tdBold : st.td,
            { width: WIDE.includes(columns[i]) ? 160 : 100 },
            numeric.includes(i) && { textAlign: 'right' },
          ]}
        >
          {c}
        </Text>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
  summary: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 10, columnGap: 16 },
  sumItem: { width: '46%', gap: 2 },
  sumLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  sumValue: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.navy },
  tr: { flexDirection: 'row', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line },
  total: { borderTopWidth: 2, borderTopColor: colors.navy, borderBottomWidth: 0 },
  th: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },
  td: { fontFamily: fonts.body, fontSize: 13, color: colors.navy },
  tdBold: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.navy },
});
