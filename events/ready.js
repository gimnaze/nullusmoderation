module.exports = {
    name: 'ready',
    async execute(client) {
      console.log(`Logged in as ${client.user.tag}`);
      await require('../deploy-commands')(client);
    }
  };  