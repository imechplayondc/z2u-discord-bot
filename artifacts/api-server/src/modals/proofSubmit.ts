import {
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import Trade from "../models/Trade.js";
import GuildConfig from "../models/GuildConfig.js";
import { errorEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

export default {
  customId: "proof_submit",
  async execute(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: 64 });

    const tradeId = interaction.customId.replace("proof_submit_", "");
    const trade = await Trade.findById(tradeId);

    if (!trade) {
      return interaction.editReply({ embeds: [errorEmbed("Error", "Trade not found.")] });
    }

    if (!["pending_payment", "payment_submitted"].includes(trade.status)) {
      return interaction.editReply({
        embeds: [errorEmbed("Invalid State", `This trade is currently \`${trade.status}\` and cannot accept a new payment proof.`)],
      });
    }

    const proofUrl = interaction.fields.getTextInputValue("proof_url").trim();
    const notes = interaction.fields.getTextInputValue("notes")?.trim() || "None";

    // Basic URL validation
    if (!proofUrl.startsWith("http://") && !proofUrl.startsWith("https://")) {
      return interaction.editReply({
        embeds: [errorEmbed("Invalid URL", "Please provide a valid URL starting with `https://`.")],
      });
    }

    await Trade.findByIdAndUpdate(tradeId, {
      status: "payment_submitted",
      paymentProof: { imageUrl: proofUrl, submittedAt: new Date() },
    });

    // Get middleman role for ping
    const config = await GuildConfig.findOne({ guildId: interaction.guildId });
    const mmRoleId = config?.middlemanRoles?.[0];
    const pingContent = mmRoleId ? `<@&${mmRoleId}>` : "";

    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle("📸 Payment Proof Submitted")
      .setDescription(
        `<@${interaction.user.id}> has submitted payment proof.\n` +
        `Staff must **verify** or **reject** before the trade proceeds.`
      )
      .addFields(
        { name: "Amount", value: trade.amount, inline: true },
        { name: "Method", value: trade.paymentMethod, inline: true },
        { name: "Notes", value: notes, inline: false }
      )
      .setImage(proofUrl)
      .setTimestamp()
      .setFooter({ text: "z2u.com | Awaiting staff verification" });

    const verifyRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_proof_${tradeId}`)
        .setLabel("Verify Payment")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`reject_proof_${tradeId}`)
        .setLabel("Reject Proof")
        .setEmoji("❌")
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.channel?.send({
      content: pingContent,
      embeds: [embed],
      components: [verifyRow],
    });

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle("✅ Proof Submitted")
          .setDescription("Your payment proof has been submitted and is awaiting staff verification."),
      ],
    });
  },
};
