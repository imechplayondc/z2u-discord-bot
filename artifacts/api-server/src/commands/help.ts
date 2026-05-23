import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { COLORS } from "../utils/colors.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("View all available commands"),

  async execute(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder()
      .setColor(COLORS.Z2U)
      .setTitle("📖 z2u Bot — Command Reference")
      .setDescription("All-in-one Discord management & AutoMM system\n[z2u.com](https://z2u.com) | Trusted Trading")
      .addFields(
        {
          name: "🔄 AutoMM System",
          value:
            "`/autommpanel` — Set up the AutoMM trading panel\n" +
            "`/wallet set` — Add a payment wallet\n" +
            "`/wallet view` — View your wallets\n" +
            "`/wallet remove` — Remove a wallet\n" +
            "`/trade complete` — Complete a trade (MM only)\n" +
            "`/trade refund` — Refund a trade (MM only)\n" +
            "`/trade dispute` — Flag a trade as disputed\n" +
            "`/trade verify` — Verify payment proof\n" +
            "`/trade info` — View trade details",
          inline: false,
        },
        {
          name: "🎫 Panel & Ticket System",
          value:
            "`/panel create` — Create a customizable panel\n" +
            "`/panel delete` — Delete a panel\n" +
            "`/panel list` — List all panels\n" +
            "`/ticket close` — Close a ticket\n" +
            "`/ticket claim` — Claim a ticket\n" +
            "`/ticket add` — Add user to ticket\n" +
            "`/ticket remove` — Remove user from ticket\n" +
            "`/ticket transcript` — Save transcript\n" +
            "`/ticket list` — List open tickets",
          inline: false,
        },
        {
          name: "🛠️ Customization",
          value:
            "`/embed` — Build a custom embed with buttons\n" +
            "`/customcommand create` — Create a custom command\n" +
            "`/customcommand use` — Use a custom command\n" +
            "`/customcommand delete` — Delete a custom command\n" +
            "`/customcommand list` — List all custom commands",
          inline: false,
        },
        {
          name: "⚙️ Configuration",
          value:
            "`/config logchannel` — Set log channel\n" +
            "`/config transcriptchannel` — Set transcript channel\n" +
            "`/config adminrole` — Add admin role\n" +
            "`/config modrole` — Add moderator role\n" +
            "`/config mmrole` — Add middleman role\n" +
            "`/config cooldown` — Set ticket cooldown\n" +
            "`/config view` — View current config",
          inline: false,
        }
      )
      .setFooter({ text: "z2u.com | Trusted Trading" })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel("z2u.com")
        .setURL("https://z2u.com")
        .setEmoji("🌐")
        .setStyle(ButtonStyle.Link)
    );

    return interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};
