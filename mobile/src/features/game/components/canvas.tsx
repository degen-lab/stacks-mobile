import { useCallback, useEffect, useRef, useState } from "react";
import {
  Canvas,
  Circle,
  Group,
  Image,
  LinearGradient,
  Rect,
  Text,
  useFont,
  useImage,
  vec,
} from "@shopify/react-native-skia";

import { Pressable, View } from "@/components/ui";
import { useGameStore } from "@/lib/store/game";

import { PHYSICS_CONFIG, VISUAL_CONFIG, SCREEN_WIDTH } from "../config";
import type { Particle, RenderState } from "../types";
import BridgeStick from "./bridge-stick";

const MAX_PARTICLES = 50;

type BridgeGameCanvasProps = {
  getRenderState: () => RenderState;
  canvasHeight: number;
  worldOffsetY: number;
  isAnimating?: boolean;
  onInputDown: () => void;
  onInputUp: () => void;
  onEmitterReady?: (
    spawn: (x: number, y: number, color: string, count?: number) => void,
  ) => void;
  perfectCue?: { x: number; y: number; createdAt: number } | null;
  showGhostPreview?: boolean;
  onAssetsLoaded?: () => void;
};

export const BridgeGameCanvas = ({
  getRenderState,
  canvasHeight,
  worldOffsetY,
  isAnimating = true,
  onInputDown,
  onInputUp,
  onEmitterReady,
  perfectCue,
  showGhostPreview = false,
  onAssetsLoaded,
}: BridgeGameCanvasProps) => {
  // --- Refs & State ---
  const particlesRef = useRef<Particle[]>(
    Array.from({ length: MAX_PARTICLES }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      color: "#fff",
      size: 0,
    })),
  );

  const perfectTextsRef = useRef<
    { x: number; y: number; vx: number; vy: number; life: number }[]
  >([]);

  const [, setTick] = useState(0);

  // --- Emitter ---
  const spawnParticles = useCallback(
    (x: number, y: number, color: string, count: number = 12) => {
      let spawned = 0;
      for (let i = 0; i < MAX_PARTICLES && spawned < count; i++) {
        const p = particlesRef.current[i];
        if (p.life <= 0) {
          p.x = x;
          p.y = y;
          p.vx = (Math.random() - 0.5) * 220;
          p.vy = (Math.random() - 0.5) * 220 - 140;
          p.life = 1.0;
          p.color = color;
          p.size = VISUAL_CONFIG.PARTICLE_MIN_SIZE + Math.random() * 3;
          spawned++;
        }
      }
    },
    [],
  );

  useEffect(() => {
    onEmitterReady?.(spawnParticles);
  }, [onEmitterReady, spawnParticles]);

  useEffect(() => {
    if (!perfectCue) return;
    perfectTextsRef.current.push({
      x: perfectCue.x,
      y: perfectCue.y,
      vx: (Math.random() - 0.5) * 60,
      vy: -180,
      life: 1,
    });
  }, [perfectCue]);

  // --- Animation Loop ---
  useEffect(() => {
    if (!isAnimating) return;
    let frameId: number;
    let lastTime = performance.now();

    const tick = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      // Update Particles (Pooled)
      const particles = particlesRef.current;
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = particles[i];
        if (p.life <= 0) continue;
        p.life -= deltaTime * PHYSICS_CONFIG.PARTICLE_LIFETIME_DECAY;
        p.vy += PHYSICS_CONFIG.PARTICLE_GRAVITY * deltaTime;
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
      }

      // Update Texts
      const texts = perfectTextsRef.current;
      for (let i = texts.length - 1; i >= 0; i--) {
        const t = texts[i];
        t.life -= deltaTime * PHYSICS_CONFIG.PERFECT_TEXT_LIFETIME_DECAY;
        if (t.life <= 0) {
          texts.splice(i, 1);
        } else {
          t.vx *= PHYSICS_CONFIG.PERFECT_TEXT_FRICTION;
          t.vy += PHYSICS_CONFIG.PERFECT_TEXT_GRAVITY * deltaTime;
          t.y += t.vy * deltaTime;
          t.x += t.vx * deltaTime;
        }
      }

      setTick((n) => n + 1);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isAnimating]);

  // --- Assets ---
  const perfectFont = useFont(
    require("@/assets/DMSans_18pt-ExtraLight.ttf"),
    24,
  );
  const { selectedSkinId } = useGameStore();
  const heroImage = useImage(
    selectedSkinId === "orange"
      ? require("@/assets/game/hero/orange.png")
      : selectedSkinId === "purple"
        ? require("@/assets/game/hero/purple.png")
        : require("@/assets/game/hero/black.png"),
  );

  useEffect(() => {
    if (perfectFont && heroImage && onAssetsLoaded) onAssetsLoaded();
  }, [perfectFont, heroImage, onAssetsLoaded]);

  if (!perfectFont || !heroImage) return <View style={{ flex: 1 }} />;

  // --- Render Prep ---
  const renderState = getRenderState();
  const heroSize = VISUAL_CONFIG.HERO_SIZE;
  const heroHalf = heroSize / 2;
  const platformY = VISUAL_CONFIG.CANVAS_H - VISUAL_CONFIG.PLATFORM_H;
  const stickOriginY = platformY;

  return (
    <View style={{ flex: 1 }} className="relative">
      <Canvas style={{ flex: 1 }} pointerEvents="none">
        {/* Background */}
        <Rect x={0} y={0} width={SCREEN_WIDTH} height={canvasHeight}>
          <LinearGradient
            start={vec(0, canvasHeight - VISUAL_CONFIG.CANVAS_H)}
            end={vec(0, canvasHeight)}
            colors={[VISUAL_CONFIG.COLORS.BG_TOP, VISUAL_CONFIG.COLORS.BG_BOT]}
          />
        </Rect>

        <Group
          transform={[
            { translateX: -renderState.cameraX },
            { translateY: worldOffsetY },
          ]}
        >
          {/* Platforms with Culling */}
          {renderState.platforms
            .filter(
              (p) =>
                p.x + p.w > renderState.cameraX - 100 &&
                p.x < renderState.cameraX + SCREEN_WIDTH + 100,
            )
            .map((p) => (
              <Group key={`plat-${p.index}`}>
                <Rect
                  x={p.x}
                  y={platformY + 8}
                  width={p.w}
                  height={VISUAL_CONFIG.PLATFORM_H}
                  color={VISUAL_CONFIG.COLORS.PLATFORM_SIDE}
                />
                <Rect
                  x={p.x}
                  y={platformY}
                  width={p.w}
                  height={VISUAL_CONFIG.PLATFORM_H}
                >
                  <LinearGradient
                    start={vec(p.x, platformY + VISUAL_CONFIG.PLATFORM_H)}
                    end={vec(p.x, platformY)}
                    colors={["rgba(253, 157, 65, 0.81)", "#FC6432"]}
                    positions={[0.81, 1]}
                  />
                </Rect>
                <Rect
                  x={p.x}
                  y={platformY}
                  width={p.w}
                  height={6}
                  color="#282828"
                />
                <Rect
                  x={p.x + p.w / 2 - 4}
                  y={platformY + 6}
                  width={8}
                  height={8}
                  color={VISUAL_CONFIG.COLORS.BG_BOT}
                />
              </Group>
            ))}

          {/* Stick Origin Logic */}
          {renderState.platforms[0] && (
            <BridgeStick
              originX={renderState.platforms[0].x + renderState.platforms[0].w}
              originY={stickOriginY}
              length={renderState.stick.length}
              width={VISUAL_CONFIG.STICK_WIDTH}
              rotation={renderState.stick.rotation}
              color={VISUAL_CONFIG.COLORS.BRAND}
              shadowColor={VISUAL_CONFIG.COLORS.BRAND_DARK}
            />
          )}

          {/* Ghost Preview */}
          {showGhostPreview &&
            renderState.phase === "GROWING" &&
            renderState.platforms[0] && (
              <Group>
                <Rect
                  x={renderState.platforms[0].x + renderState.platforms[0].w}
                  y={stickOriginY - VISUAL_CONFIG.STICK_WIDTH / 2}
                  width={renderState.stick.length}
                  height={VISUAL_CONFIG.STICK_WIDTH}
                  color="rgba(0, 0, 0, 0.2)"
                />
                <Rect
                  x={
                    renderState.platforms[0].x +
                    renderState.platforms[0].w +
                    renderState.stick.length -
                    4
                  }
                  y={stickOriginY - VISUAL_CONFIG.STICK_WIDTH / 2}
                  width={6}
                  height={VISUAL_CONFIG.STICK_WIDTH}
                  color="#DC2626"
                />
              </Group>
            )}

          {/* Hero */}
          <Group
            origin={{
              x: renderState.hero.x + heroHalf,
              y: renderState.hero.y + heroHalf,
            }}
            transform={[
              { rotate: (renderState.hero.rotation * Math.PI) / 180 },
            ]}
          >
            <Group transform={[{ scale: heroSize / 82 }]}>
              <Image
                image={heroImage}
                x={renderState.hero.x * (82 / heroSize)}
                y={renderState.hero.y * (82 / heroSize)}
                width={82}
                height={82}
              />
            </Group>
          </Group>

          {/* Particles */}
          {particlesRef.current.map((p, i) => {
            if (p.life <= 0) return null;
            return (
              <Circle
                key={`p-${i}`}
                cx={p.x}
                cy={p.y}
                r={p.size}
                color={p.color}
                opacity={p.life * p.life}
              />
            );
          })}

          {/* Perfect Text */}
          {perfectTextsRef.current.map((t, i) => (
            <Group key={`pt-${i}`} opacity={t.life * t.life}>
              <Text
                x={t.x - 39}
                y={t.y + 1}
                text="PERFECT! X3"
                font={perfectFont}
                color="rgba(0,0,0,0.18)"
              />
              <Text
                x={t.x - 40}
                y={t.y}
                text="PERFECT! X3"
                font={perfectFont}
                color={VISUAL_CONFIG.COLORS.BRAND}
              />
            </Group>
          ))}
        </Group>
      </Canvas>

      <Pressable
        className="absolute inset-0"
        onPressIn={onInputDown}
        onPressOut={onInputUp}
      />
    </View>
  );
};

export default BridgeGameCanvas;
