import React, { useState } from "react";
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { apiClient } from "../api/client";
import InvoiceForm, { InvoiceFormValues } from "../components/InvoiceForm";
import type { InvoiceConfirm, InvoiceRecord } from "../types/invoice";

type Props = NativeStackScreenProps<RootStackParamList, "Review">;

export default function ReviewScreen({ route, navigation }: Props) {
  const { draft } = route.params;

  const [values, setValues] = useState<InvoiceFormValues>({
    fecha: draft.fecha ?? "",
    trimestre: draft.trimestre ?? "",
    empresa: draft.empresa ?? "",
    nif: draft.nif ?? "",
    base_imponible: draft.base_imponible ?? "",
    descuento: draft.descuento ?? "0.00",
    iva: draft.iva ?? "",
    total: draft.total ?? "",
  });
  const [guardando, setGuardando] = useState(false);

  function actualizarCampo(campo: keyof InvoiceFormValues, valor: string) {
    setValues((prev) => {
      const siguiente = { ...prev, [campo]: valor };
      if (campo === "fecha") {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
        if (match) {
          const mes = parseInt(match[2], 10);
          siguiente.trimestre = `T${Math.floor((mes - 1) / 3) + 1}`;
        }
      }
      return siguiente;
    });
  }

  async function guardar() {
    const requeridos: (keyof InvoiceFormValues)[] = ["fecha", "empresa", "nif", "base_imponible", "iva", "total"];
    const faltantes = requeridos.filter((campo) => !values[campo]?.trim());
    if (faltantes.length > 0) {
      Alert.alert("Faltan datos", `Completa estos campos antes de guardar: ${faltantes.join(", ")}`);
      return;
    }

    setGuardando(true);
    try {
      const payload: InvoiceConfirm = {
        ...values,
        descuento: values.descuento || "0.00",
        upload_token: draft.upload_token,
      };
      await apiClient.post<InvoiceRecord>("/invoices", payload);
      Alert.alert("Guardado", "La factura se guardó correctamente.", [
        { text: "OK", onPress: () => navigation.navigate("History") },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert("Error al guardar", "No se pudo guardar la factura. Inténtalo de nuevo.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.hint}>
          Revisa los datos extraídos. Los campos marcados con ⚠ no se detectaron automáticamente:
          complétalos a mano antes de guardar.
        </Text>
        <InvoiceForm values={values} detected={draft.campos_detectados} onChange={actualizarCampo} />
        <TouchableOpacity style={styles.saveButton} onPress={guardar} disabled={guardando}>
          {guardando ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.saveButtonText}>Confirmar y guardar</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  scroll: { padding: 20 },
  hint: { fontSize: 13, color: "#6b7280", marginBottom: 16 },
  saveButton: { backgroundColor: "#16a34a", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
});
