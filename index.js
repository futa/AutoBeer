const Command = require('command')

module.exports = function AutoBeer(dispatch) {
    const command = Command(dispatch);
    const ROOT_BEER_ID = 80081;

    let gameId = null,
        retry = null,
        isEnraged = false,
        inCombat = false,
        inCd = false,
        enabled = false,
        disableDrunk = false,
        debug = false;

    dispatch.hook('S_LOGIN', 10, event => {
        gameId = event.gameId;
    });

    dispatch.hook('S_USER_STATUS', 1, event => {
        if (event.target.equals(gameId)) {
            inCombat = event.status === 1;
        }
    });

    dispatch.hook('S_NPC_STATUS', 1, (event) => {
        if (!enabled) return;
        if (event.enraged === 1 && inCombat) {
            if (debug) {
                command.message('(AutoBeer) Boss enraged, in combat, drinking');
            }
            isEnraged = true;
            drinkBeer(1); // try 1 times
        } else if (event.enraged === 0) {
            if (debug) {
                command.message('(AutoBeer) Boss unenraged');
            }
            isEnraged = false;
        }
    });

    dispatch.hook('S_START_COOLTIME_ITEM', 1, event => {
        if (!enabled) return;
        let cooldown = event.cooldown;
        if (event.item === ROOT_BEER_ID) {
            if (debug) {
                command.message('(AutoBeer) Beer on cooldown');
            }
            if (retry) {
                clearTimeout(retry);
                retry = null;
            }
            inCd = true;
            setTimeout(() => {
                if (debug) {
                    command.message('(AutoBeer) Beer not on cooldown');
                }
                inCd = false;
            }, cooldown * 1000)
        }
    });

    dispatch.hook('S_ABNORMALITY_BEGIN', 2, (event) => {
        if (!disableDrunk) return;
        if (
            event.id == "48733" ||
            event.id == "48734" ||
            event.id == "48735" ||
            event.id == "48736" ||
            event.id == "48737" ||
            event.id == "48738" ||
            event.id == "48739" ||
            event.id == "70234" ||
            event.id == "70235" ||
            event.id == "70236" ||
            event.id == "70237" ||
            event.id == "70238" ||
            event.id == "905434"
        ) {
            return false;
        }
    });

    function drinkBeer(retryTimes) {
        if (!isEnraged || retryTimes < 0) return;
        // Retry in 100ms
        if (inCd && !retry) {
            if (debug) {
                command.message('(AutoBeer) Beer on cd, retry in 100ms');
            }
            retry = setTimeout(drinkBeer.bind(retryTimes - 1), 100);
        } else {
            if (debug) {
                command.message('(AutoBeer) Actually drinking beer');
            }
            dispatch.toServer('C_USE_ITEM', 3, {
                gameId: gameId,
                id: ROOT_BEER_ID
            });
        }
    }

    command.add('beer', (arg) => {
        if (arg) {
            let a = arg.toLowerCase();
            switch (a) {
                case "drunk":
                    disableDrunk = !disableDrunk;
                    command.message('(AutoBeer) ' + (disableDrunk ? 'Disabling Drunk Screen' : 'Enabling Drunk Screen'));
                    break;
                case "debug":
                    debug = !debug;
                    command.message('(AutoBeer) ' + (debug ? 'Enabling debug mode' : 'Disabling debug mode'));
                    break;
            }
        } else {
            enabled = !enabled;
            command.message('(AutoBeer) ' + (enabled ? 'enabled' : 'disabled'));
        }
    });
}
