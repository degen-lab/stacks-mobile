import { validatePassword } from "@/lib/password-strength";
import { AlertCircle, Check } from "lucide-react-native";
import { useMemo } from "react";
import { Text, View } from "react-native";
export function calculatePasswordStrength(password: string): {
  level: number;
  label: string;
  colorClass: string;
} {
  if (password.length === 0) {
    return { level: 0, label: "", colorClass: "bg-sand-200" };
  }

  const validation = validatePassword(password);

  switch (validation.score) {
    case 0:
    case 1:
      return { level: 1, label: "Poor", colorClass: "bg-red-500" };
    case 2:
      return { level: 2, label: "Weak", colorClass: "bg-orange-500" };
    case 3:
      return { level: 3, label: "Good", colorClass: "bg-yellow-500" };
    case 4:
      return {
        // Only show full green if it also meets the length requirement
        level: validation.meetsAllStrengthRequirements ? 4 : 3,
        label: validation.meetsAllStrengthRequirements ? "Strong" : "Good",
        colorClass: validation.meetsAllStrengthRequirements
          ? "bg-green-600"
          : "bg-yellow-500",
      };
    default:
      return { level: 0, label: "", colorClass: "bg-sand-200" };
  }
}
interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({
  password,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(
    () => calculatePasswordStrength(password),
    [password],
  );

  const validation = useMemo(() => validatePassword(password), [password]);

  const bars = [1, 2, 3, 4];

  return (
    <View className="mt-4 gap-3">
      {/* Strength Bar */}
      <View className="gap-2">
        <View className="flex-row gap-1.5 h-2">
          {bars.map((bar) => (
            <View
              key={bar}
              className={`flex-1 rounded-full ${
                bar <= strength.level
                  ? strength.colorClass
                  : "bg-sand-300 dark:bg-sand-700"
              }`}
            />
          ))}
        </View>
      </View>

      {/* Requirements List */}
      <View className="gap-2.5 mt-2">
        <RequirementItem
          met={validation.meetsLengthRequirement}
          label="At least 8 characters"
        />

        <RequirementItem
          met={validation.meetsScoreRequirement}
          label="Strong complexity"
        />

        {validation.feedback.warning && (
          <View className="flex-row items-start gap-2 mt-0.5">
            <AlertCircle size={16} color="#ea580c" className="mt-0.5" />
            <Text className="text-sm text-orange-600 dark:text-orange-500 flex-1 leading-5">
              {validation.feedback.warning}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Helper Component for the Checklist Items
function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <View
        className={`h-5 w-5 items-center justify-center rounded-full ${
          met
            ? "bg-green-600 dark:bg-green-500"
            : "bg-sand-300 dark:bg-sand-700"
        }`}
      >
        {met && <Check size={10} color="#ffffff" strokeWidth={2} />}
      </View>
      <Text
        className={`text-sm font-instrument-sans flex-1 ${
          met
            ? "text-sand-700 dark:text-sand-300 font-medium"
            : "text-sand-500 dark:text-sand-400"
        }`}
      >
        {label}
      </Text>
    </View>
  );
}
