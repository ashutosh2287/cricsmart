import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "@/styles/theme";
import { useApi, type Team } from "@/hooks/useApi";

function getTeamColor(name: string): string {
  const hash = name.toLowerCase().split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 50%, 35%)`;
}

export default function TeamDetailScreen({ route }: { route: { params: { teamId: string } } }) {
  const { teamId } = route.params;
  const { data: teamsData, loading, refetch } = useApi<Team[]>("/teams");
  const [refreshing, setRefreshing] = React.useState(false);

  const teams = teamsData ?? [];
  const team = teams.find((t) => t.id === teamId);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading team...</Text>
        </View>
      </View>
    );
  }

  if (!team) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Team not found</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      {/* Team Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: getTeamColor(team.name) }]}>
          <Text style={styles.avatarText}>{team.shortName || team.name.slice(0, 2).toUpperCase()}</Text>
        </View>
        <Text style={styles.teamName}>{team.name}</Text>
        {team.city && (
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={colors.textMuted} />
            <Text style={styles.locationText}>{team.city}</Text>
          </View>
        )}
        <View style={styles.badgeRow}>
          <View style={styles.visibilityBadge}>
            <Ionicons
              name={team.visibility === "PRIVATE" ? "lock-closed" : "globe"}
              size={12}
              color={colors.brand}
            />
            <Text style={styles.visibilityText}>{team.visibility}</Text>
          </View>
          {team._count && (
            <View style={styles.memberBadge}>
              <Ionicons name="people" size={12} color={colors.success} />
              <Text style={styles.memberText}>{team._count.members} members</Text>
            </View>
          )}
        </View>
      </View>

      {/* Team Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Team Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="football" size={20} color={colors.brand} />
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trophy" size={20} color={colors.amber} />
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people" size={20} color={colors.success} />
            <Text style={styles.statValue}>{team._count?.members ?? 0}</Text>
            <Text style={styles.statLabel}>Squad</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={20} color={colors.accent} />
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* Team Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="people" size={16} color={colors.brand} />
            <Text style={styles.infoLabel}>Short Name</Text>
            <Text style={styles.infoValue}>{team.shortName || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={colors.brand} />
            <Text style={styles.infoLabel}>City</Text>
            <Text style={styles.infoValue}>{team.city || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name={team.visibility === "PRIVATE" ? "lock-closed" : "globe"} size={16} color={colors.brand} />
            <Text style={styles.infoLabel}>Visibility</Text>
            <Text style={styles.infoValue}>{team.visibility}</Text>
          </View>
        </View>
      </View>

      {/* Recent Matches */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Matches</Text>
        <View style={styles.emptyCard}>
          <Ionicons name="football-outline" size={32} color={colors.textMuted} />
          <Text style={styles.emptyText}>Match history will appear here</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.xl },
  avatar: {
    width: 96, height: 96, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg,
  },
  avatarText: { ...typography.scoreLarge, color: "#fff", fontFamily: "SpaceGrotesk" },
  teamName: { ...typography.heading1, color: colors.text, fontFamily: "SpaceGrotesk", marginBottom: spacing.sm },
  locationRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.md },
  locationText: { ...typography.caption, color: colors.textMuted },
  badgeRow: { flexDirection: "row", gap: spacing.sm },
  visibilityBadge: {
    flexDirection: "row", alignItems: "center", gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.full,
    backgroundColor: `${colors.brand}15`, borderWidth: 1, borderColor: `${colors.brand}30`,
  },
  visibilityText: { ...typography.small, color: colors.brand, textTransform: "capitalize" },
  memberBadge: {
    flexDirection: "row", alignItems: "center", gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.full,
    backgroundColor: `${colors.success}15`, borderWidth: 1, borderColor: `${colors.success}30`,
  },
  memberText: { ...typography.small, color: colors.success },
  section: { marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  sectionTitle: { ...typography.heading3, color: colors.text, marginBottom: spacing.md },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: {
    width: "47%", backgroundColor: colors.surface, borderRadius: radii.lg,
    padding: spacing.lg, borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: spacing.sm,
  },
  statValue: { ...typography.heading2, color: colors.text, fontFamily: "SpaceGrotesk" },
  statLabel: { ...typography.caption, color: colors.textMuted },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border, gap: spacing.md,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  infoLabel: { ...typography.caption, color: colors.textMuted, width: 80 },
  infoValue: { ...typography.body, color: colors.text, flex: 1 },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xxl,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: spacing.md,
  },
  emptyText: { ...typography.caption, color: colors.textMuted },
  loadingState: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { ...typography.body, color: colors.textMuted },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.md },
  emptyTitle: { ...typography.heading3, color: colors.text },
});
