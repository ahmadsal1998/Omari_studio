import mongoose, { Document, Schema } from 'mongoose';

export interface IQuickServiceItem {
  service?: mongoose.Types.ObjectId;
  product?: mongoose.Types.ObjectId;
  quantity: number;
  type: 'service' | 'product';
}

export interface IQuickService extends Document {
  customer?: mongoose.Types.ObjectId; // optional, can be cash customer
  items: IQuickServiceItem[];
  paymentType: 'cash' | 'credit';
  totalSellingPrice: number;
  totalCost: number;
  profit: number;
  createdAt: Date;
  updatedAt: Date;
}

const QuickServiceItemSchema = new Schema({
  service: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  type: {
    type: String,
    enum: ['service', 'product'],
    required: true,
  },
});

const QuickServiceSchema: Schema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
    },
    items: {
      type: [QuickServiceItemSchema],
      required: true,
      validate: {
        validator: (v: IQuickServiceItem[]) => v.length > 0,
        message: 'At least one item is required',
      },
    },
    paymentType: {
      type: String,
      enum: ['cash', 'credit'],
      default: 'cash',
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

export default mongoose.model<IQuickService>('QuickService', QuickServiceSchema);
