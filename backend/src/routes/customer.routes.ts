import express from 'express';
import Customer from '../models/Customer.model';
import { authenticate } from '../middleware/auth.middleware';
import { validate, customerValidation } from '../utils/validation';
import { AppError } from '../utils/errorHandler';

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get all customers
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 */
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const city = req.query.city as string;
    const balanceType = req.query.balanceType as string; // 'debtor' | 'creditor'
    const sort = (req.query.sort as string) || 'newest';

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) query.status = status;
    if (city) query.city = new RegExp(city, 'i');
    if (balanceType === 'debtor') query.balance = { $gt: 0 };
    if (balanceType === 'creditor') query.balance = { $lt: 0 };

    const sortOpt: Record<string, 1 | -1> =
      sort === 'highest_balance' ? { balance: -1 } : sort === 'lowest_balance' ? { balance: 1 } : { createdAt: -1 };

    const customers = await Customer.find(query)
      .limit(limit)
      .skip((page - 1) * limit)
      .sort(sortOpt);

    const total = await Customer.countDocuments(query);

    res.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 */
router.get('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create customer
 *     tags: [Customers]
 */
router.post('/', validate(customerValidation), async (req, res, next) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 */
router.put('/:id', validate(customerValidation), async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
