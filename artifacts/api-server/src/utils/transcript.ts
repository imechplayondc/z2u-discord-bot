import { TextChannel, Message, EmbedBuilder } from "discord.js";
import { COLORS } from "./colors.js";

export async function generateTranscript(channel: TextChannel): Promise<string> {
  const messages: Message[] = [];
  let lastId: string | undefined;

  while (true) {
    const fetched = await channel.messages.fetch({ limit: 100, before: lastId });
    if (fetched.size === 0) break;
    messages.push(...fetched.values());
    lastId = fetched.last()?.id;
    if (fetched.size < 100) break;
  }

  messages.reverse();

  const lines = messages.map((m) => {
    const time = m.createdAt.toUTCString();
    const author = `${m.author.username}#${m.author.discriminator}`;
    const content = m.content || "[embed/attachment]";
    return `[${time}] ${author}: ${content}`;
  });

  return lines.join("\n");
}

export async function sendTranscript(
  transcriptChannel: TextChannel,
  ticketChannel: TextChannel,
  closedBy: string,
  transcript: string
): Promise<void> {
  const embed = new EmbedBuilder()
    .setColor(COLORS.Z2U)
    .setTitle("📋 Ticket Transcript")
    .addFields(
      { name: "Ticket", value: ticketChannel.name, inline: true },
      { name: "Closed By", value: `<@${closedBy}>`, inline: true },
      { name: "Messages", value: String(transcript.split("\n").length), inline: true }
    )
    .setTimestamp();

  const buffer = Buffer.from(transcript, "utf-8");
  await transcriptChannel.send({
    embeds: [embed],
    files: [{ attachment: buffer, name: `transcript-${ticketChannel.name}.txt` }],
  });
}
