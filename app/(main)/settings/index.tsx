import { useColorScheme } from "@/hooks/use-color-scheme";
import { scheduleNextReminder, setupNotifications } from "@/lib/notifications";
import { prefs$ } from "@/lib/prefs";
import type { VolumeDisplayUnit } from "@/lib/types";
import { formatVolumeLabel } from "@/lib/volume";
import { DatePicker, Divider, Host, Picker, Text as SText, VStack } from "@expo/ui/swift-ui";
import { controlSize, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { useCallback, useMemo } from "react";
import { Platform, PlatformColor, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useValue } from "@legendapp/state/react";

import { SectionHeader, styles, timePartsToDate } from "@/components/settings-layout";

const UNITS: VolumeDisplayUnit[] = ["fl-oz", "ml", "cup", "pt_us"];

export default function SettingsGeneralScreen() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const pageBg = PlatformColor("systemGroupedBackground");
  const groupBg = PlatformColor("secondarySystemGroupedBackground");
  const secondaryLabel = PlatformColor("secondaryLabel");

  const unit = useValue(prefs$.unit);
  const wake = useValue(prefs$.wakeUp);
  const bed = useValue(prefs$.bedtime);

  const wakeDate = useMemo(() => timePartsToDate(wake.hour, wake.minute), [wake.hour, wake.minute]);
  const bedDate = useMemo(() => timePartsToDate(bed.hour, bed.minute), [bed.hour, bed.minute]);

  const rescheduleRemindersIfNeeded = useCallback(async () => {
    const m = prefs$.reminderMinutes.get();
    if (m == null || prefs$.remindersEnabled.get() === false) return;
    await setupNotifications();
    await scheduleNextReminder({
      wakeUp: prefs$.wakeUp.get(),
      bedtime: prefs$.bedtime.get(),
      intervalMinutes: m,
      afterLogAt: new Date(),
    });
  }, []);

  return (
    <ScrollView
      style={[styles.safe, { backgroundColor: pageBg }]}
      contentInsetAdjustmentBehavior={Platform.OS === "ios" ? "never" : undefined}
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

      <SectionHeader color={secondaryLabel}>Wake & bedtime</SectionHeader>
      <Text style={[styles.sectionCaption, { color: secondaryLabel }]}>
        Used for follow-up reminder windows after you log water.
      </Text>
      <View style={[styles.group, { backgroundColor: groupBg }]}>
        <View style={styles.groupInnerTight}>
          <Host matchContents colorScheme={colorScheme} style={styles.hostFill}>
            <VStack spacing={10} alignment="leading">
              <DatePicker
                title="Wake up"
                selection={wakeDate}
                displayedComponents={["hourAndMinute"]}
                onDateChange={(d) => {
                  prefs$.wakeUp.set({ hour: d.getHours(), minute: d.getMinutes() });
                  void rescheduleRemindersIfNeeded();
                }}
              />
              <Divider />
              <DatePicker
                title="Bedtime"
                selection={bedDate}
                displayedComponents={["hourAndMinute"]}
                onDateChange={(d) => {
                  prefs$.bedtime.set({ hour: d.getHours(), minute: d.getMinutes() });
                  void rescheduleRemindersIfNeeded();
                }}
              />
            </VStack>
          </Host>
        </View>
      </View>
    </ScrollView>
  );
}
