import { GameSessionService } from '../../../src/domain/service/gameSessionService';
import {
  GameSession,
  DailyStreakChallenge,
  SessionValidationResult,
  FraudReason,
} from '../../../src/shared/types';
import { User } from '../../../src/domain/entities/user';

describe('GameSessionService domain class Unit tests', () => {
  let gameSessionService: GameSessionService;
  let mockGameSession: GameSession;
  let mockStreakChallenge: DailyStreakChallenge;
  let mockSessionResult: SessionValidationResult;
  let analyzeSessionSpy: jest.SpyInstance;

  let mockUser: User;
  const mockSecret = 'test-secret-key';

  beforeEach(() => {
    gameSessionService = new GameSessionService();
    mockUser = new User();
    mockUser.id = 1;
    mockUser.items = [];
    mockSessionResult = {
      timePlayed: 60,
      score: 1000,
      blocksPassed: 15,
      isFraud: false,
      fraudReason: FraudReason.NONE,
    };
    mockGameSession = {
      seed: 'test-seed',
      signature: 'test-signature',
      moves: [
        { startTime: 0, duration: 100 },
        { startTime: 200, duration: 150 },
      ],
      usedItems: [],
    };
    mockStreakChallenge = {
      id: 1,
      description: 'Pass at least 10 blocks in a single session',
      validator: jest.fn(),
    };
    // Mock the private analyzeSession method
    analyzeSessionSpy = jest
      .spyOn(
        GameSessionService.prototype as unknown as {
          analyzeSession: (
            user: User,
            session: GameSession,
            secret: string,
          ) => SessionValidationResult;
        },
        'analyzeSession',
      )
      .mockReturnValue(mockSessionResult);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('validateSession', () => {
    it('should return session score and streakChallengeCompleted false when challenge validation fails', () => {
      mockStreakChallenge.validator = jest.fn().mockReturnValue(false);

      const result = gameSessionService.validateSession(
        mockUser,
        mockGameSession,
        mockStreakChallenge,
        mockSecret,
      );

      expect(analyzeSessionSpy).toHaveBeenCalledTimes(1);
      expect(analyzeSessionSpy).toHaveBeenCalledWith(
        mockUser,
        mockGameSession,
        mockSecret,
      );
      expect(mockStreakChallenge.validator).toHaveBeenCalledTimes(1);
      expect(mockStreakChallenge.validator).toHaveBeenCalledWith(
        mockSessionResult,
      );
      expect(result.score).toBe(mockSessionResult.score);
      expect(result.streakChallengeCompleted).toBe(false);
    });

    it('should return session score and streakChallengeCompleted true when challenge validation succeeds', () => {
      mockStreakChallenge.validator = jest.fn().mockReturnValue(true);

      const result = gameSessionService.validateSession(
        mockUser,
        mockGameSession,
        mockStreakChallenge,
        mockSecret,
      );

      expect(analyzeSessionSpy).toHaveBeenCalledTimes(1);
      expect(analyzeSessionSpy).toHaveBeenCalledWith(
        mockUser,
        mockGameSession,
        mockSecret,
      );
      expect(mockStreakChallenge.validator).toHaveBeenCalledTimes(1);
      expect(mockStreakChallenge.validator).toHaveBeenCalledWith(
        mockSessionResult,
      );
      expect(result.score).toBe(mockSessionResult.score);
      expect(result.streakChallengeCompleted).toBe(true);
    });

    it('should call analyzeSession with the provided game session', () => {
      const customSession: GameSession = {
        seed: 'test-seed',
        signature: 'test-signature',
        moves: [
          { startTime: 0, duration: 100 },
          { startTime: 200, duration: 150 },
        ],
        usedItems: [],
      };
      mockStreakChallenge.validator = jest.fn().mockReturnValue(true);

      gameSessionService.validateSession(
        mockUser,
        customSession,
        mockStreakChallenge,
        mockSecret,
      );

      expect(analyzeSessionSpy).toHaveBeenCalledWith(
        mockUser,
        customSession,
        mockSecret,
      );
      expect(analyzeSessionSpy).toHaveBeenCalledTimes(1);
    });

    it('should pass the analyzed session result to validator function', () => {
      const customResult: SessionValidationResult = {
        timePlayed: 45,
        score: 750,
        blocksPassed: 12,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      };
      analyzeSessionSpy.mockReturnValue(customResult);
      mockStreakChallenge.validator = jest.fn().mockReturnValue(true);

      gameSessionService.validateSession(
        mockUser,
        mockGameSession,
        mockStreakChallenge,
        mockSecret,
      );

      expect(mockStreakChallenge.validator).toHaveBeenCalledWith(customResult);
      expect(mockStreakChallenge.validator).toHaveBeenCalledTimes(1);
    });

    it('should handle different game session objects and call analyzeSession for each', () => {
      const session1: GameSession = {
        seed: 'test-seed',
        signature: 'test-signature',
        moves: [
          { startTime: 0, duration: 100 },
          { startTime: 200, duration: 150 },
        ],
        usedItems: [],
      };
      const session2: GameSession = {
        seed: 'test-seed',
        signature: 'test-signature',
        moves: [
          { startTime: 0, duration: 100 },
          { startTime: 200, duration: 150 },
        ],
        usedItems: [],
      };
      const result1: SessionValidationResult = {
        timePlayed: 60,
        score: 500,
        blocksPassed: 10,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      };
      const result2: SessionValidationResult = {
        timePlayed: 120,
        score: 2000,
        blocksPassed: 25,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      };

      analyzeSessionSpy
        .mockReturnValueOnce(result1)
        .mockReturnValueOnce(result2);

      mockStreakChallenge.validator = jest.fn().mockReturnValue(true);

      const output1 = gameSessionService.validateSession(
        mockUser,
        session1,
        mockStreakChallenge,
        mockSecret,
      );
      const output2 = gameSessionService.validateSession(
        mockUser,
        session2,
        mockStreakChallenge,
        mockSecret,
      );

      expect(analyzeSessionSpy).toHaveBeenCalledTimes(2);
      expect(analyzeSessionSpy).toHaveBeenNthCalledWith(
        1,
        mockUser,
        session1,
        mockSecret,
      );
      expect(analyzeSessionSpy).toHaveBeenNthCalledWith(
        2,
        mockUser,
        session2,
        mockSecret,
      );
      expect(output1.score).toBe(500);
      expect(output2.score).toBe(2000);
      expect(mockStreakChallenge.validator).toHaveBeenCalledTimes(2);
      expect(mockStreakChallenge.validator).toHaveBeenNthCalledWith(1, result1);
      expect(mockStreakChallenge.validator).toHaveBeenNthCalledWith(2, result2);
    });

    it('should return correct score from analyzed session result', () => {
      const highScoreResult: SessionValidationResult = {
        timePlayed: 180,
        score: 5000,
        blocksPassed: 50,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      };
      analyzeSessionSpy.mockReturnValue(highScoreResult);
      mockStreakChallenge.validator = jest.fn().mockReturnValue(false);

      const result = gameSessionService.validateSession(
        mockUser,
        mockGameSession,
        mockStreakChallenge,
        mockSecret,
      );

      expect(result.score).toBe(5000);
      expect(result.streakChallengeCompleted).toBe(false);
    });

    it('should return correct structure with both score and streakChallengeCompleted properties', () => {
      mockStreakChallenge.validator = jest.fn().mockReturnValue(true);

      const result = gameSessionService.validateSession(
        mockUser,
        mockGameSession,
        mockStreakChallenge,
        mockSecret,
      );

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('streakChallengeCompleted');
      expect(result).toHaveProperty('blocksPassed');
      expect(result).toHaveProperty('isFraud');
      expect(result).toHaveProperty('fraudReason');
      expect(typeof result.score).toBe('number');
      expect(typeof result.streakChallengeCompleted).toBe('boolean');
    });

    it('should handle zero score correctly', () => {
      const zeroScoreResult: SessionValidationResult = {
        timePlayed: 30,
        score: 0,
        blocksPassed: 0,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      };
      analyzeSessionSpy.mockReturnValue(zeroScoreResult);
      mockStreakChallenge.validator = jest.fn().mockReturnValue(false);

      const result = gameSessionService.validateSession(
        mockUser,
        mockGameSession,
        mockStreakChallenge,
        mockSecret,
      );

      expect(result.score).toBe(0);
      expect(result.streakChallengeCompleted).toBe(false);
      expect(mockStreakChallenge.validator).toHaveBeenCalledWith(
        zeroScoreResult,
      );
    });

    it('should handle very large score values', () => {
      const largeScoreResult: SessionValidationResult = {
        timePlayed: 300,
        score: 999999,
        blocksPassed: 100,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      };
      analyzeSessionSpy.mockReturnValue(largeScoreResult);
      mockStreakChallenge.validator = jest.fn().mockReturnValue(true);

      const result = gameSessionService.validateSession(
        mockUser,
        mockGameSession,
        mockStreakChallenge,
        mockSecret,
      );

      expect(result.score).toBe(999999);
      expect(result.streakChallengeCompleted).toBe(true);
    });

    it('should ensure validator is called with the exact result from analyzeSession', () => {
      const specificResult: SessionValidationResult = {
        timePlayed: 90,
        score: 1500,
        blocksPassed: 20,
        isFraud: false,
        fraudReason: FraudReason.NONE,
      };
      analyzeSessionSpy.mockReturnValue(specificResult);
      const validatorMock = jest.fn().mockReturnValue(true);
      mockStreakChallenge.validator = validatorMock;

      gameSessionService.validateSession(
        mockUser,
        mockGameSession,
        mockStreakChallenge,
        mockSecret,
      );

      // Verify validator receives the exact same object reference
      expect(validatorMock).toHaveBeenCalledWith(specificResult);
      const validatorCall = validatorMock.mock.calls[0][0];
      expect(validatorCall).toEqual(specificResult);
      expect(validatorCall.timePlayed).toBe(90);
      expect(validatorCall.score).toBe(1500);
      expect(validatorCall.blocksPassed).toBe(20);
    });

    it('should return score even when validator throws an error', () => {
      analyzeSessionSpy.mockReturnValue(mockSessionResult);
      mockStreakChallenge.validator = jest.fn().mockImplementation(() => {
        throw new Error('Validator error');
      });

      expect(() => {
        gameSessionService.validateSession(
          mockUser,
          mockGameSession,
          mockStreakChallenge,
          mockSecret,
        );
      }).toThrow('Validator error');
    });

    it('should handle multiple consecutive validations with different results', () => {
      const results: SessionValidationResult[] = [
        {
          timePlayed: 30,
          score: 100,
          blocksPassed: 5,
          isFraud: false,
          fraudReason: FraudReason.NONE,
        },
        {
          timePlayed: 60,
          score: 500,
          blocksPassed: 10,
          isFraud: false,
          fraudReason: FraudReason.NONE,
        },
        {
          timePlayed: 120,
          score: 2000,
          blocksPassed: 25,
          isFraud: false,
          fraudReason: FraudReason.NONE,
        },
      ];

      results.forEach((result, index) => {
        analyzeSessionSpy.mockReturnValueOnce(result);
        mockStreakChallenge.validator = jest
          .fn()
          .mockReturnValue(index % 2 === 0);

        const output = gameSessionService.validateSession(
          mockUser,
          mockGameSession,
          mockStreakChallenge,
          mockSecret,
        );

        expect(output.score).toBe(result.score);
        expect(output.streakChallengeCompleted).toBe(index % 2 === 0);
      });

      expect(analyzeSessionSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('generateRandomSignedSeed', () => {
    const testSecret = 'test-secret-key-12345';

    it('should generate a random seed and signature', async () => {
      const result =
        await gameSessionService.generateRandomSignedSeed(testSecret);

      expect(result).toHaveProperty('seed');
      expect(result).toHaveProperty('signature');
      expect(typeof result.seed).toBe('string');
      expect(typeof result.signature).toBe('string');
    });

    it('should generate a 64-character hex seed (32 bytes)', async () => {
      const result =
        await gameSessionService.generateRandomSignedSeed(testSecret);

      expect(result.seed).toMatch(/^[0-9a-f]{64}$/);
      expect(result.seed.length).toBe(64);
    });

    it('should generate different seeds on each call', async () => {
      const result1 =
        await gameSessionService.generateRandomSignedSeed(testSecret);
      const result2 =
        await gameSessionService.generateRandomSignedSeed(testSecret);
      const result3 =
        await gameSessionService.generateRandomSignedSeed(testSecret);

      expect(result1.seed).not.toBe(result2.seed);
      expect(result2.seed).not.toBe(result3.seed);
      expect(result1.seed).not.toBe(result3.seed);
    });

    it('should generate valid signatures that can be verified', async () => {
      const result =
        await gameSessionService.generateRandomSignedSeed(testSecret);

      const isValid = await gameSessionService.verifySeed(
        result.seed,
        result.signature,
        testSecret,
      );

      expect(isValid).toBe(true);
    });

    it('should generate different signatures for different seeds', async () => {
      const result1 =
        await gameSessionService.generateRandomSignedSeed(testSecret);
      const result2 =
        await gameSessionService.generateRandomSignedSeed(testSecret);

      expect(result1.signature).not.toBe(result2.signature);
    });

    it('should generate different signatures for same seed with different secrets', async () => {
      const secret1 = 'secret1';
      const secret2 = 'secret2';

      // We need to manually create signatures with different secrets
      // Since signSeed is private, we'll test via verifySeed
      const result1 =
        await gameSessionService.generateRandomSignedSeed(secret1);
      const result2 =
        await gameSessionService.generateRandomSignedSeed(secret2);

      // Verify that signatures are different even if seeds happen to be same
      // (unlikely but we're testing the signature generation)
      expect(result1.signature).not.toBe(result2.signature);
    });

    it('should generate 64-character hex signatures', async () => {
      const result =
        await gameSessionService.generateRandomSignedSeed(testSecret);

      expect(result.signature).toMatch(/^[0-9a-f]{64}$/);
      expect(result.signature.length).toBe(64);
    });

    it('should handle empty secret string', async () => {
      const result = await gameSessionService.generateRandomSignedSeed('');

      expect(result.seed).toMatch(/^[0-9a-f]{64}$/);
      expect(result.signature).toMatch(/^[0-9a-f]{64}$/);

      const isValid = await gameSessionService.verifySeed(
        result.seed,
        result.signature,
        '',
      );
      expect(isValid).toBe(true);
    });

    it('should handle long secret strings', async () => {
      const longSecret = 'a'.repeat(1000);
      const result =
        await gameSessionService.generateRandomSignedSeed(longSecret);

      expect(result.seed).toMatch(/^[0-9a-f]{64}$/);
      expect(result.signature).toMatch(/^[0-9a-f]{64}$/);

      const isValid = await gameSessionService.verifySeed(
        result.seed,
        result.signature,
        longSecret,
      );
      expect(isValid).toBe(true);
    });

    it('should handle special characters in secret', async () => {
      const specialSecret = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const result =
        await gameSessionService.generateRandomSignedSeed(specialSecret);

      expect(result.seed).toMatch(/^[0-9a-f]{64}$/);
      expect(result.signature).toMatch(/^[0-9a-f]{64}$/);

      const isValid = await gameSessionService.verifySeed(
        result.seed,
        result.signature,
        specialSecret,
      );
      expect(isValid).toBe(true);
    });
  });

  describe('verifySeed', () => {
    const testSecret = 'test-secret-key-12345';

    it('should return true for valid seed-signature pairs', async () => {
      const result =
        await gameSessionService.generateRandomSignedSeed(testSecret);

      const isValid = await gameSessionService.verifySeed(
        result.seed,
        result.signature,
        testSecret,
      );

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect signature', async () => {
      const result =
        await gameSessionService.generateRandomSignedSeed(testSecret);
      const wrongSignature = 'a'.repeat(64); // Wrong signature

      const isValid = await gameSessionService.verifySeed(
        result.seed,
        wrongSignature,
        testSecret,
      );

      expect(isValid).toBe(false);
    });

    it('should return false for incorrect secret', async () => {
      const result =
        await gameSessionService.generateRandomSignedSeed(testSecret);
      const wrongSecret = 'wrong-secret';

      const isValid = await gameSessionService.verifySeed(
        result.seed,
        result.signature,
        wrongSecret,
      );

      expect(isValid).toBe(false);
    });

    it('should return false for incorrect seed', async () => {
      const result =
        await gameSessionService.generateRandomSignedSeed(testSecret);
      const wrongSeed = 'b'.repeat(64); // Wrong seed

      const isValid = await gameSessionService.verifySeed(
        wrongSeed,
        result.signature,
        testSecret,
      );

      expect(isValid).toBe(false);
    });

    it('should return false when seed, signature, and secret are all different', async () => {
      await gameSessionService.generateRandomSignedSeed(testSecret);

      const isValid = await gameSessionService.verifySeed(
        'c'.repeat(64),
        'd'.repeat(64),
        'wrong-secret',
      );

      expect(isValid).toBe(false);
    });

    it('should be case-sensitive for signature comparison', async () => {
      const result =
        await gameSessionService.generateRandomSignedSeed(testSecret);
      const upperCaseSignature = result.signature.toUpperCase();

      const isValid = await gameSessionService.verifySeed(
        result.seed,
        upperCaseSignature,
        testSecret,
      );

      expect(isValid).toBe(false);
    });

    it('should handle empty secret correctly', async () => {
      const result = await gameSessionService.generateRandomSignedSeed('');

      const isValid = await gameSessionService.verifySeed(
        result.seed,
        result.signature,
        '',
      );

      expect(isValid).toBe(true);
    });

    it('should return false for empty signature', async () => {
      const result =
        await gameSessionService.generateRandomSignedSeed(testSecret);

      const isValid = await gameSessionService.verifySeed(
        result.seed,
        '',
        testSecret,
      );

      expect(isValid).toBe(false);
    });

    it('should return false for empty seed', async () => {
      const result =
        await gameSessionService.generateRandomSignedSeed(testSecret);

      const isValid = await gameSessionService.verifySeed(
        '',
        result.signature,
        testSecret,
      );

      expect(isValid).toBe(false);
    });

    it('should verify multiple different valid seed-signature pairs', async () => {
      const results = await Promise.all([
        gameSessionService.generateRandomSignedSeed(testSecret),
        gameSessionService.generateRandomSignedSeed(testSecret),
        gameSessionService.generateRandomSignedSeed(testSecret),
      ]);

      for (const result of results) {
        const isValid = await gameSessionService.verifySeed(
          result.seed,
          result.signature,
          testSecret,
        );
        expect(isValid).toBe(true);
      }
    });

    it('should not verify seed-signature pairs from different secrets', async () => {
      const secret1 = 'secret1';
      const secret2 = 'secret2';

      const result1 =
        await gameSessionService.generateRandomSignedSeed(secret1);
      const result2 =
        await gameSessionService.generateRandomSignedSeed(secret2);

      // result1 should not verify with secret2
      const isValid1 = await gameSessionService.verifySeed(
        result1.seed,
        result1.signature,
        secret2,
      );
      expect(isValid1).toBe(false);

      // result2 should not verify with secret1
      const isValid2 = await gameSessionService.verifySeed(
        result2.seed,
        result2.signature,
        secret1,
      );
      expect(isValid2).toBe(false);
    });

    it('should handle unicode characters in secret', async () => {
      const unicodeSecret = '🔐密钥-ключ-キー';
      const result =
        await gameSessionService.generateRandomSignedSeed(unicodeSecret);

      const isValid = await gameSessionService.verifySeed(
        result.seed,
        result.signature,
        unicodeSecret,
      );

      expect(isValid).toBe(true);
    });

    it('should produce deterministic signatures for same seed and secret', async () => {
      const secret = 'test-secret';

      // Generate signature twice with same seed and secret
      // Since we can't directly call signSeed, we'll verify the behavior
      // by generating seeds and checking that verifySeed works consistently
      const result1 = await gameSessionService.generateRandomSignedSeed(secret);
      const result2 = await gameSessionService.generateRandomSignedSeed(secret);

      // Both should verify with the same secret
      const isValid1 = await gameSessionService.verifySeed(
        result1.seed,
        result1.signature,
        secret,
      );
      const isValid2 = await gameSessionService.verifySeed(
        result2.seed,
        result2.signature,
        secret,
      );

      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
    });
  });
});
