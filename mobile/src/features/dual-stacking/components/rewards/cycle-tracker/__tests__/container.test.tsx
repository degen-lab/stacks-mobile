import { render } from "@/lib/tests";
import { RewardsCycleCardContainer } from "../container";

const mockCard = jest.fn(() => null);

jest.mock("@/features/dual-stacking/hooks/use-dual-stacking-data", () => ({
  useDualStackingDataWithLatestCycle: jest.fn(),
}));

jest.mock("@/api/dual-stacking/contract/hooks", () => ({
  useCurrentBitcoinBlockHeight: jest.fn(),
  useIsContractActive: jest.fn(),
}));

jest.mock("@/api/dual-stacking", () => ({
  useTotalSbtcEnrolled: jest.fn(),
}));

jest.mock("@/features/dual-stacking/hooks/use-coin-prices-for-yield", () => ({
  useCoinPricesForYield: jest.fn(),
}));

jest.mock("@/features/dual-stacking/hooks/use-days-until-cycle-starts", () => ({
  useDaysUntilCycleStarts: jest.fn(),
}));

jest.mock("../RewardsCycleCard", () => ({
  RewardsCycleCard: (props: Record<string, unknown>) => mockCard(props),
}));

jest.mock("../RewardsCycleCard.skeleton", () => ({
  RewardsCycleCardSkeleton: () => null,
}));

const { useDualStackingDataWithLatestCycle } = jest.requireMock(
  "@/features/dual-stacking/hooks/use-dual-stacking-data",
);
const { useCurrentBitcoinBlockHeight, useIsContractActive } = jest.requireMock(
  "@/api/dual-stacking/contract/hooks",
);
const { useTotalSbtcEnrolled } = jest.requireMock("@/api/dual-stacking");
const { useCoinPricesForYield } = jest.requireMock(
  "@/features/dual-stacking/hooks/use-coin-prices-for-yield",
);
const { useDaysUntilCycleStarts } = jest.requireMock(
  "@/features/dual-stacking/hooks/use-days-until-cycle-starts",
);

describe("RewardsCycleCardContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps hook data into the native rewards cycle card", () => {
    jest.mocked(useDualStackingDataWithLatestCycle).mockReturnValue({
      dualStackingData: [
        {
          cycle_id: 12,
          current_cycle_bitcoin_height: 1000,
          next_cycle_bitcoin_height: 1660,
          participants_count: 321,
          snapshots_per_cycle: 12,
          blocks_per_snapshot: 12,
          buffer_blocks: 10,
          buffer_start_block: 1100,
          cycle_total_stx: 0,
          start_time: 0,
          end_time: 0,
          total_rewarded: 0,
        },
      ],
      cycle: 12,
      dualStackingDataLoading: false,
      dualStackingDataError: false,
    });
    jest.mocked(useCurrentBitcoinBlockHeight).mockReturnValue({
      data: 1072,
      isLoading: false,
      isError: false,
    });
    jest.mocked(useIsContractActive).mockReturnValue({
      data: true,
      isLoading: false,
      isError: false,
    });
    jest.mocked(useDaysUntilCycleStarts).mockReturnValue({
      daysUntilCycleStart: 4,
      isFinalized: false,
      isDistributingRewards: false,
      loading: false,
    });
    jest.mocked(useTotalSbtcEnrolled).mockReturnValue({
      data: { wallet: 0, defi: 0, total: 150_000_000 },
      isLoading: false,
      isError: false,
    });
    jest.mocked(useCoinPricesForYield).mockReturnValue({
      data: {
        btc_price: 90_000,
        stx_price: 1.25,
        stacking_apr: 8.5,
      },
      isLoading: false,
      isError: false,
    });

    render(<RewardsCycleCardContainer />);

    expect(mockCard).toHaveBeenCalledTimes(1);
    expect(mockCard.mock.calls[0]?.[0]).toMatchObject({
      cycle: expect.objectContaining({
        cycleNumber: 12,
        progress: 50,
        startsInDays: 4,
        participants: 321,
        totalSbtcParticipating: 1.5,
      }),
    });
  });

  it("returns null on data error", () => {
    jest.mocked(useDualStackingDataWithLatestCycle).mockReturnValue({
      dualStackingData: undefined,
      cycle: undefined,
      dualStackingDataLoading: false,
      dualStackingDataError: true,
    });
    jest.mocked(useCurrentBitcoinBlockHeight).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    jest.mocked(useIsContractActive).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    jest.mocked(useDaysUntilCycleStarts).mockReturnValue({
      daysUntilCycleStart: 0,
      isFinalized: false,
      isDistributingRewards: false,
      loading: false,
    });
    jest.mocked(useTotalSbtcEnrolled).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });
    jest.mocked(useCoinPricesForYield).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    const { toJSON } = render(<RewardsCycleCardContainer />);

    expect(toJSON()).toBeTruthy();
    expect(mockCard).not.toHaveBeenCalled();
  });
});
