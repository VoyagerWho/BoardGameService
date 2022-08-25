const express = require('express');
const app = express.Router();
const bodyParser = require('body-parser');
const TicTacToe = require('./TicTacToeFiles/TicTacToe');

const rooms = new Map();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(logger);

/**
 * Middleware function for logging URL
 */
function logger(req, res, next) {
	console.log('TTT: ' + req.originalUrl);
	next();
}

/**
 * Function to format log messages
 * @param {any} toLog
 */
function customLog(toLog) {
	console.log('--------------------------------');
	console.log('TicTacToe server:');
	console.log(toLog);
}

//-----------------------------------------------------------------------------
// Game engine API
//-----------------------------------------------------------------------------

app.get('/', function (req, res) {
	res.redirect('/tictactoe/api');
});

app.post('/tictactoe/Open', (req, res) => {
	const rid = req.body.room;
	const host = req.ip;
	const roomName = host + '#' + rid;
	console.log([roomName, req.body]);
	if (!rooms.get(roomName)) {
		rooms.set(roomName, TicTacToe.openRoom());
		res.json({ accepted: true, message: 'New room opened' });
	} else res.json({ accepted: false, message: 'Room exists!' });
});

app.post('/tictactoe/Close', (req, res) => {
	const rid = req.body.room;
	const host = req.ip;
	const roomName = host + '#' + rid;
	console.log([roomName, req.body]);
	if (rooms.get(roomName)) {
		rooms.set(roomName, undefined);
		res.json({ accepted: true, message: 'Room closed' });
	} else res.json({ accepted: false, message: "Room doesn't exists!" });
});

app.post('/tictactoe/NewGame', (req, res) => {
	const rid = req.body.room;
	const host = req.ip;
	const roomName = host + '#' + rid;
	console.log([roomName, req.body]);
	const room = rooms.get(roomName);
	if (room) {
		TicTacToe.startNewGame(room);
		res.json({ accepted: true, message: 'New game started!' });
	} else res.json({ accepted: false, message: "Room doesn't exists!" });
});

app.post('/tictactoe/NewRound', (req, res) => {
	const rid = req.body.room;
	const host = req.ip;
	const roomName = host + '#' + rid;
	console.log([roomName, req.body]);
	const room = rooms.get(roomName);
	if (room) {
		TicTacToe.startNewRound(room);
		res.json({ accepted: true, message: 'New round started!' });
	} else res.json({ accepted: false, message: "Room doesn't exists!" });
});

app.post('/tictactoe/Move', (req, res) => {
	const rid = req.body.room;
	const host = req.ip;
	const roomName = host + '#' + rid;
	console.log([roomName, req.body]);
	const room = rooms.get(roomName);
	if (room) {
		const pid = req.body.player;
		const ppos = req.body.move;
		//customLog(['Move data', req.body]);
		if (TicTacToe.updateGame(room, pid, ppos))
			res.json({ accepted: true, message: 'Move accepted' });
		else res.json({ accepted: false, message: 'Incorrect move data' });
	} else res.json({ accepted: false, message: "Room doesn't exists!" });
});

app.post('/tictactoe/Update', (req, res) => {
	const rid = req.body.room;
	const host = req.ip;
	const roomName = host + '#' + rid;
	console.log([roomName, req.body]);
	const room = rooms.get(roomName);
	if (room) {
		const player = req.body.player;
		//customLog(['Update data', req.body]);
		const data = TicTacToe.getUpdate(room, player);
		if (Object.keys(data).length)
			res.json({
				...{ accepted: true, message: 'Request successful' },
				...data,
			});
		else res.json({ accepted: false, message: 'Request unsuccessful' });
	} else res.json({ accepted: false, message: "Room doesn't exists!" });
});

//-----------------------------------------------------------------------------

const hostname = 'boardgameservice-argen.herokuapp.com';

const description = {
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
		API: '/tictactoe/api',
		NewGame: '/tictactoe/NewGame',
		NewRound: '/tictactoe/NewRound',
		Move: '/tictactoe/Move',
		Update: '/tictactoe/Update',
		Status: '/tictactoe/Status',
		Open: '/tictactoe/Open',
		Close: '/tictactoe/Close',
	},
};

app
	.route('/tictactoe/api')
	.get((req, res) => {
		res.send(description);
		res.end();
	})
	.post((req, res) => {
		res.send(description);
		res.end();
	});

module.exports.router = app;
