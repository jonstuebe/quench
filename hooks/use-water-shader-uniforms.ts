import { useColorScheme } from "@/hooks/use-color-scheme";
import { calculateWaterGoalFlOz } from "@/lib/health/goal";
import {
  todayExerciseMin$,
  todayExerciseSync$,
  todayWaterFlOz$,
  todayWaterSync$,
  weightLb$,
  weightSync$,
} from "@/lib/health/store";
import { useValue } from "@legendapp/state/react";

/**
 * Fill fraction and palette for the water Skia shader / web gradient, shared by
 * WaterWidget and full-screen home backdrop.
 */
export function useWaterShaderUniforms() {
  const colorScheme = useColorScheme();

  const water = useValue(todayWaterFlOz$);
  const exerciseMin = useValue(todayExerciseMin$);
  const weight = useValue(weightLb$);

  const waterLoaded = useValue(() => todayWaterSync$.isLoaded.get());
  const exerciseLoaded = useValue(() => todayExerciseSync$.isLoaded.get());
  const weightLoaded = useValue(() => weightSync$.isLoaded.get());
  const loading = !waterLoaded || !exerciseLoaded || !weightLoaded;

  const goalFlOz = calculateWaterGoalFlOz(weight, exerciseMin);
  const fillFraction = goalFlOz > 0 ? Math.min(1, water / goalFlOz) : 0;

  const colorTurquoise = colorScheme === "dark" ? "#2a9aaa" : "#4fd4cf";
  const colorSapphire = colorScheme === "dark" ? "#0d4a6e" : "#1e7ec8";
  const colorDeep = colorScheme === "dark" ? "#081a2e" : "#1e6ec4";
  const colorAir = colorScheme === "dark" ? "#0c1624" : "#7aa8d4";

  return {
    water,
    exerciseMin,
    weight,
    goalFlOz,
    fillFraction,
    colorTurquoise,
    colorSapphire,
    colorDeep,
    colorAir,
    loading,
  };
}
