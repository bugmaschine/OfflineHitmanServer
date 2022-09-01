// Copyright (C) 2020-2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');
const path = require('path');
const uuid = require('uuid');
const { readFile } = require('atomically');

const { getServerVerObj, UUIDRegex } = require('../utils.js');
const eventHandler = require('./eventHandler.js');

const app = express.Router();

app.post('/GetForPlay2', express.json(), async (req, res) => {
    if (!UUIDRegex.test(req.body.id)) {
        res.status(400).end();
        return; // user sent a non-uuid contract id
    }
    readFile(path.join('contractdata', `${req.body.id}.json`)).then(async contractfile => {
        const contractData = JSON.parse(contractfile);
        const contractSesh = {
            Contract: contractData,
            ContractSessionId: `${process.hrtime.bigint().toString()}-${uuid.v4()}`,
        };
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

        eventHandler.enqueueEvent(req.jwt.unique_name, {
            Version: getServerVerObj(req.gameVersion),
            IsReplicated: false,
            CreatedContract: null,
            Id: uuid.v4(),
            Name: 'ContractSessionMarker',
            UserId: uuid.NIL,
            ContractId: uuid.NIL,
            SessionId: null,
            ContractSessionId: contractSesh.ContractSessionId,
            Timestamp: 0.0,
            Value: {
                Currency: {
                    ContractPaymentAllowed: true,
                    ContractPayment: null,
                }
            },
            Origin: null,
        });

        res.json(contractSesh);
        eventHandler.newSession(contractSesh.ContractSessionId, contractSesh.Contract.Metadata.Id, req.jwt.unique_name);
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

module.exports = app;
