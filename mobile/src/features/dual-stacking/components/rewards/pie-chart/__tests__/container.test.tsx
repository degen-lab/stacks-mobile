import { render } from "@/lib/tests";
import { CompositionCardContainer } from "../container";

const mockCard = jest.fn(() => null);

jest.mock("@/features/dual-stacking/hooks/use-apr-computation", () => ({
  useAprComputation: jest.fn(),
}));

jest.mock("../CompositionCard", () => ({
  YieldCompositionCard: (props: Record<string, unknown>) => mockCard(props),
}));

jest.mock("../CompositionCard.skeleton", () => ({
  YieldCompositionCardSkeleton: () => null,
}));

const { useAprComputation } = jest.requireMock(
  "@/features/dual-stacking/hooks/use-apr-computation",
);

describe("CompositionCardContainer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps base-only composition with the fallback base color", () => {
    jest.mocked(useAprComputation).mockReturnValue({
      baseApr: 4.2,
      boostedApr: 0,
      rewardsComposition: { base: "100.00", boosted: "0.00", stacking: "0.00" },
      stxAvg: 0,
      sbtcTotalAvg: 100_000_000,
      stackingAprCoinPrices: 0,
      isLoading: false,
      isError: false,
    });

    render(<CompositionCardContainer />);

    expect(mockCard).toHaveBeenCalledTimes(1);
    expect(mockCard.mock.calls[0]?.[0]).toMatchObject({
      sources: [
        expect.objectContaining({
          id: "sbtc-yield",
          percentage: 100,
          color: "#FFC2A8",
          indicatorColor: "#FF8761",
        }),
      ],
    });
  });

  it("maps base, boosted, and stacking sources", () => {
    jest.mocked(useAprComputation).mockReturnValue({
      baseApr: 4.2,
      boostedApr: 2.5,
      rewardsComposition: {
        base: "40.00",
        boosted: "35.00",
        stacking: "25.00",
      },
      stxAvg: 1_000_000,
      sbtcTotalAvg: 200_000_000,
      stackingAprCoinPrices: 7.5,
      isLoading: false,
      isError: false,
    });

    render(<CompositionCardContainer />);

    expect(mockCard).toHaveBeenCalledTimes(1);
    expect(mockCard.mock.calls[0]?.[0]).toMatchObject({
      sources: [
        expect.objectContaining({
          id: "sbtc-yield",
          percentage: 40,
          color: "#FC6432",
        }),
        expect.objectContaining({
          id: "sbtc-boosted",
          percentage: 35,
          color: "#FFAD65",
        }),
        expect.objectContaining({
          id: "stx-stacked",
          percentage: 25,
          color: "#595754",
        }),
      ],
    });
  });

  it("returns null on hook error", () => {
    jest.mocked(useAprComputation).mockReturnValue({
      isLoading: false,
      isError: true,
    });

    const { toJSON } = render(<CompositionCardContainer />);

    expect(toJSON()).toBeNull();
    expect(mockCard).not.toHaveBeenCalled();
  });
});
