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
function updateUsersList(rid, room, mode) {
	room.players.forEach((player, index) => {
		if (player) {
			ejs
				.renderFile(
					path.join(views, 'partials', 'gamesparts', 'misc', 'users.ejs'),
					{
						room: room,
						uid: index,
						rid,
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
						rid,
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
 * @param {{action: string, move: string, roles: string[] }} messjson
 */
function handleMessage(socket, req, messjson) {
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
				if (req.session.rooms[rid].roomHost) {
					if (messjson.roles[0]) {
						try {
							messjson.roles.forEach((element, index) => {
								if (!element.match(/^([uo]\d+)?$/)) throw 'Incorrect role';
								if (
									element &&
									messjson.roles.slice(index + 1).find((e) => {
										e === element;
									})
								)
									throw 'Double role';
							});
						} catch (error) {
							console.error(error);
							return;
						}
						const roles = [];
						messjson.roles.forEach((element) => {
							if (element)
								roles.push({
									type: element[0],
									id: new Number(element.slice(1)),
								});
							else roles.push({ type: '' });
						});
						var temp = {};
						const newPlayers = [];
						roles.forEach((element, index) => {
							if (element.type === 'u') {
								newPlayers[index + 1] = room.players[element.id];
								room.players[element.id] = undefined;
								newPlayers[index + 1].session.rooms[rid].uid = index + 1;
								newPlayers[index + 1].session.save();
							} else if (element.type === 'o') {
								newPlayers[index + 1] = room.observers[element.id];
								room.observers[element.id] = undefined;
								newPlayers[index + 1].session.rooms[rid].uid = index + 1;
								newPlayers[index + 1].session.rooms[rid].oid = undefined;
								newPlayers[index + 1].session.save();
							}
						});
						var id = 0;
						room.players.forEach((element) => {
							if (element) {
								while (room.observers[id]) {
									++id;
								}
								room.observers[id] = element;
								element.session.rooms[rid].uid = 0;
								element.session.rooms[rid].oid = id;
								element.session.save();
							}
						});
						room.players = newPlayers;
						var id = 0;
						room.players.forEach((element) => {
							if (element) ++id;
						});
						room.noPlayers = id;

						var id = 0;
						room.observers.forEach((element) => {
							if (element) ++id;
						});
						room.noObservers = id;
						updateUsersList(rid, room);
					}
					gameAPI.startNewGame(
						room.game,
						{
							room: rid,
							players: Math.max(room.minNoPlayers, room.noPlayers),
						},
						(httpsres) => {
							httpsres.on('data', (d) => {
								var data = {};
								try {
									data = JSON.parse(d.toString());
								} catch (error) {
									customLog(['Error at NewGame', error, d.toString()]);
									return;
								}
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
			}
			break;
		case 'NewRound':
			{
				if (req.session.rooms[rid].roomHost) {
					gameAPI.startNewRound(
						room.game,
						{ room: rid },
						(httpsres) => {
							httpsres.on('data', (d) => {
								var data = {};
								try {
									data = JSON.parse(d.toString());
								} catch (error) {
									customLog(['Error at NewRound', error, d.toString()]);
									return;
								}
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
								var data = {};
								try {
									data = JSON.parse(d.toString());
								} catch (error) {
									customLog(['Error at Move', error, d.toString()]);
									return;
								}
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
								var data = {};
								try {
									data = JSON.parse(d.toString());
								} catch (error) {
									customLog(['Error at Move', error, d.toString()]);
									return;
								}
								resjson.accepted = data.accepted;
								resjson.message = data.accepted
									? 'Ruch zaakceptowany'
									: 'Ruch odrzucony';
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
							var data = {};
							try {
								data = JSON.parse(d.toString());
							} catch (error) {
								customLog(['Error at Update', error, d.toString()]);
								return;
							}
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
		case 'List':
			{
				if (req.session.rooms[rid].roomHost) {
					ejs
						.renderFile(
							path.join(
								views,
								'partials',
								'gamesparts',
								'misc',
								'usersRoomHost.ejs'
							),
							{
								room: room,
							}
						)
						.then((list) =>
							socket.send(
								JSON.stringify({
									action: 'List',
									accepted: true,
									list: list,
								})
							)
						);
				}
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
					room.players[uid] = {
						socket: socket,
						username: req.session.username,
						session: req.session,
					};
					++room.noPlayers;
					resjson.description = 'Player' + uid + ' connected';
					noRole = false;
				}
				if (noRole && room.noPlayers < game.maxNoPlayers) {
					var id = 1;
					while (room.players[id]) {
						++id;
					}
					room.players[id] = {
						socket: socket,
						username: req.session.username,
						session: req.session,
					};
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
				room.observers[id] = {
					socket: socket,
					username: req.session.username,
					session: req.session,
				};
				++room.noObservers;
				resjson.description = 'Observer';
			}
			if (!room.host) {
				room.host = true;
				req.session.rooms[rid].roomHost = true;
				ejs
					.renderFile(
						path.join(views, 'partials', 'gamesparts', 'misc', 'roomHost.ejs'),
						{
							game: game,
							room: room,
						}
					)
					.then((list) => {
						socket.send(
							JSON.stringify({
								action: 'RoomHost',
								accepted: true,
								roomHost: list,
							})
						);
					});
			}
			req.session.save();
		} else {
			resjson.accepted = false;
			resjson.response = 'Failed to assign the role';
			resjson.resone = 'Incorrect room id: ' + rid;
		}

		console.log('Role assigned');
		socket.send(JSON.stringify(resjson));
		updateUsersList(rid, room);
		socket.on('message', (message) => {
			var messjson = {};
			try {
				messjson = JSON.parse(message.toString());
			} catch (error) {
				customLog(['Error on WS message', error, message.toString()]);
				return;
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
			if (req.session.rooms[rid].roomHost) {
				room.host = false;
				req.session.rooms[rid].roomHost = false;
				req.session.save();
			}
			updateUsersList(rid, room, 'Left');
		});
	});
});
