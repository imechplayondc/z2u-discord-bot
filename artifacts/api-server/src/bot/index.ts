import mongoose from "mongoose";
import { client } from "./client.js";
import { loadCommands } from "../handlers/commandHandler.js";
import { loadEvents } from "../handlers/eventHandler.js";
import { loadButtons, loadModals, loadSelectMenus } from "../handlers/interactionHandler.js";
import { botLog } from "../utils/logger.js";

export async function startBot() {
  const mongoUri = process.env.MONGODB_URI;
  const token = process.env.DISCORD_TOKEN;

  if (!mongoUri) throw new Error("MONGODB_URI is required");
  if (!token) throw new Error("DISCORD_TOKEN is required");

  botLog("info", "Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  botLog("info", "MongoDB connected.");

  botLog("info", "Loading handlers...");
  await loadCommands(client);
  await loadEvents(client);
  await loadButtons(client);
  await loadModals(client);
  await loadSelectMenus(client);

  botLog("info", "Logging in to Discord...");
  await client.login(token);
}
