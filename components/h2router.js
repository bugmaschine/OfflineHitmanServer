// Copyright (C) 2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');

const profileHandler = require('./h2/profileHandler.js');
const menuSystem = require('./h2/menuSystem.js');
//const menuData = require('./h2/menuData.js');
//const eventHandler = require('./h2/eventHandler.js');
//const multiplayerHandler = require('./h2/multiplayerHandler.js');
//const contractHandler = require('./h2/contractHandler.js');

const router = express.Router();

//router.use('/authentication/api/userchannel/MultiplayerService/', multiplayerHandler);

//router.use('/authentication/api/userchannel/EventsService/', eventHandler.router);

//router.use('/authentication/api/userchannel/ContractsService/', contractHandler);

router.use('/authentication/api/userchannel/', profileHandler.router);

//router.use('/profiles/page/', menuData);

router.use('/resources-(\\d+-\\d+)/', menuSystem);

module.exports = router;
