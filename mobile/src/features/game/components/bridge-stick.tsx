import React, { useMemo } from "react";
import { Group, Rect } from "@shopify/react-native-skia";
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

const BridgeStick = React.memo(
  ({
    originX,
    originY,
    length,
    width,
    rotation,
    color = "#FC6432",
  }: BridgeStickProps) => {
    const usableLength = Math.max(0, length);

    const blocks = useMemo(() => {
      const blockH = VISUAL_CONFIG.STICK_BLOCK_HEIGHT || 10;
      const gap = VISUAL_CONFIG.STICK_BLOCK_GAP || 2;
      const spacing = blockH + gap;

      const count = usableLength === 0 ? 0 : Math.ceil(usableLength / spacing);
      const items = [];

      for (let i = 0; i < count; i++) {
        const start = i * spacing;

        const currentBlockHeight = Math.min(blockH, usableLength - start);

        if (currentBlockHeight > 0) {
          items.push({
            id: i,
            y: -(start + currentBlockHeight),
            h: currentBlockHeight,
          });
        }
      }
      return items;
    }, [usableLength]);

    return (
      <Group
        origin={{ x: originX, y: originY }}
        transform={[{ rotate: (rotation * Math.PI) / 180 }]}
      >
        {/* Optional Shadow/Background for depth */}
        <Rect
          x={originX - width / 2}
          y={originY - usableLength}
          width={width}
          height={usableLength}
          color="rgba(0,0,0,0.1)"
        />

        {/* Render Blocks */}
        {blocks.map((block) => (
          <Rect
            key={block.id}
            x={originX - width / 2}
            y={originY + block.y}
            width={width}
            height={block.h}
            color={color}
          />
        ))}
      </Group>
    );
  },
);

BridgeStick.displayName = "BridgeStick";

export default BridgeStick;
