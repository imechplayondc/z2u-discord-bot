import { Client, ActivityType } from "discord.js";
import { botLog } from "../utils/logger.js";
import { deployCommands } from "../handlers/deployCommands.js";

export default {
  name: "ready",
  once: true,
  async execute(client: Client) {
    botLog("info", `Bot is online as ${client.user?.tag}`);
    client.user?.setPresence({
      activities: [{ name: "z2u.com | /help", type: ActivityType.Watching }],
      status: "online",
    });
    await deployCommands();
  },
};
