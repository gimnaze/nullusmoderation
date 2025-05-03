const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logAction = require('../../utils/logAction');
const dmUser = require('../../utils/dmUser');
const { incrementPunishment } = require('../../utils/status'); // ✅ Count mod actions

module.exports = {
  name: 'unmute',
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a member.')
    .addUserOption(opt => opt.setName('user').setDescription('User to unmute').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for unmuting')),

  async execute(interactionOrMessage, client, args = []) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const member = interactionOrMessage.member;
    const config = client.config;

    if (!member.roles.cache.has(config.moderatorRoleId)) {
      return interactionOrMessage.reply({ content: 'You do not have permission to use this command.', ephemeral: false });
    }

    const targetUser = isSlash
      ? interactionOrMessage.options.getUser('user')
      : interactionOrMessage.mentions.users.first();

    const reason = isSlash
      ? interactionOrMessage.options.getString('reason') || 'No reason provided.'
      : args.slice(1).join(' ') || 'No reason provided.';

    if (!targetUser) {
      return interactionOrMessage.reply({ content: 'Please mention a valid user to unmute.', ephemeral: false });
    }

    const targetMember = await interactionOrMessage.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      return interactionOrMessage.reply({ content: 'User not found in this server.', ephemeral: false });
    }

    const muteRole = interactionOrMessage.guild.roles.cache.get(config.muteRoleId);

    let unmuted = false;
    if (targetMember.isCommunicationDisabled()) {
      await targetMember.timeout(null, reason); // Remove timeout
      unmuted = true;
    }

    if (muteRole && targetMember.roles.cache.has(muteRole.id)) {
      await targetMember.roles.remove(muteRole, reason);
      unmuted = true;
    }

    if (!unmuted) {
      return interactionOrMessage.reply({ content: 'This user is not currently muted.', ephemeral: false });
    }

    await dmUser(targetUser, 'You have been unmuted', reason);

    const embed = new EmbedBuilder()
      .setTitle('✅ Member Unmuted')
      .setDescription(`${targetUser.tag} has been unmuted.`)
      .addFields(
        { name: 'Reason', value: reason, inline: true },
        { name: 'Staff', value: `${interactionOrMessage.user.tag}`, inline: true }
      )
      .setColor('Green')
      .setTimestamp();

    incrementPunishment(); // ✅ Count this mod action

    await interactionOrMessage.reply({ embeds: [embed] });
    await logAction(interactionOrMessage.guild, embed, config);
  }
};
