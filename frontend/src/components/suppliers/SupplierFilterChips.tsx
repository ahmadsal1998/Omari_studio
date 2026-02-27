import type { BalanceFilterChip } from '../../types/supplier';

const CHIPS: { value: BalanceFilterChip; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'debtors', label: 'مدينون' },
  { value: 'creditors', label: 'دائنون' },
];

interface SupplierFilterChipsProps {
  active: BalanceFilterChip;
  onChange: (chip: BalanceFilterChip) => void;
}

export default function SupplierFilterChips({ active, onChange }: SupplierFilterChipsProps) {
  return (
    <div className="suppliers-chips">
      {CHIPS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`suppliers-chips__btn ${active === value ? 'suppliers-chips__btn--active' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
