import { render, screen } from "@/lib/tests";
import { YieldSourceItem } from "../SourceItem";

describe("YieldSourceItem", () => {
  it("renders percentage, compact value, currency, and APY copy", () => {
    render(
      <YieldSourceItem
        source={{
          id: "sbtc-yield",
          name: "sBTC Base",
          percentage: 55.5,
          valueForApyCalculation: 1234,
          currency: "sBTC",
          apy: 4.2,
          color: "#FC6432",
        }}
      />,
    );

    expect(screen.getByText("sBTC Base")).toBeTruthy();
    expect(screen.getByText("(55.5%)")).toBeTruthy();
    expect(screen.getByText("1.2k sBTC earning 4.2% APY")).toBeTruthy();
  });
});
