import { SubmissionType } from '../../../src/domain/entities/enums';
import { Submission } from '../../../src/domain/entities/submission';
import { User } from '../../../src/domain/entities/user';
import { DailySponsoredRaffleSubmissionNumberMetError } from '../../../src/domain/errors/submissionError';
import { InvalidAmountError } from '../../../src/domain/errors/userErrors';

describe('User domain class Unit tests', () => {
  let testUser: User = new User();
  beforeEach(() => {
    testUser.googleId = 'mockedId';
    testUser.nickName = 'nick';
    testUser.referralCode = 'referralCode';
    testUser.points = 100;
    testUser.referees = [];
    testUser.submissions = [];
    testUser.items = [];
    testUser.createdAt = new Date();
  });

  describe('increment Points invariant', () => {
    it('should increment the points succesfully', () => {
      expect(testUser.points).toEqual(100);
      testUser.incrementPoints(20);
      expect(testUser.points).toEqual(120);
    });

    it('should throw an error if the amount is negative', () => {
      expect(() => {
        testUser.incrementPoints(-15);
      }).toThrow(InvalidAmountError);
    });
  });

  describe('sponsored raffle submission limits', () => {
    const addSubmission = (createdAt: Date, type = SubmissionType.Raffle) => {
      const s = new Submission();
      s.type = type;
      s.createdAt = createdAt;
      s.isSponsored = true;
      testUser.submissions.push(s);
    };

    it('allows a sponsored raffle submission when under the daily limit', () => {
      expect(() => testUser.canSubmitSponsoredRaffleSubmission()).not.toThrow();
    });

    it('throws when 3 sponsored raffles already submitted today', () => {
      addSubmission(new Date());
      addSubmission(new Date());
      addSubmission(new Date());

      expect(() => testUser.canSubmitSponsoredRaffleSubmission()).toThrow(
        DailySponsoredRaffleSubmissionNumberMetError,
      );
    });

    it('ignores submissions from previous days when counting today', () => {
      addSubmission(new Date('2025-12-07'));
      addSubmission(new Date('2025-12-07'));
      addSubmission(new Date()); // 1 today

      expect(() => testUser.canSubmitSponsoredRaffleSubmission()).not.toThrow();
    });
  });
});
