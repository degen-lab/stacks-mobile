import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { MAX_FRAUD_ATTEMPTS } from '../../shared/constants';
import { InsufficientPointsError } from '../errors/gameStoreErrors';
import {
  DailySponsoredRaffleSubmissionNumberMetError,
  DailySponsoredWeeklyContestSubmissionNumberMetError,
} from '../errors/submissionError';
import { InvalidAmountError } from '../errors/userErrors';
import { BaseAppEntity } from './baseAppEntity';
import { ConsumableItem } from './consumableItem';
import { DefaultItem } from './defaultItem';
import { PurchaseType, SubmissionType } from './enums';
import { FraudAttempt } from './fraudAttempt';
import { Submission } from './submission';
import { UniqueItem } from './uniqueItem';
import { CryptoPurchase } from './cryptoPurchase';
import { StackingData } from './stackingData';
import { DefiOperation } from './defiOperation';

@Entity()
export class User extends BaseAppEntity {
  @Column({ type: 'varchar', unique: true })
  googleId: string;
  @Column({ type: 'varchar' })
  nickName: string;
  @Column({ type: 'integer', default: 0 })
  points: number;
  @Column({ type: 'integer', default: 0 })
  streak: number;
  @Column({ type: 'date', nullable: true, default: undefined })
  lastStreakCompletionDate?: Date;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
  @Column({ type: 'varchar', unique: true })
  referralCode: string;
  @Column({ type: 'bool', default: false })
  isBlackListed: boolean;
  @Column({ type: 'text', nullable: true })
  photoUri?: string;
  @OneToMany(() => FraudAttempt, (fraudAttempt) => fraudAttempt.user, {
    cascade: true,
    nullable: true,
  })
  fraudAttempts: FraudAttempt[];
  @ManyToOne(() => User, (user) => user.referees, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  referrer?: User;

  @OneToMany(() => User, (user) => user.referrer, { cascade: true })
  referees: User[];
  @OneToMany(() => DefaultItem, (item) => item.user, { cascade: true })
  items: DefaultItem[];
  @OneToMany(() => Submission, (submission) => submission.user)
  submissions: Submission[];
  @OneToMany(() => CryptoPurchase, (transaction) => transaction.user, {
    cascade: true,
  })
  transactions: CryptoPurchase[];
  @OneToMany(() => StackingData, (stackingData) => stackingData.user, {
    cascade: true,
  })
  stackingData: StackingData[];
  @OneToMany(() => DefiOperation, (defiOperation) => defiOperation.user, {
    cascade: true,
  })
  defiOperationList: DefiOperation[];

  updateBlacklistStatus() {
    if (!this.fraudAttempts || this.fraudAttempts.length === 0) {
      this.isBlackListed = false;
      return;
    }
    this.isBlackListed = this.fraudAttempts.length > MAX_FRAUD_ATTEMPTS;
  }

  increaseStreak() {
    // Check if streak was already incremented today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (this.lastStreakCompletionDate) {
      const lastCompletion = new Date(this.lastStreakCompletionDate);
      lastCompletion.setHours(0, 0, 0, 0);

      // If already completed today, don't increment again
      if (lastCompletion.getTime() === today.getTime()) {
        return;
      }
    }

    this.streak += 1;
    this.lastStreakCompletionDate = new Date();
  }

  resetStreak(yesterday: Date) {
    if (this.lastStreakCompletionDate) {
      const lastCompletion = new Date(this.lastStreakCompletionDate);
      lastCompletion.setHours(0, 0, 0, 0);

      if (lastCompletion < yesterday) {
        this.streak = 0;
      }
    }
  }

  canSubmitSponsoredRaffleSubmission() {
    const today = new Date().toISOString().slice(0, 10);
    const dailySubmissions = this.submissions.filter((sub) => {
      return (
        sub.createdAt.toISOString().slice(0, 10) === today &&
        sub.type === SubmissionType.Raffle &&
        sub.isSponsored
      );
    });
    if (dailySubmissions.length === 3) {
      throw new DailySponsoredRaffleSubmissionNumberMetError();
    }
    return true;
  }

  canSubmitSponsoredWeeklyContestSubmission() {
    const today = new Date().toISOString().slice(0, 10);
    const dailySubmissions = this.submissions.filter((sub) => {
      return (
        sub.createdAt.toISOString().slice(0, 10) === today &&
        sub.type === SubmissionType.WeeklyContest &&
        sub.isSponsored
      );
    });
    // TODO: Change this back to 1
    if (dailySubmissions.length === 999) {
      throw new DailySponsoredWeeklyContestSubmissionNumberMetError();
    }
  }

  incrementPoints(amount: number) {
    if (amount < 0) {
      throw new InvalidAmountError();
    }
    this.points += amount;
  }

  addFraudAttempt(fraudAttempt: FraudAttempt) {
    if (!this.fraudAttempts) {
      this.fraudAttempts = [];
    }
    fraudAttempt.createdAt = new Date();
    this.fraudAttempts.push(fraudAttempt);
    this.updateBlacklistStatus();
  }
  purchaseConsumableItem(item: ConsumableItem) {
    if (item.purchaseType === PurchaseType.Points) {
      if (this.points < item.pointsPerUnit * item.quantity) {
        throw new InsufficientPointsError();
      }
      this.points -= item.pointsPerUnit * item.quantity;
    }
    // Find existing consumable item of the same type (check for 'quantity' property)
    const existingItem = this.items.find(
      (ownedItem) =>
        ownedItem.type === item.type &&
        'quantity' in ownedItem &&
        (ownedItem.metadata as { variant?: string })?.variant ===
          (item.metadata as { variant?: string })?.variant,
    ) as ConsumableItem | undefined;
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this.items.push(item);
    }
  }
  purchaseUniqueItem(item: UniqueItem) {
    if (item.purchaseType === PurchaseType.Points) {
      if (this.points < item.pointsSpent) {
        throw new InsufficientPointsError();
      }
      this.points -= item.pointsSpent;
    }
    this.items.push(item);
  }
}
