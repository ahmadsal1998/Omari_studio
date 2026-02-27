import { body, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    for (const validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    next();
  };
};

export const loginValidation = [
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('username')
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Username cannot be empty'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
];

export const customerValidation = [
  body('fullName').notEmpty().trim().withMessage('Full name is required'),
  body('phoneNumber').notEmpty().trim().withMessage('Phone number is required'),
  body('notes').optional().isString().trim(),
  body('status').optional().isIn(['active', 'blocked', 'vip']).withMessage('Invalid status'),
  body('city').optional().isString().trim(),
];

export const serviceValidation = [
  body('name').notEmpty().trim().withMessage('Service name is required'),
  body('type').isIn(['booking', 'quick']).withMessage('Invalid service type'),
  body('costPrice').isFloat({ min: 0 }).withMessage('Invalid cost price'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Invalid selling price'),
  body('duration').optional().isInt({ min: 0 }),
];

export const productValidation = [
  body('name').notEmpty().trim().withMessage('Product name is required'),
  body('costPrice').isFloat({ min: 0 }).withMessage('Invalid cost price'),
  body('sellingPrice').isFloat({ min: 0 }).withMessage('Invalid selling price'),
  body('stockQuantity').isInt({ min: 0 }).withMessage('Invalid stock quantity'),
  body('supplier').optional().isMongoId(),
];

export const supplierValidation = [
  body('name').notEmpty().trim().withMessage('Supplier name is required'),
  body('phoneNumber').notEmpty().trim().withMessage('Phone number is required'),
  body('balance').optional().isFloat(),
];
