import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ErrorState, LoadingState } from '@/components/states';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { formatNumber, formatPercentChange } from '@/lib/format';
import { radius, space, useTheme } from '@/theme';

import { dashboardSummaryQueryOptions, type DashboardSummary } from '../api';

/**
 * A dependency-free bar chart. Chart libraries add a lot of native code for a
 * chart this simple. The whole chart is one accessible element that reads the
 * numbers aloud, since bars mean nothing to a screen reader.
 */
function SignupsChart({ data }: { data: DashboardSummary['signups'] }) {
  const { colors } = useTheme();
  const max = Math.max(...data.map((point) => point.count), 1);
  const summary = data.map((point) => `${point.month}: ${point.count}`).join(', ');

  return (
    <View accessible accessibilityLabel={`New signups per month. ${summary}`} style={styles.chart}>
      {data.map((point) => (
        <View key={point.month} style={styles.column}>
          <Text variant="caption" color="muted">
            {formatNumber(point.count)}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.bar,
                { height: `${(point.count / max) * 100}%`, backgroundColor: colors.primary },
              ]}
            />
          </View>
          <Text variant="caption" color="muted">
            {point.month}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function DashboardScreen({ firstName }: { firstName: string }) {
  const { colors } = useTheme();
  const summary = useQuery(dashboardSummaryQueryOptions());

  if (summary.isPending) return <LoadingState label="Loading dashboard" />;
  if (summary.isError) {
    return <ErrorState error={summary.error} onRetry={() => void summary.refetch()} />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={summary.isRefetching}
          onRefresh={() => void summary.refetch()}
          tintColor={colors.primary}
        />
      }
    >
      <Text color="muted">Welcome back, {firstName}. Here&apos;s what&apos;s happening.</Text>

      <View style={styles.grid}>
        {summary.data.stats.map((stat) => {
          const good = stat.key === 'pending' ? stat.change <= 0 : stat.change >= 0;
          return (
            <Card
              key={stat.key}
              style={styles.stat}
              accessible
              accessibilityLabel={`${stat.label}: ${formatNumber(stat.value)}, ${formatPercentChange(stat.change)} versus last month`}
            >
              <Text variant="small" color="muted">
                {stat.label}
              </Text>
              <Text variant="heading">{formatNumber(stat.value)}</Text>
              <Text variant="caption" weight="600" color={good ? 'success' : 'danger'}>
                {formatPercentChange(stat.change)} vs last month
              </Text>
            </Card>
          );
        })}
      </View>

      <Card>
        <Text variant="title" accessibilityRole="header">
          New signups
        </Text>
        <Text variant="small" color="muted">
          Last six months
        </Text>
        <SignupsChart data={summary.data.signups} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  stat: { flexGrow: 1, flexBasis: '45%', gap: space.xs },
  chart: { flexDirection: 'row', gap: space.sm, height: 180, marginTop: space.md },
  column: { flex: 1, alignItems: 'center', gap: space.xs },
  track: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderTopLeftRadius: radius.sm, borderTopRightRadius: radius.sm },
});
