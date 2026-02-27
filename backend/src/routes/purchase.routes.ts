import express from 'express';
import Purchase from '../models/Purchase.model';
import Product from '../models/Product.model';
import Supplier from '../models/Supplier.model';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '../utils/errorHandler';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { supplier, startDate, endDate, page, limit } = req.query;
    const query: any = {};

    if (supplier) {
      query.supplier = supplier;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    const purchases = await Purchase.find(query)
      .populate('supplier', 'name phoneNumber')
      .populate('items.product', 'name')
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ createdAt: -1 });

    const total = await Purchase.countDocuments(query);

    res.json({
      purchases,
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
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name phoneNumber balance')
      .populate('items.product', 'name costPrice sellingPrice');
    if (!purchase) {
      throw new AppError('Purchase not found', 404);
    }
    res.json(purchase);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { items, supplier, paymentType } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.purchasePrice * item.quantity;
    }

    // Update product stock and cost price
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new AppError(`Product ${item.product} not found`, 404);
      }
      product.stockQuantity += item.quantity;
      // Update cost price to the latest purchase price
      product.costPrice = item.purchasePrice;
      await product.save();
    }

    // Update supplier balance
    const supplierDoc = await Supplier.findById(supplier);
    if (!supplierDoc) {
      throw new AppError('Supplier not found', 404);
    }

    if (paymentType === 'credit') {
      supplierDoc.balance += totalAmount; // Increase credit (positive balance)
    }
    // If cash, balance remains unchanged
    await supplierDoc.save();

    const purchase = new Purchase({
      supplier,
      items,
      paymentType,
      totalAmount,
    });

    await purchase.save();
    await purchase.populate([
      { path: 'supplier', select: 'name phoneNumber' },
      { path: 'items.product', select: 'name' },
    ]);

    res.status(201).json(purchase);
  } catch (error) {
    next(error);
  }
});

export default router;
