import { useQuery } from '@tanstack/react-query';
import { api } from '../utils/api';
import { formatDate } from '../utils/dateFormat';
import DataTable from '../components/DataTable';
import './PageStyles.css';

interface Purchase {
  _id: string;
  supplier: string;
  items: Array<{ product: string; quantity: number; purchasePrice: number }>;
  paymentType: 'cash' | 'credit';
  totalAmount: number;
}

const Purchases = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const response = await api.get('/purchases');
      return response.data.purchases;
    },
  });

  const columns = [
    {
      key: 'supplier',
      label: 'المورد',
      render: (item: any) => item.supplier?.name || '-',
    },
    {
      key: 'items',
      label: 'العناصر',
      render: (item: any) => `${item.items.length} منتج`,
    },
    {
      key: 'totalAmount',
      label: 'الإجمالي',
      render: (item: any) => `${item.totalAmount} ₪`,
    },
    {
      key: 'paymentType',
      label: 'نوع الدفع',
      render: (item: any) => item.paymentType === 'cash' ? 'نقدي' : 'آجل',
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
        <h1>المشتريات</h1>
      </div>

      <DataTable<Purchase> data={data || []} columns={columns} loading={isLoading} />
    </div>
  );
};

export default Purchases;
