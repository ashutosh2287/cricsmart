import React, { useCallback } from "react";
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
import { useLiveMatches, useSimulations, type FixtureMatch } from "@/hooks/useApi";

function formatScore(scores: { r?: number; w?: number; o?: number }[]): string {
  if (!scores || scores.length === 0) return "";
  const s = scores[0];
  return `${s.r ?? 0}/${s.w ?? 0} (${s.o ?? 0} ov)`;
}

function getTeamNames(match: FixtureMatch): string {
  if (match.teamInfo && match.teamInfo.length >= 2) {
    return `${match.teamInfo[0].name} vs ${match.teamInfo[1].name}`;
  }
  if (match.teams && match.teams.length >= 2) {
    return `${match.teams[0]} vs ${match.teams[1]}`;
  }
  return match.name || "TBA vs TBA";
}

export default function HomeScreen() {
  const { data: fixtureData, loading: fixturesLoading, refetch: refetchFixtures } = useLiveMatches();
  const { data: simData, loading: simsLoading, refetch: refetchSims } = useSimulations();

  const liveMatches = (fixtureData?.data ?? []).filter((m) => m.isLive);
  const simulations = simData ?? [];

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFixtures(), refetchSims()]);
    setRefreshing(false);
  }, [refetchFixtures, refetchSims]);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back</Text>
          <Text style={styles.username}>Cricket Fan</Text>
        </View>
        <TouchableOpacity style={styles.avatar}>
          <Ionicons name="person" size={24} color={colors.brand} />
        </TouchableOpacity>
      </View>

      {/* Live Matches */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.sectionTitle}>Live Matches</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {fixturesLoading ? (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : liveMatches.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="football-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No live matches right now</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {liveMatches.slice(0, 5).map((match) => (
              <TouchableOpacity key={match.id} style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <Text style={styles.matchType}>{match.matchCategory || "T20"}</Text>
                  <Text style={styles.matchStatus}>LIVE</Text>
                </View>
                <Text style={styles.teamName}>{getTeamNames(match)}</Text>
                <Text style={styles.score}>{formatScore(match.score || [])}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Your Simulations */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Simulations</Text>
          <Text style={styles.count}>{simulations.length} matches</Text>
        </View>

        {simsLoading ? (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : simulations.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="add-circle-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>No simulations yet</Text>
          </View>
        ) : (
          simulations.slice(0, 4).map((sim) => (
            <TouchableOpacity key={sim.matchId} style={styles.simCard}>
              <View style={styles.simStatus}>
                <View style={[styles.statusDot, { backgroundColor: sim.status === "LIVE" ? colors.danger : colors.textMuted }]} />
                <Text style={styles.statusText}>{sim.status}</Text>
              </View>
              <Text style={styles.teamName}>{sim.teamA} vs {sim.teamB}</Text>
              {sim.score && <Text style={styles.score}>{sim.score}</Text>}
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="add-circle" size={24} color={colors.success} />
            <Text style={styles.actionLabel}>Host Match</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="people" size={24} color={colors.brand} />
            <Text style={styles.actionLabel}>Create Team</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="trophy" size={24} color={colors.amber} />
            <Text style={styles.actionLabel}>Tournament</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="search" size={24} color={colors.accent} />
            <Text style={styles.actionLabel}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
  },
  greeting: { ...typography.caption, color: colors.textMuted },
  username: { ...typography.heading1, color: colors.text, fontFamily: "SpaceGrotesk" },
  avatar: {
    width: 44, height: 44, borderRadius: radii.lg,
    backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.border,
  },
  section: { marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.heading3, color: colors.text },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  viewAll: { ...typography.caption, color: colors.brand },
  count: { ...typography.caption, color: colors.textMuted },
  matchCard: {
    width: 200, backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.lg, marginRight: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  matchHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  matchType: {
    ...typography.small, color: colors.brand, backgroundColor: `${colors.brand}20`,
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm, overflow: "hidden",
  },
  matchStatus: { ...typography.small, color: colors.danger, fontWeight: "700" },
  teamName: { ...typography.body, color: colors.text, fontWeight: "600", marginBottom: spacing.xs },
  score: { ...typography.caption, color: colors.textSecondary, fontFamily: "JetBrainsMono" },
  simCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  simStatus: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...typography.small, color: colors.textMuted, textTransform: "uppercase" },
  loadingCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xl,
    borderWidth: 1, borderColor: colors.border, alignItems: "center",
  },
  loadingText: { ...typography.caption, color: colors.textMuted },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xxl,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: spacing.md,
  },
  emptyText: { ...typography.caption, color: colors.textMuted },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  actionCard: {
    width: "47%", backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", gap: spacing.sm,
  },
  actionLabel: { ...typography.caption, color: colors.textSecondary, fontWeight: "600" },
});
