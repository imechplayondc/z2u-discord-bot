import mongoose, { Document, Schema } from "mongoose";

export interface IPanelSession extends Document {
  sessionId: string;
  guildId: string;
  userId: string;
  type: string;
  name: string;
  categoryId: string;
  roleId: string;
  transcriptChannelId: string;
  sendChannelId: string;
  logChannelId?: string;
  imageUrl?: string;
  createdAt: Date;
}

const PanelSessionSchema = new Schema<IPanelSession>(
  {
    sessionId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    type: { type: String, required: true },
    name: { type: String, required: true },
    categoryId: { type: String, required: true },
    roleId: { type: String, required: true },
    transcriptChannelId: { type: String, required: true },
    sendChannelId: { type: String, required: true },
    logChannelId: { type: String },
    imageUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Auto-expire sessions after 10 minutes
PanelSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

export default mongoose.model<IPanelSession>("PanelSession", PanelSessionSchema);
