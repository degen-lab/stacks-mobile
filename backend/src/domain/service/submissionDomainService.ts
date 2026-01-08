import { SubmissionType } from '../entities/enums';
import { Submission } from '../entities/submission';
import { User } from '../entities/user';

export class SubmissionDomainService {
  createSubmission(
    address: string,
    score: number,
    tournamentId: number,
    type: SubmissionType,
    user: User,
    isSponsored: boolean,
  ) {
    const submission = new Submission();
    submission.validateStacksAddressInvariant(address);
    submission.stacksAddress = address;
    submission.score = score;
    submission.tournamentId = tournamentId;
    submission.user = user;
    submission.type = type;
    submission.isSponsored = isSponsored;
    return submission;
  }
}
