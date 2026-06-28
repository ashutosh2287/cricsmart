import React, { useCallback, useState } from "react";
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
import { useLiveMatches, useSimulations, type FixtureMatch, type SimMatch } from "@/hooks/useApi";

type Filter = "all" | "live" | "upcoming" | "simulations";

function formatScore(scores: { r?: number; w?: number; o?: number }[]): string {
  if (!scores || scores.length === 0) return "";
  return scores.map((s) => `${s.r ?? 0}/${s.w ?? 0} (${s.o ?? 0} ov)`).join(" • ");
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

export default function MatchesScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const { data: fixtureData, loading: fixturesLoading, refetch: refetchFixtures } = useLiveMatches();
  const { data: simData, loading: simsLoading, refetch: refetchSims } = useSimulations();
  const [refreshing, setRefreshing] = useState(false);

  const allMatches = fixtureData?.data ?? [];
  const simulations = simData ?? [];

  const liveMatches = allMatches.filter((m) => m.isLive);
  const upcomingMatches = allMatches.filter((m) => !m.isLive && m.status !== "completed");
  const recentMatches = allMatches.filter((m) => m.status === "completed");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFixtures(), refetchSims()]);
    setRefreshing(false);
  }, [refetchFixtures, refetchSims]);

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "upcoming", label: "Upcoming" },
    { key: "simulations", label: "Simulations" },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Live Section */}
      {(filter === "all" || filter === "live") && liveMatches.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.sectionTitle}>Live Now</Text>
            </View>
          </View>
          {liveMatches.map((match) => (
            <TouchableOpacity key={match.id} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchType}>{match.matchCategory || "T20"}</Text>
                <Text style={styles.matchStatus}>LIVE</Text>
              </View>
              <Text style={styles.teamName}>{getTeamNames(match)}</Text>
              <Text style={styles.score}>{formatScore(match.score || [])}</Text>
              {match.statusText && <Text style={styles.statusText}>{match.statusText}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Upcoming Section */}
      {(filter === "all" || filter === "upcoming") && upcomingMatches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming</Text>
          {upcomingMatches.slice(0, 5).map((match) => (
            <TouchableOpacity key={match.id} style={styles.matchCard}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchType}>{match.matchCategory || "ODI"}</Text>
              </View>
              <Text style={styles.teamName}>{getTeamNames(match)}</Text>
              {match.startTime && (
                <Text style={styles.timeText}>
                  {new Date(match.startTime).toLocaleDateString()} {new Date(match.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Section */}
      {(filter === "all" || filter === "upcoming") && recentMatches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Results</Text>
          {recentMatches.slice(0, 5).map((match) => (
            <TouchableOpacity key={match.id} style={[styles.matchCard, styles.completedCard]}>
              <View style={styles.matchHeader}>
                <Text style={styles.matchType}>{match.matchCategory || "T20"}</Text>
              </View>
              <Text style={styles.teamName}>{getTeamNames(match)}</Text>
              <Text style={styles.score}>{formatScore(match.score || [])}</Text>
              {match.statusText && <Text style={styles.statusText}>{match.statusText}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Simulations Section */}
      {(filter === "all" || filter === "simulations") && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Simulations</Text>
          {simsLoading ? (
            <View style={styles.loadingCard}><Text style={styles.loadingText}>Loading...</Text></View>
          ) : simulations.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="add-circle-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>No simulations yet</Text>
            </View>
          ) : (
            simulations.map((sim) => (
              <TouchableOpacity key={sim.matchId} style={styles.matchCard}>
                <View style={styles.matchHeader}>
                  <View style={styles.simStatus}>
                    <View style={[styles.statusDot, { backgroundColor: sim.status === "LIVE" ? colors.danger : colors.textMuted }]} />
                    <Text style={styles.statusText}>{sim.status}</Text>
                  </View>
                </View>
                <Text style={styles.teamName}>{sim.teamA} vs {sim.teamB}</Text>
                {sim.score && <Text style={styles.score}>{sim.score}</Text>}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.lg,
  },
  title: { ...typography.heading1, color: colors.text, fontFamily: "SpaceGrotesk" },
  filterScroll: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  filterRow: { flexDirection: "row", gap: spacing.sm },
  filterTab: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radii.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterTabActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  filterText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
  filterTextActive: { color: colors.textInverse },
  section: { marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  sectionTitle: { ...typography.heading3, color: colors.text, marginBottom: spacing.md },
  liveIndicator: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  matchCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md,
  },
  completedCard: { opacity: 0.8 },
  matchHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  matchType: {
    ...typography.small, color: colors.brand, backgroundColor: `${colors.brand}20`,
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm, overflow: "hidden",
  },
  matchStatus: { ...typography.small, color: colors.danger, fontWeight: "700" },
  teamName: { ...typography.heading3, color: colors.text, marginBottom: spacing.xs },
  score: { ...typography.body, color: colors.textSecondary, fontFamily: "JetBrainsMono" },
  statusText: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  timeText: { ...typography.caption, color: colors.brand, marginTop: spacing.sm },
  simStatus: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
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
});
