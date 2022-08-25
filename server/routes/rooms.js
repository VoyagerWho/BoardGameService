const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const gameAPI = require('../api/game');
const ws = require('ws');
const ejs = require('ejs');
const path = require('path');

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
	router.use(sessionParser);
}

function customLog(toLog) {
	console.log('--------------------------------');
	console.log('Room router:');
	console.log(toLog);
}

/**
 * Function to create empty room for game
 * @param {String} name
 * @param {*} game
 */
function openRoom(name, game) {
	var room = {
		game: game,
		noPlayers: 0,
		maxNoPlayers: game.maxNoPlayers,
		noObservers: 0,
		players: [],
		observers: [],
	};
	rooms.set(name, room);
}

const hostname = 'boardgameservice-argen.herokuapp.com';
const games = new Map();
const rooms = new Map();

games.set('0', {
	name: 'TicTacToe',
	hostname: hostname,
	port: 443,
	description: 'Dwuosobowa gra  planszowa w kółko i krzyżyk',
	maxNoPlayers: 2,
	board: {
		type: 'simple',
		rowCount: 3,
		rowLabels: 'd',
		columnCount: 3,
		columnLabels: 'l',
		tileWidth: 64,
		tileHeight: 64,
		textures: [
			'/static/images/textures/Tile1.png',
			'/static/images/textures/Tile1sp1.png',
			'/static/images/textures/Tile1sp2.png',
		],
	},
	api: {
		NewGame: '/tictactoe/NewGame',
		NewRound: '/tictactoe/NewRound',
		Move: '/tictactoe/Move',
		Update: '/tictactoe/Update',
	},
});

openRoom('0', games.get('0'));

//---------------------------------------------------------------------
const wsServer = new ws.Server({ noServer: true });

/**
 * Function handling update of Users list for every room member
 * @param {String} rid - ID of room instance
 * @param {JSON} room - room instance to update
 */
function updateUsersList(room) {
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
							action: 'Joined',
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
							action: 'Joined',
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
				gameAPI.makeMove(
					room.game,
					{
						room: rid,
						player: req.session.rooms[rid].uid,
						move: messjson.move,
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
		case 'Update':
			{
				gameAPI.update(
					room.game,
					{ room: rid, player: req.session.rooms[rid].uid },
					(httpsres) => {
						httpsres.on('data', (d) => {
							customLog(['Update response', data]);
							const data = JSON.parse(d.toString());
							if (data.accepted) {
								resjson = gameAPI.processGameState(
									data,
									req.session.rooms[rid].uid
								);
								resjson.action = 'Update';
								socket.send(JSON.stringify(resjson));
							} else customLog(['Update API error', data]);
						});
					},
					null
				);
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
		console.log(req.session.rooms);
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
		});
	});
});

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
router.get('/', (req, res) => {
	if (req.session.rooms === undefined) req.session.rooms = {};
	customLog(req.session.rooms);
	res.render('index', {
		text: 'List of open rooms',
		middle: 'rooms',
		rooms: rooms,
		games: games,
	});
});

router.get('/games', (req, res) => {
	res.render('index', { text: 'List of games', middle: 'games', games: games });
});

router.post('/open', (req, res) => {
	const gameId = Number(req.body.gameId);

	if (gameId === undefined || gameId === null || typeof gameId !== 'number') {
		console.error('Incorrect type ' + typeof gameId);
		res.redirect('/rooms');
		return;
	}
	if (gameId < 0 || gameId >= games.length) {
		console.error('Out of range ' + gameId);
		res.redirect('/rooms');
		return;
	}
	openRoom(req.body.name, games[req.body.gameId]);
	customLog(['Room opened', rooms]);
	res.redirect('/rooms');
});

router.post('/games/register', (req, res) => {
	customLog(req.body);
	const gameUrl = req.body.url;
	var resjson = {};
	gameAPI.httpsRequest(
		gameUrl,
		null,
		(httpsres) => {
			httpsres.on('data', (d) => {
				try {
					resjson = JSON.parse(d.toString());
				} catch (error) {
					customLog(['Received Error:', d.toString()]);
					resjson.accepted = false;
					res.redirect('/games');
					return;
				}

				customLog(['Received:', resjson]);
				// game parsing
				games.set(resjson.name, resjson);
				res.redirect('/games');
			});
		},
		(err) => {
			customLog(err);
			resjson = {
				accepted: false,
			};
			res.redirect('/games');
		}
	);
});

router.post('/games/check', (req, res) => {
	const gameUrl = req.body.url;
	var resjson = {};
	customLog('Sending request...');
	gameAPI.httpsRequest(
		gameUrl,
		null,
		(httpsres) => {
			httpsres.on('data', (d) => {
				try {
					resjson = JSON.parse(d.toString());
				} catch (error) {
					customLog(['Received Error:', d.toString()]);
					resjson.accepted = false;
					res.json(resjson);
					res.end();
					return;
				}

				customLog(['Received and sent:', resjson]);
				resjson.accepted = true;
				res.json(resjson);
				res.end();
			});
		},
		(err) => {
			customLog(err);
			resjson = {
				accepted: false,
			};
			res.json(resjson);
			res.end();
		}
	);
});

router.get('/games/check/:id', (req, res) => {
	res.redirect('/games');
});

router.get('/:id', (req, res) => {
	const rid = req.params.id;
	if (req.session.rooms === undefined) req.session.rooms = {};
	if (req.session.rooms[rid] === undefined) req.session.rooms[rid] = { uid: 0 };
	customLog(['Site opened', req.session.rooms]);
	if (rooms.get(rid)) {
		const room = rooms.get(rid);
		const game = room.game;
		res.render('index', {
			headerMess: game.name,
			middle: 'board',
			game: game,
			room: room,
			uid: req.session.rooms[rid].uid,
			oid:
				req.session.rooms[rid].uid == 0
					? req.session.rooms[rid].oid
					: undefined,
		});
	} else res.redirect('/rooms');
});

router.get('/:id/Observe', (req, res) => {
	const rid = req.params.id;
	if (rooms.get(rid)) {
		if (req.session.rooms === undefined) req.session.rooms = {};
		req.session.rooms[rid] = { uid: 0 };
		req.session.save();
		res.redirect('/rooms/' + rid);
	} else res.redirect('/rooms');
});

router.get('/:id/Join', (req, res) => {
	const rid = req.params.id;
	if (rooms.get(rid)) {
		if (req.session.rooms === undefined) req.session.rooms = {};
		req.session.rooms[rid] = { uid: -1 };
		req.session.save();
		res.redirect('/rooms/' + rid);
	} else res.redirect('/rooms');
});

// runs every time on param
router.param('name', (req, res, next, param) => {
	customLog(param);
	next();
});

module.exports.router = router;
module.exports.wsServer = wsServer;
module.exports.passSessionParser = passSessionParser;
