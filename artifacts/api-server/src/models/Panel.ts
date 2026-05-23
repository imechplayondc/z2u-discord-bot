import mongoose, { Document, Schema } from "mongoose";

export interface IPanel extends Document {
  guildId: string;
  channelId: string;
  messageId: string;
  name: string;
  title: string;
  description: string;
  footerText: string;
  buttonName: string;
  buttonEmoji: string;
  embedColor: string;
  customQuestions: string[];
  ticketCategory: string;
  supportRole: string;
  transcriptChannel: string;
  logChannel?: string;
  panelImage?: string;
  buttonType: "ticket" | "message" | "verification" | "role" | "link" | "automm" | "application" | "giveaway";
  linkUrl?: string;
  roleId?: string;
  customMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PanelSchema = new Schema<IPanel>(
  {
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    name: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    footerText: { type: String, default: "Click the button below to open a ticket" },
    buttonName: { type: String, required: true },
    buttonEmoji: { type: String, default: "🎫" },
    embedColor: { type: String, default: "#5865F2" },
    customQuestions: [{ type: String }],
    ticketCategory: { type: String, required: true },
    supportRole: { type: String, required: true },
    transcriptChannel: { type: String, required: true },
    logChannel: { type: String },
    panelImage: { type: String },
    buttonType: {
      type: String,
      enum: ["ticket", "message", "verification", "role", "link", "automm", "application", "giveaway"],
      default: "ticket",
    },
    linkUrl: { type: String },
    roleId: { type: String },
    customMessage: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IPanel>("Panel", PanelSchema);
