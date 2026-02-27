import { useState, useRef, useEffect } from 'react';
import type { SortOption, ViewMode } from '../../types/service';
import './ServicesToolbar.css';

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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

const ChevronDown = () => (
  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface ServicesToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  sort: SortOption;
  onSortChange: (v: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (v: ViewMode) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'name_asc', label: 'الاسم (أ-ي)' },
  { value: 'name_desc', label: 'الاسم (ي-أ)' },
  { value: 'price_high', label: 'أعلى سعر بيع' },
  { value: 'price_low', label: 'أقل سعر بيع' },
];

export default function ServicesToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}: ServicesToolbarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (sortRef.current && !sortRef.current.contains(target)) setSortOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  return (
    <div className="services-toolbar">
      <div className="services-toolbar__row">
        <div className="services-toolbar__search-wrap">
          <span className="services-toolbar__search-icon" aria-hidden>
            <SearchIcon />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث عن خدمة..."
            className="services-toolbar__search-input"
            aria-label="بحث عن خدمة"
          />
        </div>

        <div className="services-toolbar__controls">
          <div className="services-toolbar__dropdown-wrap" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen(!sortOpen)}
              className="services-toolbar__btn"
              aria-expanded={sortOpen}
              aria-haspopup="true"
            >
              <SortIcon />
              <span>{SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'ترتيب'}</span>
              <ChevronDown />
            </button>
            {sortOpen && (
              <div className="services-toolbar__dropdown services-toolbar__dropdown--sort">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onSortChange(opt.value);
                      setSortOpen(false);
                    }}
                    className={`services-toolbar__sort-option ${sort === opt.value ? 'services-toolbar__sort-option--active' : ''}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="services-toolbar__view-toggle">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              title="عرض شبكة"
              className={`services-toolbar__view-btn ${viewMode === 'grid' ? 'services-toolbar__view-btn--active' : ''}`}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              title="عرض جدول"
              className={`services-toolbar__view-btn ${viewMode === 'table' ? 'services-toolbar__view-btn--active' : ''}`}
            >
              <TableIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
