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
import { useApi, type Player } from "@/hooks/useApi";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getColor(name: string): string {
  const hash = name.toLowerCase().split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 45%, 35%)`;
}

export default function PlayerDetailScreen({ route }: { route: { params: { playerId: string } } }) {
  const { playerId } = route.params;
  const { data: playersData, loading, refetch } = useApi<Player[]>("/player-profiles");
  const [refreshing, setRefreshing] = React.useState(false);

  const players = playersData ?? [];
  const player = players.find((p) => p.id === playerId);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading player...</Text>
        </View>
      </View>
    );
  }

  if (!player) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="person-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Player not found</Text>
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
      {/* Player Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: getColor(player.displayName) }]}>
          <Text style={styles.avatarText}>{getInitials(player.displayName)}</Text>
        </View>
        <Text style={styles.playerName}>{player.displayName}</Text>
        {player.role && (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{player.role}</Text>
          </View>
        )}
      </View>

      {/* Stats Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Career Stats</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="football" size={20} color={colors.success} />
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={20} color={colors.brand} />
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Runs</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="target" size={20} color={colors.danger} />
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Wickets</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="speedometer" size={20} color={colors.amber} />
            <Text style={styles.statValue}>--</Text>
            <Text style={styles.statLabel}>Avg</Text>
          </View>
        </View>
      </View>

      {/* Role Info */}
      <View style={styles.section}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="person" size={16} color={colors.brand} />
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{player.role || "All-rounder"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="star" size={16} color={colors.amber} />
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>Active</Text>
          </View>
        </View>
      </View>

      {/* Recent Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Form</Text>
        <View style={styles.formCard}>
          <View style={styles.formRow}>
            {["W", "4", "6", "1", "0", "2", "6", "4", "W", "1"].map((ball, i) => (
              <View
                key={i}
                style={[
                  styles.formBall,
                  ball === "W" && styles.formBallWicket,
                  (ball === "4" || ball === "6") && styles.formBallBoundary,
                ]}
              >
                <Text style={[
                  styles.formBallText,
                  ball === "W" && styles.formBallTextWicket,
                  (ball === "4" || ball === "6") && styles.formBallTextBoundary,
                ]}>
                  {ball}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.formNote}>Sample recent performance data</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.xl },
  avatar: {
    width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg,
  },
  avatarText: { ...typography.scoreLarge, color: "#fff", fontFamily: "SpaceGrotesk" },
  playerName: { ...typography.heading1, color: colors.text, fontFamily: "SpaceGrotesk", marginBottom: spacing.sm },
  roleBadge: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.full,
    backgroundColor: `${colors.brand}15`, borderWidth: 1, borderColor: `${colors.brand}30`,
  },
  roleText: { ...typography.small, color: colors.brand, textTransform: "capitalize" },
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
  infoLabel: { ...typography.caption, color: colors.textMuted, width: 60 },
  infoValue: { ...typography.body, color: colors.text, flex: 1 },
  formCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  formRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" },
  formBall: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface3,
    alignItems: "center", justifyContent: "center",
  },
  formBallText: { ...typography.small, color: colors.textMuted },
  formBallWicket: { backgroundColor: `${colors.danger}20` },
  formBallTextWicket: { color: colors.danger },
  formBallBoundary: { backgroundColor: `${colors.success}20` },
  formBallTextBoundary: { color: colors.success },
  formNote: { ...typography.caption, color: colors.textMuted, textAlign: "center", marginTop: spacing.md },
  loadingState: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { ...typography.body, color: colors.textMuted },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.md },
  emptyTitle: { ...typography.heading3, color: colors.text },
});
