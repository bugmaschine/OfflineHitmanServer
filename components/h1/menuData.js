// Copyright (C) 2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');
const path = require('path');
const { readFile } = require('atomically');
const { getTemplate, UUIDRegex, getDefaultLoadout } = require('../utils.js');
const { contractSessions } = require('../h3/eventHandler.js');
const { generateUserCentric } = require('../h3/menuData.js');
const scoreHandler = require('../h3/scoreHandler.js');

const app = express.Router();

app.get('/dashboard//Dashboard_Category_:category/:subscriptionId/:type/:id', async (req, res, next) => {
    // redirect internally to h3 menuData.js by adding /:mode to the url
    // this doesn't preserve the query, but that isn't used.
    req.url = `/dashboard/Dashboard_Category_${req.params.category}/${req.params.subscriptionId}/${req.params.type}/${req.params.id}/templateplease`;
    next();
});

app.get('/Safehouse', async (req, res, next) => {
    const template = await getTemplate('Safehouse', req.gameVersion);

    // call /SafehouseCategory but rewrite the result a bit
    req.url = `/SafehouseCategory?page=0&type=${req.query.type}&subtype=`;
    let originalJsonFunc = res.json;
    let rewritingJsonFunc = function json(originalData) {
        originalJsonFunc.call(this, {
            template: template,
            data: {
                SafehouseData: originalData.data,
            }
        });
    }

    res.json = rewritingJsonFunc;
    next();
});

app.get('/stashpoint', async (req, res) => {
    // stashpoint?contractid=4e45e91a-94ca-4d89-89fc-1b250e608e73&stashpoint=&allowlargeitems=true&slotname=concealedweapon2
    if (!UUIDRegex.test(req.query.contractid)) {
        res.status(400).send('contract id was not a uuid');
        return;
    }

    let contractData;
    try {
        contractData = JSON.parse(await readFile(path.join('contractdata', `${req.query.contractid}.json`)));
    } catch (err) {
        if (err.code != 'ENOENT') {
            throw err; // rethrow if error is something else than a non-existant file
        }
        res.status(400).send();
        return;
    }

    const loadoutSlots = [
        'carriedweapon',
        'carrieditem',
        'concealedweapon',
        'disguise',
        'gear',
        'gear',
        'stashpoint'
    ];

    if (loadoutSlots.includes(req.query.slotname.slice(0, -1))) {
        req.query.slotid = req.query.slotname.slice(0, -1);
    } else {
        console.error('unknown slotid');
        return;
    }
    const userData = JSON.parse(await readFile(path.join('userdata', req.gameVersion, 'users', `${req.jwt.unique_name}.json`)));
    const allunlockables = JSON.parse(await readFile(path.join('userdata', req.gameVersion, 'allunlockables.json')));
    const userCentricContract = await generateUserCentric(contractData, userData, req.gameVersion, allunlockables);
    const sublocation = allunlockables.find(entry => entry.Id === contractData.Metadata.Location);
    const defaultLoadout = Object.assign(Array(7).fill(null), (userData.Extensions.defaultloadout || {})[sublocation.Properties.ParentLocation]
        || getDefaultLoadout(sublocation.Properties.ParentLocation, req.gameVersion));

    res.json({
        template: await getTemplate('stashpoint', req.gameVersion),
        data: {
            ContractId: req.query.contractid,
            // the game actually only needs the loadoutdata from the requested slotid, but this is what IOI servers do
            LoadoutData: [...loadoutSlots.entries()].map(([slotid, slotname]) => ({
                SlotName: slotname,
                SlotId: slotid.toString(),
                Items: userData.Extensions.inventory.filter(item => {
                    return item.Unlockable.Properties.LoadoutSlot // only display items
                        && (item.Unlockable.Properties.LoadoutSlot === slotname // display items for requested slot
                            || (slotname === 'stashpoint' // else: if stashpoint
                                && item.Unlockable.Properties.LoadoutSlot !== 'disguise')) // => display all non-disguise items
                        && (req.query.allowlargeitems === 'true' || item.Unlockable.Properties.LoadoutSlot !== 'carriedweapon'); // not sure about this one
                    // TODO: filter for specific stashpoints?
                }).map(item => ({
                    Item: item,
                    ItemDetails: {
                        Capabilities: [],
                        StatList: item.Unlockable.Properties.Gameplay ? Object.entries(item.Unlockable.Properties.Gameplay).map(([key, value]) => ({
                            Name: key,
                            Ratio: value,
                        })) : [],
                        PropertyTexts: [],
                    },
                    SlotId: slotid.toString(),
                    SlotName: slotname,
                })),
                Page: 0,
                Recommended: defaultLoadout[slotid] ? {
                    item: userData.Extensions.inventory.find(item => item.Unlockable.Id === defaultLoadout[slotid]),
                    type: loadoutSlots[slotid],
                    owned: true,
                } : null,
                HasMore: false,
                HasMoreLeft: false,
                HasMoreRight: false,
                OptionalData: slotid === 6 ? {
                    stashpoint: req.query.stashpoint,
                    AllowLargeItems: req.query.allowlargeitems || !req.query.stashpoint,
                } : {},
            })),
            Contract: userCentricContract.Contract,
            ShowSlotName: req.query.slotname,
            UserCentric: userCentricContract,
        }
    });
});

// /profiles/page/scoreoverview?contractSessionId=5873269880175-0f35f154-671b-4ddb-ba18-8efcc72935f8
app.get('/scoreoverview', async (req, res) => {
    const sessionDetails = contractSessions.get(req.query.contractSessionId);
    if (!sessionDetails) { // contract session not found
        res.status(404).end();
        return;
    }
    if (sessionDetails.userId != req.jwt.unique_name) { // requested score for other user's session
        res.status(401).end();
        return;
    }
    if (!UUIDRegex.test(sessionDetails.contractId)) {
        // This should never happen as it means we saved an invalid id earlier. Doesn't hurt to check however.
        res.status(400).send('contract id was not a uuid');
        return;
    }

    res.json({
        template: await getTemplate('scoreoverview', req.gameVersion),
        data: (await scoreHandler.getMissionEndData(req.query.contractSessionId, req.gameVersion)).ScoreOverview,
    });
});

module.exports = app;
