import mongoose, { Document, Schema } from "mongoose";

export interface IGuildConfig extends Document {
  guildId: string;
  adminRoles: string[];
  moderatorRoles: string[];
  middlemanRoles: string[];
  logChannel?: string;
  transcriptChannel?: string;
  verificationRole?: string;
  ticketCooldown: number;
  autoMMEnabled: boolean;
  autoMMCategory?: string;
  autoMMStaffRole?: string;
  autoMMTitle?: string;
  autoMMDescription?: string;
  autoMMImage?: string;
  paymentMethods: {
    name: string;
    emoji: string;
    emojiId?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const GuildConfigSchema = new Schema<IGuildConfig>(
  {
    guildId: { type: String, required: true, unique: true },
    adminRoles: [{ type: String }],
    moderatorRoles: [{ type: String }],
    middlemanRoles: [{ type: String }],
    logChannel: { type: String },
    transcriptChannel: { type: String },
    verificationRole: { type: String },
    ticketCooldown: { type: Number, default: 30 },
    autoMMEnabled: { type: Boolean, default: false },
    autoMMCategory: { type: String },
    autoMMStaffRole: { type: String },
    autoMMTitle: { type: String },
    autoMMDescription: { type: String },
    autoMMImage: { type: String },
    paymentMethods: [
      {
        name: { type: String, required: true },
        emoji: { type: String, required: true },
        emojiId: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IGuildConfig>("GuildConfig", GuildConfigSchema);
