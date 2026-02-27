import express from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User.model';
import { validate, loginValidation } from '../utils/validation';
import { authenticate } from '../middleware/auth.middleware';
import { AppError } from '../utils/errorHandler';

const router = express.Router();

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginValidation), async (req, res, next) => {
  try {
    const { email, username, password } = req.body;

    if (!email && !username) {
      return res.status(400).json({ message: 'Email or username is required' });
    }

    // Build query with only defined values
    const queryConditions: any[] = [];
    if (email) {
      queryConditions.push({ email: email.toLowerCase().trim() });
    }
    if (username) {
      queryConditions.push({ username: username.trim() });
    }

    const user = await User.findOne({
      $or: queryConditions,
    });

    if (!user) {
      console.log('Login attempt failed: User not found', { email, username });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log('Login attempt failed: Invalid password', { 
        userId: user._id, 
        username: user.username,
        email: user.email 
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn }
    );

    res.json({
      token,
      user: {
        id: String(user._id),
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 */
router.get('/me', authenticate, async (req: any, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
