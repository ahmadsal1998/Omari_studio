export type CustomerStatus = 'active' | 'blocked' | 'vip';

export interface Customer {
  _id: string;
  fullName: string;
  phoneNumber: string;
  notes?: string;
  balance?: number;
  status?: CustomerStatus;
  city?: string;
  createdAt?: string;
}

export type BalanceFilterChip = 'all' | 'debtors' | 'creditors' | 'vip' | 'blocked';
export type SortOption = 'newest' | 'highest_balance' | 'lowest_balance';
export type ViewMode = 'grid' | 'table';

export interface CustomerFilters {
  search: string;
  status?: string;
  balanceType?: string;
  city?: string;
  sort: SortOption;
  chip: BalanceFilterChip;
}
