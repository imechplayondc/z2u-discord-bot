import mongoose, { Document, Schema } from "mongoose";

export interface IWalletEntry {
  method: string;
  address: string;
  emoji?: string;
}

export interface IWallet extends Document {
  userId: string;
  guildId: string;
  wallets: IWalletEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    wallets: [
      {
        method: { type: String, required: true },
        address: { type: String, required: true },
        emoji: { type: String },
      },
    ],
  },
  { timestamps: true }
);

WalletSchema.index({ userId: 1, guildId: 1 }, { unique: true });

export default mongoose.model<IWallet>("Wallet", WalletSchema);
