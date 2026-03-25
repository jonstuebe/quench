import { useColorScheme } from "@/hooks/use-color-scheme";
import { scheduleNextReminder, setupNotifications } from "@/lib/notifications";
import { prefs$ } from "@/lib/prefs";
import type { VolumeDisplayUnit } from "@/lib/types";
import { formatVolumeLabel } from "@/lib/volume";
import { DatePicker, Divider, Host, Picker, Text as SText, VStack } from "@expo/ui/swift-ui";
import { controlSize, pickerStyle, tag } from "@expo/ui/swift-ui/modifiers";
import { useCallback, useMemo } from "react";
import { PlatformColor, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useValue } from "@legendapp/state/react";

import { SectionHeader, timePartsToDate } from "@/components/settings-layout";

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
      style={[{ flex: 1 }, { backgroundColor: pageBg }]}
      contentInsetAdjustmentBehavior="never"
      contentContainerStyle={[
        {
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 40,
        },
        { paddingBottom: Math.max(40, insets.bottom + 72) },
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <SectionHeader color={secondaryLabel} first>
        Volume unit
      </SectionHeader>
      <View style={{ marginBottom: 4 }}>
        <Host
          matchContents
          colorScheme={colorScheme}
          style={{ width: "100%", alignSelf: "stretch" }}
        >
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
      <Text
        style={[
          {
            fontSize: 13,
            lineHeight: 18,
            marginTop: 2,
            marginBottom: 16,
          },
          { color: secondaryLabel },
        ]}
      >
        Used for follow-up reminder windows after you log water.
      </Text>
      <View
        style={[
          {
            borderRadius: 10,
            overflow: "hidden",
          },
          { backgroundColor: groupBg },
        ]}
      >
        <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
          <Host
            matchContents
            colorScheme={colorScheme}
            style={{ width: "100%", alignSelf: "stretch" }}
          >
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
