import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import CaptureScreen from "../screens/CaptureScreen";
import ReviewScreen from "../screens/ReviewScreen";
import HistoryScreen from "../screens/HistoryScreen";
import InvoiceDetailScreen from "../screens/InvoiceDetailScreen";
import type { InvoiceDraft, InvoiceRecord } from "../types/invoice";

export type RootStackParamList = {
  Home: undefined;
  Capture: undefined;
  Review: { draft: InvoiceDraft; imageUri: string };
  History: undefined;
  InvoiceDetail: { record: InvoiceRecord };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Contabilidad" }} />
        <Stack.Screen name="Capture" component={CaptureScreen} options={{ title: "Nueva factura" }} />
        <Stack.Screen name="Review" component={ReviewScreen} options={{ title: "Revisar datos" }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: "Historial" }} />
        <Stack.Screen
          name="InvoiceDetail"
          component={InvoiceDetailScreen}
          options={{ title: "Detalle de factura" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
