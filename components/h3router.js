// Copyright (C) 2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');

const profileHandler = require('./h3/profileHandler.js');
const menuSystem = require('./h3/menuSystem.js');
const menuData = require('./h3/menuData.js');
const eventHandler = require('./h3/eventHandler.js');
const multiplayerHandler = require('./h3/multiplayerHandler.js');
const contractHandler = require('./h3/contractHandler.js');

const router = express.Router();

router.use('/authentication/api/userchannel/MultiplayerService/', multiplayerHandler);

router.use('/authentication/api/userchannel/EventsService/', eventHandler.router);

router.use('/authentication/api/userchannel/ContractsService/', contractHandler);

router.use('/authentication/api/userchannel/', profileHandler.router);

router.use('/profiles/page/', menuData.router);

router.use('/resources-(\\d+-\\d+)/', menuSystem);

function sessionCleanup() {
    eventHandler.cleanupOldSessions();
}

router.sessionCleanup = sessionCleanup;

module.exports = router;
