import { useColorScheme } from "@/hooks/use-color-scheme";
import { prefs$ } from "@/lib/prefs";
import type { VolumeDisplayUnit } from "@/lib/types";
import { formatVolumeLabel } from "@/lib/volume";
import { Host, Picker, Text as SText } from "@expo/ui/swift-ui";
import { controlSize, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { PlatformColor, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useValue } from "@legendapp/state/react";

import { SectionHeader, styles } from "./settings-shared";

const UNITS: VolumeDisplayUnit[] = ["fl-oz", "ml", "cup", "pt_us"];

export default function SettingsGeneralScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const pageBg = PlatformColor("systemGroupedBackground");
  const secondaryLabel = PlatformColor("secondaryLabel");

  const unit = useValue(prefs$.unit);

  return (
    <ScrollView
      style={[styles.safe, { backgroundColor: pageBg }]}
      contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(40, insets.bottom + 72) }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <SectionHeader color={secondaryLabel} first>
        Volume unit
      </SectionHeader>
      <View style={styles.controlBlock}>
        <Host matchContents colorScheme={colorScheme} style={styles.hostFill}>
          <Picker
            selection={unit}
            onSelectionChange={(s) => prefs$.unit.set(s as VolumeDisplayUnit)}
            modifiers={[controlSize("large"), pickerStyle("segmented")]}
          >
            {UNITS.map((u) => (
              <SText key={u} modifiers={[tag(u)]}>
                {formatVolumeLabel(u)}
              </SText>
            ))}
          </Picker>
        </Host>
      </View>
    </ScrollView>
  );
}
