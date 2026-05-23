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
      .setTitle("Panel Setup — Step 2/3");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("name")
          .setLabel("Panel name (unique, e.g. support)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("general-support")
          .setMaxLength(30)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("category_id")
          .setLabel("Ticket Category ID")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Right-click category → Copy ID")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("role_id")
          .setLabel("Support Role ID")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Right-click role → Copy ID")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("channel_ids")
          .setLabel("Transcript CH ID | Send Panel CH ID")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("transcriptChannelId|sendChannelId")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("optional_ids")
          .setLabel("Log CH ID | Panel Image URL (optional)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("logChannelId|https://i.imgur.com/...")
          .setRequired(false)
      )
    );

    await interaction.showModal(modal);
  },
};
