import { Text, View } from "@/components/ui";

type NumberedSectionProps = {
  title: string;
  body: string;
  index: number;
};

export function NumberedSection({ title, body, index }: NumberedSectionProps) {
  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-2">
        <View className="mr-3 h-7 w-7 items-center justify-center rounded-full bg-sand-200 border border-surface-secondary">
          <Text className="text-sm font-matter text-primary">{index}</Text>
        </View>
        <Text className="text-lg font-matter text-primary">{title}</Text>
      </View>

      <Text className="text-base font-instrument-sans text-secondary leading-6">
        {body}
      </Text>
    </View>
  );
}
