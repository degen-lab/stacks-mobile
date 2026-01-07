import type { ImageSource } from "expo-image";

import { Image } from "@/components/ui";
import type { ImgProps } from "@/components/ui/image";

type AvatarProps = Omit<ImgProps, "source" | "className"> & {
  source?: ImageSource;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClassMap: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "size-8",
  sm: "size-10",
  md: "size-12",
  lg: "size-16",
  xl: "size-20",
};

export function Avatar({
  source,
  size = "md",
  className = "",
  ...imageProps
}: AvatarProps) {
  const sizeClass = sizeClassMap[size] ?? sizeClassMap.md;
  const resolvedSource = source ?? require("@/assets/images/splash-icon.png");

  return (
    <Image
      source={resolvedSource}
      contentFit="cover"
      className={`${sizeClass} rounded-full bg-neutral-200 dark:bg-neutral-800 ${className}`}
      {...imageProps}
    />
  );
}
