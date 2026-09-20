import React, { useState } from "react";
import { ActivityIndicator, Alert, Linking, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import InvoiceForm from "../components/InvoiceForm";
import QuarterBadge from "../components/QuarterBadge";
import { apiClient, pdfUrl } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "InvoiceDetail">;

export default function InvoiceDetailScreen({ route, navigation }: Props) {
  const { record } = route.params;
  const [borrando, setBorrando] = useState(false);

  function confirmarBorrado() {
    Alert.alert(
      "Eliminar factura",
      `¿Seguro que quieres eliminar la factura de ${record.empresa}? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: borrar },
      ]
    );
  }

  async function borrar() {
    setBorrando(true);
    try {
      await apiClient.delete(`/invoices/${record.id}`);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo eliminar la factura.");
    } finally {
      setBorrando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <QuarterBadge trimestre={record.trimestre} />
        <InvoiceForm values={record} editable={false} />
        <TouchableOpacity style={styles.pdfButton} onPress={() => Linking.openURL(pdfUrl(record.id))}>
          <Text style={styles.pdfButtonText}>📄 Abrir PDF original</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={confirmarBorrado} disabled={borrando}>
          {borrando ? <ActivityIndicator color="#dc2626" /> : <Text style={styles.deleteButtonText}>🗑 Eliminar factura</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scroll: { padding: 20, gap: 16 },
  pdfButton: { backgroundColor: "#111827", paddingVertical: 14, borderRadius: 10, alignItems: "center", marginTop: 12 },
  pdfButtonText: { color: "white", fontWeight: "700" },
  deleteButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  deleteButtonText: { color: "#dc2626", fontWeight: "700" },
});
