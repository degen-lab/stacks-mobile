export type StepStatus = "current" | "completed" | "pending" | "locked";
export type CtaVariant = "primary" | "orange" | "secondary" | "disabled";

export type StepId = 1 | 2 | 3 | 4;

export type StepButtonCta = {
  kind: "button";
  text: string;
  variant: CtaVariant;
  href?: string;
  id?: string;
  hasArrow?: boolean;
};

export type StepLinkCta = {
  kind: "link";
  text: string;
  href: string;
  hasArrow?: boolean;
};

export type StepCta = StepButtonCta | StepLinkCta;

export type Step = {
  id: StepId;
  title: string;
  description: string;
  status: StepStatus;
  cta: StepCta;
  showNextBadge: boolean;
};

export type EarnBtcCtaLinks = {
  bridge?: string;
  stacking?: string;
  defi?: string;
};

const TEXT = {
  1: {
    title: "Get sBTC",
    description:
      "Mint sBTC from the official bridge. You'll need 10,000 sats minimum to enroll for rewards.",
  },
  2: {
    title: "Enroll for rewards",
    description:
      "Register your sBTC to start earning base BTC-denominated rewards up to 0.5% APY. Your sBTC stays in your custody.",
  },
  3: {
    title: "Boost with Stacking",
    description:
      "Lock your STX with solo, pooling, or liquid Stacking to earn BTC Stacking rewards and boost your sBTC Stacking rewards",
  },
  4: {
    title: "Boost with DeFi",
    description:
      "Deploy your sBTC to Stacks DeFi protocols to reach the maximum APY boost.",
  },
} as const;

export type BuildEarnBtcArgs = {
  isEnrolledNextCycle: boolean;
  isStacking: boolean;
  isConnected: boolean;
  isDeFiParticipant: boolean;
  meetsMinimumEnrollAmount: boolean;
  ctaLinks?: EarnBtcCtaLinks;
  hasEnrollMempoolTx?: boolean;
  enrollExplorerUrl?: string;
};

export function buildEarnBtcSteps({
  isEnrolledNextCycle,
  isStacking,
  isConnected,
  isDeFiParticipant,
  meetsMinimumEnrollAmount,
  ctaLinks = {},
  hasEnrollMempoolTx = false,
  enrollExplorerUrl,
}: BuildEarnBtcArgs): { steps: Step[]; enrolled?: boolean } {
  const hasEnough = meetsMinimumEnrollAmount;
  const nextStep: StepId = hasEnough ? 2 : 1;

  if (isEnrolledNextCycle) {
    return {
      enrolled: true,
      steps: [
        {
          id: 1,
          title: TEXT[1].title,
          description: TEXT[1].description,
          status: hasEnough ? "completed" : "current",
          showNextBadge: hasEnough ? false : true,
          cta: hasEnough
            ? {
                kind: "link",
                text: "Deposit more sBTC",
                href: ctaLinks.bridge ?? "#",
                hasArrow: true,
              }
            : {
                kind: "button",
                text: "Open bridge",
                variant: "orange",
                hasArrow: true,
              },
        },
        {
          id: 3,
          title: TEXT[3].title,
          description: TEXT[3].description,
          status: isStacking ? "completed" : "pending",
          showNextBadge: !isStacking && hasEnough,
          cta: isStacking
            ? {
                kind: "link",
                text: "Stack more STX",
                href: ctaLinks.stacking ?? "#",
              }
            : { kind: "button", text: "Start Stacking", variant: "primary" },
        },
        {
          id: 4,
          title: TEXT[4].title,
          description: TEXT[4].description,
          status: isDeFiParticipant ? "completed" : "pending",
          showNextBadge: !isDeFiParticipant && hasEnough,
          cta: isDeFiParticipant
            ? { kind: "link", text: "Explore apps", href: ctaLinks.defi ?? "#" }
            : { kind: "button", text: "Explore apps", variant: "primary" },
        },
      ],
    };
  }

  const hasActiveEnrollMempool = Boolean(
    hasEnough && hasEnrollMempoolTx && enrollExplorerUrl,
  );

  const steps: Step[] = [
    {
      id: 1,
      title: TEXT[1].title,
      description: TEXT[1].description,
      status: hasEnough ? "completed" : "current",
      showNextBadge: nextStep === 1,
      cta: hasEnough
        ? {
            kind: "link",
            text: "Deposit more sBTC",
            href: ctaLinks.bridge ?? "#",
            hasArrow: true,
          }
        : {
            kind: "button",
            text: "Open bridge",
            variant: "orange",
            id: "get-sbtc-button",
            hasArrow: true,
          },
    },
    {
      id: 2,
      title: TEXT[2].title,
      description: TEXT[2].description,
      status: hasEnough ? "current" : "locked",
      showNextBadge: nextStep === 2,
      cta:
        // if not connected, show connect wallet button
        !isConnected
          ? {
              kind: "button",
              text: "Connect Wallet",
              variant: "primary",
              id: "connect-wallet-button",
            }
          : hasActiveEnrollMempool
            ? {
                kind: "link",
                text: "Transaction in mempool...",
                href: enrollExplorerUrl as string,
              }
            : hasEnough
              ? {
                  kind: "button",
                  text: "Enroll now",
                  variant: "orange",
                  id: "enroll-button",
                }
              : {
                  kind: "button",
                  text: "Enroll now",
                  variant: "disabled",
                },
    },
    {
      id: 3,
      title: TEXT[3].title,
      description: TEXT[3].description,
      status: isStacking ? "completed" : "pending",
      showNextBadge: false,
      cta: isStacking
        ? {
            kind: "link",
            text: "Stack more STX",
            href: ctaLinks.stacking ?? "#",
          }
        : {
            kind: "button",
            text: "Start Stacking",
            variant: "secondary",
            hasArrow: true,
          },
    },
    {
      id: 4,
      title: TEXT[4].title,
      description: TEXT[4].description,
      status: isDeFiParticipant ? "completed" : "pending",
      showNextBadge: false,
      cta: isDeFiParticipant
        ? {
            kind: "link",
            text: "Explore Apps",
            href: ctaLinks.defi ?? "#",
          }
        : {
            kind: "button",
            text: "Explore apps",
            variant: "secondary",
          },
    },
  ];

  return { steps, enrolled: false };
}
