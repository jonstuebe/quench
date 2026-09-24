import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useMemo } from "react";
import type { ListRenderItem } from "react-native";
import { FlatList, PlatformColor, Text, View } from "react-native";

import { DuskBackdrop } from "@/components/graveyard/dusk-backdrop";
import { GraveRow } from "@/components/graveyard/grave-row";
import { LongestLifeHero } from "@/components/graveyard/longest-life-hero";
import { Fonts } from "@/constants/theme";
import { useGraveyard } from "@/hooks/use-graveyard";
import { longestLife } from "@/lib/graveyard/graveyard";
import type { Grave } from "@/lib/streak/evaluate";

export default function GraveyardScreen() {
  const graves = useGraveyard();
  const open = useCallback((id: string) => {
    router.push({ pathname: "/graveyard/[id]", params: { id } });
  }, []);
  const renderItem = useCallback<ListRenderItem<Grave>>(
    ({ item }) => <GraveRow grave={item} onPress={open} />,
    [open],
  );
  // Every grave stays in the list too, so a lone grave shows as both hero and row.
  const hero = useMemo(() => longestLife(graves), [graves]);
  const header = useMemo(
    () => (hero ? <LongestLifeHero grave={hero} onPress={open} /> : null),
    [hero, open],
  );

  return (
    <View style={{ flex: 1 }}>
      <DuskBackdrop />
      <FlatList
        data={graves}
        keyExtractor={(g) => g.id}
        renderItem={renderItem}
        ItemSeparatorComponent={Gap}
        ListHeaderComponent={header}
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
