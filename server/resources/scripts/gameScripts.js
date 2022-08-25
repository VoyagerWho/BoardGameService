var socket = new WebSocket(
	'wss://' + document.location.host + document.location.pathname,
	null,
	{ rejectUnauthorized: false }
);

socket.onopen = function (e) {
	console.log('Connection established');
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
				{
					document.getElementById('playersList').outerHTML = resjson.message;
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
};

socket.onclose = function (event) {
	if (event.wasClean) {
		console.log(
			`Connection closed cleanly, code=${event.code} reason=${event.reason}`
		);
	} else {
		console.log('Connection died');
	}
};

socket.onerror = function (error) {
	console.log(`${error.message}`);
};

function startNewGame() {
	socket.send(JSON.stringify({ action: 'NewGame' }));
}
function startNewRound() {
	socket.send(JSON.stringify({ action: 'NewRound' }));
}
function makeMove(move) {
	socket.send(JSON.stringify({ action: 'Move', move: move }));
}
function update() {
	socket.send(JSON.stringify({ action: 'Update' }));
}

function onBodyLoad() {
	document.getElementById('btnGame').onclick = startNewGame;
	document.getElementById('btnRound').onclick = startNewRound;
	setup();
}
