import React from 'react';
import './DataTable.css';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  loading?: boolean;
}

function DataTable<T extends { _id?: string; id?: string }>({
  data,
  columns,
  onEdit,
  onDelete,
  loading,
}: DataTableProps<T>) {
  if (loading) {
    return <div className="data-table-loading">جاري التحميل...</div>;
  }

  if (data.length === 0) {
    return <div className="data-table-empty">لا توجد بيانات</div>;
  }

  const getCellContent = (item: T, column: Column<T>) =>
    column.render ? column.render(item) : String(item[column.key as keyof T] ?? '');

  return (
    <div className="data-table-wrapper">
      {/* Desktop: table */}
      <div className="data-table-container data-table-desktop">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)}>{column.label}</th>
              ))}
              {(onEdit || onDelete) && <th className="th-actions">الإجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item._id || item.id}>
                {columns.map((column) => (
                  <td key={String(column.key)}>
                    {getCellContent(item, column)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="actions">
                    {onEdit && (
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => onEdit(item)}
                      >
                        تعديل
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => onDelete(item)}
                      >
                        حذف
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet: card grid */}
      <div className="data-table-cards">
        {data.map((item) => (
          <div key={item._id || item.id} className="data-table-card">
            <div className="data-table-card-body">
              {columns.map((column) => (
                <div key={String(column.key)} className="data-table-card-row">
                  <span className="data-table-card-label">{column.label}</span>
                  <span className="data-table-card-value">{getCellContent(item, column)}</span>
                </div>
              ))}
            </div>
            {(onEdit || onDelete) && (
              <div className="data-table-card-actions">
                {onEdit && (
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => onEdit(item)}
                  >
                    تعديل
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => onDelete(item)}
                  >
                    حذف
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DataTable;
