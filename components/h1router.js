// Copyright (C) 2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');

const profileHandler = require('./h1/profileHandler.js');
const menuSystem = require('./h1/menuSystem.js');
const menuData = require('./h1/menuData.js');
const eventHandler = require('./h1/eventHandler.js');
//const multiplayerHandler = require('./h1/multiplayerHandler.js');
const contractHandler = require('./h1/contractHandler.js');

const router = express.Router();

//router.use('/authentication/api/userchannel/MultiplayerService/', multiplayerHandler);

router.use('/authentication/api/userchannel/EventsService/', eventHandler);

router.use('/authentication/api/userchannel/ContractsService/', contractHandler);
router.use('/authentication/api/userchannel/ContractSessionsService/', contractHandler);

router.use('/authentication/api/userchannel/', profileHandler.router);

router.use('/profiles/page/', menuData);

router.use('/resources-(\\d+-\\d+)/', menuSystem);

module.exports = router;
