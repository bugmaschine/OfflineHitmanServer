// Copyright (C) 2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

function GetPlatformEntitlements(req, res) {
    if (req.body.issuerId === 'ed55aa5edc5941de92fd7f64de415793') { // Hitman 3 epic namespace
        // Epic ids of hitman3 and its DLCs
        // might be incomplete
        res.json([
            '06d4d61bbb774ca99c1661bee04fbde0', // Hitman 3: Dubai
            '2e4ad3e9aa9b4dcfa709b3f3b44cbf94', // Hitman 3: Dartmoor
            'a9b1afdd05584441aeec75ba230b2e54', // Hitman 3: Berlin
            '66246e4364134f4689da72e9c6731687', // Hitman 3: Chongquing
            '4216cdf59dbc4f19af227be076520202', // Hitman 3: Mendoza
            '8a690003855745e884d5040c6bc9ede8', // Hitman 3: Carpathian Mountains
            'bc610b36c75442299edcbe99f6f0fb60', // Hitman 3 - Deluxe Pack
            '5d06a6c6af9b4875b3530d5328f61287', // Hitman 3 - Trinity Pack
            '0b59243cb8aa420691b66be1ecbe68c0', // HITMAN 1 Standard
            '894d1e6771044f48a8fdde934b8e443a', // HITMAN 1 GOTY Upgrade
            'e698e1a4b63947b0bc9349a5ae2dc015', // ? (HITMAN 1 Requiem pack?) (does nothing?) (HITMAN 1 GOTY according to scream-db.web.app)
            '391d08a543dc43a083eb50246916a291', // Hitman 3 Access Pass: HITMAN 2 Standard
            'afa4b921503f43339c360d4b53910791', // Hitman 3 Access Pass: HITMAN 2 Expansion
            '6408de14f7dc46b9a33adcf6cbc4d159', // ? (HITMAN 2 Executive pack?) (does nothing?) (HITMAN 2 Gold according to scream-db.web.app)
            'b4e2e682cecd42b3a7017ee4838b4593', // ? (EiderGoldEditionAudience according to epicdata.info) (included in H3 Deluxe Pre-purchase)
            '1dea1e39a8044a69b4020845afb4bd97', // ? (included in H3 Pre-purchase)
            'feeac4b521734f22ae99e8ac55a5f896', // ? (included in H3 Pre-purchase)
            '0e8632b4cdfb415e94291d97d727b98d', // Deadly Sins 1: Greed
            '3f9adc216dde44dda5e829f11740a0a2', // (Deadly Sins 2: Pride?)
            'aece009ff59441c0b526f8aa69e24cfb', // (Deadly Sins 3: Sloth?)
            'dfe5aeb89976450ba1e0e2c208b63d33', // (Deadly Sins 4: Lust?)
            '30107bff80024d1ab291f9cd3bac9fac', // (Deadly Sins 5: Gluttony?)
            '0403062df0d347619c8dcf043c65c02e', // (Deadly Sins 6: Wrath?)
            '9e936ed2507a473db6f53ad24d2da587', // (Deadly Sins 7: Envy?)
        ]);
    } else if (req.body.issuerId === '1659040' // Hitman 3 steam retail appid
        || req.body.issuerId === '1847520') { // Hitman 3 steam demo appid
        res.json([
            // Steam AppIDs of Hitman3 and its DLCs
            '1659040', // HITMAN 3
            '1847520', // Hitman 3 Demo
            '1829605', // HITMAN 3 - Dubai
            '1829604', // HITMAN 3 - Dartmoor
            '1829603', // HITMAN 3 - Berlin
            '1829602', // HITMAN 3 - Chongqing
            '1829601', // HITMAN 3 - Mendoza
            '1829600', // HITMAN 3 - Carpathian Mountains
            '1829596', // HITMAN 3 - Trinity Pack
            '1829591', // HITMAN 3 - Deluxe Pack
            '1829594', // HITMAN 3 - VR Access
            '1843460', // HITMAN 3 Access Pass: HITMAN 1 GOTY Edition
            '1829595', // HITMAN 3 Access Pass: HITMAN 1 GOTY Upgrade
            '1829593', // HITMAN 3 Access Pass: HITMAN 1 Complete First Season
            '1829592', // HITMAN 3 Access Pass: HITMAN 2 Standard
            '1829590', // HITMAN 3 Access Pass: HITMAN 2 Expansion
            '1829580', // HITMAN 3 - Seven Deadly Sins Act 1: Greed
            '1829581', // HITMAN 3 - Seven Deadly Sins Act 2: Pride
            '1829582', // HITMAN 3 - Seven Deadly Sins Act 3: Sloth
            '1829583', // HITMAN 3 - Seven Deadly Sins Act 4: Lust
            '1829584', // HITMAN 3 - Seven Deadly Sins Act 5: Gluttony
            '1829585', // HITMAN 3 - Seven Deadly Sins Act 6: Envy
            '1829586', // HITMAN 3 - Seven Deadly Sins Act 7: Wrath
        ]);
    }
}

module.exports = {
    getEntitlements: GetPlatformEntitlements,
};
