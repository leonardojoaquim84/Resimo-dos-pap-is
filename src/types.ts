export type AssetType = 'Ações' | 'FIIs' | 'Câmbio' | 'ETFs/Internacional' | 'Outros';

export interface AssetHolding {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  averagePurchasePrice: number;
  currency: 'BRL' | 'USD';
}

export interface AssetPriceData {
  symbol: string;
  currentPrice: number | null;
  avgWeek?: number | null;
  avgMonth?: number | null;
  avg3Months?: number | null;
  avg6Months?: number | null;
  avgYear?: number | null;
  currency: 'BRL' | 'USD';
  updatedAt: string;
}

export interface PortfolioSummary {
  totalBRL: number;
  totalInvestedBRL: number;
  totalGainBRL: number;
  totalGainPercentage: number;
  assetTypeDistribution: { type: AssetType; valueBRL: number; percentage: number }[];
}
