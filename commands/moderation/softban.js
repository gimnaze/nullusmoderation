const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logAction = require('../../utils/logAction');
const dmUser = require('../../utils/dmUser');
const { incrementPunishment } = require('../../utils/status'); // ✅ Track punishments
const ms = require('ms'); // Requires `npm install ms`

module.exports = {
  name: 'softban',
  data: new SlashCommandBuilder()
    .setName('softban')
    .setDescription('Temporarily bans a member (softban).')
    .addUserOption(opt => opt.setName('user').setDescription('User to softban').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('e.g. 1h, 2d, 1w').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for softban')),

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

    const durationMs = ms(rawDuration);
    if (!durationMs) {
      return interactionOrMessage.reply({ content: 'Invalid duration format. Try `1h`, `3d`, `1w`, etc.', ephemeral: false });
    }

    const guild = interactionOrMessage.guild;

    if (!targetUser) {
      return interactionOrMessage.reply({ content: 'You must mention a valid user to softban.', ephemeral: false });
    }

    const targetMember = await guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember || !targetMember.bannable) {
      return interactionOrMessage.reply({ content: 'I cannot softban this user.', ephemeral: false });
    }

    await dmUser(targetUser, 'You have been softbanned', `Duration: ${rawDuration}\nReason: ${reason}`);
    await targetMember.ban({ deleteMessageDays: 1, reason });

    incrementPunishment(); // ✅ Count this softban

    // Schedule unban
    setTimeout(async () => {
      try {
        await guild.members.unban(targetUser.id, 'Softban duration expired');
      } catch (e) {
        console.log(`Failed to unban ${targetUser.tag}:`, e);
      }
    }, durationMs);

    const embed = new EmbedBuilder()
      .setTitle('🔨 Member Softbanned')
      .setDescription(`${targetUser.tag} has been softbanned.`)
      .addFields(
        { name: 'Duration', value: rawDuration, inline: true },
        { name: 'Reason', value: reason, inline: true },
        { name: 'Staff', value: `${interactionOrMessage.user.tag}`, inline: true }
      )
      .setColor('DarkRed')
      .setTimestamp();

    await interactionOrMessage.reply({ embeds: [embed] });
    await logAction(guild, embed, config);
  }
};
