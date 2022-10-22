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
				var data = {};
				try {
					data = JSON.parse(d.toString());
				} catch (error) {
					customLog(['Error at open', error, d.toString()]);
					res.render('index', {
						text: 'Wystąpił problem',
						middle: 'rooms',
						rooms: rooms,
						games: games,
					});
				}
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
		(err) => {
			customLog(err);
			res.render('index', {
				text: 'Wystąpił przy walidacji',
				middle: 'games',
				games: games,
			});
		}
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
					res.render('index', {
						text: 'Wystąpił błąd przy rejestracji',
						middle: 'games',
						games: games,
					});
					return;
				}
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
				text: 'Wystąpił błąd przy rejestracji',
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
	const gameName = req.params.id;
	const game = games.get(gameName);
	if (game) {
		gameAPI.status(
			game,
			null,
			(httpsres) => {
				httpsres.on('data', (d) => {
					try {
						resjson = JSON.parse(d.toString());
					} catch (error) {
						customLog(['Received Error:', d.toString()]);
						res.render('index', {
							middle: 'games',
							games: games,
							text: 'Nie prawidłowa odpowiedź',
						});
						return;
					}

					customLog(['Received', resjson]);
					if (resjson.accepted) {
						res.render('index', {
							middle: 'games',
							games: games,
							text: 'Gra działa poprawnie',
						});
						return;
					}
					res.render('index', {
						middle: 'games',
						games: games,
						text: 'Wystąpił błąd',
					});
				});
			},
			(err) => {
				customLog(err);
				res.render('index', {
					middle: 'games',
					games: games,
					text: 'Wystąpił problem z połączeniem',
				});
			}
		);
	} else
		res.render('index', {
			middle: 'games',
			games: games,
			text: 'Podana gra nie istnieje',
		});
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
			roomHost: req.session.rooms[rid].roomHost,
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
