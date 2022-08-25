const layout = {
	width: 192,
	height: 320,
	background: { color: '#808080' },
	tiles: [
		{ x: 64, y: 0, name: 'a1' },
		{ x: 128, y: 64, name: 'b1' },
		{ x: 0, y: 192, name: 'c1' },
		{ x: 64, y: 64, name: 'a2' },
		{ x: 64, y: 128, name: 'b2' },
		{ x: 128, y: 192, name: 'c2' },
		{ x: 0, y: 64, name: 'a3' },
		{ x: 64, y: 192, name: 'b3' },
		{ x: 64, y: 256, name: 'c3' },
	],
};

function updateGUI(state) {
	document.getElementById('gameStatus').innerHTML = state.gameActiveDesc;
	document.getElementById('playerRound').innerHTML = state.nextPlayerDesc;
	const c = document.getElementById('canvas');
	const ctx = c.getContext('2d');
	const height = c.height;
	const width = c.width;

	if (layout.background.image) {
		const image = new Image();
		image.src = layout.background.image;
		ctx.drawImage(image, 0, 0, width, height);
	} else if (layout.background.color) {
		c.style.backgroundColor = layout.background.color;
	}
	layout.tiles.forEach((tile, index) => {
		ctx.drawImage(tiles[state.board[index] || 0], tile.x, tile.y, tileW, tileH);
	});
	ctx.strokeStyle = '#aaaaaa';
	for (var i = tileH; i < height; i = i + tileH) {
		ctx.moveTo(0, i);
		ctx.lineTo(width, i);
		ctx.stroke();
	}
	for (var i = tileW; i < width; i = i + tileW) {
		ctx.moveTo(i, 0);
		ctx.lineTo(i, height);
		ctx.stroke();
	}

	const scoreboard = document.getElementById('scores');
	for (var i = 0; i < scoreboard.children.length; ++i)
		scoreboard.children[i].innerHTML = state.score[i].toString();
}

function checkClick(pos) {
	try {
		layout.tiles.forEach((tile) => {
			if (
				pos.x >= tile.x &&
				pos.x <= tile.x + tileW &&
				pos.y >= tile.y &&
				pos.y <= tile.y + tileH
			) {
				makeMove(tile.name);
				throw new Error('Found clicked tile!');
			}
		});
	} catch (error) {
		if (!error.message || error.message !== 'Found clicked tile!') {
			// another error has happened
			throw error;
		}
	}
}

function setup() {
	document.getElementById('canvas').onclick = function (e) {
		checkClick({ x: e.offsetX, y: e.offsetY });
	};
}
