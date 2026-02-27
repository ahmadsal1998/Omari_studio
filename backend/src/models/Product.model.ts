import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  supplier?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
