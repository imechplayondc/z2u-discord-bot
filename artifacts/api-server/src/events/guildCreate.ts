import { Guild, EmbedBuilder, TextChannel } from "discord.js";
import GuildConfig from "../models/GuildConfig.js";
import { COLORS } from "../utils/colors.js";
import { botLog } from "../utils/logger.js";

export default {
  name: "guildCreate",
  once: false,
  async execute(_client: unknown, guild: Guild) {
    botLog("info", `Joined guild: ${guild.name} (${guild.id})`);

    await GuildConfig.findOneAndUpdate(
      { guildId: guild.id },
      { $setOnInsert: { guildId: guild.id } },
      { upsert: true }
    );

    const systemChannel = guild.systemChannel as TextChannel | null;
    if (systemChannel) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.Z2U)
        .setTitle("👋 Thanks for adding z2u Bot!")
        .setDescription(
          "I'm your all-in-one Discord management & AutoMM system.\n\n" +
            "**Getting Started:**\n" +
            "• `/panel create` — Create a custom ticket/support panel\n" +
            "• `/autommpanel` — Set up the AutoMM trading system\n" +
            "• `/wallet set` — Configure your payment wallets\n" +
            "• `/embed` — Build custom embeds with buttons\n" +
            "• `/customcommand create` — Create custom commands\n" +
            "• `/help` — Full command list\n\n" +
            "Powered by **z2u.com** | Trusted Trading"
        )
        .setFooter({ text: "z2u.com | Trusted Trading" })
        .setTimestamp();
      await systemChannel.send({ embeds: [embed] }).catch(() => {});
    }
  },
};
