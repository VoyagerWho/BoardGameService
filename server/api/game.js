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

/**
 * Helper function to process state based on uid
 * @param {JSON} state - game state object
 */
function processGameState(state, uid) {
	console.log(['processGameState', state]);
	if (state.state.gameActive) {
		if (state.nextPlayer === uid)
			state.nextPlayerDesc = `Twój ruch - wykonaj ${state.nextMove}`;
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

function sendCommand(command, game, data, responseHandler, errorHandler) {
	var options = getHttpsOptionsForGame(game);
	options.path = game.api[command];
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
	options.path = room.game.api['Update'];
	room.players.forEach((player, index) => {
		if (player) {
			var data = JSON.stringify({ room: rid, player: index });
			options.headers['Content-Length'] = data.length;
			httpsRequest(options, data, (res) => {
				res.on('data', (d) => {
					const httpsres = JSON.parse(d.toString());
					if (httpsres.accepted) {
						const resjson = processGameState(httpsres, index);
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
				const httpsres = JSON.parse(d.toString());
				if (httpsres.accepted) {
					const resjson = processGameState(httpsres, 0);
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
module.exports.updateAll = updateAll;
module.exports.processGameState = processGameState;
module.exports.exampleOptions = exampleOptions;
