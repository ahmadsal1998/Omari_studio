import { Link } from 'react-router-dom';
import type { Supplier } from '../../types/supplier';

const BuildingIcon = () => (
  <svg className="suppliers-card__avatar-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M19 7v2m0 0v2m0-2v-2m0 2v2m-4-2v2m0 0v2m0-2v-2m0 2v2" />
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

function BalanceDisplay({ balance }: { balance?: number }) {
  const b = balance ?? 0;
  const positive = b > 0;
  const negative = b < 0;
  const colorClass = positive ? 'text-red-600' : negative ? 'text-emerald-600' : 'text-gray-500';
  const label = positive ? `دين: ${b} ₪` : negative ? `رصيد: ${Math.abs(b)} ₪` : '—';
  return <span className={`font-medium ${colorClass}`}>{label}</span>;
}

interface SuppliersGridViewProps {
  suppliers: Supplier[];
  onEdit: (s: Supplier) => void;
  onDelete: (s: Supplier) => void;
}

export default function SuppliersGridView({ suppliers, onEdit, onDelete }: SuppliersGridViewProps) {
  return (
    <div className="suppliers-grid">
      {suppliers.map((supplier) => (
        <article key={supplier._id} className="suppliers-card">
          <div className="suppliers-card__main">
            <div className="suppliers-card__avatar">
              <BuildingIcon />
            </div>
            <div className="suppliers-card__body">
              <h3 className="suppliers-card__name">{supplier.name}</h3>
              <p className="suppliers-card__phone">{supplier.phoneNumber}</p>
              <div className="suppliers-card__balance">
                <BalanceDisplay balance={supplier.balance} />
              </div>
            </div>
          </div>
          <div className="suppliers-card__actions">
            <Link
              to={`/app/statement?entityType=supplier&entityId=${supplier._id}`}
              className="suppliers-card__action-btn"
              title="كشف الحساب"
            >
              <DocumentIcon className="suppliers-card__action-icon" />
            </Link>
            <button
              type="button"
              onClick={() => onEdit(supplier)}
              className="suppliers-card__action-btn"
              title="تعديل"
            >
              <PencilIcon className="suppliers-card__action-icon" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(supplier)}
              className="suppliers-card__action-btn suppliers-card__action-btn--danger"
              title="حذف"
            >
              <TrashIcon className="suppliers-card__action-icon" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
