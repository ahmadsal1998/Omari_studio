import mongoose, { Document, Schema } from 'mongoose';

export interface IPurchaseItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  purchasePrice: number;
}

export interface IPurchase extends Document {
  supplier: mongoose.Types.ObjectId;
  items: IPurchaseItem[];
  paymentType: 'cash' | 'credit';
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0,
  },
});

const PurchaseSchema: Schema = new Schema(
  {
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    items: {
      type: [PurchaseItemSchema],
      required: true,
      validate: {
        validator: (v: IPurchaseItem[]) => v.length > 0,
        message: 'At least one item is required',
      },
    },
    paymentType: {
      type: String,
      enum: ['cash', 'credit'],
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPurchase>('Purchase', PurchaseSchema);
