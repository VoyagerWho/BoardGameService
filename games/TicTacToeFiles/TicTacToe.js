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
 * Array representing game board
 * @type {Array<number>}
 */
var board = [0, 0, 0, 0, 0, 0, 0, 0, 0];

/**
 * Number representing last player
 * @type {number}
 */
var player = 1;

/**
 * Number representing player who started last round
 * @type {number}
 */
var playerBegin = 1;

/**
 * Array representing game score as
 * [ties, wins of player 1, wins of player 2]
 * @type {Array<number>}
 */
var score = [0, 0, 0];

/**
 * Object representing state of the game
 * @type {JSON}
 */
var state = { gameActive: false };

/**
 * Function to initialize new game
 * clearing previous' game status
 */
function startNewGame() {
	board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	player = 1;
	playerBegin = 1;
	score = [0, 0, 0];
	state.gameActive = true;
	state.playerWon = undefined;
	state.draw = undefined;
}

/**
 * Function to initialize new round
 * clearing previous' round status
 */
function startNewRound() {
	board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	playerBegin = (playerBegin % 2) + 1;
	player = playerBegin;
	state.gameActive = true;
	state.playerWon = undefined;
	state.draw = undefined;
}
/**
 * Function to get current state of the game
 * @param {number} playerId - Id of user { 0 - observer, >0 - players}
 * @returns {object} json representation of game state
 */
function getUpdate(playerId) {
	if (typeof playerId == 'number') {
		return {
			board: board,
			score: score,
			state: state,
			nextMove: 'choice',
			nextPlayer: player,
		};
	}
	return {};
}

/**
 * Function to check if last move score victory
 * @returns {boolean} true if player won, false otherwise
 */
function checkIfWon() {
	// 3 in row
	for (var i = 0; i < 3; ++i) {
		var line = true;
		for (var j = 0; j < 3; ++j) {
			if (board[3 * i + j] != player) {
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
			if (board[3 * j + i] != player) {
				line = false;
				break;
			}
		}
		if (line) return true;
	}

	// check if middle
	if (board[4] == player) {
		// 3 in \
		if (board[0] == player && board[8] == player) return true;
		// 3 in /
		if (board[2] == player && board[6] == player) return true;
	}

	return false;
}

/**
 * Function to check if last move lead to draw
 * @returns {boolean} true if draw, false otherwise
 */
function checkIfDraw() {
	if (board.indexOf(0) >= 0) return false;
	return true;
}

/**
 * Function to make next move by player
 * @param {number} playerId - Player id number 1 or 2
 * @param {string} position - Move position example a1
 * @returns {boolean} true if move is legal, false otherwise
 */
function makeMove(playerId, position) {
	try {
		if (!state.gameActive) throw 'Game inactive!';
		if (typeof position != 'string' || typeof playerId != 'number')
			throw 'Incorrect parameter type!';

		if (playerId !== player) throw 'Wrong player id: ' + playerId;

		var nocolumn = position.charCodeAt(0) - 'a'.charCodeAt(0);

		if (nocolumn == NaN) throw 'Invalid position: ' + position;
		if (nocolumn < 0 || nocolumn > 2)
			throw 'Column index out of range: ' + nocolumn;

		var norow = position.charCodeAt(1) - '1'.charCodeAt(0);

		if (norow == NaN) throw 'Invalid position: ' + position;
		if (norow < 0 || norow > 2) throw 'Row index out of range: ' + norow;

		if (board[3 * norow + nocolumn] != 0) throw 'Invalid position: ' + position;

		board[3 * norow + nocolumn] = playerId;
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
function updateGame(playerId, position) {
	var move = {};
	if (makeMove(playerId, position)) {
		move.accepted = true;
		if (checkIfWon()) {
			customLog('Player ' + player + ' won!');
			++score[player];
			state.playerWon = player;
			state.gameActive = false;
		}

		if (checkIfDraw()) {
			customLog('Draw!');
			++score[0];
			state.draw = true;
			state.gameActive = false;
		}
		player = (playerId % 2) + 1;
	} else {
		move.accepted = false;
	}
	return move;
}

module.exports.startNewGame = startNewGame;
module.exports.startNewRound = startNewRound;
module.exports.getUpdate = getUpdate;
module.exports.makeMove = makeMove;
module.exports.updateGame = updateGame;
