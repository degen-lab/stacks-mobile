import { ItemVariant } from "@/lib/enums";
import { render, screen } from "@/lib/tests";
import PowerUpCard from "../power-up-card";
import type { PowerUp } from "../utils";

const TestIcon = () => null;

const buildPowerUp = (overrides?: Partial<PowerUp>): PowerUp => ({
  variant: ItemVariant.Revive,
  title: "Revive",
  description: "Bring it back",
  price: 15,
  Icon: TestIcon,
  ...overrides,
});

describe("PowerUpCard", () => {
  it("renders buy label when points are sufficient", () => {
    const powerUp = buildPowerUp();

    render(
      <PowerUpCard
        powerUp={powerUp}
        ownedQuantity={2}
        points={20}
        onPurchase={jest.fn()}
        isPending={false}
      />,
    );

    expect(
      screen.getByTestId(`power-up-action-${powerUp.variant}-label`),
    ).toHaveTextContent("Buy for 15");
  });

  it("renders missing points and disables the button", () => {
    const powerUp = buildPowerUp({ price: 25 });

    render(
      <PowerUpCard
        powerUp={powerUp}
        ownedQuantity={0}
        points={10}
        onPurchase={jest.fn()}
        isPending={false}
      />,
    );

    const action = screen.getByTestId(`power-up-action-${powerUp.variant}`);

    expect(
      screen.getByTestId(`power-up-action-${powerUp.variant}-label`),
    ).toHaveTextContent("Missing 15 points");
    expect(action.props.accessibilityState?.disabled).toBe(true);
  });

  it("shows loading indicator when pending", () => {
    const powerUp = buildPowerUp({ price: 10 });

    render(
      <PowerUpCard
        powerUp={powerUp}
        ownedQuantity={1}
        points={100}
        onPurchase={jest.fn()}
        isPending={true}
      />,
    );

    expect(
      screen.getByTestId(
        `power-up-action-${powerUp.variant}-activity-indicator`,
      ),
    ).toBeTruthy();
  });

  it("shows owned quantity", () => {
    const powerUp = buildPowerUp();

    render(
      <PowerUpCard
        powerUp={powerUp}
        ownedQuantity={4}
        points={100}
        onPurchase={jest.fn()}
        isPending={false}
      />,
    );

    expect(
      screen.getByTestId(`power-up-owned-${powerUp.variant}`),
    ).toHaveTextContent("Owned 4");
  });
});
