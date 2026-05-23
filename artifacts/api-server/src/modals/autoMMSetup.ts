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

// Payment methods with Unicode fallback emoji (custom emoji optional)
const PAYMENT_METHODS = [
  { name: "PayPal", value: "PayPal", emoji: "💳" },
  { name: "Ethereum (ETH)", value: "Ethereum", emoji: "🔷" },
  { name: "Bitcoin (BTC)", value: "Bitcoin", emoji: "🟠" },
  { name: "Solana (SOL)", value: "Solana", emoji: "🟣" },
  { name: "USDT (ETH)", value: "USDT_ETH", emoji: "💵" },
  { name: "USDC (ETH)", value: "USDC_ETH", emoji: "💲" },
  { name: "USDT (SOL)", value: "USDT_SOL", emoji: "💰" },
  { name: "USDC (SOL)", value: "USDC_SOL", emoji: "🏦" },
  { name: "USDT (ERC-20)", value: "USDT_ERC20", emoji: "📊" },
  { name: "Litecoin (LTC)", value: "Litecoin", emoji: "⚡" },
];

export default {
  customId: "automm_setup",
  async execute(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: 64 });

    // Parse IDs from customId: automm_setup_CATID_ROLEID_CHANNELID
    // Discord snowflakes are 17-19 digits with no underscores — safe to split
    const raw = interaction.customId.replace("automm_setup_", "");
    const parts = raw.split("_");

    if (parts.length < 3) {
      return interaction.editReply({ embeds: [errorEmbed("Error", "Invalid setup data. Run `/autommpanel` again.")] });
    }

    const categoryId = parts[0];
    const staffRoleId = parts[1];
    const panelChannelId = parts[2];

    const title = interaction.fields.getTextInputValue("title");
    const description = interaction.fields.getTextInputValue("description");
    const colorHex = interaction.fields.getTextInputValue("color").trim() || "#00b4d8";
    const imageUrl = interaction.fields.getTextInputValue("image")?.trim() || undefined;

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
      return interaction.editReply({ embeds: [errorEmbed("Error", "Panel channel not found. Make sure the bot has access.")] });
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
      embeds: [
        successEmbed(
          "AutoMM Panel Created",
          `Panel sent to <#${panelChannelId}>!\n\n` +
          `**Category:** <#${categoryId}>\n` +
          `**Staff Role:** <@&${staffRoleId}>\n\n` +
          `Users can now select a payment method to open AutoMM tickets. ` +
          `Make sure sellers run \`/wallet set\` first.`
        ),
      ],
    });
  },
};
