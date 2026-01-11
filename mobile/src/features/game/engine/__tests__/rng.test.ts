import { createRng, randomInt, randomRange } from "../rng";

describe("RNG Module", () => {
  describe("createRng", () => {
    it("should produce different sequences for different seeds", () => {
      const rng1 = createRng(100);
      const rng2 = createRng(200);

      const val1 = rng1();
      const val2 = rng2();

      expect(val1).not.toBe(val2);
    });

    it("should generate values between 0 and 1", () => {
      const rng = createRng(42);

      for (let i = 0; i < 100; i++) {
        const val = rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it("should produce consistent sequence when replayed", () => {
      const seed = 99999;
      const rng = createRng(seed);
      const sequence = [rng(), rng(), rng(), rng(), rng()];

      // Create new RNG with same seed
      const rngReplay = createRng(seed);
      const replaySequence = [
        rngReplay(),
        rngReplay(),
        rngReplay(),
        rngReplay(),
        rngReplay(),
      ];

      expect(sequence).toEqual(replaySequence);
    });
  });

  describe("randomInt", () => {
    it("should generate integers within specified range", () => {
      const rng = createRng(123);
      const min = 5;
      const max = 10;

      for (let i = 0; i < 50; i++) {
        const val = randomInt(rng, min, max);
        expect(val).toBeGreaterThanOrEqual(min);
        expect(val).toBeLessThan(max);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it("should handle single value range", () => {
      const rng = createRng(456);
      const val = randomInt(rng, 5, 6);
      expect(val).toBe(5);
    });

    it("should produce deterministic results", () => {
      const rng1 = createRng(789);
      const rng2 = createRng(789);

      expect(randomInt(rng1, 0, 100)).toBe(randomInt(rng2, 0, 100));
      expect(randomInt(rng1, 0, 100)).toBe(randomInt(rng2, 0, 100));
    });
  });

  describe("randomRange", () => {
    it("should generate floats within specified range", () => {
      const rng = createRng(321);
      const min = 10.5;
      const max = 20.5;

      for (let i = 0; i < 50; i++) {
        const val = randomRange(rng, min, max);
        expect(val).toBeGreaterThanOrEqual(min);
        expect(val).toBeLessThan(max);
      }
    });

    it("should handle same min and max", () => {
      const rng = createRng(654);
      const val = randomRange(rng, 5.5, 5.5);
      expect(val).toBe(5.5);
    });

    it("should produce deterministic results", () => {
      const rng1 = createRng(987);
      const rng2 = createRng(987);

      expect(randomRange(rng1, 0, 100)).toBe(randomRange(rng2, 0, 100));
      expect(randomRange(rng1, 0, 100)).toBe(randomRange(rng2, 0, 100));
    });

    it("should produce different values than randomInt for same seed", () => {
      const rng1 = createRng(111);
      const rng2 = createRng(111);

      const intVal = randomInt(rng1, 0, 100);
      const floatVal = randomRange(rng2, 0, 100);

      expect(Number.isInteger(intVal)).toBe(true);
      expect(Number.isInteger(floatVal)).toBe(false);
      expect(intVal).not.toBe(floatVal);
    });
  });
});
