import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  NOTIFICATION_INTERVALS,
  type EntryIncrementFlOz,
  type VolumeDisplayUnit,
} from "@/lib/types";
import { prefs$ } from "@/lib/prefs";
import { scheduleNextReminder, setupNotifications } from "@/lib/notifications";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useValue } from "@legendapp/state/react";

const UNITS: VolumeDisplayUnit[] = ["fl-oz", "ml", "cup", "pt_us"];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const router = useRouter();

  const name = useValue(prefs$.name);
  const unit = useValue(prefs$.unit);
  const inc = useValue(prefs$.entryIncrementFlOz);
  const wake = useValue(prefs$.wakeUp);
  const bed = useValue(prefs$.bedtime);
  const reminder = useValue(prefs$.reminderMinutes);

  const reschedule = useCallback(async () => {
    const m = prefs$.reminderMinutes.get();
    if (m == null) return;
    await setupNotifications();
    await scheduleNextReminder({
      wakeUp: prefs$.wakeUp.get(),
      bedtime: prefs$.bedtime.get(),
      intervalMinutes: m,
      afterLogAt: new Date(),
    });
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ThemedText style={styles.label}>Name</ThemedText>
        <TextInput
          value={name}
          onChangeText={(t) => prefs$.name.set(t)}
          placeholder="Name"
          placeholderTextColor={colors.icon}
          style={[styles.input, { color: colors.text, borderColor: colors.icon }]}
        />

        <ThemedText style={styles.label}>Volume unit</ThemedText>
        <View style={styles.chips}>
          {UNITS.map((u) => (
            <Pressable
              key={u}
              onPress={() => prefs$.unit.set(u)}
              style={[
                styles.chip,
                {
                  borderColor: unit === u ? colors.tint : colors.icon,
                  backgroundColor: unit === u ? `${colors.tint}22` : "transparent",
                },
              ]}
            >
              <ThemedText>{u}</ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.label}>Log increment (internal fl oz)</ThemedText>
        <View style={styles.row}>
          {([4, 5] as const).map((n) => (
            <Pressable
              key={n}
              onPress={() => prefs$.entryIncrementFlOz.set(n as EntryIncrementFlOz)}
              style={[
                styles.chip,
                {
                  borderColor: inc === n ? colors.tint : colors.icon,
                  backgroundColor: inc === n ? `${colors.tint}22` : "transparent",
                },
              ]}
            >
              <ThemedText>{n} fl oz steps</ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.label}>Wake & bedtime (reminder window)</ThemedText>
        <ThemedText type="subtitle" style={styles.hint}>
          Wake {wake.hour}:{wake.minute.toString().padStart(2, "0")} · Bed {bed.hour}:
          {bed.minute.toString().padStart(2, "0")}
        </ThemedText>
        <ThemedText style={styles.caption}>
          Edit wake/bedtime in a future update; onboarding values apply for now.
        </ThemedText>

        <ThemedText style={styles.label}>Reminder after logging</ThemedText>
        <View style={styles.chips}>
          <Pressable
            onPress={async () => {
              prefs$.reminderMinutes.set(undefined);
            }}
            style={[
              styles.chip,
              {
                borderColor: reminder == null ? colors.tint : colors.icon,
                backgroundColor: reminder == null ? `${colors.tint}22` : "transparent",
              },
            ]}
          >
            <ThemedText>Off</ThemedText>
          </Pressable>
          {NOTIFICATION_INTERVALS.map((m) => (
            <Pressable
              key={m}
              onPress={async () => {
                prefs$.reminderMinutes.set(m);
                await reschedule();
              }}
              style={[
                styles.chip,
                {
                  borderColor: reminder === m ? colors.tint : colors.icon,
                  backgroundColor: reminder === m ? `${colors.tint}22` : "transparent",
                },
              ]}
            >
              <ThemedText>{m} min</ThemedText>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.link, { borderColor: colors.icon }]}
          onPress={() => router.back()}
        >
          <ThemedText style={{ color: colors.tint }}>Done</ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  label: { marginTop: 16, marginBottom: 8, fontSize: 15, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 17,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  row: { flexDirection: "row", gap: 8 },
  hint: { fontSize: 15, marginBottom: 4 },
  caption: { fontSize: 13, opacity: 0.65, marginBottom: 8 },
  link: {
    marginTop: 24,
    padding: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
});
