import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import { API_BASE_URL } from "../api/client";
import type { InvoiceDraft } from "../types/invoice";

type Props = NativeStackScreenProps<RootStackParamList, "Capture">;

export default function CaptureScreen({ navigation }: Props) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [despertando, setDespertando] = useState(false);
  const avisoTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function tomarFoto() {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso necesario", "Necesitamos acceso a la cámara para fotografiar la factura.");
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!resultado.canceled) {
      setImageUri(resultado.assets[0].uri);
    }
  }

  async function elegirDeGaleria() {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tus fotos para subir la factura.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });
    if (!resultado.canceled) {
      setImageUri(resultado.assets[0].uri);
    }
  }

  async function procesarFactura() {
    if (!imageUri) return;
    setLoading(true);
    setDespertando(false);
    // El servidor gratuito puede "dormirse" tras estar inactivo; si tarda más
    // de lo normal, avisamos para que el usuario no piense que se ha colgado.
    avisoTimeout.current = setTimeout(() => setDespertando(true), 6000);

    try {
      const nombreArchivo = imageUri.split("/").pop() ?? "factura.jpg";
      const extension = nombreArchivo.split(".").pop()?.toLowerCase();
      const tipoMime = extension === "png" ? "image/png" : "image/jpeg";

      // Subida nativa de FileSystem en vez de axios+FormData: en algunos
      // dispositivos/Android, subir un archivo local con fetch/axios da un
      // "Network Error" inmediato sin llegar a tocar el servidor. uploadAsync
      // usa el subsistema nativo de subida de archivos y es mucho más fiable.
      const resultado = await FileSystem.uploadAsync(`${API_BASE_URL}/invoices/extract`, imageUri, {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "archivo",
        mimeType: tipoMime,
        parameters: {},
      });

      if (resultado.status < 200 || resultado.status >= 300) {
        throw new Error(`HTTP ${resultado.status}: ${resultado.body}`);
      }

      const draft: InvoiceDraft = JSON.parse(resultado.body);
      navigation.navigate("Review", { draft, imageUri });
    } catch (error: any) {
      console.error(error);
      Alert.alert(
        "Error al procesar",
        `No se pudo conectar con el servidor o extraer los datos.\n\n${error?.message ?? "Sin detalles adicionales."}`
      );
    } finally {
      if (avisoTimeout.current) clearTimeout(avisoTimeout.current);
      setLoading(false);
      setDespertando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Sin foto seleccionada</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={tomarFoto}>
          <Text style={styles.secondaryButtonText}>📷 Tomar foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={elegirDeGaleria}>
          <Text style={styles.secondaryButtonText}>🖼 Elegir archivo</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, !imageUri && styles.disabledButton]}
        onPress={procesarFactura}
        disabled={!imageUri || loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.primaryButtonText}>Procesar factura</Text>
        )}
      </TouchableOpacity>

      {despertando && (
        <Text style={styles.avisoTexto}>
          El servidor estaba en reposo y está despertando, puede tardar hasta un minuto la primera vez...
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9fafb" },
  preview: { width: "100%", height: 380, borderRadius: 12, backgroundColor: "#e5e7eb", marginBottom: 20 },
  placeholder: {
    width: "100%",
    height: 380,
    borderRadius: 12,
    backgroundColor: "#e5e7eb",
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: { color: "#9ca3af" },
  buttonRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  secondaryButtonText: { color: "#374151", fontWeight: "600" },
  primaryButton: { backgroundColor: "#2563eb", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  disabledButton: { backgroundColor: "#93c5fd" },
  primaryButtonText: { color: "white", fontSize: 16, fontWeight: "700" },
  avisoTexto: { textAlign: "center", color: "#6b7280", fontSize: 13, marginTop: 12 },
});
