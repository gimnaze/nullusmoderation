const { ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const punishmentPath = './data/punishmentLog.json';
const warnsPath = path.join(__dirname, '../data/warns.json');

// Ensure punishment file exists
if (!fs.existsSync(punishmentPath)) {
  fs.writeFileSync(punishmentPath, JSON.stringify({ count: 0 }, null, 2));
}

// Ensure warns file exists
if (!fs.existsSync(warnsPath)) {
  fs.writeFileSync(warnsPath, JSON.stringify({ globalCase: 1, warnings: [] }, null, 2));
}

function getPunishmentCount() {
  const data = JSON.parse(fs.readFileSync(punishmentPath));
  return data.count || 0;
}

function incrementPunishment() {
  const data = { count: getPunishmentCount() + 1 };
  fs.writeFileSync(punishmentPath, JSON.stringify(data, null, 2));
}

// For warning system
function getGlobalCaseNumber() {
  const data = JSON.parse(fs.readFileSync(warnsPath));
  return data.globalCase || 1;
}

function incrementGlobalCaseNumber() {
  const data = JSON.parse(fs.readFileSync(warnsPath));
  data.globalCase = (data.globalCase || 1) + 1;
  fs.writeFileSync(warnsPath, JSON.stringify(data, null, 2));
  return data.globalCase - 1;
}

function updateActivity(client) {
  const count = getPunishmentCount();
  client.user.setActivity(`${count} punishments`, {
    type: ActivityType.Watching
  });
}

function startStatusUpdater(client) {
  updateActivity(client); // initial set
  setInterval(() => updateActivity(client), 60 * 1000); // every minute
}

module.exports = {
  getPunishmentCount,
  incrementPunishment,
  startStatusUpdater,
  getGlobalCaseNumber,
  incrementGlobalCaseNumber
};
