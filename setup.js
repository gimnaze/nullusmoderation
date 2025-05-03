const fs = require('fs');
const inquirer = require('inquirer').default; // 👈 for compatibility with v9+

const questions = [
  { type: 'input', name: 'token', message: 'Enter your bot token:' },
  { type: 'input', name: 'clientId', message: 'Enter your bot client ID:' },
  { type: 'input', name: 'guildId', message: 'Enter your test server Guild ID:' },
  { type: 'input', name: 'prefix', message: 'Enter your command prefix:', default: '.' },
  { type: 'input', name: 'moderatorRoleId', message: 'Enter the Moderator Role ID:' },
  { type: 'input', name: 'headAdminRoleId', message: 'Enter the Head Admin Role ID:' },
  { type: 'input', name: 'muteRoleId', message: 'Enter the Mute Role ID:' },
  { type: 'input', name: 'modLogChannelId', message: 'Enter the Mod Log Channel ID:' },
  { type: 'input', name: 'githubRepo', message: 'Enter the GitHub repo URL (for auto-update):' },
  {
    type: 'input',
    name: 'updateCheckIntervalMinutes',
    message: 'Update check interval (minutes):',
    default: '15',
    validate: input => (!isNaN(input) && input > 0) ? true : 'Please enter a valid number'
  }
];

inquirer.prompt(questions).then(answers => {
  fs.writeFileSync('./config.json', JSON.stringify(answers, null, 2));
  console.log('✅ Configuration saved to config.json');
});
