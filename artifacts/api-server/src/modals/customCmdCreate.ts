import { ModalSubmitInteraction, EmbedBuilder } from "discord.js";
import CustomCommand from "../models/CustomCommand.js";
import { successEmbed, errorEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

export default {
  customId: "customcmd_create",
  async execute(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const trigger = interaction.fields.getTextInputValue("trigger").trim();
    const title = interaction.fields.getTextInputValue("title")?.trim();
    const description = interaction.fields.getTextInputValue("description");
    const colorHex = interaction.fields.getTextInputValue("color")?.trim() || "#00b4d8";
    const buttonsRaw = interaction.fields.getTextInputValue("buttons")?.trim();

    const buttons: { label: string; action: string; style: string; value: string }[] = [];
    if (buttonsRaw) {
      const defs = buttonsRaw.split("|").map((s) => s.trim()).filter(Boolean);
      for (const def of defs.slice(0, 5)) {
        const parts = def.split(":").map((s) => s.trim());
        if (parts.length >= 3) {
          buttons.push({ label: parts[0], action: parts[1], value: parts[2], style: "primary" });
        }
      }
    }

    const existing = await CustomCommand.findOne({ guildId: interaction.guildId, trigger });
    if (existing) {
      return interaction.editReply({ embeds: [errorEmbed("Already Exists", `A command with trigger \`${trigger}\` already exists. Delete it first.`)] });
    }

    await CustomCommand.create({
      guildId: interaction.guildId,
      trigger,
      embedTitle: title || undefined,
      embedDescription: description,
      embedColor: colorHex,
      buttons: buttons.map((b) => ({
        label: b.label,
        style: b.style,
        action: b.action,
        value: b.value,
      })),
      allowedRoles: [],
      createdBy: interaction.user.id,
    });

    return interaction.editReply({
      embeds: [successEmbed("Command Created", `Custom command \`${trigger}\` has been created!\nUse \`/customcommand use trigger:${trigger}\` to use it.`)],
    });
  },
};
