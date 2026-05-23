import mongoose, { Document, Schema } from "mongoose";

export interface ICustomButton {
  label: string;
  emoji?: string;
  style: "primary" | "secondary" | "success" | "danger" | "link";
  action: "ticket" | "message" | "role" | "link";
  value: string;
}

export interface ICustomCommand extends Document {
  guildId: string;
  trigger: string;
  embedTitle?: string;
  embedDescription: string;
  embedColor: string;
  embedImage?: string;
  embedThumbnail?: string;
  embedFooter?: string;
  buttons: ICustomButton[];
  allowedRoles: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomCommandSchema = new Schema<ICustomCommand>(
  {
    guildId: { type: String, required: true },
    trigger: { type: String, required: true },
    embedTitle: { type: String },
    embedDescription: { type: String, required: true },
    embedColor: { type: String, default: "#5865F2" },
    embedImage: { type: String },
    embedThumbnail: { type: String },
    embedFooter: { type: String },
    buttons: [
      {
        label: { type: String, required: true },
        emoji: { type: String },
        style: {
          type: String,
          enum: ["primary", "secondary", "success", "danger", "link"],
          default: "primary",
        },
        action: {
          type: String,
          enum: ["ticket", "message", "role", "link"],
          required: true,
        },
        value: { type: String, required: true },
      },
    ],
    allowedRoles: [{ type: String }],
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

CustomCommandSchema.index({ guildId: 1, trigger: 1 }, { unique: true });

export default mongoose.model<ICustomCommand>("CustomCommand", CustomCommandSchema);
