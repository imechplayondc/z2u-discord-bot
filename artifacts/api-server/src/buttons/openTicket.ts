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

export default {
  customId: "open_ticket",
  async execute(interaction: ButtonInteraction) {
    const panelId = interaction.customId.replace("open_ticket_", "");
    const panel = await Panel.findById(panelId);

    if (!panel) {
      return interaction.reply({ embeds: [errorEmbed("Error", "Panel not found or deleted.")], ephemeral: true });
    }

    // Anti-spam: check if user already has an open ticket for this panel
    const existingTicket = await Ticket.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      panelId: String(panel._id),
      status: { $ne: "closed" },
    });

    if (existingTicket) {
      return interaction.reply({
        embeds: [errorEmbed("Already Open", `You already have an open ticket: <#${existingTicket.channelId}>`)],
        ephemeral: true,
      });
    }

    // Cooldown check
    const config = await GuildConfig.findOne({ guildId: interaction.guildId });
    const cooldownMins = config?.ticketCooldown ?? 0;
    if (cooldownMins > 0) {
      const onCooldown = await checkCooldown(interaction.user.id, interaction.guildId!, String(panel._id));
      if (onCooldown) {
        return interaction.reply({
          embeds: [errorEmbed("Cooldown", `You must wait before opening another ticket in this panel.`)],
          ephemeral: true,
        });
      }
    }

    // If panel has custom questions, show modal
    if (panel.customQuestions && panel.customQuestions.length > 0) {
      const modal = new ModalBuilder()
        .setCustomId(`ticket_questions_${panel._id}`)
        .setTitle(panel.title.slice(0, 45));

      const questions = panel.customQuestions.slice(0, 5);
      for (const q of questions) {
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
    await interaction.deferReply({ ephemeral: true });

    const channel = await createTicketChannel(interaction.guild!, panel, interaction.user.id, []);

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
  },
};
