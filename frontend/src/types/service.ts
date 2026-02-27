export type ServiceType = 'booking' | 'quick';

export interface Service {
  _id: string;
  name: string;
  type: ServiceType;
  costPrice: number;
  sellingPrice: number;
  duration?: number;
  createdAt?: string;
}

export type TypeFilterChip = 'all' | 'booking' | 'quick';
export type SortOption = 'newest' | 'name_asc' | 'name_desc' | 'price_high' | 'price_low';
export type ViewMode = 'grid' | 'table';
