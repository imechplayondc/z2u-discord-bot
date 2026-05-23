import { BotClient } from "../bot/client.js";
import { botLog } from "../utils/logger.js";

import ready from "../events/ready.js";
import interactionCreate from "../events/interactionCreate.js";
import guildCreate from "../events/guildCreate.js";

const events = [ready, interactionCreate, guildCreate];

export async function loadEvents(client: BotClient) {
  for (const event of events) {
    if (event.once) {
      client.once(event.name, (...args: unknown[]) => (event as any).execute(client, ...args));
    } else {
      client.on(event.name, (...args: unknown[]) => (event as any).execute(client, ...args));
    }
    botLog("info", `Loaded event: ${event.name}`);
  }
}
