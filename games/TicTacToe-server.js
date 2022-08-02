const express = require('express');
const app = express.Router();
const bodyParser = require('body-parser');
const TicTacToe = require('./TicTacToeFiles/TicTacToe');

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

app.post('/NewGame', function (req, res) {
	TicTacToe.startNewGame();
	var resjson = {};
	resjson.message = 'New game started!';
	resjson.accepted = true;
	res.json(resjson);
});

app.post('/NewRound', function (req, res) {
	TicTacToe.startNewRound();
	var resjson = {};
	resjson.message = 'New round started!';
	resjson.accepted = true;
	res.json(resjson);
});

app.post('/Move', function (req, res) {
	var pid = null;
	var ppos = null;
	customLog(['Move data', req.body]);
	if (req.body.data === undefined) {
		pid = req.body.player;
		ppos = req.body.move;
	} else {
		var reqjson = {};
		try {
			reqjson = JSON.parse(req.body.data);
		} catch (error) {
			console.error(error);
		}
		customLog(reqjson);
		pid = reqjson.player;
		ppos = reqjson.move;
	}

	var resjson = TicTacToe.updateGame(pid, ppos);
	res.json(resjson);
});

app.post('/Update', function (req, res) {
	var player = null;
	customLog(['Update data', req.body]);
	if (req.body.data === undefined) {
		player = req.body.player;
	} else {
		var reqjson = {};
		try {
			reqjson = JSON.parse(req.body.data);
		} catch (error) {
			console.error(error);
		}
		customLog(reqjson);
		player = reqjson.player;
	}

	var resjson = TicTacToe.getUpdate(player);
	resjson.accepted = true;
	res.json(resjson);
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
		type: 'table',
		rowCount: 3,
		rowLabels: 'd',
		columnCount: 3,
		columnLabels: 'l',
	},
	api: {
		NewGame: '/tictactoe/NewGame',
		NewRound: '/tictactoe/NewRound',
		Move: '/tictactoe/Move',
		Update: '/tictactoe/Update',
	},
};

app
	.route('/api')
	.get((req, res) => {
		res.send(description);
		res.end();
	})
	.post((req, res) => {
		res.send(description);
		res.end();
	});

module.exports.router = app;
