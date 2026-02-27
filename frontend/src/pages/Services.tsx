import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { useForm } from 'react-hook-form';
import { useDebounce } from '../hooks/useDebounce';
import type { Service, SortOption, ViewMode, TypeFilterChip } from '../types/service';
import {
  ServicesToolbar,
  ServiceTypeChips,
  ServicesGridView,
  ServicesTableView,
  ServicesEmptyState,
  ServicesGridSkeleton,
  ServicesTableSkeleton,
} from '../components/services';
import './PageStyles.css';

interface ServiceFormData extends Pick<Service, 'name' | 'type' | 'costPrice' | 'sellingPrice' | 'duration'> {}

const Services = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [chip, setChip] = useState<TypeFilterChip>('all');
  const queryClient = useQueryClient();
  const debouncedSearch = useDebounce(search, 300);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceFormData>();

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      search: debouncedSearch,
      sort,
    };
    if (chip === 'booking') params.type = 'booking';
    else if (chip === 'quick') params.type = 'quick';
    return params;
  }, [debouncedSearch, sort, chip]);

  const { data, isLoading } = useQuery({
    queryKey: ['services', queryParams],
    queryFn: async () => {
      const response = await api.get('/services', { params: queryParams });
      return response.data as Service[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Service, '_id'>) => api.post('/services', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsModalOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Service> }) =>
      api.put(`/services/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setIsModalOpen(false);
      setEditingService(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });

  const onSubmit = (data: ServiceFormData) => {
    if (editingService) {
      updateMutation.mutate({ id: editingService._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    reset({
      name: service.name,
      type: service.type,
      costPrice: service.costPrice,
      sellingPrice: service.sellingPrice,
      duration: service.duration,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (service: Service) => {
    if (window.confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
      deleteMutation.mutate(service._id);
    }
  };

  const handleNew = () => {
    setEditingService(null);
    reset();
    setIsModalOpen(true);
  };

  const services = data ?? [];

  return (
    <div className="page-container services-page">
      <header className="services-page__header">
        <h1 className="services-page__title">إدارة الخدمات</h1>
        <button type="button" className="btn-primary services-page__add-btn" onClick={handleNew}>
          إضافة خدمة جديدة
        </button>
      </header>

      <section className="services-page__toolbar" aria-label="شريط البحث والترتيب">
        <ServicesToolbar
          search={search}
          onSearchChange={setSearch}
          sort={sort}
          onSortChange={setSort}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </section>

      <section className="services-page__chips" aria-label="فلاتر النوع">
        <ServiceTypeChips active={chip} onChange={setChip} />
      </section>

      <section className="services-page__content">
        {isLoading ? (
          viewMode === 'grid' ? <ServicesGridSkeleton /> : <ServicesTableSkeleton />
        ) : services.length === 0 ? (
          <ServicesEmptyState />
        ) : viewMode === 'grid' ? (
          <ServicesGridView
            services={services}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <ServicesTableView
            services={services}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingService(null);
          reset();
        }}
        title={editingService ? 'تعديل خدمة' : 'إضافة خدمة جديدة'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>اسم الخدمة *</label>
            <input
              {...register('name', { required: 'اسم الخدمة مطلوب' })}
            />
            {errors.name && <span className="error">{errors.name.message}</span>}
          </div>
          <div className="form-group">
            <label>نوع الخدمة *</label>
            <select {...register('type', { required: 'نوع الخدمة مطلوب' })}>
              <option value="">اختر النوع</option>
              <option value="booking">خدمة حجز</option>
              <option value="quick">خدمة سريعة</option>
            </select>
            {errors.type && <span className="error">{errors.type.message}</span>}
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
            <label>المدة (بالدقائق)</label>
            <input
              type="number"
              {...register('duration', { valueAsNumber: true })}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingService ? 'حفظ التعديلات' : 'إضافة'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsModalOpen(false);
                setEditingService(null);
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

export default Services;
