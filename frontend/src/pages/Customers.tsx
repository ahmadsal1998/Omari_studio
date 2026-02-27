import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import { useDebounce } from '../hooks/useDebounce';
import type { Customer, SortOption, ViewMode, BalanceFilterChip } from '../types/customer';
import {
  CustomersToolbar,
  CustomerFilterChips,
  CustomersGridView,
  CustomersTableView,
  CustomersEmptyState,
  CustomersGridSkeleton,
  CustomersTableSkeleton,
} from '../components/customers';
import './PageStyles.css';

interface CustomerFormData extends Pick<Customer, 'fullName' | 'phoneNumber' | 'notes' | 'status' | 'city'> {}

const Customers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [chip, setChip] = useState<BalanceFilterChip>('all');
  const [advancedFilters, setAdvancedFilters] = useState<{ status?: string; balanceType?: string; city?: string }>({});
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 300);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerFormData>();

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      search: debouncedSearch,
      sort,
      limit: '50',
    };
    if (chip === 'debtors') params.balanceType = 'debtor';
    else if (chip === 'creditors') params.balanceType = 'creditor';
    else if (chip === 'vip') params.status = 'vip';
    else if (chip === 'blocked') params.status = 'blocked';
    if (advancedFilters.status) params.status = advancedFilters.status;
    if (advancedFilters.balanceType) params.balanceType = advancedFilters.balanceType;
    if (advancedFilters.city) params.city = advancedFilters.city;
    return params;
  }, [debouncedSearch, sort, chip, advancedFilters]);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', queryParams],
    queryFn: async () => {
      const response = await api.get('/customers', { params: queryParams });
      return response.data.customers as Customer[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CustomerFormData> }) =>
      api.put(`/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      setEditingCustomer(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      fullName: customer.fullName,
      phoneNumber: customer.phoneNumber,
      notes: customer.notes,
      status: customer.status,
      city: customer.city,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      deleteMutation.mutate(customer._id);
    }
  };

  const handleNew = () => {
    setEditingCustomer(null);
    reset({ fullName: '', phoneNumber: '', notes: '', status: 'active', city: '' });
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setChip('all');
    setAdvancedFilters({});
  };

  const hasActiveFilters =
    chip !== 'all' ||
    !!advancedFilters.status ||
    !!advancedFilters.balanceType ||
    !!advancedFilters.city;

  const customers = data ?? [];

  return (
    <div className="page-container customers-page">
      {/* Header */}
      <header className="customers-page__header">
        <h1 className="customers-page__title">إدارة العملاء</h1>
        <button type="button" className="btn-primary customers-page__add-btn" onClick={handleNew}>
          إضافة عميل جديد
        </button>
      </header>

      {/* Toolbar */}
      <section className="customers-page__toolbar" aria-label="شريط البحث والفلاتر">
        <CustomersToolbar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          advancedFilters={advancedFilters}
          onAdvancedFiltersChange={setAdvancedFilters}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </section>

      {/* Filter chips */}
      <section className="customers-page__chips" aria-label="فلاتر سريعة">
        <CustomerFilterChips active={chip} onChange={setChip} />
      </section>

      {/* Content */}
      <section className="customers-page__content">
        {isLoading ? (
          viewMode === 'grid' ? <CustomersGridSkeleton /> : <CustomersTableSkeleton />
        ) : customers.length === 0 ? (
          <CustomersEmptyState />
        ) : viewMode === 'grid' ? (
          <CustomersGridView
            customers={customers}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <CustomersTableView
            customers={customers}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </section>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
          reset();
        }}
        title={editingCustomer ? 'تعديل عميل' : 'إضافة عميل جديد'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>الاسم الكامل *</label>
            <input {...register('fullName', { required: 'الاسم الكامل مطلوب' })} />
            {errors.fullName && (
              <span className="error">{errors.fullName.message}</span>
            )}
          </div>
          <div className="form-group">
            <label>رقم الهاتف *</label>
            <input {...register('phoneNumber', { required: 'رقم الهاتف مطلوب' })} />
            {errors.phoneNumber && (
              <span className="error">{errors.phoneNumber.message}</span>
            )}
          </div>
          <div className="form-group">
            <label>الحالة</label>
            <select {...register('status')}>
              <option value="active">نشط</option>
              <option value="blocked">محظور</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div className="form-group">
            <label>المدينة</label>
            <input {...register('city')} placeholder="اختياري" />
          </div>
          <div className="form-group">
            <label>ملاحظات</label>
            <textarea {...register('notes')} rows={3} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingCustomer ? 'حفظ التعديلات' : 'إضافة'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingCustomer(null);
                reset();
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

export default Customers;
