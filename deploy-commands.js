const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

/**
 * Retries a REST put request for command deployment.
 * @param {REST} rest - The REST client.
 * @param {string} route - The API route.
 * @param {any} body - The body of the request.
 * @param {number} retries - Number of retry attempts.
 */
async function safePut(rest, route, body, retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      return await rest.put(route, { body });
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`⚠️ Retry ${i + 1}/${retries} failed: ${err.message}`);
      await new Promise(res => setTimeout(res, 2000));
    }
  }
}

/**
 * Deploys all slash commands globally to Discord after clearing global and guild commands.
 * @param {string} clientId - The bot's application ID.
 * @param {string} token - The bot token.
 * @param {string} [guildId] - Optional guild ID to clear commands from.
 */
async function deployCommands(clientId, token, guildId) {
  const rest = new REST({ version: '10' }).setToken(token);
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const command = require(path.join(folderPath, file));
      if (command.data) {
        commands.push(command.data.toJSON());
      }
    }
  }

  try {
    console.log('📦 Fetching existing global commands...');
    const existingGlobal = await rest.get(Routes.applicationCommands(clientId));
    if (existingGlobal.length > 0) {
      console.log(`🧹 Deleting ${existingGlobal.length} global command(s)...`);
      for (const cmd of existingGlobal) {
        await rest.delete(Routes.applicationCommand(clientId, cmd.id));
        console.log(`❌ Deleted global: ${cmd.name}`);
      }
    }

    if (guildId) {
      console.log('📦 Fetching existing guild commands...');
      const existingGuild = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
      if (existingGuild.length > 0) {
        console.log(`🧹 Deleting ${existingGuild.length} guild command(s)...`);
        for (const cmd of existingGuild) {
          await rest.delete(Routes.applicationGuildCommand(clientId, guildId, cmd.id));
          console.log(`❌ Deleted guild: ${cmd.name}`);
        }
      }
    }

    console.log(`🚀 Deploying ${commands.length} new global command(s)...`);
    await safePut(rest, Routes.applicationCommands(clientId), commands);

    console.log('✅ Global slash commands deployed successfully.');
  } catch (error) {
    console.error('❌ Error during deployment:', error);
  }
}

module.exports = { deployCommands };
