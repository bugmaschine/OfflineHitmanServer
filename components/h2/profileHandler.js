// Copyright (C) 2020-2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');

const { getEntitlements } = require('./platformEntitlements.js');

const app = express.Router();

// /authentication/api/userchannel/

app.post('/ProfileService/GetPlatformEntitlements', express.json(), getEntitlements);

app.post('/AuthenticationService/GetBlobOfflineCacheDatabaseDiff', (req, res) => {
    // Which menu files should be loaded from the server?
    res.json([
        'menusystem/pages/hub/dashboard/dashboard.json',
        'menusystem/pages/hub/hub_content.json',
        'menusystem/pages/hub/dashboard/category_escalation/result.json',
        'menusystem/pages/result/versusresult_content.json',
        'menusystem/pages/multiplayer/content/lobbyslim.json',
    ]);
});

app.post('/ProfileService/UpdateUserSaveFileTable', (req, res) => {
    res.json('null');
});

app.post('/ProfileService/SynchronizeOfflineUnlockables', (req, res) => {
    res.json('null'); // TODO: write to inventory somewhere?
});

module.exports = {
    router: app,
};
