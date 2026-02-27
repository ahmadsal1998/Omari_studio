const Icon = ({ className = '' }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);

export default function ServicesEmptyState() {
  return (
    <div className="services-empty">
      <Icon className="services-empty__icon" />
      <h3 className="services-empty__title">لا توجد خدمات</h3>
      <p className="services-empty__subtitle">
        جرّب تعديل الفلاتر أو البحث للعثور على النتائج
      </p>
    </div>
  );
}
