import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import './PageStyles.css';
import './Reports.css';

const Reports = () => {
  const [reportType, setReportType] = useState<'daily' | 'monthly'>('daily');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: dailyReport, isLoading: dailyLoading } = useQuery({
    queryKey: ['dailyReport', date],
    queryFn: async () => {
      const response = await api.get('/reports/daily', { params: { date } });
      return response.data;
    },
    enabled: reportType === 'daily',
  });

  const { data: monthlyReport, isLoading: monthlyLoading } = useQuery({
    queryKey: ['monthlyReport', year, month],
    queryFn: async () => {
      const response = await api.get('/reports/monthly', { params: { year, month } });
      return response.data;
    },
    enabled: reportType === 'monthly',
  });

  const { data: profitPerService } = useQuery({
    queryKey: ['profitPerService'],
    queryFn: async () => {
      const response = await api.get('/reports/profit-per-service');
      return response.data;
    },
  });

  const report = reportType === 'daily' ? dailyReport : monthlyReport;
  const loading = reportType === 'daily' ? dailyLoading : monthlyLoading;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>التقارير والتحليلات</h1>
      </div>

      <div className="report-filters">
        <div className="filter-group">
          <label>نوع التقرير:</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value as 'daily' | 'monthly')}>
            <option value="daily">تقرير يومي</option>
            <option value="monthly">تقرير شهري</option>
          </select>
        </div>

        {reportType === 'daily' ? (
          <div className="filter-group">
            <label>التاريخ:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        ) : (
          <>
            <div className="filter-group">
              <label>الشهر:</label>
              <input
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
              />
            </div>
            <div className="filter-group">
              <label>السنة:</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              />
            </div>
          </>
        )}
      </div>

      {loading ? (
        <div className="loading">جاري التحميل...</div>
      ) : (
        report && (
          <div className="report-content">
            <div className="report-section">
              <h2>ملخص الحجوزات</h2>
              <div className="report-stats">
                <div className="stat-item">
                  <span className="stat-label">عدد الحجوزات:</span>
                  <span className="stat-value">{report.bookings?.count || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">الإيرادات:</span>
                  <span className="stat-value">{report.bookings?.revenue || 0} ₪</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">التكلفة:</span>
                  <span className="stat-value">{report.bookings?.cost || 0} ₪</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">الربح:</span>
                  <span className="stat-value profit">{report.bookings?.profit || 0} ₪</span>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h2>ملخص الخدمات السريعة</h2>
              <div className="report-stats">
                <div className="stat-item">
                  <span className="stat-label">عدد المعاملات:</span>
                  <span className="stat-value">{report.quickServices?.count || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">الإيرادات:</span>
                  <span className="stat-value">{report.quickServices?.revenue || 0} ₪</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">التكلفة:</span>
                  <span className="stat-value">{report.quickServices?.cost || 0} ₪</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">الربح:</span>
                  <span className="stat-value profit">{report.quickServices?.profit || 0} ₪</span>
                </div>
              </div>
            </div>

            <div className="report-section">
              <h2>المصروفات</h2>
              <div className="report-stats">
                <div className="stat-item">
                  <span className="stat-label">عدد المصروفات:</span>
                  <span className="stat-value">{report.expenses?.count || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">إجمالي المصروفات:</span>
                  <span className="stat-value expense">{report.expenses?.total || 0} ₪</span>
                </div>
              </div>
            </div>

            <div className="report-section summary">
              <h2>الملخص الإجمالي</h2>
              <div className="report-stats">
                <div className="stat-item">
                  <span className="stat-label">إجمالي المبيعات:</span>
                  <span className="stat-value">{report.totals?.sales || 0} ₪</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">إجمالي المصروفات:</span>
                  <span className="stat-value expense">{report.totals?.expenses || 0} ₪</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">صافي الربح:</span>
                  <span className="stat-value profit large">{report.totals?.netProfit || 0} ₪</span>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {profitPerService && profitPerService.length > 0 && (
        <div className="report-section">
          <h2>الربح حسب الخدمة</h2>
          <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>اسم الخدمة</th>
                <th>الكمية</th>
                <th>الربح</th>
              </tr>
            </thead>
            <tbody>
              {profitPerService.map((item: any, index: number) => (
                <tr key={index}>
                  <td>{item.service?.name || '-'}</td>
                  <td>{item.quantity}</td>
                  <td>{item.profit} ₪</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
