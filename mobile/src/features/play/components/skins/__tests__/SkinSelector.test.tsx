import type { StoreItem } from "@/api/store/types";
import { ItemVariant } from "@/lib/enums";
import { render, screen } from "@/lib/tests";
import { useStoreItems } from "@/api/store";
import { buildAvailableSkins, SkinSelectorLayout } from "../skin-selector";

jest.mock("../use-skin-selector", () => ({
  useSkinSelector: jest.fn(),
}));

jest.mock("@/api/store", () => ({
  useStoreItems: jest.fn(),
}));

jest.mock("expo-asset", () => ({
  Asset: {
    fromModule: jest.fn(() => ({ type: "png", uri: "test-uri" })),
  },
}));

const buildStoreItem = (
  partial: Partial<StoreItem> & Pick<StoreItem, "variant" | "itemType">,
): StoreItem => ({
  itemType: partial.itemType,
  variant: partial.variant,
  name: partial.name ?? "Skin Name",
  description: partial.description,
  category: partial.category ?? "unique",
  price: partial.price ?? 100,
});

describe("buildAvailableSkins", () => {
  it("returns only the default skin when store items are missing", () => {
    const skins = buildAvailableSkins(undefined);

    expect(skins).toHaveLength(1);
    expect(skins[0]?.id).toBe("orange");
    expect(skins[0]?.cost).toBe(0);
  });

  it("maps store items into available skins and keeps the default", () => {
    const storeItems = [
      buildStoreItem({
        itemType: 1,
        variant: ItemVariant.PurpleSkin,
        name: "Purple",
        price: 250,
      }),
      buildStoreItem({
        itemType: 1,
        variant: ItemVariant.BlackSkin,
        name: "Onyx",
        price: 500,
      }),
      buildStoreItem({
        itemType: 0,
        variant: ItemVariant.Revive,
      }),
    ];

    const skins = buildAvailableSkins(storeItems);
    const skinIds = skins.map((skin) => skin.id);

    expect(skinIds).toEqual(["orange", "purple", "black"]);
    expect(skins[1]?.name).toBe("Purple");
    expect(skins[1]?.cost).toBe(250);
    expect(skins[2]?.name).toBe("Onyx");
    expect(skins[2]?.cost).toBe(500);
  });

  it("falls back to asset names when store items omit names", () => {
    const storeItems = [
      buildStoreItem({
        itemType: 1,
        variant: ItemVariant.PurpleSkin,
        name: "Purple",
        price: 250,
      }),
    ];

    const skins = buildAvailableSkins(storeItems);
    const purpleSkin = skins.find((skin) => skin.id === "purple");

    expect(purpleSkin?.name).toBe("Purple");
    expect(purpleSkin?.cost).toBe(250);
  });
});

describe("SkinSelectorLayout", () => {
  it("renders status and error states from props", () => {
    jest.mocked(useStoreItems).mockReturnValue({ data: [] } as any);

    render(
      <SkinSelectorLayout
        availablePoints={0}
        selectedSkinId="orange"
        onSelectSkinId={jest.fn()}
        isSkinOwned={jest.fn(() => true)}
        onPurchaseSkin={jest.fn()}
        purchaseError="Purchase failed"
        isPurchasing={true}
      />,
    );

    expect(screen.getByTestId("skin-selector-status")).toHaveTextContent(
      "Selected",
    );
    expect(screen.getByTestId("skin-selector-purchasing")).toHaveTextContent(
      "Processing purchase...",
    );
    expect(screen.getByTestId("skin-selector-error")).toHaveTextContent(
      "Purchase failed",
    );
  });

  it("shows unlock messaging when a skin is unowned", () => {
    jest.mocked(useStoreItems).mockReturnValue({
      data: [
        buildStoreItem({
          itemType: 1,
          variant: ItemVariant.PurpleSkin,
          name: "Purple",
          price: 250,
        }),
      ],
    } as any);

    render(
      <SkinSelectorLayout
        availablePoints={0}
        selectedSkinId="purple"
        onSelectSkinId={jest.fn()}
        isSkinOwned={jest.fn(() => false)}
        onPurchaseSkin={jest.fn()}
      />,
    );

    expect(screen.getByTestId("skin-selector-status")).toHaveTextContent(
      "Tap to unlock for 250 points",
    );
  });
});
