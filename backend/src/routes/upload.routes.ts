import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { authenticate } from '../middleware/auth.middleware';
import { isFirebaseReady, uploadToFirebase } from '../services/firebase.service';

const router = express.Router();
router.use(authenticate);

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP أو GIF'));
    }
  },
});

/** Resize and compress image for web */
async function optimizeImage(buffer: Buffer, mimetype: string): Promise<Buffer> {
  const maxWidth = 1920;
  const maxHeight = 1920;
  const quality = 85;

  let pipeline = sharp(buffer)
    .rotate()
    .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true });

  if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  } else if (mimetype === 'image/png') {
    pipeline = pipeline.png({ quality, compressionLevel: 9 });
  } else if (mimetype === 'image/webp') {
    pipeline = pipeline.webp({ quality });
  } else if (mimetype === 'image/gif') {
    return buffer;
  }

  return pipeline.toBuffer();
}

/**
 * POST /api/upload/image
 * Multipart form: field "file" (image)
 * Query: folder (optional) - hero, gallery, offers, testimonials, blog
 * Returns: { url: string }
 */
router.post('/image', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم إرفاق ملف' });
    }

    if (!isFirebaseReady()) {
      return res.status(503).json({
        message: 'تخزين الصور غير متاح. يرجى تهيئة Firebase Storage',
      });
    }

    const folder = (req.query.folder as string) || 'images';
    const sanitizedFolder = folder.replace(/[^a-z0-9-_]/gi, '') || 'images';

    let buffer = req.file.buffer;
    const mimetype = req.file.mimetype;

    try {
      buffer = await optimizeImage(buffer, mimetype);
    } catch (optErr) {
      // If optimization fails, use original
    }

    const url = await uploadToFirebase(
      buffer,
      req.file.originalname,
      sanitizedFolder,
      mimetype
    );

    res.json({ url });
  } catch (error) {
    next(error);
  }
});

export default router;
