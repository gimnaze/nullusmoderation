const fs = require('fs');
const path = require('path');

const warnsFile = path.join(__dirname, '../data/warns.json');

// Ensure the warns file exists and has correct structure
function ensureWarnsFile() {
  if (!fs.existsSync(warnsFile)) {
    fs.writeFileSync(warnsFile, JSON.stringify({ globalCase: 1, warnings: [] }, null, 2));
  }

  const data = JSON.parse(fs.readFileSync(warnsFile, 'utf8'));

  let changed = false;
  if (typeof data.globalCase !== 'number') {
    data.globalCase = 1;
    changed = true;
  }

  if (!Array.isArray(data.warnings)) {
    data.warnings = [];
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(warnsFile, JSON.stringify(data, null, 2));
  }

  return data;
}

// Add a new warning and return the global case number
function addWarning(warning) {
  const data = ensureWarnsFile();
  const caseNumber = data.globalCase++;

  warning.case = caseNumber;
  data.warnings.push(warning);

  fs.writeFileSync(warnsFile, JSON.stringify(data, null, 2));
  return caseNumber;
}

// Get all warnings for a specific user
function getWarningsForUser(userId) {
  const data = ensureWarnsFile();
  return data.warnings.filter(w => w.userId === userId);
}

// Remove a warning by its global case number and return the removed warning
function removeWarningByCase(caseNumber) {
  const data = ensureWarnsFile();
  const index = data.warnings.findIndex(w => w.case === parseInt(caseNumber));
  if (index === -1) return null;

  const [removed] = data.warnings.splice(index, 1);
  fs.writeFileSync(warnsFile, JSON.stringify(data, null, 2));
  return removed;
}

module.exports = {
  addWarning,
  getWarningsForUser,
  removeWarningByCase
};
