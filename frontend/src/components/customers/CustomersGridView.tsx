import { Link } from 'react-router-dom';
import type { Customer, CustomerStatus } from '../../types/customer';

const UserIcon = () => (
  <svg className="customers-card__avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className ?? 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

function StatusBadge({ status }: { status?: CustomerStatus }) {
  const s = status ?? 'active';
  const styles: Record<CustomerStatus, string> = {
    active: 'bg-emerald-50 text-emerald-700',
    blocked: 'bg-red-50 text-red-700',
    vip: 'bg-amber-50 text-amber-700',
  };
  const labels: Record<CustomerStatus, string> = {
    active: 'نشط',
    blocked: 'محظور',
    vip: 'VIP',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${styles[s]}`}>
      {labels[s]}
    </span>
  );
}

function BalanceDisplay({ balance }: { balance?: number }) {
  const b = balance ?? 0;
  const positive = b > 0; // debt (customer owes)
  const negative = b < 0; // credit
  const colorClass = positive ? 'text-red-600' : negative ? 'text-emerald-600' : 'text-gray-500';
  const label = positive ? `دين: ${b} ₪` : negative ? `رصيد: ${Math.abs(b)} ₪` : '—';
  return <span className={`font-medium ${colorClass}`}>{label}</span>;
}

interface CustomersGridViewProps {
  customers: Customer[];
  onEdit: (c: Customer) => void;
  onDelete: (c: Customer) => void;
}

export default function CustomersGridView({ customers, onEdit, onDelete }: CustomersGridViewProps) {
  return (
    <div className="customers-grid">
      {customers.map((customer) => (
        <article key={customer._id} className="customers-card">
          <div className="customers-card__main">
            <div className="customers-card__avatar">
              <UserIcon />
            </div>
            <div className="customers-card__body">
              <h3 className="customers-card__name">{customer.fullName}</h3>
              <p className="customers-card__phone">{customer.phoneNumber}</p>
              <div className="customers-card__balance">
                <BalanceDisplay balance={customer.balance} />
              </div>
              {customer.city && (
                <p className="customers-card__city">{customer.city}</p>
              )}
              <div>
                <StatusBadge status={customer.status} />
              </div>
            </div>
          </div>
          <div className="customers-card__actions">
            <Link
              to={`/app/statement?entityType=customer&entityId=${customer._id}`}
              className="customers-card__action-btn"
              title="كشف الحساب"
            >
              <DocumentIcon className="customers-card__action-icon" />
            </Link>
            <button
              type="button"
              onClick={() => onEdit(customer)}
              className="customers-card__action-btn"
              title="تعديل"
            >
              <PencilIcon className="customers-card__action-icon" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(customer)}
              className="customers-card__action-btn customers-card__action-btn--danger"
              title="حذف"
            >
              <TrashIcon className="customers-card__action-icon" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
