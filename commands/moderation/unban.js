const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logAction = require('../../utils/logAction');
const dmUser = require('../../utils/dmUser');
const { incrementPunishment } = require('../../utils/status'); // ✅ Tracking all mod actions

module.exports = {
  name: 'unban',
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server.')
    .addStringOption(opt => opt.setName('userid').setDescription('User ID to unban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for unbanning')),

  async execute(interactionOrMessage, client, args = []) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const member = interactionOrMessage.member;
    const config = client.config;

    if (!member.roles.cache.has(config.moderatorRoleId)) {
      return interactionOrMessage.reply({ content: 'You do not have permission to use this command.', ephemeral: false });
    }

    const userId = isSlash
      ? interactionOrMessage.options.getString('userid')
      : args[0];

    const reason = isSlash
      ? interactionOrMessage.options.getString('reason') || 'No reason provided.'
      : args.slice(1).join(' ') || 'No reason provided.';

    if (!userId || isNaN(userId)) {
      return interactionOrMessage.reply({ content: 'Please provide a valid User ID.', ephemeral: false });
    }

    try {
      const user = await client.users.fetch(userId);
      await interactionOrMessage.guild.members.unban(userId, reason);
      await dmUser(user, 'You have been unbanned', reason);

      incrementPunishment(); // ✅ Count as mod action

      const embed = new EmbedBuilder()
        .setTitle('🔓 Member Unbanned')
        .setDescription(`${user.tag} has been unbanned.`)
        .addFields(
          { name: 'Reason', value: reason, inline: true },
          { name: 'Staff', value: `${interactionOrMessage.user.tag}`, inline: true }
        )
        .setColor('Blue')
        .setTimestamp();

      await interactionOrMessage.reply({ embeds: [embed] });
      await logAction(interactionOrMessage.guild, embed, config);

    } catch (err) {
      return interactionOrMessage.reply({ content: 'Failed to unban. Make sure the ID is correct and the user is banned.', ephemeral: false });
    }
  }
};
