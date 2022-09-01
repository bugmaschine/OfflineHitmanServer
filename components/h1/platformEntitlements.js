// Copyright (C) 2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

function GetPlatformEntitlements(req, res) {
    if (req.body.issuerId === '236870') { // Hitman 1 steam appid
        // Steam AppIDs of Hitman1 and its DLCs
        // Probably incomplete
        res.json([
            '236870', // Hitman
            '439870', // Hitman: Episode 1 - Paris
            '439890', // Hitman: Episode 2 - Sapienza
            '440930', // Hitman: Episode 3 - Marrakesh
            '440940', // Hitman: Bonus Episode
            '440960', // Hitman: Episode 4 - Bangkok
            '440961', // Hitman: Episode 5 - Colorado
            '440962', // Hitman: Episode 6 - Hokkaido
            '505180', // Hitman - FULL EXPERIENCE
            '588780', // Hitman - Digital Bonus Content
            '664270', // Hitman - Japanese V/O Pack
        ]);
    } else if (req.body.issuerId === '3c06b15a8a2845c0b725d4f952fe00aa') { // Hitman 1 epic namespace
        // Epic ids of Hitman 1 and its DLCs
        res.json([
            '0a73eaedcac84bd28b567dbec764c5cb', // Hitman 1 standard edition
            '81aecb49a60b47478e61e1cbd68d63c5', // Hitman 1 GOTY upgrade
        ]);
    } else if (req.body.issuerId === '54504350291134065') { // Hitman 1 gog (no clue where this id comes from, should this not be 1545448592?)
        // I also don't know if these are actually used by the game
        res.json([
            "1545448592", // HITMAN
            "1389434554", // HITMAN - Game of the Year Edition Upgrade
        ]);
    } else {
        res.status(501).end();
    }
}

module.exports = {
    getEntitlements: GetPlatformEntitlements,
};
