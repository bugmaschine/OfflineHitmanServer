// Copyright (C) 2020-2021 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');
const path = require('path');
const md5File = require('md5-file');

const app = express.Router();

// /resources-8-2/

app.get('/dynamic_resources_pc_release_rpkg', (req, res) => {
    md5File(path.join('menudata', 'h3', 'dynamic_resources_pc_release_rpkg.rpkg')).then(hash => {
        res.sendFile(path.join('menudata', 'h3', 'dynamic_resources_pc_release_rpkg.rpkg'), {
            root: '.',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-MD5': Buffer.from(hash, 'hex').toString('base64'),
            },
        });
    }).catch(err => {
        if (err.code !== 'ENOENT') {
            console.error(err);
        }
        res.sendFile(path.join('menudata', 'h3', 'dummy_resources.rpkg'), {
            root: '.',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-MD5': 'sKdapJtENwg93lOPRcPG6A==',
            },
        });
    });
});

for (const folder of [
    'menusystem',
    'pages',
    'images'
]) {
    app.use(`/${folder}/`, express.static(path.join('menudata', 'h3', folder), {
        index: false,
        redirect: false,
        dotfiles: 'ignore',
    }));
}

module.exports = app;
