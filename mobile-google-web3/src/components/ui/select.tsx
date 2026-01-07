import {
  BottomSheetFlatList,
  type BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { FlashList } from "@shopify/flash-list";
import { Check, ChevronDown } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import * as React from "react";
import type { FieldValues } from "react-hook-form";
import { useController } from "react-hook-form";
import { Platform, Pressable, View, type PressableProps } from "react-native";
import { tv } from "tailwind-variants";

import colors from "@/components/ui/colors";

import type { InputControllerType } from "./input";
import { Modal, useModal } from "./modal";
import { Text } from "./text";

const selectTv = tv({
  slots: {
    container: "mb-4",
    label: "text-secondary mb-1 text-base",
    input:
      "border-surface-secondary mt-0 flex-row items-center justify-center rounded-xl border bg-white px-4 py-3",
    inputValue: "text-primary",
  },
  variants: {
    error: {
      true: {
        input: "border-danger-600",
        label: "text-danger-600",
        inputValue: "text-danger-600",
      },
    },
    disabled: {
      true: {
        input: "bg-neutral-200",
      },
    },
  },
  defaultVariants: {
    error: false,
    disabled: false,
  },
});

const List = Platform.OS === "web" ? FlashList : BottomSheetFlatList;

export type OptionType = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
};

type OptionsProps = {
  options: OptionType[];
  onSelect: (option: OptionType) => void;
  value?: string | number;
  testID?: string;
};

function keyExtractor(item: OptionType) {
  return `select-item-${item.value}`;
}

export const Options = React.forwardRef<BottomSheetModal, OptionsProps>(
  ({ options, onSelect, value, testID }, ref) => {
    const height = options.length * 64 + 80;
    const snapPoints = React.useMemo(() => [height], [height]);
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === "dark";

    const renderSelectItem = React.useCallback(
      ({ item }: { item: OptionType }) => (
        <Option
          key={`select-item-${item.value}`}
          label={item.label}
          icon={item.icon}
          selected={value === item.value}
          onPress={() => onSelect(item)}
          testID={testID ? `${testID}-item-${item.value}` : undefined}
        />
      ),
      [onSelect, value, testID],
    );

    return (
      <Modal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{
          backgroundColor: isDark ? colors.neutral[800] : colors.white,
        }}
      >
        <List
          data={options}
          keyExtractor={keyExtractor}
          renderItem={renderSelectItem}
          testID={testID ? `${testID}-modal` : undefined}
          estimatedItemSize={64}
        />
      </Modal>
    );
  },
);

Options.displayName = "Options";

const Option = React.memo(
  ({
    label,
    selected = false,
    icon,
    ...props
  }: PressableProps & {
    selected?: boolean;
    label: string;
    icon?: React.ReactNode;
  }) => {
    return (
      <Pressable
        className="flex-row items-center border-b border-surface-secondary bg-white px-4 py-4"
        {...props}
      >
        {icon ? (
          <View className="mr-3 items-center justify-center">{icon}</View>
        ) : null}
        <Text className="flex-1 text-base font-instrument-sans text-primary">
          {label}
        </Text>
        {selected ? <Check size={18} color={colors.neutral[900]} /> : null}
      </Pressable>
    );
  },
);

Option.displayName = "Option";

export interface SelectProps {
  value?: string | number;
  label?: string;
  disabled?: boolean;
  error?: string;
  options?: OptionType[];
  onSelect?: (value: string | number) => void;
  placeholder?: string;
  testID?: string;
}

interface ControlledSelectProps<T extends FieldValues>
  extends SelectProps, InputControllerType<T> {}

export const Select = (props: SelectProps) => {
  const {
    label,
    value,
    error,
    options = [],
    placeholder = "Select...",
    disabled = false,
    onSelect,
    testID,
  } = props;
  const modal = useModal();

  const onSelectOption = React.useCallback(
    (option: OptionType) => {
      onSelect?.(option.value);
      modal.dismiss();
    },
    [modal, onSelect],
  );

  const styles = React.useMemo(
    () =>
      selectTv({
        error: Boolean(error),
        disabled,
      }),
    [error, disabled],
  );

  const textValue = React.useMemo(
    () =>
      value !== undefined
        ? (options?.find((t) => t.value === value)?.label ?? placeholder)
        : placeholder,
    [value, options, placeholder],
  );

  return (
    <>
      <View className={styles.container()}>
        {label ? (
          <Text
            testID={testID ? `${testID}-label` : undefined}
            className={styles.label()}
          >
            {label}
          </Text>
        ) : null}
        <Pressable
          className={styles.input()}
          disabled={disabled}
          onPress={modal.present}
          testID={testID ? `${testID}-trigger` : undefined}
        >
          <View className="flex-1">
            <Text className={styles.inputValue()}>{textValue}</Text>
          </View>
          <ChevronDown size={18} color={colors.neutral[600]} />
        </Pressable>
        {error ? (
          <Text testID={`${testID}-error`} className="text-sm text-danger-600">
            {error}
          </Text>
        ) : null}
      </View>
      <Options
        testID={testID}
        ref={modal.ref}
        options={options}
        onSelect={onSelectOption}
      />
    </>
  );
};

export function ControlledSelect<T extends FieldValues>(
  props: ControlledSelectProps<T>,
) {
  const { name, control, rules, onSelect: onNSelect, ...selectProps } = props;

  const { field, fieldState } = useController({ control, name, rules });
  const onSelect = React.useCallback(
    (value: string | number) => {
      field.onChange(value);
      onNSelect?.(value);
    },
    [field, onNSelect],
  );
  return (
    <Select
      onSelect={onSelect}
      value={field.value}
      error={fieldState.error?.message}
      {...selectProps}
    />
  );
}
