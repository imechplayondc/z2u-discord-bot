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
  customId: "trade_setup",
  async execute(interaction: ButtonInteraction) {
    const trade = await Trade.findOne({
      channelId: interaction.channelId,
      status: "pending_payment",
    });

    if (!trade) {
      return interaction.reply({ embeds: [errorEmbed("No Trade", "No active trade found in this channel.")], ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId(`trade_setup_modal_${trade._id}`)
      .setTitle("Setup Trade Details");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("trader_id")
          .setLabel("Second Trader's Discord User ID")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("123456789012345678")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("amount")
          .setLabel("Trade Amount (e.g. $50, 0.5 ETH)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("item")
          .setLabel("Item / Service Being Traded")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  },
};
