import mongoose, { Document, Schema } from 'mongoose';

export interface ISiteSettings extends Document {
  siteName: string;
  phone?: string;
  email?: string;
  mapLink?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  whatsappNumber?: string;
  footerText?: string;
  updatedAt: Date;
}

const SiteSettingsSchema: Schema = new Schema(
  {
    siteName: { type: String, required: true, trim: true, default: 'استوديو العمري' },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    mapLink: { type: String, trim: true },
    facebookUrl: { type: String, trim: true },
    instagramUrl: { type: String, trim: true },
    twitterUrl: { type: String, trim: true },
    whatsappNumber: { type: String, trim: true },
    footerText: { type: String, trim: true },
  },
  { timestamps: true }
);

// Single-document collection: use findOne
export default mongoose.model<ISiteSettings>('SiteSettings', SiteSettingsSchema);
