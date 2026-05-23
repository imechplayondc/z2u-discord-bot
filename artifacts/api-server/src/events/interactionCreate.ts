import {
  Interaction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  Collection,
} from "discord.js";
import { BotClient } from "../bot/client.js";
import { botLog } from "../utils/logger.js";
import { errorEmbed } from "../utils/embeds.js";

export default {
  name: "interactionCreate",
  once: false,
  async execute(client: BotClient, interaction: Interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(client, interaction);
      } else if (interaction.isButton()) {
        await handleButton(client, interaction);
      } else if (interaction.isModalSubmit()) {
        await handleModal(client, interaction);
      } else if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(client, interaction);
      }
    } catch (err) {
      botLog("error", "Top-level interaction error:", err);
    }
  },
};

/**
 * Find a handler by:
 * 1. Exact string key match
 * 2. Regex source key match (e.g. stored as "^verify_proof_", tested against full customId)
 * 3. Progressively shorter prefix matches (longest-first, min 2 parts)
 */
function resolveHandler(map: Collection<string, any>, customId: string): any | undefined {
  // 1. Exact match
  const exact = map.get(customId);
  if (exact) return exact;

  // 2. Regex source match — stored key is the regex source string
  for (const [key, handler] of map) {
    if (key.includes("(") || key.startsWith("^") || key.endsWith("_")) {
      try {
        if (new RegExp(key).test(customId)) return handler;
      } catch {
        // not a valid regex, skip
      }
    }
  }

  // 3. Prefix matching — try from longest prefix down to 2 parts
  const parts = customId.split("_");
  for (let len = parts.length - 1; len >= 2; len--) {
    const prefix = parts.slice(0, len).join("_");
    const h = map.get(prefix);
    if (h) return h;
  }

  return undefined;
}

async function handleCommand(client: BotClient, interaction: ChatInputCommandInteraction) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    botLog("error", `Command ${interaction.commandName} error:`, err);
    const embed = errorEmbed("Error", "Something went wrong running that command.");
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed], flags: 64 });
    } else {
      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }
}

async function handleButton(client: BotClient, interaction: ButtonInteraction) {
  const handler = resolveHandler(client.buttons as unknown as Collection<string, any>, interaction.customId);
  if (!handler) {
    botLog("warn", `No button handler for: ${interaction.customId}`);
    return;
  }
  try {
    await handler.execute(interaction);
  } catch (err) {
    botLog("error", `Button ${interaction.customId} error:`, err);
    const embed = errorEmbed("Error", "Something went wrong.");
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed], flags: 64 });
    } else {
      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }
}

async function handleModal(client: BotClient, interaction: ModalSubmitInteraction) {
  const handler = resolveHandler(client.modals as unknown as Collection<string, any>, interaction.customId);
  if (!handler) {
    botLog("warn", `No modal handler for: ${interaction.customId}`);
    return;
  }
  try {
    await handler.execute(interaction);
  } catch (err) {
    botLog("error", `Modal ${interaction.customId} error:`, err);
    const embed = errorEmbed("Error", "Something went wrong.");
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed], flags: 64 });
    } else {
      await interaction.reply({ embeds: [embed], flags: 64 });
    }
  }
}

async function handleSelectMenu(client: BotClient, interaction: StringSelectMenuInteraction) {
  const handler = resolveHandler(client.selectMenus as unknown as Collection<string, any>, interaction.customId);
  if (!handler) {
    botLog("warn", `No select menu handler for: ${interaction.customId}`);
    return;
  }
  try {
    await handler.execute(interaction);
  } catch (err) {
    botLog("error", `SelectMenu ${interaction.customId} error:`, err);
  }
}
