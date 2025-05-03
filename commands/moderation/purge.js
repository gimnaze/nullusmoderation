const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'purge',
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete a number of recent messages (under 14 days old).')
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Number of messages to delete (max 100)')
        .setRequired(true)
    ),

  async execute(interactionOrMessage, client, args = []) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const member = interactionOrMessage.member;
    const config = client.config;

    if (!member.roles.cache.has(config.moderatorRoleId)) {
      return interactionOrMessage.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('Permission Denied')
            .setDescription('❌ You do not have permission to use this command.')
        ]
      });
    }

    const amount = isSlash
      ? interactionOrMessage.options.getInteger('amount')
      : parseInt(args[0]);

    if (!amount || isNaN(amount) || amount < 1 || amount > 100) {
      return interactionOrMessage.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Orange')
            .setTitle('Invalid Amount')
            .setDescription('⚠️ Please provide a number between 1 and 100.')
        ]
      });
    }

    const channel = interactionOrMessage.channel;

    try {
      const messages = await channel.bulkDelete(amount, true);
      const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle('Messages Deleted')
        .setDescription(`🧹 Deleted **${messages.size}** message(s) in <#${channel.id}>.`)
        .setFooter({ text: `Requested by ${member.user.tag}` })
        .setTimestamp();

      await interactionOrMessage.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interactionOrMessage.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('Red')
            .setTitle('Error')
            .setDescription('❌ Failed to delete messages. Make sure they are under 14 days old.')
        ]
      });
    }
  }
};
