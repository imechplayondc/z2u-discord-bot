import {
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from "discord.js";
import { parseColor, COLORS } from "../utils/colors.js";
import { errorEmbed } from "../utils/embeds.js";
import Panel from "../models/Panel.js";

export default {
  customId: "embed_create",
  async execute(interaction: ModalSubmitInteraction) {
    const title = interaction.fields.getTextInputValue("title")?.trim();
    const description = interaction.fields.getTextInputValue("description");
    const colorHex = interaction.fields.getTextInputValue("color")?.trim() || "#00b4d8";
    const image = interaction.fields.getTextInputValue("image")?.trim();
    const buttonsRaw = interaction.fields.getTextInputValue("buttons")?.trim();

    const color = parseColor(colorHex);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: "z2u.com" });

    if (title) embed.setTitle(title);
    if (image) embed.setImage(image);

    const components: ActionRowBuilder<ButtonBuilder>[] = [];

    if (buttonsRaw) {
      const btnDefs = buttonsRaw.split("|").map((s) => s.trim()).filter(Boolean);
      const row = new ActionRowBuilder<ButtonBuilder>();

      for (const def of btnDefs.slice(0, 5)) {
        const [label, action, value] = def.split(":").map((s) => s.trim());
        if (!label || !action || !value) continue;

        if (action === "link") {
          row.addComponents(
            new ButtonBuilder()
              .setLabel(label)
              .setURL(value)
              .setStyle(ButtonStyle.Link)
          );
        } else if (action === "ticket") {
          const panel = await Panel.findOne({ guildId: interaction.guildId, name: value });
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`open_ticket_${panel?._id || value}`)
              .setLabel(label)
              .setStyle(ButtonStyle.Primary)
          );
        } else if (action === "role") {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`give_role_${value}`)
              .setLabel(label)
              .setStyle(ButtonStyle.Secondary)
          );
        } else if (action === "message") {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`send_msg_${Buffer.from(value).toString("base64").slice(0, 50)}`)
              .setLabel(label)
              .setStyle(ButtonStyle.Secondary)
          );
        }
      }

      if (row.components.length > 0) components.push(row);
    }

    await (interaction.channel as TextChannel).send({ embeds: [embed], components });
    await interaction.reply({ embeds: [new EmbedBuilder().setColor(COLORS.SUCCESS).setTitle("✅ Embed Sent").setDescription("Your custom embed has been sent.")], ephemeral: true });
  },
};
