import {
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import Trade from "../models/Trade.js";
import { errorEmbed } from "../utils/embeds.js";
import { isStaff } from "../utils/permissions.js";

export default {
  customId: "trade_setup",
  async execute(interaction: ButtonInteraction) {
    // Only the seller or staff can set up the trade
    const trade = await Trade.findOne({
      channelId: interaction.channelId,
      status: "pending_payment",
    });

    if (!trade) {
      return interaction.reply({
        embeds: [errorEmbed("No Trade", "No pending trade found in this channel. It may have already been set up.")],
        flags: 64,
      });
    }

    const member = await interaction.guild!.members.fetch(interaction.user.id);
    const staff = await isStaff(member);

    if (trade.sellerId !== interaction.user.id && !staff) {
      return interaction.reply({
        embeds: [errorEmbed("No Permission", "Only the seller or staff can set up this trade.")],
        flags: 64,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId(`trade_setup_modal_${trade._id}`)
      .setTitle("Setup Trade Details");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("trader_id")
          .setLabel("Buyer's Discord User ID")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Right-click user → Copy ID")
          .setMaxLength(20)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("amount")
          .setLabel("Trade amount (e.g. $50, 0.5 ETH)")
          .setStyle(TextInputStyle.Short)
          .setMaxLength(50)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("item")
          .setLabel("Item or service being traded")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(500)
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  },
};
