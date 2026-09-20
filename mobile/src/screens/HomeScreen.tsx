import React from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Contabilidad de facturas</Text>
      <Text style={styles.subtitle}>
        Captura facturas, extrae los datos automáticamente y llévalas organizadas por trimestre.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Capture")}>
        <Text style={styles.primaryButtonText}>+ Nueva factura</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("History")}>
        <Text style={styles.secondaryButtonText}>Ver historial</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#f9fafb" },
  title: { fontSize: 26, fontWeight: "700", color: "#111827", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#6b7280", marginBottom: 32 },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  secondaryButtonText: { color: "#374151", fontSize: 16, fontWeight: "600" },
});
