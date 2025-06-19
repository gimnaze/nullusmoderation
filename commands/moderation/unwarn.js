const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { removeWarningByCase } = require('../../utils/warnings');
const logAction = require('../../utils/logAction');

module.exports = {
  name: 'unwarn',
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Remove a warning by global case number.')
    .addIntegerOption(opt =>
      opt.setName('case')
        .setDescription('The global case number to remove')
        .setRequired(true)
    ),

  async execute(interactionOrMessage, client, args = []) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const member = interactionOrMessage.member;
    const config = client.config;

    if (!member.roles.cache.has(config.moderatorRoleId)) {
      return interactionOrMessage.reply({ content: '❌ You do not have permission to use this command.', ephemeral: false });
    }

    const caseNumber = isSlash
      ? interactionOrMessage.options.getInteger('case')
      : parseInt(args[0]);

    if (!caseNumber || isNaN(caseNumber)) {
      return interactionOrMessage.reply({ content: '⚠️ Please provide a valid case number.', ephemeral: false });
    }

    const removedWarning = removeWarningByCase(caseNumber);

    if (!removedWarning) {
      return interactionOrMessage.reply({ content: `⚠️ Case #${caseNumber} not found.`, ephemeral: false });
    }

    const user = await client.users.fetch(removedWarning.userId).catch(() => null);
    const userTag = user ? user.tag : `Unknown User (${removedWarning.userId})`;
    const mention = user ? `<@${user.id}>` : removedWarning.userId;

    await interactionOrMessage.reply(`✅ Successfully removed warning case #${caseNumber} for ${mention}.`);

    const embed = new EmbedBuilder()
      .setTitle('Warning Removed')
      .addFields(
        { name: 'Case Number', value: `#${caseNumber}`, inline: true },
        { name: 'User', value: `${mention} (${userTag})`, inline: true },
        { name: 'Moderator', value: member.user.tag, inline: true },
        { name: 'Original Reason', value: removedWarning.reason || 'No reason provided.' }
      )
      .setColor('Green')
      .setTimestamp();

    await logAction(interactionOrMessage.guild, embed, config);
  }
};
