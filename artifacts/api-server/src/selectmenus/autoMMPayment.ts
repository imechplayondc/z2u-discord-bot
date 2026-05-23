import {
  StringSelectMenuInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  PermissionFlagsBits,
} from "discord.js";
import GuildConfig from "../models/GuildConfig.js";
import Wallet from "../models/Wallet.js";
import Trade from "../models/Trade.js";
import Ticket from "../models/Ticket.js";
import { errorEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

const METHOD_DISPLAY: Record<string, string> = {
  PayPal: "PayPal",
  Ethereum: "Ethereum (ETH)",
  Bitcoin: "Bitcoin (BTC)",
  Solana: "Solana (SOL)",
  USDT_ETH: "USDT (ETH)",
  USDC_ETH: "USDC (ETH)",
  USDT_SOL: "USDT (SOL)",
  USDC_SOL: "USDC (SOL)",
  USDT_ERC20: "USDT (ERC-20)",
  Litecoin: "Litecoin (LTC)",
};

export default {
  customId: "automm_payment_select",
  async execute(interaction: StringSelectMenuInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const paymentMethod = interaction.values[0];
    const config = await GuildConfig.findOne({ guildId: interaction.guildId });

    if (!config?.autoMMEnabled) {
      return interaction.editReply({ embeds: [errorEmbed("Disabled", "AutoMM is not enabled on this server.")] });
    }

    if (!config.autoMMCategory || !config.autoMMStaffRole) {
      return interaction.editReply({ embeds: [errorEmbed("Not Configured", "AutoMM is not fully configured. Contact an admin.")] });
    }

    // Check if seller has a wallet configured for this method
    const walletRecord = await Wallet.findOne({ userId: interaction.user.id, guildId: interaction.guildId });
    const walletEntry = walletRecord?.wallets.find((w) => w.method === paymentMethod);

    if (!walletEntry) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.DANGER)
            .setTitle("❌ No Wallet Configured")
            .setDescription(
              `You don't have a **${METHOD_DISPLAY[paymentMethod] || paymentMethod}** wallet set up.\n\n` +
              `Use \`/wallet set method:${paymentMethod}\` to add your wallet address before opening an AutoMM ticket.`
            )
            .setTimestamp(),
        ],
      });
    }

    // Check if user already has an open AutoMM ticket
    const existingTicket = await Ticket.findOne({
      guildId: interaction.guildId,
      userId: interaction.user.id,
      panelName: "AutoMM",
      status: { $ne: "closed" },
    });

    if (existingTicket) {
      return interaction.editReply({
        embeds: [errorEmbed("Already Open", `You already have an open AutoMM ticket: <#${existingTicket.channelId}>`)],
      });
    }

    // Create private AutoMM ticket channel
    const category = interaction.guild!.channels.cache.get(config.autoMMCategory);
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    const channelName = `automm-${member.user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now().toString().slice(-4)}`;

    const channel = await interaction.guild!.channels.create({
      name: channelName,
      type: 0,
      parent: config.autoMMCategory,
      permissionOverwrites: [
        { id: interaction.guild!.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
        {
          id: config.autoMMStaffRole,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ManageMessages,
          ],
        },
      ],
    }) as TextChannel;

    const trade = await Trade.create({
      guildId: interaction.guildId,
      channelId: channel.id,
      sellerId: interaction.user.id,
      buyerId: interaction.user.id,
      paymentMethod,
      walletAddress: walletEntry.address,
      amount: "TBD",
      item: "TBD",
      status: "pending_payment",
    });

    await Ticket.create({
      guildId: interaction.guildId,
      channelId: channel.id,
      userId: interaction.user.id,
      panelId: "automm",
      panelName: "AutoMM",
      status: "open",
      answers: [{ question: "Payment Method", answer: METHOD_DISPLAY[paymentMethod] || paymentMethod }],
    });

    const embed = new EmbedBuilder()
      .setColor(COLORS.Z2U)
      .setTitle("🔄 AutoMM Ticket Opened")
      .setDescription(
        `Welcome <@${interaction.user.id}>!\n\n` +
        `Your **${METHOD_DISPLAY[paymentMethod]}** middleman ticket has been created.\n` +
        `A staff member will assist you shortly.\n\n` +
        `Press **Setup Trade** below to configure your trade details.`
      )
      .addFields(
        { name: "Payment Method", value: METHOD_DISPLAY[paymentMethod] || paymentMethod, inline: true },
        { name: "Your Wallet", value: `\`${walletEntry.address}\``, inline: false },
        { name: "Status", value: "⏳ Awaiting Trade Setup", inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "z2u.com | Secure Middleman Trading" });

    const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("trade_setup")
        .setLabel("Setup Trade")
        .setEmoji("⚙️")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`ticket_close_${trade._id}`)
        .setLabel("Close Ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `<@${interaction.user.id}> | <@&${config.autoMMStaffRole}>`,
      embeds: [embed],
      components: [controlRow],
    });

    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.SUCCESS)
          .setTitle("✅ AutoMM Ticket Created")
          .setDescription(`Your private middleman channel has been opened: <#${channel.id}>`),
      ],
    });
  },
};
