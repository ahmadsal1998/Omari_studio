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
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M19 7v2m0 0v2m0-2v-2m0 2v2m-4-2v2m0 0v2m0-2v-2m0 2v2"
    />
  </svg>
);

export default function SuppliersEmptyState() {
  return (
    <div className="suppliers-empty">
      <Icon className="suppliers-empty__icon" />
      <h3 className="suppliers-empty__title">لا يوجد موردون</h3>
      <p className="suppliers-empty__subtitle">
        جرّب تعديل الفلاتر أو البحث للعثور على النتائج
      </p>
    </div>
  );
}
