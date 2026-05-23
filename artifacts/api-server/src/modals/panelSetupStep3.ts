import {
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from "discord.js";
import Panel from "../models/Panel.js";
import PanelSession from "../models/PanelSession.js";
import { parseColor } from "../utils/colors.js";
import { successEmbed, errorEmbed } from "../utils/embeds.js";

export default {
  customId: "panel_setup_step3",
  async execute(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: 64 });

    const sessionId = interaction.customId.replace("panel_setup_step3_", "");
    const session = await PanelSession.findOne({ sessionId, guildId: interaction.guildId });

    if (!session) {
      return interaction.editReply({
        embeds: [errorEmbed("Session Expired", "Your panel setup session expired (10 min limit). Please run `/panel create` again.")],
      });
    }

    const title = interaction.fields.getTextInputValue("title");
    const description = interaction.fields.getTextInputValue("description");
    const footerColor = interaction.fields.getTextInputValue("footer_color")?.trim() || "";
    const buttonRaw = interaction.fields.getTextInputValue("button");
    const questionsRaw = interaction.fields.getTextInputValue("questions")?.trim() || "";

    // Parse footer | color
    const fcParts = footerColor.split("|").map((s) => s.trim());
    const footerText = fcParts[0] || "Click the button below to open a ticket";
    const colorHex = fcParts[1]?.startsWith("#") ? fcParts[1] : (fcParts[0]?.startsWith("#") ? fcParts[0] : "#00b4d8");

    // Parse button label | emoji
    const btnParts = buttonRaw.split("|").map((s) => s.trim());
    const buttonName = btnParts[0] || "Open Ticket";
    const buttonEmoji = btnParts[1] || "🎫";

    // Parse custom questions
    const customQuestions = questionsRaw
      ? questionsRaw.split("|").map((q) => q.trim()).filter(Boolean)
      : [];

    // Validate send channel
    const sendChannel = interaction.guild!.channels.cache.get(session.sendChannelId) as TextChannel | undefined;
    if (!sendChannel) {
      await PanelSession.deleteOne({ sessionId });
      return interaction.editReply({
        embeds: [errorEmbed("Channel Not Found", `Could not find channel ID \`${session.sendChannelId}\`. Make sure the bot has access to it.`)],
      });
    }

    // Build the panel embed
    const color = parseColor(colorHex);
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(description)
      .setFooter({ text: footerText })
      .setTimestamp();

    if (session.imageUrl) embed.setImage(session.imageUrl);

    // Send panel message with a placeholder button first
    const placeholderRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("open_ticket_placeholder")
        .setLabel(buttonName)
        .setEmoji(buttonEmoji)
        .setStyle(ButtonStyle.Primary)
    );

    const msg = await sendChannel.send({ embeds: [embed], components: [placeholderRow] });

    // Save panel to DB
    const panel = await Panel.create({
      guildId: interaction.guildId,
      channelId: session.sendChannelId,
      messageId: msg.id,
      name: session.name,
      title,
      description,
      footerText,
      buttonName,
      buttonEmoji,
      embedColor: colorHex,
      customQuestions,
      ticketCategory: session.categoryId,
      supportRole: session.roleId,
      transcriptChannel: session.transcriptChannelId,
      logChannel: session.logChannelId,
      panelImage: session.imageUrl,
      buttonType: session.type as any,
    });

    // Edit message with real panel ID in button customId
    const realRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`open_ticket_${panel._id}`)
        .setLabel(buttonName)
        .setEmoji(buttonEmoji)
        .setStyle(ButtonStyle.Primary)
    );
    await msg.edit({ components: [realRow] });

    // Clean up session
    await PanelSession.deleteOne({ sessionId });

    return interaction.editReply({
      embeds: [
        successEmbed(
          "Panel Created!",
          `**${session.name}** panel is live in <#${session.sendChannelId}>!\n\n` +
          `**Type:** ${session.type}\n` +
          `**Button:** ${buttonEmoji} ${buttonName}\n` +
          `**Questions:** ${customQuestions.length > 0 ? customQuestions.join(", ") : "None"}`
        ),
      ],
    });
  },
};
