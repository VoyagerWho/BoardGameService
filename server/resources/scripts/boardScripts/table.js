function updateGUI(state) {
	document.getElementById('gameStatus').innerHTML = state.gameActiveDesc;
	document.getElementById('playerRound').innerHTML = state.nextPlayerDesc;

	for (var i = 0; i < nr; ++i) {
		var row = document.getElementById('brow' + i);
		for (var j = 0; j < nc; ++j) {
			cell = row.getElementsByTagName('td')[j];
			switch (state.board[nr * i + j]) {
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
	const scoreboard = document.getElementById('scores');
	for (var i = 0; i < scoreboard.children.length; ++i)
		scoreboard.children[i].innerHTML = state.score[i].toString();
}

function setup() {
	console.log('Setup finished!');
}
