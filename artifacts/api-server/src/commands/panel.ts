import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
} from "discord.js";
import Panel from "../models/Panel.js";
import PanelSession from "../models/PanelSession.js";

import { isAdmin } from "../utils/permissions.js";
import { errorEmbed, successEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

export default {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Manage ticket panels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Create a new panel")
        .addStringOption((o) =>
          o.setName("type").setDescription("Panel button type").setRequired(true)
            .addChoices(
              { name: "🎫 Ticket", value: "ticket" },
              { name: "🔄 AutoMM", value: "automm" },
              { name: "📝 Application", value: "application" },
              { name: "✅ Verification", value: "verification" },
              { name: "🏷️ Role Button", value: "role" },
              { name: "💬 Custom Message", value: "message" },
              { name: "🔗 Link Button", value: "link" },
              { name: "🎉 Giveaway Entry", value: "giveaway" }
            )
        )
        .addChannelOption((o) =>
          o.setName("category").setDescription("Ticket category channel").setRequired(true)
            .addChannelTypes(ChannelType.GuildCategory)
        )
        .addRoleOption((o) =>
          o.setName("supportrole").setDescription("Support/staff role").setRequired(true)
        )
        .addChannelOption((o) =>
          o.setName("transcriptchannel").setDescription("Transcript save channel").setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((o) =>
          o.setName("sendchannel").setDescription("Channel to send the panel to").setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((o) =>
          o.setName("logchannel").setDescription("Log channel (optional)").setRequired(false)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption((o) =>
          o.setName("image").setDescription("Panel embed image URL (optional)").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete an existing panel")
        .addStringOption((o) =>
          o.setName("name").setDescription("Panel name to delete").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all panels in this server")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!(await isAdmin(member))) {
      return interaction.reply({ embeds: [errorEmbed("No Permission", "You need admin permissions.")], flags: 64 });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "list") {
      const panels = await Panel.find({ guildId: interaction.guildId });
      if (!panels.length) {
        return interaction.reply({ embeds: [errorEmbed("No Panels", "No panels configured yet.")], flags: 64 });
      }
      const embed = new EmbedBuilder()
        .setColor(COLORS.Z2U)
        .setTitle("📋 Server Panels")
        .setDescription(
          panels.map((p, i) => `**${i + 1}.** \`${p.name}\` — ${p.buttonType} | <#${p.channelId}>`).join("\n")
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed], flags: 64 });
    }

    if (sub === "delete") {
      const name = interaction.options.getString("name", true);
      const panel = await Panel.findOneAndDelete({ guildId: interaction.guildId, name });
      if (!panel) {
        return interaction.reply({ embeds: [errorEmbed("Not Found", `No panel named \`${name}\`.`)], flags: 64 });
      }
      return interaction.reply({ embeds: [successEmbed("Deleted", `Panel \`${name}\` deleted.`)], flags: 64 });
    }

    // /panel create — collect all config from slash options, then show ONE modal for embed design
    const type = interaction.options.getString("type", true);
    const category = interaction.options.getChannel("category", true);
    const supportRole = interaction.options.getRole("supportrole", true);
    const transcriptChannel = interaction.options.getChannel("transcriptchannel", true);
    const sendChannel = interaction.options.getChannel("sendchannel", true);
    const logChannel = interaction.options.getChannel("logchannel", false);
    const image = interaction.options.getString("image", false);

    // Store config in a session so the modal handler can access it
    const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    await PanelSession.create({
      sessionId,
      guildId: interaction.guildId,
      userId: interaction.user.id,
      type,
      name: sessionId, // placeholder, overwritten by modal
      categoryId: category.id,
      roleId: supportRole.id,
      transcriptChannelId: transcriptChannel.id,
      sendChannelId: sendChannel.id,
      logChannelId: logChannel?.id,
      imageUrl: image ?? undefined,
    });

    // Show the embed design modal
    const modal = new ModalBuilder()
      .setCustomId(`panel_embed_modal_${sessionId}`)
      .setTitle("Panel Design");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("name")
          .setLabel("Panel name (unique ID, e.g. support)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("general-support")
          .setMaxLength(30)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("title")
          .setLabel("Embed title")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("🎫 Support Tickets")
          .setMaxLength(256)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Embed description")
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(2000)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("button")
          .setLabel("Button label | emoji | color (e.g. #00b4d8)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("Open Ticket|🎫|#00b4d8")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("questions")
          .setLabel("Custom questions separated by |  (optional)")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("What is your issue?|Your username?|Order ID?")
          .setRequired(false)
      )
    );

    await interaction.showModal(modal);
  },
};
