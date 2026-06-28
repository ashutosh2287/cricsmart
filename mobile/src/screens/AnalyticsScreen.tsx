import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, radii, typography } from "@/styles/theme";

export default function AnalyticsScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      {/* Win Probability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Win Probability</Text>
        <View style={styles.chartPlaceholder}>
          <Ionicons name="bar-chart" size={40} color={colors.brand} />
          <Text style={styles.chartText}>Chart will render here</Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { borderColor: `${colors.success}30` }]}>
            <Text style={styles.metricLabel}>Run Rate</Text>
            <Text style={[styles.metricValue, { color: colors.success }]}>8.42</Text>
          </View>
          <View style={[styles.metricCard, { borderColor: `${colors.brand}30` }]}>
            <Text style={styles.metricLabel}>Required RR</Text>
            <Text style={[styles.metricValue, { color: colors.brand }]}>9.21</Text>
          </View>
          <View style={[styles.metricCard, { borderColor: `${colors.amber}30` }]}>
            <Text style={styles.metricLabel}>Momentum</Text>
            <Text style={[styles.metricValue, { color: colors.amber }]}>Balanced</Text>
          </View>
          <View style={[styles.metricCard, { borderColor: `${colors.danger}30` }]}>
            <Text style={styles.metricLabel}>Pressure</Text>
            <Text style={[styles.metricValue, { color: colors.danger }]}>High</Text>
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
          <Text style={styles.predictionValue}>218</Text>
          <Text style={styles.predictionLabel}>Projected Score</Text>
        </View>
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
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.heading3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  chartPlaceholder: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xxxl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: spacing.md,
  },
  chartText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  metricCard: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  metricValue: {
    ...typography.heading2,
    fontFamily: "SpaceGrotesk",
  },
  aiCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.brand}30`,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  aiTitle: {
    ...typography.heading3,
    color: colors.brand,
  },
  predictionValue: {
    ...typography.scoreDisplay,
    color: colors.brand,
    fontFamily: "SpaceGrotesk",
  },
  predictionLabel: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
