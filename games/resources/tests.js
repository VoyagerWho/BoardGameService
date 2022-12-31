/**
 * List of tested games
 */
const games = [
	'TicTacToe',
	'ConnectFour',
	'ManDontGetAngry',
	'Battleships',
	'NonExistant',
];

/**
 * List of expected responses
 */
const expForGames = [true, true, true, true, false];

/**
 * Function to create custom response HTML Element
 * @param {{game: string, func: string, other: Object}} testData - Values of test
 * @param {string} response - Response of the server as is
 * @param {Boolean} expected - Flag to signal if request should've been accepted
 */
function resultElement(testData, response, expected) {
	const resElem = document.createElement('div');
	resElem.classList.add('testResCon');
	const resHead = document.createElement('div');
	resHead.classList.add('testHead');
	const resMess = document.createElement('div');
	resMess.classList.add('testMess');
	resElem.appendChild(resHead);
	resElem.appendChild(resMess);
	document.getElementById('TestResults').appendChild(resElem);
	var resjson;
	try {
		resjson = JSON.parse(response);
	} catch (_) {
		resHead.innerHTML = `Test /${testData.game}/${testData.func} -> State: Failed`;
		if (typeof response === 'object')
			resMess.innerHTML = `Format Error<br/ >Response:<br /> ${JSON.stringify(
				response,
				null,
				2
			)}`;
		else resMess.innerHTML = `Format Error<br/ >Response:<br /> ${response}`;
		resElem.classList.add('testFailed');
		return;
	}
	if (resjson.accepted === expected) {
		resHead.innerHTML = `Test /${testData.game}/${testData.func} -> State: Passed`;
		resMess.innerHTML = `Response:<br />${JSON.stringify(resjson, null, 2)}`;
		resElem.classList.add('testPassed');
	} else {
		resHead.innerHTML = `Test /${testData.game}/${testData.func} -> State: Failed`;
		resMess.innerHTML = `Response:<br />${JSON.stringify(resjson, null, 2)}`;
		resElem.classList.add('testFailed');
	}
}

/**
 * Function to handle AJAX request as Unit Test
 * @param {string} method - Xhr method
 * @param {string} url - Address of the request
 * @param {object} message - Body of the request (for POST)
 * @param {string} description - Name of the Unit Test
 * @param {number} gameId - Index of test case
 * @param {boolean} expected - Expected result of the case
 * @returns {Promise} Promise for AJAX request
 */
async function handleRequest(
	method,
	url,
	message,
	description,
	gameId,
	expected
) {
	try {
		var response = await xhrMakeRequest(method, url, message);
		resultElement(
			{ game: games[gameId], func: description },
			response,
			expected
		);
	} catch (error) {
		resultElement({ game: games[gameId], func: description }, error, expected);
	}
}

/**
 * Function to run test of API function
 */
function testApi() {
	for (let ig = 0; ig < games.length; ++ig) {
		handleRequest(
			'GET',
			`/${games[ig]}/api`,
			null,
			'api [GET]',
			ig,
			expForGames[ig]
		);
		handleRequest(
			'POST',
			`/${games[ig]}/api`,
			null,
			'api [POST]',
			ig,
			expForGames[ig]
		);
	}
}

/**
 * Function to run test of Status function
 */
function testStatusGame() {
	for (let ig = 0; ig < games.length; ++ig) {
		handleRequest(
			'POST',
			`/${games[ig]}/Status`,
			null,
			'Status [POST]',
			ig,
			expForGames[ig]
		);
	}
}

/**
 * Function to run test of Open and Close functions
 */
async function testOpenClose() {
	for (let ig = 0; ig < games.length; ++ig) {
		try {
			await handleRequest(
				'POST',
				`/${games[ig]}/Open`,
				{ room: `Room${ig}` },
				'Open [POST]',
				ig,
				expForGames[ig]
			);
			await handleRequest(
				'POST',
				`/${games[ig]}/Close`,
				{ room: `Room${ig}` },
				'Close [POST]',
				ig,
				expForGames[ig]
			);
		} catch (error) {
			resultElement(
				{ game: games[ig], func: 'Open-Close [POST]' },
				error,
				expForGames[ig]
			);
		}
	}
}

/**
 * Function to test basic function within room instance
 * @param {string} func - Function to test
 * @param {any} data - Request data
 * @param {number} ig - Id of the game
 * @param {boolean} expected - Expected value of the response
 */
async function testFunctionRoom(func, data, ig, expected) {
	try {
		await handleRequest(
			'POST',
			`/${games[ig]}/Open`,
			data,
			`Open -> ${func} [POST]`,
			ig,
			expected[0]
		);
		await handleRequest(
			'POST',
			`/${games[ig]}/${func}`,
			data,
			`${func} -> ${func} [POST]`,
			ig,
			expected[1]
		);
		await handleRequest(
			'POST',
			`/${games[ig]}/Close`,
			data,
			`Close -> ${func} [POST]`,
			ig,
			expected[0]
		);
	} catch (error) {
		resultElement(
			{ game: games[ig], func: `Open-${func}-Close [POST]` },
			error,
			expected[1]
		);
	}
}

/**
 * Function to test move function within room instance
 * @param {any} data - Request data
 * @param {number} ig - Id of the game
 * @param {boolean} expected - Expected value of the response
 */
async function testMoveRoom(data, ig, expected) {
	try {
		await handleRequest(
			'POST',
			`/${games[ig]}/Open`,
			data[0],
			`Open -> Move [POST]`,
			ig,
			expected[0]
		);
		await handleRequest(
			'POST',
			`/${games[ig]}/NewGame`,
			data[1],
			`NewGame -> Move[POST]`,
			ig,
			expected[0]
		);
		await handleRequest(
			'POST',
			`/${games[ig]}/Move`,
			data[2],
			`Move -> Move [POST]`,
			ig,
			expected[1]
		);
		await handleRequest(
			'POST',
			`/${games[ig]}/Close`,
			data[0],
			`Close -> Move [POST]`,
			ig,
			expected[0]
		);
	} catch (error) {
		resultElement(
			{ game: games[ig], func: 'Open-NewGame-Move-Close [POST]' },
			error,
			expected[1]
		);
	}
}

/**
 * Function to run all the tests
 */
async function runTests() {
	testApi();
	testStatusGame();
	testOpenClose();
	const passing = [true, true];
	const failing = [true, false];
	const fullFail = [false, false];
	for (let ig = 0; ig < games.length - 1; ++ig) {
		testFunctionRoom('Status', { room: `RoomOSC${ig}` }, ig, passing);
		testFunctionRoom('NewGame', { room: `RoomONG1C${ig}` }, ig, failing);
		testFunctionRoom(
			'NewGame',
			{ room: `RoomONG2C${ig}`, players: 2 },
			ig,
			passing
		);
		testFunctionRoom('NewRound', { room: `RoomONRC${ig}` }, ig, passing);
		testFunctionRoom('Update', { room: `RoomOU1C${ig}` }, ig, failing);
		testFunctionRoom(
			'Update',
			{ room: `RoomOU2C${ig}`, player: 0 },
			ig,
			passing
		);
	}
	let ig = games.length - 1;
	testFunctionRoom('Status', { room: `RoomOSC${ig}` }, ig, fullFail);
	testFunctionRoom('NewGame', { room: `RoomONG1C${ig}` }, ig, fullFail);
	testFunctionRoom(
		'NewGame',
		{ room: `RoomONG2C${ig}`, players: 2 },
		ig,
		fullFail
	);
	testFunctionRoom('NewRound', { room: `RoomONRC${ig}` }, ig, fullFail);
	testFunctionRoom('Update', { room: `RoomOU1C${ig}` }, ig, fullFail);
	testFunctionRoom(
		'Update',
		{ room: `RoomOU2C${ig}`, player: 0 },
		ig,
		fullFail
	);
	let data = [
		{ room: `RoomOM1C` },
		{ room: `RoomOM1C`, players: 2 },
		{ room: `RoomOM1C` },
		{ room: `RoomOM1C` },
	];
	for (let ig = 0; ig < games.length - 1; ++ig) {
		data[2] = { room: `RoomOM1C` };
		await testMoveRoom(data, ig, failing);
		data[2] = { room: `RoomOM1C`, player: 1, move: 'a1', board: 1 };
		if (ig === 2) {
			data[2] = {
				room: `RoomOM1C`,
				player: 1,
				move: 'throw',
				dices: [new Array(10).fill(1)],
				board: 1,
			};
		}
		await testMoveRoom(data, ig, passing);
	}
	ig = games.length - 1;
	await testMoveRoom(data, ig, fullFail);
}
