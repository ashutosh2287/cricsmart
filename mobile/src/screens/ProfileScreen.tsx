import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "@/styles/theme";
import { useApi } from "@/hooks/useApi";

type UserData = {
  username: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
};

type StatsData = {
  ownedTeams: number;
  matchesHosted: number;
  tournamentsOrganized: number;
};

export default function ProfileScreen() {
  const { data: userData } = useApi<UserData>("/auth/me");
  const { data: statsData } = useApi<StatsData>("/account/stats");

  const user = userData ?? { username: "Guest", email: "", avatarUrl: null, role: "public", createdAt: new Date().toISOString() };
  const stats = statsData ?? { ownedTeams: 0, matchesHosted: 0, tournamentsOrganized: 0 };

  const getInitials = (name: string) => name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.section}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user.username)}</Text>
          </View>
          <Text style={styles.username}>{user.username}</Text>
          {user.email ? <Text style={styles.email}>{user.email}</Text> : null}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
          <Text style={styles.memberSince}>
            Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.matchesHosted}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.ownedTeams}</Text>
            <Text style={styles.statLabel}>Teams</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.tournamentsOrganized}</Text>
            <Text style={styles.statLabel}>Tournaments</Text>
          </View>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="person" size={20} color={colors.brand} />
          <Text style={styles.menuLabel}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings" size={20} color={colors.textMuted} />
          <Text style={styles.menuLabel}>Settings</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications" size={20} color={colors.amber} />
          <Text style={styles.menuLabel}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="moon" size={20} color={colors.accent} />
          <Text style={styles.menuLabel}>Appearance</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.menuItem, styles.logoutItem]}
          onPress={() => Alert.alert("Logout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            { text: "Logout", style: "destructive" },
          ])}
        >
          <Ionicons name="log-out" size={20} color={colors.danger} />
          <Text style={[styles.menuLabel, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.lg },
  title: { ...typography.heading1, color: colors.text, fontFamily: "SpaceGrotesk" },
  section: { marginBottom: spacing.lg, paddingHorizontal: spacing.lg },
  profileCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xxl,
    borderWidth: 1, borderColor: colors.border, alignItems: "center",
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: `${colors.brand}20`,
    alignItems: "center", justifyContent: "center", marginBottom: spacing.lg,
  },
  avatarText: { ...typography.heading1, color: colors.brand, fontFamily: "SpaceGrotesk" },
  username: { ...typography.heading2, color: colors.text, fontFamily: "SpaceGrotesk" },
  email: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  roleBadge: {
    marginTop: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radii.full, backgroundColor: `${colors.brand}15`, borderWidth: 1, borderColor: `${colors.brand}30`,
  },
  roleText: { ...typography.small, color: colors.brand, textTransform: "capitalize" },
  memberSince: { ...typography.small, color: colors.textMuted, marginTop: spacing.sm },
  statsRow: { flexDirection: "row", justifyContent: "space-around", backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  statItem: { alignItems: "center" },
  statValue: { ...typography.heading2, color: colors.brand, fontFamily: "SpaceGrotesk" },
  statLabel: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  menuItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
    borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border,
  },
  menuLabel: { flex: 1, ...typography.body, color: colors.text, marginLeft: spacing.md },
  logoutItem: { borderColor: `${colors.danger}30` },
});
