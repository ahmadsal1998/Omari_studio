import express from 'express';
import Product from '../models/Product.model';
import { authenticate } from '../middleware/auth.middleware';
import { validate, productValidation } from '../utils/validation';
import { AppError } from '../utils/errorHandler';

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { search, lowStock } = req.query;
    const query: any = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (lowStock === 'true') {
      query.stockQuantity = { $lte: 10 };
    }

    const products = await Product.find(query)
      .populate('supplier', 'name')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'supplier',
      'name phoneNumber'
    );
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.post('/', validate(productValidation), async (req, res, next) => {
  try {
    const product = new Product(req.body);
    await product.save();
    await product.populate('supplier', 'name');
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validate(productValidation), async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('supplier', 'name');
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
