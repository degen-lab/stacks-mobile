import { useState } from "react";
import { View } from "react-native";
import { Text, Input, Button } from "@/components/ui";
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
  selectedFeeOption?: FeeOption;
  onSelectFee?: (option: FeeOption) => void;
  customFee?: string;
  onCustomFeeChange?: (value: string) => void;
  feeMicroStx?: number;
  stackingPrice?: number;
  isLoadingFees?: boolean;
  isFeeValid?: boolean;

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
  selectedFeeOption = "standard",
  onSelectFee,
  customFee = "",
  onCustomFeeChange,
  feeMicroStx,
  stackingPrice = 0,
  isLoadingFees = false,
  isFeeValid = true,
  txId,
}: ContractTxDetailsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showFeePicker, setShowFeePicker] = useState(false);

  const explorerUrl = txId ? getExplorerTxUrl(txId).explorerUrl : "";

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
                  <Text
                    className="font-mono text-sm text-primary"
                    numberOfLines={2}
                  >
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
        <View className="mb-6 rounded-xl bg-sand-50 px-4 py-3 dark:bg-sand-900/30">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="font-instrument-sans text-sm text-secondary">
                Network fee
              </Text>
              <View className="mt-0.5">
                <Input
                  placeholder={
                    selectedFeeOption === "custom" &&
                    customFee &&
                    !showFeePicker
                      ? stackingPrice > 0
                        ? `$${(parseFloat(customFee || "0") * stackingPrice).toFixed(3)} • ${customFee} STX`
                        : `${customFee} STX`
                      : stackingPrice > 0 && feeMicroStx
                        ? `$${((feeMicroStx / MICRO_STX) * stackingPrice).toFixed(3)} • ${formatMicroStx(feeMicroStx)} STX`
                        : feeMicroStx
                          ? `${formatMicroStx(feeMicroStx)} STX`
                          : "Calculating..."
                  }
                  keyboardType="decimal-pad"
                  value={
                    selectedFeeOption === "custom" && showFeePicker
                      ? customFee
                      : ""
                  }
                  onChangeText={onCustomFeeChange}
                  editable={selectedFeeOption === "custom" && showFeePicker}
                  className={`h-auto border-0 bg-transparent p-0 pb-1 font-instrument-sans-medium text-base text-primary ${
                    selectedFeeOption === "custom" && showFeePicker
                      ? "border-b border-surface-secondary"
                      : ""
                  }`}
                  placeholderTextColor="rgb(var(--color-text-primary))"
                  autoFocus={selectedFeeOption === "custom" && showFeePicker}
                />
              </View>
            </View>
            {onSelectFee && (
              <Button
                label={showFeePicker ? "Done" : "Edit"}
                onPress={() => setShowFeePicker(!showFeePicker)}
                variant="link"
                size="sm"
              />
            )}
          </View>
        </View>
      )}

      {/* Fee Selector Pills */}
      {showFeeSelector && showFeePicker && onSelectFee && (
        <View className="mb-4">
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
