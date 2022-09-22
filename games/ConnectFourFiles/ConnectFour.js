const e = require('express');

/**
 * Function to format log messages
 * @param {any} toLog
 */
function customLog(toLog) {
	console.log('--------------------------------');
	console.log('ConnectFour Game Engine:');
	console.log(toLog);
}

//-----------------------------------------------------------------------------
// Game engine
//-----------------------------------------------------------------------------

/**
 * @typedef State
 * @type {object}
 * @property {boolean} gameActive
 * @property {number} [playerWon]
 * @property {boolean} [draw]
 */

/**
 * @typedef Room
 * @type {object}
 * @property {Array<Array<number>>} board - Array representing game board 9x9
 * @property {number} player - Number representing last player
 * @property {number} playerBegin - Number representing player who started last round
 * @property {number} players - Number representing total number of players
 * @property {Array<number>} score - Array representing game score as [ties, wins of player 1, wins of player 2]
 * @property {State} state - Object representing state of the game
 */

/**
 * Function to create new empty game instance for room
 * @param {number} [players=2] - Number of players
 * @returns {Room} game instance
 */
function openRoom(players) {
	const board = new Array(9);
	for (var i = 0; i < board.length; ++i) {
		board[i] = new Array(9).fill(0);
	}
	return {
		board: board,
		player: 1,
		playerBegin: 1,
		players: players || 2,
		score: [0, 0, 0, 0, 0],
		state: { gameActive: false },
	};
}

/**
 * Function to initialize new game
 * clearing previous' game status
 * @param {Room} room - Room instance
 */
function startNewGame(room, players) {
	room.board = new Array(9);
	for (var i = 0; i < room.board.length; ++i) {
		room.board[i] = new Array(9).fill(0);
	}
	room.playerBegin = 1;
	room.player = room.playerBegin;
	room.players = players || 2;
	room.score = [0, 0, 0, 0, 0];
	room.state = { gameActive: true };
}

/**
 * Function to initialize new round
 * clearing previous' round status
 * @param {Room} room - Room instance
 */
function startNewRound(room) {
	room.board = new Array(9);
	for (var i = 0; i < room.board.length; ++i) {
		room.board[i] = new Array(9).fill(0);
	}
	room.playerBegin = (room.playerBegin % room.players) + 1;
	room.player = room.playerBegin;
	room.state.gameActive = true;
	room.state.playerWon = undefined;
	room.state.draw = undefined;
}
/**
 * Function to get current state of the game
 * @param {Room} room - Room instance
 * @param {number} playerId - Id of user { 0 - observer, >0 - players}
 * @returns {object} json representation of game state
 */
function getUpdate(room, playerId) {
	return {
		board: [].concat(...room.board),
		score: room.score,
		state: room.state,
		nextMove: 'choice',
		nextPlayer: room.player,
	};
}

/**
 * Function to return status of the room
 * @param {Room} room
 * @returns {{score: number[], state: State}}
 */
function getStatus(room) {
	return {
		score: room.score,
		state: room.state,
	};
}

/**
 * Function to check if last move score victory
 * @param {Room} room - Room instance
 * @returns {boolean} true if player won, false otherwise
 */
function checkIfWon(room) {
	for (var x = 1; x < 7; ++x) {
		for (var y = 1; y < 7; ++y) {
			// 3 in row
			for (var i = -1; i <= 2; ++i) {
				var line = true;
				for (var j = -1; j <= 2; ++j) {
					//customLog(['Loop', x, y, i, j, x + i, y + j]);
					if (room.board[x + i][y + j] !== room.player) {
						line = false;
						break;
					}
				}
				if (line) return true;
			}

			// 3 in column
			for (var i = -1; i <= 2; ++i) {
				var line = true;
				for (var j = -1; j <= 2; ++j) {
					if (room.board[x + j][y + i] !== room.player) {
						line = false;
						break;
					}
				}
				if (line) return true;
			}

			// check \
			if (
				room.board[x - 1][y - 1] === room.player &&
				room.board[x][y] === room.player &&
				room.board[x + 1][y + 1] === room.player &&
				room.board[x + 2][y + 2] === room.player
			)
				return true;
			// check /
			if (
				room.board[x + 2][y - 1] === room.player &&
				room.board[x + 1][y] === room.player &&
				room.board[x][y + 1] === room.player &&
				room.board[x - 1][y + 2] === room.player
			)
				return true;
		}
	}

	return false;
}

/**
 * Function to check if last move lead to draw
 * @param {Room} room - Room instance
 * @returns {boolean} true if draw, false otherwise
 */
function checkIfDraw(room) {
	if ([].concat(...room.board).indexOf(0) >= 0) return false;
	return true;
}

/**
 * Function to make next move by player
 * @param {Room} room - Room instance
 * @param {number} playerId - Player id number 1 or 2
 * @param {string} position - Move position example a1
 * @returns {boolean} true if move is legal, false otherwise
 */
function makeMove(room, playerId, position) {
	try {
		if (!room.state.gameActive) throw 'Game inactive!';

		if (playerId !== room.player) throw 'Wrong player id: ' + playerId;

		var nocolumn = position.charCodeAt(0) - 'a'.charCodeAt(0);

		if (nocolumn === NaN) throw 'Invalid position: ' + position;
		if (nocolumn < 0 || nocolumn > 8)
			throw 'Column index out of range: ' + nocolumn;

		var norow = position.charCodeAt(1) - '1'.charCodeAt(0);

		if (norow === NaN) throw 'Invalid position: ' + position;
		if (norow < 0 || norow > 8) throw 'Row index out of range: ' + norow;

		if (room.board[norow][nocolumn] !== 0)
			throw 'Invalid position: ' + position;

		room.board[norow][nocolumn] = playerId;
		return true;
	} catch (error) {
		console.error(error);
	}
	return false;
}

/**
 * Function to update game state
 * @param {Room} room - Room instance
 * @param {number} playerId - Player id number 1 or 2
 * @param {string} position - Move position example a1
 */
function updateGame(room, playerId, position) {
	if (makeMove(room, playerId, position)) {
		if (checkIfWon(room)) {
			customLog('Player ' + room.player + ' won!');
			++room.score[room.player];
			room.state.playerWon = room.player;
			room.state.gameActive = false;
		}

		if (checkIfDraw(room)) {
			customLog('Draw!');
			++room.score[0];
			room.state.draw = true;
			room.state.gameActive = false;
		}
		room.player = (playerId % room.players) + 1;
	} else {
		return false;
	}
	return true;
}

module.exports.startNewGame = startNewGame;
module.exports.startNewRound = startNewRound;
module.exports.getUpdate = getUpdate;
module.exports.getStatus = getStatus;
module.exports.makeMove = makeMove;
module.exports.updateGame = updateGame;
module.exports.openRoom = openRoom;
