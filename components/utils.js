// Copyright (C) 2020 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const jwt = require('jsonwebtoken');
const path = require('path');
const { readFile } = require('atomically');

if (!Object.prototype.hasOwnProperty.call(Object, 'hasOwn')) {
    /**
     * Determines whether an object has a property with the specified name.
     * @param {Object} object The JavaScript object instance to test.
     * @param {String} property The {@link String} name or {@link Symbol} of the property to test.
     * @returns {Boolean} `true` if the specified object has directly defined the specified property. Otherwise `false`
     */
    Object.hasOwn = function hasOwn(object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    }
}

function getServerVerObj(gameVersion) {
    if (gameVersion === 'h1') {
        return {
            _Major: 6,
            _Minor: 74,
            _Build: 61,
            _Revision: 0,
        };
    } else if (gameVersion === 'h2') {
        return {
            _Major: 7,
            _Minor: 21,
            _Build: 0,
            _Revision: 16,
        };
    } else {
        return {
            _Major: 8,
            _Minor: 7,
            _Build: 0,
            _Revision: 32,
        };
    }
}

const UUIDRegex = /^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/;

function extractToken(req, res, next) {
    let auth = req.header('Authorization') ? req.header('Authorization').split(' ') : [];
    if (auth.length === 2 && auth[0].toLowerCase() === "bearer") {
        req.jwt = jwt.decode(auth[1]); // I'm not going to verify the token
        if (!UUIDRegex.test(req.jwt.unique_name)) {
            console.warn('user sent jwt with non-uuid user id');
            res.status(400).end();
            return;
        }
        next && next();
        return;
    }
    console.warn(`invalid auth token for url ${req.originalUrl}`);
    res.status(401).end();
}

const MaxPlayerLevel = 5000;

function xpRequiredForLevel(level) {
    return level * 6000 - 6000;
}

function maxLevelForLocation(location, gameVersion) {
    switch (location.toUpperCase()) {
        case 'LOCATION_PARIS':
        case 'LOCATION_PARENT_COASTALTOWN':
        case 'LOCATION_MARRAKECH':
        case 'LOCATION_COLORADO':
        case 'LOCATION_BANGKOK':
        case 'LOCATION_HOKKAIDO':
        case 'LOCATION_MIAMI':
        case 'LOCATION_COLOMBIA':
        case 'LOCATION_MUMBAI':
        case 'LOCATION_NORTHSEA':
        case 'LOCATION_OPULENT':
        case 'LOCATION_AUSTRIA':
        case 'LOCATION_SALTY':
        case 'LOCATION_CAGED':
        case 'LOCATION_GOLDEN':
        case 'LOCATION_ANCESTRAL':
        case 'LOCATION_EDGY':
        case 'LOCATION_WET':
        case 'LOCATION_ELEGANT':
            return 20;
        case 'LOCATION_GREEDY':
        case 'LOCATION_NORTHAMERICA':
            if (gameVersion === 'h3') {
                return 20;
            } else {
                return 15;
            }
        case 'LOCATION_NEWZEALAND':
        case 'LOCATION_TRAPPED':
            return 5;
        case 'LOCATION_ICA_FACILITY':
            return 1;
    }
    return 1;
}

function getLocationCompletion(location, locationProgression) {
    return (locationProgression.Level === maxLevelForLocation(location)) ? 1 :
        (locationProgression.Xp - xpRequiredForLevel(locationProgression.Level)) /
        (xpRequiredForLevel(locationProgression.Level + 1) - xpRequiredForLevel(locationProgression.Level));
}

function getGameVersionFromJWTPis(pis) {
    switch (pis) { // set ServerVersion from jwt (appid from login token)
        case '54504350291134065': // hitman 1 gog
        case 'egp_io_interactive_hitman_the_complete_first_season': // hitman 1 epic
        case '236870': // hitman 1 steam appid
            return 'h1';
        case '863550': // hitman 2 steam appid
            return 'h2';
        case 'fghi4567xQOCheZIin0pazB47qGUvZw4': // hitman 3 epic
        case '1659040': // hitman 3 retail steam appid
        case '1847520': // hitman 3 demo steam appid
            return 'h3';
    }
    //console.error(`Could not get version from jwt pis: ${pis}`);
    return 'h3';
}

function getGameVersionFromServerVersion(serverVersion) {
    if (serverVersion.startsWith('6')) {
        return 'h1';
    } else if (serverVersion.startsWith('7')) {
        return 'h2';
    } else if (serverVersion.startsWith('8')) {
        return 'h3';
    }
    console.error(`Could not get version from server version: ${serverVersion}`);
    return 'h3';
}

async function getTemplate(endpoint, gameVersion) {
    return await readFile(path.join('menudata', gameVersion, 'menudata', 'templates', `${endpoint}.json`)).then(fileData => {
        return JSON.parse(fileData);
    }).catch(err => {
        if (err.code !== 'ENOENT') { // if other error than non-existant file
            console.log(err);
        }
        return null;
    });
}

function getDefaultLoadout(location, gameVersion) {
    return {
        2: gameVersion === 'h1' ? 'FIREARMS_HERO_PISTOL_TACTICAL_001_SU_SKIN01' : 'FIREARMS_HERO_PISTOL_TACTICAL_ICA_19',
        3: ((location) => {
            switch (location) {
                case 'LOCATION_PARENT_ICA_FACILITY':
                    return 'TOKEN_OUTFIT_GREENLAND_HERO_TRAININGSUIT';
                case 'LOCATION_PARENT_PARIS':
                    return 'TOKEN_OUTFIT_PARIS_HERO_PARISSUIT';
                case 'LOCATION_PARENT_COASTALTOWN':
                    return 'TOKEN_OUTFIT_SAPIENZA_HERO_SAPIENZASUIT';
                case 'LOCATION_PARENT_MARRAKECH':
                    return 'TOKEN_OUTFIT_MARRAKESH_HERO_MARRAKESHSUIT';
                case 'LOCATION_PARENT_BANGKOK':
                    return 'TOKEN_OUTFIT_BANGKOK_HERO_BANGKOKSUIT';
                case 'LOCATION_PARENT_COLORADO':
                    return 'TOKEN_OUTFIT_COLORADO_HERO_COLORADOSUIT';
                case 'LOCATION_PARENT_HOKKAIDO':
                    return 'TOKEN_OUTFIT_HOKKAIDO_HERO_HOKKAIDOSUIT';
                case 'LOCATION_PARENT_NEWZEALAND':
                    return 'TOKEN_OUTFIT_NEWZEALAND_HERO_NEWZEALANDSUIT';
                case 'LOCATION_PARENT_MIAMI':
                    return 'TOKEN_OUTFIT_MIAMI_HERO_MIAMISUIT';
                case 'LOCATION_PARENT_COLOMBIA':
                    return 'TOKEN_OUTFIT_COLOMBIA_HERO_COLOMBIASUIT';
                case 'LOCATION_PARENT_MUMBAI':
                    return 'TOKEN_OUTFIT_MUMBAI_HERO_MUMBAISUIT';
                case 'LOCATION_PARENT_NORTHAMERICA':
                    return 'TOKEN_OUTFIT_NORTHAMERICA_HERO_NORTHAMERICASUIT';
                case 'LOCATION_PARENT_NORTHSEA':
                    return 'TOKEN_OUTFIT_NORTHSEA_HERO_NORTHSEASUIT';
                case 'LOCATION_PARENT_GREEDY':
                    return 'TOKEN_OUTFIT_GREEDY_HERO_GREEDYSUIT';
                case 'LOCATION_PARENT_OPULENT':
                    return 'TOKEN_OUTFIT_OPULENT_HERO_OPULENTSUIT';
                case 'LOCATION_PARENT_GOLDEN':
                    return 'TOKEN_OUTFIT_HERO_GECKO_SUIT';
                case 'LOCATION_PARENT_ANCESTRAL':
                    return 'TOKEN_OUTFIT_ANCESTRAL_HERO_ANCESTRALSUIT';
                case 'LOCATION_PARENT_EDGY':
                    return 'TOKEN_OUTFIT_EDGY_HERO_EDGYSUIT';
                case 'LOCATION_PARENT_WET':
                    return 'TOKEN_OUTFIT_WET_HERO_WETSUIT';
                case 'LOCATION_PARENT_ELEGANT':
                    return 'TOKEN_OUTFIT_ELEGANT_HERO_LLAMASUIT';
                case 'LOCATION_PARENT_TRAPPED':
                    return 'TOKEN_OUTFIT_TRAPPED_WOLVERINE_SUIT';
                case 'LOCATION_PARENT_ROCKY':
                    return 'TOKEN_OUTFIT_HERO_DUGONG_SUIT';
                default:
                    return 'TOKEN_OUTFIT_HITMANSUIT';
            }
        })(location),
        4: 'TOKEN_FIBERWIRE',
        5: 'PROP_TOOL_COIN',
    };
}

function unlockOrderComparer(a, b) {
    if (a.Properties.UnlockOrder === undefined) {
        if (b.Properties.UnlockOrder === undefined) {
            return 0; // undef == undef
        }
        return 1; // undef > *
    }
    if (b.Properties.UnlockOrder === undefined) {
        return -1; // * < undef
    }

    return a.Properties.UnlockOrder - b.Properties.UnlockOrder;
}

module.exports = {
    extractToken,
    getServerVerObj,
    MaxPlayerLevel,
    xpRequiredForLevel,
    maxLevelForLocation,
    getLocationCompletion,
    getGameVersionFromJWTPis,
    getGameVersionFromServerVersion,
    getTemplate,
    UUIDRegex,
    getDefaultLoadout,
    unlockOrderComparer,
};
