import mongoose, { Document, Schema } from 'mongoose';

export interface IBookingService {
  service: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IBookingProduct {
  product: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IBooking extends Document {
  customer: mongoose.Types.ObjectId;
  shootingDate: Date;
  shootingTime: string;
  services: IBookingService[];
  products?: IBookingProduct[];
  discount?: number;
  notes?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  source?: 'USER' | 'ADMIN';
  totalSellingPrice: number;
  totalCost: number;
  profit: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookingServiceSchema = new Schema({
  service: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
});

const BookingProductSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
});

const BookingSchema: Schema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    shootingDate: {
      type: Date,
      required: true,
    },
    shootingTime: {
      type: String,
      required: true,
    },
    services: {
      type: [BookingServiceSchema],
      required: true,
      validate: {
        validator: (v: IBookingService[]) => v.length > 0,
        message: 'At least one service is required',
      },
    },
    products: {
      type: [BookingProductSchema],
      default: [],
    },
    discount: {
      type: Number,
      min: 0,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    source: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'ADMIN',
    },
    totalSellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    profit: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IBooking>('Booking', BookingSchema);
