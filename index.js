const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
const { deployCommands } = require('./deploy-commands');
const { startStatusUpdater } = require('./utils/status');

// Check for config.json
if (!fs.existsSync('./config.json')) {
  console.error('⚠️ config.json not found. Please run: node setup.js');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();
client.prefix = config.prefix;
client.config = config;

// Load commands from subfolders
const commandFolders = fs.readdirSync('./commands');
for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    if (command.name) {
      client.commands.set(command.name, command);
    }
  }
}

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  startStatusUpdater(client);

  // Deploy global slash commands
  await deployCommands(client.user.id, config.token, config.guildId);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '❌ Something went wrong.', ephemeral: false });
    } else {
      await interaction.reply({ content: '❌ Something went wrong.', ephemeral: false });
    }
  }
});

client.on('messageCreate', async message => {
  if (message.author.bot || !message.guild) return;

  // 🔐 Run Anti-Ping protection
  const antiPingHandler = require('./events/antiPing');
  await antiPingHandler(message);

  // 🟡 Handle prefix commands
  if (!message.content.startsWith(client.prefix)) return;

  const args = message.content.slice(client.prefix.length).trim().split(/ +/);
  const cmdName = args.shift().toLowerCase();
  const command = client.commands.get(cmdName);
  if (!command) return;

  try {
    await command.execute(message, client, args);
  } catch (err) {
    console.error(err);
    await message.reply('❌ Something went wrong.');
  }
});

client.login(config.token);
