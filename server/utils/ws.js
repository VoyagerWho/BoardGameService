const express = require('express');
const ws = require('ws');
const ejs = require('ejs');
const path = require('path');
const gameAPI = require('../api/game');

/**
 * Path to the views folder
 * @type {String}
 */
const views = path.join(__dirname, '..', 'views');

/**
 * App session instance
 * @type {express.RequestHandler}
 */
var sessionParser;

/**
 * Function to pass main express session instance to router
 * @param {express.RequestHandler} sp
 */
function passSessionParser(sp) {
	sessionParser = sp;
}
module.exports.passSessionParser = passSessionParser;

/**
 * Reference to the rooms map
 * @type {Map<string, any>}
 */
var rooms;

/**
 * Function to pass main express session instance to router
 * @param {express.RequestHandler} sp
 */
function passRooms(ref) {
	rooms = ref;
}
module.exports.passRooms = passRooms;

function customLog(toLog) {
	console.log('--------------------------------');
	console.log('WS:');
	console.log(toLog);
}
//---------------------------------------------------------------------
const wsServer = new ws.Server({ noServer: true });
module.exports.wsServer = wsServer;

/**
 * Function handling update of Users list for every room member
 * @param {String} rid - ID of room instance
 * @param {JSON} room - room instance to update
 */
function updateUsersList(room, mode) {
	room.players.forEach((player, index) => {
		if (player) {
			ejs
				.renderFile(
					path.join(views, 'partials', 'gamesparts', 'misc', 'users.ejs'),
					{
						room: room,
						uid: index,
					}
				)
				.then((value) => {
					player.socket.send(
						JSON.stringify({
							accepted: true,
							action: mode || 'Joined',
							message: value,
						})
					);
				});
		}
	});
	room.observers.forEach((observer, index) => {
		if (observer) {
			ejs
				.renderFile(
					path.join(views, 'partials', 'gamesparts', 'misc', 'users.ejs'),
					{
						room: room,
						uid: 0,
						oid: index,
					}
				)
				.then((value) => {
					observer.socket.send(
						JSON.stringify({
							accepted: true,
							action: mode || 'Joined',
							message: value,
						})
					);
				});
		}
	});
}

/**
 * Handler for socket messages
 * @param {ws.WebSocket} socket
 * @param {IncomingMessage} req
 * @param {JSON} messjson
 */
function handleMessage(socket, req, messjson) {
	var roomStats = {};
	var resjson = { action: messjson.action };
	const rid = req.url.substring(7);
	const room = rooms.get(rid);
	if (!room) {
		customLog('Unknow Room ID: ' + rid);
		socket.send(
			JSON.stringify({
				accepted: false,
				response: 'Unknow Room ID: ' + rid,
			})
		);
		return;
	}
	customLog(['Socket handler', messjson]);
	switch (messjson.action) {
		case 'NewGame':
			{
				gameAPI.startNewGame(
					room.game,
					{
						room: rid,
						player: req.session.rooms[rid].uid,
						players: Math.max(room.minNoPlayers, room.noPlayers),
					},
					(httpsres) => {
						httpsres.on('data', (d) => {
							const data = JSON.parse(d.toString());
							resjson.accepted = data.accepted;
							resjson.message = data.message;
							customLog(resjson);
							socket.send(JSON.stringify(resjson));
						});
					},
					null
				);
				gameAPI.updateAll(rid, room);
			}
			break;
		case 'NewRound':
			{
				gameAPI.startNewRound(
					room.game,
					{ room: rid, player: req.session.rooms[rid].uid },
					(httpsres) => {
						httpsres.on('data', (d) => {
							const data = JSON.parse(d.toString());
							resjson.accepted = data.accepted;
							resjson.message = data.message;
							customLog(resjson);
							socket.send(JSON.stringify(resjson));
						});
					},
					null
				);
				gameAPI.updateAll(rid, room);
			}
			break;
		case 'Move':
			{
				const apiMess = {
					room: rid,
					player: req.session.rooms[rid].uid,
					move: messjson.move,
					board: messjson.board,
				};
				if (messjson.move === 'throw') {
					const desc = room.game.board || room.game.boards[messjson.board];
					const dices = gameAPI.throwDices(desc);
					apiMess.dices = dices;
					gameAPI.makeMove(
						room.game,
						apiMess,
						(httpsres) => {
							httpsres.on('data', (d) => {
								const data = JSON.parse(d.toString());
								resjson.accepted = data.accepted;
								resjson.message = data.message;
								resjson.dices = dices;
								resjson.action = 'Throw';
								resjson.board = messjson.board;
								customLog(resjson);
								socket.send(JSON.stringify(resjson));
							});
						},
						null
					);
				} else {
					gameAPI.makeMove(
						room.game,
						apiMess,
						(httpsres) => {
							httpsres.on('data', (d) => {
								const data = JSON.parse(d.toString());
								resjson.accepted = data.accepted;
								resjson.message = data.message;
								customLog(resjson);
								socket.send(JSON.stringify(resjson));
							});
						},
						null
					);
				}
				gameAPI.updateAll(rid, room);
			}
			break;
		case 'Update':
			{
				gameAPI.update(
					room.game,
					{ room: rid, player: req.session.rooms[rid].uid },
					(httpsres) => {
						httpsres.on('data', (d) => {
							const data = JSON.parse(d.toString());
							if (data.accepted) {
								resjson = gameAPI.processGameState(
									data,
									req.session.rooms[rid].uid
								);
								// swap single instance to array
								if (resjson.board) {
									resjson.boards = [];
									resjson.boards[0] = resjson.board;
									resjson.board = undefined;
								}
								resjson.action = 'Update';
								socket.send(JSON.stringify(resjson));
							} else customLog(['Update API error', data]);
						});
					},
					null
				);
			}
			break;
		case 'Ping':
			{
				socket.send(JSON.stringify({ action: 'Pong', accepted: true }));
			}
			break;
		default:
			{
				customLog('Unknow action: ' + messjson.action);
				socket.send(
					JSON.stringify({
						accepted: false,
						response: 'Unknow action: ' + messjson.action,
					})
				);
			}
			break;
	}
}

wsServer.on('connection', (socket, req) => {
	customLog('Socket conneted!');
	sessionParser(req, {}, () => {
		console.log('Session attached to socket');
		const rid = req.url.substring(7);
		const room = rooms.get(rid);
		var resjson = { action: 'GetRole' };
		if (room) {
			if (req.session.rooms === undefined) req.session.rooms = {};
			if (req.session.rooms[rid] === undefined)
				req.session.rooms[rid] = { uid: 0 };
			const game = room.game;
			const uid = req.session.rooms[rid].uid;
			var noRole = true;
			resjson.accepted = true;
			resjson.response = 'Role assigned successfully';
			if (uid !== 0) {
				if (uid > 0 && room.players[uid] === undefined) {
					room.players[uid] = { socket: socket };
					++room.noPlayers;
					resjson.description = 'Player' + uid + ' connected';
					noRole = false;
				}
				if (noRole && room.noPlayers < game.maxNoPlayers) {
					var id = 1;
					while (room.players[id]) {
						++id;
					}
					room.players[id] = { socket: socket };
					++room.noPlayers;
					req.session.rooms[rid].uid = id;
					resjson.description = 'Player' + id + ' connected';
					noRole = false;
				}
			}
			if (noRole) {
				var id = 0;
				while (room.observers[id]) {
					++id;
				}
				req.session.rooms[rid].uid = 0;
				req.session.rooms[rid].oid = id;
				room.observers[id] = { socket: socket };
				++room.noObservers;
				resjson.description = 'Observer';
			}
			req.session.save();
		} else {
			resjson.accepted = false;
			resjson.response = 'Failed to assign the role';
			resjson.resone = 'Incorrect room id: ' + rid;
		}
		console.log('Role assigned');
		socket.send(JSON.stringify(resjson));
		updateUsersList(room);
		socket.on('message', (message) => {
			var messjson = {};
			try {
				messjson = JSON.parse(message.toString());
			} catch (error) {
				messjson = { message: message.toString() };
			}
			customLog(messjson);
			handleMessage(socket, req, messjson);
		});

		socket.on('close', (code, reason) => {
			customLog(['Socket disconneted!', code, reason.toString()]);
			const uid = req.session.rooms[rid].uid;
			if (uid === 0) {
				room.observers[req.session.rooms[rid].oid] = undefined;
				--room.noObservers;
			} else {
				room.players[uid] = undefined;
				--room.noPlayers;
			}
			updateUsersList(room, 'Left');
		});
	});
});
