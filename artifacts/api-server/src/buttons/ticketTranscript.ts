import { ButtonInteraction, TextChannel } from "discord.js";
import Ticket from "../models/Ticket.js";
import GuildConfig from "../models/GuildConfig.js";
import { generateTranscript, sendTranscript } from "../utils/transcript.js";
import { isStaff } from "../utils/permissions.js";
import { errorEmbed, successEmbed } from "../utils/embeds.js";

export default {
  customId: "ticket_transcript",
  async execute(interaction: ButtonInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!(await isStaff(member))) {
      return interaction.reply({ embeds: [errorEmbed("No Permission", "Only staff can save transcripts.")], ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const config = await GuildConfig.findOne({ guildId: interaction.guildId });
    const transcriptChannelId = config?.transcriptChannel;
    if (!transcriptChannelId) {
      return interaction.editReply({ embeds: [errorEmbed("No Channel", "No transcript channel configured. Use `/config transcriptchannel`.")] });
    }

    const transcriptChannel = interaction.guild!.channels.cache.get(transcriptChannelId) as TextChannel | undefined;
    if (!transcriptChannel) {
      return interaction.editReply({ embeds: [errorEmbed("Error", "Transcript channel not found.")] });
    }

    const channel = interaction.channel as TextChannel;
    const transcript = await generateTranscript(channel);
    await sendTranscript(transcriptChannel, channel, interaction.user.id, transcript);

    return interaction.editReply({ embeds: [successEmbed("Transcript Saved", `Transcript sent to <#${transcriptChannelId}>.`)] });
  },
};
