import { useCallback, useEffect, useState } from "react";

import type { EngineEvent } from "../types";

type UseEngineRunnerOptions = {
  engine: { step: (isPlaying: boolean, deltaTime: number) => EngineEvent[] };
  isPlaying: boolean;
  onEvents: (events: EngineEvent[]) => void;
};

export const useEngineRunner = ({
  engine,
  isPlaying,
  onEvents,
}: UseEngineRunnerOptions) => {
  const [renderTick, setRenderTick] = useState(0);

  const step = useCallback(
    (deltaTime: number) => {
      const events = engine.step(isPlaying, deltaTime);
      if (events.length) {
        onEvents(events);
      }
      setRenderTick((tick) => tick + 1);
    },
    [engine, isPlaying, onEvents],
  );

  useEffect(() => {
    if (!isPlaying) return;
    let frameId: number;
    let lastTime = performance.now();
    const loop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      step(deltaTime);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, step]);

  return { renderTick };
};
