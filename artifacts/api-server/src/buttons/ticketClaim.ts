import { ButtonInteraction, EmbedBuilder } from "discord.js";
import Ticket from "../models/Ticket.js";
import { isStaff } from "../utils/permissions.js";
import { errorEmbed, successEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

export default {
  customId: "ticket_claim",
  async execute(interaction: ButtonInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!(await isStaff(member))) {
      return interaction.reply({ embeds: [errorEmbed("No Permission", "Only staff can claim tickets.")], ephemeral: true });
    }

    const ticketId = interaction.customId.replace("ticket_claim_", "");
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return interaction.reply({ embeds: [errorEmbed("Error", "Ticket not found.")], ephemeral: true });

    if (ticket.status === "claimed") {
      return interaction.reply({
        embeds: [errorEmbed("Already Claimed", `This ticket is already claimed by <@${ticket.claimedBy}>.`)],
        ephemeral: true,
      });
    }

    await Ticket.findByIdAndUpdate(ticketId, { status: "claimed", claimedBy: interaction.user.id });

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle("✋ Ticket Claimed")
      .setDescription(`This ticket has been claimed by <@${interaction.user.id}>.\nThey will assist you shortly.`)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  },
};
