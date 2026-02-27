import express from 'express';
import QuickService from '../models/QuickService.model';
import Product from '../models/Product.model';
import { authenticate } from '../middleware/auth.middleware';
import { calculateQuickServiceTotals } from '../services/quickService.service';
import { AppError } from '../utils/errorHandler';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { customer, startDate, endDate, page, limit } = req.query;
    const query: any = {};

    if (customer) {
      query.customer = customer;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    const quickServices = await QuickService.find(query)
      .populate('customer', 'fullName phoneNumber')
      .populate('items.service', 'name sellingPrice')
      .populate('items.product', 'name sellingPrice')
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ createdAt: -1 });

    const total = await QuickService.countDocuments(query);

    res.json({
      quickServices,
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
    const quickService = await QuickService.findById(req.params.id)
      .populate('customer', 'fullName phoneNumber')
      .populate('items.service', 'name sellingPrice costPrice')
      .populate('items.product', 'name sellingPrice costPrice');
    if (!quickService) {
      throw new AppError('Quick service not found', 404);
    }
    res.json(quickService);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { items, ...quickServiceData } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Calculate totals
    const totals = await calculateQuickServiceTotals(items);

    // Update product stock
    for (const item of items) {
      if (item.type === 'product' && item.product) {
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

    const quickService = new QuickService({
      ...quickServiceData,
      items,
      ...totals,
    });

    await quickService.save();
    await quickService.populate([
      { path: 'customer', select: 'fullName phoneNumber' },
      { path: 'items.service', select: 'name sellingPrice' },
      { path: 'items.product', select: 'name sellingPrice' },
    ]);

    res.status(201).json(quickService);
  } catch (error) {
    next(error);
  }
});

export default router;
