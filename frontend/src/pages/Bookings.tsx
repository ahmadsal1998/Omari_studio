import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { formatDate } from '../utils/dateFormat';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import './PageStyles.css';

interface Booking {
  _id: string;
  customer: string;
  shootingDate: string;
  shootingTime: string;
  services: Array<{ service: string; quantity: number }>;
  products?: Array<{ product: string; quantity: number }>;
  discount?: number;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  source?: 'USER' | 'ADMIN';
}

type SourceFilter = '' | 'USER' | 'ADMIN';

const NEW_CUSTOMER_OPTION = '__new_customer__';

const Bookings = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('');
  const [newCustomerModalOpen, setNewCustomerModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    fullName: '',
    phoneNumber: '',
    notes: '',
  });
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, setError, clearErrors, setValue, watch, formState: { errors } } = useForm<Booking>();
  const customerValue = watch('customer');
  const customerFieldReg = register('customer', { required: 'العميل مطلوب' });

  const todayStr = () => new Date().toISOString().slice(0, 10);

  const getBookingDateStr = (booking: any): string => {
    const d = booking.shootingDate;
    if (!d) return '';
    if (typeof d === 'string') return d.slice(0, 10);
    return new Date(d).toISOString().slice(0, 10);
  };

  const { data: bookingsList, isLoading } = useQuery({
    queryKey: ['bookings', sourceFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (sourceFilter) params.source = sourceFilter;
      const response = await api.get('/bookings', { params });
      return response.data.bookings;
    },
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await api.get('/customers', { params: { limit: 500 } });
      return response.data.customers;
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: (data: { fullName: string; phoneNumber: string; notes?: string }) =>
      api.post('/customers', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      const newCustomer = res.data;
      setValue('customer', newCustomer._id);
      setNewCustomerModalOpen(false);
      setNewCustomerForm({ fullName: '', phoneNumber: '', notes: '' });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'فشل إضافة العميل');
    },
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const response = await api.get('/services', { params: { type: 'booking' } });
      return response.data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Booking, '_id'>) => api.post('/bookings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsModalOpen(false);
      setSelectedServices({});
      setSelectedProducts({});
      reset();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'حدث خطأ أثناء إنشاء الحجز';
      alert(errorMessage);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Booking> }) =>
      api.put(`/bookings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setIsModalOpen(false);
      setEditingBooking(null);
      setSelectedServices({});
      setSelectedProducts({});
      reset();
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'حدث خطأ أثناء تحديث الحجز';
      alert(errorMessage);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bookings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const onSubmit = (data: Booking) => {
    clearErrors(['shootingDate', 'shootingTime']);

    if (!data.shootingDate || !data.shootingTime) {
      return;
    }

    if (data.shootingDate < todayStr()) {
      setError('shootingDate', { type: 'manual', message: 'لا يمكن اختيار تاريخ في الماضي' });
      return;
    }

    const conflict = (bookingsList || []).find((b: any) => {
      if (editingBooking && b._id === editingBooking._id) return false;
      const dateStr = getBookingDateStr(b);
      const timeStr = typeof b.shootingTime === 'string' ? b.shootingTime : String(b.shootingTime || '');
      return dateStr === data.shootingDate && timeStr === data.shootingTime;
    });
    if (conflict) {
      setError('shootingTime', { type: 'manual', message: 'يوجد حجز آخر في نفس التاريخ والوقت' });
      return;
    }

    // Transform services to the format expected by backend
    const services = Object.entries(selectedServices)
      .filter(([_, quantity]) => quantity > 0)
      .map(([serviceId, quantity]) => ({
        service: serviceId,
        quantity: quantity,
      }));

    // Transform products to the format expected by backend
    const products = Object.entries(selectedProducts)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({
        product: productId,
        quantity: quantity,
      }));

    if (services.length === 0) {
      alert('يجب اختيار خدمة واحدة على الأقل');
      return;
    }

    const bookingData = {
      customer: data.customer,
      shootingDate: data.shootingDate,
      shootingTime: data.shootingTime,
      services,
      products: products.length > 0 ? products : [],
      discount: data.discount || 0,
      notes: data.notes || '',
      status: data.status || 'pending',
    };

    if (editingBooking) {
      updateMutation.mutate({ id: editingBooking._id, data: bookingData });
    } else {
      createMutation.mutate(bookingData);
    }
  };

  const handleEdit = (booking: any) => {
    setEditingBooking(booking);
    
    // Initialize selected services from booking
    const servicesMap: Record<string, number> = {};
    if (booking.services) {
      booking.services.forEach((item: any) => {
        const serviceId = typeof item.service === 'object' ? item.service._id : item.service;
        servicesMap[serviceId] = item.quantity || 1;
      });
    }
    setSelectedServices(servicesMap);

    // Initialize selected products from booking
    const productsMap: Record<string, number> = {};
    if (booking.products) {
      booking.products.forEach((item: any) => {
        const productId = typeof item.product === 'object' ? item.product._id : item.product;
        productsMap[productId] = item.quantity || 1;
      });
    }
    setSelectedProducts(productsMap);

    reset(booking);
    setIsModalOpen(true);
  };

  const handleDelete = (booking: any) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الحجز؟')) {
      deleteMutation.mutate(booking._id);
    }
  };

  const handleNew = () => {
    setEditingBooking(null);
    setSelectedServices({});
    setSelectedProducts({});
    reset();
    setIsModalOpen(true);
  };

  const columns = [
    {
      key: 'customer',
      label: 'العميل',
      render: (item: any) => item.customer?.fullName || '-',
    },
    {
      key: 'source',
      label: 'المصدر',
      render: (item: any) => {
        const src = item.source || 'ADMIN';
        const label = src === 'USER' ? 'حجز عميل' : 'حجز إداري';
        const cls = src === 'USER' ? 'badge badge-source-user' : 'badge badge-source-admin';
        return <span className={cls}>{label}</span>;
      },
    },
    {
      key: 'shootingDate',
      label: 'تاريخ التصوير',
      render: (item: any) => formatDate(item.shootingDate),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (item: any) => {
        const statusMap: Record<string, string> = {
          pending: 'قيد الانتظار',
          in_progress: 'قيد التنفيذ',
          completed: 'مكتمل',
          cancelled: 'ملغي',
        };
        return statusMap[item.status] || item.status;
      },
    },
    {
      key: 'totalSellingPrice',
      label: 'الإجمالي',
      render: (item: any) => `${item.totalSellingPrice || 0} ₪`,
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>إدارة الحجوزات</h1>
        <button className="btn-primary" onClick={handleNew}>
          إضافة حجز جديد
        </button>
      </div>

      <div className="page-toolbar">
        <div className="search-bar">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as SourceFilter)}
          >
            <option value="">جميع الحجوزات</option>
            <option value="USER">حجوزات العملاء</option>
            <option value="ADMIN">الحجوزات الإدارية</option>
          </select>
        </div>
      </div>

      <DataTable
        data={bookingsList || []}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBooking(null);
          setSelectedServices({});
          setSelectedProducts({});
          reset();
        }}
        title={editingBooking ? 'تعديل حجز' : 'إضافة حجز جديد'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>العميل *</label>
            <select
              value={customerValue === NEW_CUSTOMER_OPTION ? '' : (customerValue ?? '')}
              onChange={(e) => {
                const v = e.target.value;
                if (v === NEW_CUSTOMER_OPTION) {
                  setNewCustomerModalOpen(true);
                  setValue('customer', '', { shouldValidate: true });
                  return;
                }
                setValue('customer', v, { shouldValidate: true });
              }}
              ref={customerFieldReg.ref}
              onBlur={customerFieldReg.onBlur}
            >
              <option value="">اختر العميل</option>
              {customers?.map((customer: any) => (
                <option key={customer._id} value={customer._id}>
                  {customer.fullName}
                </option>
              ))}
              <option value={NEW_CUSTOMER_OPTION}>+ إضافة عميل جديد</option>
            </select>
            {errors.customer && <span className="error">{errors.customer.message}</span>}
          </div>
          <div className="form-group">
            <label>تاريخ التصوير *</label>
            <input
              type="date"
              min={todayStr()}
              {...register('shootingDate', { required: 'تاريخ التصوير مطلوب' })}
            />
            {errors.shootingDate && <span className="error">{errors.shootingDate.message}</span>}
          </div>
          <div className="form-group">
            <label>وقت التصوير *</label>
            <input
              type="time"
              {...register('shootingTime', { required: 'وقت التصوير مطلوب' })}
            />
            {errors.shootingTime && <span className="error">{errors.shootingTime.message}</span>}
          </div>
          <div className="form-group">
            <label>الخدمات *</label>
            <small>اختر خدمة واحدة على الأقل</small>
            <div className="service-pills">
              {services?.map((service: any) => (
                <button
                  key={service._id}
                  type="button"
                  className={`service-pill ${selectedServices[service._id] ? 'selected' : ''}`}
                  onClick={() => {
                    if (selectedServices[service._id]) {
                      const newServices = { ...selectedServices };
                      delete newServices[service._id];
                      setSelectedServices(newServices);
                    } else {
                      setSelectedServices({ ...selectedServices, [service._id]: 1 });
                    }
                  }}
                >
                  {service.name} - {service.sellingPrice} ₪
                </button>
              ))}
            </div>
            {Object.keys(selectedServices).length === 0 && (
              <span className="error">يجب اختيار خدمة واحدة على الأقل</span>
            )}
          </div>
          <div className="form-group">
            <label>المنتجات (اختياري)</label>
            {products?.map((product: any) => (
              <div key={product._id} className="form-row-inline">
                <input
                  type="checkbox"
                  checked={!!selectedProducts[product._id]}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProducts({ ...selectedProducts, [product._id]: 1 });
                    } else {
                      const newProducts = { ...selectedProducts };
                      delete newProducts[product._id];
                      setSelectedProducts(newProducts);
                    }
                  }}
                />
                <label>
                  {product.name} - {product.sellingPrice} ₪ (المتوفرة: {product.stockQuantity})
                </label>
                {selectedProducts[product._id] && (
                  <input
                    type="number"
                    min="1"
                    max={product.stockQuantity}
                    value={selectedProducts[product._id] || 1}
                    onChange={(e) => {
                      const quantity = Math.min(parseInt(e.target.value) || 1, product.stockQuantity);
                      setSelectedProducts({ ...selectedProducts, [product._id]: quantity });
                    }}
                    placeholder="الكمية"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="form-group">
            <label>الخصم</label>
            <input type="number" step="0.01" {...register('discount', { valueAsNumber: true })} />
          </div>
          <div className="form-group">
            <label>الحالة</label>
            <select {...register('status')}>
              <option value="pending">قيد الانتظار</option>
              <option value="in_progress">قيد التنفيذ</option>
              <option value="completed">مكتمل</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
          <div className="form-group">
            <label>ملاحظات</label>
            <textarea {...register('notes')} rows={3} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingBooking ? 'حفظ التعديلات' : 'إضافة'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingBooking(null);
                reset();
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={newCustomerModalOpen}
        onClose={() => {
          setNewCustomerModalOpen(false);
          setNewCustomerForm({ fullName: '', phoneNumber: '', notes: '' });
        }}
        title="إضافة عميل جديد"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newCustomerForm.fullName.trim() || !newCustomerForm.phoneNumber.trim()) return;
            createCustomerMutation.mutate({
              fullName: newCustomerForm.fullName.trim(),
              phoneNumber: newCustomerForm.phoneNumber.trim(),
              notes: newCustomerForm.notes.trim() || undefined,
            });
          }}
        >
          <div className="form-group">
            <label>الاسم الكامل *</label>
            <input
              value={newCustomerForm.fullName}
              onChange={(e) => setNewCustomerForm((p) => ({ ...p, fullName: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>رقم الهاتف *</label>
            <input
              value={newCustomerForm.phoneNumber}
              onChange={(e) => setNewCustomerForm((p) => ({ ...p, phoneNumber: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>ملاحظات (اختياري)</label>
            <textarea
              value={newCustomerForm.notes}
              onChange={(e) => setNewCustomerForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={createCustomerMutation.isPending}>
              {createCustomerMutation.isPending ? 'جاري الحفظ...' : 'حفظ وتحديد العميل'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setNewCustomerModalOpen(false);
                setNewCustomerForm({ fullName: '', phoneNumber: '', notes: '' });
              }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Bookings;
