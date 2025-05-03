const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'help',
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available commands and access requirements.'),

  async execute(interactionOrMessage, client, args = []) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const prefix = client.config.prefix || '.';

    const commandCategories = fs.readdirSync('./commands');
    const commandsList = {
      Moderator: [],
      'Head Admin': []
    };

    for (const category of commandCategories) {
      const files = fs.readdirSync(`./commands/${category}`).filter(f => f.endsWith('.js'));
      for (const file of files) {
        const command = require(`../${category}/${file}`);
        if (!command.name) continue;

        // Determine role access
        let access = 'Moderator';
        if (command.name === 'role') access = 'Head Admin';

        const usage = command.data
          ? `/${command.data.name}`
          : `${prefix}${command.name}`;

        const desc = command.data?.description || 'No description.';
        commandsList[access].push(`**${usage}** – ${desc}`);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('📜 Help Menu')
      .setDescription('Here are the available commands and their access requirements:')
      .addFields(
        {
          name: '🔧 Moderator Commands',
          value: commandsList.Moderator.join('\n') || 'None available',
          inline: false
        },
        {
          name: '👑 Head Admin Commands',
          value: commandsList['Head Admin'].join('\n') || 'None available',
          inline: false
        }
      )
      .setColor('Blurple')
      .setTimestamp();

    if (isSlash) {
      await interactionOrMessage.reply({ embeds: [embed] });
    } else {
      await interactionOrMessage.channel.send({ embeds: [embed] });
    }
  }
};
