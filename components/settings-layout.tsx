import type { ReactNode } from "react";
import type { ColorValue } from "react-native";
import { Text } from "react-native";

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
    <Text
      style={[
        {
          fontSize: 13,
          lineHeight: 16,
          fontWeight: "400",
          letterSpacing: -0.06,
          textTransform: "uppercase",
          marginTop: 36,
          marginBottom: 10,
        },
        first && { marginTop: 0 },
        { color },
      ]}
    >
      {children}
    </Text>
  );
}
