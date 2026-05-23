import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import Trade from "../models/Trade.js";
import { isMiddleman } from "../utils/permissions.js";
import { errorEmbed, successEmbed, z2uEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

export default {
  data: new SlashCommandBuilder()
    .setName("trade")
    .setDescription("Manage trades (middleman only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub.setName("complete").setDescription("Mark a trade as complete")
    )
    .addSubcommand((sub) =>
      sub
        .setName("refund")
        .setDescription("Refund a trade")
        .addStringOption((o) => o.setName("reason").setDescription("Reason for refund").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("dispute").setDescription("Mark a trade as disputed")
    )
    .addSubcommand((sub) =>
      sub.setName("info").setDescription("View trade info for this channel")
    )
    .addSubcommand((sub) =>
      sub.setName("verify").setDescription("Verify payment proof has been confirmed")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!(await isMiddleman(member))) {
      return interaction.reply({ embeds: [errorEmbed("No Permission", "You need middleman permissions.")], ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const channel = interaction.channel as TextChannel;
    const trade = await Trade.findOne({ channelId: channel.id, status: { $nin: ["completed", "refunded"] } });

    if (sub === "info") {
      if (!trade) return interaction.reply({ embeds: [errorEmbed("No Trade", "No active trade in this channel.")], ephemeral: true });
      const embed = z2uEmbed()
        .setTitle("💼 Trade Information")
        .addFields(
          { name: "Status", value: `\`${trade.status}\``, inline: true },
          { name: "Payment Method", value: trade.paymentMethod, inline: true },
          { name: "Amount", value: trade.amount, inline: true },
          { name: "Item", value: trade.item, inline: false },
          { name: "Seller", value: `<@${trade.sellerId}>`, inline: true },
          { name: "Buyer", value: `<@${trade.buyerId}>`, inline: true },
          { name: "Wallet", value: `\`${trade.walletAddress}\``, inline: false }
        )
        .setTimestamp();
      if (trade.paymentProof?.imageUrl) {
        embed.setImage(trade.paymentProof.imageUrl);
        embed.addFields({ name: "Payment Proof", value: "✅ Submitted", inline: true });
      }
      return interaction.reply({ embeds: [embed] });
    }

    if (!trade) {
      return interaction.reply({ embeds: [errorEmbed("No Trade", "No active trade found in this channel.")], ephemeral: true });
    }

    if (sub === "verify") {
      if (!trade.paymentProof?.imageUrl) {
        return interaction.reply({ embeds: [errorEmbed("No Proof", "No payment proof has been submitted yet.")], ephemeral: true });
      }
      await Trade.findByIdAndUpdate(trade._id, {
        status: "payment_verified",
        "paymentProof.verifiedBy": interaction.user.id,
      });
      const embed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle("✅ Payment Verified")
        .setDescription(`Payment has been verified by <@${interaction.user.id}>.\n\nThe trade can now proceed. Staff may use \`/trade complete\` once the item has been delivered.`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "complete") {
      await Trade.findByIdAndUpdate(trade._id, { status: "completed", completedAt: new Date() });
      const embed = new EmbedBuilder()
        .setColor(COLORS.SUCCESS)
        .setTitle("🎉 Trade Completed")
        .setDescription(
          `Trade successfully completed by <@${interaction.user.id}>!\n\n` +
          `**Buyer:** <@${trade.buyerId}>\n**Seller:** <@${trade.sellerId}>\n**Amount:** ${trade.amount}\n**Item:** ${trade.item}\n\nThank you for using z2u AutoMM!`
        )
        .setTimestamp();
      await channel.send({ embeds: [embed] });
      return interaction.reply({ embeds: [successEmbed("Complete", "Trade has been marked as completed.")], ephemeral: true });
    }

    if (sub === "refund") {
      const reason = interaction.options.getString("reason", true);
      await Trade.findByIdAndUpdate(trade._id, { status: "refunded", refundedAt: new Date(), refundReason: reason });
      const embed = new EmbedBuilder()
        .setColor(COLORS.DANGER)
        .setTitle("💸 Trade Refunded")
        .setDescription(
          `This trade has been refunded by <@${interaction.user.id}>.\n\n**Reason:** ${reason}\n\n**Buyer:** <@${trade.buyerId}>\n**Seller:** <@${trade.sellerId}>`
        )
        .setTimestamp();
      await channel.send({ embeds: [embed] });
      return interaction.reply({ embeds: [successEmbed("Refunded", "Trade has been refunded.")], ephemeral: true });
    }

    if (sub === "dispute") {
      await Trade.findByIdAndUpdate(trade._id, { status: "disputed" });
      const embed = new EmbedBuilder()
        .setColor(COLORS.WARNING)
        .setTitle("⚠️ Trade Disputed")
        .setDescription(
          `This trade has been flagged as disputed by <@${interaction.user.id}>.\n\nA senior middleman will review this case.\n\n**Buyer:** <@${trade.buyerId}>\n**Seller:** <@${trade.sellerId}>`
        )
        .setTimestamp();
      await channel.send({ embeds: [embed] });
      return interaction.reply({ embeds: [successEmbed("Disputed", "Trade has been marked as disputed.")], ephemeral: true });
    }
  },
};
