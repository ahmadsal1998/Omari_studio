import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/app', label: 'لوحة التحكم', icon: '📊' },
    { path: '/app/landing', label: 'محتوى الموقع', icon: '🌐' },
    { path: '/app/customers', label: 'العملاء', icon: '👥' },
    { path: '/app/services', label: 'الخدمات', icon: '🎬' },
    { path: '/app/products', label: 'المنتجات', icon: '📦' },
    { path: '/app/suppliers', label: 'الموردون', icon: '🤝' },
    { path: '/app/bookings', label: 'الحجوزات', icon: '📅' },
    { path: '/app/quick-services', label: 'الخدمات السريعة', icon: '⚡' },
    { path: '/app/expenses', label: 'المصروفات', icon: '💸' },
    { path: '/app/purchases', label: 'المشتريات', icon: '🛒' },
    { path: '/app/statement', label: 'كشف الحساب', icon: '📒' },
    { path: '/app/reports', label: 'التقارير', icon: '📈' },
  ];

  return (
    <div className="layout">
      <button
        type="button"
        className="menu-toggle"
        onClick={() => setSidebarOpen(true)}
        aria-label="فتح القائمة"
      >
        ☰
      </button>
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>استوديو العمري</h2>
          <p className="user-info">
            {user?.username} ({user?.role === 'admin' ? 'مدير' : 'موظف'})
          </p>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${
                location.pathname === item.path ? 'active' : ''
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <button className="logout-btn" onClick={logout}>
          تسجيل الخروج
        </button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
