import React from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "@/styles/theme";

export default function PlayersScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
          placeholder="Search players or teams..."
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* Player Cards */}
      <View style={styles.section}>
        <View style={styles.playerCard}>
          <View style={styles.playerAvatar}>
            <Text style={styles.playerInitials}>VK</Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>Virat Kohli</Text>
            <Text style={styles.playerTeam}>India</Text>
            <Text style={styles.playerRole}>Batsman</Text>
          </View>
        </View>

        <View style={styles.playerCard}>
          <View style={styles.playerAvatar}>
            <Text style={styles.playerInitials}>JB</Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>Jasprit Bumrah</Text>
            <Text style={styles.playerTeam}>India</Text>
            <Text style={styles.playerRole}>Bowler</Text>
          </View>
        </View>

        <View style={styles.playerCard}>
          <View style={styles.playerAvatar}>
            <Text style={styles.playerInitials}>SP</Text>
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>Steve Smith</Text>
            <Text style={styles.playerTeam}>Australia</Text>
            <Text style={styles.playerRole}>Batsman</Text>
          </View>
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
  discoverButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderMed,
  },
  discoverText: {
    ...typography.caption,
    color: colors.brand,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface2,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  section: {
    paddingHorizontal: spacing.lg,
  },
  playerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  playerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
  playerInitials: {
    ...typography.heading3,
    color: colors.brand,
  },
  playerInfo: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  playerName: {
    ...typography.heading3,
    color: colors.text,
  },
  playerTeam: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  playerRole: {
    ...typography.small,
    color: colors.brand,
    backgroundColor: `${colors.brand}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    overflow: "hidden",
    alignSelf: "flex-start",
    marginTop: spacing.sm,
  },
});
