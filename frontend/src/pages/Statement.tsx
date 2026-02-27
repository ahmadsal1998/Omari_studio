import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import './PageStyles.css';
import './Statement.css';

type EntityType = 'customer' | 'supplier';

interface Customer {
  _id: string;
  fullName: string;
  phoneNumber: string;
  balance?: number;
}

interface Supplier {
  _id: string;
  name: string;
  phoneNumber: string;
  balance: number;
}

interface StatementRow {
  date: string;
  type: string;
  description: string;
  referenceNumber?: string;
  debit: number;
  credit: number;
  amount: number;
  runningBalance: number;
}

interface StatementResponse {
  entity: Customer | Supplier | null;
  openingBalance: number;
  entries: StatementRow[];
  finalBalance: number;
}

const PAYMENT_METHODS = ['نقد', 'شيك', 'تحويل', 'بطاقة', 'أخرى'];

/** Searchable customer picker: select once, then show as tag with X to clear. */
function CustomerSelectOnce({
  customers,
  value,
  onChange,
}: {
  customers: Customer[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const selected = customers.find((c) => c._id === value);
  const filtered = !search.trim()
    ? customers
    : customers.filter(
        (c) =>
          c.fullName.toLowerCase().includes(search.toLowerCase()) ||
          (c.phoneNumber || '').includes(search)
      );

  if (value && selected) {
    return (
      <div className="customer-select-once">
        <div className="customer-select-tag">
          <span>{selected.fullName}</span>
          <button
            type="button"
            className="customer-select-tag-remove"
            onClick={() => onChange('')}
            aria-label="إزالة الاختيار"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-select-once">
      <input
        type="text"
        className="customer-select-search"
        placeholder="بحث أو اختر العميل..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
      />
      {open && (
        <ul className="customer-select-dropdown" role="listbox">
          {filtered.length === 0 ? (
            <li className="customer-select-dropdown-empty">لا توجد نتائج</li>
          ) : (
            filtered.slice(0, 80).map((c) => (
              <li
                key={c._id}
                role="option"
                className="customer-select-dropdown-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(c._id);
                  setSearch('');
                  setOpen(false);
                }}
              >
                <span>{c.fullName}</span>
                {c.phoneNumber ? <span className="customer-select-phone">{c.phoneNumber}</span> : null}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

/** Generic select-once: tag with X when selected, searchable dropdown when not. */
function EntitySelectOnce({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: Array<{ _id: string; label: string; sub?: string }>;
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o._id === value);
  const filtered = !search.trim()
    ? options
    : options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          (o.sub || '').includes(search)
      );

  if (value && selected) {
    return (
      <div className="customer-select-once">
        <div className="customer-select-tag">
          <span>{selected.label}</span>
          <button
            type="button"
            className="customer-select-tag-remove"
            onClick={() => onChange('')}
            aria-label="إزالة الاختيار"
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-select-once">
      <input
        type="text"
        className="customer-select-search"
        placeholder={placeholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
      />
      {open && (
        <ul className="customer-select-dropdown" role="listbox">
          {filtered.length === 0 ? (
            <li className="customer-select-dropdown-empty">لا توجد نتائج</li>
          ) : (
            filtered.slice(0, 80).map((o) => (
              <li
                key={o._id}
                role="option"
                className="customer-select-dropdown-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(o._id);
                  setSearch('');
                  setOpen(false);
                }}
              >
                <span>{o.label}</span>
                {o.sub ? <span className="customer-select-phone">{o.sub}</span> : null}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default function Statement() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [entityType, setEntityType] = useState<EntityType>(
    (searchParams.get('entityType') as EntityType) || 'customer'
  );
  const [entityId, setEntityId] = useState(searchParams.get('entityId') || '');
  useEffect(() => {
    const et = searchParams.get('entityType') as EntityType | null;
    const eid = searchParams.get('entityId');
    if (et === 'customer' || et === 'supplier') setEntityType(et);
    if (eid) setEntityId(eid);
  }, [searchParams]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [journalOpen, setJournalOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [journalForm, setJournalForm] = useState({
    customerId: '',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    notes: '',
    referenceNumber: '',
  });
  const [receiptForm, setReceiptForm] = useState({
    customerId: '',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    paymentMethod: 'نقد',
    notes: '',
    referenceNumber: '',
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => (await api.get('/customers', { params: { limit: 500 } })).data.customers as Customer[],
  });
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await api.get('/suppliers')).data as Supplier[],
  });

  const { data: statement, isLoading } = useQuery({
    queryKey: ['ledger', 'statement', entityType, entityId, fromDate, toDate, typeFilter],
    queryFn: async () => {
      const params: Record<string, string> = { entityType, entityId, type: typeFilter };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const res = await api.get<StatementResponse>('/ledger/statement', { params });
      return res.data;
    },
    enabled: !!entityId,
  });

  const journalMutation = useMutation({
    mutationFn: (body: typeof journalForm) => api.post('/ledger/journal', {
      customerId: body.customerId,
      date: body.date,
      amount: Number(body.amount),
      notes: body.notes || undefined,
      referenceNumber: body.referenceNumber || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      setJournalOpen(false);
      setJournalForm({ customerId: '', date: new Date().toISOString().slice(0, 10), amount: '', notes: '', referenceNumber: '' });
    },
  });

  const receiptMutation = useMutation({
    mutationFn: (body: typeof receiptForm) => api.post('/ledger/receipt', {
      customerId: body.customerId,
      date: body.date,
      amount: Number(body.amount),
      paymentMethod: body.paymentMethod,
      notes: body.notes || undefined,
      referenceNumber: body.referenceNumber || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      setReceiptOpen(false);
      setReceiptForm({ customerId: '', date: new Date().toISOString().slice(0, 10), amount: '', paymentMethod: 'نقد', notes: '', referenceNumber: '' });
    },
  });

  const entityList = entityType === 'customer' ? (customers ?? []) : (suppliers ?? []);
  const entityLabel = (e: Customer | Supplier) => ('fullName' in e ? e.fullName : e.name);

  const handlePrint = () => {
    const printArea = document.getElementById('statement-print-area');
    if (!printArea) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html dir="rtl"><head>
        <meta charset="utf-8"><title>كشف حساب</title>
        <style>
          body { font-family: 'Cairo', sans-serif; padding: 24px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
          .debit { color: #c53030; }
          .credit { color: #276749; }
        </style>
      </head><body>${printArea.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>كشف الحساب الشامل</h1>
        <div className="statement-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (entityType === 'customer' && entityId) {
                setJournalForm((p) => ({ ...p, customerId: entityId }));
              }
              setJournalOpen(true);
            }}
          >
            سند قيد
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              if (entityType === 'customer' && entityId) {
                setReceiptForm((p) => ({ ...p, customerId: entityId }));
              }
              setReceiptOpen(true);
            }}
          >
            سند قبض
          </button>
          <button type="button" className="btn-secondary" onClick={handlePrint}>
            طباعة / تصدير PDF
          </button>
        </div>
      </div>

      <div className="statement-filters">
        <div className="form-row">
          <label>نوع الطرف</label>
          <select value={entityType} onChange={(e) => { setEntityType(e.target.value as EntityType); setEntityId(''); }}>
            <option value="customer">عميل</option>
            <option value="supplier">مورد</option>
          </select>
        </div>
        <div className="form-row statement-filter-entity">
          <label>{entityType === 'customer' ? 'العميل' : 'المورد'}</label>
          <EntitySelectOnce
            options={entityList.map((e) => ({
              _id: e._id,
              label: entityLabel(e),
              sub: e.phoneNumber,
            }))}
            value={entityId}
            onChange={setEntityId}
            placeholder={entityType === 'customer' ? 'بحث أو اختر العميل...' : 'بحث أو اختر المورد...'}
          />
        </div>
        <div className="form-row">
          <label>من تاريخ</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="form-row">
          <label>إلى تاريخ</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="form-row">
          <label>نوع العملية</label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">الكل</option>
            <option value="journal">سند قيد</option>
            <option value="receipt">سند قبض</option>
            <option value="invoice">فاتورة</option>
            <option value="purchase">مشتريات</option>
          </select>
        </div>
      </div>

      {!entityId && (
        <p className="statement-hint">اختر الطرف (عميل أو مورد) لعرض كشف الحساب.</p>
      )}

      {entityId && isLoading && <div className="statement-loading">جاري التحميل...</div>}

      {entityId && statement && !isLoading && (
        <div className="statement-card">
          <div id="statement-print-area" className="statement-print-area">
            <div className="statement-print-header">
              <h2>كشف حساب {entityType === 'customer' ? 'عميل' : 'مورد'}</h2>
              <p className="statement-entity-name">
                {statement.entity && entityLabel(statement.entity as Customer | Supplier)}
              </p>
              {(statement.entity as any)?.phoneNumber && (
                <p>{(statement.entity as any).phoneNumber}</p>
              )}
              <p className="statement-period">
                {fromDate || toDate ? `الفترة: ${fromDate || 'بداية'} - ${toDate || 'نهاية'}` : 'كل الفترات'}
              </p>
            </div>
            <table className="statement-table">
              <thead>
                <tr>
                  <th>التاريخ</th>
                  <th>البيان</th>
                  <th>المرجع</th>
                  <th>مدين</th>
                  <th>دائن</th>
                  <th>الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {statement.entries.map((row, i) => (
                  <tr key={i}>
                    <td>{new Date(row.date).toLocaleDateString('ar-EG')}</td>
                    <td>{row.description}</td>
                    <td>{row.referenceNumber || '-'}</td>
                    <td className="debit">{row.debit ? row.debit.toFixed(2) : ''}</td>
                    <td className="credit">{row.credit ? row.credit.toFixed(2) : ''}</td>
                    <td>{row.runningBalance.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="statement-final">
                  <td colSpan={5} className="statement-final-label">الرصيد النهائي</td>
                  <td className="statement-final-balance">
                    <strong>{statement.finalBalance.toFixed(2)} ₪</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={journalOpen} onClose={() => setJournalOpen(false)} title="سند قيد (إضافة دين للعميل)">
        <form
          className="statement-voucher-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!journalForm.customerId || !journalForm.amount) return;
            journalMutation.mutate(journalForm);
          }}
        >
          <div className="form-row">
            <label>العميل *</label>
            {entityType === 'customer' && entityId && journalForm.customerId === entityId ? (
              <div className="customer-select-readonly">
                <span className="customer-select-readonly-name">
                  {(customers ?? []).find((c) => c._id === entityId)?.fullName ?? entityId}
                </span>
                <span className="customer-select-readonly-badge">محدد من كشف الحساب</span>
              </div>
            ) : (
              <>
                <CustomerSelectOnce
                  customers={customers ?? []}
                  value={journalForm.customerId}
                  onChange={(customerId) => setJournalForm((p) => ({ ...p, customerId }))}
                />
                {!journalForm.customerId && (
                  <span className="customer-select-required-hint">اختر العميل من القائمة أعلاه</span>
                )}
              </>
            )}
          </div>
          <div className="form-row">
            <label>التاريخ *</label>
            <input
              type="date"
              value={journalForm.date}
              onChange={(e) => setJournalForm((p) => ({ ...p, date: e.target.value }))}
              required
            />
          </div>
          <div className="form-row">
            <label>المبلغ (₪) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={journalForm.amount}
              onChange={(e) => setJournalForm((p) => ({ ...p, amount: e.target.value }))}
              required
            />
          </div>
          <div className="form-row">
            <label>رقم المرجع</label>
            <input
              value={journalForm.referenceNumber}
              onChange={(e) => setJournalForm((p) => ({ ...p, referenceNumber: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <label>ملاحظات</label>
            <textarea
              value={journalForm.notes}
              onChange={(e) => setJournalForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={journalMutation.isPending}>
              {journalMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setJournalOpen(false)}>إلغاء</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={receiptOpen} onClose={() => setReceiptOpen(false)} title="سند قبض (قبض من العميل)">
        <form
          className="statement-voucher-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!receiptForm.customerId || !receiptForm.amount) return;
            receiptMutation.mutate(receiptForm);
          }}
        >
          <div className="form-row">
            <label>العميل *</label>
            {entityType === 'customer' && entityId && receiptForm.customerId === entityId ? (
              <div className="customer-select-readonly">
                <span className="customer-select-readonly-name">
                  {(customers ?? []).find((c) => c._id === entityId)?.fullName ?? entityId}
                </span>
                <span className="customer-select-readonly-badge">محدد من كشف الحساب</span>
              </div>
            ) : (
              <>
                <CustomerSelectOnce
                  customers={customers ?? []}
                  value={receiptForm.customerId}
                  onChange={(customerId) => setReceiptForm((p) => ({ ...p, customerId }))}
                />
                {!receiptForm.customerId && (
                  <span className="customer-select-required-hint">اختر العميل من القائمة أعلاه</span>
                )}
              </>
            )}
          </div>
          <div className="form-row">
            <label>التاريخ *</label>
            <input
              type="date"
              value={receiptForm.date}
              onChange={(e) => setReceiptForm((p) => ({ ...p, date: e.target.value }))}
              required
            />
          </div>
          <div className="form-row">
            <label>المبلغ (₪) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={receiptForm.amount}
              onChange={(e) => setReceiptForm((p) => ({ ...p, amount: e.target.value }))}
              required
            />
          </div>
          <div className="form-row">
            <label>طريقة الدفع</label>
            <select
              value={receiptForm.paymentMethod}
              onChange={(e) => setReceiptForm((p) => ({ ...p, paymentMethod: e.target.value }))}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>رقم المرجع</label>
            <input
              value={receiptForm.referenceNumber}
              onChange={(e) => setReceiptForm((p) => ({ ...p, referenceNumber: e.target.value }))}
            />
          </div>
          <div className="form-row">
            <label>ملاحظات</label>
            <textarea
              value={receiptForm.notes}
              onChange={(e) => setReceiptForm((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={receiptMutation.isPending}>
              {receiptMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setReceiptOpen(false)}>إلغاء</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
