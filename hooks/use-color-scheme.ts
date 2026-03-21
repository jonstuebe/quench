import { useColorScheme as useRNColorScheme } from "react-native";

/** Resolves to `light` or `dark` (RN may report `unspecified` or `null`). */
export function useColorScheme(): "light" | "dark" {
  const scheme = useRNColorScheme();
  return scheme === "dark" ? "dark" : "light";
}
