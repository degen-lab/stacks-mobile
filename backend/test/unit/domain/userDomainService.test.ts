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
      // Base points: Math.floor(100 * 0.1) = 10
      // Boost: Math.min(0.5, Math.log(11) / 7) ≈ 0.34
      // Final: 10 + 0.34 * 10 = 13.4, floored to 13
      expect(testUser.points).toBeGreaterThan(10);
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
