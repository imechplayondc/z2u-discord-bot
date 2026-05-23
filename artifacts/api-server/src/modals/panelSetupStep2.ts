import {
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import { randomUUID } from "crypto";
import PanelSession from "../models/PanelSession.js";
import { errorEmbed } from "../utils/embeds.js";

export default {
  customId: "panel_setup_step2",
  async execute(interaction: ModalSubmitInteraction) {
    const type = interaction.customId.replace("panel_setup_step2_", "");

    const name = interaction.fields.getTextInputValue("name").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const categoryId = interaction.fields.getTextInputValue("category_id").trim();
    const roleId = interaction.fields.getTextInputValue("role_id").trim();
    const channelIds = interaction.fields.getTextInputValue("channel_ids").trim();
    const optionalIds = interaction.fields.getTextInputValue("optional_ids")?.trim() || "";

    const channelParts = channelIds.split("|").map((s) => s.trim());
    const transcriptChannelId = channelParts[0];
    const sendChannelId = channelParts[1];

    if (!transcriptChannelId || !sendChannelId) {
      return interaction.reply({
        embeds: [errorEmbed("Invalid Format", 'Use format: `transcriptChannelId|sendChannelId`')],
        flags: 64,
      });
    }

    const optParts = optionalIds.split("|").map((s) => s.trim());
    const logChannelId = optParts[0] || undefined;
    const imageUrl = optParts[1] || undefined;

    // Store session in DB so we don't overflow customId limits
    const sessionId = randomUUID().replace(/-/g, "").slice(0, 16);
    await PanelSession.create({
      sessionId,
      guildId: interaction.guildId,
      userId: interaction.user.id,
      type,
      name,
      categoryId,
      roleId,
      transcriptChannelId,
      sendChannelId,
      logChannelId,
      imageUrl,
    });

    // Step 3 modal — embed design
    const modal = new ModalBuilder()
      .setCustomId(`panel_setup_step3_${sessionId}`)
      .setTitle("Panel Setup — Step 3/3");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("title")
          .setLabel("Panel embed title")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("🎫 Support Tickets")
          .setMaxLength(256)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Panel embed description")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(4000)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("footer_color")
          .setLabel("Footer text | Embed color (hex)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Open a ticket below|#00b4d8")
          .setRequired(false)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("button")
          .setLabel("Button label | Button emoji")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Open Ticket|🎫")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("questions")
          .setLabel("Custom questions (separated by |)")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("What is your issue?|Your username?|Order ID?")
          .setRequired(false)
      )
    );

    await interaction.showModal(modal);
  },
};
