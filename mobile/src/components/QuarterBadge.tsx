import React from "react";
import { StyleSheet, Text, View } from "react-native";

const COLORS: Record<string, string> = {
  T1: "#2563eb",
  T2: "#16a34a",
  T3: "#d97706",
  T4: "#dc2626",
};

export default function QuarterBadge({ trimestre }: { trimestre: string }) {
  const color = COLORS[trimestre] ?? "#6b7280";
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{trimestre}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  text: {
    color: "white",
    fontWeight: "600",
    fontSize: 12,
  },
});
