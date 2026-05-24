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
import { botLog } from "../utils/logger.js";

export default {
  customId: "panel_embed_modal",
  async execute(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: 64 });

    const sessionId = interaction.customId.replace("panel_embed_modal_", "");
    const session = await PanelSession.findOne({ sessionId, guildId: interaction.guildId });

    if (!session) {
      return interaction.editReply({
        embeds: [errorEmbed("Session Expired", "Setup session expired (10 min limit). Run `/panel create` again.")],
      });
    }

    const name = interaction.fields.getTextInputValue("name")
      .toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 30);
    const title = interaction.fields.getTextInputValue("title");
    const description = interaction.fields.getTextInputValue("description");
    const buttonRaw = interaction.fields.getTextInputValue("button").trim();
    const questionsRaw = interaction.fields.getTextInputValue("questions")?.trim() || "";

    if (!name) {
      await PanelSession.deleteOne({ sessionId });
      return interaction.editReply({
        embeds: [errorEmbed("Invalid Name", "Panel name must contain at least one letter or number.")],
      });
    }

    // Check name uniqueness
    const existing = await Panel.findOne({ guildId: interaction.guildId, name });
    if (existing) {
      await PanelSession.deleteOne({ sessionId });
      return interaction.editReply({
        embeds: [errorEmbed("Name Taken", `A panel named \`${name}\` already exists. Delete it first or choose a different name.`)],
      });
    }

    // Parse button: label | emoji | #color
    const btnParts = buttonRaw.split("|").map((s) => s.trim());
    const buttonName = btnParts[0] || "Open Ticket";
    const buttonEmoji = btnParts[1] || "🎫";
    const colorHex = (btnParts[2] || "#00b4d8").startsWith("#") ? (btnParts[2] || "#00b4d8") : "#00b4d8";

    // Parse custom questions
    const customQuestions = questionsRaw
      ? questionsRaw.split("|").map((q) => q.trim()).filter(Boolean).slice(0, 5)
      : [];

    const sendChannel = interaction.guild!.channels.cache.get(session.sendChannelId) as TextChannel | undefined;
    if (!sendChannel) {
      await PanelSession.deleteOne({ sessionId });
      return interaction.editReply({
        embeds: [errorEmbed("Channel Not Found", `Cannot find channel <#${session.sendChannelId}>. Make sure the bot has access.`)],
      });
    }

    const color = parseColor(colorHex);
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(description)
      .setFooter({ text: "z2u.com | Click the button below to get started" })
      .setTimestamp();

    if (session.imageUrl) embed.setImage(session.imageUrl);

    // Save the panel FIRST so we have the real ID before sending the message
    const panel = await Panel.create({
      guildId: interaction.guildId,
      channelId: session.sendChannelId,
      messageId: "pending",
      name,
      title,
      description,
      footerText: "z2u.com | Click the button below to get started",
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

    // Send message with the real panel ID already in the button — no placeholder needed
    const panelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`open_ticket_${panel._id}`)
        .setLabel(buttonName)
        .setEmoji(buttonEmoji)
        .setStyle(ButtonStyle.Primary)
    );

    let msg;
    try {
      msg = await sendChannel.send({ embeds: [embed], components: [panelRow] });
    } catch (err) {
      // If send fails, clean up the panel record so the name doesn't stay taken
      await Panel.findByIdAndDelete(panel._id);
      await PanelSession.deleteOne({ sessionId });
      botLog("error", "Failed to send panel message:", err);
      return interaction.editReply({
        embeds: [errorEmbed("Send Failed", "Could not send the panel to the channel. Check that the bot has permission to send messages there.")],
      });
    }

    // Update panel with the real message ID
    await Panel.findByIdAndUpdate(panel._id, { messageId: msg.id });

    await PanelSession.deleteOne({ sessionId });

    return interaction.editReply({
      embeds: [
        successEmbed(
          "Panel Created!",
          `**\`${name}\`** panel is live in <#${session.sendChannelId}>!\n\n` +
          `**Type:** ${session.type}\n` +
          `**Button:** ${buttonEmoji} ${buttonName}\n` +
          `**Color:** ${colorHex}\n` +
          `**Custom Questions:** ${customQuestions.length > 0 ? customQuestions.join(" | ") : "None"}`
        ),
      ],
    });
  },
};
