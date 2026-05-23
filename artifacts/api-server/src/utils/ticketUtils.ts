import {
  Guild,
  TextChannel,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CategoryChannel,
} from "discord.js";
import Ticket from "../models/Ticket.js";
import Cooldown from "../models/Cooldown.js";
import { IPanel } from "../models/Panel.js";
import { COLORS, parseColor } from "./colors.js";
import GuildConfig from "../models/GuildConfig.js";

export async function checkCooldown(userId: string, guildId: string, panelId: string): Promise<boolean> {
  const existing = await Cooldown.findOne({ userId, guildId, panelId });
  return !!existing;
}

export async function setCooldown(
  userId: string,
  guildId: string,
  panelId: string,
  minutes: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  await Cooldown.findOneAndUpdate(
    { userId, guildId, panelId },
    { expiresAt },
    { upsert: true }
  );
}

export async function createTicketChannel(
  guild: Guild,
  panel: IPanel,
  userId: string,
  answers: { question: string; answer: string }[]
): Promise<TextChannel> {
  const member = await guild.members.fetch(userId);
  const username = member.user.username.toLowerCase().replace(/[^a-z0-9]/g, "");
  const ticketCount = await Ticket.countDocuments({ guildId: guild.id });
  const channelName = `ticket-${username}-${ticketCount + 1}`;

  const category = guild.channels.cache.get(panel.ticketCategory) as CategoryChannel | undefined;

  const channel = (await guild.channels.create({
    name: channelName,
    type: 0,
    parent: category?.id,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: userId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
        ],
      },
      {
        id: panel.supportRole,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ManageMessages,
        ],
      },
    ],
  })) as TextChannel;

  const ticket = await Ticket.create({
    guildId: guild.id,
    channelId: channel.id,
    userId,
    panelId: String(panel._id),
    panelName: panel.name,
    status: "open",
    answers,
  });

  const color = parseColor(panel.embedColor);
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${panel.buttonEmoji} ${panel.name} — Ticket`)
    .setDescription(
      `Hello <@${userId}>, thank you for opening a ticket.\nOur support team will be with you shortly.\n\n${answers.length > 0 ? "**Your Answers:**" : ""}`
    )
    .setTimestamp()
    .setFooter({ text: "z2u.com | Trusted Trading" });

  if (answers.length > 0) {
    for (const a of answers) {
      embed.addFields({ name: a.question, value: a.answer || "No answer", inline: false });
    }
  }

  const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_close_${ticket._id}`)
      .setLabel("Close Ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`ticket_claim_${ticket._id}`)
      .setLabel("Claim Ticket")
      .setEmoji("✋")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`ticket_transcript_${ticket._id}`)
      .setLabel("Save Transcript")
      .setEmoji("📋")
      .setStyle(ButtonStyle.Secondary)
  );

  await channel.send({
    content: `<@${userId}> | <@&${panel.supportRole}>`,
    embeds: [embed],
    components: [controlRow],
  });

  const config = await GuildConfig.findOne({ guildId: guild.id });
  const logChannelId = panel.logChannel || config?.logChannel;
  if (logChannelId) {
    const logChannel = guild.channels.cache.get(logChannelId) as TextChannel | undefined;
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor(COLORS.Z2U)
        .setTitle("📬 New Ticket Opened")
        .addFields(
          { name: "User", value: `<@${userId}>`, inline: true },
          { name: "Panel", value: panel.name, inline: true },
          { name: "Channel", value: `<#${channel.id}>`, inline: true }
        )
        .setTimestamp();
      await logChannel.send({ embeds: [logEmbed] });
    }
  }

  return channel;
}
