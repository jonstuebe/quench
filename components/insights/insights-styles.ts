import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  loading: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  groupContinuous: {
    borderCurve: "continuous",
  },
  pressed: {
    opacity: 0.55,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  goalSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  goalSummaryText: {
    flex: 1,
    gap: 4,
  },
  goalSummarySub: {
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
  },
  goalSummaryTrail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  healthRowPressable: {
    alignSelf: "stretch",
    width: "100%",
  },
  healthRowLabel: {
    flex: 1,
    marginRight: 10,
    minWidth: 0,
    justifyContent: "center",
  },
  dayRowPress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 56,
    gap: 8,
  },
  dayRowLeft: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  dayRowSub: {
    fontSize: 13,
    lineHeight: 18,
    fontVariant: ["tabular-nums"],
  },
  dayRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  pctText: {
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    minWidth: 40,
    textAlign: "right",
  },
  valueText: {
    fontSize: 17,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    textAlign: "right",
  },
});
