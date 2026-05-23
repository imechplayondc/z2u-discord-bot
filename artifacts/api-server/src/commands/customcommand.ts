import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} from "discord.js";
import CustomCommand from "../models/CustomCommand.js";
import { isAdmin } from "../utils/permissions.js";
import { errorEmbed, successEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

export default {
  data: new SlashCommandBuilder()
    .setName("customcommand")
    .setDescription("Manage custom commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName("create").setDescription("Create a new custom command")
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a custom command")
        .addStringOption((o) =>
          o.setName("trigger").setDescription("Command trigger to delete").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all custom commands")
    )
    .addSubcommand((sub) =>
      sub
        .setName("use")
        .setDescription("Use a custom command")
        .addStringOption((o) =>
          o.setName("trigger").setDescription("Command trigger").setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    const sub = interaction.options.getSubcommand();

    if (sub === "use") {
      const trigger = interaction.options.getString("trigger", true);
      const cmd = await CustomCommand.findOne({ guildId: interaction.guildId, trigger });
      if (!cmd) return interaction.reply({ embeds: [errorEmbed("Not Found", `No command with trigger \`${trigger}\`.`)], ephemeral: true });

      const embed = new EmbedBuilder()
        .setColor(parseInt(cmd.embedColor.replace("#", ""), 16))
        .setDescription(cmd.embedDescription);

      if (cmd.embedTitle) embed.setTitle(cmd.embedTitle);
      if (cmd.embedImage) embed.setImage(cmd.embedImage);
      if (cmd.embedThumbnail) embed.setThumbnail(cmd.embedThumbnail);
      if (cmd.embedFooter) embed.setFooter({ text: cmd.embedFooter });
      embed.setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (!(await isAdmin(member))) {
      return interaction.reply({ embeds: [errorEmbed("No Permission", "You need admin permissions.")], ephemeral: true });
    }

    if (sub === "list") {
      const cmds = await CustomCommand.find({ guildId: interaction.guildId });
      if (!cmds.length) return interaction.reply({ embeds: [errorEmbed("No Commands", "No custom commands configured.")], ephemeral: true });
      const embed = new EmbedBuilder()
        .setColor(COLORS.Z2U)
        .setTitle("⚙️ Custom Commands")
        .setDescription(cmds.map((c, i) => `**${i + 1}.** \`${c.trigger}\` — by <@${c.createdBy}>`).join("\n"))
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "delete") {
      const trigger = interaction.options.getString("trigger", true);
      const deleted = await CustomCommand.findOneAndDelete({ guildId: interaction.guildId, trigger });
      if (!deleted) return interaction.reply({ embeds: [errorEmbed("Not Found", `No command with trigger \`${trigger}\`.`)], ephemeral: true });
      return interaction.reply({ embeds: [successEmbed("Deleted", `Custom command \`${trigger}\` deleted.`)], ephemeral: true });
    }

    if (sub === "create") {
      const modal = new ModalBuilder()
        .setCustomId("customcmd_create")
        .setTitle("Custom Command Builder");

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("trigger")
            .setLabel("Command Trigger (e.g. !rules, !info)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("title")
            .setLabel("Embed Title (optional)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("description")
            .setLabel("Embed Description")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("color")
            .setLabel("Embed Color (hex)")
            .setStyle(TextInputStyle.Short)
            .setValue("#00b4d8")
            .setRequired(false)
        ),
        new ActionRowBuilder<TextInputBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("buttons")
            .setLabel("Buttons: label:action:value | label:action:value")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Rules:link:https://z2u.com | Open Ticket:ticket:support")
            .setRequired(false)
        )
      );

      await interaction.showModal(modal);
    }
  },
};
