import { useState } from "react";
import { TextInput, View } from "react-native";
import { Text, Button } from "@/components/ui";
import {
  FeeSelector,
  FeeOption,
} from "@/features/stacking/components/fee-selector";
import { ExternalLink } from "@/components/external-link";
import { formatMicroStx, MICRO_STX } from "@/lib/format/currency";
import { getExplorerTxUrl } from "@/lib/stacks/network";

export interface ContractArgument {
  name: string;
  value: string | number;
  type?: string;
}

interface ContractTxDetailsProps {
  network: string;
  contractAddress: string;
  functionName: string;

  contractArgs?: ContractArgument[];

  title?: string;

  onAdvancedToggle?: (isAdvanced: boolean) => void;

  showFeeSelector?: boolean;
  feeHelperText?: string;
  selectedFeeOption?: FeeOption;
  onSelectFee?: (option: FeeOption) => void;
  customFee?: string;
  onCustomFeeChange?: (value: string) => void;
  feeMicroStx?: number;
  stackingPrice?: number;
  isLoadingFees?: boolean;
  isFeeValid?: boolean;
  isFeeUnavailable?: boolean;

  txId?: string;
}

export function ContractTxDetails({
  network,
  contractAddress,
  functionName,
  contractArgs,
  title,
  onAdvancedToggle,
  showFeeSelector = false,
  feeHelperText,
  selectedFeeOption = "standard",
  onSelectFee,
  customFee = "",
  onCustomFeeChange,
  feeMicroStx,
  stackingPrice = 0,
  isLoadingFees = false,
  isFeeValid = true,
  isFeeUnavailable = false,
  txId,
}: ContractTxDetailsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFeePicker, setShowFeePicker] = useState(false);

  const explorerUrl = txId ? getExplorerTxUrl(txId).explorerUrl : "";
  const feeDisplayLabel =
    selectedFeeOption === "custom" && customFee && !showFeePicker
      ? stackingPrice > 0
        ? `$${(parseFloat(customFee || "0") * stackingPrice).toFixed(3)} • ${customFee} STX`
        : `${customFee} STX`
      : isLoadingFees
        ? "Calculating..."
        : stackingPrice > 0 && feeMicroStx
          ? `$${((feeMicroStx / MICRO_STX) * stackingPrice).toFixed(3)} • ${formatMicroStx(feeMicroStx)} STX`
          : feeMicroStx
            ? `${formatMicroStx(feeMicroStx)} STX`
            : selectedFeeOption === "custom"
              ? "Enter custom fee"
              : "Estimated in wallet";

  const handleAdvancedToggle = () => {
    const newState = !showAdvanced;
    setShowAdvanced(newState);
    onAdvancedToggle?.(newState);
  };

  return (
    <>
      <View className="mb-4 flex-row items-center justify-between">
        {title && (
          <Text className="text-xl font-matter text-primary dark:text-white">
            {title}
          </Text>
        )}
        <Button
          label={showAdvanced ? "Hide Details" : "Transaction Settings"}
          onPress={handleAdvancedToggle}
          variant="link"
          size="sm"
        />
      </View>

      {/* Advanced Contract Details */}
      {showAdvanced && (
        <View className="mb-4 gap-3">
          {/* Network */}
          <View className="rounded-xl border border-surface-secondary bg-sand-100 px-4 py-3 dark:bg-sand-900/30">
            <Text className="mb-1 font-instrument-sans text-xs text-secondary">
              Network
            </Text>
            <Text className="font-instrument-sans text-sm text-primary">
              {network}
            </Text>
          </View>

          {/* Contract */}
          <View className="rounded-xl border border-surface-secondary bg-sand-100 px-4 py-3 dark:bg-sand-900/30">
            <Text className="mb-1 font-instrument-sans text-xs text-secondary">
              Contract
            </Text>
            <Text
              className="font-mono text-sm text-primary"
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {contractAddress}
            </Text>
          </View>

          {/* Function */}
          <View className="rounded-xl border border-surface-secondary bg-sand-100 px-4 py-3 dark:bg-sand-900/30">
            <Text className="mb-1 font-instrument-sans text-xs text-secondary">
              Function
            </Text>
            <Text className="font-mono text-sm text-primary">
              {functionName}
            </Text>
          </View>

          {/* Arguments */}
          {contractArgs && contractArgs.length > 0 && (
            <>
              {contractArgs.map((arg, index) => (
                <View
                  key={index}
                  className="rounded-xl border border-surface-secondary bg-sand-100 px-4 py-3 dark:bg-sand-900/30"
                >
                  <Text className="mb-1 font-instrument-sans text-xs text-secondary">
                    {arg.name}
                    {arg.type && (
                      <Text className="text-tertiary"> ({arg.type})</Text>
                    )}
                  </Text>
                  <Text className="font-mono text-sm text-primary">
                    {arg.value}
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Explorer Link */}
          {txId && (
            <View className="rounded-xl border border-surface-secondary bg-sand-100 px-4 py-3 dark:bg-sand-900/30">
              <ExternalLink href={explorerUrl as any}>
                <Text className="font-instrument-sans text-sm text-blue-600 dark:text-blue-400">
                  View on Explorer →
                </Text>
              </ExternalLink>
            </View>
          )}
        </View>
      )}

      {/* Fee Section */}
      {showFeeSelector && (
        <View className="mb-6 gap-2">
          {feeHelperText ? (
            <Text className="text-sm font-instrument-sans text-secondary dark:text-neutral-300">
              {feeHelperText}
            </Text>
          ) : null}
          <View className="rounded-xl border border-surface-secondary px-4 py-3 dark:border-border-primary">
            <View className="flex-row items-center justify-between gap-4">
              <View className="flex-1">
                <Text className="font-instrument-sans text-sm text-secondary">
                  Network fee
                </Text>
                <View className="mt-1 min-h-[24px] justify-center">
                  {selectedFeeOption === "custom" && showFeePicker ? (
                    <TextInput
                      keyboardType="decimal-pad"
                      value={customFee}
                      onChangeText={onCustomFeeChange}
                      placeholder="Enter custom fee"
                      placeholderTextColor="rgb(var(--color-text-tertiary))"
                      autoFocus
                      className="border-0 border-b border-surface-secondary p-0 pb-1 font-instrument-sans-medium text-base text-primary dark:border-border-primary"
                      style={{
                        paddingVertical: 0,
                        textAlignVertical: "center",
                      }}
                    />
                  ) : (
                    <Text className="font-instrument-sans-medium text-base text-primary">
                      {feeDisplayLabel}
                    </Text>
                  )}
                </View>
              </View>
              {onSelectFee && (
                <Button
                  label={showFeePicker ? "Done" : "Edit"}
                  onPress={() => setShowFeePicker(!showFeePicker)}
                  variant="outline"
                  size="sm"
                  className="rounded-lg border-2 border-border-secondary bg-transparent"
                  textClassName="text-xs font-instrument-sans-medium text-secondary"
                />
              )}
            </View>
          </View>
        </View>
      )}

      {/* Fee Selector Pills */}
      {showFeeSelector && showFeePicker && onSelectFee && (
        <View className="w-full">
          <FeeSelector
            selectedFee={selectedFeeOption}
            onSelectFee={onSelectFee}
            isLoading={isLoadingFees}
          />
        </View>
      )}
    </>
  );
}
