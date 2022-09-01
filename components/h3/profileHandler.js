// Copyright (C) 2020-2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');
const path = require('path');
const { writeFile, readFile } = require('atomically');
const uuid = require('uuid');


const { MaxPlayerLevel, UUIDRegex } = require('../utils.js');
const { getEntitlements } = require('./platformEntitlements.js');

const app = express.Router();

// /authentication/api/userchannel/

app.post('/ProfileService/GetPlatformEntitlements', express.json(), getEntitlements);

app.post('/AuthenticationService/GetBlobOfflineCacheDatabaseDiff', (req, res) => {
    // Which menu files should be loaded from the server?
    res.json([
        'menusystem/pages/hub/dashboard/dashboard.json',
        'menusystem/pages/hub/hub_page.json',
        'menusystem/pages/hub/dashboard/category_escalation/result.json',
        'menusystem/pages/result/versusresult_content.json',
        'menusystem/pages/multiplayer/content/lobbyslim.json',
    ]);
});

app.post('/ProfileService/UpdateUserSaveFileTable', (req, res) => {
    res.status(204).end();
});

app.post('/ProfileService/UpdateProfileStats', express.json(), async (req, res) => {
    if (req.jwt.unique_name !== req.body.id) {
        res.status(403).end(); // data submitted for different profile id
        return;
    }
    let userdata = JSON.parse(await readFile(path.join('userdata', req.gameVersion, 'users', `${req.jwt.unique_name}.json`)));

    userdata.Gamertag = req.body.gamerTag;
    userdata.Extensions.achievements = req.body.achievements;

    writeFile(path.join('userdata', req.gameVersion, 'users', `${req.jwt.unique_name}.json`), JSON.stringify(userdata), { fsyncWait: false });
    res.status(204).end();
});

app.post('/ProfileService/SynchronizeOfflineUnlockables', (req, res) => {
    // TODO: add submitted items to inventory (for this session)
    res.status(204).end();
});

app.post('/ProfileService/GetUserConfig', (req, res) => {
    res.json({});
});

app.post('/ProfileService/GetProfile', express.json(), async (req, res) => {
    if (req.body.id !== req.jwt.unique_name) {
        res.status(403).end(); // data requested for different profile id
        console.log(`user ${req.jwt.unique_name} requested profile of ${req.body.id}`);
        return;
    }
    let userdata = JSON.parse(await readFile(path.join('userdata', req.gameVersion, 'users', `${req.jwt.unique_name}.json`)));
    for (let extension in userdata.Extensions) {
        if (!req.body.extensions.includes(extension)) {
            delete userdata[extension];
        }
    }

    res.json(userdata);
});

app.post('/UnlockableService/GetInventory', async (req, res) => {
    res.json(JSON.parse(await readFile(path.join('userdata', req.gameVersion, 'users', `${req.jwt.unique_name}.json`))).Extensions.inventory);
});

app.post('/ProfileService/UpdateExtensions', express.json(), async (req, res) => {
    if (req.body.id !== req.jwt.unique_name) { // data requested for different profile id
        res.status(403).end();
        return;
    }
    let userdata = JSON.parse(await readFile(path.join('userdata', req.gameVersion, 'users', `${req.jwt.unique_name}.json`)));
    const response = {};
    for (const extension in userdata.Extensions) {
        if (Object.hasOwn(req.body.extensionsData, extension)) {
            // TODO: restrict further; is this ever called with anything other than 'friends'?
            userdata.Extensions[extension] = req.body.extensionsData[extension];
            response[extension] = req.body.extensionsData[extension];
        }
    }
    writeFile(path.join('userdata', req.gameVersion, 'users', `${req.jwt.unique_name}.json`), JSON.stringify(userdata), { fsyncWait: false });
    res.json(response);
});

app.post('/ProfileService/SynchroniseGameStats', express.json(), async (req, res) => {
    if (req.body.profileId !== req.jwt.unique_name) { // data requested for different profile id
        res.status(403).end();
        return;
    }
    let userdata = JSON.parse(await readFile(path.join('userdata', req.gameVersion, 'users', `${req.jwt.unique_name}.json`)));

    userdata.Extensions.gamepersistentdata.__stats = req.body.localStats;

    writeFile(path.join('userdata', req.gameVersion, 'users', `${req.jwt.unique_name}.json`), JSON.stringify(userdata), { fsyncWait: false });
    res.json({
        Inventory: userdata.Extensions.inventory,
        Stats: req.body.localStats,
    });
});

async function resolveProfiles(profileIDs, gameVersion) {
    return (await Promise.allSettled(profileIDs.map(id => {
        if (!UUIDRegex.test(id)) {
            return Promise.reject('Tried to resolve malformed profile id');
        }
        return readFile(path.join('userdata', gameVersion, 'users', `${id}.json`));
    }))).map(outcome => {
        if (outcome.status === 'fulfilled') {
            let userdata = JSON.parse(outcome.value);
            userdata.Extensions = {};
            return userdata;
        } else {
            if (outcome.reason.code === 'ENOENT') {
                console.error(`Attempted to resolve unknown profile: ${path.basename(outcome.reason.path, '.json')}`);
                return null;
            } else {
                console.error(outcome.reason);
                return null;
            }
        }
    }).filter(data => data); // filter out nulls
}

app.post('/ProfileService/ResolveProfiles', express.json(), async (req, res) => {
    res.json(await resolveProfiles(req.body.profileIDs, req.gameVersion));
});

app.post('/ProfileService/ResolveGamerTags', express.json(), async (req, res) => {
    // Todo?: not sure how this works
    let profiles = await resolveProfiles(req.body.profileIds, req.gameVersion);
    let result = {};
    for (const profile of profiles) {
        if (profile.LinkedAccounts.dev) {
            result.dev = result.dev || {};
            result.dev[profile.Id] = "";
        } else if (profile.Gamertag) {
            result.steam = result.steam || {};
            result.steam[profile.Id] = profile.Gamertag;
        }
    }

    res.json(result);
});

app.post('/ProfileService/GetFriendsCount', async (req, res) => {
    let userdata = JSON.parse(await readFile(path.join('userdata', req.gameVersion, 'users', `${req.jwt.unique_name}.json`)));
    // TODO: This should actually return the number of friends that also own the game
    res.json(userdata.Extensions.friends.length);
});

app.post('/GamePersistentDataService/GetData', express.json(), async (req, res) => {
    if (req.jwt.unique_name !== req.body.userId) {
        res.status(403).end();
        return;
    }
    let userdata = JSON.parse(await readFile(path.join('userdata', req.gameVersion, 'users', `${req.body.userId}.json`)));
    res.json(userdata.Extensions.gamepersistentdata[req.body.key]);
})

app.post('/GamePersistentDataService/SaveData', express.json(), async (req, res) => {
    if (req.jwt.unique_name !== req.body.userId) {
        res.status(403).end();
        return;
    }
    let userdata = JSON.parse(await readFile(path.join('userdata', req.gameVersion, 'users', `${req.body.userId}.json`)));
    userdata.Extensions.gamepersistentdata[req.body.key] = req.body.data;
    writeFile(path.join('userdata', req.gameVersion, 'users', `${req.body.userId}.json`), JSON.stringify(userdata), { fsyncWait: false });

    res.status(204).end();
})

app.post('/ChallengesService/GetActiveChallengesAndProgression', express.json(), async (req, res) => {
    const challenges = [];
    challenges.push(...JSON.parse(await readFile(path.join('challenges', 'globalChallenges.json')))); // TODO: more challenges
    // TODO: location specific challenges

    let result = challenges.map(challenge => ({
        Challenge: challenge,
        Progression: {
            ChallengeId: challenge.Id,
            ProfileId: req.jwt.unique_name,
            Completed: false,
            State: {},
            ETag: `W/\"datetime'${encodeURIComponent(new Date().toISOString())}'\"`,
            CompletedAt: null,
            MustBeSaved: false
        }
    }));

    res.json(result);
});

app.post('/HubPagesService/GetChallengeTreeFor', express.json(), (req, res) => {
    res.json({
        Data: {
            Children: [], // TODO: Challenges for location
        },
        LevelsDefinition: {
            Location: [ // TODO: xp required for each level in location
                0
            ],
            PlayerProfile: {
                Version: 1,
                XpPerLevel: 6000, // TODO: make dynamic?
                MaxLevel: MaxPlayerLevel,
            }
        }
    });
});

app.post('/DefaultLoadoutService/Set', express.json(), async (req, res) => {
    const userData = JSON.parse(await readFile(path.join('userdata', req.gameVersion, 'users', `${req.jwt.unique_name}.json`)));
    const inventory = userData.Extensions.inventory;
    const allunlockables = JSON.parse(await readFile(path.join('userdata', req.gameVersion, 'allunlockables.json')));
    const sublocation = req.body.location && allunlockables.find(unlockable => unlockable.Id === req.body.location);
    if (!userData.Extensions.defaultloadout) {
        userData.Extensions.defaultloadout = {};
    }
    if (sublocation && req.body.loadout) {
        const loadout = {};
        const locationstring = sublocation.Properties.ParentLocation;

        for (const slotid of [0, 1, 2, 3, 4, 5, 6]) {
            if (inventory.find(item => item.Unlockable.Id === req.body.loadout[slotid])) {
                loadout[slotid] = req.body.loadout[slotid];
            }
        }
        for (const slotid in req.body.loadout) {
            if (UUIDRegex.test(slotid) && inventory.find(item => item.InstanceId === slotid)
                && inventory.find(item => item.Unlockable.Id === req.body.loadout[slotid])) {
                // container contents
                loadout[slotid] = req.body.loadout[slotid];
                break; // only one container is supported
            }
        }

        userData.Extensions.defaultloadout[locationstring] = loadout;
        await writeFile(path.join('userdata', req.gameVersion, 'users', `${req.jwt.unique_name}.json`), JSON.stringify(userData), { fsyncWait: false });
        res.status(204).end();
    } else {
        res.status(400).end();
    }
});

app.post([
    '/ProfileService/UnconfirmedSignupIoIAccount',
    '/ProfileService/SubmitSemEmail',
], express.json(), async (req, res) => {
    res.json({
        Success: true,
        ErrorCode: null,
        IsConfirmed: true,
        LinkedEmail: req.body.email,
        IOIAccountId: uuid.NIL,
    });
});

app.post('/ProfileService/GetSemLinkStatus', express.json(), async (req, res) => {
    res.json({
        IsConfirmed: true,
        LinkedEmail: 'mail@example.com',
        IOIAccountId: uuid.NIL,
        IOIAccountBaseUrl: "https://account.ioi.dk"
    });
});

module.exports = {
    router: app,
    resolveProfiles
};
