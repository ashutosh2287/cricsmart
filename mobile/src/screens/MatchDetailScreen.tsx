import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "@/styles/theme";
import { useApi, type FixtureMatch } from "@/hooks/useApi";

function formatScore(r?: number, w?: number, o?: number): string {
  return `${r ?? 0}/${w ?? 0} (${o ?? 0} ov)`;
}

function getTeamNames(match: FixtureMatch): [string, string] {
  if (match.teamInfo && match.teamInfo.length >= 2) {
    return [match.teamInfo[0].name, match.teamInfo[1].name];
  }
  if (match.teams && match.teams.length >= 2) {
    return [match.teams[0], match.teams[1]];
  }
  return ["Team A", "Team B"];
}

export default function MatchDetailScreen({ route }: { route: { params: { matchId: string } } }) {
  const { matchId } = route.params;
  const { data: fixtureData, loading, refetch } = useApi<{ data: FixtureMatch[] }>("/live/fixtures");
  const [refreshing, setRefreshing] = React.useState(false);

  const matches = fixtureData?.data ?? [];
  const match = matches.find((m) => m.id === matchId);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading match...</Text>
        </View>
      </View>
    );
  }

  if (!match) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Match not found</Text>
          <Text style={styles.emptyText}>This match may no longer be available.</Text>
        </View>
      </View>
    );
  }

  const [teamA, teamB] = getTeamNames(match);
  const scoreA = match.score?.[0];
  const scoreB = match.score?.[1];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.badge}>{match.matchCategory || "T20"}</Text>
          {match.isLive && (
            <View style={styles.liveTag}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          )}
        </View>
        <Text style={styles.statusText}>{match.statusText || "Match in progress"}</Text>
      </View>

      {/* Score Display */}
      <View style={styles.section}>
        <View style={styles.scoreCard}>
          <View style={styles.teamColumn}>
            <Text style={styles.teamName}>{teamA}</Text>
            {scoreA && (
              <Text style={styles.score}>{formatScore(scoreA.r, scoreA.w, scoreA.o)}</Text>
            )}
          </View>

          <View style={styles.vsColumn}>
            <Text style={styles.vsText}>vs</Text>
          </View>

          <View style={styles.teamColumn}>
            <Text style={styles.teamName}>{teamB}</Text>
            {scoreB && (
              <Text style={styles.score}>{formatScore(scoreB.r, scoreB.w, scoreB.o)}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Match Info */}
      <View style={styles.section}>
        <View style={styles.infoCard}>
          {match.venue && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color={colors.brand} />
              <Text style={styles.infoLabel}>Venue</Text>
              <Text style={styles.infoValue}>{match.venue}</Text>
            </View>
          )}
          {match.seriesName && (
            <View style={styles.infoRow}>
              <Ionicons name="trophy" size={16} color={colors.amber} />
              <Text style={styles.infoLabel}>Series</Text>
              <Text style={styles.infoValue}>{match.seriesName}</Text>
            </View>
          )}
          {match.startTime && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={16} color={colors.accent} />
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {new Date(match.startTime).toLocaleDateString(undefined, {
                  year: "numeric", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Innings Breakdown */}
      {match.score && match.score.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Innings</Text>
          {match.score.map((entry, i) => (
            <View key={i} style={styles.inningsCard}>
              <View style={styles.inningsHeader}>
                <View style={styles.inningsBadge}>
                  <Text style={styles.inningsNumber}>{i + 1}</Text>
                </View>
                <Text style={styles.inningsLabel}>{entry.inning || `Innings ${i + 1}`}</Text>
              </View>
              <Text style={styles.inningsScore}>{formatScore(entry.r, entry.w, entry.o)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="speedometer" size={20} color={colors.brand} />
            <Text style={styles.statValue}>{scoreA?.o ? ((scoreA.r ?? 0) / (scoreA.o ?? 1)).toFixed(2) : "N/A"}</Text>
            <Text style={styles.statLabel}>Run Rate</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={20} color={colors.success} />
            <Text style={styles.statValue}>{scoreA?.w ?? 0}</Text>
            <Text style={styles.statLabel}>Wickets</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={20} color={colors.amber} />
            <Text style={styles.statValue}>{scoreA?.o ?? 0}</Text>
            <Text style={styles.statLabel}>Overs</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="football" size={20} color={colors.accent} />
            <Text style={styles.statValue}>{scoreA?.r ?? 0}</Text>
            <Text style={styles.statLabel}>Runs</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.lg },
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  badge: {
    ...typography.small, color: colors.brand, backgroundColor: `${colors.brand}20`,
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm, overflow: "hidden",
  },
  liveTag: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
  liveText: { ...typography.small, color: colors.danger, fontWeight: "700" },
  statusText: { ...typography.caption, color: colors.textMuted },
  section: { marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  sectionTitle: { ...typography.heading3, color: colors.text, marginBottom: spacing.md },
  scoreCard: {
    flexDirection: "row", backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.xl, borderWidth: 1, borderColor: colors.border, alignItems: "center",
  },
  teamColumn: { flex: 1, alignItems: "center" },
  teamName: { ...typography.heading3, color: colors.text, marginBottom: spacing.sm, textAlign: "center" },
  score: { ...typography.heading2, color: colors.brand, fontFamily: "JetBrainsMono", textAlign: "center" },
  vsColumn: { paddingHorizontal: spacing.lg },
  vsText: { ...typography.caption, color: colors.textMuted },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, gap: spacing.md,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoLabel: { ...typography.caption, color: colors.textMuted, width: 60 },
  infoValue: { ...typography.body, color: colors.text, flex: 1 },
  inningsCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  inningsHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  inningsBadge: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surface3,
    alignItems: "center", justifyContent: "center",
  },
  inningsNumber: { ...typography.small, color: colors.textMuted },
  inningsLabel: { ...typography.caption, color: colors.textMuted },
  inningsScore: { ...typography.heading2, color: colors.text, fontFamily: "JetBrainsMono" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: {
    width: "47%", backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: spacing.sm,
  },
  statValue: { ...typography.heading3, color: colors.text, fontFamily: "SpaceGrotesk" },
  statLabel: { ...typography.caption, color: colors.textMuted },
  loadingState: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { ...typography.body, color: colors.textMuted },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.md },
  emptyTitle: { ...typography.heading3, color: colors.text },
  emptyText: { ...typography.caption, color: colors.textMuted },
});
