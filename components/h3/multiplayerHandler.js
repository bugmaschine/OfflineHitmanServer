// Copyright (C) 2020-2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');
const path = require('path');
const uuid = require('uuid');
const { readFile } = require('atomically');

const eventHandler = require('./eventHandler.js');
const { generateUserCentricMultiple } = require('./menuData.js');

const app = express.Router();

app.post('/GetRequiredResourcesForPreset', express.json(), async (req, res) => {
    const allPresets = JSON.parse(await readFile(path.join('menudata', 'h3', 'menudata', 'multiplayerpresets.json')));
    const requestedPreset = allPresets.find(preset => preset.Id === req.body.id);
    if (!requestedPreset) {
        res.status(404).end();
        console.info('unknown multiplayer preset id requested');
        return;
    }

    const userData = JSON.parse(await readFile(path.join('userdata', req.gameVersion, 'users', `${req.jwt.unique_name}.json`)));
    const contractIds = requestedPreset.Data.Contracts;
    const userCentrics = await generateUserCentricMultiple(contractIds, userData, req.gameVersion);

    res.json(userCentrics.map(userCentric => ({
        Id: userCentric.Contract.Metadata.Id,
        DlcId: userCentric.Data.DlcName,
        Resources: [userCentric.Contract.Metadata.ScenePath, ...userCentric.Contract.Data.Bricks],
    })));
});

let activeMatches = new Map();

app.post('/RegisterToMatch', express.json(), async (req, res) => {
    // get a random contract from the list of possible ones in the selected preset
    let multiplayerPresets = JSON.parse(await readFile(path.join('menudata', 'h3', 'menudata', 'multiplayerpresets.json')));
    if (!req.body.presetId) {
        req.body.presetId = 'd72d7cc9-ee26-4c7d-857a-75abdc9ccb61'; // default to miami invite preset
    }
    let preset = multiplayerPresets.find(preset => preset.Id === req.body.presetId);
    if (!preset) {
        res.status(404).end();
        console.info('unknown multiplayer preset id requested');
        return;
    }

    let contractId = preset.Data.Contracts[Math.trunc(Math.random() * preset.Data.Contracts.length)];

    if (req.body.matchId === uuid.NIL) { // create new match
        req.body.matchId = uuid.v4();
        activeMatches.set(req.body.matchId, {
            MatchData: {
                contractId: contractId,
            },
            Players: [req.jwt.unique_name],
        });
    } else if (activeMatches.has(req.body.matchId)) { // join existing match
        let match = activeMatches.get(req.body.matchId);
        match.Players.forEach(playerId => eventHandler.enqueuePushMessage(playerId, {
            MatchId: req.body.matchId,
            Type: 1,
            PlayerId: req.jwt.unique_name,
            MatchData: null
        }));
        match.Players.push(req.jwt.unique_name);
    } else { // MatchId not found
        res.status(404).end();
        return;
    }

    eventHandler.enqueuePushMessage(req.jwt.unique_name, {
        MatchId: req.body.matchId,
        Type: 3,
        PlayerId: uuid.NIL,
        MatchData: activeMatches.get(req.body.matchId).MatchData,
    });

    res.json({
        MatchId: req.body.matchId,
        PreferedHostIndex: 0,
        Tickets: [],
        MatchMode: null,
        MatchData: null,
        MatchStats: {},
        MatchType: 0
    });
});

app.post('/SetMatchData', express.json(), (req, res) => {
    let match = activeMatches.get(req.body.matchId)
    if (match && match.Players.includes(req.jwt.unique_name)) {
        match.MatchData[req.body.key] = req.body.value;
        res.json({
            MatchId: req.body.matchId,
            PreferedHostIndex: 0,
            Tickets: [],
            MatchMode: null,
            MatchData: match.MatchData,
            MatchStats: {},
            MatchType: 0
        });
    } else {
        res.status(404).end();
    }
});

app.post('/RegisterToPreset', express.json(), (req, res) => { // matchmaking
    // TODO: implement matchmaking
    // req.body.presetId
    // req.body.lobbyId (this is just a timestamp?)
    res.status(500).end();
});

module.exports = app;
