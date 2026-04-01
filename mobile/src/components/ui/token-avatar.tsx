import { useEffect, useState } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { View } from "react-native";

import colors from "./colors";
import { Image } from "./image";
import { BtcLogo, SbtcRouteLogo, StxCoin } from "./icons";
import { Text } from "./text";
import { ImageStyle } from "expo-image";

type TokenAvatarProps = {
  icon?: string | null;
  symbol: string;
  size?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

type SymbolFallbackProps = {
  size: number;
  symbol: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

function SymbolFallback({
  size,
  symbol,
  className,
  style,
}: SymbolFallbackProps) {
  const label = symbol.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <View
      className={[
        "items-center justify-center rounded-full border border-surface-secondary bg-white dark:bg-surface-primary",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={[{ width: size, height: size }, style]}
    >
      <Text
        className="font-instrument-sans text-primary"
        style={{ fontSize: Math.max(12, size * 0.34) }}
      >
        {label}
      </Text>
    </View>
  );
}

export function TokenAvatar({
  icon,
  symbol,
  size = 40,
  className,
  style,
}: TokenAvatarProps) {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const normalizedIcon = icon?.trim();
  const [hasError, setHasError] = useState(!normalizedIcon);

  useEffect(() => {
    setHasError(!normalizedIcon);
  }, [normalizedIcon]);

  if (normalizedSymbol === "BTC") {
    return <BtcLogo size={size} className={className} style={style} />;
  }

  if (normalizedSymbol === "STX") {
    return <StxCoin size={size} className={className} style={style} />;
  }

  if (normalizedSymbol === "SBTC") {
    return (
      <View className={className} style={style}>
        <SbtcRouteLogo size={size} />
      </View>
    );
  }

  if (hasError || !normalizedIcon) {
    return (
      <SymbolFallback
        size={size}
        symbol={symbol}
        className={className}
        style={style}
      />
    );
  }

  return (
    <Image
      source={{ uri: normalizedIcon }}
      contentFit="cover"
      className={className}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.white,
        },
        style as ImageStyle,
      ]}
      onError={() => setHasError(true)}
    />
  );
}
