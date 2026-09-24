import { Button, Host, Picker, Text as SText, VStack } from "@expo/ui/swift-ui";
import {
  buttonStyle,
  disabled,
  controlSize,
  frame,
  padding,
  pickerStyle,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { useValue } from "@legendapp/state/react";
import { router } from "expo-router";
import { useMemo, useState } from "react";

import { formatDisplayAmount } from "@/lib/home/format";
import { useLogWater } from "@/lib/log-water";
import { prefs$ } from "@/lib/prefs";
import { buildAmountOptions, displayToFlOz } from "@/lib/volume";

/** Custom-amount sheet: the full wheel of amounts, opened from the quick-log bar's "+". */
export default function LogCustomAmountSheet() {
  const unit = useValue(prefs$.unit);
  const options = useMemo(() => buildAmountOptions(unit), [unit]);
  // Default to a common glass size rather than the smallest step.
  const [idx, setIdx] = useState(() => Math.max(0, Math.min(options.length - 1, 7)));
  const value = options[idx] ?? options[0] ?? 0;

  const { log, saving } = useLogWater();
  async function onAdd() {
    const ok = await log(displayToFlOz(value, unit));
    if (ok) router.back();
  }

  return (
    <Host style={{ flex: 1 }}>
      <VStack spacing={12} modifiers={[padding({ horizontal: 20, top: 56, bottom: 20 })]}>
        <Picker
          selection={idx}
          onSelectionChange={(s) => setIdx(typeof s === "number" ? s : Number(s))}
          modifiers={[pickerStyle("wheel")]}
        >
          {options.map((opt, i) => (
            <SText key={i} modifiers={[tag(i)]}>
              {formatDisplayAmount(opt, unit)}
            </SText>
          ))}
        </Picker>
        <Button
          label={`Log ${formatDisplayAmount(value, unit)}`}
          onPress={onAdd}
          modifiers={[
            buttonStyle("glassProminent"),
            controlSize("large"),
            frame({ maxWidth: 10000 }),
            disabled(saving),
          ]}
        />
      </VStack>
    </Host>
  );
}
