/**
 * Websocket connection with main server
 * @type {WebSocket}
 */
var socket = new WebSocket(
	'wss://' + document.location.host + document.location.pathname,
	null,
	{ rejectUnauthorized: false }
);

socket.onopen = function (e) {
	console.log('Connection established');
	setInterval(() => {
		socket.send(JSON.stringify({ action: 'Ping' }));
	}, 50000);
};

socket.onmessage = function (event) {
	var resjson = JSON.parse(event.data.toString());
	console.log(resjson);
	if (resjson.action === 'Move') {
		alert(resjson.message);
	}
	if (resjson.accepted) {
		switch (resjson.action) {
			case 'GetRole':
				{
					console.log(resjson.description);
					update();
				}
				break;
			case 'Update':
				{
					updateGUI(resjson);
				}
				break;
			case 'Joined':
			case 'Left':
				{
					document.getElementById('playersList').outerHTML = resjson.message;
					downloadList();
				}
				break;
			case 'Throw':
				{
					window['rollDices' + resjson.board](resjson.dices);
				}
				break;
			case 'List':
				{
					updateList(resjson.list);
				}
				break;
			case 'RoomHost':
				{
					eval(resjson.scripts);
					document.getElementById('roomHost').innerHTML = resjson.roomHost;
				}
				break;

			default:
				{
				}
				break;
		}
	} else {
		console.log('Request not accepted');
	}
	document.getElementById('wsIndicator').style.backgroundColor = 'limegreen';
};

socket.onclose = function (event) {
	if (event.wasClean) {
		console.log(
			`Connection closed cleanly, code=${event.code} reason=${event.reason}`
		);
	} else {
		console.log('Connection died');
	}
	document.getElementById('wsIndicator').style.backgroundColor = 'red';
};

socket.onerror = function (error) {
	console.log(`${error.message}`);
};

/**
 * Function to send move request through WS
 * @param {string} move - Move data
 * @param {number} board - Board id to move on
 */
function makeMove(move, board) {
	socket.send(JSON.stringify({ action: 'Move', move: move, board: board }));
}

/**
 * Function to send update request through WS
 */
function update() {
	socket.send(JSON.stringify({ action: 'Update' }));
}

/**
 * Function to initialize handlers
 */
function onBodyLoad() {
	setup();
}
