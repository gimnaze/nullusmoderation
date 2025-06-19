const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logAction = require('../../utils/logAction');
const { addWarning } = require('../../utils/warnings');
const isWhitelisted = require('../../utils/whitelist'); // ✅ Import whitelist check

module.exports = {
  name: 'warn',
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user.')
    .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning')),

  async execute(interactionOrMessage, client, args = []) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const member = interactionOrMessage.member;
    const config = client.config;

    if (!member.roles.cache.has(config.moderatorRoleId)) {
      return interactionOrMessage.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: false
      });
    }

    const targetUser = isSlash
      ? interactionOrMessage.options.getUser('user')
      : interactionOrMessage.mentions.users.first();

    const reason = isSlash
      ? interactionOrMessage.options.getString('reason') || 'No reason provided.'
      : args.slice(1).join(' ') || 'No reason provided.';

    if (!targetUser) {
      return interactionOrMessage.reply({
        content: 'Please mention a valid user to warn.',
        ephemeral: false
      });
    }

    // ✅ Whitelist check
    if (isWhitelisted(targetUser.id)) {
      return interactionOrMessage.reply({
        content: '⚠️ This user is whitelisted and cannot be warned.',
        ephemeral: false
      });
    }

    const warning = {
      userId: targetUser.id,
      reason,
      staff: `${member.user.tag}`,
      date: new Date().toISOString()
    };

    const caseNumber = addWarning(warning);

    const embed = new EmbedBuilder()
      .setTitle('⚠️ User Warned')
      .setDescription(`${targetUser.tag} has been warned.`)
      .addFields(
        { name: 'Reason', value: reason },
        { name: 'Staff', value: `${member.user.tag}` },
        { name: 'Case Number', value: `#${caseNumber}` }
      )
      .setColor('Orange')
      .setTimestamp();

    await interactionOrMessage.reply({ embeds: [embed] });
    await logAction(interactionOrMessage.guild, embed, config);
  }
};
