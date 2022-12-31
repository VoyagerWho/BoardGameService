/**
 * Function to format log messages
 * @param {any} toLog - Value to print to console
 */
function customLog(toLog) {
	console.log('--------------------------------');
	console.log('Battleships Game Engine:');
	console.log(toLog);
}

/**
 * Helper function to get ships layout
 * @returns {number[][]} ships layout
 */
function getBoard(x) {
	const boards = [
		[
			[x, 0, 0, 0, 0, 0, 0, 0],
			[x, 0, 0, x, x, 0, x, 0],
			[x, 0, 0, 0, 0, 0, 0, 0],
			[x, 0, 0, 0, 0, x, 0, 0],
			[0, 0, 0, x, 0, x, 0, 0],
			[0, x, 0, 0, 0, x, 0, 0],
			[0, x, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, x],
		],
		[
			[x, x, x, x, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, x, 0],
			[0, 0, 0, 0, 0, 0, x, 0],
			[0, x, 0, x, 0, 0, 0, 0],
			[0, 0, 0, x, 0, x, 0, 0],
			[0, 0, 0, x, 0, 0, 0, 0],
			[0, x, 0, 0, 0, x, x, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
		],
		[
			[0, x, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, x, x, x, 0],
			[0, 0, x, 0, 0, 0, 0, 0],
			[0, 0, x, 0, x, x, 0, 0],
			[0, 0, x, 0, 0, 0, 0, x],
			[0, 0, x, 0, 0, x, 0, 0],
			[0, 0, 0, 0, 0, x, 0, 0],
			[0, x, 0, 0, 0, 0, 0, 0],
		],
		[
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, x, x, x, 0, x],
			[0, x, 0, 0, 0, 0, 0, 0],
			[0, x, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, x, x, x, x, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, x, 0, x, 0, 0],
			[0, x, 0, 0, 0, x, 0, 0],
		],
		[
			[x, x, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, x, 0, 0, x, 0],
			[0, 0, 0, 0, 0, 0, x, 0],
			[0, x, x, x, 0, 0, x, 0],
			[0, 0, 0, 0, 0, 0, x, 0],
			[0, x, 0, 0, 0, 0, 0, 0],
			[0, x, 0, x, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, x, 0, 0],
		],
		[
			[0, 0, 0, x, 0, 0, 0, 0],
			[0, x, 0, x, 0, x, x, 0],
			[0, 0, 0, x, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, x, x],
			[0, 0, x, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, x, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, x, x, x, x, 0],
		],
		[
			[0, x, 0, 0, 0, x, 0, 0],
			[0, x, 0, 0, 0, x, 0, 0],
			[0, 0, 0, x, 0, x, 0, 0],
			[x, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, x, x, x, x, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, x, 0, 0, 0],
		],
		[
			[0, 0, x, x, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, x, 0, 0, x, 0, x, 0],
			[0, 0, 0, 0, 0, 0, x, 0],
			[0, 0, 0, x, 0, 0, x, 0],
			[0, 0, 0, 0, 0, 0, x, 0],
			[0, x, x, x, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, x, x, 0],
		],
		[
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, x, 0, x, 0],
			[x, x, 0, 0, 0, 0, x, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, x, 0, 0, x, x, x, x],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, x, 0, x, x, x, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
		],
		[
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, x, 0, x, x, x, x, 0],
			[0, x, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, x, 0, x, 0],
			[0, 0, 0, 0, 0, 0, 0, 0],
			[0, 0, 0, 0, 0, x, 0, x],
			[0, 0, x, 0, 0, x, 0, x],
			[0, 0, 0, 0, 0, 0, 0, x],
		],
	];
	return boards[Math.floor(Math.random() * 10)];
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
 * @property {number[][][]} boards - Array representing game boards
 * @property {number} player - Number representing last player
 * @property {number} playerBegin - Number representing player who started last round
 * @property {number} players - Number representing total number of players
 * @property {number[]} score - Array representing game score as [ties, wins of player 1, wins of player 2]
 * @property {State} state - Object representing state of the game
 */

/**
 * Function to create new empty game instance for room
 * @param {number} [players=2] - Number of players
 * @returns {Room} Game instance
 */
function openRoom(players) {
	const boards = new Array(4);
	for (var i = 0; i < 4; ++i) {
		boards[i] = new Array(8);
		for (var j = 0; j < 8; ++j) {
			boards[i][j] = new Array(8).fill(0);
		}
	}
	return {
		boards: boards,
		player: 1,
		playerBegin: 1,
		players: 2,
		score: [0, 0, 0],
		state: { gameActive: false },
	};
}

/**
 * Function to initialize new game
 * clearing previous' game status
 * @param {Room} room - Room instance
 * @param {number} players - Number of players
 */
function startNewGame(room, players) {
	const boards = new Array(4);
	for (var i = 0; i < 4; ++i) {
		boards[i] = new Array(8);
		for (var j = 0; j < 8; ++j) {
			boards[i][j] = new Array(8).fill(0);
		}
	}
	boards[0] = getBoard(1);
	boards[2] = getBoard(2);
	room.boards = boards;
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
	const boards = new Array(4);
	for (var i = 0; i < 4; ++i) {
		boards[i] = new Array(8);
		for (var j = 0; j < 8; ++j) {
			boards[i][j] = new Array(8).fill(0);
		}
	}
	boards[0] = getBoard(1);
	boards[2] = getBoard(2);
	room.boards = boards;
	room.playerBegin = (room.playerBegin % 2) + 1;
	room.player = room.playerBegin;
	room.state.gameActive = true;
	room.state.playerWon = undefined;
	room.state.draw = undefined;
}
/**
 * Function to get current state of the game
 * @param {Room} room - game instance
 * @param {number} playerId - Id of user { 0 - observer, >0 - players}
 * @returns {object} Representation of game state
 */
function getUpdate(room, playerId) {
	const boards = [];
	switch (playerId) {
		case 0:
			{
				boards[0] = [].concat(...room.boards[1]);
				boards[1] = [].concat(...room.boards[3]);
			}
			break;
		case 1:
			{
				boards[0] = [].concat(...room.boards[0]);
				boards[1] = [].concat(...room.boards[1]);
			}
			break;
		case 2:
			{
				boards[0] = [].concat(...room.boards[2]);
				boards[1] = [].concat(...room.boards[3]);
			}
			break;
	}
	return {
		boards: boards,
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
	const numberOfTargets = 4 + 3 + 2 + 2 + 1 + 1 + 1; // ships
	var count = 0;
	const oponent = room.player === 1 ? 2 : 1;
	[].concat(...room.boards[2 * (room.player - 1) + 1]).forEach((element) => {
		if (element === oponent) {
			++count;
		}
	});
	if (count === numberOfTargets) return true;
	return false;
}

/**
 * Function to make next move by player
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
		if (nocolumn < 0 || nocolumn > 7)
			throw 'Column index out of range: ' + nocolumn;

		var norow = position.charCodeAt(1) - '1'.charCodeAt(0);

		if (norow === NaN) throw 'Invalid position: ' + position;
		if (norow < 0 || norow > 7) throw 'Row index out of range: ' + norow;

		if (room.boards[2 * (room.player - 1) + 1][norow][nocolumn] != 0)
			throw 'Invalid position: ' + position;
		const oponent = room.player == 1 ? 2 : 1;
		if (room.boards[2 * (oponent - 1)][norow][nocolumn] === oponent) {
			room.boards[2 * (room.player - 1) + 1][norow][nocolumn] = oponent;
			room.boards[2 * (oponent - 1)][norow][nocolumn] = oponent + 3;
			if (checkIfWon(room)) {
				customLog('Player ' + room.player + ' won!');
				++room.score[room.player];
				room.state.playerWon = room.player;
				room.state.gameActive = false;
			}
			return true;
		}
		room.boards[2 * (room.player - 1) + 1][norow][nocolumn] = 3;
		room.boards[2 * (oponent - 1)][norow][nocolumn] = 3;
		room.player = (room.player % room.players) + 1;

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
 * @returns {boolean} True if move was accepted, false otherwise
 */
function updateGame(room, playerId, position) {
	return makeMove(room, playerId, position);
}

module.exports.startNewGame = startNewGame;
module.exports.startNewRound = startNewRound;
module.exports.getUpdate = getUpdate;
module.exports.getStatus = getStatus;
module.exports.makeMove = makeMove;
module.exports.updateGame = updateGame;
module.exports.openRoom = openRoom;
