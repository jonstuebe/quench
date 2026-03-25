/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

/**
 * Primary label color on light frosted glass over bright water/sky (home immersive UI).
 * Teal `tint` and faint white both wash out; this navy reads clearly on pale glass.
 */
export const glassLabelOnBrightLight = "#0d2840";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = {
  /** iOS `UIFontDescriptorSystemDesignDefault` */
  sans: "system-ui",
  /** iOS `UIFontDescriptorSystemDesignSerif` */
  serif: "ui-serif",
  /** iOS `UIFontDescriptorSystemDesignRounded` */
  rounded: "ui-rounded",
  /** iOS `UIFontDescriptorSystemDesignMonospaced` */
  mono: "ui-monospace",
};
