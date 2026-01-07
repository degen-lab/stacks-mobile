import { REFERRAL_BONUS } from '../../shared/constants';
import { User } from '../entities/user';

export class UserDomainService {
  createUser(
    googleId: string,
    nickName: string,
    photoUri?: string,
    referrer?: User,
  ) {
    const user = new User();

    user.googleId = googleId;
    user.nickName = nickName;
    user.referrer = referrer;
    user.referralCode = this.generateReferralCode(googleId);
    user.photoUri = photoUri;
    return user;
  }

  increaseUserPoints(user: User, sessionScore: number) {
    const boostRate = this.boost(user.streak);
    const points = this.scoreToPoints(sessionScore);
    const finalResult = points + boostRate * points;
    // Round to integer since database column is integer
    const roundedResult = Math.round(finalResult);
    user.incrementPoints(roundedResult);
    return roundedResult;
  }

  addReferrerBonus(referrer: User) {
    referrer.incrementPoints(REFERRAL_BONUS);
  }

  private generateReferralCode(value: string) {
    return Buffer.from(value).toString('hex').slice(0, 8).toUpperCase();
  }

  private scoreToPoints(score: number) {
    return Math.round(score * 0.1);
  }

  private boost(streak: number) {
    return Math.min(0.5, Math.log(streak + 1) / 7);
  }
}
