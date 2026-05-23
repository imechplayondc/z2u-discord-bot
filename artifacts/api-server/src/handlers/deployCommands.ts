import { REST, Routes } from "discord.js";
import { botLog } from "../utils/logger.js";

import help from "../commands/help.js";
import wallet from "../commands/wallet.js";
import panel from "../commands/panel.js";
import autommpanel from "../commands/autommpanel.js";
import embed from "../commands/embed.js";
import customcommand from "../commands/customcommand.js";
import ticket from "../commands/ticket.js";
import trade from "../commands/trade.js";
import config from "../commands/config.js";

const commands = [help, wallet, panel, autommpanel, embed, customcommand, ticket, trade, config];

export async function deployCommands() {
  const token = process.env.DISCORD_TOKEN!;
  const clientId = process.env.DISCORD_CLIENT_ID!;

  if (!token || !clientId) {
    botLog("warn", "DISCORD_TOKEN or DISCORD_CLIENT_ID missing — skipping command deploy.");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(token);

  try {
    botLog("info", `Deploying ${commands.length} slash commands globally...`);
    await rest.put(Routes.applicationCommands(clientId), {
      body: commands.map((c) => c.data.toJSON()),
    });
    botLog("info", "Commands deployed successfully.");
  } catch (err) {
    botLog("error", "Failed to deploy commands:", err);
  }
}
