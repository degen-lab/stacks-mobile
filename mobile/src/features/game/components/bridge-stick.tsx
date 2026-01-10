import { Group, Rect } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { VISUAL_CONFIG } from "../config";

type BridgeStickProps = {
  originX: number;
  originY: number;
  length: number;
  width: number;
  rotation: number;
  color?: string;
  shadowColor?: string;
};

const BridgeStick = ({
  originX,
  originY,
  length,
  width,
  rotation,
  color = "#FC6432",
  shadowColor = "#E4570F",
}: BridgeStickProps) => {
  const usableLength = Math.max(0, length);
  const blocks = useMemo(() => {
    const spacing =
      VISUAL_CONFIG.STICK_BLOCK_HEIGHT + VISUAL_CONFIG.STICK_BLOCK_GAP;
    const count = usableLength === 0 ? 0 : Math.ceil(usableLength / spacing);
    const items: { index: number; y: number; height: number }[] = [];
    for (let i = 0; i < count; i++) {
      const start = i * spacing;
      const height = Math.min(
        VISUAL_CONFIG.STICK_BLOCK_HEIGHT,
        Math.max(usableLength - start, 0),
      );
      const yOffset = -(start + height);
      items.push({ index: i, y: yOffset, height });
    }
    return items;
  }, [usableLength]);

  return (
    <Group
      transform={[
        { translateX: originX },
        { translateY: originY },
        { rotate: (rotation * Math.PI) / 180 },
      ]}
    >
      <Rect
        x={-width / 2}
        y={-usableLength}
        width={width}
        height={usableLength}
        color={`${shadowColor}40`}
      />

      {blocks.map((block) => (
        <Rect
          key={`block-${block.index}`}
          x={-width / 2}
          y={block.y}
          width={width}
          height={block.height}
          color={color}
        />
      ))}
    </Group>
  );
};

export default BridgeStick;
