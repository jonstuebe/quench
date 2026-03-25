import { Text, type TextProps } from "react-native";

import { useThemeColor } from "@/hooks/use-theme-color";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "default" | "title" | "defaultSemiBold" | "subtitle" | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text");

  return (
    <Text
      style={[
        { color },
        type === "default" ? { fontSize: 16, lineHeight: 24 } : undefined,
        type === "title"
          ? { fontSize: 32, fontWeight: "bold", lineHeight: 32 }
          : undefined,
        type === "defaultSemiBold"
          ? { fontSize: 16, lineHeight: 24, fontWeight: "600" }
          : undefined,
        type === "subtitle" ? { fontSize: 20, fontWeight: "bold" } : undefined,
        type === "link"
          ? { lineHeight: 30, fontSize: 16, color: "#0a7ea4" }
          : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
