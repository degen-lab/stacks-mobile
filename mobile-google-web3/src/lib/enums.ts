export enum ItemType {
  PowerUp = "PowerUp",
  Skin = "Skin",
}

export enum ItemVariant {
  Revive = "Revive",
  DropPoint = "DropPoint",
  PurpleSkin = "PurpleSkin",
  BlackSkin = "BlackSkin",
}

export enum PurchaseType {
  "Points",
  "Gift",
  "Reward",
}

export enum SubmissionType {
  "Lottery",
  "WeeklyContest",
}

export enum ItemCategory {
  consumable = "consumable",
  unique = "unique",
}

export enum FraudReason {
  NONE = "NONE",
  INVALID_ITEM = "INVALID_ITEM_USED",
  INVALID_DATA = "INVALID_DATA",
  TOO_FAST_BRIDGE = "TOO_FAST_BRIDGE",
  TOO_FAST_BETWEEN_MOVES = "TOO_FAST_BETWEEN_MOVES",
  PERFECT_RATE_TOO_HIGH = "PERFECT_RATE_TOO_HIGH",
  TOO_MANY_CONSECUTIVE_PERFECT = "TOO_MANY_CONSECUTIVE_PERFECT",
  DURATION_VARIANCE_TOO_LOW = "DURATION_VARIANCE_TOO_LOW",
  TIMING_VARIANCE_TOO_LOW = "TIMING_VARIANCE_TOO_LOW",
  USER_BLACK_LISTED = "USER_BLACK_LISTED",
}

export enum TournamentStatusEnum {
  SubmitPhase = "SubmitPhase",
  FinishSubmissionsPhase = "FinishSubmissionsPhase",
  DistributionPhase = "DistributionPhase",
  HeadToNextTournament = "HeadToNextTournament",
}
