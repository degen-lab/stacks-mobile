import { fireEvent, render, screen } from "@/lib/tests";

import { SharedAssetSelection } from "../components/shared-asset-selection";

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(),
}));

describe("SharedAssetSelection", () => {
  it("allows selecting BTC while keeping sBTC disabled", () => {
    const onSelectAsset = jest.fn();

    render(<SharedAssetSelection onSelectAsset={onSelectAsset} />);

    fireEvent.press(screen.getByText("Bitcoin"));
    expect(onSelectAsset).toHaveBeenCalledWith("BTC");
    expect(screen.getByText("Coming soon")).toBeTruthy();
  });
});
