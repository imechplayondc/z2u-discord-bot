import { ButtonInteraction, EmbedBuilder } from "discord.js";
import Trade from "../models/Trade.js";
import { isMiddleman } from "../utils/permissions.js";
import { errorEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

export default {
  customId: /^reject_proof_/,
  async execute(interaction: ButtonInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!(await isMiddleman(member))) {
      return interaction.reply({ embeds: [errorEmbed("No Permission", "Only middlemen can reject payments.")], ephemeral: true });
    }

    const tradeId = interaction.customId.replace("reject_proof_", "");
    await Trade.findByIdAndUpdate(tradeId, { status: "pending_payment" });

    const embed = new EmbedBuilder()
      .setColor(COLORS.DANGER)
      .setTitle("❌ Payment Proof Rejected")
      .setDescription(`Payment proof was rejected by <@${interaction.user.id}>.\n\nPlease submit a clearer screenshot of the payment using the **Submit Payment Proof** button.`)
      .setTimestamp();

    await interaction.update({ components: [] });
    await interaction.channel?.send({ embeds: [embed] });
  },
};
