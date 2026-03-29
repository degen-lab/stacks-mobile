import { KeyboardAvoidingView, Platform } from "react-native";

import type { SwapViewModel } from "../hooks/use-swap";
import { TokenPicker } from "../components/token-picker";

type SwapPickerViewProps = {
  swap: SwapViewModel;
};

export function SwapPickerView({ swap }: SwapPickerViewProps) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, paddingHorizontal: 16, paddingTop: 8 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
    >
      <TokenPicker
        key={swap.step}
        emptyMessage={swap.pickerEmptyMessage}
        isLoading={swap.isPickerLoading}
        selectedTokenId={swap.pickerSelectedTokenId}
        tokens={swap.pickerTokens}
        onSelect={swap.onPickerSelect}
      />
    </KeyboardAvoidingView>
  );
}
