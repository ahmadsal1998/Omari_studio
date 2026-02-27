import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import { formatDate } from '../utils/dateFormat';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import './PageStyles.css';

interface Expense {
  _id: string;
  type: string;
  amount: number;
  date: string;
  supplier?: string;
  notes?: string;
}

const Expenses = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Expense>();

  const { data, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await api.get('/expenses');
      return response.data.expenses;
    },
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Expense, '_id'>) => api.post('/expenses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsModalOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) =>
      api.put(`/expenses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsModalOpen(false);
      setEditingExpense(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const onSubmit = (data: Expense) => {
    if (editingExpense) {
      updateMutation.mutate({ id: editingExpense._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    reset(expense);
    setIsModalOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    if (window.confirm('هل أنت متأكد من حذف هذه المصروفات؟')) {
      deleteMutation.mutate(expense._id);
    }
  };

  const handleNew = () => {
    setEditingExpense(null);
    reset();
    setIsModalOpen(true);
  };

  const columns = [
    { key: 'type', label: 'نوع المصروف' },
    { key: 'amount', label: 'المبلغ', render: (item: Expense) => `${item.amount} ₪` },
    {
      key: 'date',
      label: 'التاريخ',
      render: (item: Expense) => formatDate(item.date),
    },
    {
      key: 'supplier',
      label: 'المورد',
      render: (item: any) => item.supplier?.name || '-',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>إدارة المصروفات</h1>
        <button className="btn-primary" onClick={handleNew}>
          إضافة مصروف جديد
        </button>
      </div>

      <DataTable
        data={data || []}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
          reset();
        }}
        title={editingExpense ? 'تعديل مصروف' : 'إضافة مصروف جديد'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>نوع المصروف *</label>
            <input
              {...register('type', { required: 'نوع المصروف مطلوب' })}
            />
            {errors.type && <span className="error">{errors.type.message}</span>}
          </div>
          <div className="form-group">
            <label>المبلغ *</label>
            <input
              type="number"
              step="0.01"
              {...register('amount', { required: 'المبلغ مطلوب', valueAsNumber: true })}
            />
            {errors.amount && <span className="error">{errors.amount.message}</span>}
          </div>
          <div className="form-group">
            <label>التاريخ *</label>
            <input
              type="date"
              {...register('date', { required: 'التاريخ مطلوب' })}
            />
            {errors.date && <span className="error">{errors.date.message}</span>}
          </div>
          <div className="form-group">
            <label>المورد (اختياري)</label>
            <select {...register('supplier')}>
              <option value="">لا يوجد</option>
              {suppliers?.map((supplier: any) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>ملاحظات</label>
            <textarea {...register('notes')} rows={3} />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingExpense ? 'حفظ التعديلات' : 'إضافة'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingExpense(null);
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

export default Expenses;
