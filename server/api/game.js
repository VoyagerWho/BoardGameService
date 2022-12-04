const https = require('https');

const exampleOptions = {
	hostname: 'localhost',
	port: 1107,
	path: '/example',
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Content-Length': 0,
	},
};

function customLog(toLog) {
	console.log('--------------------------------');
	console.log('GameAPI:');
	console.log(toLog);
}

/**
 * Helper function to calculate next side of rolling dice
 * @param {number} side
 * @param {number} turn
 * @returns Number of dots on current side
 */
function rollDices(dices, rotations) {
	const result = [];
	const getNextSide = (current) => {
		const direction = Math.floor(Math.random() * 4) + 1;
		switch (current) {
			case 1:
				{
					switch (direction) {
						case 1:
							return 5;
						case 2:
							return 3;
						case 3:
							return 2;
						case 4:
							return 4;
					}
				}
				break;
			case 2:
				{
					switch (direction) {
						case 1:
							return 1;
						case 2:
							return 3;
						case 3:
							return 6;
						case 4:
							return 4;
					}
				}
				break;
			case 3:
				{
					switch (direction) {
						case 1:
							return 5;
						case 2:
							return 6;
						case 3:
							return 2;
						case 4:
							return 1;
					}
				}
				break;
			case 4:
				{
					switch (direction) {
						case 1:
							return 5;
						case 2:
							return 1;
						case 3:
							return 2;
						case 4:
							return 6;
					}
				}
				break;
			case 5:
				{
					switch (direction) {
						case 1:
							return 6;
						case 2:
							return 3;
						case 3:
							return 1;
						case 4:
							return 4;
					}
				}
				break;
			case 6:
				{
					switch (direction) {
						case 1:
							return 2;
						case 2:
							return 3;
						case 3:
							return 5;
						case 4:
							return 4;
					}
				}
				break;
		}
	};
	const getRandomInt = () => {
		return Math.floor(Math.random() * 6) + 1;
	};
	for (var i = 0; i < dices; ++i) {
		result.push([]);
		result[i].push(getRandomInt());
		for (var j = 1; j < rotations; ++j) {
			result[i].push(getNextSide(result[i][j - 1]));
		}
	}
	return result;
}

/**
 * Helper function to get dice rolls without any constraints
 * @param {number} dices - number of dices
 * @param {number} sides - number of sides on dice
 * @param {*} rotations - number of rolls of single dice
 * @returns {number[][]} List of drawn sides
 */
function genRandom(dices, sides, rotations) {
	const result = [];
	const getRandomInt = () => {
		return Math.floor(Math.random() * sides) + 1;
	};
	for (var i = 0; i < dices; ++i) {
		result.push([]);
		for (var j = 0; j < rotations; ++j) {
			result[i].push(getRandomInt());
		}
	}
	return result;
}

/**
 * @typedef DiceSimulatorDescription
 * @type {object}
 * @property {boolean} real - wheter to use real 6 faced dice or arbitrary one
 * @property {number} [numberOfSides=6] - how many sides a single dice have (ommited if real = true)
 * @property {number} numberOfDices - how many dices are used at once
 * @property {number} [rotations=1] - number of rolls of single dice (useful for animations)
 */

/**
 * Function to simulate throw of dices
 * @param {DiceSimulatorDescription} desc - describption of the dice throw simulator
 * @returns {number[][]} list of dices sides shown after roling
 */
function throwDices(desc) {
	const rotations = desc.rotations || 1;
	if (desc.real) return rollDices(desc.numberOfDices, rotations);
	else return genRandom(desc.numberOfDices, desc.numberOfSides || 6, rotations);
}

/**
 * Helper function to process state based on uid
 * @param {JSON} state - game state object
 */
function processGameState(state, uid) {
	console.log(['processGameState', state]);
	const moveTypes = {
		move: 'Wykonaj ruch pionkiem',
		choice: 'Wybierz pole planczy',
		throw: 'Rzuć kością(kośćmi) do gry',
	};
	if (state.state.gameActive) {
		if (state.nextPlayer === uid)
			state.nextPlayerDesc = `Twój ruch - ${moveTypes[state.nextMove]}`;
		else state.nextPlayerDesc = `Ruch Gracza Player${state.nextPlayer}`;
		state.gameActiveDesc = 'Runda rozpoczęta';
	} else {
		if (state.state.draw) state.nextPlayerDesc = 'Runda zakończona remisem!';
		else if (state.state.playerWon) {
			if (state.state.playerWon === uid)
				state.nextPlayerDesc = 'Wygrałeś rundę';
			else
				state.nextPlayerDesc = `Rundę wygrał Gracz Player${state.state.playerWon}`;
		} else state.nextPlayerDesc = ' ';
		state.gameActiveDesc = 'Gra zakończona';
	}
	return state;
}

/**
 * Function to send https request
 * @param {string | URL | https.RequestOptions} options
 * @param {*} data
 * @param {(res: https.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler
 */
function httpsRequest(options, data, responseHandler, errorHandler) {
	if (!errorHandler)
		errorHandler = function (err) {
			console.error(err);
		};
	var httpsreq = https.request(options, responseHandler);
	httpsreq.on('error', errorHandler);
	if (data) httpsreq.write(data);
	httpsreq.end();
}

/**
 * Helper function to generate default request options for given game
 *
 * Example of returned JSON object:
 * @example
 * {
 *   hostname: 'localhost',
 *   port: 1107,
 *   path: '/example',
 *   method: 'POST',
 *   headers: {
 *       'Content-Type': 'application/json',
 *       'Content-Length': 0
 * }
 *
 * @param {JSON} game - game api description
 * @returns {https.RequestOptions}
 */
function getHttpsOptionsForGame(game) {
	var options = {
		path: '/',
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': 0,
		},
		timeout: 3000,
		rejectUnauthorized: false,
		strictSSL: false,
	};
	options.hostname = game.hostname;
	options.port = game.port;
	return options;
}

/**
 * Function handling command `NewGame`
 * @param {JSON} game - game api description
 * @param {JSON} data - data to send
 * @param {(res: https.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler
 */
const startNewGame = (game, data, responseHandler, errorHandler) =>
	sendCommand('NewGame', game, data, responseHandler, errorHandler);

/**
 * Function handling command `NewRound`
 * @param {JSON} game - game api description
 * @param {JSON} data - data to send
 * @param {(res: https.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler
 */
const startNewRound = (game, data, responseHandler, errorHandler) =>
	sendCommand('NewRound', game, data, responseHandler, errorHandler);

/**
 * Function handling command `Move`
 * @param {JSON} game - game api description
 * @param {JSON} data - data to send
 * @param {(res: https.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler
 */
const makeMove = (game, data, responseHandler, errorHandler) =>
	sendCommand('Move', game, data, responseHandler, errorHandler);

/**
 * Function handling command `Update`
 * @param {JSON} game - game api description
 * @param {JSON} data - data to send
 * @param {(res: https.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler
 */
const update = (game, data, responseHandler, errorHandler) =>
	sendCommand('Update', game, data, responseHandler, errorHandler);

/**
 * Function handling command `Status`
 * @param {JSON} game - game api description
 * @param {JSON} data - data to send
 * @param {(res: https.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler
 */
const status = (game, data, responseHandler, errorHandler) =>
	sendCommand('Status', game, data, responseHandler, errorHandler);

/**
 * Function handling command `Open`
 * @param {JSON} game - game api description
 * @param {JSON} data - data to send
 * @param {(res: https.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler
 */
const open = (game, data, responseHandler, errorHandler) =>
	sendCommand('Open', game, data, responseHandler, errorHandler);

/**
 * Function handling command `Close`
 * @param {JSON} game - game api description
 * @param {JSON} data - data to send
 * @param {(res: https.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler
 */
const close = (game, data, responseHandler, errorHandler) =>
	sendCommand('Close', game, data, responseHandler, errorHandler);

function sendCommand(command, game, data, responseHandler, errorHandler) {
	var options = getHttpsOptionsForGame(game);
	options.path = game.functions[command];
	if (data && Object.keys(data).length) {
		console.log({ command, data });
		data = JSON.stringify(data);
		options.headers['Content-Length'] = data.length;
	} else data = null;
	httpsRequest(options, data, responseHandler, errorHandler);
}

/**
 * Function handling update of GUI for every room member
 * @param {String} rid - ID of room instance
 * @param {JSON} room - room instance to update
 */
function updateAll(rid, room) {
	var options = getHttpsOptionsForGame(room.game);
	options.path = room.game.functions['Update'];
	room.players.forEach((player, index) => {
		if (player) {
			var data = JSON.stringify({ room: rid, player: index });
			options.headers['Content-Length'] = data.length;
			httpsRequest(options, data, (res) => {
				res.on('data', (d) => {
					var httpsres = {};
					try {
						httpsres = JSON.parse(d.toString());
					} catch (error) {
						customLog(['Error at updateAll', error, d.toString()]);
					}
					if (httpsres.accepted) {
						const resjson = processGameState(httpsres, index);
						// swap single instance to array
						if (resjson.board) {
							resjson.boards = [];
							resjson.boards[0] = resjson.board;
							resjson.board = undefined;
						}
						resjson.action = 'Update';
						player.socket.send(JSON.stringify(resjson));
					} else
						console.log([`Update API error (on player ${index})`, httpsres]);
				});
			});
		}
	});
	if (room.observers.length) {
		var data = JSON.stringify({ room: rid, player: 0 });
		options.headers['Content-Length'] = data.length;
		httpsRequest(options, data, (res) => {
			res.on('data', (d) => {
				var httpsres = {};
				try {
					httpsres = JSON.parse(d.toString());
				} catch (error) {
					customLog(['Error at updateAll', error, d.toString()]);
				}
				if (httpsres.accepted) {
					const resjson = processGameState(httpsres, 0);
					// swap single instance to array
					if (resjson.board) {
						resjson.boards = [];
						resjson.boards[0] = resjson.board;
						resjson.board = undefined;
					}
					resjson.action = 'Update';
					room.observers.forEach((observer) => {
						if (observer) {
							observer.socket.send(JSON.stringify(resjson));
						}
					});
				} else
					console.log([`Update API error (on observer ${index})`, httpsres]);
			});
		});
	}
}

module.exports.httpsRequest = httpsRequest;
module.exports.startNewGame = startNewGame;
module.exports.startNewRound = startNewRound;
module.exports.makeMove = makeMove;
module.exports.update = update;
module.exports.status = status;
module.exports.open = open;
module.exports.close = close;
module.exports.updateAll = updateAll;
module.exports.processGameState = processGameState;
module.exports.exampleOptions = exampleOptions;
module.exports.throwDices = throwDices;
