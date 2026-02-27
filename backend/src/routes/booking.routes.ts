import express from 'express';
import Booking from '../models/Booking.model';
import Product from '../models/Product.model';
import { authenticate } from '../middleware/auth.middleware';
import { calculateBookingTotals } from '../services/booking.service';
import { AppError } from '../utils/errorHandler';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { status, customer, startDate, endDate, source, page, limit } = req.query;
    const query: any = {};

    if (status) {
      query.status = status;
    }
    if (customer) {
      query.customer = customer;
    }
    if (source === 'USER' || source === 'ADMIN') {
      query.source = source;
    }
    if (startDate || endDate) {
      query.shootingDate = {};
      if (startDate) query.shootingDate.$gte = new Date(startDate as string);
      if (endDate) query.shootingDate.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    const bookings = await Booking.find(query)
      .populate('customer', 'fullName phoneNumber')
      .populate('services.service', 'name sellingPrice costPrice')
      .populate('products.product', 'name sellingPrice costPrice')
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ shootingDate: -1 });

    const total = await Booking.countDocuments(query);

    res.json({
      bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'fullName phoneNumber notes')
      .populate('services.service', 'name type sellingPrice costPrice duration')
      .populate('products.product', 'name sellingPrice costPrice');
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }
    res.json(booking);
  } catch (error) {
    next(error);
  }
});

// Helpers for date validation (no past dates, no duplicate date+time)
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

async function hasDuplicateSlot(shootingDate: string, shootingTime: string, excludeId?: string): Promise<boolean> {
  const { start, end } = getDayBounds(shootingDate);
  const query: any = {
    shootingDate: { $gte: start, $lt: end },
    shootingTime,
  };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await Booking.findOne(query);
  return !!existing;
}

router.post('/', async (req, res, next) => {
  try {
    const { services, products, discount = 0, shootingDate, shootingTime, ...rest } = req.body;
    const bookingData = { shootingDate, shootingTime, ...rest };

    if (!services || services.length === 0) {
      return res.status(400).json({ message: 'At least one service is required' });
    }

    if (!shootingDate || !shootingTime) {
      return res.status(400).json({ message: 'Shooting date and time are required' });
    }

    if (isPastDate(shootingDate)) {
      return res.status(400).json({ message: 'لا يمكن اختيار تاريخ في الماضي' });
    }

    if (await hasDuplicateSlot(shootingDate, shootingTime)) {
      return res.status(400).json({ message: 'يوجد حجز آخر في نفس التاريخ والوقت' });
    }

    // Validate services format
    if (!Array.isArray(services)) {
      return res.status(400).json({ message: 'Services must be an array' });
    }

    for (const service of services) {
      if (!service.service || !service.quantity) {
        return res.status(400).json({ 
          message: 'Each service must have a service ID and quantity' 
        });
      }
    }

    // Calculate totals
    const totals = await calculateBookingTotals(services, products, discount);

    // Update product stock if products are included
    if (products && products.length > 0) {
      for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new AppError(`Product ${item.product} not found`, 404);
        }
        if (product.stockQuantity < item.quantity) {
          throw new AppError(
            `Insufficient stock for product ${product.name}`,
            400
          );
        }
        product.stockQuantity -= item.quantity;
        await product.save();
      }
    }

    const booking = new Booking({
      ...bookingData,
      services,
      products: products || [],
      discount,
      source: 'ADMIN',
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

router.put('/:id', async (req, res, next) => {
  try {
    const { services, products, discount = 0, shootingDate, shootingTime, ...rest } = req.body;
    const bookingData = { shootingDate, shootingTime, ...rest };

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    const finalShootingDate = shootingDate ?? booking.shootingDate;
    const finalShootingTime = shootingTime ?? booking.shootingTime;
    const dateStr = typeof finalShootingDate === 'string'
      ? finalShootingDate.slice(0, 10)
      : new Date(finalShootingDate as Date).toISOString().slice(0, 10);

    if (isPastDate(dateStr)) {
      return res.status(400).json({ message: 'لا يمكن اختيار تاريخ في الماضي' });
    }

    const timeStr = typeof finalShootingTime === 'string' ? finalShootingTime : String(finalShootingTime);
    if (await hasDuplicateSlot(dateStr, timeStr, req.params.id)) {
      return res.status(400).json({ message: 'يوجد حجز آخر في نفس التاريخ والوقت' });
    }

    // Recalculate if services/products changed
    if (services || products !== undefined) {
      const finalServices = services || booking.services;
      const finalProducts = products !== undefined ? products : booking.products;
      const totals = await calculateBookingTotals(
        finalServices,
        finalProducts,
        discount
      );

      bookingData.totalSellingPrice = totals.totalSellingPrice;
      bookingData.totalCost = totals.totalCost;
      bookingData.profit = totals.profit;
    }

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      { ...bookingData, services, products, discount },
      { new: true, runValidators: true }
    ).populate([
      { path: 'customer', select: 'fullName phoneNumber' },
      { path: 'services.service', select: 'name sellingPrice' },
      { path: 'products.product', select: 'name sellingPrice' },
    ]);

    res.json(updatedBooking);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    // Restore product stock if booking had products
    if (booking.products && booking.products.length > 0) {
      for (const item of booking.products) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stockQuantity += item.quantity;
          await product.save();
        }
      }
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
