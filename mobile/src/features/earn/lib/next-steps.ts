import type { EarnNextStepCard } from "../types";

import {
  buildActionableCandidates,
  buildPreviewCandidates,
  buildSuccessCandidate,
  type BuildEarnNextStepCardsArgs,
  type EarnNextStepCandidate,
} from "./next-step-candidates";

function sortByPriority(
  candidates: EarnNextStepCandidate[],
): EarnNextStepCandidate[] {
  return candidates.slice().sort((a, b) => a.priority - b.priority);
}

function selectCandidates(args: BuildEarnNextStepCardsArgs) {
  const selected = sortByPriority(buildActionableCandidates(args)).slice(0, 2);
  const preview = sortByPriority(
    buildPreviewCandidates({
      sbtcBalance: args.sbtcBalance,
      minSbtcBalanceForEnrollment: args.minSbtcBalanceForEnrollment,
      totalStxBalance: args.totalStxBalance,
      lockedStxBalance: args.lockedStxBalance,
    }),
  );

  if (selected.length === 0) {
    return preview.slice(0, 2);
  }

  if (selected.length !== 1) {
    return selected;
  }

  const secondaryPreview = preview.find(
    (candidate) => candidate.id !== selected[0]?.id,
  );

  return secondaryPreview ? [...selected, secondaryPreview] : selected;
}

function getCardStatus(
  card: EarnNextStepCandidate,
  index: number,
  cards: EarnNextStepCandidate[],
): EarnNextStepCard["status"] {
  const isAcquirePair =
    cards.length === 2 &&
    cards[0]?.id === "get-stx" &&
    cards[1]?.id === "get-btc";
  const hasOnlyPreviewCards = cards.every(
    (candidate) => candidate.kind === "preview",
  );

  if (card.kind === "success") return "success";
  if (hasOnlyPreviewCards && index === 0) return "primary";
  if (card.kind === "preview") return "preview";
  if (card.kind === "actionable") return "primary";
  return isAcquirePair || index === 0 ? "primary" : "secondary";
}

export function buildEarnNextStepCards(
  args: BuildEarnNextStepCardsArgs,
): EarnNextStepCard[] {
  const selected = selectCandidates(args);
  const cards = selected.length
    ? selected
    : [buildSuccessCandidate(args.nextRewardPhaseLabel)];

  return cards.map((card, index) => ({
    id: card.id,
    title: card.title,
    description: card.description,
    status: getCardStatus(card, index, cards),
    action: card.action,
  }));
}
