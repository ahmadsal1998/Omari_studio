import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { formatDate } from '../utils/dateFormat';
import DataTable from '../components/DataTable';
import './PageStyles.css';

interface QuickService {
  _id: string;
  customer?: string;
  items: Array<{ service?: string; product?: string; quantity: number; type: 'service' | 'product' }>;
  paymentType: 'cash' | 'credit';
  totalSellingPrice: number;
  profit: number;
}

const QuickServices = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['quickServices'],
    queryFn: async () => {
      const response = await api.get('/quick-services');
      return response.data.quickServices;
    },
  });

  const columns = [
    {
      key: 'customer',
      label: 'العميل',
      render: (item: any) => item.customer?.fullName || 'عميل نقدي',
    },
    {
      key: 'items',
      label: 'العناصر',
      render: (item: any) => `${item.items.length} عنصر`,
    },
    {
      key: 'totalSellingPrice',
      label: 'الإجمالي',
      render: (item: any) => `${item.totalSellingPrice} ₪`,
    },
    {
      key: 'profit',
      label: 'الربح',
      render: (item: any) => `${item.profit} ₪`,
    },
    {
      key: 'createdAt',
      label: 'التاريخ',
      render: (item: any) => formatDate(item.createdAt),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>الخدمات السريعة</h1>
      </div>

      <DataTable<QuickService> data={data || []} columns={columns} loading={isLoading} />
    </div>
  );
};

export default QuickServices;
