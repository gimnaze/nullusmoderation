const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const logAction = require('../../utils/logAction');
const dmUser = require('../../utils/dmUser');
const isWhitelisted = require('../../utils/whitelist');

// Cooldown config
const COOLDOWN_LIMIT = 3; // max bans allowed
const BYPASS_ROLE_IDS = ['1325300560806678682', '1385457900075487293', '1341158549996437585', '1325300560173469798', '1325300559116501024', '1325300558365589534' ]; // role that can bypass cooldown
const SECURITY_ROLE_ID = 'YOUR_SECURITY_SPECIALIST_ROLE_ID'; // role to ping on threshold

// Memory-based cooldown tracker
const banCooldowns = new Map();

// Function to schedule hourly reset at exactly :00 UTC
function scheduleHourlyReset() {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setUTCMinutes(0, 0, 0);
  nextHour.setUTCHours(nextHour.getUTCHours() + 1);
  const delay = nextHour.getTime() - now.getTime();

  setTimeout(() => {
    banCooldowns.clear();
    console.log('[Cooldown] Ban cooldowns reset at top of the hour (UTC).');

    setInterval(() => {
      banCooldowns.clear();
      console.log('[Cooldown] Ban cooldowns reset at top of the hour (UTC).');
    }, 60 * 60 * 1000);
  }, delay);
}

scheduleHourlyReset();

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

    if (isWhitelisted(targetUser.id)) {
      return interactionOrMessage.reply({
        content: '⚠️ This user is whitelisted and cannot be banned.',
        ephemeral: false
      });
    }

    const targetMember = await interactionOrMessage.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember || !targetMember.bannable) {
      return interactionOrMessage.reply({
        content: 'I cannot ban this user.',
        ephemeral: false
      });
    }

    const modId = interactionOrMessage.user.id;
    const bypass = BYPASS_ROLE_IDS.some(roleId => member.roles.cache.has(roleId));

    if (!bypass) {
      const count = banCooldowns.get(modId) || 0;

      if (count >= COOLDOWN_LIMIT) {
        return interactionOrMessage.reply({
          content: `⛔ You’ve hit the hourly ban limit of ${COOLDOWN_LIMIT}. Please wait until the next hour (UTC) or contact a Security Specialist.`,
          ephemeral: true
        });
      }

      banCooldowns.set(modId, count + 1);

      if (count + 1 === COOLDOWN_LIMIT) {
        const alertEmbed = new EmbedBuilder()
          .setTitle('⚠️ Ban Threshold Reached')
          .setDescription(`<@${modId}> has reached the hourly ban limit.`)
          .setColor('Orange')
          .setTimestamp();

       const alertChannel = await client.channels.fetch(client.config.alertChannelId).catch(() => null);
        if (alertChannel) {
          await alertChannel.send({
            content: `<@&${SECURITY_ROLE_ID}> please review.`,
            embeds: [alertEmbed]
          });
        }
      }
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
