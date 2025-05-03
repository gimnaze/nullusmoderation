const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'role',
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Assign a role to a user.')
    .addUserOption(opt => opt.setName('user').setDescription('User to assign the role to').setRequired(true))
    .addRoleOption(opt => opt.setName('role').setDescription('Role to assign').setRequired(true)),

  async execute(interactionOrMessage, client, args = []) {
    const isSlash = interactionOrMessage.isChatInputCommand?.();
    const member = interactionOrMessage.member;
    const config = client.config;

    if (!member.roles.cache.has(config.headAdminRoleId)) {
      return interactionOrMessage.reply({ content: 'You do not have permission to use this command.', ephemeral: false });
    }

    const targetUser = isSlash
      ? interactionOrMessage.options.getUser('user')
      : interactionOrMessage.mentions.users.first();

    const role = isSlash
      ? interactionOrMessage.options.getRole('role')
      : interactionOrMessage.mentions.roles.first();

    if (!targetUser || !role) {
      return interactionOrMessage.reply({ content: 'Please provide a valid user and role.', ephemeral: false });
    }

    const targetMember = await interactionOrMessage.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      return interactionOrMessage.reply({ content: 'User not found in this server.', ephemeral: false });
    }

    const executorHighest = member.roles.highest.position;
    if (role.position >= executorHighest) {
      return interactionOrMessage.reply({ content: 'You cannot assign a role equal to or higher than your highest role.', ephemeral: false });
    }

    await targetMember.roles.add(role);

    const embed = new EmbedBuilder()
      .setTitle('Role Assigned')
      .setDescription(`${role.name} has been assigned to ${targetUser.tag}.`)
      .setColor('Blurple')
      .setTimestamp();

    await interactionOrMessage.reply({ embeds: [embed] });
  }
};
