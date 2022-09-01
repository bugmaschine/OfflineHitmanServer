// Copyright (C) 2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');

const app = express.Router();

app.post('/SaveAndSynchronizeEvents3', express.json({ limit: '5Mb' }), (req, res, next) => {
    // call /SaveAndSynchronizeEvents4 but add/remove dummy pushMessages
    req.url = '/SaveAndSynchronizeEvents4';
    req.body.lastPushDt = '0';

    let originalJsonFunc = res.json;
    let rewritingJsonFunc = function json(originalData) {
        delete originalData.PushMessages;
        originalJsonFunc.call(this, originalData);
    }

    res.json = rewritingJsonFunc;
    next();
});

module.exports = app;
