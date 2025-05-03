const simpleGit = require('simple-git');
const { exec } = require('child_process');

const REPO_URL = 'https://github.com/gimnaze/nullusmoderation.git'; // ← Replace this with your repo
const BRANCH = 'main'; // or 'master'
const CHECK_INTERVAL_MINUTES = 15;

const git = simpleGit();
let alreadyPulledOnce = false;

async function checkAndUpdate() {
  try {
    // Ensure the remote is always set to your repo
    const remotes = await git.getRemotes(true);
    const originExists = remotes.some(r => r.name === 'origin');
    if (!originExists) {
      await git.addRemote('origin', REPO_URL);
    } else {
      await git.remote(['set-url', 'origin', REPO_URL]);
    }

    console.log('🔄 Checking for updates from GitHub...');
    await git.fetch();
    const status = await git.status();

    if (status.behind > 0) {
      console.log(`⬇️ Pulling ${status.behind} update(s) from GitHub...`);
      await git.pull('origin', BRANCH);
      console.log('✅ Update pulled. Restarting bot...');
      restartBot();
    } else if (!alreadyPulledOnce) {
      console.log('✅ No updates found.');
      alreadyPulledOnce = true;
    }
  } catch (err) {
    console.error('❌ Auto-update check failed:', err);
  }
}

function restartBot() {
  exec('npm restart', (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Failed to restart bot:', err);
      return;
    }
    console.log(stdout);
    console.error(stderr);
    process.exit(0);
  });
}

async function autoUpdateAndRestart() {
  await checkAndUpdate();

  // Then check every 15 minutes
  setInterval(checkAndUpdate, CHECK_INTERVAL_MINUTES * 60 * 1000);
}

module.exports = { autoUpdateAndRestart };
