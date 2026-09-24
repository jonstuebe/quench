import { GlassContainer, GlassView } from "expo-glass-effect";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback } from "react";
import { FlatList, PlatformColor, Pressable, Text, View } from "react-native";

import { DuskBackdrop } from "@/components/graveyard/dusk-backdrop";
import { GraveRow } from "@/components/graveyard/grave-row";
import { Fonts } from "@/constants/theme";
import { useGraveyard } from "@/hooks/use-graveyard";
import {
  daysLabel,
  graveyardStats,
  longestStreakHolder,
  type LivingPetSummary,
} from "@/lib/graveyard/graveyard";
import type { Grave } from "@/lib/streak/evaluate";

const GOLD = "#E8A93B";

export default function GraveyardScreen() {
  const { graves, longest, pet } = useGraveyard();
  const open = useCallback((id: string) => {
    router.push({ pathname: "/graveyard/[id]", params: { id } });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <DuskBackdrop />
      <FlatList
        data={graves}
        keyExtractor={(g) => g.id}
        renderItem={({ item }) => <GraveRow grave={item} onPress={open} />}
        ItemSeparatorComponent={Gap}
        ListHeaderComponent={<Header graves={graves} longest={longest} pet={pet} />}
        ListEmptyComponent={EmptyMeadow}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 }}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}

const Gap = () => <View style={{ height: 10 }} />;

function Header({
  graves,
  longest,
  pet,
}: {
  graves: Grave[];
  longest: number;
  pet: LivingPetSummary | null;
}) {
  const holder = longestStreakHolder(longest, graves, pet);
  const stats = graveyardStats(graves, pet);
  const holderLine = holder
    ? holder.alive
      ? `Held by ${holder.name}`
      : `Held by ${holder.name}`
    : "Meet your goal to start one";

  return (
    <View style={{ gap: 12, marginBottom: graves.length ? 22 : 0 }}>
      <GlassView
        glassEffectStyle="regular"
        style={{
          borderRadius: 30,
          padding: 18,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
        }}
        accessible
        accessibilityLabel={`Longest streak: ${daysLabel(longest)}. ${holderLine}`}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(232,169,59,0.16)",
          }}
        >
          <SymbolView name="trophy.fill" size={26} tintColor={GOLD} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{ fontSize: 14, fontWeight: "600", color: PlatformColor("secondaryLabel") }}
            maxFontSizeMultiplier={1.6}
          >
            Longest streak
          </Text>
          <Text
            style={{
              fontFamily: Fonts.rounded,
              fontSize: 34,
              fontWeight: "800",
              fontVariant: ["tabular-nums"],
              color: PlatformColor("label"),
            }}
            maxFontSizeMultiplier={1.4}
          >
            {daysLabel(longest)}
          </Text>
          <Text
            style={{ fontSize: 14, color: PlatformColor("secondaryLabel") }}
            maxFontSizeMultiplier={1.6}
          >
            {holderLine}
          </Text>
        </View>
      </GlassView>

      {graves.length ? (
        <GlassContainer spacing={10} style={{ flexDirection: "row", gap: 10 }}>
          <Stat
            symbol="leaf.fill"
            value={String(stats.lost)}
            label={stats.lost === 1 ? "axolotl lost" : "axolotls lost"}
          />
          <Stat
            symbol="calendar"
            value={stats.totalDays.toLocaleString()}
            label="days, all lives"
          />
        </GlassContainer>
      ) : null}

      {pet ? (
        <Pressable
          onPress={() => router.navigate("/home")}
          accessibilityRole="link"
          accessibilityLabel={`${pet.name} is still going, day ${pet.streakLength}. Go to Home`}
          style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 6 }}
        >
          <SymbolView name="flame.fill" size={14} tintColor="#FF8A3D" />
          <Text
            style={{ flexShrink: 1, fontSize: 14, color: PlatformColor("secondaryLabel") }}
            maxFontSizeMultiplier={1.8}
          >
            {pet.name} is still going — Day {pet.streakLength}
          </Text>
          <SymbolView name="chevron.right" size={11} tintColor={PlatformColor("tertiaryLabel")} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Stat({
  symbol,
  value,
  label,
}: {
  symbol: "leaf.fill" | "calendar";
  value: string;
  label: string;
}) {
  return (
    <GlassView
      glassEffectStyle="regular"
      style={{ flex: 1, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 12, gap: 2 }}
      accessible
      accessibilityLabel={`${value} ${label}`}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <SymbolView name={symbol} size={14} tintColor={PlatformColor("secondaryLabel")} />
        <Text
          style={{
            fontFamily: Fonts.rounded,
            fontSize: 22,
            fontWeight: "700",
            fontVariant: ["tabular-nums"],
            color: PlatformColor("label"),
          }}
          maxFontSizeMultiplier={1.5}
        >
          {value}
        </Text>
      </View>
      <Text
        style={{ fontSize: 13, color: PlatformColor("secondaryLabel") }}
        maxFontSizeMultiplier={1.8}
      >
        {label}
      </Text>
    </GlassView>
  );
}

function EmptyMeadow() {
  return (
    <View
      style={{ alignItems: "center", gap: 10, paddingTop: 72, paddingHorizontal: 24 }}
      accessible
      accessibilityLabel="No axolotls here yet. Keep your streak alive and this place stays empty."
    >
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, marginBottom: 6 }}>
        <SymbolView
          name="leaf.fill"
          size={26}
          tintColor="#8CC98A"
          style={{ transform: [{ rotate: "-20deg" }] }}
        />
        <SymbolView name="camera.macro" size={44} tintColor="#E58FB0" />
        <SymbolView
          name="leaf.fill"
          size={32}
          tintColor="#6FB36D"
          style={{ transform: [{ scaleX: -1 }] }}
        />
      </View>
      <Text
        style={{
          fontFamily: Fonts.rounded,
          fontSize: 21,
          fontWeight: "700",
          color: PlatformColor("label"),
        }}
      >
        No axolotls here yet
      </Text>
      <Text
        style={{
          maxWidth: 270,
          fontSize: 15,
          lineHeight: 21,
          textAlign: "center",
          color: PlatformColor("secondaryLabel"),
        }}
      >
        Keep your streak alive and this place stays empty.
      </Text>
    </View>
  );
}
