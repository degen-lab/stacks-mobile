import { Submission } from '../../../src/domain/entities/submission';
import { SubmissionDomainService } from '../../../src/domain/service/submissionDomainService';
import { SubmissionType } from '../../../src/domain/entities/enums';
import { User } from '../../../src/domain/entities/user';

describe('SubmissionDomainService domain class Unit tests', () => {
  let submissionDomainService: SubmissionDomainService;
  let testSubmission: Submission;
  beforeEach(() => {
    submissionDomainService = new SubmissionDomainService();
    testSubmission = new Submission();
    testSubmission.transactionId = 'mockedTxId';
    testSubmission.score = 100;
    testSubmission.tournamentId = 1;
    testSubmission.type = SubmissionType.WeeklyContest;
    testSubmission.user = new User();
    testSubmission.createdAt = new Date();
    testSubmission.isSponsored = false;
  });

  describe('createSubmission invariant', () => {
    it('should create a submission successfully', () => {
      // Use a valid Stacks address (base32: A-Z, 2-7, exactly 41 chars)
      // Base32 doesn't include 0, 1, 8, 9 - only A-Z and 2-7
      const validAddress = 'ST2CY5V3NHDPWSXMWQDT3HC3GD6Q6XX4CFRKAG';
      // Ensure it's exactly 41 characters
      const paddedAddress = validAddress.padEnd(41, 'A').substring(0, 41);
      const submission = submissionDomainService.createSubmission(
        testSubmission.stacksAddress || paddedAddress,
        testSubmission.score,
        testSubmission.tournamentId,
        testSubmission.type,
        testSubmission.user,
        testSubmission.isSponsored,
      );
      expect(submission).toBeDefined();
      expect(submission.transactionId).toBeUndefined(); // transactionId is not set in createSubmission
      expect(submission.score).toEqual(100);
      expect(submission.tournamentId).toEqual(1);
      expect(submission.type).toEqual(SubmissionType.WeeklyContest);
      expect(submission.user).toEqual(testSubmission.user);
    });
  });
});
