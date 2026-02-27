import mongoose, { Document, Schema } from 'mongoose';

export type CustomerStatus = 'active' | 'blocked' | 'vip';

export interface ICustomer extends Document {
  fullName: string;
  phoneNumber: string;
  notes?: string;
  /** Balance from ledger only (journal debits − receipt credits). Positive = customer owes. */
  balance: number;
  status?: CustomerStatus;
  city?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'blocked', 'vip'],
      default: 'active',
    },
    city: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<ICustomer>('Customer', CustomerSchema);
