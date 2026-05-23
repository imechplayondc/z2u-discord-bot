import mongoose, { Document, Schema } from "mongoose";

export interface ITicket extends Document {
  guildId: string;
  channelId: string;
  userId: string;
  panelId: string;
  panelName: string;
  status: "open" | "closed" | "claimed";
  claimedBy?: string;
  answers: { question: string; answer: string }[];
  transcriptUrl?: string;
  closedAt?: Date;
  closedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    guildId: { type: String, required: true },
    channelId: { type: String, required: true },
    userId: { type: String, required: true },
    panelId: { type: String, required: true },
    panelName: { type: String, required: true },
    status: { type: String, enum: ["open", "closed", "claimed"], default: "open" },
    claimedBy: { type: String },
    answers: [
      {
        question: { type: String },
        answer: { type: String },
      },
    ],
    transcriptUrl: { type: String },
    closedAt: { type: Date },
    closedBy: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITicket>("Ticket", TicketSchema);
