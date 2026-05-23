import { ModalSubmitInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import Trade from "../models/Trade.js";
import { errorEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

export default {
  customId: "proof_submit",
  async execute(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const tradeId = interaction.customId.replace("proof_submit_", "");
    const trade = await Trade.findById(tradeId);
    if (!trade) return interaction.editReply({ embeds: [errorEmbed("Error", "Trade not found.")] });

    const proofUrl = interaction.fields.getTextInputValue("proof_url").trim();
    const notes = interaction.fields.getTextInputValue("notes")?.trim() || "None";

    await Trade.findByIdAndUpdate(tradeId, {
      status: "payment_submitted",
      paymentProof: { imageUrl: proofUrl, submittedAt: new Date() },
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.WARNING)
      .setTitle("📸 Payment Proof Submitted")
      .setDescription(`<@${interaction.user.id}> has submitted payment proof. Staff must verify before the trade proceeds.`)
      .addFields(
        { name: "Notes", value: notes, inline: false },
        { name: "Amount", value: trade.amount, inline: true },
        { name: "Method", value: trade.paymentMethod, inline: true }
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
      content: `<@&${(await import("../models/GuildConfig.js")).default.findOne({ guildId: interaction.guildId }).then((c: any) => c?.middlemanRoles?.[0] || "")}>`,
      embeds: [embed],
      components: [verifyRow],
    });

    return interaction.editReply({
      embeds: [new EmbedBuilder().setColor(COLORS.SUCCESS).setTitle("✅ Proof Submitted").setDescription("Your payment proof has been submitted and is awaiting staff verification.")],
    });
  },
};
