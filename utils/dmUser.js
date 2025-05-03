module.exports = async function dmUser(user, title, description) {
    try {
      const { EmbedBuilder } = require('discord.js');
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor('Red')
        .setTimestamp();
      await user.send({ embeds: [embed] });
    } catch (err) {
      console.log(`Failed to DM ${user.tag}`);
    }
  };
  