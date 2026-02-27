export interface Supplier {
  _id: string;
  name: string;
  phoneNumber: string;
  balance: number;
  createdAt?: string;
}

export type BalanceFilterChip = 'all' | 'debtors' | 'creditors';
export type SortOption = 'newest' | 'highest_balance' | 'lowest_balance';
export type ViewMode = 'grid' | 'table';
