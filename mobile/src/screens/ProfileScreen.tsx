import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "@/styles/theme";

export default function ProfileScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.section}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>CF</Text>
          </View>
          <Text style={styles.username}>Cricket Fan</Text>
          <Text style={styles.email}>fan@criclens.app</Text>
          <Text style={styles.memberSince}>Member since June 2026</Text>
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
        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]}>
          <Ionicons name="log-out" size={20} color={colors.danger} />
          <Text style={[styles.menuLabel, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.lg,
  },
  title: {
    ...typography.heading1,
    color: colors.text,
    fontFamily: "SpaceGrotesk",
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.brand}20`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  avatarText: {
    ...typography.heading1,
    color: colors.brand,
    fontFamily: "SpaceGrotesk",
  },
  username: {
    ...typography.heading2,
    color: colors.text,
    fontFamily: "SpaceGrotesk",
  },
  email: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  memberSince: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuLabel: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.md,
  },
  logoutItem: {
    borderColor: `${colors.danger}30`,
  },
});
