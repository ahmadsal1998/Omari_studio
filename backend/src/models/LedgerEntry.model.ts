import mongoose, { Document, Schema } from 'mongoose';

export type LedgerEntityType = 'customer' | 'supplier';
export type LedgerEntryType =
  | 'opening_balance'
  | 'journal'      // سند قيد - debit to customer
  | 'receipt'     // سند قبض - credit to customer
  | 'invoice'     // from booking
  | 'return'
  | 'purchase'    // supplier credit purchase
  | 'payment';    // supplier payment

export interface ILedgerEntry extends Document {
  entityType: LedgerEntityType;
  entityId: mongoose.Types.ObjectId;
  type: LedgerEntryType;
  date: Date;
  /** Positive = debit (increase debt), negative = credit (decrease debt) */
  amount: number;
  notes?: string;
  referenceNumber?: string;
  paymentMethod?: string;
  relatedId?: mongoose.Types.ObjectId;
  relatedModel?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerEntrySchema: Schema = new Schema(
  {
    entityType: {
      type: String,
      enum: ['customer', 'supplier'],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'entityModel',
    },
    entityModel: {
      type: String,
      enum: ['Customer', 'Supplier'],
      required: true,
    },
    type: {
      type: String,
      enum: ['opening_balance', 'journal', 'receipt', 'invoice', 'return', 'purchase', 'payment'],
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    amount: {
      type: Number,
      required: true,
    },
    notes: { type: String, trim: true },
    referenceNumber: { type: String, trim: true },
    paymentMethod: { type: String, trim: true },
    relatedId: { type: Schema.Types.ObjectId },
    relatedModel: { type: String, trim: true },
  },
  { timestamps: true }
);

LedgerEntrySchema.index({ entityType: 1, entityId: 1, date: 1 });

export default mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);
