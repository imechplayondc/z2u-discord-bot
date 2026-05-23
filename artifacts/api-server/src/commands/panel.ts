import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  TextChannel,
  ChannelType,
} from "discord.js";
import Panel from "../models/Panel.js";
import { parseColor } from "../utils/colors.js";
import { errorEmbed, successEmbed } from "../utils/embeds.js";
import { isAdmin } from "../utils/permissions.js";

export default {
  data: new SlashCommandBuilder()
    .setName("panel")
    .setDescription("Manage ticket panels")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub.setName("create").setDescription("Create a new ticket panel")
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
      return interaction.reply({ embeds: [errorEmbed("No Permission", "You need admin permissions.")], ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === "list") {
      const panels = await Panel.find({ guildId: interaction.guildId });
      if (!panels.length) return interaction.reply({ embeds: [errorEmbed("No Panels", "No panels configured.")], ephemeral: true });
      const embed = new EmbedBuilder()
        .setColor(0x00b4d8)
        .setTitle("📋 Server Panels")
        .setDescription(panels.map((p, i) => `**${i + 1}.** \`${p.name}\` — ${p.buttonType} | <#${p.channelId}>`).join("\n"))
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "delete") {
      const name = interaction.options.getString("name", true);
      const panel = await Panel.findOneAndDelete({ guildId: interaction.guildId, name });
      if (!panel) return interaction.reply({ embeds: [errorEmbed("Not Found", `No panel named \`${name}\`.`)], ephemeral: true });
      return interaction.reply({ embeds: [successEmbed("Deleted", `Panel \`${name}\` has been deleted.`)], ephemeral: true });
    }

    // /panel create — multi-step setup
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x00b4d8)
          .setTitle("🛠️ Panel Setup — Step 1/3")
          .setDescription(
            "Let's set up your panel step by step.\n\n" +
            "**Please select the button type for this panel:**"
          ),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId("psetup_type_ticket").setLabel("Ticket").setEmoji("🎫").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("psetup_type_automm").setLabel("AutoMM").setEmoji("🔄").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("psetup_type_application").setLabel("Application").setEmoji("📝").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("psetup_type_verification").setLabel("Verification").setEmoji("✅").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("psetup_type_role").setLabel("Role Button").setEmoji("🏷️").setStyle(ButtonStyle.Secondary)
        ),
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId("psetup_type_message").setLabel("Custom Message").setEmoji("💬").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("psetup_type_link").setLabel("Link Button").setEmoji("🔗").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("psetup_type_giveaway").setLabel("Giveaway Entry").setEmoji("🎉").setStyle(ButtonStyle.Secondary)
        ),
      ],
      ephemeral: true,
    });
  },
};
