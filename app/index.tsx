import { Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { View } from "react-native";

import { useAppGate } from "@/hooks/use-app-gate";

void SplashScreen.preventAutoHideAsync();

export default function GateScreen() {
  const { ready, showUnsupported, showOnboarding, showMain } = useAppGate();

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return <View style={{ flex: 1 }} />;
  }
  if (showUnsupported) {
    return <Redirect href="/device-not-supported" />;
  }
  if (showOnboarding) {
    return <Redirect href="/onboarding" />;
  }
  if (showMain) {
    return <Redirect href="/home" />;
  }
  return <View style={{ flex: 1 }} />;
}
