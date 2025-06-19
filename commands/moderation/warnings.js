const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getWarningsForUser } = require('../../utils/warnings');

module.exports = {
  name: 'warnings',
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Check all warnings for a user.')
    .addUserOption(opt =>
      opt.setName('user').setDescription('The user to check warnings for').setRequired(true)
    ),

  async execute(interactionOrMessage, client, args = []) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const user = isSlash
      ? interactionOrMessage.options.getUser('user')
      : interactionOrMessage.mentions.users.first();

    if (!user) {
      return interactionOrMessage.reply({
        content: 'Please provide a valid user.',
        ephemeral: false
      });
    }

    const userWarnings = getWarningsForUser(user.id).map(w => ({
      ...w,
      dateFormatted: new Date(w.date).toLocaleString()
    }));

    if (userWarnings.length === 0) {
      return interactionOrMessage.reply({ content: `${user.tag} has no warnings.`, ephemeral: false });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Warnings for ${user.tag}`)
      .setDescription(`<@${user.id}> has ${userWarnings.length} warning(s).`)
      .setColor('Yellow')
      .setTimestamp();

    for (const warning of userWarnings.slice(0, 25)) {
      embed.addFields({
        name: `Case #${warning.case}`,
        value: `**Reason:** ${warning.reason}\n**Staff:** ${warning.staff}\n**Date:** ${warning.dateFormatted}`
      });
    }

    await interactionOrMessage.reply({ embeds: [embed] });
  }
};
