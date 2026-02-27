import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Booking.css';

const API_BASE = '/api';

interface ServiceOption {
  _id: string;
  name: string;
  sellingPrice: number;
  duration?: number;
}

export default function Booking() {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [shootingDate, setShootingDate] = useState('');
  const [shootingTime, setShootingTime] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    axios.get<ServiceOption[]>(`${API_BASE}/services/public`).then((res) => {
      setServices(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const todayStr = () => new Date().toISOString().slice(0, 10);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !phoneNumber.trim()) {
      setError('الاسم ورقم الهاتف مطلوبان');
      return;
    }
    if (selectedServiceIds.size === 0) {
      setError('يجب اختيار خدمة واحدة على الأقل');
      return;
    }
    if (!shootingDate || !shootingTime) {
      setError('التاريخ والوقت مطلوبان');
      return;
    }
    if (shootingDate < todayStr()) {
      setError('لا يمكن اختيار تاريخ في الماضي');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/bookings/request`, {
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        services: Array.from(selectedServiceIds).map((service) => ({ service, quantity: 1 })),
        products: [],
        shootingDate,
        shootingTime,
      });
      setSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'حدث خطأ. يرجى المحاولة لاحقاً.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="booking-page">
        <div className="booking-loading">جاري تحميل الخدمات...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="booking-page">
        <div className="booking-success">
          <h1>تم إرسال طلب الحجز بنجاح</h1>
          <p>سنتواصل معك قريباً لتأكيد الموعد.</p>
          <Link to="/" className="booking-success-link">العودة للصفحة الرئيسية</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        <div className="booking-header">
          <Link to="/" className="booking-back">← الصفحة الرئيسية</Link>
          <h1>طلب حجز تصوير</h1>
          <p>املأ النموذج وسنتواصل معك لتأكيد الموعد.</p>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
          {error && <div className="booking-error">{error}</div>}

          <section className="booking-section">
            <h2>بيانات التواصل</h2>
            <div className="booking-row">
              <label>الاسم الكامل *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="الاسم الكامل"
              />
            </div>
            <div className="booking-row">
              <label>رقم الهاتف *</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="05xxxxxxxx"
              />
            </div>
            <div className="booking-row">
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
              />
            </div>
            <div className="booking-row">
              <label>ملاحظات</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي تفاصيل إضافية..."
                rows={3}
              />
            </div>
          </section>

          <section className="booking-section">
            <h2>الخدمات</h2>
            {services.length === 0 ? (
              <p className="booking-no-services">لا توجد خدمات متاحة حالياً. تواصل معنا مباشرة.</p>
            ) : (
              <div className="booking-services">
                {services.map((s) => (
                  <button
                    key={s._id}
                    type="button"
                    className={`booking-service-item ${selectedServiceIds.has(s._id) ? 'booking-service-item--selected' : ''}`}
                    onClick={() => toggleService(s._id)}
                    aria-pressed={selectedServiceIds.has(s._id)}
                    aria-label={`${s.name} - ${s.sellingPrice} ₪`}
                  >
                    <span className="booking-service-name">{s.name}</span>
                    <span className="booking-service-price">{s.sellingPrice} ₪</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="booking-section">
            <h2>التاريخ والوقت</h2>
            <div className="booking-row">
              <label>تاريخ التصوير *</label>
              <input
                type="date"
                value={shootingDate}
                onChange={(e) => setShootingDate(e.target.value)}
                min={todayStr()}
                required
              />
            </div>
            <div className="booking-row">
              <label>الوقت *</label>
              <input
                type="time"
                value={shootingTime}
                onChange={(e) => setShootingTime(e.target.value)}
                required
              />
            </div>
          </section>

          <div className="booking-actions">
            <button type="submit" className="booking-submit" disabled={submitting}>
              {submitting ? 'جاري الإرسال...' : 'إرسال طلب الحجز'}
            </button>
            <Link to="/" className="booking-cancel">إلغاء</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
