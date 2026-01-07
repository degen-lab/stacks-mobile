import { Text, View } from "@/components/ui";

type HeadsUpDisplayProps = {
  topInset: number;
  score: number;
};

const HeadsUpDisplay = ({ topInset, score }: HeadsUpDisplayProps) => {
  return (
    <View
      pointerEvents="none"
      className="absolute left-0 right-0 items-center px-4"
      style={{ top: topInset + 32, paddingTop: 32 }}
    >
      <Text
        className="text-5xl font-dm-sans-extralight font-extralight text-primary"
        style={{ paddingTop: 2 }}
      >
        {score}
      </Text>
      <Text className="mt-3 mx-4 text-center text-3xl font-dm-sans-extralight font-extralight text-secondary">
        Hold finger on screen to build stacks bridge
      </Text>
    </View>
  );
};

export default HeadsUpDisplay;
