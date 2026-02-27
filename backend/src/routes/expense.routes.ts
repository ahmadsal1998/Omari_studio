import express from 'express';
import Expense from '../models/Expense.model';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '../utils/errorHandler';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { type, startDate, endDate, supplier, page, limit } = req.query;
    const query: any = {};

    if (type) {
      query.type = { $regex: type, $options: 'i' };
    }
    if (supplier) {
      query.supplier = supplier;
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate as string);
      if (endDate) query.date.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    const expenses = await Expense.find(query)
      .populate('supplier', 'name')
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ date: -1 });

    const total = await Expense.countDocuments(query);

    res.json({
      expenses,
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
    const expense = await Expense.findById(req.params.id).populate(
      'supplier',
      'name phoneNumber'
    );
    if (!expense) {
      throw new AppError('Expense not found', 404);
    }
    res.json(expense);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const expense = new Expense(req.body);
    await expense.save();
    await expense.populate('supplier', 'name');
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('supplier', 'name');
    if (!expense) {
      throw new AppError('Expense not found', 404);
    }
    res.json(expense);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      throw new AppError('Expense not found', 404);
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
