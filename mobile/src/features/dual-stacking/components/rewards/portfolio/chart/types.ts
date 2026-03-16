export type TimePeriod = 90 | 30 | 15;

export type PerformanceMetrics = {
  percentage: number;
  period: TimePeriod;
  description: string;
};

export type PortfolioValue = {
  usd: number;
  btc: number;
};

export type ChartLegendItem = {
  id: string;
  label: string;
  apy: number;
  color: string;
  lineStyle?: "solid" | "dashed";
  valueLabel?: string;
};

export type EarningsData = {
  amount: number;
  usdValue: number;
  description: string;
};

export type PortfolioPerformanceData = {
  metrics: PerformanceMetrics;
  portfolioValue: PortfolioValue;
  legendItems: ChartLegendItem[];
  earnings: EarningsData;
};
