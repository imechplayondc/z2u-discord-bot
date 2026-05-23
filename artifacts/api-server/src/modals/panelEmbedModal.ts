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

    // Check name is unique in this guild
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

    // Parse questions
    const customQuestions = questionsRaw
      ? questionsRaw.split("|").map((q) => q.trim()).filter(Boolean).slice(0, 5)
      : [];

    // Find send channel
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

    // Send with placeholder button, then update with real panel ID
    const placeholderRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("open_ticket_placeholder")
        .setLabel(buttonName)
        .setEmoji(buttonEmoji)
        .setStyle(ButtonStyle.Primary)
    );

    const msg = await sendChannel.send({ embeds: [embed], components: [placeholderRow] });

    // Save panel
    const panel = await Panel.create({
      guildId: interaction.guildId,
      channelId: session.sendChannelId,
      messageId: msg.id,
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

    // Update message with real panel ID
    const realRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`open_ticket_${panel._id}`)
        .setLabel(buttonName)
        .setEmoji(buttonEmoji)
        .setStyle(ButtonStyle.Primary)
    );
    await msg.edit({ components: [realRow] });

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
