import type { StoreItem, StorePurchaseResponse } from "@/api/store/types";
import type { UserItem } from "@/api/user/types";
import { ItemType, ItemVariant, PurchaseType } from "@/lib/enums";
import { act, render, waitFor } from "@/lib/tests";
import PowerUpsContainer from "../power-ups";

let mockLatestProps: any;

const mockSetQueryData = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockUseStoreItems = jest.fn();
const mockUseStorePurchaseMutation = jest.fn();
const mockUseUserProfile = jest.fn();

jest.mock("@/api/common/api-provider", () => ({
  queryClient: {
    setQueryData: (...args: any[]) => mockSetQueryData(...args),
    invalidateQueries: (...args: any[]) => mockInvalidateQueries(...args),
  },
}));

jest.mock("@/api/store", () => ({
  useStoreItems: (...args: any[]) => mockUseStoreItems(...args),
  useStorePurchaseMutation: (...args: any[]) =>
    mockUseStorePurchaseMutation(...args),
}));

jest.mock("@/api/user", () => ({
  useUserProfile: (...args: any[]) => mockUseUserProfile(...args),
}));

jest.mock("../power-ups.layout", () => ({
  PowerUpsLayout: (props: any) => {
    mockLatestProps = props;
    return null;
  },
}));

const buildStoreItem = (
  partial: Partial<StoreItem> & Pick<StoreItem, "variant" | "itemType">,
): StoreItem => ({
  itemType: partial.itemType,
  variant: partial.variant,
  name: partial.name ?? "Power Up",
  description: partial.description ?? "",
  category: partial.category ?? "consumable",
  price: partial.price ?? 10,
});

const buildUserItem = (partial: Partial<UserItem> & Pick<UserItem, "id">) => ({
  id: partial.id,
  type: partial.type ?? 0,
  name: partial.name ?? "Item",
  description: partial.description ?? "",
  purchaseType: partial.purchaseType ?? PurchaseType.Points,
  quantity: partial.quantity,
  metadata: partial.metadata,
});

describe("PowerUpsContainer", () => {
  beforeEach(() => {
    mockLatestProps = null;
    mockSetQueryData.mockClear();
    mockInvalidateQueries.mockClear();
    mockUseStoreItems.mockReturnValue({ data: [] });
    mockUseStorePurchaseMutation.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
    mockUseUserProfile.mockReturnValue({
      data: {
        points: 50,
        items: [
          buildUserItem({
            id: 1,
            quantity: 2,
            metadata: { variant: ItemVariant.Revive },
          }),
        ],
      },
    });
  });

  it("builds layout props from store items and inventory", () => {
    mockUseStoreItems.mockReturnValue({
      data: [
        buildStoreItem({
          itemType: 0,
          variant: ItemVariant.Revive,
          name: "Second Life",
          description: "Come back once",
          price: 42,
        }),
      ],
    });

    render(<PowerUpsContainer />);

    expect(mockLatestProps.powerUps[0]?.title).toBe("Second Life");
    expect(mockLatestProps.ownedQuantities.get(ItemVariant.Revive)).toBe(2);
    expect(mockLatestProps.points).toBe(50);
    expect(mockLatestProps.isPointsLoading).toBe(false);
  });

  it("submits purchases and updates the cache", async () => {
    const mutateAsync = jest.fn(async () =>
      Promise.resolve({
        success: true,
        message: "Purchase successful",
        data: {
          points: 25,
          items: [
            {
              id: 9,
              type: 0,
              name: "Revive",
              description: "",
              purchaseType: PurchaseType.Points,
              metadata: { variant: ItemVariant.Revive },
              createdAt: "2024-01-01T00:00:00Z",
            },
          ],
        },
      } as StorePurchaseResponse),
    );

    mockUseStorePurchaseMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<PowerUpsContainer />);

    await act(async () => {
      await mockLatestProps.onPurchase(ItemVariant.Revive);
    });

    expect(mutateAsync).toHaveBeenCalledWith({
      itemType: ItemType.PowerUp,
      quantity: 1,
      metadata: { variant: ItemVariant.Revive },
    });

    expect(mockSetQueryData).toHaveBeenCalledWith(
      ["user-profile"],
      expect.any(Function),
    );

    const updater = mockSetQueryData.mock.calls[0][1];
    const next = updater({ items: [], points: 50 });
    expect(next.points).toBe(25);
    expect(next.items).toHaveLength(1);
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });

  it("shows error when purchase fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const mutateAsync = jest.fn(async () => Promise.reject(new Error("fail")));

    mockUseStorePurchaseMutation.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<PowerUpsContainer />);

    await act(async () => {
      await mockLatestProps.onPurchase(ItemVariant.DropPoint);
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to purchase item",
      expect.any(Error),
    );

    await waitFor(() => {
      expect(mockLatestProps.purchaseError).toBe(
        "Unable to complete purchase. Please try again.",
      );
    });

    errorSpy.mockRestore();
  });

  it("sets pending variant while purchase is in flight", async () => {
    let resolvePurchase: (value: StorePurchaseResponse) => void;

    const mutateAsync = jest.fn(
      () =>
        new Promise<StorePurchaseResponse>((resolve) => {
          resolvePurchase = resolve;
        }),
    );

    mockUseStorePurchaseMutation.mockReturnValue({
      mutateAsync,
      isPending: true,
    });

    render(<PowerUpsContainer />);

    let purchasePromise: Promise<void>;
    await act(async () => {
      purchasePromise = mockLatestProps.onPurchase(ItemVariant.Revive);
    });

    await waitFor(() => {
      expect(mockLatestProps.pendingVariant).toBe(ItemVariant.Revive);
    });

    await act(async () => {
      resolvePurchase!({
        success: true,
        message: "Purchase successful",
        data: {
          points: 50,
          items: [],
        },
      } as StorePurchaseResponse);
      await purchasePromise!;
    });
  });
});
