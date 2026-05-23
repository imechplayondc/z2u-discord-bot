import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
  ChannelType,
} from "discord.js";
import GuildConfig from "../models/GuildConfig.js";
import { errorEmbed, successEmbed, z2uEmbed } from "../utils/embeds.js";
import { COLORS } from "../utils/colors.js";

export default {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure server settings")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName("logchannel")
        .setDescription("Set the log channel")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Log channel").setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("transcriptchannel")
        .setDescription("Set the transcript channel")
        .addChannelOption((o) =>
          o.setName("channel").setDescription("Transcript channel").setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("adminrole")
        .setDescription("Add an admin role")
        .addRoleOption((o) => o.setName("role").setDescription("Admin role").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("modrole")
        .setDescription("Add a moderator role")
        .addRoleOption((o) => o.setName("role").setDescription("Mod role").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("mmrole")
        .setDescription("Add a middleman role")
        .addRoleOption((o) => o.setName("role").setDescription("Middleman role").setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName("cooldown")
        .setDescription("Set ticket cooldown in minutes")
        .addIntegerOption((o) =>
          o.setName("minutes").setDescription("Cooldown in minutes").setRequired(true).setMinValue(0).setMaxValue(1440)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("view").setDescription("View current configuration")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId!;

    if (sub === "view") {
      const config = await GuildConfig.findOne({ guildId });
      if (!config) return interaction.reply({ embeds: [errorEmbed("No Config", "No configuration found.")], ephemeral: true });
      const embed = z2uEmbed()
        .setTitle("⚙️ Server Configuration")
        .addFields(
          { name: "Log Channel", value: config.logChannel ? `<#${config.logChannel}>` : "Not set", inline: true },
          { name: "Transcript Channel", value: config.transcriptChannel ? `<#${config.transcriptChannel}>` : "Not set", inline: true },
          { name: "Ticket Cooldown", value: `${config.ticketCooldown} minutes`, inline: true },
          { name: "Admin Roles", value: config.adminRoles.length ? config.adminRoles.map((r) => `<@&${r}>`).join(", ") : "None", inline: false },
          { name: "Mod Roles", value: config.moderatorRoles.length ? config.moderatorRoles.map((r) => `<@&${r}>`).join(", ") : "None", inline: false },
          { name: "Middleman Roles", value: config.middlemanRoles.length ? config.middlemanRoles.map((r) => `<@&${r}>`).join(", ") : "None", inline: false }
        )
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (sub === "logchannel") {
      const channel = interaction.options.getChannel("channel", true);
      await GuildConfig.findOneAndUpdate({ guildId }, { logChannel: channel.id }, { upsert: true });
      return interaction.reply({ embeds: [successEmbed("Log Channel Set", `Log channel set to <#${channel.id}>.`)], ephemeral: true });
    }

    if (sub === "transcriptchannel") {
      const channel = interaction.options.getChannel("channel", true);
      await GuildConfig.findOneAndUpdate({ guildId }, { transcriptChannel: channel.id }, { upsert: true });
      return interaction.reply({ embeds: [successEmbed("Transcript Channel Set", `Transcript channel set to <#${channel.id}>.`)], ephemeral: true });
    }

    if (sub === "adminrole") {
      const role = interaction.options.getRole("role", true);
      await GuildConfig.findOneAndUpdate({ guildId }, { $addToSet: { adminRoles: role.id } }, { upsert: true });
      return interaction.reply({ embeds: [successEmbed("Admin Role Added", `<@&${role.id}> added as admin role.`)], ephemeral: true });
    }

    if (sub === "modrole") {
      const role = interaction.options.getRole("role", true);
      await GuildConfig.findOneAndUpdate({ guildId }, { $addToSet: { moderatorRoles: role.id } }, { upsert: true });
      return interaction.reply({ embeds: [successEmbed("Mod Role Added", `<@&${role.id}> added as moderator role.`)], ephemeral: true });
    }

    if (sub === "mmrole") {
      const role = interaction.options.getRole("role", true);
      await GuildConfig.findOneAndUpdate({ guildId }, { $addToSet: { middlemanRoles: role.id } }, { upsert: true });
      return interaction.reply({ embeds: [successEmbed("Middleman Role Added", `<@&${role.id}> added as middleman role.`)], ephemeral: true });
    }

    if (sub === "cooldown") {
      const minutes = interaction.options.getInteger("minutes", true);
      await GuildConfig.findOneAndUpdate({ guildId }, { ticketCooldown: minutes }, { upsert: true });
      return interaction.reply({ embeds: [successEmbed("Cooldown Set", `Ticket cooldown set to **${minutes} minutes**.`)], ephemeral: true });
    }
  },
};
