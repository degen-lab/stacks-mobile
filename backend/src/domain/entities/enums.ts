export enum ItemType {
  PowerUp,
  Skin,
}

export enum ItemVariant {
  Revive = 'Revive',
  DropPoint = 'DropPoint',
  PurpleSkin = 'PurpleSkin',
  BlackSkin = 'BlackSkin',
}

export enum PurchaseType {
  'Points',
  'Gift',
  'Reward',
}

export enum SubmissionType {
  'Raffle',
  'WeeklyContest',
}

export enum ItemCategory {
  consumable = 'consumable',
  unique = 'unique',
}

// Persisted as numeric Postgres enum labels in the existing schema.
// Keep the enum numeric-backed until we run a dedicated data migration.
export enum TransactionStatus {
  Pending,
  Success,
  Failed,
  NotBroadcasted,
  Processing,
}

export enum TournamentStatusEnum {
  'SubmitPhase' = 'SubmitPhase',
  'FinishSubmissionsPhase' = 'FinishSubmissionsPhase',
  'DistributionPhase' = 'DistributionPhase',
  'HeadToNextTournament' = 'HeadToNextTournament',
}
