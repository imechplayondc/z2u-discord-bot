import {
  Interaction,
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
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
      botLog("error", "Interaction error:", err);
    }
  },
};

async function handleCommand(client: BotClient, interaction: ChatInputCommandInteraction) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    botLog("error", `Command ${interaction.commandName} error:`, err);
    const embed = errorEmbed("Error", "Something went wrong running that command.");
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

async function handleButton(client: BotClient, interaction: ButtonInteraction) {
  const customId = interaction.customId;
  let handler = client.buttons.get(customId);

  if (!handler) {
    for (const [key, btn] of client.buttons) {
      if (key instanceof RegExp && key.test(customId)) {
        handler = btn;
        break;
      }
    }
  }

  if (!handler) {
    const prefix = customId.split("_").slice(0, 2).join("_");
    handler = client.buttons.get(prefix);
  }

  if (!handler) return;

  try {
    await handler.execute(interaction);
  } catch (err) {
    botLog("error", `Button ${customId} error:`, err);
    const embed = errorEmbed("Error", "Something went wrong.");
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

async function handleModal(client: BotClient, interaction: ModalSubmitInteraction) {
  const customId = interaction.customId;
  let handler = client.modals.get(customId);

  if (!handler) {
    for (const [key, modal] of client.modals) {
      if (key instanceof RegExp && key.test(customId)) {
        handler = modal;
        break;
      }
    }
  }

  if (!handler) {
    const prefix = customId.split("_").slice(0, 2).join("_");
    handler = client.modals.get(prefix);
  }

  if (!handler) return;

  try {
    await handler.execute(interaction);
  } catch (err) {
    botLog("error", `Modal ${customId} error:`, err);
    const embed = errorEmbed("Error", "Something went wrong.");
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [embed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

async function handleSelectMenu(client: BotClient, interaction: StringSelectMenuInteraction) {
  const customId = interaction.customId;
  let handler = client.selectMenus.get(customId);

  if (!handler) {
    for (const [key, menu] of client.selectMenus) {
      if (key instanceof RegExp && key.test(customId)) {
        handler = menu;
        break;
      }
    }
  }

  if (!handler) {
    const prefix = customId.split("_").slice(0, 2).join("_");
    handler = client.selectMenus.get(prefix);
  }

  if (!handler) return;

  try {
    await handler.execute(interaction);
  } catch (err) {
    botLog("error", `SelectMenu ${customId} error:`, err);
  }
}
