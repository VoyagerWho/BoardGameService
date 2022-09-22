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
				}
				break;
			case 'Throw':
				{
					window['rollDices' + resjson.board](resjson.dices);
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

function makeMove(move, board) {
	socket.send(JSON.stringify({ action: 'Move', move: move, board: board }));
}
function update() {
	socket.send(JSON.stringify({ action: 'Update' }));
}

function onBodyLoad() {
	setup();
}
