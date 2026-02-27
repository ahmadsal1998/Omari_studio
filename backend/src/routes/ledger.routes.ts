import express from 'express';
import mongoose from 'mongoose';
import LedgerEntry from '../models/LedgerEntry.model';
import Customer from '../models/Customer.model';
import Supplier from '../models/Supplier.model';
import Booking from '../models/Booking.model';
import Purchase from '../models/Purchase.model';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../utils/errorHandler';

const router = express.Router();

router.use(authenticate);

/** Journal voucher (سند قيد) – add debt to customer */
router.post('/journal', authorize('admin', 'staff'), async (req: AuthRequest, res, next) => {
  try {
    const { customerId, date, amount, notes, referenceNumber } = req.body;
    if (!customerId || amount == null || Number(amount) <= 0) {
      throw new AppError('معرف العميل والمبلغ (موجب) مطلوبان.', 400);
    }
    const customer = await Customer.findById(customerId);
    if (!customer) throw new AppError('العميل غير موجود.', 404);
    const numAmount = Number(amount);
    const entry = await LedgerEntry.create({
      entityType: 'customer',
      entityId: customerId,
      entityModel: 'Customer',
      type: 'journal',
      date: date ? new Date(date) : new Date(),
      amount: numAmount,
      notes: notes || undefined,
      referenceNumber: referenceNumber || undefined,
    });
    (customer as any).balance = (Number((customer as any).balance) || 0) + numAmount;
    await customer.save();
    const populated = await LedgerEntry.findById(entry._id)
      .populate('entityId', 'fullName phoneNumber');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

/** Receipt voucher (سند قبض) – payment from customer */
router.post('/receipt', authorize('admin', 'staff'), async (req: AuthRequest, res, next) => {
  try {
    const { customerId, date, amount, paymentMethod, notes, referenceNumber } = req.body;
    if (!customerId || amount == null || Number(amount) <= 0) {
      throw new AppError('معرف العميل والمبلغ (موجب) مطلوبان.', 400);
    }
    const customer = await Customer.findById(customerId);
    if (!customer) throw new AppError('العميل غير موجود.', 404);
    const numAmount = Number(amount);
    const entry = await LedgerEntry.create({
      entityType: 'customer',
      entityId: customerId,
      entityModel: 'Customer',
      type: 'receipt',
      date: date ? new Date(date) : new Date(),
      amount: -numAmount,
      notes: notes || undefined,
      referenceNumber: referenceNumber || undefined,
      paymentMethod: paymentMethod || undefined,
    });
    (customer as any).balance = (Number((customer as any).balance) || 0) - numAmount;
    await customer.save();
    const populated = await LedgerEntry.findById(entry._id)
      .populate('entityId', 'fullName phoneNumber');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
});

/** Build unified statement: ledger entries + bookings (customer) or purchases (supplier) */
async function getStatement(
  entityType: 'customer' | 'supplier',
  entityId: string,
  fromDate?: Date,
  toDate?: Date,
  typeFilter?: string
) {
  const id = new mongoose.Types.ObjectId(entityId);
  const entries: Array<{
    date: Date;
    sortKey: number;
    type: string;
    description: string;
    referenceNumber?: string;
    debit: number;
    credit: number;
    amount: number;
    _id?: string;
    relatedId?: string;
  }> = [];

  const ledgerRows = await LedgerEntry.find({
    entityType,
    entityId: id,
    ...(typeFilter && typeFilter !== 'all' ? { type: typeFilter } : {}),
  })
    .sort({ date: 1, createdAt: 1 })
    .lean();

  const typeLabels: Record<string, string> = {
    opening_balance: 'الرصيد الافتتاحي',
    journal: 'سند قيد',
    receipt: 'سند قبض',
    invoice: 'فاتورة',
    return: 'مرتجع',
    purchase: 'مشتريات',
    payment: 'دفعة',
  };

  for (const r of ledgerRows) {
    const d = new Date(r.date);
    if (fromDate && d < fromDate) continue;
    if (toDate && d > toDate) continue;
    const amount = Number(r.amount);
    const debit = amount > 0 ? amount : 0;
    const credit = amount < 0 ? -amount : 0;
    const createdAt = (r as any).createdAt ? new Date((r as any).createdAt).getTime() : d.getTime();
    entries.push({
      date: d,
      sortKey: createdAt,
      type: r.type,
      description: typeLabels[r.type] || r.type,
      referenceNumber: r.referenceNumber,
      debit,
      credit,
      amount,
      _id: (r as any)._id?.toString(),
      relatedId: (r as any).relatedId?.toString(),
    });
  }

  if (entityType === 'customer') {
    const bookings = await Booking.find({ customer: id })
      .sort({ shootingDate: 1, createdAt: 1 })
      .lean();
    for (const b of bookings) {
      const shootDate = (b as any).shootingDate ? new Date((b as any).shootingDate) : new Date((b as any).createdAt);
      const createdMs = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : shootDate.getTime();
      if (fromDate && shootDate < fromDate) continue;
      if (toDate && shootDate > toDate) continue;
      if (typeFilter && typeFilter !== 'all' && typeFilter !== 'invoice') continue;
      const amount = Number((b as any).totalSellingPrice) || 0;
      entries.push({
        date: shootDate,
        sortKey: createdMs,
        type: 'invoice',
        description: 'فاتورة (حجز)',
        debit: amount,
        credit: 0,
        amount,
        relatedId: (b as any)._id?.toString(),
      });
    }
  } else {
    const purchases = await Purchase.find({ supplier: id, paymentType: 'credit' })
      .sort({ createdAt: 1 })
      .lean();
    for (const p of purchases) {
      const d = new Date((p as any).createdAt);
      if (fromDate && d < fromDate) continue;
      if (toDate && d > toDate) continue;
      if (typeFilter && typeFilter !== 'all' && typeFilter !== 'purchase') continue;
      const amount = Number((p as any).totalAmount) || 0;
      entries.push({
        date: d,
        sortKey: d.getTime(),
        type: 'purchase',
        description: 'مشتريات آجلة',
        debit: amount,
        credit: 0,
        amount,
        relatedId: (p as any)._id?.toString(),
      });
    }
  }

  // Supplier opening balance: stored balance not reflected in ledger/purchases (e.g. set on create).
  // Show it as first transaction when no date filter, or add to opening when fromDate is set.
  let supplierInitialBalance = 0;
  if (entityType === 'supplier') {
    const supplier = await Supplier.findById(id).select('balance').lean();
    if (supplier) {
      const totalLedger = ledgerRows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      const allPurchases = await Purchase.find({ supplier: id, paymentType: 'credit' }).lean();
      const totalPurchases = allPurchases.reduce((s, p) => s + (Number((p as any).totalAmount) || 0), 0);
      supplierInitialBalance = (Number((supplier as any).balance) || 0) - totalLedger - totalPurchases;
    }
    if (supplierInitialBalance !== 0) {
      if (!fromDate) {
        entries.unshift({
          date: new Date(0),
          sortKey: 0,
          type: 'opening_balance',
          description: typeLabels.opening_balance,
          debit: supplierInitialBalance > 0 ? supplierInitialBalance : 0,
          credit: supplierInitialBalance < 0 ? -supplierInitialBalance : 0,
          amount: supplierInitialBalance,
        });
      }
    }
  }

  // Oldest first: sort by date ASC, then by sortKey (creation time) ASC for same-day order
  entries.sort((a, b) => {
    const byDate = a.date.getTime() - b.date.getTime();
    return byDate !== 0 ? byDate : a.sortKey - b.sortKey;
  });

  // Opening balance = sum of transactions strictly BEFORE fromDate only.
  // When fromDate is not set, opening = 0 so we don't double-count (all transactions are in entries).
  // For supplier, include stored initial balance when fromDate is set.
  let openingBalance = 0;
  if (fromDate) {
    for (const r of ledgerRows) {
      if (new Date(r.date) < fromDate) openingBalance += Number(r.amount) || 0;
    }
    if (entityType === 'customer') {
      const bookingsBefore = await Booking.find({
        customer: id,
        shootingDate: { $lt: fromDate },
      }).lean();
      for (const b of bookingsBefore) {
        openingBalance += Number((b as any).totalSellingPrice) || 0;
      }
    } else {
      if (supplierInitialBalance !== 0) openingBalance += supplierInitialBalance;
      const purchasesBefore = await Purchase.find({
        supplier: id,
        paymentType: 'credit',
        createdAt: { $lt: fromDate },
      }).lean();
      for (const p of purchasesBefore) {
        openingBalance += Number((p as any).totalAmount) || 0;
      }
    }
  }

  let running = openingBalance;
  const rows = entries.map((e) => {
    running += e.amount;
    return {
      ...e,
      runningBalance: running,
    };
  });

  return {
    openingBalance,
    entries: rows,
    finalBalance: running,
  };
}

/** GET /statement?entityType=&entityId=&from=&to=&type= */
router.get('/statement', authorize('admin', 'staff'), async (req: AuthRequest, res, next) => {
  try {
    const { entityType, entityId, from, to, type: typeFilter } = req.query;
    if (entityType !== 'customer' && entityType !== 'supplier') {
      throw new AppError('entityType يجب أن يكون customer أو supplier.', 400);
    }
    if (!entityId || typeof entityId !== 'string') {
      throw new AppError('معرف الطرف (entityId) مطلوب.', 400);
    }
    const fromDate = from ? new Date(from as string) : undefined;
    const toDate = to ? new Date(to as string) : undefined;
    const statement = await getStatement(
      entityType as 'customer' | 'supplier',
      entityId,
      fromDate,
      toDate,
      typeFilter as string | undefined
    );
    const entity = entityType === 'customer'
      ? await Customer.findById(entityId).select('fullName phoneNumber balance').lean()
      : await Supplier.findById(entityId).select('name phoneNumber balance').lean();
    res.json({
      entity,
      ...statement,
    });
  } catch (error) {
    next(error);
  }
});

/** GET /entries?entityType=&entityId=&type=&limit= – list ledger entries (for journal/receipt list) */
router.get('/entries', authorize('admin', 'staff'), async (req: AuthRequest, res, next) => {
  try {
    const { entityType, entityId, type, page, limit } = req.query;
    const query: any = {};
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (type && type !== 'all') query.type = type;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));
    const select = (req.query.entityType as string) === 'supplier' ? 'name phoneNumber' : 'fullName phoneNumber';
    const entries = await LedgerEntry.find(query)
      .populate('entityId', select)
      .sort({ date: -1, createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();
    const total = await LedgerEntry.countDocuments(query);
    res.json({
      entries,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
