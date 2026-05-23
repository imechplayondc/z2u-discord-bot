import mongoose, { Document, Schema } from "mongoose";

export type TradeStatus =
  | "pending_payment"
  | "payment_submitted"
  | "payment_verified"
  | "completing"
  | "completed"
  | "refunded"
  | "disputed";

export interface IPaymentProof {
  imageUrl: string;
  submittedAt: Date;
  verifiedBy?: string;
}

export interface ITrade extends Document {
  guildId: string;
  channelId: string;
  sellerId: string;
  buyerId: string;
  middlemanId?: string;
  amount: string;
  item: string;
  paymentMethod: string;
  walletAddress: string;
  status: TradeStatus;
  paymentProof?: IPaymentProof;
  completedAt?: Date;
  refundedAt?: Date;
  refundReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TradeSchema = new Schema<ITrade>(
  {
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    sellerId: { type: String, required: true },
    buyerId: { type: String, required: true },
    middlemanId: { type: String },
    amount: { type: String, required: true },
    item: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    walletAddress: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "pending_payment",
        "payment_submitted",
        "payment_verified",
        "completing",
        "completed",
        "refunded",
        "disputed",
      ],
      default: "pending_payment",
    },
    paymentProof: {
      imageUrl: { type: String },
      submittedAt: { type: Date },
      verifiedBy: { type: String },
    },
    completedAt: { type: Date },
    refundedAt: { type: Date },
    refundReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITrade>("Trade", TradeSchema);
