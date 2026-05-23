import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
} from "discord.js";
import { isAdmin } from "../utils/permissions.js";
import { errorEmbed } from "../utils/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("autommpanel")
    .setDescription("Set up the AutoMM trading panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) =>
      o.setName("category").setDescription("Category for AutoMM tickets").setRequired(true)
        .addChannelTypes(ChannelType.GuildCategory)
    )
    .addRoleOption((o) =>
      o.setName("staffrole").setDescription("Staff / Middleman role").setRequired(true)
    )
    .addChannelOption((o) =>
      o.setName("channel").setDescription("Channel to post the AutoMM panel in").setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!(await isAdmin(member))) {
      return interaction.reply({ embeds: [errorEmbed("No Permission", "You need admin permissions.")], flags: 64 });
    }

    const category = interaction.options.getChannel("category", true);
    const staffRole = interaction.options.getRole("staffrole", true);
    const panelChannel = interaction.options.getChannel("channel", true);

    // All config encoded compactly — Discord IDs are 17-19 digits, no underscores
    // Total customId: "automm_setup_" (13) + id(18) + "_" + id(18) + "_" + id(18) = 68 chars < 100 limit
    const modal = new ModalBuilder()
      .setCustomId(`automm_setup_${category.id}_${staffRole.id}_${panelChannel.id}`)
      .setTitle("AutoMM Panel Design");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("title")
          .setLabel("Embed title")
          .setStyle(TextInputStyle.Short)
          .setValue("z2u AutoMM — Trusted Middleman Service")
          .setMaxLength(256)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Embed description")
          .setStyle(TextInputStyle.Paragraph)
          .setValue(
            "🔒 **Secure Middleman Service**\n\nSelect your payment method below to open a middleman ticket.\n\n✅ Fast & Reliable  🛡️ Fraud Protection  💰 All Major Cryptos & PayPal"
          )
          .setMaxLength(2000)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("color")
          .setLabel("Embed color (hex)")
          .setStyle(TextInputStyle.Short)
          .setValue("#00b4d8")
          .setMaxLength(7)
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("image")
          .setLabel("Embed image URL (optional)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
      )
    );

    await interaction.showModal(modal);
  },
};
