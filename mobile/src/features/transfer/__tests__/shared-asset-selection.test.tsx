import { fireEvent, render, screen } from "@/lib/tests";

import { SharedAssetSelection } from "../components/shared-asset-selection";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(),
}));

jest.mock("@/api/market/use-stacks-price", () => ({
  useStacksPrice: () => ({ data: undefined }),
}));

jest.mock("@/api/market/use-btc-price", () => ({
  useBtcPrice: () => ({ data: undefined }),
}));

describe("SharedAssetSelection", () => {
  it.each([
    ["Stacks", "STX"],
    ["Bitcoin", "BTC"],
  ] as const)("allows selecting %s", (label, asset) => {
    const onSelectAsset = jest.fn();

    render(<SharedAssetSelection onSelectAsset={onSelectAsset} />);

    fireEvent.press(screen.getByText(label));

    expect(onSelectAsset).toHaveBeenCalledWith(asset);
  });

  it("keeps sBTC disabled by default", () => {
    const onSelectAsset = jest.fn();

    render(<SharedAssetSelection onSelectAsset={onSelectAsset} />);

    fireEvent.press(screen.getAllByText("sBTC")[0]);

    expect(onSelectAsset).not.toHaveBeenCalled();
    expect(screen.getByText("Coming soon")).toBeTruthy();
  });

  it("allows selecting sBTC when it is enabled", () => {
    const onSelectAsset = jest.fn();

    render(
      <SharedAssetSelection
        onSelectAsset={onSelectAsset}
        assetAvailability={{ sBTC: { enabled: true } }}
      />,
    );

    fireEvent.press(screen.getAllByText("sBTC")[0]);

    expect(onSelectAsset).toHaveBeenCalledWith("sBTC");
    expect(screen.queryByText("Coming soon")).toBeNull();
  });

  it("renders a custom disabled label for unavailable assets", () => {
    render(
      <SharedAssetSelection
        onSelectAsset={jest.fn()}
        assetAvailability={{
          sBTC: { enabled: false, disabledLabel: "Unavailable" },
        }}
      />,
    );

    expect(screen.getByText("Unavailable")).toBeTruthy();
  });

  it("renders balances for assets", () => {
    render(
      <SharedAssetSelection
        onSelectAsset={jest.fn()}
        assetAvailability={{ sBTC: { enabled: true } }}
        balances={{ STX: 12.345678, BTC: 0.12345678, sBTC: 1.5 }}
      />,
    );

    expect(screen.getByText("12.345678 STX")).toBeTruthy();
    expect(screen.getByText("0.12345678 BTC")).toBeTruthy();
    expect(screen.getByText("1.5 sBTC")).toBeTruthy();
  });
});
