/**
 * Function to format log messages
 * @param {any} toLog - Value to print to console
 */
function customLog(toLog) {
	console.log('--------------------------------');
	console.log('TicTacToe Game Engine:');
	console.log(toLog);
}

//-----------------------------------------------------------------------------
// Game engine
//-----------------------------------------------------------------------------

/**
 * @typedef State
 * @type {object}
 * @property {boolean} gameActive - Flag whether game is active
 * @property {number} [playerWon] - Id of the player who won last round
 * @property {boolean} [draw] - Flag whether last round ended as a draw
 */

/**
 * @typedef Room
 * @type {object}
 * @property {number[]} board - Array representing game board 3x3 as 1D array
 * @property {number} player - Number representing last player
 * @property {number} playerBegin - Number representing player who started last round
 * @property {number[]} score - Array representing game score as [ties, wins of player 1, wins of player 2]
 * @property {State} state - Object representing state of the game
 */

/**
 * Function to create new empty game instance for room
 * @param {number} [players=2] - Number of players
 * @returns {Room} Game instance
 */
function openRoom(players) {
	return {
		board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
		player: 1,
		playerBegin: 1,
		score: [0, 0, 0],
		state: { gameActive: false },
	};
}

/**
 * Function to initialize new game
 * clearing previous' game status
 */
/**
 * Function to initialize new game
 * clearing previous' game status
 * @param {Room} room - Room instance
 * @param {number} players - Number of players
 */
function startNewGame(room, players) {
	room.board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	room.player = 1;
	room.playerBegin = 1;
	room.score = [0, 0, 0];
	room.state.gameActive = true;
	room.state.playerWon = undefined;
	room.state.draw = undefined;
}

/**
 * Function to initialize new round
 * clearing previous' round status
 * @param {Room} room - Room instance
 */
function startNewRound(room) {
	room.board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	room.playerBegin = (room.playerBegin % 2) + 1;
	room.player = room.playerBegin;
	room.state.gameActive = true;
	room.state.playerWon = undefined;
	room.state.draw = undefined;
}
/**
 * Function to get current state of the game
 * @param {Room} room - Room instance
 * @param {number} playerId - Id of user { 0 - observer, >0 - players}
 * @returns {object} Representation of game state
 */
function getUpdate(room, playerId) {
	return {
		board: room.board,
		score: room.score,
		state: room.state,
		nextMove: 'choice',
		nextPlayer: room.player,
	};
}

/**
 * Function to return status of the room
 * @param {Room} room - Room instance
 * @returns {{score: number[], state: State}} Representation of game state
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
 * @returns {boolean} True if player won, false otherwise
 */
function checkIfWon(room) {
	// 3 in row
	for (var i = 0; i < 3; ++i) {
		var line = true;
		for (var j = 0; j < 3; ++j) {
			if (room.board[3 * i + j] != room.player) {
				line = false;
				break;
			}
		}
		if (line) return true;
	}

	// 3 in column
	for (var i = 0; i < 3; ++i) {
		var line = true;
		for (var j = 0; j < 3; ++j) {
			if (room.board[3 * j + i] != room.player) {
				line = false;
				break;
			}
		}
		if (line) return true;
	}

	// check if middle
	if (room.board[4] == room.player) {
		// 3 in \
		if (room.board[0] == room.player && room.board[8] == room.player)
			return true;
		// 3 in /
		if (room.board[2] == room.player && room.board[6] == room.player)
			return true;
	}

	return false;
}

/**
 * Function to check if last move lead to draw
 * @param {Room} room - Room instance
 * @returns {boolean} True if draw, false otherwise
 */
function checkIfDraw(room) {
	if (room.board.indexOf(0) >= 0) return false;
	return true;
}

/**
 * Function to make next move by player
 * @param {Room} room - Room instance
 * @param {number} playerId - Player id number 1 or 2
 * @param {string} position - Move position example a1
 * @returns {boolean} True if move is legal, false otherwise
 */
function makeMove(room, playerId, position) {
	try {
		if (!room.state.gameActive) throw 'Game inactive!';

		if (playerId !== room.player) throw 'Wrong player id: ' + playerId;

		var nocolumn = position.charCodeAt(0) - 'a'.charCodeAt(0);

		if (nocolumn === NaN) throw 'Invalid position: ' + position;
		if (nocolumn < 0 || nocolumn > 2)
			throw 'Column index out of range: ' + nocolumn;

		var norow = position.charCodeAt(1) - '1'.charCodeAt(0);

		if (norow === NaN) throw 'Invalid position: ' + position;
		if (norow < 0 || norow > 2) throw 'Row index out of range: ' + norow;

		if (room.board[3 * norow + nocolumn] != 0)
			throw 'Invalid position: ' + position;

		room.board[3 * norow + nocolumn] = playerId;
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
 * @returns {boolean} True if move was accepted, false otherwise
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
		room.player = (playerId % 2) + 1;
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
