import mongoose, { Document, Schema } from 'mongoose';

export interface ILandingHero extends Document {
  title: string;
  subtitle: string;
  /** @deprecated Use backgroundImageUrls + primaryBackgroundIndex */
  backgroundImageUrl?: string;
  backgroundImageUrls: string[];
  primaryBackgroundIndex: number;
  backgroundVideoUrl?: string;
  ctaText: string;
  ctaLink: string;
  introText: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const LandingHeroSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, trim: true, default: '' },
    backgroundImageUrl: { type: String, trim: true },
    backgroundImageUrls: {
      type: [String],
      default: [],
      trim: true,
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length <= 4,
        message: 'backgroundImageUrls cannot exceed 4 image URLs',
      },
    },
    primaryBackgroundIndex: { type: Number, default: 0 },
    backgroundVideoUrl: { type: String, trim: true },
    ctaText: { type: String, required: true, trim: true, default: 'Book Now' },
    ctaLink: { type: String, required: true, trim: true, default: '/booking' },
    introText: { type: String, trim: true, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ILandingHero>('LandingHero', LandingHeroSchema);
