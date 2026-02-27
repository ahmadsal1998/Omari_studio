import mongoose from 'mongoose';
import dotenv from 'dotenv';
import LandingHero from '../models/LandingHero.model';
import SiteSettings from '../models/SiteSettings.model';

dotenv.config();

const defaultHero = {
  title: 'استوديو العمري للتصوير',
  subtitle: 'تصوير أعراس ومناسبات',
  backgroundImageUrls: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=1920'],
  primaryBackgroundIndex: 0,
  ctaText: 'احجز الآن',
  ctaLink: '/booking',
  introText: 'خبرة في تصوير الأعراس والخطوبة والمناسبات. نلتقط أجمل اللحظات بجودة عالية.',
  isActive: true,
  order: 0,
};

const defaultSettings = {
  siteName: 'استوديو العمري',
  phone: '',
  email: '',
  mapLink: '',
  facebookUrl: '',
  instagramUrl: '',
  whatsappNumber: '',
  footerText: '',
};

const seedLanding = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/omari_studio');
    console.log('Connected to MongoDB');

    const existingHero = await LandingHero.findOne();
    if (!existingHero) {
      await LandingHero.create(defaultHero);
      console.log('Default landing hero created.');
    } else {
      console.log('Landing hero already exists, skipping.');
    }

    const existingSettings = await SiteSettings.findOne();
    if (!existingSettings) {
      await SiteSettings.create(defaultSettings);
      console.log('Default site settings created.');
    } else {
      console.log('Site settings already exist, skipping.');
    }

    await mongoose.connection.close();
    console.log('Landing seed done.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding landing:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedLanding();
