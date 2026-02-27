function CardSkeleton() {
  return (
    <div className="suppliers-card suppliers-skeleton-card">
      <div className="suppliers-card__main">
        <div className="suppliers-card__avatar suppliers-skeleton-avatar" />
        <div className="suppliers-card__body">
          <div className="suppliers-skeleton-line suppliers-skeleton-line--name" />
          <div className="suppliers-skeleton-line suppliers-skeleton-line--sm" />
          <div className="suppliers-skeleton-line suppliers-skeleton-line--xs" />
        </div>
      </div>
      <div className="suppliers-card__actions">
        <div className="suppliers-skeleton-btn" />
        <div className="suppliers-skeleton-btn" />
        <div className="suppliers-skeleton-btn" />
      </div>
    </div>
  );
}

export function SuppliersGridSkeleton() {
  return (
    <div className="suppliers-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SuppliersTableSkeleton() {
  return (
    <div className="suppliers-table-wrap">
      <div className="suppliers-table-scroll">
        <table className="suppliers-table">
          <thead>
            <tr>
              {['اسم المورد', 'رقم الهاتف', 'الرصيد', 'الإجراءات'].map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td><span className="suppliers-skeleton-inline" style={{ width: '6rem' }} /></td>
                <td><span className="suppliers-skeleton-inline" style={{ width: '7rem' }} /></td>
                <td><span className="suppliers-skeleton-inline" style={{ width: '4rem' }} /></td>
                <td><span className="suppliers-skeleton-inline" style={{ width: '6rem' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
