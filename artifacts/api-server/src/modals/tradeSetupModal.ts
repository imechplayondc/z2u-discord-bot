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
    await interaction.deferReply({ ephemeral: true });

    const tradeId = interaction.customId.replace("trade_setup_modal_", "");
    const trade = await Trade.findById(tradeId);
    if (!trade) return interaction.editReply({ embeds: [errorEmbed("Error", "Trade not found.")] });

    const traderId = interaction.fields.getTextInputValue("trader_id").trim();
    const amount = interaction.fields.getTextInputValue("amount").trim();
    const item = interaction.fields.getTextInputValue("item").trim();

    let trader;
    try {
      trader = await interaction.guild!.members.fetch(traderId);
    } catch {
      return interaction.editReply({ embeds: [errorEmbed("Invalid User", "Could not find that user in this server.")] });
    }

    await Trade.findByIdAndUpdate(tradeId, {
      buyerId: traderId,
      amount,
      item,
    });

    // Add second trader to channel
    const channel = interaction.guild!.channels.cache.get(interaction.channelId!) as TextChannel | undefined;
    if (channel) {
      await channel.permissionOverwrites.edit(traderId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
      });
    }

    const walletRecord = await Wallet.findOne({ userId: trade.sellerId, guildId: interaction.guildId });
    const walletEntry = walletRecord?.wallets.find((w) => w.method === trade.paymentMethod);
    const walletAddress = walletEntry?.address || "No wallet set — contact middleman";

    const embed = new EmbedBuilder()
      .setColor(COLORS.Z2U)
      .setTitle("🔄 Trade Setup Complete")
      .setDescription(`A trade has been configured. Please review the details below.`)
      .addFields(
        { name: "💰 Amount", value: amount, inline: true },
        { name: "📦 Item", value: item, inline: true },
        { name: "💳 Payment Method", value: trade.paymentMethod, inline: true },
        { name: "👤 Seller", value: `<@${trade.sellerId}>`, inline: true },
        { name: "👤 Buyer", value: `<@${traderId}>`, inline: true },
        { name: "📬 Send Payment To", value: `\`\`\`${walletAddress}\`\`\``, inline: false },
        { name: "⚠️ Warning", value: "Do NOT send payment until instructed by staff. Screenshot your payment before sending.", inline: false }
      )
      .setTimestamp()
      .setFooter({ text: "z2u.com | Secure Middleman Trading" });

    const proofRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("submit_proof")
        .setLabel("Submit Payment Proof")
        .setEmoji("📸")
        .setStyle(ButtonStyle.Success)
    );

    if (channel) {
      await channel.send({
        content: `<@${trade.sellerId}> <@${traderId}>`,
        embeds: [embed],
        components: [proofRow],
      });
    }

    await Trade.findByIdAndUpdate(tradeId, { buyerId: traderId, amount, item, walletAddress });

    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLORS.SUCCESS).setTitle("✅ Trade configured!").setDescription("Details have been posted in the channel.")] });
  },
};
