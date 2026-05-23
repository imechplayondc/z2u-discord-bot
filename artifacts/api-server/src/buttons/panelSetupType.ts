import {
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";

const VALID_TYPES = ["ticket", "automm", "application", "verification", "role", "message", "link", "giveaway"];

export default {
  customId: "psetup_type",
  async execute(interaction: ButtonInteraction) {
    const type = interaction.customId.replace("psetup_type_", "");
    if (!VALID_TYPES.includes(type)) return;

    const modal = new ModalBuilder()
      .setCustomId(`panel_setup_step2_${type}`)
      .setTitle("Panel Setup — Configuration");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("name")
          .setLabel("Panel Name (unique identifier)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("e.g. general-support")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("channels")
          .setLabel("Category ID | Support Role ID | Transcript Ch ID")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("categoryId|roleId|transcriptChannelId")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("logchannel")
          .setLabel("Log Channel ID (optional)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("image")
          .setLabel("Panel Image URL (optional)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("send_channel")
          .setLabel("Channel ID to send the panel to")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  },
};
