import { useCallback, useEffect, useRef, useState } from "react";

import {
  Canvas,
  Circle,
  Group,
  ImageSVG,
  LinearGradient,
  Rect,
  Text,
  useFont,
  useSVG,
  vec,
} from "@shopify/react-native-skia";

import { Pressable, View } from "@/components/ui";
import { useGameStore } from "@/lib/store/game";

import { getSkinById } from "@/features/play/components/skins/types";
import { BRIDGE_CONFIG, SCREEN_WIDTH } from "../constants";
import type { Particle, RenderState } from "../types";
import BlockBuilderStick from "./BlockBuilderStick";

type BridgeCanvasProps = {
  state: RenderState;
  canvasHeight: number;
  worldOffsetY: number;
  renderTick: number;
  isAnimating?: boolean;
  onInputDown: () => void;
  onInputUp: () => void;
  onEmitterReady?: (
    spawn: (x: number, y: number, color: string, count?: number) => void,
  ) => void;
  perfectCue?: { x: number; y: number; createdAt: number } | null;
  showGhostPreview?: boolean;
};

const PLATFORM_SPAWN_MS = 100;
const PLATFORM_SPAWN_OFFSET = 40;

const BridgeCanvas = ({
  state,
  canvasHeight,
  worldOffsetY,
  renderTick: _renderTick,
  isAnimating = true,
  onInputDown,
  onInputUp,
  onEmitterReady,
  perfectCue,
  showGhostPreview = false,
}: BridgeCanvasProps) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const [perfectTexts, setPerfectTexts] = useState<
    { x: number; y: number; vx: number; vy: number; life: number }[]
  >([]);
  const perfectTextsRef = useRef<
    { x: number; y: number; vx: number; vy: number; life: number }[]
  >([]);
  const platformSpawnTimesRef = useRef<Map<number, number>>(new Map());

  const spawnParticles = useCallback(
    (x: number, y: number, color: string, count = 14) => {
      const next = particlesRef.current.slice();
      for (let i = 0; i < count; i++) {
        next.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 220,
          vy: (Math.random() - 0.5) * 220 - 140,
          life: 1,
          color,
          size: 5 + Math.random() * 6,
        });
      }
      particlesRef.current = next;
      setParticles(next);
    },
    [],
  );

  useEffect(() => {
    onEmitterReady?.(spawnParticles);
  }, [onEmitterReady, spawnParticles]);

  useEffect(() => {
    if (!perfectCue) return;
    const next = perfectTextsRef.current.slice();
    next.push({
      x: perfectCue.x,
      y: perfectCue.y,
      vx: (Math.random() - 0.5) * 80,
      vy: -180 - Math.random() * 60,
      life: 1,
    });
    perfectTextsRef.current = next;
    setPerfectTexts(next);
  }, [perfectCue]);

  useEffect(() => {
    if (!isAnimating) return;
    let frameId: number;
    let lastTime = performance.now();

    const tick = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const next: Particle[] = [];
      for (const p of particlesRef.current) {
        const life = p.life - deltaTime * 1.6;
        if (life <= 0) continue;
        const vx = p.vx;
        const vy = p.vy + 320 * deltaTime;
        const x = p.x + vx * deltaTime;
        const y = p.y + vy * deltaTime;
        next.push({ ...p, x, y, vx, vy, life });
      }

      particlesRef.current = next;
      setParticles(next);

      const nextTexts: typeof perfectTextsRef.current = [];
      for (const t of perfectTextsRef.current) {
        const life = t.life - deltaTime * 0.8;
        if (life <= 0) continue;
        const vx = t.vx * 0.99;
        const vy = t.vy + 420 * deltaTime;
        const x = t.x + vx * deltaTime;
        const y = t.y + vy * deltaTime;
        nextTexts.push({ ...t, x, y, vx, vy, life });
      }
      perfectTextsRef.current = nextTexts;
      setPerfectTexts(nextTexts);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isAnimating]);

  const perfectFont = useFont(
    require("@/assets/DMSans_18pt-ExtraLight.ttf"),
    24,
  );

  const { selectedSkinId } = useGameStore();
  const selectedSkin = getSkinById(selectedSkinId);
  const heroSvg = useSVG(selectedSkin.icon);
  const heroSize = BRIDGE_CONFIG.HERO_SIZE;
  const heroHalf = heroSize / 2;

  const stickOriginX = state.platforms[0]
    ? state.platforms[0].x + state.platforms[0].w
    : 0;
  const stickOriginY = BRIDGE_CONFIG.CANVAS_H - BRIDGE_CONFIG.PLATFORM_H;

  const now = performance.now();
  const platformSpawnTimes = platformSpawnTimesRef.current;
  const visiblePlatformIndices = new Set(state.platforms.map((p) => p.index));
  state.platforms.forEach((p) => {
    if (p.index === 0) return;
    if (!platformSpawnTimes.has(p.index)) {
      platformSpawnTimes.set(p.index, now);
    }
  });
  platformSpawnTimes.forEach((_, key) => {
    if (!visiblePlatformIndices.has(key)) {
      platformSpawnTimes.delete(key);
    }
  });

  return (
    <View className="relative flex-1">
      <Canvas style={{ flex: 1 }} pointerEvents="none">
        <Rect x={0} y={0} width={SCREEN_WIDTH} height={canvasHeight}>
          <LinearGradient
            start={vec(0, canvasHeight - BRIDGE_CONFIG.CANVAS_H)}
            end={vec(0, canvasHeight)}
            colors={[BRIDGE_CONFIG.COLORS.BG_TOP, BRIDGE_CONFIG.COLORS.BG_BOT]}
          />
        </Rect>

        <Group
          transform={[
            { translateX: -state.cameraX },
            { translateY: worldOffsetY },
          ]}
        >
          {state.platforms.map((p) => {
            const platformY = BRIDGE_CONFIG.CANVAS_H - BRIDGE_CONFIG.PLATFORM_H;
            const spawnTime =
              p.index === 0 ? now : (platformSpawnTimes.get(p.index) ?? now);
            const spawnProgress =
              p.index === 0
                ? 1
                : Math.min(1, (now - spawnTime) / PLATFORM_SPAWN_MS);
            const spawnOffset = (1 - spawnProgress) * PLATFORM_SPAWN_OFFSET;
            return (
              <Group
                key={`plat-${p.index}`}
                transform={[{ translateY: spawnOffset }]}
              >
                {/* Platform side */}
                <Rect
                  x={p.x}
                  y={platformY + 8}
                  width={p.w}
                  height={BRIDGE_CONFIG.PLATFORM_H}
                  color={BRIDGE_CONFIG.COLORS.PLATFORM_SIDE}
                />
                <Rect
                  x={p.x}
                  y={platformY}
                  width={p.w}
                  height={BRIDGE_CONFIG.PLATFORM_H}
                >
                  <LinearGradient
                    start={vec(p.x, platformY + BRIDGE_CONFIG.PLATFORM_H)}
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
                  color={BRIDGE_CONFIG.COLORS.BG_BOT}
                />
              </Group>
            );
          })}

          {showGhostPreview && state.phase === "GROWING" ? (
            <>
              <Rect
                x={stickOriginX}
                y={stickOriginY - BRIDGE_CONFIG.STICK_WIDTH / 2}
                width={state.stick.length}
                height={BRIDGE_CONFIG.STICK_WIDTH}
                color="rgba(0, 0, 0, 0.2)"
              />
              <Rect
                x={stickOriginX + state.stick.length - 4}
                y={stickOriginY - BRIDGE_CONFIG.STICK_WIDTH / 2}
                width={6}
                height={BRIDGE_CONFIG.STICK_WIDTH}
                color="#DC2626"
              />
            </>
          ) : null}

          <BlockBuilderStick
            originX={stickOriginX}
            originY={stickOriginY}
            length={state.stick.length}
            width={BRIDGE_CONFIG.STICK_WIDTH}
            rotation={state.stick.rotation}
            color={BRIDGE_CONFIG.COLORS.BRAND}
            shadowColor={BRIDGE_CONFIG.COLORS.BRAND_DARK}
          />

          <Group
            origin={{ x: state.hero.x + heroHalf, y: state.hero.y + heroHalf }}
            transform={[{ rotate: (state.hero.rotation * Math.PI) / 180 }]}
          >
            {heroSvg ? (
              <Group
                transform={[
                  { translateX: state.hero.x },
                  { translateY: state.hero.y },
                  { scale: heroSize / 82 },
                ]}
              >
                <ImageSVG svg={heroSvg} x={0} y={0} width={82} height={82} />
              </Group>
            ) : (
              <>
                <Rect
                  x={state.hero.x}
                  y={state.hero.y}
                  width={heroSize}
                  height={heroSize}
                  color={BRIDGE_CONFIG.COLORS.BRAND}
                />
                <Circle
                  cx={state.hero.x + 8}
                  cy={state.hero.y + 8}
                  r={3}
                  color="white"
                />
                <Circle
                  cx={state.hero.x + 16}
                  cy={state.hero.y + 8}
                  r={3}
                  color="white"
                />
              </>
            )}
          </Group>

          {particles.map((p, i) => (
            <Circle
              key={`part-${i}`}
              cx={p.x}
              cy={p.y}
              r={p.size}
              color={p.color}
              opacity={Math.max(0, Math.min(1, p.life * p.life))}
            />
          ))}

          {perfectFont
            ? perfectTexts.map((t, i) => {
                const text = "PERFECT! X3";
                const width = perfectFont.getTextWidth(text);
                const opacity = Math.max(0, Math.min(1, t.life * t.life));
                return (
                  <Group key={`perfect-${i}`}>
                    <Text
                      x={t.x - width / 2 + 1}
                      y={t.y + 1}
                      text={text}
                      color="rgba(0,0,0,0.18)"
                      opacity={opacity}
                      font={perfectFont}
                    />
                    <Text
                      x={t.x - width / 2}
                      y={t.y}
                      text={text}
                      color={BRIDGE_CONFIG.COLORS.BRAND}
                      opacity={opacity}
                      font={perfectFont}
                    />
                  </Group>
                );
              })
            : null}
        </Group>
      </Canvas>

      <Pressable
        className="absolute inset-0"
        onPressIn={onInputDown}
        onPressOut={onInputUp}
        style={{ zIndex: 0 }}
      />
    </View>
  );
};

export default BridgeCanvas;
