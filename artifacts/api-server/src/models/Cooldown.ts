import mongoose, { Document, Schema } from "mongoose";

export interface ICooldown extends Document {
  userId: string;
  guildId: string;
  panelId: string;
  expiresAt: Date;
}

const CooldownSchema = new Schema<ICooldown>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  panelId: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

CooldownSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
CooldownSchema.index({ userId: 1, guildId: 1, panelId: 1 }, { unique: true });

export default mongoose.model<ICooldown>("Cooldown", CooldownSchema);
