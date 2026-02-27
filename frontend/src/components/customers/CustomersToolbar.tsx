import { useState, useRef, useEffect } from 'react';
import type { SortOption, ViewMode } from '../../types/customer';
import './CustomersToolbar.css';

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const SortIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const TableIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const ResetIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ChevronDown = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface CustomersToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
  advancedFilters: {
    status?: string;
    balanceType?: string;
    city?: string;
  };
  onAdvancedFiltersChange: (f: { status?: string; balanceType?: string; city?: string }) => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'highest_balance', label: 'أعلى رصيد' },
  { value: 'lowest_balance', label: 'أقل رصيد' },
];

export default function CustomersToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
  advancedFilters,
  onAdvancedFiltersChange,
  onResetFilters,
  hasActiveFilters,
}: CustomersToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (filtersRef.current && !filtersRef.current.contains(target)) setFiltersOpen(false);
      if (sortRef.current && !sortRef.current.contains(target)) setSortOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <div className="customers-toolbar">
      <div className="customers-toolbar__row">
        {/* Search – takes available space on first row */}
        <div className="customers-toolbar__search-wrap">
          <span className="customers-toolbar__search-icon" aria-hidden>
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث عن عميل..."
            className="customers-toolbar__search-input"
            aria-label="بحث عن عميل"
          />
        </div>

        {/* Controls group: filters, sort, reset, view toggle */}
        <div className="customers-toolbar__controls">
          {/* Advanced Filters dropdown */}
          <div className="customers-toolbar__dropdown-wrap" ref={filtersRef}>
            <button
              type="button"
              onClick={() => { setFiltersOpen(!filtersOpen); setSortOpen(false); }}
              className="customers-toolbar__btn"
              aria-expanded={filtersOpen}
              aria-haspopup="true"
            >
              <FilterIcon />
              <span>فلاتر متقدمة</span>
              <ChevronDown />
            </button>
            {filtersOpen && (
              <div className="customers-toolbar__dropdown customers-toolbar__dropdown--filters">
                <div className="customers-toolbar__dropdown-label">الحالة</div>
                <select
                  value={advancedFilters.status ?? ''}
                  onChange={(e) => onAdvancedFiltersChange({ ...advancedFilters, status: e.target.value || undefined })}
                  className="customers-toolbar__dropdown-select"
                >
                  <option value="">الكل</option>
                  <option value="active">نشط</option>
                  <option value="blocked">محظور</option>
                  <option value="vip">VIP</option>
                </select>
                <div className="customers-toolbar__dropdown-label">نوع الرصيد</div>
                <select
                  value={advancedFilters.balanceType ?? ''}
                  onChange={(e) => onAdvancedFiltersChange({ ...advancedFilters, balanceType: e.target.value || undefined })}
                  className="customers-toolbar__dropdown-select"
                >
                  <option value="">الكل</option>
                  <option value="debtor">مدين</option>
                  <option value="creditor">دائن</option>
                </select>
                <div className="customers-toolbar__dropdown-label">المدينة</div>
                <input
                  type="text"
                  value={advancedFilters.city ?? ''}
                  onChange={(e) => onAdvancedFiltersChange({ ...advancedFilters, city: e.target.value || undefined })}
                  placeholder="اسم المدينة"
                  className="customers-toolbar__dropdown-input"
                />
              </div>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="customers-toolbar__dropdown-wrap" ref={sortRef}>
            <button
              type="button"
              onClick={() => { setSortOpen(!sortOpen); setFiltersOpen(false); }}
              className="customers-toolbar__btn"
              aria-expanded={sortOpen}
              aria-haspopup="true"
            >
              <SortIcon />
              <span>{SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'ترتيب'}</span>
              <ChevronDown />
            </button>
            {sortOpen && (
              <div className="customers-toolbar__dropdown customers-toolbar__dropdown--sort">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onSortChange(opt.value); setSortOpen(false); }}
                    className={`customers-toolbar__sort-option ${sort === opt.value ? 'customers-toolbar__sort-option--active' : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasActiveFilters && (
            <button type="button" onClick={onResetFilters} className="customers-toolbar__btn">
              <ResetIcon />
              <span>إعادة تعيين</span>
            </button>
          )}

          {/* View toggle */}
          <div className="customers-toolbar__view-toggle">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              title="عرض شبكة"
              className={`customers-toolbar__view-btn ${viewMode === 'grid' ? 'customers-toolbar__view-btn--active' : ''}`}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              title="عرض جدول"
              className={`customers-toolbar__view-btn ${viewMode === 'table' ? 'customers-toolbar__view-btn--active' : ''}`}
            >
              <TableIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
