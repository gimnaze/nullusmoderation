const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logAction = require('../../utils/logAction');
const dmUser = require('../../utils/dmUser');
const { incrementPunishment } = require('../../utils/status'); // ✅ Add this
const ms = require('ms'); // Requires `npm install ms`

module.exports = {
  name: 'mute',
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user for a specific duration.')
    .addUserOption(opt => opt.setName('user').setDescription('User to mute').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('e.g. 1h, 3d, 10d').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for muting')),

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

    const rawDuration = isSlash
      ? interactionOrMessage.options.getString('duration')
      : args[1];

    const reason = isSlash
      ? interactionOrMessage.options.getString('reason') || 'No reason provided.'
      : args.slice(2).join(' ') || 'No reason provided.';

    if (!targetUser) {
      return interactionOrMessage.reply({ content: 'Please mention a valid user to mute.', ephemeral: false });
    }

    const durationMs = ms(rawDuration);
    if (!durationMs) {
      return interactionOrMessage.reply({ content: 'Invalid duration format. Try `1h`, `3d`, `10d`, etc.', ephemeral: false });
    }

    const targetMember = await interactionOrMessage.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember || !targetMember.moderatable) {
      return interactionOrMessage.reply({ content: 'I cannot mute this user.', ephemeral: false });
    }

    let actionType;
    if (durationMs <= 7 * 24 * 60 * 60 * 1000) { // 7 days
      await targetMember.timeout(durationMs, reason);
      actionType = `Timed mute (${rawDuration})`;
    } else {
      const muteRole = interactionOrMessage.guild.roles.cache.get(config.muteRoleId);
      if (!muteRole) {
        return interactionOrMessage.reply({ content: 'Mute role not found. Check your config.', ephemeral: false });
      }

      await targetMember.roles.add(muteRole, reason);
      actionType = `Role mute (over 7 days)`;
    }

    incrementPunishment(); // ✅ Count this mute

    await dmUser(targetUser, 'You have been muted', `${actionType}\nReason: ${reason}`);

    const embed = new EmbedBuilder()
      .setTitle('🔇 Member Muted')
      .setDescription(`${targetUser.tag} has been muted.`)
      .addFields(
        { name: 'Duration', value: rawDuration, inline: true },
        { name: 'Reason', value: reason, inline: true },
        { name: 'Staff', value: `${interactionOrMessage.user.tag}`, inline: true }
      )
      .setColor('Yellow')
      .setTimestamp();

    await interactionOrMessage.reply({ embeds: [embed] });
    await logAction(interactionOrMessage.guild, embed, config);
  }
};
