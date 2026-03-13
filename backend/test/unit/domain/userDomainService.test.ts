import { UserDomainService } from '../../../src/domain/service/userDomainService';
import { User } from '../../../src/domain/entities/user';
import { InvalidAmountError } from '../../../src/domain/errors/userErrors';
import { REFERRAL_BONUS } from '../../../src/shared/constants';

describe('UserDomainService domain class Unit tests', () => {
  let userDomainService: UserDomainService;
  let testUser: User;

  beforeEach(() => {
    userDomainService = new UserDomainService();
    testUser = new User();
    testUser.googleId = 'mockedId';
    testUser.nickName = 'nick';
    testUser.referralCode = 'referralCode';
    testUser.points = 100;
    testUser.streak = 5;
    testUser.referees = [];
    testUser.submissions = [];
    testUser.items = [];
  });

  describe('increaseUserPoints invariant', () => {
    it('should increase user points successfully with positive session score', () => {
      const initialPoints = testUser.points;
      const sessionScore = 100;

      userDomainService.increaseUserPoints(testUser, sessionScore);

      expect(testUser.points).toBeGreaterThan(initialPoints);
    });

    it('should handle negative session score by converting to 0 points', () => {
      // Negative scores are converted to 0 points via Math.floor
      // scoreToPoints(-1000) = Math.floor(-100) = -100
      // But boost is always positive, so finalResult could be negative
      // This tests that the error from incrementPoints is properly propagated
      testUser.points = 0;
      testUser.streak = 0;
      const sessionScore = -1000;

      // scoreToPoints(-1000) = -100, boost(0) ≈ 0, finalResult = -100
      // This will throw InvalidAmountError from incrementPoints
      expect(() => {
        userDomainService.increaseUserPoints(testUser, sessionScore);
      }).toThrow(InvalidAmountError);
    });

    it('should apply boost rate correctly based on streak', () => {
      testUser.points = 0;
      testUser.streak = 10;
      const sessionScore = 100;

      userDomainService.increaseUserPoints(testUser, sessionScore);

      // With streak 10, boost should be applied
      // Base points: Math.round(100 * 0.1) = 10
      // Boost: Math.min(0.5, Math.log(11) / 7) ≈ 0.34
      // Final: 10 + 0.34 * 10 = 13.4, rounded to 13
      expect(testUser.points).toBeGreaterThan(10);
    });

    it('should compute points formula correctly: basePoints = round(score * 0.1)', () => {
      testUser.points = 0;
      testUser.streak = 0; // No boost

      // score 100 -> basePoints = 10, boost(0) = 0, final = 10
      userDomainService.increaseUserPoints(testUser, 100);
      expect(testUser.points).toBe(10);

      testUser.points = 0;
      userDomainService.increaseUserPoints(testUser, 250);
      expect(testUser.points).toBe(25);

      testUser.points = 0;
      userDomainService.increaseUserPoints(testUser, 999);
      expect(testUser.points).toBe(100);
    });

    it('should compute boost correctly: min(0.5, log(streak+1)/7)', () => {
      testUser.points = 0;
      testUser.streak = 0;
      userDomainService.increaseUserPoints(testUser, 100);
      expect(testUser.points).toBe(10); // boost=0

      testUser.points = 0;
      testUser.streak = 6; // log(7)/7 ≈ 0.278
      userDomainService.increaseUserPoints(testUser, 100);
      const expectedBoost = Math.min(0.5, Math.log(7) / 7);
      const expectedPoints = Math.round(10 + expectedBoost * 10);
      expect(testUser.points).toBe(expectedPoints);

      testUser.points = 0;
      testUser.streak = 20; // log(21)/7 ≈ 0.43, capped below 0.5
      userDomainService.increaseUserPoints(testUser, 100);
      const expectedBoost20 = Math.min(0.5, Math.log(21) / 7);
      const expectedPoints20 = Math.round(10 + expectedBoost20 * 10);
      expect(testUser.points).toBe(expectedPoints20);
    });

    it('should cap boost at 0.5 for high streaks', () => {
      testUser.points = 0;
      testUser.streak = 1000; // log(1001)/7 ≈ 0.99, capped to 0.5
      userDomainService.increaseUserPoints(testUser, 100);
      // basePoints=10, boost=0.5, final = 10 + 5 = 15
      expect(testUser.points).toBe(15);
    });

    it('should handle zero session score', () => {
      const initialPoints = testUser.points;
      const sessionScore = 0;

      userDomainService.increaseUserPoints(testUser, sessionScore);

      // scoreToPoints(0) = 0, so points should remain the same
      expect(testUser.points).toEqual(initialPoints);
    });
  });

  describe('addReferrerBonus', () => {
    it('should add referral bonus points to referrer', () => {
      const initialPoints = testUser.points;

      userDomainService.addReferrerBonus(testUser);

      expect(testUser.points).toEqual(initialPoints + REFERRAL_BONUS);
    });

    it('should add correct referral bonus when points start at zero', () => {
      testUser.points = 0;

      userDomainService.addReferrerBonus(testUser);

      expect(testUser.points).toEqual(REFERRAL_BONUS);
    });

    it('should accumulate referral bonuses correctly', () => {
      testUser.points = 50;

      userDomainService.addReferrerBonus(testUser);
      expect(testUser.points).toEqual(50 + REFERRAL_BONUS);

      const pointsAfterFirst = testUser.points;
      userDomainService.addReferrerBonus(testUser);
      expect(testUser.points).toEqual(pointsAfterFirst + REFERRAL_BONUS);
    });
  });
});
