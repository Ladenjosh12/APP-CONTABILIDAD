import React from "react";
import { Linking, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import InvoiceForm from "../components/InvoiceForm";
import QuarterBadge from "../components/QuarterBadge";
import { pdfUrl } from "../api/client";

type Props = NativeStackScreenProps<RootStackParamList, "InvoiceDetail">;

export default function InvoiceDetailScreen({ route }: Props) {
  const { record } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <QuarterBadge trimestre={record.trimestre} />
        <InvoiceForm values={record} editable={false} />
        <TouchableOpacity style={styles.pdfButton} onPress={() => Linking.openURL(pdfUrl(record.id))}>
          <Text style={styles.pdfButtonText}>📄 Abrir PDF original</Text>
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
});
