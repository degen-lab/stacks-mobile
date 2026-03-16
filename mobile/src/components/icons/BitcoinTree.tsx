import { Image } from "@/components/ui";

type BitcoinTreeProps = {
  width?: number;
  height?: number;
  className?: string;
};

export function BitcoinTree({
  width = 144,
  height = 68,
  className = "",
}: BitcoinTreeProps) {
  return (
    <Image
      source={require("@/assets/images/bitcoin_tree.png")}
      style={{ width, height }}
      contentFit="contain"
      className={className}
    />
  );
}
