const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'support',
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Get an invite to the support server.'),

  async execute(interaction) {
    const inviteLink = 'https://discord.gg/PEBteegJt3'; // ⬅️ Replace this

    const embed = new EmbedBuilder()
      .setTitle('🛠️ Support Server')
      .setDescription(`Join the Support Server owned by the Bots Developer: Gimnaze (${inviteLink})`)
      .setColor('Blue')
      .setFooter({ text: 'We’re here to help!' });

    await interaction.reply({ embeds: [embed], ephemeral: false });
  }
};
