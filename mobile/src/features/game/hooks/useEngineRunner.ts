import { useCallback, useEffect, useRef } from "react";
import { Platform } from "react-native";

import type { EngineEvent } from "../types";

export type UseEngineRunnerOptions = {
  engine: { step: (isPlaying: boolean, deltaTime: number) => EngineEvent[] };
  isPlaying: boolean;
  onEvents: (events: EngineEvent[]) => void;
};

export const useEngineRunner = ({
  engine,
  isPlaying,
  onEvents,
}: UseEngineRunnerOptions): void => {
  const frameCountRef = useRef(0);
  const fpsStartTimeRef = useRef(0);
  const engineTimeSumRef = useRef(0);
  const engineTimeMaxRef = useRef(0);
  const totalTimeSumRef = useRef(0);
  const totalTimeMaxRef = useRef(0);
  const restartCountRef = useRef(0);
  const onEventsRef = useRef(onEvents);
  const isPlayingRef = useRef(isPlaying);
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    onEventsRef.current = onEvents;
  }, [onEvents]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const step = useCallback(
    (deltaTime: number) => {
      const stepStartTime = __DEV__ ? performance.now() : 0;
      const events = engine.step(isPlayingRef.current, deltaTime);
      const stepEndTime = __DEV__ ? performance.now() : 0;
      const engineTime = __DEV__ ? stepEndTime - stepStartTime : 0;
      if (events.length) {
        onEventsRef.current(events);
      }
      if (__DEV__) {
        engineTimeSumRef.current += engineTime;
        if (engineTime > engineTimeMaxRef.current) {
          engineTimeMaxRef.current = engineTime;
        }
        const totalTime = performance.now() - stepStartTime;
        totalTimeSumRef.current += totalTime;
        if (totalTime > totalTimeMaxRef.current) {
          totalTimeMaxRef.current = totalTime;
        }
      }
    },
    [engine],
  );

  useEffect(() => {
    let frameId: number;
    let lastTime = performance.now();
    const loop = (currentTime: number) => {
      const isPlayingNow = isPlayingRef.current;
      if (isPlayingNow) {
        if (!wasPlayingRef.current) {
          restartCountRef.current += 1;
          if (__DEV__) {
            console.log(
              `[PERF-${Platform.OS.toUpperCase()}] Game loop starting (restart count: ${restartCountRef.current})`,
            );
            fpsStartTimeRef.current = performance.now();
            frameCountRef.current = 0;
            engineTimeSumRef.current = 0;
            engineTimeMaxRef.current = 0;
            totalTimeSumRef.current = 0;
            totalTimeMaxRef.current = 0;
          }
          lastTime = currentTime;
        }

        const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;
        step(deltaTime);
        frameCountRef.current += 1;
        if (__DEV__ && frameCountRef.current % 60 === 0) {
          const elapsed = (performance.now() - fpsStartTimeRef.current) / 1000;
          const fps = frameCountRef.current / elapsed;
          const avgEngineTime =
            frameCountRef.current > 0
              ? engineTimeSumRef.current / frameCountRef.current
              : 0;
          const avgTotalTime =
            frameCountRef.current > 0
              ? totalTimeSumRef.current / frameCountRef.current
              : 0;
          const avgDeltaTime = (elapsed / frameCountRef.current) * 1000;

          console.log(
            `[PERF-${Platform.OS.toUpperCase()}] FPS: ${fps.toFixed(1)} | ` +
              `Avg dt: ${avgDeltaTime.toFixed(2)}ms | ` +
              `Avg Engine: ${avgEngineTime.toFixed(2)}ms | ` +
              `Max Engine: ${engineTimeMaxRef.current.toFixed(2)}ms | ` +
              `Avg Total: ${avgTotalTime.toFixed(2)}ms | ` +
              `Max Total: ${totalTimeMaxRef.current.toFixed(2)}ms`,
          );

          fpsStartTimeRef.current = performance.now();
          frameCountRef.current = 0;
          engineTimeSumRef.current = 0;
          engineTimeMaxRef.current = 0;
          totalTimeSumRef.current = 0;
          totalTimeMaxRef.current = 0;
        }
      } else if (wasPlayingRef.current) {
        if (__DEV__) {
          console.log(`[PERF-${Platform.OS.toUpperCase()}] Game loop stopped`);
        }
        lastTime = currentTime;
      } else {
        lastTime = currentTime;
      }

      wasPlayingRef.current = isPlayingNow;
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [step]);
};
