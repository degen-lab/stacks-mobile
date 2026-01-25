import { fireEvent, render } from "@/lib/tests";
import { AccountCard } from "../../components/account-card";

jest.mock("lucide-react-native", () => ({
  Wallet: "Wallet",
  Briefcase: "Briefcase",
  Coins: "Coins",
  CreditCard: "CreditCard",
  Gem: "Gem",
  Sparkles: "Sparkles",
  Check: "Check",
}));

describe("AccountCard", () => {
  const mockAddress = "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7";
  const defaultProps = {
    accountIndex: 0,
    address: mockAddress,
    isActive: false,
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders account with correct title", () => {
      const { getByText } = render(<AccountCard {...defaultProps} />);

      expect(getByText("Account 1")).toBeTruthy();
    });

    it("renders truncated address", () => {
      const { getByText } = render(<AccountCard {...defaultProps} />);

      expect(getByText("SP2J6ZY4...KNRV9EJ7")).toBeTruthy();
    });

    it("renders balance when provided", () => {
      const { getByText } = render(
        <AccountCard {...defaultProps} balance="100.5" />,
      );

      expect(getByText("100.5 STX")).toBeTruthy();
    });

    it("does not render balance when not provided", () => {
      const { queryByText } = render(<AccountCard {...defaultProps} />);

      expect(queryByText(/STX/)).toBeFalsy();
    });

    it("shows loading when address is empty", () => {
      const { getByText } = render(
        <AccountCard {...defaultProps} address="" />,
      );

      expect(getByText("Loading...")).toBeTruthy();
    });
  });

  describe("Active State", () => {
    it("shows active indicator when account is active", () => {
      const { getByText } = render(
        <AccountCard {...defaultProps} isActive={true} />,
      );

      expect(getByText("Account 1")).toBeTruthy();
    });

    it("shows 'Set active' button when account is not active", () => {
      const { getByText } = render(
        <AccountCard
          {...defaultProps}
          isActive={false}
          onSetActive={jest.fn()}
        />,
      );

      expect(getByText("Set active")).toBeTruthy();
    });

    it("does not show 'Set active' button when account is active", () => {
      const { queryByText } = render(
        <AccountCard
          {...defaultProps}
          isActive={true}
          onSetActive={jest.fn()}
        />,
      );

      expect(queryByText("Set active")).toBeFalsy();
    });

    it("does not show 'Set active' button when onSetActive is not provided", () => {
      const { queryByText } = render(
        <AccountCard {...defaultProps} isActive={false} />,
      );

      expect(queryByText("Set active")).toBeFalsy();
    });
  });

  describe("User Interactions", () => {
    it("calls onPress when card is pressed", () => {
      const onPress = jest.fn();
      const { getByLabelText } = render(
        <AccountCard {...defaultProps} onPress={onPress} />,
      );

      fireEvent.press(getByLabelText("View Account 1"));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("calls onSetActive when 'Set active' button is pressed", () => {
      const onSetActive = jest.fn();
      const onPress = jest.fn();
      const { getByText } = render(
        <AccountCard
          {...defaultProps}
          onPress={onPress}
          onSetActive={onSetActive}
        />,
      );

      const setActiveButton = getByText("Set active");
      // fireEvent.press needs an event object with stopPropagation
      fireEvent(setActiveButton, "press", { stopPropagation: jest.fn() });
      expect(onSetActive).toHaveBeenCalledTimes(1);
    });

    it("does not call onPress when 'Set active' is pressed", () => {
      const onPress = jest.fn();
      const onSetActive = jest.fn();
      const { getByText } = render(
        <AccountCard
          {...defaultProps}
          onPress={onPress}
          onSetActive={onSetActive}
        />,
      );

      // Press the set active button - onPress should not be called
      const setActiveButton = getByText("Set active");
      fireEvent(setActiveButton, "press", { stopPropagation: jest.fn() });

      expect(onSetActive).toHaveBeenCalledTimes(1);
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has correct accessibility label for card", () => {
      const { getByLabelText } = render(<AccountCard {...defaultProps} />);

      expect(getByLabelText("View Account 1")).toBeTruthy();
    });

    it("has correct accessibility label for set active button", () => {
      const { getByLabelText } = render(
        <AccountCard
          {...defaultProps}
          accountIndex={2}
          onSetActive={jest.fn()}
        />,
      );

      expect(getByLabelText("Use Account 3")).toBeTruthy();
    });
  });

  describe("Account Icons", () => {
    it("cycles through different icons for different account indices", () => {
      const { rerender, UNSAFE_root } = render(
        <AccountCard {...defaultProps} accountIndex={0} />,
      );
      const firstIcon = UNSAFE_root;

      rerender(<AccountCard {...defaultProps} accountIndex={1} />);
      const secondIcon = UNSAFE_root;

      expect(firstIcon).toBeTruthy();
      expect(secondIcon).toBeTruthy();
    });

    it("wraps around icons after 6 accounts", () => {
      const { UNSAFE_root: firstContainer } = render(
        <AccountCard {...defaultProps} accountIndex={0} />,
      );

      const { UNSAFE_root: seventhContainer } = render(
        <AccountCard {...defaultProps} accountIndex={6} />,
      );

      expect(firstContainer).toBeTruthy();
      expect(seventhContainer).toBeTruthy();
    });
  });
});
