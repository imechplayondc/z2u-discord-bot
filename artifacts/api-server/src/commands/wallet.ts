import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from "discord.js";
import Wallet from "../models/Wallet.js";
import { errorEmbed, successEmbed, z2uEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

export default {
  data: new SlashCommandBuilder()
    .setName("wallet")
    .setDescription("Manage your payment wallets")
    .addSubcommand((sub) =>
      sub
        .setName("set")
        .setDescription("Add or update a wallet address")
        .addStringOption((o) =>
          o
            .setName("method")
            .setDescription("Payment method")
            .setRequired(true)
            .addChoices(
              { name: "PayPal", value: "PayPal" },
              { name: "Bitcoin (BTC)", value: "Bitcoin" },
              { name: "Ethereum (ETH)", value: "Ethereum" },
              { name: "Solana (SOL)", value: "Solana" },
              { name: "Litecoin (LTC)", value: "Litecoin" },
              { name: "USDT (ETH)", value: "USDT_ETH" },
              { name: "USDC (ETH)", value: "USDC_ETH" },
              { name: "USDT (SOL)", value: "USDT_SOL" },
              { name: "USDC (SOL)", value: "USDC_SOL" }
            )
        )
        .addStringOption((o) =>
          o.setName("address").setDescription("Your wallet address or PayPal email").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a wallet address")
        .addStringOption((o) =>
          o
            .setName("method")
            .setDescription("Payment method to remove")
            .setRequired(true)
            .addChoices(
              { name: "PayPal", value: "PayPal" },
              { name: "Bitcoin (BTC)", value: "Bitcoin" },
              { name: "Ethereum (ETH)", value: "Ethereum" },
              { name: "Solana (SOL)", value: "Solana" },
              { name: "Litecoin (LTC)", value: "Litecoin" },
              { name: "USDT (ETH)", value: "USDT_ETH" },
              { name: "USDC (ETH)", value: "USDC_ETH" },
              { name: "USDT (SOL)", value: "USDT_SOL" },
              { name: "USDC (SOL)", value: "USDC_SOL" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub.setName("view").setDescription("View your configured wallets")
    )
    .addSubcommand((sub) =>
      sub
        .setName("check")
        .setDescription("Check another user's wallet (staff only)")
        .addUserOption((o) =>
          o.setName("user").setDescription("User to check").setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const userId = interaction.user.id;
    const guildId = interaction.guildId!;

    if (sub === "set") {
      const method = interaction.options.getString("method", true);
      const address = interaction.options.getString("address", true);

      await Wallet.findOneAndUpdate(
        { userId, guildId },
        { $pull: { wallets: { method } } },
        { new: true }
      );

      await Wallet.findOneAndUpdate(
        { userId, guildId },
        { $push: { wallets: { method, address } } },
        { upsert: true, new: true }
      );

      return interaction.reply({
        embeds: [successEmbed("Wallet Updated", `Your **${method}** wallet has been set to:\n\`\`\`${address}\`\`\``)],
        ephemeral: true,
      });
    }

    if (sub === "remove") {
      const method = interaction.options.getString("method", true);
      await Wallet.findOneAndUpdate({ userId, guildId }, { $pull: { wallets: { method } } });
      return interaction.reply({
        embeds: [successEmbed("Wallet Removed", `Your **${method}** wallet has been removed.`)],
        ephemeral: true,
      });
    }

    if (sub === "view") {
      const wallet = await Wallet.findOne({ userId, guildId });
      if (!wallet || !wallet.wallets.length) {
        return interaction.reply({
          embeds: [errorEmbed("No Wallets", "You have no wallet addresses configured. Use `/wallet set` to add one.")],
          ephemeral: true,
        });
      }

      const embed = z2uEmbed()
        .setTitle("💳 Your Wallets")
        .setDescription(wallet.wallets.map((w) => `**${w.method}:** \`${w.address}\``).join("\n"))
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "check") {
      const target = interaction.options.getUser("user", true);
      const wallet = await Wallet.findOne({ userId: target.id, guildId });
      if (!wallet || !wallet.wallets.length) {
        return interaction.reply({
          embeds: [errorEmbed("No Wallets", `<@${target.id}> has no wallet addresses configured.`)],
          ephemeral: true,
        });
      }

      const embed = z2uEmbed()
        .setTitle(`💳 Wallets — ${target.username}`)
        .setDescription(wallet.wallets.map((w) => `**${w.method}:** \`${w.address}\``).join("\n"))
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
