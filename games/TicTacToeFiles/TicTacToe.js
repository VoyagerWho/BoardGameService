/**
 * Function to format log messages
 * @param {any} toLog
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
 * Function to create new empty game instance for room
 * @returns {JSON} game instance
 */
function openRoom() {
	return {
		/**
		 * Array representing game board
		 * @type {Array<number>}
		 */
		board: [0, 0, 0, 0, 0, 0, 0, 0, 0],

		/**
		 * Number representing last player
		 * @type {number}
		 */
		player: 1,

		/**
		 * Number representing player who started last round
		 * @type {number}
		 */
		playerBegin: 1,

		/**
		 * Array representing game score as
		 * [ties, wins of player 1, wins of player 2]
		 * @type {Array<number>}
		 */
		score: [0, 0, 0],

		/**
		 * Object representing state of the game
		 * @type {JSON}
		 */
		state: { gameActive: false },
	};
}

/**
 * Function to initialize new game
 * clearing previous' game status
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
 * @param {number} playerId - Id of user { 0 - observer, >0 - players}
 * @returns {object} json representation of game state
 */
function getUpdate(room, playerId) {
	if (typeof playerId == 'number') {
		return {
			boards: [
				room.board,
				[0, 1, 2, 0, 2, 1, 1, 2, 0],
				[0, 1, 0, 2, 0, 2, 0, 1, 0],
			],
			score: room.score,
			state: room.state,
			nextMove: 'choice',
			nextPlayer: room.player,
		};
	}
	return {};
}

/**
 * Function to check if last move score victory
 * @returns {boolean} true if player won, false otherwise
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
 * @returns {boolean} true if draw, false otherwise
 */
function checkIfDraw(room) {
	if (room.board.indexOf(0) >= 0) return false;
	return true;
}

/**
 * Function to make next move by player
 * @param {number} playerId - Player id number 1 or 2
 * @param {string} position - Move position example a1
 * @returns {boolean} true if move is legal, false otherwise
 */
function makeMove(room, playerId, position) {
	try {
		if (!room.state.gameActive) throw 'Game inactive!';
		if (typeof position != 'string' || typeof playerId != 'number')
			throw 'Incorrect parameter type!';

		if (playerId !== room.player) throw 'Wrong player id: ' + playerId;

		var nocolumn = position.charCodeAt(0) - 'a'.charCodeAt(0);

		if (nocolumn == NaN) throw 'Invalid position: ' + position;
		if (nocolumn < 0 || nocolumn > 2)
			throw 'Column index out of range: ' + nocolumn;

		var norow = position.charCodeAt(1) - '1'.charCodeAt(0);

		if (norow == NaN) throw 'Invalid position: ' + position;
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
		room.player = (playerId % 2) + 1;
	} else {
		return false;
	}
	return true;
}

module.exports.startNewGame = startNewGame;
module.exports.startNewRound = startNewRound;
module.exports.getUpdate = getUpdate;
module.exports.makeMove = makeMove;
module.exports.updateGame = updateGame;
module.exports.openRoom = openRoom;
