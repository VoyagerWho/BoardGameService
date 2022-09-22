/**
 * List of starting positions
 * @type {number[]}
 */
const startZones = [undefined, 0, 20, 10, 30];

/**
 * Indexes of last squares to travel
 * @type {number[]}
 */
const lastSquares = [undefined, 39, 19, 9, 29];

/**
 * List of save positions
 * @type {number[]}
 */
const saveZones = [2, 6, 12, 16, 22, 26, 32, 36];

/**
 * Function to format log messages
 * @param {any} toLog
 */
function customLog(toLog) {
	console.log('--------------------------------');
	console.log('ManDGA Game Engine:');
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
 * @property {number[]} board - Array representing game board
 * @property {number} player - Number representing last player
 * @property {number} playerBegin - Number representing player who started last round
 * @property {number} players - Number representing total number of players
 * @property {number[]} score - Array representing game score as [ties, wins of player 1, wins of player 2]
 * @property {State} state - Object representing state of the game
 * @property {number[]} bases - List of starting bases
 * @property {number[]} finishes - List of finish squares
 * @property {string} nextMove - Type of expected next move {move, throw}
 * @property {number} throws - Number of dice throws left by player
 * @property {number} [rolled] - Number rolled in last throw
 */

/**
 * Function to create new empty game instance for room
 * @param {number} [players=2] - Number of players
 * @returns {Room} game instance
 */
function openRoom(players) {
	return {
		board: new Array(40).fill(0),
		player: 1,
		playerBegin: 1,
		players: players || 2,
		score: [0, 0, 0, 0, 0],
		state: { gameActive: false },
		bases: new Array(4)
			.fill(1)
			.concat(new Array(4).fill(2))
			.concat(new Array(4).fill(3))
			.concat(new Array(4).fill(4)),
		finishes: new Array(16).fill(0),
		nextMove: 'throw',
		throws: 3,
	};
}

/**
 * Function to initialize new game
 * clearing previous' game status
 * @param {Room} room - Room instance
 */
function startNewGame(room, players) {
	room.board = new Array(40).fill(0);
	room.player = 1;
	room.playerBegin = 1;
	room.players = players || 2;
	room.score = [0, 0, 0, 0, 0];
	room.state = { gameActive: true };
	room.bases = new Array(4)
		.fill(1)
		.concat(new Array(4).fill(2))
		.concat(new Array(4).fill(3))
		.concat(new Array(4).fill(4));
	finishes = new Array(16).fill(0);
	nextMove = 'throw';
	throws = 3;
}

/**
 * Function to initialize new round
 * clearing previous' round status
 * @param {Room} room - Room instance
 */
function startNewRound(room) {
	room.board = new Array(40).fill(0);
	room.playerBegin = (room.playerBegin % room.players) + 1;
	room.player = 1;
	room.state = { gameActive: true };
	room.bases = new Array(4)
		.fill(1)
		.concat(new Array(4).fill(2))
		.concat(new Array(4).fill(3))
		.concat(new Array(4).fill(4));
	finishes = new Array(16).fill(0);
	nextMove = 'throw';
	throws = 3;
}
/**
 * Function to get current state of the game
 * @param {Room} room - Room instance
 * @param {number} playerId - Id of user { 0 - observer, >0 - players}
 * @returns {object} json representation of game state
 */
function getUpdate(room, playerId) {
	const board = room.board.concat(room.bases).concat(room.finishes);
	saveZones.concat(startZones).forEach((zoneId) => {
		board[zoneId] += 5;
	});
	for (var pid = 0; pid < 4; ++pid) {
		for (var zid = 0; zid < 4; ++zid) {
			board[4 * pid + zid + 40 + 16] =
				10 + 2 * pid + (board[4 * pid + zid + 40 + 16] > 0 ? 1 : 0);
		}
	}
	return {
		board: board,
		score: room.score,
		state: room.state,
		nextMove: room.nextMove,
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
	if (
		room.finishes.slice(4 * (room.player - 1), 4 * room.player).indexOf(0) ===
		-1
	)
		return true;
	return false;
}

/**
 *
 * @param {Room} room
 * @param {number} pos1
 * @param {number} pos2
 */
function canMove(room, pos1, pos2) {
	if (pos1 && pos2) {
		if (room.board[pos2] === 0) return true;
		else if (
			room.board[pos2] !== room.player &&
			saveZones.indexOf(pos2) === -1 &&
			pos2 !== startZones[room.board[pos2]]
		) {
			return true;
		}
	} else {
		var lastFound = room.board.indexOf(room.player);
		while (lastFound >= 0) {
			if (
				lastFound >= lastSquares[room.player] ||
				lastFound + room.rolled <= lastSquares[room.player]
			) {
				const tile = room.board[(lastFound + room.rolled) % 40];
				if (tile === 0) return true;
				if (
					tile !== room.player &&
					saveZones.indexOf(lastFound + room.rolled) !== -1
				)
					return true;
				if (lastFound === lastSquares[room.player]) return true;
			}

			lastFound = room.board.indexOf(room.player, lastFound + 1);
		}
	}
	return false;
}

/**
 *
 * @param {Room} room
 * @param {{type: string, id: number}[]} positions
 * @returns if can escape
 */
function exitBase(room, positions) {
	if (positions[1].type !== 's' && positions[1].id !== startZones[room.player])
		throw 'Incorrect move';
	if (room.rolled !== 6) throw 'Illegal base escape';
	if (
		room.bases
			.slice(4 * (room.player - 1), 4 * room.player)
			.indexOf(room.player) === -1
	)
		throw 'Base empty';
	if (room.board[startZones[room.player]] === room.player)
		throw 'Base exit ocupied';

	if (room.board[startZones[room.player]] !== 0)
		returnPawn(room, room.board[startZones[room.player]]);
	room.board[startZones[room.player]] = room.player;
	room.bases[room.bases.lastIndexOf(room.player)] = 0;
	return true;
}

/**
 *
 * @param {Room} room
 * @param {{type: string, id: number}[]} positions
 * @returns if can finish
 */
function enterFinish(room, positions) {
	if (positions[1].id !== room.player) throw 'Incorrect Finish zone';
	if (positions[0].type !== 'm' || positions[0].id !== lastSquares[room.player])
		throw 'Incorrect move';
	room.board[lastSquares[room.player]] = 0;
	room.finishes[
		room.finishes.lastIndexOf(room.player) === -1
			? 4 * (room.player - 1)
			: room.finishes.lastIndexOf(room.player) + 1
	] = room.player;
	return true;
}

/**
 *
 * @param {Room} room
 * @param {number} player
 */
function returnPawn(room, player) {
	if (room.bases.slice(4 * (player - 1), 4 * player).indexOf(player) === -1)
		room.bases[4 * (player - 1)] = player;
	else room.bases[room.bases.lastIndexOf(player) + 1] = player;
}

/**
 *
 * @param {Room} room
 * @param {number} rolled
 * @returns
 */
function handleDiceThrow(room, rolled) {
	--room.throws;
	room.rolled = rolled;
	try {
		if (rolled === 6) {
			room.throws = 1;
			if (
				room.bases
					.slice(4 * (room.player - 1), 4 * room.player)
					.indexOf(room.player) !== -1 &&
				room.board[startZones[room.player]] !== room.player
			) {
				return true;
			}
			if (canMove(room)) {
				return true;
			}
		} else {
			if (room.board.indexOf(room.player) !== -1 && canMove(room)) {
				return true;
			}
			if (room.throws === 0) throw 'No move possible';
		}
	} catch (error) {
		console.error(error);
	}

	return false;
}

/**
 * Function to make next move by player
 * @param {Room} room - Room instance
 * @param {number} playerId - Player id number 1 or 2
 * @param {string} move - Move position example
 * @param {number[][]} [dices] - List of dices rolls
 * @returns {boolean} true if move is legal, false otherwise
 */
function makeMove(room, playerId, move, dices) {
	try {
		if (!room.state.gameActive) throw 'Game inactive!';
		if (playerId !== room.player) throw 'Wrong player id: ' + playerId;

		if (room.nextMove === 'throw') {
			if (move !== 'throw') throw 'Incorect move type';
			const rolled = dices[0][dices[0].length - 1];
			if (handleDiceThrow(room, rolled)) {
				// current player can move with current roll
				room.nextMove = 'move';
			} else if (room.throws === 0) {
				// no move and out of throws
				room.nextMove = 'throw';
				room.player = (room.player % room.players) + 1;
				room.throws = room.board.indexOf(room.player) === -1 ? 3 : 1;
				room.rolled = undefined;
			} else {
				// current player can roll more times
				room.rolled = undefined;
			}
			return true;
		}

		if (move.search(/^[bms][0-3]?\d\|[fms][0-3]?\d$/) === -1)
			throw 'Incorect move data';

		const positions = move.split('|');
		positions.forEach((value, index) => {
			positions[index] = { type: value[0], id: Number(value.slice(1)) };
		});

		if (positions[0].type === 'b') {
			if (exitBase(room, positions)) {
				room.nextMove = 'throw';
				room.rolled = undefined;
				return true;
			}
			return false;
		}
		if (positions[1].type === 'f') {
			if (enterFinish(room, positions)) {
				if (checkIfWon(room)) {
					customLog('Player ' + room.player + ' won!');
					++room.score[room.player];
					room.state.playerWon = room.player;
					room.state.gameActive = false;
				} else if (room.throws > 0) {
					room.nextMove = 'throw';
					room.rolled = undefined;
				} else {
					room.nextMove = 'throw';
					room.player = (room.player % room.players) + 1;
					room.throws = room.board.indexOf(room.player) === -1 ? 3 : 1;
					room.rolled = undefined;
				}
				return true;
			}
			return false;
		}
		const pos2Scaled =
			positions[0].id >= positions[1].id
				? positions[1].id + 40
				: positions[1].id;
		if (
			positions[0].id >= pos2Scaled ||
			pos2Scaled - positions[0].id !== room.rolled
		)
			throw `Illegal move: ${positions[0].id}, ${positions[1].id}, ${pos2Scaled}, ${room.rolled}`;
		if (
			positions[0].id <= lastSquares[room.player] &&
			positions[1].id > lastSquares[room.player]
		)
			throw 'Second Lap';
		if (canMove(room, positions[0].id, positions[1].id)) {
			room.board[positions[0].id] = 0;
			if (room.board[positions[1].id] !== 0)
				returnPawn(room, room.board[positions[1].id]);
			room.board[positions[1].id] = room.player;
			if (room.rolled !== 6) {
				room.player = (room.player % room.players) + 1;
				room.throws = room.board.indexOf(room.player) === -1 ? 3 : 1;
			}
			room.nextMove = 'throw';
			room.rolled = undefined;
			return true;
		}
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
 * @param {number[][]} [dices] - List of dices rolls
 */
function updateGame(room, playerId, position, dices) {
	if (makeMove(room, playerId, position, dices)) {
		return true;
	} else {
		return false;
	}
}

module.exports.startNewGame = startNewGame;
module.exports.startNewRound = startNewRound;
module.exports.getUpdate = getUpdate;
module.exports.getStatus = getStatus;
module.exports.makeMove = makeMove;
module.exports.updateGame = updateGame;
module.exports.openRoom = openRoom;
