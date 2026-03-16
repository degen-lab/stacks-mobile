import { act, renderHook } from "@testing-library/react-native";

import { useSendFlow } from "../hooks/use-send-flow";

describe("useSendFlow", () => {
  it("starts at asset step with empty form data", () => {
    const { result } = renderHook(() => useSendFlow());

    expect(result.current.currentStep).toBe("asset");
    expect(result.current.formData.asset).toBeNull();
    expect(result.current.formData.amount).toBe("");
    expect(result.current.formData.recipient).toBe("");
    expect(result.current.formData.source).toBe("manual");
  });

  it("advances through all steps with nextStep", () => {
    const { result } = renderHook(() => useSendFlow());

    act(() => result.current.nextStep());
    expect(result.current.currentStep).toBe("amount");

    act(() => result.current.nextStep());
    expect(result.current.currentStep).toBe("recipient");

    act(() => result.current.nextStep());
    expect(result.current.currentStep).toBe("confirm");

    // does not go past confirm
    act(() => result.current.nextStep());
    expect(result.current.currentStep).toBe("confirm");
  });

  it("goes back with previousStep and does not go before asset", () => {
    const { result } = renderHook(() => useSendFlow());

    act(() => result.current.nextStep());
    act(() => result.current.nextStep());
    expect(result.current.currentStep).toBe("recipient");

    act(() => result.current.previousStep());
    expect(result.current.currentStep).toBe("amount");

    act(() => result.current.previousStep());
    expect(result.current.currentStep).toBe("asset");

    // does not go before asset
    act(() => result.current.previousStep());
    expect(result.current.currentStep).toBe("asset");
  });

  describe("field updates", () => {
    it("updates each form field", () => {
      const { result } = renderHook(() => useSendFlow());

      act(() => result.current.updateAsset("BTC"));
      expect(result.current.formData.asset).toBe("BTC");

      act(() => result.current.updateAmount("0.01"));
      expect(result.current.formData.amount).toBe("0.01");

      act(() => result.current.updateRecipient("tb1qtest"));
      expect(result.current.formData.recipient).toBe("tb1qtest");

      act(() => result.current.updateMemo("invoice 123"));
      expect(result.current.formData.memo).toBe("invoice 123");
    });

    it("locks prevent field updates", () => {
      const { result } = renderHook(() => useSendFlow());

      act(() =>
        result.current.initialize({
          asset: "BTC",
          amount: "0.5",
          locks: { asset: true, amount: true },
        }),
      );

      act(() => result.current.updateAsset("STX"));
      expect(result.current.formData.asset).toBe("BTC");

      act(() => result.current.updateAmount("1.0"));
      expect(result.current.formData.amount).toBe("0.5");

      // unlocked fields still update
      act(() => result.current.updateRecipient("tb1qnew"));
      expect(result.current.formData.recipient).toBe("tb1qnew");
    });
  });

  describe("initialize", () => {
    it("starts at asset step when no fields are provided", () => {
      const { result } = renderHook(() => useSendFlow());
      act(() => result.current.initialize({}));
      expect(result.current.currentStep).toBe("asset");
    });

    it("skips to amount step when only asset is provided", () => {
      const { result } = renderHook(() => useSendFlow());
      act(() => result.current.initialize({ asset: "BTC" }));
      expect(result.current.currentStep).toBe("amount");
    });

    it("skips to recipient step when asset and amount are provided", () => {
      const { result } = renderHook(() => useSendFlow());
      act(() => result.current.initialize({ asset: "BTC", amount: "0.01" }));
      expect(result.current.currentStep).toBe("recipient");
    });

    it("skips to confirm step when asset, amount, and recipient are all provided", () => {
      const { result } = renderHook(() => useSendFlow());
      act(() =>
        result.current.initialize({
          asset: "BTC",
          amount: "0.01",
          recipient: "tb1qtest",
        }),
      );
      expect(result.current.currentStep).toBe("confirm");
    });

    it("populates all form fields from the request", () => {
      const { result } = renderHook(() => useSendFlow());
      act(() =>
        result.current.initialize({
          asset: "BTC",
          amount: "0.5",
          recipient: "tb1qrecipient",
          memo: "payment",
          source: "transak-sell",
        }),
      );

      expect(result.current.formData.asset).toBe("BTC");
      expect(result.current.formData.amount).toBe("0.5");
      expect(result.current.formData.recipient).toBe("tb1qrecipient");
      expect(result.current.formData.memo).toBe("payment");
      expect(result.current.formData.source).toBe("transak-sell");
    });

    it("sets locks from the request", () => {
      const { result } = renderHook(() => useSendFlow());
      act(() =>
        result.current.initialize({
          locks: { recipient: true, amount: true },
        }),
      );

      expect(result.current.locks.recipient).toBe(true);
      expect(result.current.locks.amount).toBe(true);
      expect(result.current.locks.asset).toBe(false);
      expect(result.current.locks.memo).toBe(false);
    });
  });

  it("reset clears all state back to defaults", () => {
    const { result } = renderHook(() => useSendFlow());

    act(() =>
      result.current.initialize({
        asset: "BTC",
        amount: "0.5",
        recipient: "tb1qtest",
        locks: { asset: true },
      }),
    );
    expect(result.current.currentStep).toBe("confirm");

    act(() => result.current.reset());

    expect(result.current.currentStep).toBe("asset");
    expect(result.current.formData.asset).toBeNull();
    expect(result.current.formData.amount).toBe("");
    expect(result.current.formData.recipient).toBe("");
    expect(result.current.locks.asset).toBe(false);
  });
});
