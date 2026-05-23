import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { COLORS } from "../utils/colors.js";
import { errorEmbed } from "../utils/embeds.js";

export default {
  customId: /^give_role_/,
  async execute(interaction: ButtonInteraction) {
    const roleId = interaction.customId.replace("give_role_", "");
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    const role = interaction.guild!.roles.cache.get(roleId);

    if (!role) return interaction.reply({ embeds: [errorEmbed("Error", "Role not found.")], ephemeral: true });

    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(COLORS.WARNING).setDescription(`🏷️ Removed the **${role.name}** role.`)],
        ephemeral: true,
      });
    } else {
      await member.roles.add(roleId);
      return interaction.reply({
        embeds: [new EmbedBuilder().setColor(COLORS.SUCCESS).setDescription(`✅ Given the **${role.name}** role!`)],
        ephemeral: true,
      });
    }
  },
};
