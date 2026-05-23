import { GuildMember } from "discord.js";
import GuildConfig from "../models/GuildConfig.js";

export async function isStaff(member: GuildMember): Promise<boolean> {
  if (member.permissions.has("Administrator")) return true;
  const config = await GuildConfig.findOne({ guildId: member.guild.id });
  if (!config) return false;
  const staffRoles = [...config.adminRoles, ...config.moderatorRoles, ...config.middlemanRoles];
  return member.roles.cache.some((r) => staffRoles.includes(r.id));
}

export async function isAdmin(member: GuildMember): Promise<boolean> {
  if (member.permissions.has("Administrator")) return true;
  const config = await GuildConfig.findOne({ guildId: member.guild.id });
  if (!config) return false;
  return member.roles.cache.some((r) => config.adminRoles.includes(r.id));
}

export async function isMiddleman(member: GuildMember): Promise<boolean> {
  if (member.permissions.has("Administrator")) return true;
  const config = await GuildConfig.findOne({ guildId: member.guild.id });
  if (!config) return false;
  const mmRoles = [...config.adminRoles, ...config.middlemanRoles];
  return member.roles.cache.some((r) => mmRoles.includes(r.id));
}
