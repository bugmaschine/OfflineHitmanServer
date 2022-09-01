// Copyright (C) 2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

function GetPlatformEntitlements(req, res) {
    if (req.body.issuerId === '863550') { // Hitman 2 steam appid
        // Steam AppIDs of Hitman2 and its DLCs
        res.json([
            '863550', // Hitman 2
            '950540', // Hitman - Legacy: Paris
            '950550', // Hitman - Legacy: Sapienza
            '950551', // Hitman - Legacy: Marrakesh
            '950552', // Hitman - Legacy: Bonus Missions
            '950553', // Hitman - Legacy: Bankok
            '950554', // Hitman - Legacy: Colorado
            '950555', // Hitman - Legacy: Hokkaido
            '950556', // Hitman 2 - Hawke's Bay
            '950557', // Hitman 2 - Miami
            '950558', // Hitman 2 - Santa Fortuna
            '950559', // Hitman 2 - Mumbai
            '950560', // Hitman 2 - Whittleton Creek
            '950561', // Hitman 2 - Isle of Sgàil
            '950562', // Hitman 2 - Himmelstein
            '953090', // Hitman 2 - Bonus Campaign Patient Zero
            '953091', // Hitman 2 - GOTY Cowboy Suit
            '953092', // Hitman 2 - GOTY Raven Suit
            '953093', // Hitman 2 - GOTY Clown Suit
            '953094', // Hitman 2 - White Rubber Duck Explosive
            '953095', // Hitman 2 - Silenced ICA-19 Chrome Pistol
            '953096', // Hitman 2 - Requiem Legacy Suit
            '957690', // Hitman 2 - Expansion Pass
            '957691', // Hitman 2 - Expansion Pack 1
            '957692', // Hitman 2 - Expansion Pack 2
            '957693', // Hitman 2 - Winter Sports Pack
            '957694', // Hitman 2 - Smart Casual Pack
            '957695', // Hitman 2 - Special Assignments Pack 1
            '957696', // Hitman 2 - Special Assignments Pack 2
            '957697', // Hitman 2 - Executive Pack
            '957698', // Hitman 2 - Collector's Pack
            '957730', // Hitman 2 - New York
            '957731', // Hitman 2 - Haven Island
            '957733', // Hitman 2 - Hantu Port
            '957735', // Hitman 2 - Siberia
            '960831', // Hitman 2 - GOTY Legacy Pack
            '960832', // Hitman 2 - GOTY Upgrade Legacy Pack
            '972340', // Hitman 2 - Gold Edition
            '977941', // Hitman 2 - Early Access
        ]);
    }
}

module.exports = {
    getEntitlements: GetPlatformEntitlements,
};
