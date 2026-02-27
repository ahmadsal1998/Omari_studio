import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import './Dashboard.css';

const Dashboard = () => {
  const { data: dailyReport } = useQuery({
    queryKey: ['dailyReport'],
    queryFn: async () => {
      const response = await api.get('/reports/daily');
      return response.data;
    },
  });

  return (
    <div className="page-container dashboard">
      <div className="page-header">
        <h1>لوحة التحكم</h1>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <h3>إجمالي الحجوزات</h3>
            <p className="stat-value">{dailyReport?.bookings?.count || 0}</p>
            <p className="stat-label">إيرادات: {dailyReport?.bookings?.revenue || 0} ₪</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <h3>الخدمات السريعة</h3>
            <p className="stat-value">{dailyReport?.quickServices?.count || 0}</p>
            <p className="stat-label">إيرادات: {dailyReport?.quickServices?.revenue || 0} ₪</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>إجمالي المبيعات</h3>
            <p className="stat-value">{dailyReport?.totals?.sales || 0} ₪</p>
            <p className="stat-label">اليوم</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💸</div>
          <div className="stat-info">
            <h3>المصروفات</h3>
            <p className="stat-value">{dailyReport?.expenses?.total || 0} ₪</p>
            <p className="stat-label">اليوم</p>
          </div>
        </div>
        <div className="stat-card profit">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <h3>صافي الربح</h3>
            <p className="stat-value">{dailyReport?.totals?.netProfit || 0} ₪</p>
            <p className="stat-label">اليوم</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
