import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { isStaff } from "../utils/permissions.js";
import { errorEmbed } from "../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Build and send a custom embed with optional buttons")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!(await isStaff(member))) {
      return interaction.reply({ embeds: [errorEmbed("No Permission", "You need staff permissions.")], ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId("embed_create")
      .setTitle("Custom Embed Builder");

    modal.addComponents(
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
          .setLabel("Embed Color (hex, e.g. #00b4d8)")
          .setStyle(TextInputStyle.Short)
          .setValue("#00b4d8")
          .setRequired(false)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("image")
          .setLabel("Image URL (optional)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("buttons")
          .setLabel("Buttons (label:action:value | label:action:value)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Open Ticket:ticket:panelName | Get Role:role:roleId | Visit:link:https://z2u.com")
          .setRequired(false)
      )
    );

    await interaction.showModal(modal);
  },
};
