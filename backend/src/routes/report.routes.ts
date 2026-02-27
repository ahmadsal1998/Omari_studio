import express from 'express';
import Booking from '../models/Booking.model';
import QuickService from '../models/QuickService.model';
import Expense from '../models/Expense.model';
import Purchase from '../models/Purchase.model';
import Service from '../models/Service.model';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/reports/daily:
 *   get:
 *     summary: Get daily report
 *     tags: [Reports]
 */
router.get('/daily', async (req, res, next) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // Bookings
    const bookings = await Booking.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' },
    });
    const bookingsRevenue = bookings.reduce(
      (sum, b) => sum + b.totalSellingPrice,
      0
    );
    const bookingsCost = bookings.reduce((sum, b) => sum + b.totalCost, 0);
    const bookingsProfit = bookings.reduce((sum, b) => sum + b.profit, 0);

    // Quick Services
    const quickServices = await QuickService.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });
    const quickServicesRevenue = quickServices.reduce(
      (sum, qs) => sum + qs.totalSellingPrice,
      0
    );
    const quickServicesCost = quickServices.reduce(
      (sum, qs) => sum + qs.totalCost,
      0
    );
    const quickServicesProfit = quickServices.reduce(
      (sum, qs) => sum + qs.profit,
      0
    );

    // Expenses
    const expenses = await Expense.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Total sales
    const totalSales = bookingsRevenue + quickServicesRevenue;

    // Net profit
    const netProfit =
      bookingsProfit + quickServicesProfit - totalExpenses;

    res.json({
      date: targetDate.toISOString().split('T')[0],
      bookings: {
        count: bookings.length,
        revenue: bookingsRevenue,
        cost: bookingsCost,
        profit: bookingsProfit,
      },
      quickServices: {
        count: quickServices.length,
        revenue: quickServicesRevenue,
        cost: quickServicesCost,
        profit: quickServicesProfit,
      },
      expenses: {
        count: expenses.length,
        total: totalExpenses,
      },
      totals: {
        sales: totalSales,
        expenses: totalExpenses,
        netProfit,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/monthly:
 *   get:
 *     summary: Get monthly report
 *     tags: [Reports]
 */
router.get('/monthly', async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const targetYear = year ? parseInt(year as string) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month as string) - 1 : new Date().getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    // Bookings
    const bookings = await Booking.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      status: { $ne: 'cancelled' },
    });
    const bookingsRevenue = bookings.reduce(
      (sum, b) => sum + b.totalSellingPrice,
      0
    );
    const bookingsCost = bookings.reduce((sum, b) => sum + b.totalCost, 0);
    const bookingsProfit = bookings.reduce((sum, b) => sum + b.profit, 0);

    // Quick Services
    const quickServices = await QuickService.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });
    const quickServicesRevenue = quickServices.reduce(
      (sum, qs) => sum + qs.totalSellingPrice,
      0
    );
    const quickServicesCost = quickServices.reduce(
      (sum, qs) => sum + qs.totalCost,
      0
    );
    const quickServicesProfit = quickServices.reduce(
      (sum, qs) => sum + qs.profit,
      0
    );

    // Expenses
    const expenses = await Expense.find({
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Total sales
    const totalSales = bookingsRevenue + quickServicesRevenue;

    // Net profit
    const netProfit =
      bookingsProfit + quickServicesProfit - totalExpenses;

    res.json({
      year: targetYear,
      month: targetMonth + 1,
      bookings: {
        count: bookings.length,
        revenue: bookingsRevenue,
        cost: bookingsCost,
        profit: bookingsProfit,
      },
      quickServices: {
        count: quickServices.length,
        revenue: quickServicesRevenue,
        cost: quickServicesCost,
        profit: quickServicesProfit,
      },
      expenses: {
        count: expenses.length,
        total: totalExpenses,
      },
      totals: {
        sales: totalSales,
        expenses: totalExpenses,
        netProfit,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/profit-per-service:
 *   get:
 *     summary: Get profit per service report
 *     tags: [Reports]
 */
router.get('/profit-per-service', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query: any = { status: { $ne: 'cancelled' } };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const bookings = await Booking.find(query).populate('services.service');
    const quickServices = await QuickService.find(
      startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { $gte: new Date(startDate as string) }),
              ...(endDate && { $lte: new Date(endDate as string) }),
            },
          }
        : {}
    ).populate('items.service');

    const serviceProfitMap = new Map();

    // Process bookings
    for (const booking of bookings) {
      for (const item of booking.services) {
        const service = item.service as any;
        const serviceId = service._id.toString();
        const profit =
          (service.sellingPrice - service.costPrice) * item.quantity;

        if (serviceProfitMap.has(serviceId)) {
          const existing = serviceProfitMap.get(serviceId);
          existing.profit += profit;
          existing.quantity += item.quantity;
        } else {
          serviceProfitMap.set(serviceId, {
            service: {
              id: service._id,
              name: service.name,
            },
            profit,
            quantity: item.quantity,
          });
        }
      }
    }

    // Process quick services
    for (const qs of quickServices) {
      for (const item of qs.items) {
        if (item.type === 'service' && item.service) {
          const service = item.service as any;
          const serviceId = service._id.toString();
          const profit =
            (service.sellingPrice - service.costPrice) * item.quantity;

          if (serviceProfitMap.has(serviceId)) {
            const existing = serviceProfitMap.get(serviceId);
            existing.profit += profit;
            existing.quantity += item.quantity;
          } else {
            serviceProfitMap.set(serviceId, {
              service: {
                id: service._id,
                name: service.name,
              },
              profit,
              quantity: item.quantity,
            });
          }
        }
      }
    }

    const results = Array.from(serviceProfitMap.values());
    res.json(results);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/reports/supplier-statement:
 *   get:
 *     summary: Get supplier account statement
 *     tags: [Reports]
 */
router.get('/supplier-statement/:supplierId', async (req, res, next) => {
  try {
    const { supplierId } = req.params;
    const { startDate, endDate } = req.query;

    const query: any = { supplier: supplierId };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const purchases = await Purchase.find(query)
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    const expenses = await Expense.find({
      supplier: supplierId,
      ...(startDate || endDate
        ? {
            date: {
              ...(startDate && { $gte: new Date(startDate as string) }),
              ...(endDate && { $lte: new Date(endDate as string) }),
            },
          }
        : {}),
    }).sort({ date: -1 });

    const totalPurchases = purchases.reduce(
      (sum, p) => sum + p.totalAmount,
      0
    );
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      purchases,
      expenses,
      summary: {
        totalPurchases,
        totalExpenses,
        netBalance: totalPurchases - totalExpenses,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
