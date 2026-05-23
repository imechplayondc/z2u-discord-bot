import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import Ticket from "../models/Ticket.js";
import GuildConfig from "../models/GuildConfig.js";
import { isStaff } from "../utils/permissions.js";
import { errorEmbed, successEmbed, z2uEmbed } from "../utils/embeds.js";
import { generateTranscript, sendTranscript } from "../utils/transcript.js";
import { COLORS } from "../utils/colors.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket management commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub
        .setName("close")
        .setDescription("Close the current ticket")
        .addStringOption((o) => o.setName("reason").setDescription("Reason for closing"))
    )
    .addSubcommand((sub) =>
      sub.setName("claim").setDescription("Claim this ticket")
    )
    .addSubcommand((sub) =>
      sub.setName("unclaim").setDescription("Unclaim this ticket")
    )
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a user to this ticket")
        .addUserOption((o) => o.setName("user").setDescription("User to add").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a user from this ticket")
        .addUserOption((o) => o.setName("user").setDescription("User to remove").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName("transcript").setDescription("Save a transcript of this ticket")
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all open tickets")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!(await isStaff(member))) {
      return interaction.reply({ embeds: [errorEmbed("No Permission", "You need staff permissions.")], ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const channel = interaction.channel as TextChannel;
    const ticket = await Ticket.findOne({ channelId: channel.id, status: { $ne: "closed" } });

    if (sub === "list") {
      const tickets = await Ticket.find({ guildId: interaction.guildId, status: { $ne: "closed" } });
      if (!tickets.length) return interaction.reply({ embeds: [errorEmbed("No Tickets", "No open tickets.")], ephemeral: true });
      const embed = z2uEmbed()
        .setTitle("🎫 Open Tickets")
        .setDescription(
          tickets.map((t, i) => `**${i + 1}.** <#${t.channelId}> — <@${t.userId}> | \`${t.panelName}\``).join("\n")
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (!ticket) {
      return interaction.reply({ embeds: [errorEmbed("Not a Ticket", "This command must be used inside a ticket channel.")], ephemeral: true });
    }

    if (sub === "close") {
      const reason = interaction.options.getString("reason") || "No reason provided";
      await interaction.reply({ embeds: [successEmbed("Closing Ticket", `Ticket will be closed in 5 seconds.\n**Reason:** ${reason}`)] });

      const config = await GuildConfig.findOne({ guildId: interaction.guildId });
      const transcriptChannelId = config?.transcriptChannel;
      if (transcriptChannelId) {
        const transcriptChannel = interaction.guild!.channels.cache.get(transcriptChannelId) as TextChannel | undefined;
        if (transcriptChannel) {
          const transcript = await generateTranscript(channel);
          await sendTranscript(transcriptChannel, channel, interaction.user.id, transcript);
        }
      }

      await Ticket.findByIdAndUpdate(ticket._id, {
        status: "closed",
        closedBy: interaction.user.id,
        closedAt: new Date(),
      });

      setTimeout(() => channel.delete().catch(() => {}), 5000);
      return;
    }

    if (sub === "claim") {
      await Ticket.findByIdAndUpdate(ticket._id, { status: "claimed", claimedBy: interaction.user.id });
      const embed = successEmbed("Ticket Claimed", `This ticket has been claimed by <@${interaction.user.id}>.`);
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === "unclaim") {
      await Ticket.findByIdAndUpdate(ticket._id, { status: "open", claimedBy: undefined });
      return interaction.reply({ embeds: [successEmbed("Ticket Unclaimed", "This ticket is now unclaimed.")] });
    }

    if (sub === "add") {
      const target = interaction.options.getUser("user", true);
      await channel.permissionOverwrites.edit(target.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true,
      });
      return interaction.reply({ embeds: [successEmbed("User Added", `<@${target.id}> has been added to the ticket.`)] });
    }

    if (sub === "remove") {
      const target = interaction.options.getUser("user", true);
      await channel.permissionOverwrites.delete(target.id);
      return interaction.reply({ embeds: [successEmbed("User Removed", `<@${target.id}> has been removed from the ticket.`)] });
    }

    if (sub === "transcript") {
      await interaction.deferReply({ ephemeral: true });
      const config = await GuildConfig.findOne({ guildId: interaction.guildId });
      const transcriptChannelId = config?.transcriptChannel;
      if (!transcriptChannelId) return interaction.editReply({ embeds: [errorEmbed("No Transcript Channel", "No transcript channel configured.")] });
      const transcriptChannel = interaction.guild!.channels.cache.get(transcriptChannelId) as TextChannel | undefined;
      if (!transcriptChannel) return interaction.editReply({ embeds: [errorEmbed("Error", "Transcript channel not found.")] });
      const transcript = await generateTranscript(channel);
      await sendTranscript(transcriptChannel, channel, interaction.user.id, transcript);
      return interaction.editReply({ embeds: [successEmbed("Transcript Saved", `Transcript sent to <#${transcriptChannelId}>.`)] });
    }
  },
};
