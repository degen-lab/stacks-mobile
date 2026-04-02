import type { ReactNode } from "react";
import { render, screen } from "@/lib/tests";
import { ChartSectionLayout } from "../ChartSectionLayout";

jest.mock("../TimeToggle", () => ({
  TimeToggle: () => {
    const { Text } =
      jest.requireActual<typeof import("react-native")>("react-native");
    return <Text>TIME_TOGGLE</Text>;
  },
}));

jest.mock("../UnitToggle", () => ({
  UnitToggle: () => {
    const { Text } =
      jest.requireActual<typeof import("react-native")>("react-native");
    return <Text>UNIT_TOGGLE</Text>;
  },
}));

jest.mock("../Legend", () => ({
  ChartLegend: ({ items }: { items: { label: string }[] }) => {
    const { Text, View } =
      jest.requireActual<typeof import("react-native")>("react-native");
    return (
      <View>
        <Text>{`LEGEND_${items.length}`}</Text>
      </View>
    );
  },
}));

jest.mock("../YieldChart", () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => {
    const { Text, View } =
      jest.requireActual<typeof import("react-native")>("react-native");
    return (
      <View>
        <Text>YIELD_CHART</Text>
        {children}
      </View>
    );
  },
}));

describe("ChartSectionLayout", () => {
  const baseProps = {
    chartData: [
      {
        cycle: 90,
        isCurrentCycle: true,
        date: "2026-04-01",
        display: "1 Apr (Est.)",
        timestamp: 1,
        totalRewarded: 0,
        isStacking: false,
        baseApr: 0,
        boostedApr: 0,
        stxApr: 0,
        totalApr: 0,
        baseSbtc: 0,
        boostedSbtc: 0,
        rewardedStacking: 0,
        cumulativeBase: 0,
        cumulativeBoosted: 0,
        cumulativeStacking: 0,
      },
    ],
    unit: "percent" as const,
    period: 90 as const,
    timeUntilCycleStartLabel: "",
    timeUntilContractActiveLabel: "",
    legendItems: [
      {
        id: "base",
        label: "Base sBTC Rewards",
        apy: 1,
        color: "#FC6432",
      },
    ],
    onUnitChange: jest.fn(),
    onPeriodChange: jest.fn(),
    isEmptyChart: true,
    isContractActive: true,
  };

  it("shows controls when estimated chart data exists", () => {
    render(<ChartSectionLayout {...baseProps} isEmptyChart={false} />);

    expect(screen.getByText("View by:")).toBeTruthy();
    expect(screen.getByText("UNIT_TOGGLE")).toBeTruthy();
    expect(screen.getByText("TIME_TOGGLE")).toBeTruthy();
    expect(screen.getByText("LEGEND_1")).toBeTruthy();
    expect(screen.getByText("YIELD_CHART")).toBeTruthy();
  });

  it("hides controls when there is no chart data", () => {
    render(<ChartSectionLayout {...baseProps} chartData={[]} />);

    expect(screen.queryByText("View by:")).toBeNull();
    expect(screen.queryByText("UNIT_TOGGLE")).toBeNull();
    expect(screen.queryByText("TIME_TOGGLE")).toBeNull();
    expect(screen.queryByText("LEGEND_1")).toBeNull();
    expect(screen.getByText("YIELD_CHART")).toBeTruthy();
  });
});
