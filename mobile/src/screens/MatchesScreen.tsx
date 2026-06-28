import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "@/styles/theme";

export default function MatchesScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Matches</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={18} color={colors.brand} />
        </TouchableOpacity>
      </View>

      {/* Live Section */}
      <View style={styles.section}>
        <View style={styles.sectionRow}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.sectionTitle}>Live Now</Text>
          </View>
        </View>

        <View style={styles.matchCard}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchType}>T20</Text>
            <Text style={styles.matchStatus}>LIVE</Text>
          </View>
          <Text style={styles.teamName}>India vs Australia</Text>
          <Text style={styles.score}>186/4 (15.2 ov)</Text>
          <Text style={styles.statusText}>India needs 32 runs from 28 balls</Text>
        </View>
      </View>

      {/* Upcoming Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming</Text>

        <View style={styles.matchCard}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchType}>ODI</Text>
          </View>
          <Text style={styles.teamName}>England vs South Africa</Text>
          <Text style={styles.timeText}>Today, 7:30 PM</Text>
        </View>
      </View>

      {/* Recent Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Results</Text>

        <View style={[styles.matchCard, styles.completedCard]}>
          <View style={styles.matchHeader}>
            <Text style={styles.matchType}>T20</Text>
          </View>
          <Text style={styles.teamName}>New Zealand vs Pakistan</Text>
          <Text style={styles.score}>178/5 vs 175/8</Text>
          <Text style={styles.statusText}>New Zealand won by 5 wickets</Text>
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
  title: {
    ...typography.heading1,
    color: colors.text,
    fontFamily: "SpaceGrotesk",
  },
  filterButton: {
    padding: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.text,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  matchCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  completedCard: {
    opacity: 0.8,
  },
  matchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  matchType: {
    ...typography.small,
    color: colors.brand,
    backgroundColor: `${colors.brand}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  matchStatus: {
    ...typography.small,
    color: colors.danger,
    fontWeight: "700",
  },
  teamName: {
    ...typography.heading3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  score: {
    ...typography.body,
    color: colors.textSecondary,
    fontFamily: "JetBrainsMono",
  },
  statusText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  timeText: {
    ...typography.caption,
    color: colors.brand,
    marginTop: spacing.sm,
  },
});
