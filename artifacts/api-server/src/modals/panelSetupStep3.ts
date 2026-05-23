import {
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from "discord.js";
import Panel from "../models/Panel.js";
import { parseColor } from "../utils/colors.js";
import { successEmbed, errorEmbed } from "../utils/embeds.js";

export default {
  customId: "panel_setup_step3",
  async execute(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ ephemeral: true });

    // Parse customId: panel_setup_step3_TYPE_NAME_CATID_ROLEID_TRANSCRIPTID_SENDCH_LOGCH_IMAGE
    const raw = interaction.customId.replace("panel_setup_step3_", "");
    const parts = raw.split("_");

    const type = parts[0];
    const name = parts[1];
    const categoryId = parts[2];
    const roleId = parts[3];
    const transcriptChannelId = parts[4];
    const sendChannelId = parts[5];
    const logChannel = parts[6] === "none" ? undefined : parts[6];
    const image = parts[7] === "none" ? undefined : parts[7];

    const title = interaction.fields.getTextInputValue("title");
    const description = interaction.fields.getTextInputValue("description");
    const footer = interaction.fields.getTextInputValue("footer") || "Click the button below to open a ticket";
    const colorHex = interaction.fields.getTextInputValue("color") || "#00b4d8";
    const buttonRaw = interaction.fields.getTextInputValue("button");

    const buttonParts = buttonRaw.split("|").map((s) => s.trim());
    const buttonName = buttonParts[0] || "Open Ticket";
    const buttonEmoji = buttonParts[1] || "🎫";
    const customQuestions = buttonParts.slice(2).filter(Boolean);

    const sendChannel = interaction.guild!.channels.cache.get(sendChannelId) as TextChannel | undefined;
    if (!sendChannel) {
      return interaction.editReply({ embeds: [errorEmbed("Error", "Send channel not found. Check the channel ID.")] });
    }

    const color = parseColor(colorHex);
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(description)
      .setFooter({ text: footer })
      .setTimestamp();

    if (image) embed.setImage(image);

    const row = new ActionRowBuilder<ButtonBuilder>();

    if (type === "link") {
      row.addComponents(
        new ButtonBuilder()
          .setLabel(buttonName)
          .setEmoji(buttonEmoji)
          .setURL("https://z2u.com")
          .setStyle(ButtonStyle.Link)
      );
    } else {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`open_ticket_PLACEHOLDER`)
          .setLabel(buttonName)
          .setEmoji(buttonEmoji)
          .setStyle(ButtonStyle.Primary)
      );
    }

    const msg = await sendChannel.send({ embeds: [embed], components: [row] });

    const panel = await Panel.create({
      guildId: interaction.guildId,
      channelId: sendChannelId,
      messageId: msg.id,
      name,
      title,
      description,
      footerText: footer,
      buttonName,
      buttonEmoji,
      embedColor: colorHex,
      customQuestions,
      ticketCategory: categoryId,
      supportRole: roleId,
      transcriptChannel: transcriptChannelId,
      logChannel,
      panelImage: image,
      buttonType: type as any,
    });

    // Edit the message to use the real panel ID in the button customId
    if (type !== "link") {
      const updatedRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`open_ticket_${panel._id}`)
          .setLabel(buttonName)
          .setEmoji(buttonEmoji)
          .setStyle(ButtonStyle.Primary)
      );
      await msg.edit({ components: [updatedRow] });
    }

    return interaction.editReply({
      embeds: [successEmbed("Panel Created", `Panel **${name}** has been created in <#${sendChannelId}>!`)],
    });
  },
};
