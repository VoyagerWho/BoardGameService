var socket = new WebSocket(
	'wss://' + document.location.host + document.location.pathname
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
					updateGUI(resjson.state);
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
		alert(
			`Connection closed cleanly, code=${event.code} reason=${event.reason}`
		);
	} else {
		alert('Connection died');
	}
};

socket.onerror = function (error) {
	alert(`[error] ${error.message}`);
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
}

function updateGUI(state) {
	for (var i = 0; i < 3; ++i) {
		var row = document.getElementById('brow' + i);
		for (var j = 0; j < 3; ++j) {
			cell = row.getElementsByTagName('td')[j];
			switch (state.board[3 * i + j]) {
				case 0:
					cell.innerText = ' ';
					break;
				case 1:
					cell.innerText = 'O';
					break;
				case 2:
					cell.innerText = 'X';
					break;
			}
		}
	}
	document.getElementById('score').innerHTML = state.score.toString();
}
