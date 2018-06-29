const Command = require('command')

module.exports = function AutoBeer(dispatch) {
    const command = Command(dispatch);
    const ROOT_BEER_ID = 80081;

    let gameId = null,
        retry = null,
        inCombat = false,
        inCd = false,
        enabled = true,
        disableDrunk = false;

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
            drinkBeer(5); // try 5 times
        }
    });

    dispatch.hook('S_START_COOLTIME_ITEM', 1, event => { 
        let cooldown = event.cooldown;
        if (event.item === ROOT_BEER_ID) {
            if (retry) {
                clearTimeout(retry);
                retry = null;
            }
            inCd = true;
            setTimeout(() => {
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

    function drinkBeer(retry) {
        if (retry < 0) return;
        // Retry in 100ms
        if (inCd) {
            retry = setTimeout(drinkBeer.bind(retry - 1), 100);
        } else {
            dispatch.toServer('C_USE_ITEM', 3, {
                gameId: gameId,
                id: ROOT_BEER_ID
            });
        }
    }

    command.add('beer', (arg) => {
        enabled = !enabled;
        if (arg && arg.toLowerCase() === "drunk") {
            disableDrunk = !disableDrunk;
            command.message('(AutoBeer) ' + (disableDrunk ? 'Disabling Drunk Screen' : 'Enabling Drunk Screen'));
        }
        command.message('(AutoBeer) ' + (enabled ? 'enabled' : 'disabled'));
    });
}
