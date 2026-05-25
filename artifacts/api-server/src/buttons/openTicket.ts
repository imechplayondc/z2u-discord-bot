import {
  ButtonInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} from "discord.js";
import Panel from "../models/Panel.js";
import GuildConfig from "../models/GuildConfig.js";
import Ticket from "../models/Ticket.js";
import { checkCooldown, setCooldown, createTicketChannel } from "../utils/ticketUtils.js";
import { errorEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";
import { botLog } from "../utils/logger.js";

function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

export default {
  customId: "open_ticket",
  async execute(interaction: ButtonInteraction) {
    try {
      const panelId = interaction.customId.replace("open_ticket_", "");

      if (!panelId || panelId === "placeholder" || !isValidObjectId(panelId)) {
        return interaction.reply({
          embeds: [errorEmbed("Panel Error", "This panel button is outdated. Ask an admin to recreate the panel with `/panel create`.")],
          flags: 64,
        });
      }

      let panel;
      try {
        panel = await Panel.findById(panelId);
      } catch {
        return interaction.reply({
          embeds: [errorEmbed("Database Error", "Could not load panel data. Please try again in a moment.")],
          flags: 64,
        });
      }

      if (!panel) {
        return interaction.reply({
          embeds: [errorEmbed("Panel Not Found", "This panel no longer exists. Ask an admin to recreate it.")],
          flags: 64,
        });
      }

      // Check for existing open ticket for this user on this panel
      const existingTicket = await Ticket.findOne({
        guildId: interaction.guildId,
        userId: interaction.user.id,
        panelId: String(panel._id),
        status: { $ne: "closed" },
      });

      if (existingTicket) {
        // Verify the channel still exists — if not, auto-close the stale record
        const channelExists = interaction.guild!.channels.cache.has(existingTicket.channelId);
        if (!channelExists) {
          // Channel was deleted without clicking Close — clean up and allow a new ticket
          await Ticket.findByIdAndUpdate(existingTicket._id, {
            status: "closed",
            closedAt: new Date(),
            closedBy: "auto-cleanup",
          });
        } else {
          return interaction.reply({
            embeds: [errorEmbed("Already Open", `You already have an open ticket: <#${existingTicket.channelId}>`)],
            flags: 64,
          });
        }
      }

      // Cooldown check
      const config = await GuildConfig.findOne({ guildId: interaction.guildId });
      const cooldownMins = config?.ticketCooldown ?? 0;
      if (cooldownMins > 0) {
        const onCooldown = await checkCooldown(interaction.user.id, interaction.guildId!, String(panel._id));
        if (onCooldown) {
          return interaction.reply({
            embeds: [errorEmbed("Cooldown", "You must wait before opening another ticket in this panel.")],
            flags: 64,
          });
        }
      }

      // If panel has custom questions, show modal first
      if (panel.customQuestions && panel.customQuestions.length > 0) {
        const modal = new ModalBuilder()
          .setCustomId(`ticket_questions_${panel._id}`)
          .setTitle(panel.title.slice(0, 45));

        for (const q of panel.customQuestions.slice(0, 5)) {
          modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(
              new TextInputBuilder()
                .setCustomId(`q_${q.slice(0, 40).replace(/\s+/g, "_")}`)
                .setLabel(q.slice(0, 45))
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
            )
          );
        }

        return interaction.showModal(modal);
      }

      // No questions — create ticket directly
      await interaction.deferReply({ flags: 64 });

      let channel;
      try {
        channel = await createTicketChannel(interaction.guild!, panel, interaction.user.id, []);
      } catch (err) {
        botLog("error", "createTicketChannel failed:", err);
        const msg = err instanceof Error ? err.message : "Unknown error";
        return interaction.editReply({
          embeds: [errorEmbed("Ticket Creation Failed", `Could not create the ticket channel. Make sure the bot has **Manage Channels** permission in the ticket category.\n\`${msg.slice(0, 200)}\``)],
        });
      }

      if (cooldownMins > 0) {
        await setCooldown(interaction.user.id, interaction.guildId!, String(panel._id), cooldownMins);
      }

      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.SUCCESS)
            .setTitle("✅ Ticket Created")
            .setDescription(`Your ticket has been opened: <#${channel.id}>`)
            .setTimestamp(),
        ],
      });
    } catch (err) {
      botLog("error", "openTicket unexpected error:", err);
      const reply = { embeds: [errorEmbed("Error", "An unexpected error occurred. Please try again or contact an admin.")], flags: 64 as const };
      if (interaction.replied || interaction.deferred) return interaction.editReply(reply);
      return interaction.reply(reply);
    }
  },
};
