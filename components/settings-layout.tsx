import type { ReactNode } from "react";
import type { ColorValue } from "react-native";
import { StyleSheet, Text } from "react-native";

export function timePartsToDate(hour: number, minute: number): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

export function SectionHeader({
  children,
  color,
  first,
}: {
  children: ReactNode;
  color: ColorValue;
  first?: boolean;
}) {
  return (
    <Text style={[styles.sectionHeader, first && styles.sectionHeaderFirst, { color }]}>
      {children}
    </Text>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  sectionHeader: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "400",
    letterSpacing: -0.06,
    textTransform: "uppercase",
    marginTop: 36,
    marginBottom: 10,
  },
  sectionHeaderFirst: {
    marginTop: 0,
  },
  sectionCaption: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 16,
  },
  group: {
    borderRadius: 10,
    overflow: "hidden",
  },
  groupInner: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  groupInnerTight: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  controlBlock: {
    marginBottom: 4,
  },
  /** Same card look as `group` but no overflow clipping (native tabs + RN can mis-measure clipped groups). */
  checklistGroup: {
    borderRadius: 10,
    marginBottom: 4,
    alignSelf: "stretch",
  },
  hostFill: {
    width: "100%",
    alignSelf: "stretch",
  },
  /** RN fallback rows (SwiftUI List/Picker often won’t size inside ScrollView + native tabs) */
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  checklistLabel: {
    fontSize: 17,
    fontWeight: "400",
  },
  checklistCheckPlaceholder: {
    width: 22,
    height: 22,
  },
  checklistSeparator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
});
