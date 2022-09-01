// Copyright (C) 2020-2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');
const path = require('path');
const { readFile } = require('atomically');

const { getEntitlements } = require('./platformEntitlements.js');

const app = express.Router();

// /authentication/api/userchannel/

app.post('/ProfileService/GetPlatformEntitlements', express.json(), getEntitlements);

app.post('/AuthenticationService/GetBlobOfflineCacheDatabaseDiff', (req, res) => {
    // Which menu files should be loaded from the server?
    // TODO
    res.json([]);
});

app.post('/ChallengesService/GetActiveChallenges', express.json(), async (req, res) => {
    const challenges = [];
    challenges.push(...JSON.parse(await readFile(path.join('challenges', 'globalChallenges.json')))); // TODO: more challenges
    // TODO: location specific challenges

    res.json(challenges);
});

app.post('/ChallengesService/GetProgression', express.json(), async (req, res) => {
    const challenges = [];
    challenges.push(...JSON.parse(await readFile(path.join('challenges', 'globalChallenges.json')))); // TODO: more challenges
    // TODO: location specific challenges

    let result = challenges.map(challenge => ({
        ChallengeId: challenge.Id,
        ProfileId: req.jwt.unique_name,
        Completed: false,
        State: {},
        ETag: `W/\"datetime'${encodeURIComponent(new Date().toISOString())}'\"`,
        CompletedAt: null,
        MustBeSaved: false
    }));

    res.json(result);
});

module.exports = {
    router: app,
};
