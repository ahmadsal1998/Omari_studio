import express from 'express';
import Supplier from '../models/Supplier.model';
import { authenticate } from '../middleware/auth.middleware';
import { validate, supplierValidation } from '../utils/validation';
import { AppError } from '../utils/errorHandler';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const search = req.query.search as string;
    const balanceType = req.query.balanceType as string; // 'debtor' | 'creditor'
    const sort = (req.query.sort as string) || 'newest';

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (balanceType === 'debtor') query.balance = { $gt: 0 };
    if (balanceType === 'creditor') query.balance = { $lt: 0 };

    const sortOpt: Record<string, 1 | -1> =
      sort === 'highest_balance' ? { balance: -1 } : sort === 'lowest_balance' ? { balance: 1 } : { createdAt: -1 };

    const suppliers = await Supplier.find(query).sort(sortOpt);
    res.json(suppliers);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }
    res.json(supplier);
  } catch (error) {
    next(error);
  }
});

router.post('/', validate(supplierValidation), async (req, res, next) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validate(supplierValidation), async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }
    res.json(supplier);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
