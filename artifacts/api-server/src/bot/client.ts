import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
} from "discord.js";

export interface BotCommand {
  data: {
    name: string;
    toJSON: () => object;
  };
  execute: (interaction: import("discord.js").ChatInputCommandInteraction) => Promise<void>;
}

export interface BotButton {
  customId: string | RegExp;
  execute: (interaction: import("discord.js").ButtonInteraction) => Promise<void>;
}

export interface BotModal {
  customId: string | RegExp;
  execute: (interaction: import("discord.js").ModalSubmitInteraction) => Promise<void>;
}

export interface BotSelectMenu {
  customId: string | RegExp;
  execute: (interaction: import("discord.js").StringSelectMenuInteraction) => Promise<void>;
}

export class BotClient extends Client {
  public commands: Collection<string, BotCommand> = new Collection();
  public buttons: Collection<string, BotButton> = new Collection();
  public modals: Collection<string, BotModal> = new Collection();
  public selectMenus: Collection<string, BotSelectMenu> = new Collection();

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction],
    });
  }
}

export const client = new BotClient();
