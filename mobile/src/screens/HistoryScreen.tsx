import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { apiClient, excelExportUrl } from "../api/client";
import QuarterBadge from "../components/QuarterBadge";
import type { InvoiceRecord } from "../types/invoice";

type Props = NativeStackScreenProps<RootStackParamList, "History">;

const TRIMESTRES = ["T1", "T2", "T3", "T4"];

export default function HistoryScreen({ navigation }: Props) {
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = useState(String(anioActual));
  const [trimestre, setTrimestre] = useState(`T${Math.floor(new Date().getMonth() / 3) + 1}`);
  const [registros, setRegistros] = useState<InvoiceRecord[]>([]);
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async () => {
    const anioNumero = Number(anio);
    if (!anioNumero) return;
    setCargando(true);
    try {
      const respuesta = await apiClient.get<InvoiceRecord[]>("/invoices", {
        params: { anio: anioNumero, trimestre },
      });
      setRegistros(respuesta.data);
    } catch (error) {
      console.error(error);
      setRegistros([]);
    } finally {
      setCargando(false);
    }
  }, [anio, trimestre]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filtros}>
        <TextInput
          style={styles.anioInput}
          value={anio}
          onChangeText={setAnio}
          keyboardType="number-pad"
          maxLength={4}
        />
        <View style={styles.trimestreRow}>
          {TRIMESTRES.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.trimestreChip, trimestre === t && styles.trimestreChipActive]}
              onPress={() => setTrimestre(t)}
            >
              <Text style={[styles.trimestreChipText, trimestre === t && styles.trimestreChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => Linking.openURL(excelExportUrl(Number(anio) || undefined))}
        >
          <Text style={styles.exportButtonText}>📊 Descargar Excel de {anio}</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={registros}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No hay facturas guardadas en {anio} {trimestre}.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("InvoiceDetail", { record: item })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardEmpresa}>{item.empresa}</Text>
                <QuarterBadge trimestre={item.trimestre} />
              </View>
              <Text style={styles.cardDetalle}>
                {item.fecha} · NIF {item.nif}
              </Text>
              <Text style={styles.cardTotal}>Total: {item.total} €</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  filtros: { padding: 16, gap: 10 },
  anioInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 100,
    backgroundColor: "white",
  },
  trimestreRow: { flexDirection: "row", gap: 8 },
  trimestreChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: "#d1d5db" },
  trimestreChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  trimestreChipText: { color: "#374151", fontWeight: "600" },
  trimestreChipTextActive: { color: "white" },
  exportButton: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: "#111827",
  },
  exportButtonText: { color: "white", fontWeight: "600", fontSize: 13 },
  loader: { marginTop: 40 },
  list: { padding: 16, gap: 10 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
  card: { backgroundColor: "white", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardEmpresa: { fontSize: 16, fontWeight: "700", color: "#111827" },
  cardDetalle: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  cardTotal: { fontSize: 14, fontWeight: "600", color: "#111827" },
});
