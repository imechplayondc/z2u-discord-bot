import {
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextChannel,
} from "discord.js";
import GuildConfig from "../models/GuildConfig.js";
import { parseColor } from "../utils/colors.js";
import { successEmbed, errorEmbed } from "../utils/embeds.js";

const PAYMENT_METHODS = [
  { name: "PayPal", value: "PayPal", emoji: { id: "1506339857486708747", name: "paypal" } },
  { name: "Ethereum (ETH)", value: "Ethereum", emoji: { id: "1506339815937933347", name: "ethemoji" } },
  { name: "Bitcoin (BTC)", value: "Bitcoin", emoji: { id: "1506339770458968265", name: "btcemoji" } },
  { name: "Solana (SOL)", value: "Solana", emoji: { id: "1506339640473288885", name: "Solana" } },
  { name: "USDT (ETH)", value: "USDT_ETH", emoji: { id: "1506339246989119568", name: "USDTEth" } },
  { name: "USDC (ETH)", value: "USDC_ETH", emoji: { id: "1506339308813025331", name: "USDCEth" } },
  { name: "USDT (SOL)", value: "USDT_SOL", emoji: { id: "1506339430196183131", name: "USDTSol" } },
  { name: "USDC (SOL)", value: "USDC_SOL", emoji: { id: "1506339480678957219", name: "USDCSol" } },
  { name: "USDT (ERC-20)", value: "USDT_ERC20", emoji: { id: "1506339547074789497", name: "usdteth" } },
  { name: "Litecoin (LTC)", value: "Litecoin", emoji: { id: "1506339034157285659", name: "Ltc" } },
];

export default {
  customId: "automm_setup",
  async execute(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ ephemeral: true });

    // Parse IDs from customId: automm_setup_CATID_ROLEID_CHANNELID
    const parts = interaction.customId.split("_");
    const categoryId = parts[2];
    const staffRoleId = parts[3];
    const panelChannelId = parts[4];

    const title = interaction.fields.getTextInputValue("title");
    const description = interaction.fields.getTextInputValue("description");
    const imageUrl = interaction.fields.getTextInputValue("image")?.trim() || undefined;
    const colorHex = interaction.fields.getTextInputValue("color") || "#00b4d8";

    const color = parseColor(colorHex);

    await GuildConfig.findOneAndUpdate(
      { guildId: interaction.guildId },
      {
        autoMMEnabled: true,
        autoMMCategory: categoryId,
        autoMMStaffRole: staffRoleId,
        autoMMTitle: title,
        autoMMDescription: description,
        autoMMImage: imageUrl,
      },
      { upsert: true }
    );

    const panelChannel = interaction.guild!.channels.cache.get(panelChannelId) as TextChannel | undefined;
    if (!panelChannel) {
      return interaction.editReply({ embeds: [errorEmbed("Error", "Panel channel not found.")] });
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(description)
      .setFooter({ text: "z2u.com | Select a payment method below to start" })
      .setTimestamp();

    if (imageUrl) embed.setImage(imageUrl);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("automm_payment_select")
      .setPlaceholder("💳 Select your payment method...")
      .setMinValues(1)
      .setMaxValues(1);

    for (const method of PAYMENT_METHODS) {
      selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel(method.name)
          .setValue(method.value)
          .setEmoji(method.emoji)
      );
    }

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    await panelChannel.send({ embeds: [embed], components: [row] });

    return interaction.editReply({
      embeds: [successEmbed("AutoMM Panel Created", `AutoMM panel sent to <#${panelChannelId}>!`)],
    });
  },
};
