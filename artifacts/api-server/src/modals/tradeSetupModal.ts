import {
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  PermissionFlagsBits,
} from "discord.js";
import Trade from "../models/Trade.js";
import Wallet from "../models/Wallet.js";
import { errorEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

export default {
  customId: "trade_setup_modal",
  async execute(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: 64 });

    const tradeId = interaction.customId.replace("trade_setup_modal_", "");
    const trade = await Trade.findById(tradeId);
    if (!trade) {
      return interaction.editReply({ embeds: [errorEmbed("Error", "Trade record not found. Please close this ticket and try again.")] });
    }

    if (trade.status !== "pending_payment") {
      return interaction.editReply({ embeds: [errorEmbed("Already Set Up", "This trade has already been configured.")] });
    }

    const buyerId = interaction.fields.getTextInputValue("trader_id").trim();
    const amount = interaction.fields.getTextInputValue("amount").trim();
    const item = interaction.fields.getTextInputValue("item").trim();

    // Validate buyer is a real guild member
    let buyerMember;
    try {
      buyerMember = await interaction.guild!.members.fetch(buyerId);
    } catch {
      return interaction.editReply({
        embeds: [errorEmbed("User Not Found", `Could not find a member with ID \`${buyerId}\`. Make sure they are in this server and you copied the ID correctly.`)],
      });
    }

    // Don't allow seller = buyer
    if (buyerId === trade.sellerId) {
      return interaction.editReply({
        embeds: [errorEmbed("Invalid User", "The buyer cannot be the same person as the seller.")],
      });
    }

    // Get wallet address — prefer already-stored address, re-validate from wallet record
    const walletRecord = await Wallet.findOne({ userId: trade.sellerId, guildId: interaction.guildId });
    const walletEntry = walletRecord?.wallets.find((w) => w.method === trade.paymentMethod);
    const walletAddress = walletEntry?.address || trade.walletAddress || "Contact staff for wallet address";

    // Add buyer to the ticket channel
    const channel = interaction.guild!.channels.cache.get(interaction.channelId!) as TextChannel | undefined;
    if (channel) {
      await channel.permissionOverwrites.edit(buyerId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
      });
    }

    // Update trade record
    await Trade.findByIdAndUpdate(tradeId, {
      buyerId,
      amount,
      item,
      walletAddress,
      status: "pending_payment",
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.Z2U)
      .setTitle("🔄 Trade Details Configured")
      .setDescription("Please review the trade details below. **Do not send payment until told to by staff.**")
      .addFields(
        { name: "💰 Amount", value: amount, inline: true },
        { name: "💳 Payment Method", value: trade.paymentMethod, inline: true },
        { name: "📦 Item / Service", value: item, inline: false },
        { name: "👤 Seller", value: `<@${trade.sellerId}>`, inline: true },
        { name: "👤 Buyer", value: `<@${buyerId}>`, inline: true },
        {
          name: "📬 Send Payment To",
          value: `\`\`\`${walletAddress}\`\`\``,
          inline: false,
        },
        {
          name: "⚠️ Important",
          value:
            "• Screenshot your payment **before** sending\n" +
            "• Only send after staff gives the go-ahead\n" +
            "• Use the button below to submit your payment proof",
          inline: false,
        }
      )
      .setTimestamp()
      .setFooter({ text: "z2u.com | Secure Middleman Trading" });

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`submit_proof_${tradeId}`)
        .setLabel("Submit Payment Proof")
        .setEmoji("📸")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`ticket_close_${tradeId}`)
        .setLabel("Close Ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );

    if (channel) {
      await channel.send({
        content: `<@${trade.sellerId}> <@${buyerId}>`,
        embeds: [embed],
        components: [actionRow],
      });
    }

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle("✅ Trade Configured")
          .setDescription(`Trade details posted in the channel. <@${buyerMember.user.id}> has been added to the ticket.`),
      ],
    });
  },
};
