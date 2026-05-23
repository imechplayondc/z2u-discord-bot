import {
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import Trade from "../models/Trade.js";
import { errorEmbed } from "../utils/embeds.js";

export default {
  customId: "submit_proof",
  async execute(interaction: ButtonInteraction) {
    // Support both "submit_proof" and "submit_proof_<tradeId>"
    const tradeIdFromBtn = interaction.customId.startsWith("submit_proof_")
      ? interaction.customId.replace("submit_proof_", "")
      : null;

    const query = tradeIdFromBtn
      ? { _id: tradeIdFromBtn, status: { $in: ["pending_payment", "payment_submitted"] } }
      : { channelId: interaction.channelId, status: { $in: ["pending_payment", "payment_submitted"] } };

    const trade = await Trade.findOne(query);

    if (!trade) {
      return interaction.reply({
        embeds: [errorEmbed("No Trade", "No active trade found. Make sure the trade has been set up first.")],
        flags: 64,
      });
    }

    // Only the buyer can submit proof (after trade setup sets the real buyerId)
    // Before setup, buyerId === sellerId so seller can submit as placeholder
    if (trade.buyerId !== interaction.user.id && trade.sellerId !== interaction.user.id) {
      return interaction.reply({
        embeds: [errorEmbed("No Permission", "Only the buyer or seller can submit payment proof.")],
        flags: 64,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`proof_submit_${trade._id}`)
      .setTitle("Submit Payment Proof");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("proof_url")
          .setLabel("Payment screenshot URL")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("https://imgur.com/...")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("notes")
          .setLabel("Additional notes (optional)")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(500)
          .setRequired(false)
      )
    );

    await interaction.showModal(modal);
  },
};
