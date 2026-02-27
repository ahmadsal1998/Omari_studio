function CardSkeleton() {
  return (
    <div className="customers-card customers-skeleton-card">
      <div className="customers-card__main">
        <div className="customers-card__avatar customers-skeleton-avatar" />
        <div className="customers-card__body">
          <div className="customers-skeleton-line customers-skeleton-line--name" />
          <div className="customers-skeleton-line customers-skeleton-line--sm" />
          <div className="customers-skeleton-line customers-skeleton-line--xs" />
          <div className="customers-skeleton-badge" />
        </div>
      </div>
      <div className="customers-card__actions">
        <div className="customers-skeleton-btn" />
        <div className="customers-skeleton-btn" />
        <div className="customers-skeleton-btn" />
      </div>
    </div>
  );
}

export function CustomersGridSkeleton() {
  return (
    <div className="customers-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CustomersTableSkeleton() {
  return (
    <div className="customers-table-wrap">
      <div className="customers-table-scroll">
        <table className="customers-table">
        <thead>
          <tr>
            {['الاسم', 'الهاتف', 'الرصيد', 'المدينة', 'الحالة', 'الإجراءات'].map((label) => (
              <th key={label}>{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i}>
              <td><span className="customers-skeleton-inline" style={{ width: '6rem' }} /></td>
              <td><span className="customers-skeleton-inline" style={{ width: '7rem' }} /></td>
              <td><span className="customers-skeleton-inline" style={{ width: '4rem' }} /></td>
              <td><span className="customers-skeleton-inline" style={{ width: '5rem' }} /></td>
              <td><span className="customers-skeleton-inline customers-skeleton-badge" style={{ width: '3.5rem' }} /></td>
              <td><span className="customers-skeleton-inline" style={{ width: '6rem' }} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}
