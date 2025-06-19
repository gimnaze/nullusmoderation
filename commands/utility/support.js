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
      .setDescription(`[Click here to join the support server owned by <@1277231201190674495>](${inviteLink})`)
      .setColor('Blue')
      .setFooter({ text: 'We’re here to help!' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
