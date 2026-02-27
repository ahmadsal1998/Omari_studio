import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import { useDebounce } from '../hooks/useDebounce';
import type { Supplier, SortOption, ViewMode, BalanceFilterChip } from '../types/supplier';
import {
  SuppliersToolbar,
  SupplierFilterChips,
  SuppliersGridView,
  SuppliersTableView,
  SuppliersEmptyState,
  SuppliersGridSkeleton,
  SuppliersTableSkeleton,
} from '../components/suppliers';
import './PageStyles.css';

/** سند قيد = debit (positive), سند قبض = credit (negative) */
type BalanceVoucherType = 'journal' | 'receipt';

interface SupplierFormData extends Pick<Supplier, 'name' | 'phoneNumber'> {}

const Suppliers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [balanceVoucherType, setBalanceVoucherType] = useState<BalanceVoucherType | null>(null);
  const [balanceAmount, setBalanceAmount] = useState<string>('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [chip, setChip] = useState<BalanceFilterChip>('all');
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 300);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SupplierFormData>();

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      search: debouncedSearch,
      sort,
    };
    if (chip === 'debtors') params.balanceType = 'debtor';
    else if (chip === 'creditors') params.balanceType = 'creditor';
    return params;
  }, [debouncedSearch, sort, chip]);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', queryParams],
    queryFn: async () => {
      const response = await api.get('/suppliers', { params: queryParams });
      return response.data as Supplier[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Supplier, '_id'>) => api.post('/suppliers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsModalOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
      api.put(`/suppliers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setIsModalOpen(false);
      setEditingSupplier(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    const amount = Number(balanceAmount) || 0;
    const balance = balanceVoucherType === 'receipt' ? -amount : amount;
    const payload = { ...data, balance };
    if (editingSupplier) {
      updateMutation.mutate({ id: editingSupplier._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    reset({ name: supplier.name, phoneNumber: supplier.phoneNumber });
    setBalanceVoucherType(supplier.balance < 0 ? 'receipt' : 'journal');
    setBalanceAmount(supplier.balance === 0 ? '' : String(Math.abs(supplier.balance)));
    setIsModalOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      deleteMutation.mutate(supplier._id);
    }
  };

  const handleNew = () => {
    setEditingSupplier(null);
    reset();
    setBalanceVoucherType(null);
    setBalanceAmount('');
    setIsModalOpen(true);
  };

  const suppliers = data ?? [];

  return (
    <div className="page-container suppliers-page">
      <header className="suppliers-page__header">
        <h1 className="suppliers-page__title">إدارة الموردين</h1>
        <button type="button" className="btn-primary suppliers-page__add-btn" onClick={handleNew}>
          إضافة مورد جديد
        </button>
      </header>

      <section className="suppliers-page__toolbar" aria-label="شريط البحث والترتيب">
        <SuppliersToolbar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </section>

      <section className="suppliers-page__chips" aria-label="فلاتر سريعة">
        <SupplierFilterChips active={chip} onChange={setChip} />
      </section>

      <section className="suppliers-page__content">
        {isLoading ? (
          viewMode === 'grid' ? <SuppliersGridSkeleton /> : <SuppliersTableSkeleton />
        ) : suppliers.length === 0 ? (
          <SuppliersEmptyState />
        ) : viewMode === 'grid' ? (
          <SuppliersGridView
            suppliers={suppliers}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <SuppliersTableView
            suppliers={suppliers}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
          setBalanceAmount('');
          reset();
        }}
        title={editingSupplier ? 'تعديل مورد' : 'إضافة مورد جديد'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>اسم المورد *</label>
            <input
              {...register('name', { required: 'اسم المورد مطلوب' })}
            />
            {errors.name && <span className="error">{errors.name.message}</span>}
          </div>
          <div className="form-group">
            <label>رقم الهاتف *</label>
            <input
              {...register('phoneNumber', { required: 'رقم الهاتف مطلوب' })}
            />
            {errors.phoneNumber && <span className="error">{errors.phoneNumber.message}</span>}
          </div>
          <div className="form-group">
            <label>الرصيد الابتدائي</label>
            <p className="supplier-balance-step-label">الخطوة 1 – نوع العملية</p>
            <div className="supplier-balance-steps">
              <button
                type="button"
                className={`supplier-voucher-btn ${balanceVoucherType === 'journal' ? 'selected' : ''}`}
                onClick={() => setBalanceVoucherType('journal')}
              >
                <span className="supplier-voucher-title">سند قيد</span>
                <span className="supplier-voucher-desc">دين للمورد (رصيد موجب)</span>
              </button>
              <button
                type="button"
                className={`supplier-voucher-btn ${balanceVoucherType === 'receipt' ? 'selected' : ''}`}
                onClick={() => setBalanceVoucherType('receipt')}
              >
                <span className="supplier-voucher-title">سند قبض</span>
                <span className="supplier-voucher-desc">رصيد للمورد (رصيد سالب)</span>
              </button>
            </div>
            {balanceVoucherType && (
              <>
                <p className="supplier-balance-step-label">الخطوة 2 – أدخل المبلغ</p>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  className="supplier-balance-amount"
                />
                <small>يُطبّق النظام العلامة تلقائياً حسب نوع العملية المختار</small>
              </>
            )}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingSupplier ? 'حفظ التعديلات' : 'إضافة'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingSupplier(null);
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

export default Suppliers;
