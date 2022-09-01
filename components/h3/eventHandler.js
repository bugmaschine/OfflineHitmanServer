// Copyright (C) 2020 grappigegovert <grappigegovert@hotmail.com>
// Licensed under the zlib license. See LICENSE for more info

const express = require('express');

const app = express.Router();



// /authentication/api/userchannel/EventsService/

function encodePushMessage(timestamp, message) {
    let msgstr = JSON.stringify(message);
    let msglength = Buffer.byteLength(msgstr, 'utf8');
    let totallength = msglength + 8 + 80; // using a fixed length of 8 for the timestamp for now...
    totallength += 4 - (totallength % 4); // pad to nearest multiple of 4
    let output = Buffer.alloc(totallength);
    let offset = 0;

    offset = output.writeUInt32LE(totallength, offset);
    // no idea what these first two chunks are for
    offset = output.writeUInt32LE(0x0000000C, offset);
    offset = output.writeUInt16LE(0x0008, offset);
    offset = output.writeUInt16LE(0x000E, offset);
    offset = output.writeUInt16LE(0x0007, offset);
    offset = output.writeUInt16LE(0x0008, offset);
    offset = output.writeUInt32LE(0x00000008, offset);
    offset = output.writeUInt32BE(0x00000002, offset);

    offset = output.writeUInt32LE(0x00000014, offset);
    offset = output.writeUInt16LE(0x0000, offset);
    offset = output.writeUInt16LE(0x000E, offset);
    offset = output.writeUInt16LE(0x0014, offset);
    offset = output.writeUInt16LE(0x0006, offset);
    offset = output.writeUInt16LE(0x0000, offset);
    offset = output.writeUInt16LE(0x0005, offset);
    offset = output.writeUInt16LE(0x0008, offset);
    offset = output.writeUInt16LE(0x000C, offset);
    offset = output.writeUInt32LE(0x0000000E, offset);
    offset = output.writeUInt32BE(0x00010300, offset);

    offset = output.writeUInt32LE(0x0c + 8, offset);
    offset = output.writeBigUInt64LE(timestamp, offset);
    offset = output.writeUInt16LE(0x0008, offset);
    offset = output.writeUInt16LE(0x000C, offset);
    offset = output.writeUInt16LE(0x0006, offset);
    offset = output.writeUInt16LE(0x0008, offset);
    offset = output.writeUInt32LE(0x00000008, offset);
    offset = output.writeUInt32BE(0x00008300, offset);

    offset = output.writeUInt32LE(0x04, offset);
    offset = output.writeUInt32LE(msglength, offset);
    offset = output.write(msgstr, offset, 'utf8');
    return output.toString('base64');
}

let messageQueue = new Map();
let eventQueue = new Map();

function enqueuePushMessage(userid, message) {
    let userQueue;
    let time = process.hrtime.bigint();
    if (userQueue = messageQueue.get(userid)) {
        userQueue.push({
            time: time,
            message: encodePushMessage(time, message),
        });
    } else {
        userQueue = [{
            time: time,
            message: encodePushMessage(time, message),
        }];
        messageQueue.set(userid, userQueue);
    }
}

function enqueueEvent(userid, event) {
    let userQueue;
    let time = process.hrtime.bigint().toString();
    event.CreatedAt = new Date().toISOString().slice(0, -1);
    event.Token = time.toString();
    if (userQueue = eventQueue.get(userid)) {
        userQueue.push({
            time: time,
            event: event,
        });
    } else {
        userQueue = [{
            time: time,
            event: event,
        }];
        eventQueue.set(userid, userQueue);
    }
}

let contractSessions = new Map();
function newSession(sessionId, contractId, userId) {
    timestamp = new Date();

    contractSessions.set(sessionId, {
        sessionStart: timestamp,
        lastUpdate: timestamp,
        contractId: contractId,
        userId: userId,
        timerStart: 0,
        timerEnd: 0,
        duration: 0,
        ghost: {
            Opponents: [],
            deaths: 0,
            unnoticedKills: 0,
            Score: 0,
            OpponentScore: 0,
        },
        crowdNpcKills: 0,
        targetKills: new Set(),
        npcKills: new Set(),
        bodiesHidden: new Set(),
        pacifications: new Set(),
        disguisesUsed: new Set(),
        disguisesRuined: new Set(),
        spottedBy: new Set(),
        witnesses: new Set(),
        bodiesFoundBy: new Set(),
        killsNoticedBy: new Set(),
        completedObjectives: new Set(),
        recording: 'NOT_SPOTTED',
        lastAccident: 0,
        lastKill: {},
    });
}

app.post('/SaveAndSynchronizeEvents4', express.json({ limit: '5Mb' }), (req, res) => {
    if (req.body.userId !== req.jwt.unique_name) {
        res.status(403).end(); // Trying to save events for other user
        return;
    }
    if (!Array.isArray(req.body.values)) {
        res.status(400).end(); // malformed request
        return;
    }

    let userQueue;
    let newEvents = null;
    // events: (server->client)
    if (userQueue = eventQueue.get(req.jwt.unique_name)) {
        userQueue = userQueue.filter(item => item.time > req.body.lastEventTicks);
        eventQueue.set(req.jwt.unique_name, userQueue);

        newEvents = Array.from(userQueue, item => item.event);
    }

    // push messages: (server->client)
    let pushMessages = null;
    if (userQueue = messageQueue.get(req.jwt.unique_name)) {
        userQueue = userQueue.filter(item => item.time > req.body.lastPushDt);
        messageQueue.set(req.jwt.unique_name, userQueue);

        pushMessages = Array.from(userQueue, item => item.message);
    }

    res.json({
        SavedTokens: req.body.values.length ? saveEvents(req.body.userId, req.body.values) : null,
        NewEvents: newEvents || null,
        NextPoll: 10.0,
        PushMessages: pushMessages || null,
    });
});

app.post('/SaveEvents2', express.json({ limit: '5Mb' }), (req, res) => {
    if (req.jwt.unique_name !== req.body.userId) {
        res.status(403).end(); // Trying to save events for other user
        return;
    }
    res.json(saveEvents(req.body.userId, req.body.values));
});

function saveEvents(userId, events) {
    let response = [];
    events.forEach(event => {
        const session = contractSessions.get(event.ContractSessionId);
        if (!session || session.contractId !== event.ContractId || session.userId !== userId) {
            return; // session does not exist or contractid/userid doesn't match
        }
        session.duration = event.Timestamp;
        session.lastUpdate = new Date();

        if (session.timerEnd !== 0 && event.Timestamp > session.timerEnd) {
            // Do not handle events that occur after exiting the level
            // Todo: ExitInventory, ContractEnd, etc. will probably end up here.
            response.push(process.hrtime.bigint().toString());
            return;
        }

        // Todo: handle more events
        if (event.Name === 'Ghost_PlayerDied') {
            session.ghost.deaths += 1;
        } else if (event.Name === 'Ghost_TargetUnnoticed') {
            session.ghost.unnoticedKills += 1;
        } else if (event.Name === 'Kill') {
            // Todo?: check for event.Value.KillContext === 1
            if (session.lastKill.timestamp === event.Timestamp) {
                session.lastKill.repositoryIds.push(event.Value.RepositoryId);
            } else {
                session.lastKill = {
                    timestamp: event.Timestamp,
                    repositoryIds: [event.Value.RepositoryId],
                };
            }
            if (event.Value.IsTarget) {
                session.targetKills.add(event.Value.RepositoryId);
            } else {
                session.npcKills.add(event.Value.RepositoryId);
            }
        } else if (event.Name === 'CrowdNPC_Died') {
            session.crowdNpcKills += 1;
        } else if (event.Name === 'Pacify') {
            session.pacifications.add(event.Value.RepositoryId);
        } else if (event.Name === 'BodyHidden') {
            session.bodiesHidden.add(event.Value.RepositoryId);
        } else if (event.Name === 'Disguise') {
            session.disguisesUsed.add(event.Value);
        } else if (event.Name === 'ContractStart') {
            session.disguisesUsed.add(event.Value.Disguise);
        } else if (event.Name === 'Opponents') {
            session.ghost.Opponents = event.Value.ConnectedSessions;
        } else if (event.Name === 'MatchOver') {
            session.ghost.Score = event.Value.MyScore;
            session.ghost.OpponentScore = event.Value.OpponentScore;
            session.ghost.IsWinner = event.Value.IsWinner;
            session.ghost.IsDraw = event.Value.IsDraw;
            session.timerEnd = event.Timestamp;
        } else if (event.Name === 'DisguiseBlown') {
            session.disguisesRuined.add(event.Value);
        } else if (event.Name === 'BrokenDisguiseCleared') {
            session.disguisesRuined.delete(event.Value);
        } else if (event.Name === 'Spotted') {
            session.spottedBy.add(...event.Value);
        } else if (event.Name === 'Witnesses') {
            session.witnesses.add(...event.Value);
        } else if (event.Name === 'SecuritySystemRecorder') {
            if (event.Value.event === 'spotted' && session.recording !== 'ERASED') {
                session.recording = 'SPOTTED';
            } else if (event.Value.event === 'destroyed' || event.Value.event === 'erased') {
                session.recording = 'ERASED';
            }
        } else if (event.Name === 'IntroCutEnd') {
            session.timerStart = event.Timestamp;
        } else if (event.Name === 'exit_gate') {
            session.timerEnd = event.Timestamp;
        } else if (event.Name === 'ContractEnd') {
            if (!session.timerEnd) {
                session.timerEnd = event.Timestamp;
            }
        } else if (event.Name === 'ObjectiveCompleted') {
            session.completedObjectives.add(event.Value.Id);
        } else if (event.Name === 'AccidentBodyFound') {
            session.lastAccident = event.Timestamp;
        } else if (event.Name === 'MurderedBodySeen') {
            if (event.Timestamp !== session.lastAccident) {
                session.bodiesFoundBy.add(event.Value.Witness);
                if (event.Timestamp === session.lastKill.timestamp) {
                    session.killsNoticedBy.add(event.Value.Witness);
                }
            }
        }
        response.push(process.hrtime.bigint().toString());
    });
    return response;
}

function cleanupOldSessions() {
    for (const [sessionId, sessionDetails] of contractSessions) {
        if (new Date() - sessionDetails.lastUpdate > 1000 * 60 * 60) { // if session has not received an event in the past hour
            contractSessions.delete(sessionId);
        }
    }
}

module.exports = {
    router: app,
    enqueuePushMessage,
    enqueueEvent,
    contractSessions,
    newSession,
    cleanupOldSessions,
};
