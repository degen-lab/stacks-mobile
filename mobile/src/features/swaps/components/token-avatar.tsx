import { useEffect, useState } from "react";

import { Image, Text, View, colors } from "@/components/ui";

type TokenAvatarProps = {
  icon: string | null | undefined;
  symbol: string;
  size?: number;
};

export function TokenAvatar({ icon, symbol, size = 40 }: TokenAvatarProps) {
  const [hasError, setHasError] = useState(!icon);

  useEffect(() => {
    setHasError(!icon);
  }, [icon]);

  if (hasError || !icon) {
    return (
      <View
        className="items-center justify-center rounded-full border border-surface-secondary bg-white"
        style={{ width: size, height: size }}
      >
        <Text
          className="font-instrument-sans text-primary"
          style={{ fontSize: Math.max(12, size * 0.34) }}
        >
          {symbol.slice(0, 1).toUpperCase()}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: icon }}
      contentFit="cover"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.white,
      }}
      onError={() => setHasError(true)}
    />
  );
}
