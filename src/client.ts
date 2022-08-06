import "reflect-metadata";
import { GatewayIntentBits } from "discord.js";
import { Client } from "discordx";
import { importx } from "@discordx/importer";

export const client = new Client({
  simpleCommand: {
    prefix: "g!",
  },
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  // If you only want to use guild commands, uncomment this line
  // botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
  // silent: true,
});

client.once("ready", async () => {
  // init all application commands
  await client.initApplicationCommands({
    guild: { log: true },
    global: { log: true },
  });

  // init permissions; enabled log to see changes
  // await client.initApplicationPermissions(true);

  console.log("Bot started");
});

client.on("interactionCreate", (interaction) => {
  client.executeInteraction(interaction);
});

client.on("messageCreate", (message) => {
  client.executeCommand(message);
});

async function run() {
  await importx(__dirname + "/commands/**/*.{ts,js}");
  client.login(process.env.BOT_TOKEN ?? ""); // provide your bot token
}

run();
