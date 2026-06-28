import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "@/styles/theme";
import { usePlayers, type Player } from "@/hooks/useApi";

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getColor(name: string): string {
  const hash = name.toLowerCase().split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 45%, 35%)`;
}

export default function PlayersScreen() {
  const { data: playersData, loading, refetch } = usePlayers();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const players = playersData ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return players;
    const q = search.toLowerCase();
    return players.filter(
      (p) => p.displayName.toLowerCase().includes(q) || (p.role ?? "").toLowerCase().includes(q)
    );
  }, [players, search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Players</Text>
        <TouchableOpacity style={styles.discoverButton}>
          <Ionicons name="search" size={18} color={colors.brand} />
          <Text style={styles.discoverText}>Discover</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search players..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Player List */}
      <View style={styles.section}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={styles.loadingCard}>
              <View style={styles.loadingAvatar} />
              <View style={styles.loadingInfo}>
                <View style={styles.loadingLine} />
                <View style={[styles.loadingLine, { width: 80 }]} />
              </View>
            </View>
          ))
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={32} color={colors.textMuted} />
            <Text style={styles.emptyText}>{search ? "No players match your search" : "No players yet"}</Text>
          </View>
        ) : (
          filtered.map((player) => (
            <TouchableOpacity key={player.id} style={styles.playerCard}>
              <View style={[styles.playerAvatar, { backgroundColor: getColor(player.displayName) }]}>
                <Text style={styles.playerInitials}>{getInitials(player.displayName)}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{player.displayName}</Text>
                {player.role && (
                  <Text style={styles.playerRole}>{player.role}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl, paddingBottom: spacing.lg,
  },
  title: { ...typography.heading1, color: colors.text, fontFamily: "SpaceGrotesk" },
  discoverButton: {
    flexDirection: "row", alignItems: "center", gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderMed,
  },
  discoverText: { ...typography.caption, color: colors.brand, fontWeight: "600" },
  searchContainer: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surface2,
    borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border,
  },
  searchInput: { flex: 1, marginLeft: spacing.sm, ...typography.body, color: colors.text },
  section: { paddingHorizontal: spacing.lg },
  playerCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
    borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  playerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  playerInitials: { ...typography.heading3, color: "#fff" },
  playerInfo: { marginLeft: spacing.md, flex: 1 },
  playerName: { ...typography.heading3, color: colors.text },
  playerRole: {
    ...typography.small, color: colors.brand, backgroundColor: `${colors.brand}20`,
    paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm,
    overflow: "hidden", alignSelf: "flex-start", marginTop: spacing.sm,
  },
  loadingCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: colors.surface,
    borderRadius: radii.lg, padding: spacing.lg, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border,
  },
  loadingAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface3 },
  loadingInfo: { marginLeft: spacing.md, gap: spacing.sm },
  loadingLine: { height: 12, width: 120, borderRadius: 6, backgroundColor: colors.surface3 },
  emptyCard: {
    backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.xxl,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", gap: spacing.md,
  },
  emptyText: { ...typography.caption, color: colors.textMuted },
});
