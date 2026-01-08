import { Text, View } from "@/components/ui";

interface LoadingViewProps {
  title: string;
  subtitle: string;
}

export function LoadingView({ title, subtitle }: LoadingViewProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6 py-8 dark:bg-neutral-900">
      <Text className="text-xl font-matter text-primary dark:text-white">
        {title}
      </Text>
      <Text className="mt-2 text-sm font-instrument-sans text-secondary">
        {subtitle}
      </Text>
    </View>
  );
}
