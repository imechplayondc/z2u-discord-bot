import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
  ChannelType,
} from "discord.js";
import GuildConfig from "../models/GuildConfig.js";
import { isAdmin } from "../utils/permissions.js";
import { errorEmbed, successEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

const PAYMENT_METHODS = [
  { name: "PayPal", emoji: "paypal", emojiId: "1506339857486708747" },
  { name: "Ethereum", emoji: "ethemoji", emojiId: "1506339815937933347" },
  { name: "Bitcoin", emoji: "btcemoji", emojiId: "1506339770458968265" },
  { name: "Solana", emoji: "Solana", emojiId: "1506339640473288885" },
  { name: "USDT (ETH)", emoji: "USDTEth", emojiId: "1506339246989119568" },
  { name: "USDC (ETH)", emoji: "USDCEth", emojiId: "1506339308813025331" },
  { name: "USDT (SOL)", emoji: "USDTSol", emojiId: "1506339430196183131" },
  { name: "USDC (SOL)", emoji: "USDCSol", emojiId: "1506339480678957219" },
  { name: "USDT (ETH2)", emoji: "usdteth", emojiId: "1506339547074789497" },
  { name: "Litecoin", emoji: "Ltc", emojiId: "1506339034157285659" },
];

export default {
  data: new SlashCommandBuilder()
    .setName("autommpanel")
    .setDescription("Set up the AutoMM trading panel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) =>
      o.setName("category").setDescription("Ticket category for AutoMM tickets").setRequired(true)
        .addChannelTypes(ChannelType.GuildCategory)
    )
    .addRoleOption((o) =>
      o.setName("staffrole").setDescription("Staff/Middleman role").setRequired(true)
    )
    .addChannelOption((o) =>
      o.setName("channel").setDescription("Channel to send the AutoMM panel to").setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!(await isAdmin(member))) {
      return interaction.reply({ embeds: [errorEmbed("No Permission", "You need admin permissions.")], ephemeral: true });
    }

    const category = interaction.options.getChannel("category", true);
    const staffRole = interaction.options.getRole("staffrole", true);
    const panelChannel = interaction.options.getChannel("channel", true) as TextChannel;

    // Open modal for embed config
    const modal = new ModalBuilder()
      .setCustomId(`automm_setup_${category.id}_${staffRole.id}_${panelChannel.id}`)
      .setTitle("AutoMM Panel Configuration");

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("title")
          .setLabel("Embed Title")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("z2u AutoMM — Trusted Middleman Service")
          .setValue("z2u AutoMM — Trusted Middleman Service")
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("description")
          .setLabel("Embed Description")
          .setStyle(TextInputStyle.Paragraph)
          .setPlaceholder("Select your payment method below to start a secure middleman trade...")
          .setValue(
            "🔒 **Secure Middleman Service**\n\nSelect your preferred payment method below to open a middleman ticket.\nOur verified staff will oversee your trade from start to finish.\n\n✅ Fast & Reliable\n🛡️ Fraud Protection\n💰 All Major Cryptos & PayPal Accepted"
          )
          .setRequired(true)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("image")
          .setLabel("Embed Image URL (optional)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
      ),
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("color")
          .setLabel("Embed Color (hex, e.g. #00b4d8)")
          .setStyle(TextInputStyle.Short)
          .setValue("#00b4d8")
          .setRequired(true)
      )
    );

    await interaction.showModal(modal);
  },
};
