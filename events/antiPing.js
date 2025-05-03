const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

const protectedUserIDs = [
  '1277231201190674495',
  '888640419842392084',
  '467715745669971978',
  '774014188288868423'
];

module.exports = async function antiPingHandler(message) {
  if (message.author.bot || !message.guild || !message.mentions.users.size) return;

  const pingedProtected = message.mentions.users.some(user =>
    protectedUserIDs.includes(user.id)
  );

  if (!pingedProtected) return;

  const member = message.member;
  if (
    !member.moderatable ||
    !message.guild.members.me.permissions.has(PermissionsBitField.Flags.ModerateMembers)
  ) {
    console.log(`Insufficient permissions to timeout ${member.user.tag}`);
    return;
  }

  const duration = 5 * 60 * 1000; // 5 minutes

  try {
    // DM the user
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle('🚫 You have been timed out')
        .setColor(0xff9900)
        .setDescription(`You were timed out in **${message.guild.name}** for **5 minutes**.`)
        .addFields(
          {
            name: 'Reason',
            value: 'You pinged protected users.',
          },
          {
            name: 'Pinged',
            value: message.mentions.users
              .filter(u => protectedUserIDs.includes(u.id))
              .map(u => `<@${u.id}>`)
              .join(', '),
          }
        )
        .setTimestamp();

      await member.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.warn(`Could not DM ${member.user.tag}`);
    }

    // Timeout
    await member.timeout(duration, 'Pinged protected user(s)');
    await message.delete();

    // Log
    const logChannel = message.guild.channels.cache.get(config.modLogChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🚫 Anti-Ping Violation')
        .setColor(0xff0000)
        .addFields(
          { name: 'User', value: `<@${member.id}> (${member.user.tag})`, inline: false },
          { name: 'Action', value: 'Timed out for 5 minutes', inline: false },
          {
            name: 'Reason',
            value: `Pinged: ${message.mentions.users
              .filter(u => protectedUserIDs.includes(u.id))
              .map(u => `<@${u.id}>`)
              .join(', ')}`,
            inline: false,
          },
          { name: 'Message Link', value: `[Jump to message](${message.url})`, inline: false }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }
  } catch (err) {
    console.error('Error in Anti-Ping handler:', err);
  }
};
