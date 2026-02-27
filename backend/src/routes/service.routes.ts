import express from 'express';
import Service from '../models/Service.model';
import { authenticate } from '../middleware/auth.middleware';
import { validate, serviceValidation } from '../utils/validation';
import { AppError } from '../utils/errorHandler';

const router = express.Router();

// Public: list booking services for landing-page booking form
router.get('/public', async (req, res, next) => {
  try {
    const services = await Service.find({ type: 'booking' }).sort({ name: 1 }).select('name sellingPrice duration');
    res.json(services);
  } catch (error) {
    next(error);
  }
});

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const type = req.query.type as string;
    const search = req.query.search as string;
    const sort = (req.query.sort as string) || 'newest';

    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (search) query.name = { $regex: search, $options: 'i' };

    const sortOpt: Record<string, 1 | -1> =
      sort === 'name_asc' ? { name: 1 } :
      sort === 'name_desc' ? { name: -1 } :
      sort === 'price_high' ? { sellingPrice: -1 } :
      sort === 'price_low' ? { sellingPrice: 1 } :
      { createdAt: -1 };

    const services = await Service.find(query).sort(sortOpt);
    res.json(services);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      throw new AppError('Service not found', 404);
    }
    res.json(service);
  } catch (error) {
    next(error);
  }
});

router.post('/', validate(serviceValidation), async (req, res, next) => {
  try {
    const service = new Service(req.body);
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validate(serviceValidation), async (req, res, next) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) {
      throw new AppError('Service not found', 404);
    }
    res.json(service);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      throw new AppError('Service not found', 404);
    }
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
