import express from 'express';
import Booking from '../models/Booking.model';
import Customer from '../models/Customer.model';
import { calculateBookingTotals } from '../services/booking.service';
import { AppError } from '../utils/errorHandler';

const router = express.Router();

function isPastDate(dateStr: string): boolean {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  return dateStr < todayStr;
}

function getDayBounds(dateStr: string): { start: Date; end: Date } {
  const start = new Date(dateStr);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

async function hasDuplicateSlot(shootingDate: string, shootingTime: string): Promise<boolean> {
  const { start, end } = getDayBounds(shootingDate);
  const existing = await Booking.findOne({
    shootingDate: { $gte: start, $lt: end },
    shootingTime,
  });
  return !!existing;
}

/**
 * Public endpoint: submit a booking request (creates customer if needed, then booking with status 'pending').
 * Body: { fullName, phoneNumber, email?, notes?, services: [{ service, quantity }], products?: [], shootingDate, shootingTime, notes? }
 */
router.post('/', async (req, res, next) => {
  try {
    const { fullName, phoneNumber, email, notes, services, products = [], shootingDate, shootingTime } = req.body;

    if (!fullName || !phoneNumber) {
      return res.status(400).json({ message: 'الاسم ورقم الهاتف مطلوبان' });
    }
    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ message: 'يجب اختيار خدمة واحدة على الأقل' });
    }
    if (!shootingDate || !shootingTime) {
      return res.status(400).json({ message: 'التاريخ والوقت مطلوبان' });
    }

    const dateStr = typeof shootingDate === 'string' ? shootingDate.slice(0, 10) : new Date(shootingDate).toISOString().slice(0, 10);
    if (isPastDate(dateStr)) {
      return res.status(400).json({ message: 'لا يمكن اختيار تاريخ في الماضي' });
    }

    if (await hasDuplicateSlot(dateStr, String(shootingTime))) {
      return res.status(400).json({ message: 'يوجد حجز آخر في نفس التاريخ والوقت' });
    }

    for (const s of services) {
      if (!s.service || !s.quantity) {
        return res.status(400).json({ message: 'كل خدمة تحتاج معرف الخدمة والكمية' });
      }
    }

    const customerNotes = [notes, email ? `البريد: ${email}` : ''].filter(Boolean).join('\n');
    let customer = await Customer.findOne({ phoneNumber: phoneNumber.trim() });
    if (!customer) {
      customer = await Customer.create({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        notes: customerNotes || undefined,
      });
    } else if (customerNotes) {
      customer.notes = (customer.notes || '') + '\n' + customerNotes;
      await customer.save();
    }

    const discount = 0;
    const totals = await calculateBookingTotals(services, products, discount);

    const dateForDb = dateStr.includes('T') ? new Date(shootingDate) : new Date(shootingDate + 'T12:00:00');
    const booking = new Booking({
      customer: customer._id,
      shootingDate: dateForDb,
      shootingTime: String(shootingTime),
      services,
      products,
      discount,
      notes: notes || undefined,
      status: 'pending',
      source: 'USER',
      ...totals,
    } as any);
    await booking.save();
    await booking.populate([
      { path: 'customer', select: 'fullName phoneNumber' },
      { path: 'services.service', select: 'name sellingPrice' },
      { path: 'products.product', select: 'name sellingPrice' },
    ]);

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
});

export default router;
