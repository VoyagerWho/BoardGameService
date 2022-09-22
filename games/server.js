const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const games = {
	TicTacToe: require('./TicTacToeFiles/TicTacToe'),
	ConnectFour: require('./ConnectFourFiles/ConnectFour'),
	ManDontGetAngry: require('./ManDGAFiles/ManDGA'),
	Statki: require('./BattleshipsFiles/Battleships'),
};
const OpenApiValidator = require('express-openapi-validator');
const https = require('https');
const fs = require('fs');

const rooms = new Map();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger);

app.use(
	OpenApiValidator.middleware({
		apiSpec: './openAPI/openapi.yml',
		validateRequests: true, // (default)
		validateResponses: true, // false by default
	})
);

/**
 * Middleware function for logging URL
 */
function logger(req, res, next) {
	console.log('Path: ' + req.originalUrl);
	next();
}

/**
 * Function to format log messages
 * @param {any} toLog
 */
function customLog(toLog) {
	console.log('--------------------------------');
	console.log('GameServer:');
	console.log(toLog);
}

//-----------------------------------------------------------------------------
// Game engine API
//-----------------------------------------------------------------------------

app.get('/', (req, res) => {
	res.sendFile('index.html', { root: __dirname });
});

app.post('/:GameName/Open', (req, res) => {
	const gameName = req.params.GameName;
	const game = games[gameName];
	if (!game) res.json({ accepted: false, message: "Game doesn't exists!" });
	const rid = req.body.room;
	const host = req.ip;
	const roomName = '#' + rid;
	console.log([roomName, req.body]);
	if (!rooms.get(roomName)) {
		rooms.set(roomName, game.openRoom());
		customLog(['Opened room', rooms]);
		res.json({ accepted: true, message: 'New room opened' });
	} else res.json({ accepted: false, message: 'Room exists!' });
});

app.post('/:GameName/Close', (req, res) => {
	const gameName = req.params.GameName;
	const game = games[gameName];
	if (!game) res.json({ accepted: false, message: "Game doesn't exists!" });
	const rid = req.body.room;
	const host = req.ip;
	const roomName = '#' + rid;
	console.log([roomName, req.body]);
	if (rooms.get(roomName)) {
		rooms.delete(roomName);
		customLog(['Closed room', rooms]);
		res.json({ accepted: true, message: 'Room closed' });
	} else res.json({ accepted: true, message: "Room doesn't exists!" });
});

app.post('/:GameName/NewGame', (req, res) => {
	const gameName = req.params.GameName;
	const game = games[gameName];
	if (!game) res.json({ accepted: false, message: "Game doesn't exists!" });
	const rid = req.body.room;
	const host = req.ip;
	const roomName = '#' + rid;
	console.log([roomName, req.body]);
	const room = rooms.get(roomName);
	if (room) {
		game.startNewGame(room, req.body.players);
		res.json({ accepted: true, message: 'New game started!' });
	} else res.json({ accepted: false, message: "Room doesn't exists!" });
});

app.post('/:GameName/NewRound', (req, res) => {
	const gameName = req.params.GameName;
	const game = games[gameName];
	if (!game) res.json({ accepted: false, message: "Game doesn't exists!" });
	const rid = req.body.room;
	const host = req.ip;
	const roomName = '#' + rid;
	console.log([roomName, req.body]);
	const room = rooms.get(roomName);
	if (room) {
		game.startNewRound(room);
		res.json({ accepted: true, message: 'New round started!' });
	} else res.json({ accepted: false, message: "Room doesn't exists!" });
});

app.post('/:GameName/Move', (req, res) => {
	const gameName = req.params.GameName;
	const game = games[gameName];
	if (!game) res.json({ accepted: false, message: "Game doesn't exists!" });
	const rid = req.body.room;
	const host = req.ip;
	const roomName = '#' + rid;
	console.log([roomName, req.body]);
	const room = rooms.get(roomName);
	if (room) {
		const pid = req.body.player;
		const move = req.body.move;
		if (move === 'throw') {
			if (game.updateGame(room, pid, move, req.body.dices))
				res.json({
					accepted: true,
					message: 'Throw accepted',
					dices: req.body.dices,
				});
			else res.json({ accepted: false, message: 'Incorrect move data' });
			return;
		}
		if (game.updateGame(room, pid, move))
			res.json({ accepted: true, message: 'Move accepted' });
		else res.json({ accepted: false, message: 'Incorrect move data' });
	} else res.json({ accepted: false, message: "Room doesn't exists!" });
	console.log('Move handled');
});

app.post('/:GameName/Update', (req, res) => {
	const gameName = req.params.GameName;
	const game = games[gameName];
	if (!game) res.json({ accepted: false, message: "Game doesn't exists!" });
	const rid = req.body.room;
	const host = req.ip;
	const roomName = '#' + rid;
	console.log([roomName, req.body]);
	const room = rooms.get(roomName);
	if (room) {
		const player = req.body.player;
		const data = game.getUpdate(room, player);
		if (Object.keys(data).length) {
			customLog([
				'response:',
				{
					...{ accepted: true, message: 'Request successful' },
					...data,
				},
			]);
			res.json({
				...{ accepted: true, message: 'Request successful' },
				...data,
			});
		} else res.json({ accepted: false, message: 'Request unsuccessful' });
	} else res.json({ accepted: false, message: "Room doesn't exists!" });
});

app.post('/:GameName/Status', (req, res) => {
	const gameName = req.params.GameName;
	const game = games[gameName];
	if (!game) res.json({ accepted: false, message: "Game doesn't exists!" });
	const rid = req.body.room;
	if (rid) {
		const host = req.ip;
		const roomName = '#' + rid;
		console.log([roomName, req.body]);
		const room = rooms.get(roomName);
		if (room) {
			const data = game.getStatus(room);
			res.json({
				...{ accepted: true, message: 'Room active' },
				...data,
			});
		} else res.json({ accepted: true, message: "Room doesn't exists!" });
	}
	res.json({ accepted: true, message: 'Server online!' });
});

//-----------------------------------------------------------------------------

const hostname = 'bgs-argen-game-server.herokuapp.com';
const port = process.env.PORT || process.argv[2] || 8443;

const description = {
	TicTacToe: {
		name: 'TicTacToe',
		hostname: hostname,
		port: 443,
		description: 'Dwuosobowa gra planszowa w kółko i krzyżyk',
		maxNoPlayers: 2,
		minNoPlayers: 2,
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
				'/static/images/textures/Tile1sp3.png',
				'/static/images/textures/Tile1sp4.png',
			],
		},
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
	},
	ConnectFour: {
		name: 'ConnectFour',
		hostname: hostname,
		port: 443,
		description: 'Cztero-osobowa gra planszowa w połącz 4 w linii',
		maxNoPlayers: 4,
		minNoPlayers: 2,
		board: {
			type: 'simple',
			rowCount: 9,
			rowLabels: 'd',
			columnCount: 9,
			columnLabels: 'l',
			tileWidth: 64,
			tileHeight: 64,
			textures: [
				'/static/images/textures/Tile1.png',
				'/static/images/textures/Tile1sp1.png',
				'/static/images/textures/Tile1sp2.png',
				'/static/images/textures/Tile1sp3.png',
				'/static/images/textures/Tile1sp4.png',
			],
		},
		api: {
			API: '/ConnectFour/api',
			NewGame: '/ConnectFour/NewGame',
			NewRound: '/ConnectFour/NewRound',
			Move: '/ConnectFour/Move',
			Update: '/ConnectFour/Update',
			Status: '/ConnectFour/Status',
			Open: '/ConnectFour/Open',
			Close: '/ConnectFour/Close',
		},
	},
	ManDontGetAngry: {
		name: 'ManDontGetAngry',
		hostname: hostname,
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
	},
	Statki: {
		name: 'Statki',
		hostname: hostname,
		port: 443,
		description: 'Dwuosobowa gra w statki',
		maxNoPlayers: 2,
		minNoPlayers: 2,
		boards: [
			{
				type: 'simple',
				rowCount: 8,
				rowLabels: 'd',
				columnCount: 8,
				columnLabels: 'l',
				tileWidth: 64,
				tileHeight: 64,
				textures: [
					'/static/images/textures/Tile1.png',
					'/static/images/textures/Tile1p1.png',
					'/static/images/textures/Tile1p2.png',
					'/static/images/textures/Tile1s.png',
					'/static/images/textures/Tile1sp1.png',
					'/static/images/textures/Tile1sp2.png',
				],
			},
			{
				type: 'simple',
				rowCount: 8,
				rowLabels: 'd',
				columnCount: 8,
				columnLabels: 'l',
				tileWidth: 64,
				tileHeight: 64,
				textures: [
					'/static/images/textures/Tile1.png',
					'/static/images/textures/Tile1p1.png',
					'/static/images/textures/Tile1p2.png',
					'/static/images/textures/Tile1s.png',
					'/static/images/textures/Tile1sp1.png',
					'/static/images/textures/Tile1sp2.png',
				],
			},
		],
		api: {
			API: '/Statki/api',
			NewGame: '/Statki/NewGame',
			NewRound: '/Statki/NewRound',
			Move: '/Statki/Move',
			Update: '/Statki/Update',
			Status: '/Statki/Status',
			Open: '/Statki/Open',
			Close: '/Statki/Close',
		},
	},
};

app
	.route('/:GameName/api')
	.get((req, res) => {
		if (!description[req.params.GameName]) {
			res.json({ accepted: false, message: 'Gra nie istnieje!' });
			return;
		}
		res.json({ accepted: true, api: description[req.params.GameName] });
	})
	.post((req, res) => {
		if (!description[req.params.GameName]) {
			res.json({ accepted: false, message: 'Gra nie istnieje!' });
			return;
		}
		res.json({ accepted: true, api: description[req.params.GameName] });
	});

app.use((err, req, res, next) => {
	// format error
	customLog(err);
	res.status(err.status || 500).json({
		accepted: false,
		message: err.message,
	});
});

var server = app.listen(port, () => {
	customLog('App listening');
});
