import { ModalSubmitInteraction, EmbedBuilder, TextChannel } from "discord.js";
import Panel from "../models/Panel.js";
import GuildConfig from "../models/GuildConfig.js";
import { checkCooldown, setCooldown, createTicketChannel } from "../utils/ticketUtils.js";
import { errorEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

export default {
  customId: "ticket_questions",
  async execute(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const panelId = interaction.customId.replace("ticket_questions_", "");
    const panel = await Panel.findById(panelId);
    if (!panel) return interaction.editReply({ embeds: [errorEmbed("Error", "Panel not found.")] });

    const config = await GuildConfig.findOne({ guildId: interaction.guildId });
    const cooldownMins = config?.ticketCooldown ?? 0;
    if (cooldownMins > 0) {
      const onCooldown = await checkCooldown(interaction.user.id, interaction.guildId!, panelId);
      if (onCooldown) {
        return interaction.editReply({ embeds: [errorEmbed("Cooldown", "You must wait before opening another ticket.")] });
      }
    }

    const answers: { question: string; answer: string }[] = [];
    for (const q of panel.customQuestions) {
      const key = `q_${q.slice(0, 40).replace(/\s+/g, "_")}`;
      try {
        const answer = interaction.fields.getTextInputValue(key);
        answers.push({ question: q, answer: answer || "No answer" });
      } catch {
        answers.push({ question: q, answer: "No answer" });
      }
    }

    const channel = await createTicketChannel(interaction.guild!, panel, interaction.user.id, answers);

    if (cooldownMins > 0) {
      await setCooldown(interaction.user.id, interaction.guildId!, panelId, cooldownMins);
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
