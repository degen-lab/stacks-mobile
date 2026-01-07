// Mulberry32 PRNG: tiny, deterministic, suitable for gameplay randomness.
export const createRng = (seed: number) => {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

export const randomInt = (rng: () => number, min: number, max: number) => {
  // inclusive min, exclusive max
  return Math.floor(rng() * (max - min)) + min;
};

export const randomRange = (rng: () => number, min: number, max: number) => {
  return rng() * (max - min) + min;
};
