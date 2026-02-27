import mongoose, { Document, Schema } from 'mongoose';

export interface ITestimonial extends Document {
  clientName: string;
  clientImageUrl?: string;
  text: string;
  eventType?: string;
  rating?: number;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema: Schema = new Schema(
  {
    clientName: { type: String, required: true, trim: true },
    clientImageUrl: { type: String, trim: true },
    text: { type: String, required: true, trim: true },
    eventType: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 5 },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITestimonial>('Testimonial', TestimonialSchema);
