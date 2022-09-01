// Copyright (C) 2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');
const path = require('path');
const uuid = require('uuid');
const { readFile } = require('atomically');
const fs = require('fs');

const { getServerVerObj, UUIDRegex } = require('../utils');
const eventHandler = require('../h3/eventHandler.js');

const app = express.Router();

app.post('/GetForPlay', express.json(), async (req, res, next) => {
    if (!UUIDRegex.test(req.body.id)) {
        res.status(400).end();
        return; // contract id was not a uuid
    }
    readFile(path.join('contractdata', `${req.body.id}.json`)).then(async contractfile => {
        const contractData = JSON.parse(contractfile);
        if (!contractData.Data.GameChangers) {
            contractData.Data.GameChangers = [];
        }
        for (const gamechangerId of req.body.extraGameChangerIds) {
            contractData.Data.GameChangers.push(gamechangerId);
        }

        if (contractData.Data.GameChangers.length > 0) {
            const gameChangerData = JSON.parse(await readFile(path.join('menudata', 'h3', 'menudata', 'GameChangerProperties.json')));
            contractData.Data.GameChangerReferences = [];
            for (const gameChangerId of contractData.Data.GameChangers) {
                if (!UUIDRegex.test(gameChangerId) || !Object.hasOwn(gameChangerData, gameChangerId)) {
                    console.error(`Encountered unknown gamechanger id: ${gameChangerId}`);
                    res.status(500);
                    continue;
                }
                const gameChanger = gameChangerData[gameChangerId];
                gameChanger.Id = gameChangerId;
                delete gameChanger.ObjectivesCategory;

                contractData.Data.GameChangerReferences.push(gameChanger);
                contractData.Data.Bricks.push(...gameChanger.Resource);
                contractData.Data.Objectives.push(...gameChanger.Objectives);
            }
        }

        res.json(contractData);
    }).catch(err => {
        if (err.code === 'ENOENT') {
            console.error(`Requested unknown contract: ${path.basename(err.path, '.json')}`);
            res.status(404).end();
        } else {
            console.error(err);
            res.status(500).end();
        }
    });
});

app.post('/Start', express.json(), async (req, res) => {
    if (req.body.profileId != req.jwt.unique_name) {
        res.status(400).end(); // requested for different user id
        return;
    }
    if (!UUIDRegex.test(req.body.contractId)) {
        res.status(400).end();
        return; // contract id was not a uuid
    }

    try {
        await fs.promises.stat(path.join('contractdata', `${req.body.contractId}.json`));
    }
    catch (err) {
        if (err.code === 'ENOENT') {
            res.status(404).end();
            return;
        }
        throw err;
    }

    let contractSessionId = `${process.hrtime.bigint().toString()}-${uuid.v4()}`;

    // all event stuff is handled in h3 eventhandler
    eventHandler.enqueueEvent(req.jwt.unique_name, {
        Version: getServerVerObj(req.gameVersion),
        IsReplicated: false,
        CreatedContract: null,
        Id: uuid.v4(),
        Name: 'ContractSessionMarker',
        UserId: uuid.NIL,
        ContractId: uuid.NIL,
        SessionId: null,
        ContractSessionId: contractSessionId,
        Timestamp: 0.0,
        Value: {
            Currency: {
                ContractPaymentAllowed: true,
                ContractPayment: null,
            }
        },
        Origin: null,
    });

    res.json(contractSessionId);

    eventHandler.newSession(contractSessionId, req.body.contractId, req.jwt.unique_name);
});

module.exports = app;
