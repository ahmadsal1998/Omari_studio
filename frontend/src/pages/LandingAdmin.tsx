import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { ImageUpload } from '../components/ImageUpload';
import { MultiImageUpload } from '../components/MultiImageUpload';
import './PageStyles.css';
import './LandingAdmin.css';

/** Extract embed URL from pasted iframe HTML or return the URL as-is. */
function extractMapEmbedUrl(value: string | undefined): string {
  if (!value || !value.trim()) return '';
  const trimmed = value.trim();
  const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
  if (srcMatch) return srcMatch[1].trim();
  return trimmed;
}

/** Week days for working hours (order: Sunday=0 to Saturday=6, matches JS getDay()). */
const WEEK_DAYS = [
  { key: 'sunday', label: 'الأحد' },
  { key: 'monday', label: 'الإثنين' },
  { key: 'tuesday', label: 'الثلاثاء' },
  { key: 'wednesday', label: 'الأربعاء' },
  { key: 'thursday', label: 'الخميس' },
  { key: 'friday', label: 'الجمعة' },
  { key: 'saturday', label: 'السبت' },
] as const;

type DayHours = { day: string; open: string; close: string; isClosed: boolean };

function defaultWeekHours(): DayHours[] {
  return WEEK_DAYS.map((d) => ({
    day: d.key,
    open: '09:00',
    close: '18:00',
    isClosed: false,
  }));
}

function mergeHoursWithDefaults(saved: DayHours[] | undefined): DayHours[] {
  const byDay = new Map((saved ?? []).map((h) => [h.day.toLowerCase(), h]));
  return WEEK_DAYS.map((d) => {
    const existing = byDay.get(d.key);
    return existing ?? { day: d.key, open: '09:00', close: '18:00', isClosed: false };
  });
}

const TABS = [
  { id: 'hero', label: 'القسم الرئيسي (Hero)' },
  { id: 'gallery', label: 'المعرض' },
  { id: 'offers', label: 'العروض والباقات' },
  { id: 'locations', label: 'الموقع وساعات العمل' },
  { id: 'testimonials', label: 'آراء العملاء' },
  { id: 'faq', label: 'الأسئلة الشائعة' },
  { id: 'blog', label: 'المدونة' },
  { id: 'settings', label: 'إعدادات الموقع والفوتر' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function LandingAdmin() {
  const [activeTab, setActiveTab] = useState<TabId>('hero');
  const queryClient = useQueryClient();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>محتوى الصفحة الرئيسية</h1>
        <a href="/" target="_blank" rel="noopener noreferrer" className="btn-secondary">
          معاينة الموقع
        </a>
      </div>

      <div className="landing-admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`landing-admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="landing-admin-content">
        {activeTab === 'hero' && <HeroEditor queryClient={queryClient} />}
        {activeTab === 'gallery' && <GalleryEditor queryClient={queryClient} />}
        {activeTab === 'offers' && <OffersEditor queryClient={queryClient} />}
        {activeTab === 'locations' && <LocationsEditor queryClient={queryClient} />}
        {activeTab === 'testimonials' && <TestimonialsEditor queryClient={queryClient} />}
        {activeTab === 'faq' && <FaqEditor queryClient={queryClient} />}
        {activeTab === 'blog' && <BlogEditor queryClient={queryClient} />}
        {activeTab === 'settings' && <SettingsEditor queryClient={queryClient} />}
      </div>
    </div>
  );
}

function HeroEditor({ queryClient }: { queryClient: ReturnType<typeof useQueryClient> }) {
  const { data: hero, isLoading } = useQuery({
    queryKey: ['landing', 'hero'],
    queryFn: async () => (await api.get('/landing/admin/hero')).data,
  });
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    backgroundImageUrls: [] as string[],
    primaryBackgroundIndex: 0,
    backgroundVideoUrl: '',
    ctaText: 'احجز الآن',
    ctaLink: '/booking',
    introText: '',
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    if (hero) {
      const urls = Array.isArray(hero.backgroundImageUrls) ? hero.backgroundImageUrls : (hero.backgroundImageUrl ? [hero.backgroundImageUrl] : []);
      setForm({
        title: hero.title ?? '',
        subtitle: hero.subtitle ?? '',
        backgroundImageUrls: urls,
        primaryBackgroundIndex: Math.min(hero.primaryBackgroundIndex ?? 0, Math.max(0, urls.length - 1)),
        backgroundVideoUrl: hero.backgroundVideoUrl ?? '',
        ctaText: hero.ctaText ?? 'احجز الآن',
        ctaLink: hero.ctaLink ?? '/booking',
        introText: hero.introText ?? '',
        isActive: hero.isActive ?? true,
        order: hero.order ?? 0,
      });
    }
  }, [hero]);

  const updateMutation = useMutation({
    mutationFn: (body: typeof form) => api.put('/landing/admin/hero', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing', 'hero'] }),
  });

  const heroImageValidationMessage =
    form.backgroundImageUrls.length === 0
      ? 'يجب إضافة صورة خلفية واحدة على الأقل قبل الحفظ.'
      : null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.backgroundImageUrls.length === 0) return;
    updateMutation.mutate(form);
  };

  if (isLoading && !hero) return <div className="landing-admin-loading">جاري التحميل...</div>;

  return (
    <form onSubmit={handleSubmit} className="landing-admin-form">
      <div className="form-row">
        <label>العنوان</label>
        <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required />
      </div>
      <div className="form-row">
        <label>العنوان الفرعي</label>
        <input value={form.subtitle} onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))} />
      </div>
      <MultiImageUpload
        value={form.backgroundImageUrls}
        onChange={(urls) => setForm((p) => ({ ...p, backgroundImageUrls: urls }))}
        primaryIndex={form.primaryBackgroundIndex}
        onPrimaryChange={(index) => setForm((p) => ({ ...p, primaryBackgroundIndex: index }))}
        folder="hero"
        label="صور الخلفية"
        required
        maxCount={4}
      />
      {(heroImageValidationMessage || (updateMutation.isError && (updateMutation.error as any)?.response?.data?.message)) && (
        <div className="form-row">
          <span className="image-upload-error">
            {heroImageValidationMessage ?? (updateMutation.error as any)?.response?.data?.message}
          </span>
        </div>
      )}
      <button
        type="submit"
        className="btn-primary"
        disabled={updateMutation.isPending || form.backgroundImageUrls.length === 0}
      >
        {updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
      </button>
    </form>
  );
}

function GalleryEditor({ queryClient }: { queryClient: ReturnType<typeof useQueryClient> }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ['landing', 'gallery'],
    queryFn: async () => (await api.get('/landing/admin/gallery')).data,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ imageUrl: '', title: '', eventType: 'wedding' as const, order: 0 });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => api.post('/landing/admin/gallery', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing', 'gallery'] }); setModalOpen(false); setForm({ imageUrl: '', title: '', eventType: 'wedding', order: 0 }); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> }) => api.put(`/landing/admin/gallery/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing', 'gallery'] }); setModalOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/landing/admin/gallery/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing', 'gallery'] }),
  });

  const openNew = () => { setEditing(null); setForm({ imageUrl: '', title: '', eventType: 'wedding', order: items?.length ?? 0 }); setModalOpen(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ imageUrl: item.imageUrl, title: item.title ?? '', eventType: item.eventType ?? 'wedding', order: item.order ?? 0 }); setModalOpen(true); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing._id, data: form });
    else createMutation.mutate(form);
  };

  if (isLoading) return <div className="landing-admin-loading">جاري التحميل...</div>;

  return (
    <>
      <button type="button" className="btn-primary" onClick={openNew}>إضافة صورة</button>
      <div className="landing-admin-list">
        {(items ?? []).map((item: any) => (
          <div key={item._id} className="landing-admin-card">
            <img src={item.imageUrl} alt="" className="landing-admin-card-img" />
            <div className="landing-admin-card-body">
              <span>{item.title || item.eventType}</span>
              <div>
                <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(item)}>تعديل</button>
                <button type="button" className="btn-danger btn-sm" onClick={() => window.confirm('حذف؟') && deleteMutation.mutate(item._id)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && (
        <div className="landing-admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="landing-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'تعديل' : 'إضافة'}</h3>
            <form onSubmit={handleSubmit}>
              <ImageUpload value={form.imageUrl} onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))} folder="gallery" label="الصورة" required />
              <div className="form-row"><label>العنوان</label><input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} /></div>
              <div className="form-row">
                <label>نوع المناسبة</label>
                <select value={form.eventType} onChange={(e) => setForm((p) => ({ ...p, eventType: e.target.value as any }))}>
                  <option value="wedding">أعراس</option>
                  <option value="engagement">خطوبة</option>
                  <option value="private_events">مناسبات خاصة</option>
                </select>
              </div>
              <div className="form-row"><label>الترتيب</label><input type="number" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: parseInt(e.target.value, 10) || 0 }))} /></div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">حفظ</button>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function OffersEditor({ queryClient }: { queryClient: ReturnType<typeof useQueryClient> }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ['landing', 'offers'],
    queryFn: async () => (await api.get('/landing/admin/offers')).data,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '', price: 0, originalPrice: 0, currency: '₪', features: '', order: 0 });

  const normalizeFeatures = (val: string | string[] | undefined): string[] => {
    if (Array.isArray(val)) return val.filter(Boolean);
    if (typeof val === 'string') return val.split('\n').map((s) => s.trim()).filter(Boolean);
    return [];
  };
  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/landing/admin/offers', { ...body, features: normalizeFeatures(body.features) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing', 'offers'] }); setModalOpen(false); },
    onError: (err: any) => alert(err?.response?.data?.message || err?.message || 'فشل حفظ العرض'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/landing/admin/offers/${id}`, { ...data, features: normalizeFeatures(data.features) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing', 'offers'] }); setModalOpen(false); setEditing(null); },
    onError: (err: any) => alert(err?.response?.data?.message || err?.message || 'فشل تحديث العرض'),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/landing/admin/offers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing', 'offers'] }),
  });

  const openNew = () => { setEditing(null); setForm({ title: '', description: '', imageUrl: '', price: 0, originalPrice: 0, currency: '₪', features: '', order: items?.length ?? 0 }); setModalOpen(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ title: item.title ?? '', description: item.description ?? '', imageUrl: item.imageUrl ?? '', price: item.price ?? 0, originalPrice: item.originalPrice ?? 0, currency: item.currency ?? '₪', features: (item.features || []).join('\n'), order: item.order ?? 0 }); setModalOpen(true); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, features: form.features ? form.features.split('\n').map(s => s.trim()).filter(Boolean) : [] };
    if (editing) updateMutation.mutate({ id: editing._id, data: payload });
    else createMutation.mutate(payload);
  };

  if (isLoading) return <div className="landing-admin-loading">جاري التحميل...</div>;

  return (
    <>
      <button type="button" className="btn-primary" onClick={openNew}>إضافة عرض</button>
      <div className="landing-admin-list">
        {(items ?? []).map((item: any) => (
          <div key={item._id} className="landing-admin-card">
            <img src={item.imageUrl} alt="" className="landing-admin-card-img" />
            <div className="landing-admin-card-body">
              <span>{item.title} — {item.price} {item.currency}</span>
              <div>
                <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(item)}>تعديل</button>
                <button type="button" className="btn-danger btn-sm" onClick={() => window.confirm('حذف؟') && deleteMutation.mutate(item._id)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && (
        <div className="landing-admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="landing-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'تعديل عرض' : 'إضافة عرض'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row"><label>العنوان</label><input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required /></div>
              <div className="form-row"><label>الوصف</label><textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} /></div>
              <ImageUpload value={form.imageUrl} onChange={(url) => setForm((p) => ({ ...p, imageUrl: url }))} folder="offers" label="الصورة" required />
              <div className="form-row"><label>السعر</label><input type="number" min={0} value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: parseFloat(e.target.value) || 0 }))} required /></div>
              <div className="form-row"><label>السعر قبل الخصم</label><input type="number" min={0} value={form.originalPrice || ''} onChange={(e) => setForm((p) => ({ ...p, originalPrice: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="form-row"><label>المميزات (سطر لكل نقطة)</label><textarea value={form.features} onChange={(e) => setForm((p) => ({ ...p, features: e.target.value }))} rows={3} /></div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function LocationsEditor({ queryClient }: { queryClient: ReturnType<typeof useQueryClient> }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ['landing', 'locations'],
    queryFn: async () => (await api.get('/landing/admin/locations')).data,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<{
    name: string;
    address: string;
    mapEmbedUrl: string;
    phone: string;
    email: string;
    order: number;
    hours: DayHours[];
  }>({ name: '', address: '', mapEmbedUrl: '', phone: '', email: '', order: 0, hours: defaultWeekHours() });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/landing/admin/locations', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing', 'locations'] }); setModalOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/landing/admin/locations/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing', 'locations'] }); setModalOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/landing/admin/locations/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing', 'locations'] }),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', address: '', mapEmbedUrl: '', phone: '', email: '', order: items?.length ?? 0, hours: defaultWeekHours() });
    setModalOpen(true);
  };
  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      name: item.name ?? '',
      address: item.address ?? '',
      mapEmbedUrl: item.mapEmbedUrl ?? '',
      phone: item.phone ?? '',
      email: item.email ?? '',
      order: item.order ?? 0,
      hours: mergeHoursWithDefaults(item.hours),
    });
    setModalOpen(true);
  };
  const updateDayHour = (dayKey: string, patch: Partial<DayHours>) => {
    setForm((p) => ({
      ...p,
      hours: p.hours.map((h) => (h.day.toLowerCase() === dayKey ? { ...h, ...patch } : h)),
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      mapEmbedUrl: extractMapEmbedUrl(form.mapEmbedUrl),
      hours: form.hours,
    };
    if (editing) updateMutation.mutate({ id: editing._id, data: { ...payload, hours: payload.hours } });
    else createMutation.mutate(payload);
  };

  if (isLoading) return <div className="landing-admin-loading">جاري التحميل...</div>;

  return (
    <>
      <button type="button" className="btn-primary" onClick={openNew}>إضافة موقع</button>
      <div className="landing-admin-list">
        {(items ?? []).map((item: any) => (
          <div key={item._id} className="landing-admin-card">
            <div className="landing-admin-card-body">
              <span><strong>{item.name}</strong> — {item.address}</span>
              <div>
                <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(item)}>تعديل</button>
                <button type="button" className="btn-danger btn-sm" onClick={() => window.confirm('حذف؟') && deleteMutation.mutate(item._id)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && (
        <div className="landing-admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="landing-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'تعديل موقع' : 'إضافة موقع'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row"><label>الاسم</label><input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required /></div>
              <div className="form-row"><label>العنوان</label><input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} required /></div>
              <div className="form-row"><label>رابط خريطة Google (embed)</label><input value={form.mapEmbedUrl} onChange={(e) => setForm((p) => ({ ...p, mapEmbedUrl: e.target.value }))} placeholder="https://www.google.com/maps/embed?pb=..." /></div>
              <div className="form-row"><label>الهاتف</label><input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
              <div className="form-row"><label>البريد</label><input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
              <div className="form-row">
                <label>ساعات العمل</label>
                <div className="landing-admin-hours-editor">
                  {WEEK_DAYS.map((d, i) => {
                    const h = form.hours[i];
                    if (!h) return null;
                    return (
                      <div key={d.key} className="landing-admin-hour-row">
                        <span className="landing-admin-hour-day">{d.label}</span>
                        <label className="landing-admin-hour-closed">
                          <input
                            type="checkbox"
                            checked={!!h.isClosed}
                            onChange={(e) => updateDayHour(d.key, { isClosed: e.target.checked })}
                          />
                          مغلق
                        </label>
                        <input
                          type="time"
                          className="landing-admin-hour-time"
                          value={h.open}
                          disabled={!!h.isClosed}
                          onChange={(e) => updateDayHour(d.key, { open: e.target.value })}
                        />
                        <span className="landing-admin-hour-sep">–</span>
                        <input
                          type="time"
                          className="landing-admin-hour-time"
                          value={h.close}
                          disabled={!!h.isClosed}
                          onChange={(e) => updateDayHour(d.key, { close: e.target.value })}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">حفظ</button>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function TestimonialsEditor({ queryClient }: { queryClient: ReturnType<typeof useQueryClient> }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ['landing', 'testimonials'],
    queryFn: async () => (await api.get('/landing/admin/testimonials')).data,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ clientName: '', clientImageUrl: '', text: '', eventType: '', rating: 5, order: 0 });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => api.post('/landing/admin/testimonials', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing', 'testimonials'] }); setModalOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> }) => api.put(`/landing/admin/testimonials/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing', 'testimonials'] }); setModalOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/landing/admin/testimonials/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing', 'testimonials'] }),
  });

  const openNew = () => { setEditing(null); setForm({ clientName: '', clientImageUrl: '', text: '', eventType: '', rating: 5, order: items?.length ?? 0 }); setModalOpen(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ clientName: item.clientName ?? '', clientImageUrl: item.clientImageUrl ?? '', text: item.text ?? '', eventType: item.eventType ?? '', rating: item.rating ?? 5, order: item.order ?? 0 }); setModalOpen(true); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing._id, data: form });
    else createMutation.mutate(form);
  };

  if (isLoading) return <div className="landing-admin-loading">جاري التحميل...</div>;

  return (
    <>
      <button type="button" className="btn-primary" onClick={openNew}>إضافة رأي</button>
      <div className="landing-admin-list">
        {(items ?? []).map((item: any) => (
          <div key={item._id} className="landing-admin-card">
            <div className="landing-admin-card-body">
              <span><strong>{item.clientName}</strong> — {item.text.slice(0, 60)}...</span>
              <div>
                <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(item)}>تعديل</button>
                <button type="button" className="btn-danger btn-sm" onClick={() => window.confirm('حذف؟') && deleteMutation.mutate(item._id)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && (
        <div className="landing-admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="landing-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'تعديل رأي' : 'إضافة رأي'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row"><label>اسم العميل</label><input value={form.clientName} onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} required /></div>
              <ImageUpload value={form.clientImageUrl} onChange={(url) => setForm((p) => ({ ...p, clientImageUrl: url }))} folder="testimonials" label="صورة العميل" />
              <div className="form-row"><label>نص الرأي</label><textarea value={form.text} onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))} rows={4} required /></div>
              <div className="form-row"><label>نوع المناسبة</label><input value={form.eventType} onChange={(e) => setForm((p) => ({ ...p, eventType: e.target.value }))} /></div>
              <div className="form-row"><label>التقييم (0-5)</label><input type="number" min={0} max={5} value={form.rating} onChange={(e) => setForm((p) => ({ ...p, rating: parseInt(e.target.value, 10) || 0 }))} /></div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">حفظ</button>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function FaqEditor({ queryClient }: { queryClient: ReturnType<typeof useQueryClient> }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ['landing', 'faq'],
    queryFn: async () => (await api.get('/landing/admin/faq')).data,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ question: '', answer: '', order: 0 });

  const createMutation = useMutation({
    mutationFn: (body: typeof form) => api.post('/landing/admin/faq', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing', 'faq'] }); setModalOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form> }) => api.put(`/landing/admin/faq/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing', 'faq'] }); setModalOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/landing/admin/faq/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing', 'faq'] }),
  });

  const openNew = () => { setEditing(null); setForm({ question: '', answer: '', order: items?.length ?? 0 }); setModalOpen(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ question: item.question ?? '', answer: item.answer ?? '', order: item.order ?? 0 }); setModalOpen(true); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing._id, data: form });
    else createMutation.mutate(form);
  };

  if (isLoading) return <div className="landing-admin-loading">جاري التحميل...</div>;

  return (
    <>
      <button type="button" className="btn-primary" onClick={openNew}>إضافة سؤال</button>
      <div className="landing-admin-list">
        {(items ?? []).map((item: any) => (
          <div key={item._id} className="landing-admin-card">
            <div className="landing-admin-card-body">
              <span><strong>{item.question}</strong></span>
              <div>
                <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(item)}>تعديل</button>
                <button type="button" className="btn-danger btn-sm" onClick={() => window.confirm('حذف؟') && deleteMutation.mutate(item._id)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && (
        <div className="landing-admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="landing-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'تعديل سؤال' : 'إضافة سؤال'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row"><label>السؤال</label><input value={form.question} onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))} required /></div>
              <div className="form-row"><label>الإجابة</label><textarea value={form.answer} onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))} rows={4} required /></div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">حفظ</button>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function BlogEditor({ queryClient }: { queryClient: ReturnType<typeof useQueryClient> }) {
  const { data: items, isLoading } = useQuery({
    queryKey: ['landing', 'blog'],
    queryFn: async () => (await api.get('/landing/admin/blog')).data,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', content: '', coverImageUrl: '', author: '', order: 0 });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/landing/admin/blog', body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing', 'blog'] }); setModalOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.put(`/landing/admin/blog/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['landing', 'blog'] }); setModalOpen(false); setEditing(null); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/landing/admin/blog/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing', 'blog'] }),
  });

  const openNew = () => { setEditing(null); setForm({ title: '', slug: '', excerpt: '', content: '', coverImageUrl: '', author: '', order: items?.length ?? 0 }); setModalOpen(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ title: item.title ?? '', slug: item.slug ?? '', excerpt: item.excerpt ?? '', content: item.content ?? '', coverImageUrl: item.coverImageUrl ?? '', author: item.author ?? '', order: item.order ?? 0 }); setModalOpen(true); };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing._id, data: form });
    else createMutation.mutate(form);
  };

  if (isLoading) return <div className="landing-admin-loading">جاري التحميل...</div>;

  return (
    <>
      <button type="button" className="btn-primary" onClick={openNew}>إضافة مقال</button>
      <div className="landing-admin-list">
        {(items ?? []).map((item: any) => (
          <div key={item._id} className="landing-admin-card">
            {item.coverImageUrl && <img src={item.coverImageUrl} alt="" className="landing-admin-card-img" />}
            <div className="landing-admin-card-body">
              <span><strong>{item.title}</strong></span>
              <div>
                <button type="button" className="btn-secondary btn-sm" onClick={() => openEdit(item)}>تعديل</button>
                <button type="button" className="btn-danger btn-sm" onClick={() => window.confirm('حذف؟') && deleteMutation.mutate(item._id)}>حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modalOpen && (
        <div className="landing-admin-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="landing-admin-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? 'تعديل مقال' : 'إضافة مقال'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row"><label>العنوان</label><input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required /></div>
              <div className="form-row"><label>الرابط (slug)</label><input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} placeholder="article-title" required /></div>
              <div className="form-row"><label>المقتطف</label><textarea value={form.excerpt} onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))} rows={2} /></div>
              <div className="form-row"><label>المحتوى</label><textarea value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} rows={6} /></div>
              <ImageUpload value={form.coverImageUrl} onChange={(url) => setForm((p) => ({ ...p, coverImageUrl: url }))} folder="blog" label="صورة الغلاف" required />
              <div className="form-row"><label>الكاتب</label><input value={form.author} onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))} /></div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">حفظ</button>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SettingsEditor({ queryClient }: { queryClient: ReturnType<typeof useQueryClient> }) {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['landing', 'settings'],
    queryFn: async () => (await api.get('/landing/admin/settings')).data,
  });
  const [form, setForm] = useState({
    siteName: 'استوديو العمري',
    phone: '',
    email: '',
    mapLink: '',
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    whatsappNumber: '',
    footerText: '',
  });

  useEffect(() => {
    if (settings) setForm((p) => ({ ...p, ...settings }));
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (body: typeof form) => api.put('/landing/admin/settings', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['landing', 'settings'] }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  if (isLoading && !settings) return <div className="landing-admin-loading">جاري التحميل...</div>;

  return (
    <form onSubmit={handleSubmit} className="landing-admin-form">
      <div className="form-row"><label>اسم الموقع</label><input value={form.siteName} onChange={(e) => setForm((p) => ({ ...p, siteName: e.target.value }))} /></div>
      <div className="form-row"><label>الهاتف</label><input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></div>
      <div className="form-row"><label>البريد</label><input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></div>
      <div className="form-row"><label>رابط الخريطة</label><input value={form.mapLink} onChange={(e) => setForm((p) => ({ ...p, mapLink: e.target.value }))} /></div>
      <div className="form-row"><label>فيسبوك</label><input value={form.facebookUrl} onChange={(e) => setForm((p) => ({ ...p, facebookUrl: e.target.value }))} /></div>
      <div className="form-row"><label>انستغرام</label><input value={form.instagramUrl} onChange={(e) => setForm((p) => ({ ...p, instagramUrl: e.target.value }))} /></div>
      <div className="form-row"><label>واتساب (رقم مع مفتاح الدولة)</label><input value={form.whatsappNumber} onChange={(e) => setForm((p) => ({ ...p, whatsappNumber: e.target.value }))} /></div>
      <div className="form-row"><label>نص الفوتر</label><textarea value={form.footerText} onChange={(e) => setForm((p) => ({ ...p, footerText: e.target.value }))} rows={2} /></div>
      <button type="submit" className="btn-primary" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}</button>
    </form>
  );
}
