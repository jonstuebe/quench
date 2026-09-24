import { GlassView } from "expo-glass-effect";
import { Stack, useLocalSearchParams } from "expo-router";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { Fragment } from "react";
import { PlatformColor, ScrollView, Text, View } from "react-native";

import { GhostAxolotl } from "@/components/axolotl/ghost-axolotl";
import { DuskBackdrop } from "@/components/graveyard/dusk-backdrop";
import { Fonts } from "@/constants/theme";
import { useGraveyard } from "@/hooks/use-graveyard";
import {
  daysLabel,
  epitaphFor,
  formatDayLong,
  formatLifespan,
  lifespanSpoken,
} from "@/lib/graveyard/graveyard";

export default function GraveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { graves } = useGraveyard();
  const grave = graves.find((g) => g.id === id);

  if (!grave) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <DuskBackdrop />
        <Text style={{ color: PlatformColor("secondaryLabel") }}>
          This grave couldn’t be found.
        </Text>
      </View>
    );
  }

  const rows: { symbol: SymbolViewProps["name"]; label: string; value: string }[] = [
    { symbol: "sparkles", label: "Hatched", value: formatDayLong(grave.hatchedOn) },
    { symbol: "drop.fill", label: "Last full day", value: formatDayLong(grave.lastCountedDay) },
    { symbol: "moon.zzz.fill", label: "Missed on", value: formatDayLong(grave.diedOn) },
    { symbol: "flame.fill", label: "Days lived", value: daysLabel(grave.streakLength) },
  ];

  return (
    <View style={{ flex: 1 }}>
      <DuskBackdrop />
      <Stack.Screen options={{ title: grave.name }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 18 }}
      >
        <View
          style={{ alignItems: "center", gap: 4 }}
          accessible
          accessibilityLabel={`${grave.name}, lived ${daysLabel(grave.streakLength)}, ${lifespanSpoken(grave.hatchedOn, grave.lastCountedDay)}. ${epitaphFor(grave.id)}`}
        >
          <GhostAxolotl streakLength={grave.streakLength} size={220} float />
          <Text
            style={{
              fontFamily: Fonts.rounded,
              fontSize: 32,
              fontWeight: "800",
              textAlign: "center",
              color: PlatformColor("label"),
            }}
          >
            {grave.name}
          </Text>
          <Text style={{ fontSize: 16, color: PlatformColor("secondaryLabel") }}>
            {formatLifespan(grave.hatchedOn, grave.lastCountedDay)}
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontFamily: Fonts.serif,
              fontStyle: "italic",
              fontSize: 19,
              lineHeight: 26,
              textAlign: "center",
              color: PlatformColor("label"),
              maxWidth: 320,
            }}
          >
            “{epitaphFor(grave.id)}”
          </Text>
        </View>

        <GlassView glassEffectStyle="regular" style={{ borderRadius: 26, paddingHorizontal: 18 }}>
          {rows.map((r, i) => (
            <Fragment key={r.label}>
              {i > 0 ? (
                <View
                  style={{
                    height: 0.5,
                    marginLeft: 34,
                    backgroundColor: PlatformColor("separator"),
                  }}
                />
              ) : null}
              <View
                accessible
                accessibilityLabel={`${r.label}: ${r.value}`}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 }}
              >
                <View style={{ width: 22, alignItems: "center" }}>
                  <SymbolView
                    name={r.symbol}
                    size={17}
                    tintColor={PlatformColor("secondaryLabel")}
                  />
                </View>
                <Text style={{ fontSize: 16, color: PlatformColor("secondaryLabel") }}>
                  {r.label}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    textAlign: "right",
                    fontSize: 16,
                    fontWeight: "600",
                    color: PlatformColor("label"),
                  }}
                >
                  {r.value}
                </Text>
              </View>
            </Fragment>
          ))}
        </GlassView>
      </ScrollView>
    </View>
  );
}
