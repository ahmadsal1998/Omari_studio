import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import LandingHero from '../models/LandingHero.model';
import GalleryItem from '../models/GalleryItem.model';
import Offer from '../models/Offer.model';
import LocationHours from '../models/LocationHours.model';
import Testimonial from '../models/Testimonial.model';
import Faq from '../models/Faq.model';
import BlogPost from '../models/BlogPost.model';
import SiteSettings from '../models/SiteSettings.model';
import { AppError } from '../utils/errorHandler';

const router = express.Router();

/** Normalize hero doc: ensure backgroundImageUrls array and primaryBackgroundIndex (legacy compat). */
function normalizeHero(hero: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!hero) return null;
  const doc = { ...hero };
  if (!Array.isArray(doc.backgroundImageUrls) || doc.backgroundImageUrls.length === 0) {
    if (doc.backgroundImageUrl && typeof doc.backgroundImageUrl === 'string') {
      doc.backgroundImageUrls = [doc.backgroundImageUrl];
      doc.primaryBackgroundIndex = 0;
    } else {
      doc.backgroundImageUrls = [];
      doc.primaryBackgroundIndex = 0;
    }
  }
  return doc;
}

// —— Public: get all landing content (no auth)
router.get('/', async (req, res, next) => {
  try {
    const [hero, gallery, offers, locations, testimonials, faq, blog, settings] = await Promise.all([
      LandingHero.findOne({ isActive: true }).sort({ order: 1 }).lean(),
      GalleryItem.find({ isActive: true }).sort({ order: 1 }).lean(),
      Offer.find({ isActive: true }).sort({ order: 1 }).lean(),
      LocationHours.find({ isActive: true }).sort({ order: 1 }).lean(),
      Testimonial.find({ isActive: true }).sort({ order: 1 }).lean(),
      Faq.find({ isActive: true }).sort({ order: 1 }).lean(),
      BlogPost.find({ isActive: true }).sort({ order: -1 }).limit(20).lean(),
      SiteSettings.findOne().lean(),
    ]);

    res.json({
      hero: normalizeHero(hero as Record<string, unknown>),
      gallery: gallery || [],
      offers: offers || [],
      locations: locations || [],
      testimonials: testimonials || [],
      faq: faq || [],
      blog: blog || [],
      siteSettings: settings || null,
    });
  } catch (error) {
    next(error);
  }
});

// —— Admin routes (authenticated)
router.use(authenticate);

// Hero (single doc)
router.get('/admin/hero', async (req, res, next) => {
  try {
    const hero = await LandingHero.findOne().sort({ order: 1 }).lean();
    res.json(normalizeHero(hero as Record<string, unknown>));
  } catch (error) {
    next(error);
  }
});

const HERO_BACKGROUND_IMAGES_MAX = 4;

const HERO_REQUIRED_DEFAULTS = {
  title: '',
  subtitle: '',
  ctaText: 'احجز الآن',
  ctaLink: '/booking',
  introText: '',
  isActive: true,
  order: 0,
};

router.put('/admin/hero', async (req, res, next) => {
  try {
    const raw = req.body;
    const urls = Array.isArray(raw.backgroundImageUrls) ? raw.backgroundImageUrls : [];
    if (urls.length > HERO_BACKGROUND_IMAGES_MAX) {
      throw new AppError(
        `يمكن رفع 4 صور خلفية كحد أقصى. تم إرسال ${urls.length}.`,
        400
      );
    }
    const primary = Number(raw.primaryBackgroundIndex);
    if (urls.length > 0 && (Number.isNaN(primary) || primary < 0 || primary >= urls.length)) {
      throw new AppError('فهرس الصورة الرئيسية غير صالح.', 400);
    }
    const payload = {
      ...HERO_REQUIRED_DEFAULTS,
      ...raw,
      title: raw.title != null ? String(raw.title).trim() : HERO_REQUIRED_DEFAULTS.title,
      subtitle: raw.subtitle != null ? String(raw.subtitle).trim() : HERO_REQUIRED_DEFAULTS.subtitle,
      ctaText: raw.ctaText != null && String(raw.ctaText).trim() !== '' ? String(raw.ctaText).trim() : HERO_REQUIRED_DEFAULTS.ctaText,
      ctaLink: raw.ctaLink != null && String(raw.ctaLink).trim() !== '' ? String(raw.ctaLink).trim() : HERO_REQUIRED_DEFAULTS.ctaLink,
      backgroundImageUrls: urls,
      primaryBackgroundIndex: Number.isNaN(primary) ? 0 : Math.max(0, Math.min(primary, urls.length - 1)),
    };
    const hero = await LandingHero.findOne();
    if (hero) {
      Object.assign(hero, payload);
      await hero.save();
      return res.json(hero);
    }
    const newHero = await LandingHero.create(payload);
    res.status(201).json(newHero);
  } catch (error) {
    next(error);
  }
});

// Gallery
router.get('/admin/gallery', async (req, res, next) => {
  try {
    const items = await GalleryItem.find().sort({ order: 1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/admin/gallery', async (req, res, next) => {
  try {
    const item = await GalleryItem.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/admin/gallery/:id', async (req, res, next) => {
  try {
    const item = await GalleryItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) throw new AppError('Gallery item not found', 404);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/gallery/:id', async (req, res, next) => {
  try {
    const item = await GalleryItem.findByIdAndDelete(req.params.id);
    if (!item) throw new AppError('Gallery item not found', 404);
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
});

// Offers
router.get('/admin/offers', async (req, res, next) => {
  try {
    const items = await Offer.find().sort({ order: 1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/admin/offers', async (req, res, next) => {
  try {
    const item = await Offer.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/admin/offers/:id', async (req, res, next) => {
  try {
    const item = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) throw new AppError('Offer not found', 404);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/offers/:id', async (req, res, next) => {
  try {
    const item = await Offer.findByIdAndDelete(req.params.id);
    if (!item) throw new AppError('Offer not found', 404);
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
});

// Locations & hours
router.get('/admin/locations', async (req, res, next) => {
  try {
    const items = await LocationHours.find().sort({ order: 1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/admin/locations', async (req, res, next) => {
  try {
    const item = await LocationHours.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/admin/locations/:id', async (req, res, next) => {
  try {
    const item = await LocationHours.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) throw new AppError('Location not found', 404);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/locations/:id', async (req, res, next) => {
  try {
    const item = await LocationHours.findByIdAndDelete(req.params.id);
    if (!item) throw new AppError('Location not found', 404);
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
});

// Testimonials
router.get('/admin/testimonials', async (req, res, next) => {
  try {
    const items = await Testimonial.find().sort({ order: 1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/admin/testimonials', async (req, res, next) => {
  try {
    const item = await Testimonial.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/admin/testimonials/:id', async (req, res, next) => {
  try {
    const item = await Testimonial.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) throw new AppError('Testimonial not found', 404);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/testimonials/:id', async (req, res, next) => {
  try {
    const item = await Testimonial.findByIdAndDelete(req.params.id);
    if (!item) throw new AppError('Testimonial not found', 404);
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
});

// FAQ
router.get('/admin/faq', async (req, res, next) => {
  try {
    const items = await Faq.find().sort({ order: 1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/admin/faq', async (req, res, next) => {
  try {
    const item = await Faq.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/admin/faq/:id', async (req, res, next) => {
  try {
    const item = await Faq.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) throw new AppError('FAQ not found', 404);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/faq/:id', async (req, res, next) => {
  try {
    const item = await Faq.findByIdAndDelete(req.params.id);
    if (!item) throw new AppError('FAQ not found', 404);
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
});

// Blog
router.get('/admin/blog', async (req, res, next) => {
  try {
    const items = await BlogPost.find().sort({ order: -1, createdAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.post('/admin/blog', async (req, res, next) => {
  try {
    const item = await BlogPost.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put('/admin/blog/:id', async (req, res, next) => {
  try {
    const item = await BlogPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) throw new AppError('Blog post not found', 404);
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete('/admin/blog/:id', async (req, res, next) => {
  try {
    const item = await BlogPost.findByIdAndDelete(req.params.id);
    if (!item) throw new AppError('Blog post not found', 404);
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
});

// Site settings (single doc)
router.get('/admin/settings', async (req, res, next) => {
  try {
    const settings = await SiteSettings.findOne();
    res.json(settings || null);
  } catch (error) {
    next(error);
  }
});

router.put('/admin/settings', async (req, res, next) => {
  try {
    const settings = await SiteSettings.findOne();
    const payload = req.body;
    if (settings) {
      Object.assign(settings, payload);
      await settings.save();
      return res.json(settings);
    }
    const newSettings = await SiteSettings.create(payload);
    res.status(201).json(newSettings);
  } catch (error) {
    next(error);
  }
});

export default router;
