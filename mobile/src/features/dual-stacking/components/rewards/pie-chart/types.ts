export type YieldSource = {
  id: string;
  name: string;
  percentage: number;
  valueForApyCalculation?: number;
  currency: "sBTC" | "STX";
  apy: number;
  color: string;
  chartColor?: string;
  indicatorColor?: string;
};

export type YieldCompositionChartDatum = {
  name: string;
  percentage: number;
  color: string;
  indicatorColor?: string;
  linePercentage?: number;
};
