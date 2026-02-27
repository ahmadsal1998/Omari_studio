import { Link } from 'react-router-dom';
import type { Supplier } from '../../types/supplier';

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

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg {...(className ? {} : iconSize)} className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

function BalanceCell({ balance }: { balance?: number }) {
  const b = balance ?? 0;
  const positive = b > 0;
  const negative = b < 0;
  const colorClass = positive ? 'text-red-600' : negative ? 'text-emerald-600' : 'text-gray-500';
  const label = positive ? `دين: ${b} ₪` : negative ? `رصيد: ${Math.abs(b)} ₪` : '—';
  return <span className={`font-medium ${colorClass}`}>{label}</span>;
}

interface SuppliersTableViewProps {
  suppliers: Supplier[];
  onEdit: (s: Supplier) => void;
  onDelete: (s: Supplier) => void;
}

export default function SuppliersTableView({ suppliers, onEdit, onDelete }: SuppliersTableViewProps) {
  return (
    <div className="suppliers-table-wrap">
      <div className="suppliers-table-scroll">
        <table className="suppliers-table">
          <thead>
            <tr>
              <th>اسم المورد</th>
              <th>رقم الهاتف</th>
              <th>الرصيد</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier._id}>
                <td style={{ fontWeight: 600 }}>{supplier.name}</td>
                <td>{supplier.phoneNumber}</td>
                <td>
                  <BalanceCell balance={supplier.balance} />
                </td>
                <td>
                  <div className="suppliers-table__actions-cell">
                    <Link
                      to={`/app/statement?entityType=supplier&entityId=${supplier._id}`}
                      className="suppliers-table__action-btn"
                      title="كشف الحساب"
                    >
                      <DocumentIcon className="suppliers-table__action-icon" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onEdit(supplier)}
                      className="suppliers-table__action-btn"
                      title="تعديل"
                    >
                      <PencilIcon className="suppliers-table__action-icon" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(supplier)}
                      className="suppliers-table__action-btn suppliers-table__action-btn--danger"
                      title="حذف"
                    >
                      <TrashIcon className="suppliers-table__action-icon" />
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
