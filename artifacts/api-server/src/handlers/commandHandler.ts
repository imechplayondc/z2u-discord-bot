import { BotClient } from "../bot/client.js";
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

export async function loadCommands(client: BotClient) {
  for (const command of commands) {
    client.commands.set(command.data.name, command);
    botLog("info", `Loaded command: ${command.data.name}`);
  }
}
