import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import './PageStyles.css';

interface Product {
  _id: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  supplier?: string;
}

const Products = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Product>();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
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
    mutationFn: (data: Omit<Product, '_id'>) => api.post('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      api.put(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsModalOpen(false);
      setEditingProduct(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const onSubmit = (data: Product) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    reset(product);
    setIsModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      deleteMutation.mutate(product._id);
    }
  };

  const handleNew = () => {
    setEditingProduct(null);
    reset();
    setIsModalOpen(true);
  };

  const columns = [
    { key: 'name', label: 'اسم المنتج' },
    { key: 'costPrice', label: 'سعر التكلفة', render: (item: Product) => `${item.costPrice} ₪` },
    { key: 'sellingPrice', label: 'سعر البيع', render: (item: Product) => `${item.sellingPrice} ₪` },
    {
      key: 'stockQuantity',
      label: 'الكمية المتوفرة',
      render: (item: Product) => (
        <span style={{ color: item.stockQuantity < 10 ? '#e74c3c' : 'inherit' }}>
          {item.stockQuantity}
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>إدارة المنتجات</h1>
        <button className="btn-primary" onClick={handleNew}>
          إضافة منتج جديد
        </button>
      </div>

      <DataTable
        data={products || []}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={isLoading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
          reset();
        }}
        title={editingProduct ? 'تعديل منتج' : 'إضافة منتج جديد'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>اسم المنتج *</label>
            <input
              {...register('name', { required: 'اسم المنتج مطلوب' })}
            />
            {errors.name && <span className="error">{errors.name.message}</span>}
          </div>
          <div className="form-group">
            <label>سعر التكلفة *</label>
            <input
              type="number"
              step="0.01"
              {...register('costPrice', { required: 'سعر التكلفة مطلوب', valueAsNumber: true })}
            />
            {errors.costPrice && <span className="error">{errors.costPrice.message}</span>}
          </div>
          <div className="form-group">
            <label>سعر البيع *</label>
            <input
              type="number"
              step="0.01"
              {...register('sellingPrice', { required: 'سعر البيع مطلوب', valueAsNumber: true })}
            />
            {errors.sellingPrice && <span className="error">{errors.sellingPrice.message}</span>}
          </div>
          <div className="form-group">
            <label>الكمية المتوفرة *</label>
            <input
              type="number"
              {...register('stockQuantity', { required: 'الكمية مطلوبة', valueAsNumber: true })}
            />
            {errors.stockQuantity && <span className="error">{errors.stockQuantity.message}</span>}
          </div>
          <div className="form-group">
            <label>المورد</label>
            <select {...register('supplier')}>
              <option value="">لا يوجد</option>
              {suppliers?.map((supplier: any) => (
                <option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingProduct ? 'حفظ التعديلات' : 'إضافة'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingProduct(null);
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

export default Products;
