import {
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";

export default {
  customId: "panel_setup_step2",
  async execute(interaction: ModalSubmitInteraction) {
    const parts = interaction.customId.split("_");
    const type = parts[parts.length - 1] as string;

    const name = interaction.fields.getTextInputValue("name").toLowerCase().replace(/\s+/g, "-");
    const channels = interaction.fields.getTextInputValue("channels");
    const logChannel = interaction.fields.getTextInputValue("logchannel").trim() || undefined;
    const image = interaction.fields.getTextInputValue("image").trim() || undefined;
    const sendChannel = interaction.fields.getTextInputValue("send_channel").trim();

    const [categoryId, roleId, transcriptChannelId] = channels.split("|").map((s) => s.trim());

    if (!categoryId || !roleId || !transcriptChannelId) {
      const { errorEmbed } = await import("../utils/embeds.js");
      return interaction.reply({
        embeds: [errorEmbed("Invalid Format", "Please use format: `categoryId|roleId|transcriptChannelId`")],
        ephemeral: true,
      });
    }

    // Step 3: Ask for embed config
    const modal = new ModalBuilder()
      .setCustomId(`panel_setup_step3_${type}_${name}_${categoryId}_${roleId}_${transcriptChannelId}_${sendChannel}_${logChannel || "none"}_${image || "none"}`)
      .setTitle("Panel Embed Configuration");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("title")
          .setLabel("Panel Title")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("🎫 Support Tickets")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Panel Description")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("footer")
          .setLabel("Footer Text")
          .setStyle(TextInputStyle.Short)
          .setValue("Click the button below to open a ticket")
          .setRequired(false)
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
          .setCustomId("button")
          .setLabel("Button Name | Button Emoji | Custom Questions (with |)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Open Ticket|🎫|What is your issue?|Your username?")
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  },
};
