import type { AppToken } from "@/lib/assets/tokens";
import type { TransactionMethod } from "@/lib/enums";

export type AnalyticsEvents = {
  // Consent & sharing
  consent_saved: {
    analytics_enabled: boolean;
    ads_personalization_enabled: boolean;
  };
  share: { method: "link"; content_type: "referral"; item_id: "referral" };

  // Game
  game_started: void;
  game_completed: { score: number };
  score_submitted: { method: TransactionMethod };
  raffle_entered: { method: TransactionMethod };

  // Revive ads (in-game)
  revive_ad_shown: void;
  revive_ad_earned: void;
  revive_ad_dismissed: void;

  // Sponsored transaction ads
  sponsored_ad_shown: void;
  sponsored_ad_earned: void;
  sponsored_ad_dismissed: void;
  sponsored_ad_failed: void;

  // Transfer
  transfer_initiated: { token: AppToken };
  transfer_completed: { token: AppToken; method: TransactionMethod };

  // Stacking (fast pool)
  stacking_approve_contract_caller: void;
  stacking_stx_delegated: { amount_micro_stx: number };
  stacking_revoked: void;
  stacking_disallowed: void;

  // Dual stacking
  dual_stacking_enrolled: void;
  dual_stacking_opted_out: void;
  dual_stacking_change_reward_address: void;

  // Swaps
  swap_initiated: void;
  swap_completed: { method: TransactionMethod };

  // sBTC bridge
  bridge_deposit_initiated: void;
  bridge_withdrawal_initiated: void;

  // Wallet management
  replace_cloud_backup: void;
  /** Local wallet replaced, but new cloud backup upload failed. */
  replace_cloud_backup_failed: { reason: "backup_already_exists" };
  account_added: void;
  account_switched: void;
};
// Derives the correct call signature for typed events.
export type TrackEventArgs<K extends keyof AnalyticsEvents> =
  AnalyticsEvents[K] extends void
    ? [name: K]
    : [name: K, params: AnalyticsEvents[K]];
