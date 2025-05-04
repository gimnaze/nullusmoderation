const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

const protectedUserIDs = [
  '1277231201190674495',
  '888640419842392084',
  '467715745669971978',
  '705832816344170566'
];

module.exports = async function antiPingHandler(message) {
  if (message.author.bot || !message.guild || !message.mentions.users.size) return;

  // Check if the protected user was directly mentioned in the message content
  const mentionedProtectedUsers = message.mentions.users.filter(user =>
    protectedUserIDs.includes(user.id)
  );

  // If no protected users were mentioned directly, ignore
  if (mentionedProtectedUsers.size === 0) return;

  // Prevent punishing replies that don't directly mention the protected user in the message body
  if (message.reference) {
    const repliedMessage = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
    if (repliedMessage && protectedUserIDs.includes(repliedMessage.author.id)) {
      // If it's a reply to a protected user, but no explicit ping in message, ignore
      const pingedInContent = mentionedProtectedUsers.some(user => message.content.includes(`<@${user.id}>`) || message.content.includes(`<@!${user.id}>`));
      if (!pingedInContent) return;
    }
  }

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
          { name: 'Reason', value: 'You pinged protected users.' },
          {
            name: 'Pinged',
            value: [...mentionedProtectedUsers.values()]
              .map(u => `<@${u.id}>`)
              .join(', '),
          }
        )
        .setTimestamp();

      await member.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.warn(`Could not DM ${member.user.tag}`);
    }

    await member.timeout(duration, 'Pinged protected user(s)');
    await message.delete();

    const timeoutEmbed = new EmbedBuilder()
      .setTitle('🚫 Action Taken: Timeout')
      .setColor(0xff0000)
      .setDescription(`<@${member.id}> Do not ping the protected users. You have been muted for 5 minutes.`)
      .addFields(
        {
          name: 'Reason',
          value: `Pinged protected user(s): ${[...mentionedProtectedUsers.values()]
            .map(u => `<@${u.id}>`)
            .join(', ')}`,
        },
        { name: 'Duration', value: '5 minutes' }
      )
      .setTimestamp();

    await message.channel.send({ embeds: [timeoutEmbed] });

    const logChannel = message.guild.channels.cache.get(config.modLogChannelId);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle('🚫 Anti-Ping Violation')
        .setColor(0xff0000)
        .addFields(
          { name: 'User', value: `<@${member.id}> (${member.user.tag})` },
          { name: 'Action', value: 'Timed out for 5 minutes' },
          {
            name: 'Reason',
            value: `Pinged: ${[...mentionedProtectedUsers.values()]
              .map(u => `<@${u.id}>`)
              .join(', ')}`,
          },
          { name: 'Message Link', value: `[Jump to message](${message.url})` }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });
    }
  } catch (err) {
    console.error('Error in Anti-Ping handler:', err);
  }
};
