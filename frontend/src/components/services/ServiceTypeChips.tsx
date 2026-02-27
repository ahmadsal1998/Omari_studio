import type { TypeFilterChip } from '../../types/service';

const CHIPS: { value: TypeFilterChip; label: string }[] = [
  { value: 'all', label: 'جميع الأنواع' },
  { value: 'booking', label: 'خدمات الحجز' },
  { value: 'quick', label: 'الخدمات السريعة' },
];

interface ServiceTypeChipsProps {
  active: TypeFilterChip;
  onChange: (chip: TypeFilterChip) => void;
}

export default function ServiceTypeChips({ active, onChange }: ServiceTypeChipsProps) {
  return (
    <div className="services-chips">
      {CHIPS.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`services-chips__btn ${active === value ? 'services-chips__btn--active' : ''}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
