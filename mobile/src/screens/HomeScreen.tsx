import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "@/styles/theme";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.matchCard}>
            <Text style={styles.matchStatus}>LIVE</Text>
            <Text style={styles.teamName}>India vs Australia</Text>
            <Text style={styles.score}>186/4 (15.2 ov)</Text>
          </View>
          <View style={styles.matchCard}>
            <Text style={styles.matchStatus}>LIVE</Text>
            <Text style={styles.teamName}>England vs South Africa</Text>
            <Text style={styles.score}>245/6 (42.3 ov)</Text>
          </View>
        </ScrollView>
      </View>

      {/* Quick Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="football" size={20} color={colors.brand} />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={20} color={colors.success} />
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Teams</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={20} color={colors.amber} />
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Tournaments</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={20} color={colors.accent} />
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
  },
  greeting: {
    ...typography.caption,
    color: colors.textMuted,
  },
  username: {
    ...typography.heading1,
    color: colors.text,
    fontFamily: "SpaceGrotesk",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
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
  viewAll: {
    ...typography.caption,
    color: colors.brand,
  },
  matchCard: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  matchStatus: {
    ...typography.small,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  teamName: {
    ...typography.body,
    color: colors.text,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  score: {
    ...typography.caption,
    color: colors.textSecondary,
    fontFamily: "JetBrainsMono",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  statCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  statValue: {
    ...typography.heading2,
    color: colors.text,
    marginTop: spacing.sm,
    fontFamily: "SpaceGrotesk",
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  actionCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: spacing.sm,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
});
