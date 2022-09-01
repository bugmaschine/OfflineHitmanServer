// Copyright (C) 2020-2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const path = require('path');
const uuid = require('uuid');
const { writeFile, readFile } = require('atomically');

const { extractToken, getServerVerObj, getGameVersionFromJWTPis, getGameVersionFromServerVersion, UUIDRegex } = require('./components/utils.js');
const h1router = require('./components/h1router.js');
const h2router = require('./components/h2router.js');
const h3router = require('./components/h3router.js');

let app = express();

app.disable('x-powered-by');

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`); // log every request to the console
    next();
});

app.get('/config/:configName/:serverVersion(\\d+_\\d+_\\d+)', (req, res) => {
    readFile('static/config.json').then((configfile) => {
        let config = JSON.parse(configfile);
        let serverhost = req.get('Host');
        let protocol = req.protocol;
        if (req.params.serverVersion.startsWith('6')) {
            config.Versions[0].GAME_VER = "6.74.0";
        } else if (req.params.serverVersion.startsWith('8')) {
            config.Versions[0].GAME_VER = '8.2.0';
        }
        config.Versions[0].Name = req.params.configName;
        config.Versions[0].ISSUER_ID = req.query.issuer || '*';
        config.Versions[0].SERVER_VER.Metrics.MetricsServerHost = `${protocol}://${serverhost}`;
        config.Versions[0].SERVER_VER.Authentication.AuthenticationHost = `${protocol}://${serverhost}`;
        config.Versions[0].SERVER_VER.Configuration.Url = `${protocol}://${serverhost}/files/onlineconfig.json`;
        config.Versions[0].SERVER_VER.Configuration.AgreementUrl = `${protocol}://${serverhost}/files/privacypolicy/hm2/privacypolicy.json`;
        config.Versions[0].SERVER_VER.Resources.ResourcesServicePath = `${protocol}://${serverhost}/files`;
        config.Versions[0].SERVER_VER.GlobalAuthentication.AuthenticationHost = `${protocol}://${serverhost}`;
        config.Versions[0].SERVER_VER.GlobalAuthentication.RequestedAudience = `pc-prod_${req.params.serverVersion.slice(0, 1)}`;
        res.json(config);
    });
});

app.get('/files/privacypolicy/hm2/privacypolicy_*.json', (req, res) => {
    res.sendFile('static/privacypolicy.json', {
        root: '.',
        headers: {
            'Content-Type': 'application/octet-stream',
            'x-ms-meta-version': '20181001', // no idea what this is, but it didn't work without this header
        }
    });
});

app.post('/api/metrics/*', (req, res) => {
    res.send();
});

app.use('/oauth/token', express.urlencoded({ extended: false, type: 'application/json' }));
app.post('/oauth/token', async (req, res) => {
    const signOptions = {
        notBefore: -60000,
        expiresIn: 6000,
        issuer: 'auth.hitman.io',
        audience: 'pc_prod_7',
        noTimestamp: true,
    };

    if (req.body.grant_type === 'refresh_token') {
        // send back the token from the request (re-signed so the timestamps update)
        extractToken(req); // init req.jwt
        // remove signOptions from existing jwt
        delete req.jwt.nbf; // notBefore
        delete req.jwt.exp; // expiresIn
        delete req.jwt.iss; // issuer
        delete req.jwt.aud; // audience
        res.json({
            "access_token": jwt.sign(req.jwt, 'secret', signOptions),
            "token_type": "bearer",
            "expires_in": 5000,
            "refresh_token": uuid.v4(),
        });
        return;
    }

    let external_platform, external_userid, external_users_folder, external_appid;

    if (req.body.grant_type === 'external_steam') {

        externel_appid = 420 // Todo Fix This
        external_platform = 'steam';
        external_userid = req.body.steam_userid;
        external_users_folder = 'steamids';
    } else if (req.body.grant_type === 'external_epic') {

        
        externel_appid = 420 // Todo Fix This
        external_platform = 'epic';
        external_userid = req.body.epic_userid;
        external_users_folder = 'epicids';
    } else if (req.body.grant_type === 'external_gog') {
        externel_appid = 420 // Todo Fix This
        external_platform = 'gog';
        external_userid = req.body.gog_userid;
        external_users_folder = 'gogids';
    } else {
        res.status(501).end(); // unsupported auth method
        return;
    }

    const gameVersion = getGameVersionFromJWTPis(external_appid);

    if (req.body.pId && !UUIDRegex.test(req.body.pId)) {
        res.status(400).end(); // pId is not a GUID
        return;
    }


    if (!req.body.pId) { // if no profile id supplied
        await readFile(path.join('userdata', gameVersion, external_users_folder, `${external_userid}.json`)).then(data => { // get profile id from external id
            // TODO: check legit server response
            req.body.pId = data.toString();
        }).catch(async err => {
            if (err.code !== 'ENOENT') {
                throw err; // rethrow if error is something else than a non-existant file
            }
            // external id has no profile associated: create new profile and link external id to it
            req.body.pId = uuid.v4();
            await writeFile(path.join('userdata', gameVersion, external_users_folder, `${external_userid}.json`), req.body.pId, { fsyncWait: false });
        });
    } else { // if a profile id is supplied
        readFile(path.join('userdata', gameVersion, external_users_folder, `${external_userid}.json`)).then(pId => { // read profile id linked to supplied external id
            if (pId.toString() !== req.body.pId) { // requested external id is linked to different profile id
                // TODO: check legit server response
            }
        }).catch(async err => {
            if (err.code !== 'ENOENT') {
                throw err; // rethrow if error is something else than a non-existant file
            }
            // external id is not yet linked to this profile
            await writeFile(path.join('userdata', gameVersion, external_users_folder, `${external_userid}.json`), req.body.pId, { fsyncWait: false }); // link it
        })
    }

    await readFile(path.join('userdata', gameVersion, 'users', `${req.body.pId}.json`)).then(data => {
        let userdata = JSON.parse(data);
        if (userdata.LinkedAccounts[external_platform] !== external_userid) { // requested profile id is linked to different external id
            // TODO: check legit server response
            // TODO: handle multiple external links
        }
    }).catch(async err => {
        if (err.code !== 'ENOENT') {
            throw err; // rethrow if error is something else than a non-existant file
        }
        // User does not exist, create new profile from default:

        let userdata = JSON.parse(await readFile(path.join('userdata', gameVersion, 'default.json')));
        userdata.Id = req.body.pId;
        userdata.LinkedAccounts[external_platform] = external_userid;
        if (external_platform === 'steam') {
            userdata.SteamId = req.body.steam_userid;
        } else if (external_platform === 'epic') {
            userdata.EpicId = req.body.epic_userid;
        }
        // add all unlockables to player's inventory
        const allunlockables = JSON.parse(await readFile(path.join('userdata', gameVersion, 'allunlockables.json')))
            .filter(u => u.Type !== 'location') // locations not in inventory
            .concat(JSON.parse(await readFile(path.join('userdata', gameVersion, 'emotes.json')))); // add emotes to inventory
        // TODO: challengemultiplier type unlockables - (only used for sniper gamemode?)
        userdata.Extensions.inventory = allunlockables.map(unlockable => {
            unlockable.GameAsset = null;
            unlockable.DisplayNameLocKey = `UI_${unlockable.Id}_NAME`;
            return {
                InstanceId: uuid.v4(),
                ProfileId: req.body.pId,
                Unlockable: unlockable,
                Properties: {},
            }
        });
        //
        for (const unlockable of userdata.Extensions.inventory) {
            unlockable.ProfileId = req.body.pId;
        }
        await writeFile(path.join('userdata', gameVersion, 'users', `${req.body.pId}.json`), JSON.stringify(userdata), { fsyncWait: false });
    });

    // Format here follows steam_external, Epic jwt has some different fields
    const userinfo = {
        'auth:method': req.body.grant_type,
        roles: 'user',
        sub: req.body.pId,
        unique_name: req.body.pId,
        userid: external_userid,
        platform: external_platform,
        locale: req.body.locale,
        rgn: req.body.rgn,
        pis: external_appid,
        cntry: req.body.locale,
    };
    res.json({
        access_token: jwt.sign(userinfo, 'secret', signOptions),
        token_type: 'bearer',
        expires_in: 5000,
        refresh_token: uuid.v4(),
    });
});

app.get('/files/onlineconfig.json', (req, res) => {
    res.sendFile(path.join('static', 'onlineconfig.json'), {
        root: '.',
        headers: {
            'Content-Type': 'application/octet-stream',
        },
    });
});

app.get('/', (req, res) => {
    res.send('pog'); // simple test page
});

// --- Everything below requires authentication or points to /resources-{serverVersion}/* ---

// set req.serverVersion
app.use(express.Router().use('/resources-:serverVersion(\\d+-\\d+)/', (req, res, next) => {
    req.serverVersion = req.params.serverVersion; // set serverVersion from url (e.g. /resources-7-17/)
    req.gameVersion = getGameVersionFromServerVersion(req.serverVersion);
    next('router');
}).use(extractToken, (req, res, next) => {
    req.gameVersion = getGameVersionFromJWTPis(req.jwt.pis);
    if (req.gameVersion === 'h1') {
        req.serverVersion = '6-74';
    } else if (req.gameVersion === 'h2') {
        req.serverVersion = '7-17';
    } else if (req.gameVersion === 'h3') {
        req.serverVersion = '8-2';
    } else {
        res.status(500).end();
        return;
    }
    next();
}));

function generateBlobConfig(req) {
    return {
        bloburl: `${req.protocol}://${req.get('Host')}/resources-${req.serverVersion}/`,
        blobsig: '?sv=2018-03-28',
        blobsigduration: 7200000.0
    };
}

// configName=pc-prod&lockedContentDisabled=false&isFreePrologueUser=false&isIntroPackUser=false&isFullExperienceUser=false
app.get('/authentication/api/configuration/Init?*', extractToken, (req, res) => {
    let ver = getServerVerObj(req.gameVersion);
    res.json({
        token: `${req.jwt.exp}-${req.jwt.nbf}-${req.jwt.platform}-${req.jwt.userid}`,
        blobconfig: generateBlobConfig(req),
        profileid: req.jwt.unique_name,
        serverversion: `${ver._Major}.${ver._Minor}.${ver._Build}.${ver._Revision}`,
        servertimeutc: new Date().toISOString(),
        ias: 2,
    });
});

app.post('/authentication/api/userchannel/AuthenticationService/RenewBlobSignature', extractToken, (req, res) => {
    res.json(generateBlobConfig(req));
});

app.use(express.Router().use((req, res, next) => {
    switch (req.serverVersion) {
        case '6-74':
            next(); // continue along h1router
            break;
        default:
            next('router'); // go to next router
    }
}).use(h1router), express.Router().use((req, res, next) => {
    switch (req.serverVersion) {
        case '6-74':
        case '7-17':
            next(); // continue along h2router
            break;
        default:
            next('router'); // go to next router
    }
}).use(h2router), express.Router().use((req, res, next) => {
    switch (req.serverVersion) {
        case '6-74':
        case '7-17':
        case '8-2':
            next(); // continue along h3router
            break;
        default:
            next('router'); // go to next router (unhandled)
    }
}).use(h3router));


app.all('*', (req, res) => {
    console.warn(`unhandled ${req.method} ${req.originalUrl}`);
    res.status(404).end()
});

setInterval(function () {
    h1router.sessionCleanup && h1router.sessionCleanup();
    h2router.sessionCleanup && h2router.sessionCleanup();
    h3router.sessionCleanup && h3router.sessionCleanup();
}, 1000 * 60 * 10).unref(); // cleanup old sessions every 10 minutes

const httpServer = http.createServer(app);

httpServer.listen(80);
console.log('Server started.');
