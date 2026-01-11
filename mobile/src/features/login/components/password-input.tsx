import { Input, View } from "@/components/ui";
import { Eye, EyeOff } from "lucide-react-native";
import { TouchableOpacity } from "react-native";

export function PasswordInput({
  password,
  showPassword,
  onPasswordChange,
  onToggleShowPassword,
  error,
  inputTestID,
  toggleTestID,
}: {
  password: string;
  showPassword: boolean;
  onPasswordChange: (password: string) => void;
  onToggleShowPassword: () => void;
  error?: string;
  inputTestID?: string;
  toggleTestID?: string;
}) {
  return (
    <View className="relative">
      <Input
        testID={inputTestID}
        value={password}
        onChangeText={onPasswordChange}
        placeholder="Password"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        error={error}
        className="pl-4 pr-12 bg-surface-tertiary text-primary border rounded-lg border-sand-300 dark:bg-neutral-800 dark:border-sand-800"
      />
      <TouchableOpacity
        onPress={onToggleShowPassword}
        testID={toggleTestID}
        className="absolute right-4 top-5 items-center justify-center"
      >
        {showPassword ? (
          <EyeOff size={20} className="text-secondary" />
        ) : (
          <Eye size={20} className="text-secondary" />
        )}
      </TouchableOpacity>
    </View>
  );
}
