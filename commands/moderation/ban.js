const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logAction = require('../../utils/logAction');
const dmUser = require('../../utils/dmUser');
const isWhitelisted = require('../../utils/whitelist'); // ✅ Import the whitelist check

module.exports = {
  name: 'ban',
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the ban')),

  async execute(interactionOrMessage, client, args = []) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const member = interactionOrMessage.member;

    if (!member.roles.cache.has(client.config.moderatorRoleId)) {
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
        content: 'You must mention a valid user to ban.',
        ephemeral: false
      });
    }

    // ✅ Whitelist check
    if (isWhitelisted(targetUser.id)) {
      return interactionOrMessage.reply({
        content: '⚠️ This user is whitelisted and cannot be banned.',
        ephemeral: true
      });
    }

    const targetMember = await interactionOrMessage.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember || !targetMember.bannable) {
      return interactionOrMessage.reply({
        content: 'I cannot ban this user.',
        ephemeral: false
      });
    }

    await dmUser(targetUser, 'You were banned', reason);
    await targetMember.ban({ reason });

    const embed = new EmbedBuilder()
      .setTitle('🚫 Member Banned')
      .setDescription(`${targetUser.tag} has been banned.`)
      .addFields(
        { name: 'Reason', value: reason, inline: true },
        { name: 'Staff', value: `${interactionOrMessage.user.tag}`, inline: true }
      )
      .setColor('Red')
      .setTimestamp();

    await interactionOrMessage.reply({ embeds: [embed] });
    await logAction(interactionOrMessage.guild, embed, client.config);
  }
};
