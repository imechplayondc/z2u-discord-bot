import { ButtonInteraction, EmbedBuilder } from "discord.js";
import Trade from "../models/Trade.js";
import { isMiddleman } from "../utils/permissions.js";
import { errorEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

export default {
  customId: /^verify_proof_/,
  async execute(interaction: ButtonInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!(await isMiddleman(member))) {
      return interaction.reply({ embeds: [errorEmbed("No Permission", "Only middlemen can verify payments.")], ephemeral: true });
    }

    const tradeId = interaction.customId.replace("verify_proof_", "");
    await Trade.findByIdAndUpdate(tradeId, {
      status: "payment_verified",
      "paymentProof.verifiedBy": interaction.user.id,
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle("✅ Payment Verified")
      .setDescription(`Payment has been verified by <@${interaction.user.id}>.\n\nThe seller may now proceed with delivering the item. Staff will complete the trade once confirmed.`)
      .setTimestamp();

    await interaction.update({ components: [] });
    await interaction.channel?.send({ embeds: [embed] });
  },
};
