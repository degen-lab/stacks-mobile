import { render, screen } from "@/lib/tests";
import { YieldCompositionChart } from "../CompositionChart";

describe("YieldCompositionChart", () => {
  it("returns null for empty data", () => {
    const { toJSON } = render(<YieldCompositionChart data={[]} />);

    expect(toJSON()).toBeNull();
  });

  it("renders a single segment circle and indicator line", () => {
    render(
      <YieldCompositionChart
        data={[
          {
            name: "sBTC Base",
            percentage: 100,
            color: "#FC6432",
            indicatorColor: "#FF6432",
            linePercentage: 4.2,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("composition-single-segment")).toBeTruthy();
    expect(screen.getByTestId("composition-indicator-line")).toBeTruthy();
  });

  it("renders one path per multi-segment slice", () => {
    render(
      <YieldCompositionChart
        data={[
          { name: "Base", percentage: 40, color: "#FC6432" },
          { name: "Boosted", percentage: 35, color: "#FFAD65" },
          { name: "Stacking", percentage: 25, color: "#595754" },
        ]}
      />,
    );

    expect(screen.getByTestId("composition-segment-0")).toBeTruthy();
    expect(screen.getByTestId("composition-segment-1")).toBeTruthy();
    expect(screen.getByTestId("composition-segment-2")).toBeTruthy();
  });
});
