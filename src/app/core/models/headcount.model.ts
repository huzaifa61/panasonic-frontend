export interface Headcount {
  storeId: number;
  storeName: string;
  year: number;
  month: number;
  currentHeadcount: number;
  forecastedHeadcountNeed: number;
  gap: number;
}
