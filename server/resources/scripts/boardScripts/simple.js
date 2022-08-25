function updateGUI(state) {
	document.getElementById('gameStatus').innerHTML = state.gameActiveDesc;
	document.getElementById('playerRound').innerHTML = state.nextPlayerDesc;
	const c = document.getElementById('canvas');
	const ctx = c.getContext('2d');
	const height = c.height;
	const width = c.width;
	for (var i = 0; i < nr; ++i) {
		for (var j = 0; j < nc; ++j)
			ctx.drawImage(
				tiles[state.board[nr * i + j] || 0],
				j * tileW,
				i * tileH,
				tileW,
				tileH
			);
	}
	ctx.strokeStyle = '#aaaaaa';
	for (var i = 0; i < nr - 1; ++i) {
		ctx.moveTo(0, (i + 1) * tileH);
		ctx.lineTo(width, (i + 1) * tileH);
		ctx.stroke();
	}
	for (var i = 0; i < nc - 1; ++i) {
		ctx.moveTo((i + 1) * tileW, 0);
		ctx.lineTo((i + 1) * tileW, height);
		ctx.stroke();
	}

	const scoreboard = document.getElementById('scores');
	for (var i = 0; i < scoreboard.children.length; ++i)
		scoreboard.children[i].innerHTML = state.score[i].toString();
}

function setup() {
	document.getElementById('canvas').onclick = function (e) {
		const offsetX = Math.floor(e.offsetX / tileW);
		const offsetY = Math.floor(e.offsetY / tileH);
		makeMove(
			`${String.fromCharCode(cl.charCodeAt(0) + offsetX)}${String.fromCharCode(
				rl.charCodeAt(0) + offsetY
			)}`
		);
	};
}
