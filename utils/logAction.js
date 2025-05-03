module.exports = async function logAction(guild, embed, config) {
    const channel = guild.channels.cache.get(config.modLogChannelId);
    if (channel) channel.send({ embeds: [embed] });
  };  