import React, { useState } from "react";
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

function formatScore(scores: { r?: number; w?: number; o?: number }[]): string {
  if (!scores || scores.length === 0) return "N/A";
  const s = scores[0];
  return `${s.r ?? 0}/${s.w ?? 0}`;
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

export default function AnalyticsScreen() {
  const { data: fixtureData, refetch: refetchFixtures } = useLiveMatches();
  const { data: simData, refetch: refetchSims } = useSimulations();
  const [selectedMatch, setSelectedMatch] = useState<FixtureMatch | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const allMatches = fixtureData?.data ?? [];
  const liveMatch = selectedMatch || allMatches.find((m) => m.isLive) || allMatches[0];
  const simulations = simData ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchFixtures(), refetchSims()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      {/* Match Selector */}
      {allMatches.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Match</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.matchSelector}>
              {allMatches.slice(0, 6).map((match) => (
                <TouchableOpacity
                  key={match.id}
                  style={[styles.matchChip, liveMatch?.id === match.id && styles.matchChipActive]}
                  onPress={() => setSelectedMatch(match)}
                >
                  <Text style={[styles.matchChipText, liveMatch?.id === match.id && styles.matchChipTextActive]}>
                    {getTeamNames(match).split(" vs ")[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Current Match Info */}
      {liveMatch ? (
        <>
          <View style={styles.section}>
            <View style={styles.matchInfoCard}>
              <View style={styles.matchInfoHeader}>
                <Text style={styles.matchInfoType}>{liveMatch.matchCategory || "T20"}</Text>
                {liveMatch.isLive && <Text style={styles.liveTag}>LIVE</Text>}
              </View>
              <Text style={styles.matchInfoTeams}>{getTeamNames(liveMatch)}</Text>
              <Text style={styles.matchInfoScore}>{formatScore(liveMatch.score || [])}</Text>
              {liveMatch.venue && (
                <Text style={styles.matchInfoVenue}>{liveMatch.venue}</Text>
              )}
            </View>
          </View>

          {/* Win Probability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Win Probability</Text>
            <View style={styles.probCard}>
              <View style={styles.probRow}>
                <View style={styles.probItem}>
                  <Text style={styles.probLabel}>Batting</Text>
                  <Text style={[styles.probValue, { color: colors.success }]}>62%</Text>
                </View>
                <View style={styles.probItem}>
                  <Text style={styles.probLabel}>Bowling</Text>
                  <Text style={[styles.probValue, { color: colors.danger }]}>38%</Text>
                </View>
              </View>
              {/* Simple bar */}
              <View style={styles.probBar}>
                <View style={[styles.probBarFill, { width: "62%", backgroundColor: colors.success }]} />
                <View style={[styles.probBarFill, { width: "38%", backgroundColor: colors.danger }]} />
              </View>
            </View>
          </View>

          {/* Key Metrics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Ionicons name="speedometer" size={20} color={colors.brand} />
                <Text style={styles.metricValue}>8.42</Text>
                <Text style={styles.metricLabel}>Run Rate</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="trending-up" size={20} color={colors.success} />
                <Text style={styles.metricValue}>9.21</Text>
                <Text style={styles.metricLabel}>Required RR</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="pulse" size={20} color={colors.amber} />
                <Text style={styles.metricValue}>Balanced</Text>
                <Text style={styles.metricLabel}>Momentum</Text>
              </View>
              <View style={styles.metricCard}>
                <Ionicons name="warning" size={20} color={colors.danger} />
                <Text style={styles.metricValue}>High</Text>
                <Text style={styles.metricLabel}>Pressure</Text>
              </View>
            </View>
          </View>

          {/* AI Prediction */}
          <View style={styles.section}>
            <View style={styles.aiCard}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={20} color={colors.brand} />
                <Text style={styles.aiTitle}>AI Prediction</Text>
              </View>
              <View style={styles.predictionRow}>
                <View style={styles.predictionItem}>
                  <Text style={styles.predictionValue}>218</Text>
                  <Text style={styles.predictionLabel}>Projected</Text>
                </View>
                <View style={styles.predictionItem}>
                  <Text style={[styles.predictionValue, { color: colors.success }]}>245</Text>
                  <Text style={styles.predictionLabel}>Best Case</Text>
                </View>
                <View style={styles.predictionItem}>
                  <Text style={[styles.predictionValue, { color: colors.danger }]}>192</Text>
                  <Text style={styles.predictionLabel}>Worst Case</Text>
                </View>
              </View>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.section}>
          <View style={styles.emptyCard}>
            <Ionicons name="bar-chart-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No matches to analyze</Text>
            <Text style={styles.emptyText}>Host or play a match to see analytics.</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.lg },
  title: { ...typography.heading1, color: colors.text, fontFamily: "SpaceGrotesk" },
  section: { marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  sectionTitle: { ...typography.heading3, color: colors.text, marginBottom: spacing.md },
  matchSelector: { flexDirection: "row", gap: spacing.sm },
  matchChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radii.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
  },
  matchChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  matchChipText: { ...typography.caption, color: colors.textMuted, fontWeight: "600" },
  matchChipTextActive: { color: colors.textInverse },
  matchInfoCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  matchInfoHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  matchInfoType: {
    ...typography.small, color: colors.brand, backgroundColor: `${colors.brand}20`,
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm, overflow: "hidden",
  },
  liveTag: { ...typography.small, color: colors.danger, fontWeight: "700" },
  matchInfoTeams: { ...typography.heading2, color: colors.text, fontFamily: "SpaceGrotesk", marginBottom: spacing.xs },
  matchInfoScore: { ...typography.heading3, color: colors.textSecondary, fontFamily: "JetBrainsMono" },
  matchInfoVenue: { ...typography.caption, color: colors.textMuted, marginTop: spacing.sm },
  probCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  probRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: spacing.md },
  probItem: { alignItems: "center" },
  probLabel: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.xs },
  probValue: { ...typography.heading2, fontFamily: "SpaceGrotesk" },
  probBar: { flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: colors.surface3 },
  probBarFill: { height: "100%" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  metricCard: {
    width: "47%", backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: spacing.sm,
  },
  metricValue: { ...typography.heading3, color: colors.text, fontFamily: "SpaceGrotesk" },
  metricLabel: { ...typography.caption, color: colors.textMuted },
  aiCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: `${colors.brand}30`,
  },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  aiTitle: { ...typography.heading3, color: colors.brand },
  predictionRow: { flexDirection: "row", justifyContent: "space-around" },
  predictionItem: { alignItems: "center" },
  predictionValue: { ...typography.heading2, color: colors.brand, fontFamily: "SpaceGrotesk" },
  predictionLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xxxl,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: spacing.md,
  },
  emptyTitle: { ...typography.heading3, color: colors.text },
  emptyText: { ...typography.caption, color: colors.textMuted },
});
