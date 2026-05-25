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
    const rawId = interaction.customId.replace("ticket_close_", "");

    // Find ticket by its own _id first; if that misses (e.g. AutoMM buttons
    // that mistakenly store a trade _id), fall back to the current channel
    let ticket = await Ticket.findById(rawId).catch(() => null);
    if (!ticket) {
      ticket = await Ticket.findOne({
        channelId: interaction.channelId,
        status: { $ne: "closed" },
      });
    }

    if (!ticket) {
      return interaction.reply({
        embeds: [errorEmbed("Error", "Ticket record not found. The channel may have already been closed.")],
        flags: 64,
      });
    }

    if (ticket.status === "closed") {
      return interaction.reply({
        embeds: [errorEmbed("Already Closed", "This ticket is already closed.")],
        flags: 64,
      });
    }

    const isOwner = ticket.userId === interaction.user.id;
    const staff = await isStaff(member);

    if (!isOwner && !staff) {
      return interaction.reply({
        embeds: [errorEmbed("No Permission", "Only the ticket owner or staff can close this ticket.")],
        flags: 64,
      });
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

    // Save transcript if configured
    const config = await GuildConfig.findOne({ guildId: interaction.guildId });
    const transcriptChannelId = config?.transcriptChannel;
    if (transcriptChannelId) {
      const transcriptChannel = interaction.guild!.channels.cache.get(transcriptChannelId) as TextChannel | undefined;
      if (transcriptChannel) {
        try {
          const transcript = await generateTranscript(channel);
          await sendTranscript(transcriptChannel, channel, interaction.user.id, transcript);
        } catch {
          // Don't let transcript errors block the close
        }
      }
    }

    // Mark closed BEFORE deleting the channel
    await Ticket.findByIdAndUpdate(ticket._id, {
      status: "closed",
      closedBy: interaction.user.id,
      closedAt: new Date(),
    });

    setTimeout(() => channel.delete().catch(() => {}), 5000);
  },
};
