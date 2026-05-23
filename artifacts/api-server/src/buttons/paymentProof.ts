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
    const trade = await Trade.findOne({
      channelId: interaction.channelId,
      status: { $in: ["pending_payment", "payment_submitted"] },
    });

    if (!trade) {
      return interaction.reply({ embeds: [errorEmbed("No Trade", "No pending trade found in this channel.")], ephemeral: true });
    }

    if (trade.buyerId !== interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed("No Permission", "Only the buyer can submit payment proof.")], ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId(`proof_submit_${trade._id}`)
      .setTitle("Submit Payment Proof");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("proof_url")
          .setLabel("Payment Screenshot URL")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("https://imgur.com/...")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("notes")
          .setLabel("Additional Notes (optional)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
      )
    );

    await interaction.showModal(modal);
  },
};
