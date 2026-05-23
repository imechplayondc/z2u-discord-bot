import { ButtonInteraction, EmbedBuilder, TextChannel } from "discord.js";
import Ticket from "../models/Ticket.js";
import GuildConfig from "../models/GuildConfig.js";
import { generateTranscript, sendTranscript } from "../utils/transcript.js";
import { COLORS } from "../utils/colors.js";
import { isStaff } from "../utils/permissions.js";
import { errorEmbed } from "../utils/embeds.js";

export default {
  customId: "ticket_close",
  async execute(interaction: ButtonInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    const channel = interaction.channel as TextChannel;
    const ticketId = interaction.customId.replace("ticket_close_", "");
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) return interaction.reply({ embeds: [errorEmbed("Error", "Ticket not found.")], ephemeral: true });

    const isOwner = ticket.userId === interaction.user.id;
    const staff = await isStaff(member);

    if (!isOwner && !staff) {
      return interaction.reply({ embeds: [errorEmbed("No Permission", "Only the ticket owner or staff can close this ticket.")], ephemeral: true });
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.WARNING)
          .setTitle("🔒 Closing Ticket")
          .setDescription("Saving transcript and closing in 5 seconds...")
          .setTimestamp(),
      ],
    });

    const config = await GuildConfig.findOne({ guildId: interaction.guildId });
    const transcriptChannelId = config?.transcriptChannel;
    if (transcriptChannelId) {
      const transcriptChannel = interaction.guild!.channels.cache.get(transcriptChannelId) as TextChannel | undefined;
      if (transcriptChannel) {
        const transcript = await generateTranscript(channel);
        await sendTranscript(transcriptChannel, channel, interaction.user.id, transcript);
      }
    }

    await Ticket.findByIdAndUpdate(ticketId, { status: "closed", closedBy: interaction.user.id, closedAt: new Date() });
    setTimeout(() => channel.delete().catch(() => {}), 5000);
  },
};
