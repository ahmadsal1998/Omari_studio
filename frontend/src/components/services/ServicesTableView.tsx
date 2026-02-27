import type { Service, ServiceType } from '../../types/service';

const iconSize = { width: 16, height: 16 };

const PencilIcon = ({ className }: { className?: string }) => (
  <svg {...(className ? {} : iconSize)} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg {...(className ? {} : iconSize)} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

function TypeCell({ type }: { type?: ServiceType }) {
  const t = type ?? 'booking';
  const label = t === 'booking' ? 'حجز' : 'سريع';
  const style = t === 'booking' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

interface ServicesTableViewProps {
  services: Service[];
  onEdit: (s: Service) => void;
  onDelete: (s: Service) => void;
}

export default function ServicesTableView({ services, onEdit, onDelete }: ServicesTableViewProps) {
  return (
    <div className="services-table-wrap">
      <div className="services-table-scroll">
        <table className="services-table">
          <thead>
            <tr>
              <th>اسم الخدمة</th>
              <th>النوع</th>
              <th>سعر التكلفة</th>
              <th>سعر البيع</th>
              <th>المدة (دقيقة)</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service._id}>
                <td style={{ fontWeight: 600 }}>{service.name}</td>
                <td>
                  <TypeCell type={service.type} />
                </td>
                <td>{service.costPrice} ₪</td>
                <td>{service.sellingPrice} ₪</td>
                <td style={{ color: 'var(--color-text-muted)' }}>{service.duration ?? '—'}</td>
                <td>
                  <div className="services-table__actions-cell">
                    <button
                      type="button"
                      onClick={() => onEdit(service)}
                      className="services-table__action-btn"
                      title="تعديل"
                    >
                      <PencilIcon className="services-table__action-icon" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(service)}
                      className="services-table__action-btn services-table__action-btn--danger"
                      title="حذف"
                    >
                      <TrashIcon className="services-table__action-icon" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
