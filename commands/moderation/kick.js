const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logAction = require('../../utils/logAction');
const dmUser = require('../../utils/dmUser');
const { incrementPunishment } = require('../../utils/status');
const isWhitelisted = require('../../utils/whitelist'); // ✅ Import whitelist

module.exports = {
  name: 'kick',
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member.')
    .addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason')),

  async execute(interactionOrMessage, client, args = []) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const member = interactionOrMessage.member;
    const target = isSlash
      ? interactionOrMessage.options.getUser('user')
      : interactionOrMessage.mentions.users.first();

    const reason = isSlash
      ? interactionOrMessage.options.getString('reason') || 'No reason'
      : args.slice(1).join(' ') || 'No reason';

    if (!member.roles.cache.has(client.config.moderatorRoleId)) {
      return interactionOrMessage.reply({ content: 'You don’t have permission to use this.', ephemeral: false });
    }

    if (!target) {
      return interactionOrMessage.reply({ content: 'You must mention a valid user to kick.', ephemeral: false });
    }

    // ✅ Whitelist check
    if (isWhitelisted(target.id)) {
      return interactionOrMessage.reply({
        content: '⚠️ This user is whitelisted and cannot be kicked.',
        ephemeral: true
      });
    }

    const targetMember = await interactionOrMessage.guild.members.fetch(target.id).catch(() => null);
    if (!targetMember || !targetMember.kickable) {
      return interactionOrMessage.reply({ content: 'I cannot kick this user.', ephemeral: false });
    }

    await dmUser(target, 'You were kicked', reason);
    await targetMember.kick(reason);

    incrementPunishment();

    const embed = new EmbedBuilder()
      .setTitle('👢 Member Kicked')
      .setDescription(`${target.tag} was kicked.`)
      .addFields(
        { name: 'Reason', value: reason, inline: true },
        { name: 'Staff', value: `${interactionOrMessage.user.tag}`, inline: true }
      )
      .setColor('Orange')
      .setTimestamp();

    await interactionOrMessage.reply({ embeds: [embed] });
    await logAction(interactionOrMessage.guild, embed, client.config);
  }
};
