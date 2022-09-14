const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const gameAPI = require('../api/game');
const WSHandler = require('../utils/ws');

const wsServer = WSHandler.wsServer;
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
	WSHandler.passSessionParser(sp);
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
		minNoPlayers: game.minNoPlayers || 2,
		maxNoPlayers: game.maxNoPlayers,
		noObservers: 0,
		players: [],
		observers: [],
	};
	rooms.set(name, room);
}

const games = new Map();

const rooms = new Map();
WSHandler.passRooms(rooms);
//---------------------------------------------------------------------
games.set('TicTacToe', {
	name: 'TicTacToe',
	hostname: 'bgs-argen-game-server.herokuapp.com',
	port: 443,
	description: 'Dwuosobowa gra planszowa w kółko i krzyżyk',
	maxNoPlayers: 2,
	boards: [
		{
			type: 'table',
			rowCount: 3,
			rowLabels: 'd',
			columnCount: 3,
			columnLabels: 'l',
		},
		{
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
		{
			type: 'custom',
			tileWidth: 64,
			tileHeight: 64,
			width: 320,
			height: 384,
			background: {
				image:
					'https://i.pinimg.com/736x/0e/10/b5/0e10b5dee4f4d73f7facac1fac79a9c9.jpg',
			},
			textures: [
				'/static/images/textures/Tile1.png',
				'/static/images/textures/Tile1sp1.png',
				'/static/images/textures/Tile1sp2.png',
			],
			tiles: [
				{ x: 64 + 64, y: 0 + 32, name: 'a1' },
				{ x: 128 + 64, y: 64 + 32, name: 'b1' },
				{ x: 0 + 64, y: 192 + 32, name: 'c1' },
				{ x: 64 + 64, y: 64 + 32, name: 'a2' },
				{ x: 64 + 64, y: 128 + 32, name: 'b2' },
				{ x: 128 + 64, y: 192 + 32, name: 'c2' },
				{ x: 0 + 64, y: 64 + 32, name: 'a3' },
				{ x: 64 + 64, y: 192 + 32, name: 'b3' },
				{ x: 64 + 64, y: 256 + 32, name: 'c3' },
			],
		},
		{
			type: 'random',
			real: true,
			numberOfSides: 6,
			numberOfDices: 2,
			rotations: 10,
		},
	],
	api: {
		API: '/TicTacToe/api',
		NewGame: '/TicTacToe/NewGame',
		NewRound: '/TicTacToe/NewRound',
		Move: '/TicTacToe/Move',
		Update: '/TicTacToe/Update',
		Status: '/TicTacToe/Status',
		Open: '/TicTacToe/Open',
		Close: '/TicTacToe/Close',
	},
});

games.set('ManDontGetAngry', {
	name: 'ManDontGetAngry',
	hostname: 'bgs-argen-game-server.herokuapp.com',
	port: 443,
	description: 'Cztero-osobowa gra planszowa w chińczyka',
	maxNoPlayers: 4,
	minNoPlayers: 2,
	boards: [
		{
			type: 'custom',
			tileWidth: 64,
			tileHeight: 64,
			width: 736,
			height: 736,
			background: {
				image:
					'https://i.pinimg.com/736x/0e/10/b5/0e10b5dee4f4d73f7facac1fac79a9c9.jpg',
			},
			textures: [
				'/static/images/textures/Tile1.png',
				'/static/images/textures/Tile1p1.png',
				'/static/images/textures/Tile1p2.png',
				'/static/images/textures/Tile1p3.png',
				'/static/images/textures/Tile1p4.png',
				'/static/images/textures/Tile1s.png',
				'/static/images/textures/Tile1sp1.png',
				'/static/images/textures/Tile1sp2.png',
				'/static/images/textures/Tile1sp3.png',
				'/static/images/textures/Tile1sp4.png',
				'/static/images/textures/TileB.png',
				'/static/images/textures/TileBp.png',
				'/static/images/textures/TileG.png',
				'/static/images/textures/TileGp.png',
				'/static/images/textures/TileR.png',
				'/static/images/textures/TileRp.png',
				'/static/images/textures/TileY.png',
				'/static/images/textures/TileYp.png',
			],
			tiles: [
				{ x: 16, y: 272, name: 's0' },
				{ x: 80, y: 272, name: 'm1' },
				{ x: 144, y: 272, name: 's2' },
				{ x: 208, y: 272, name: 'm3' },
				{ x: 272, y: 272, name: 'm4' },
				{ x: 272, y: 208, name: 'm5' },
				{ x: 272, y: 144, name: 's6' },
				{ x: 272, y: 80, name: 'm7' },
				{ x: 272, y: 16, name: 'm8' },
				{ x: 336, y: 16, name: 'm9' },
				{ x: 400, y: 16, name: 's10' },
				{ x: 400, y: 80, name: 'm11' },
				{ x: 400, y: 144, name: 's12' },
				{ x: 400, y: 208, name: 'm13' },
				{ x: 400, y: 272, name: 'm14' },
				{ x: 464, y: 272, name: 'm15' },
				{ x: 528, y: 272, name: 's16' },
				{ x: 592, y: 272, name: 'm17' },
				{ x: 656, y: 272, name: 'm18' },
				{ x: 656, y: 336, name: 'm19' },
				{ x: 656, y: 400, name: 's20' },
				{ x: 592, y: 400, name: 'm21' },
				{ x: 528, y: 400, name: 's22' },
				{ x: 464, y: 400, name: 'm23' },
				{ x: 400, y: 400, name: 'm24' },
				{ x: 400, y: 464, name: 'm25' },
				{ x: 400, y: 528, name: 's26' },
				{ x: 400, y: 592, name: 'm27' },
				{ x: 400, y: 656, name: 'm28' },
				{ x: 336, y: 656, name: 'm29' },
				{ x: 272, y: 656, name: 's30' },
				{ x: 272, y: 592, name: 'm31' },
				{ x: 272, y: 528, name: 's32' },
				{ x: 272, y: 464, name: 'm33' },
				{ x: 272, y: 400, name: 'm34' },
				{ x: 208, y: 400, name: 'm35' },
				{ x: 144, y: 400, name: 's36' },
				{ x: 80, y: 400, name: 'm37' },
				{ x: 16, y: 400, name: 'm38' },
				{ x: 16, y: 336, name: 'm39' },
				{ x: 16, y: 16, name: 'b1' },
				{ x: 80, y: 16, name: 'b1' },
				{ x: 16, y: 80, name: 'b1' },
				{ x: 80, y: 80, name: 'b1' },
				{ x: 592, y: 592, name: 'b2' },
				{ x: 656, y: 592, name: 'b2' },
				{ x: 592, y: 656, name: 'b2' },
				{ x: 656, y: 656, name: 'b2' },
				{ x: 592, y: 16, name: 'b3' },
				{ x: 656, y: 16, name: 'b3' },
				{ x: 592, y: 80, name: 'b3' },
				{ x: 656, y: 80, name: 'b3' },
				{ x: 16, y: 592, name: 'b4' },
				{ x: 80, y: 592, name: 'b4' },
				{ x: 16, y: 656, name: 'b4' },
				{ x: 80, y: 656, name: 'b4' },
				{ x: 80, y: 336, name: 'f1' },
				{ x: 144, y: 336, name: 'f1' },
				{ x: 208, y: 336, name: 'f1' },
				{ x: 272, y: 336, name: 'f1' },
				{ x: 592, y: 336, name: 'f2' },
				{ x: 528, y: 336, name: 'f2' },
				{ x: 464, y: 336, name: 'f2' },
				{ x: 400, y: 336, name: 'f2' },
				{ x: 336, y: 272, name: 'f3' },
				{ x: 336, y: 208, name: 'f3' },
				{ x: 336, y: 144, name: 'f3' },
				{ x: 336, y: 80, name: 'f3' },
				{ x: 336, y: 400, name: 'f4' },
				{ x: 336, y: 464, name: 'f4' },
				{ x: 336, y: 528, name: 'f4' },
				{ x: 336, y: 592, name: 'f4' },
			],
		},
		{
			type: 'random',
			real: true,
			numberOfSides: 6,
			numberOfDices: 1,
			rotations: 10,
		},
	],
	api: {
		API: '/ManDontGetAngry/api',
		NewGame: '/ManDontGetAngry/NewGame',
		NewRound: '/ManDontGetAngry/NewRound',
		Move: '/ManDontGetAngry/Move',
		Update: '/ManDontGetAngry/Update',
		Status: '/ManDontGetAngry/Status',
		Open: '/ManDontGetAngry/Open',
		Close: '/ManDontGetAngry/Close',
	},
});

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());
router.get('/', (req, res) => {
	if (req.session.rooms === undefined) req.session.rooms = {};
	customLog(req.session.rooms);
	res.render('index', {
		middle: 'rooms',
		rooms: rooms,
		games: games,
	});
});

router.get('/games', (req, res) => {
	res.render('index', { middle: 'games', games: games });
});

router.post('/open', (req, res) => {
	const gameId = req.body.gameId;

	if (!gameId || typeof gameId !== 'string') {
		console.error('Incorrect type ' + typeof gameId);
		res.render('index', {
			text: 'Nieprawidłowe dane formularza',
			middle: 'rooms',
			rooms: rooms,
			games: games,
		});
		return;
	}
	const game = games.get(gameId);
	if (!game) {
		console.error('Game: ' + gameId + " doesn't exist");
		res.render('index', {
			text: 'Gra: ' + gameId + ' nie istnieje',
			middle: 'rooms',
			rooms: rooms,
			games: games,
		});
		return;
	}
	const name = req.body.name;
	if (rooms.get(name)) {
		console.error('Room: ' + name + ' already exists');
		res.render('index', {
			text: 'Pokój: ' + name + ' już istnieje',
			middle: 'rooms',
			rooms: rooms,
			games: games,
		});
		return;
	}
	gameAPI.open(
		game,
		{ room: name },
		(httpsres) => {
			httpsres.on('data', (d) => {
				const data = JSON.parse(d.toString());
				customLog(['Game Open Response', data]);
				if (data.accepted) {
					openRoom(name, game);
					customLog(['Room opened', rooms]);
					res.render('index', {
						text: 'Pokój został otwarty',
						middle: 'rooms',
						rooms: rooms,
						games: games,
					});
				} else {
					console.error(
						`Could not open room for game: ${game.name} at ${game.hostname}`
					);
					res.render('index', {
						text: 'Wystąpił błąd przy próbie otworzenia pokoju',
						middle: 'rooms',
						rooms: rooms,
						games: games,
					});
				}
			});
		},
		null
	);
});

router.post('/games/register', (req, res) => {
	const gameUrl = req.body.url;
	try {
		new URL(gameUrl);
	} catch (error) {
		res.render('index', {
			text: 'Nieprawidłowy adres URL',
			middle: 'games',
			games: games,
		});
	}
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
				// game parsing
				if (!resjson.accepted) {
					customLog(['Register Error', resjson]);
					res.render('index', {
						text: 'Wystąpił błąd przy rejestracji',
						middle: 'games',
						games: games,
					});
					return;
				}
				const api = resjson.api;
				const game = games.get(api.name);
				if (game) {
					customLog(['Dublicate', api, game]);
					res.render('index', {
						text: 'Gra już zarejestrowana',
						middle: 'games',
						games: games,
					});
					return;
				}
				games.set(api.name, api);
				customLog(['Registered:', api, games]);
				res.render('index', {
					text: 'Gra została zarejestrowana',
					middle: 'games',
					games: games,
				});
			});
		},
		(err) => {
			customLog(err);
			res.render('index', {
				text: 'Wystąpił przy rejestracji',
				middle: 'games',
				games: games,
			});
		}
	);
});

router.post('/games/check', (req, res) => {
	const gameUrl = req.body.url;
	try {
		new URL(gameUrl);
	} catch (error) {
		res.json({ accepted: false, message: 'Nieprawidłowy adres URL' });
		return;
	}
	var resjson = {};
	customLog('Sending request...');
	gameAPI.httpsRequest(
		gameUrl,
		null,
		(httpsres) => {
			httpsres.on('data', (d) => {
				try {
					resjson = JSON.parse(d.toString());
					//game parsing
				} catch (error) {
					customLog(['Received Error:', d.toString()]);
					res.json({
						accepted: false,
						message: 'Wystąpił błąd przy rejestracji',
					});
					return;
				}

				customLog(['Received and sent:', resjson]);
				res.json({ accepted: true, message: 'Gra zatwierdzona' });
			});
		},
		(err) => {
			customLog(err);
			res.json({
				accepted: false,
				message: 'Wystąpił błąd połączenia z serwerem gry',
			});
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
			middle: 'gameSpace',
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
		res.redirect('/rooms/' + rid);
	} else res.redirect('/rooms');
});

router.get('/:id/Join', (req, res) => {
	const rid = req.params.id;
	if (rooms.get(rid)) {
		if (req.session.rooms === undefined) req.session.rooms = {};
		req.session.rooms[rid] = { uid: -1 };
		res.redirect('/rooms/' + rid);
	} else res.redirect('/rooms');
});

router.post('/:id/Close', (req, res) => {
	const rid = req.params.id;
	const room = rooms.get(rid);
	if (room) {
		gameAPI.close(
			room.game,
			{ room: rid },
			(httpsres) => {
				httpsres.on('data', (d) => {
					try {
						resjson = JSON.parse(d.toString());
					} catch (error) {
						customLog(['Received Error:', d.toString()]);
						resjson.accepted = false;
						res.render('index', {
							text: 'Wystąpił błąd',
							middle: 'rooms',
							rooms: rooms,
							games: games,
						});
						return;
					}
					if (resjson.accepted) {
						rooms.delete(rid);
						res.render('index', {
							text: 'Pokój zamknięty',
							middle: 'rooms',
							rooms: rooms,
							games: games,
						});
					} else {
						customLog(['Received Error:', resjson]);
						res.render('index', {
							text: 'Wystąpił błąd przy zamykaniu pokoju',
							middle: 'rooms',
							rooms: rooms,
							games: games,
						});
					}
				});
			},
			(err) => {
				customLog(err);
				res.render('index', {
					text: 'Wystąpił błąd',
					middle: 'rooms',
					rooms: rooms,
					games: games,
				});
			}
		);
	} else
		res.render('index', {
			text: 'Pokój nie istnieje',
			middle: 'rooms',
			rooms: rooms,
			games: games,
		});
});

// // runs every time on param
// router.param('id', (req, res, next, param) => {
// 	customLog(['Param:', param]);
// 	next();
// });

module.exports.router = router;
module.exports.wsServer = wsServer;
module.exports.passSessionParser = passSessionParser;
