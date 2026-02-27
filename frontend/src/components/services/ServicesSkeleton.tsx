function CardSkeleton() {
  return (
    <div className="services-card services-skeleton-card">
      <div className="services-card__main">
        <div className="services-card__avatar services-skeleton-avatar" />
        <div className="services-card__body">
          <div className="services-skeleton-line services-skeleton-line--name" />
          <div className="services-skeleton-line services-skeleton-line--sm" />
          <div className="services-skeleton-line services-skeleton-line--xs" />
        </div>
      </div>
      <div className="services-card__actions">
        <div className="services-skeleton-btn" />
        <div className="services-skeleton-btn" />
      </div>
    </div>
  );
}

export function ServicesGridSkeleton() {
  return (
    <div className="services-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ServicesTableSkeleton() {
  return (
    <div className="services-table-wrap">
      <div className="services-table-scroll">
        <table className="services-table">
          <thead>
            <tr>
              {['اسم الخدمة', 'النوع', 'سعر التكلفة', 'سعر البيع', 'المدة', 'الإجراءات'].map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td><span className="services-skeleton-inline" style={{ width: '6rem' }} /></td>
                <td><span className="services-skeleton-inline services-skeleton-badge" style={{ width: '3.5rem' }} /></td>
                <td><span className="services-skeleton-inline" style={{ width: '3rem' }} /></td>
                <td><span className="services-skeleton-inline" style={{ width: '3rem' }} /></td>
                <td><span className="services-skeleton-inline" style={{ width: '3rem' }} /></td>
                <td><span className="services-skeleton-inline" style={{ width: '5rem' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
