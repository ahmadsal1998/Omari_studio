import type { Service, ServiceType } from '../../types/service';

const ServiceIcon = () => (
  <svg className="services-card__avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

function TypeBadge({ type }: { type?: ServiceType }) {
  const t = type ?? 'booking';
  const label = t === 'booking' ? 'حجز' : 'سريع';
  const style = t === 'booking' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

interface ServicesGridViewProps {
  services: Service[];
  onEdit: (s: Service) => void;
  onDelete: (s: Service) => void;
}

export default function ServicesGridView({ services, onEdit, onDelete }: ServicesGridViewProps) {
  return (
    <div className="services-grid">
      {services.map((service) => (
        <article key={service._id} className="services-card">
          <div className="services-card__main">
            <div className="services-card__avatar">
              <ServiceIcon />
            </div>
            <div className="services-card__body">
              <h3 className="services-card__name">{service.name}</h3>
              <div className="services-card__type">
                <TypeBadge type={service.type} />
              </div>
              <div className="services-card__prices">
                <span className="services-card__cost">{service.costPrice} ₪</span>
                <span className="services-card__sep">→</span>
                <span className="services-card__selling">{service.sellingPrice} ₪</span>
              </div>
              {service.duration != null && (
                <p className="services-card__duration">{service.duration} دقيقة</p>
              )}
            </div>
          </div>
          <div className="services-card__actions">
            <button
              type="button"
              onClick={() => onEdit(service)}
              className="services-card__action-btn"
              title="تعديل"
            >
              <PencilIcon className="services-card__action-icon" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(service)}
              className="services-card__action-btn services-card__action-btn--danger"
              title="حذف"
            >
              <TrashIcon className="services-card__action-icon" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
