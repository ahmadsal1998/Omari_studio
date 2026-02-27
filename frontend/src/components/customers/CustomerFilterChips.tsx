import type { BalanceFilterChip } from '../../types/customer';

const CHIPS: { value: BalanceFilterChip; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'debtors', label: 'مدينون' },
  { value: 'creditors', label: 'دائنون' },
  { value: 'vip', label: 'VIP' },
  { value: 'blocked', label: 'محظورون' },
];

interface CustomerFilterChipsProps {
  active: BalanceFilterChip;
  onChange: (chip: BalanceFilterChip) => void;
}

export default function CustomerFilterChips({ active, onChange }: CustomerFilterChipsProps) {
  return (
    <div className="customers-chips">
      {CHIPS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`customers-chips__btn ${active === value ? 'customers-chips__btn--active' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
