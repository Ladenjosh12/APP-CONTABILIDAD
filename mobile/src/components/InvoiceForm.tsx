import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export interface InvoiceFormValues {
  fecha: string;
  trimestre: string;
  empresa: string;
  nif: string;
  base_imponible: string;
  descuento: string;
  iva: string;
  total: string;
}

interface Props {
  values: InvoiceFormValues;
  detected?: Partial<Record<keyof InvoiceFormValues, boolean>>;
  editable?: boolean;
  onChange?: (field: keyof InvoiceFormValues, value: string) => void;
}

const LABELS: Record<keyof InvoiceFormValues, string> = {
  empresa: "Empresa",
  nif: "NIF/CIF",
  fecha: "Fecha (AAAA-MM-DD)",
  trimestre: "Trimestre",
  base_imponible: "Base imponible (€)",
  descuento: "Descuento (€)",
  iva: "IVA (€)",
  total: "Total (€)",
};

const FIELD_ORDER: (keyof InvoiceFormValues)[] = [
  "empresa",
  "nif",
  "fecha",
  "trimestre",
  "base_imponible",
  "descuento",
  "iva",
  "total",
];

export default function InvoiceForm({ values, detected, editable = true, onChange }: Props) {
  return (
    <View>
      {FIELD_ORDER.map((field) => {
        const fueDetectado = detected ? detected[field] !== false : true;
        return (
          <View key={field} style={styles.fieldContainer}>
            <Text style={styles.label}>
              {LABELS[field]}
              {!fueDetectado && <Text style={styles.warning}>  ⚠ revisar</Text>}
            </Text>
            <TextInput
              style={[
                styles.input,
                !fueDetectado && styles.inputWarning,
                !editable && styles.inputDisabled,
              ]}
              value={values[field] ?? ""}
              editable={editable}
              onChangeText={(text) => onChange?.(field, text)}
              placeholder={LABELS[field]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 4, color: "#374151" },
  warning: { color: "#dc2626", fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "white",
  },
  inputWarning: { borderColor: "#dc2626", backgroundColor: "#fef2f2" },
  inputDisabled: { backgroundColor: "#f3f4f6", color: "#6b7280" },
});
