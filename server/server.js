//Local network only!
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const rooms = require('./routes/rooms');

/**
 * Express session parser
 * @type {express.RequestHandler}
 */
const sessionParser = session({
	secret: 'AveryB1GS3cr3t',
	resave: false,
	saveUninitialized: false,
});

/**
 * Express app instance
 * @type {Express}
 */
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use('/static', express.static(path.join(__dirname, 'resources')));
app.use(logger);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(sessionParser);
rooms.passSessionParser(sessionParser);

app.use('/rooms', rooms.router);
app.use('/games', (req, res) => {
	res.redirect(307, '/rooms/games' + req.url);
});

app.get('/', (req, res) => {
	res.render('index', { middle: 'summary', text: 'Strona Domowa' });
});

app.route('/tests').get((req, res) => {
	const { status } = require('./api/game');
	status(
		{
			hostname: 'localhost',
			functions: {
				Status: '/tests/0',
			},
		},
		null,
		(rres) => {
			rres.on('data', (d) => {
				var resjson = {};
				try {
					resjson = JSON.parse(d.toString());
				} catch (error) {
					customLog(['Test 1 failed', d.toString()]);
					return;
				}
				if (resjson.accepted) {
					customLog(['Test 1 passed', resjson.message]);
				} else {
					customLog(['Test 1 failed', resjson.message]);
				}
			});
		},
		(err) => {
			customLog(['Test 1 failed', err.message]);
		}
	);
	status(
		{
			hostname: 'localhost',
			functions: {
				Status: '/tests/1',
			},
		},
		null,
		(rres) => {
			rres.on('data', (d) => {
				var resjson = {};
				try {
					resjson = JSON.parse(d.toString());
				} catch (error) {
					customLog(['Test 2 failed', d.toString()]);
					return;
				}
				if (resjson.accepted) {
					customLog(['Test 2 failed', resjson.message]);
				} else {
					customLog(['Test 2 passed', resjson.message]);
				}
			});
		},
		(err) => {
			customLog(['Test 2 failed', err.message]);
		}
	);
	status(
		{
			hostname: 'localhost',
			functions: {
				Status: '/tests/2',
			},
		},
		null,
		(rres) => {
			rres.on('data', (d) => {
				var resjson = {};
				try {
					resjson = JSON.parse(d.toString());
				} catch (error) {
					customLog(['Test 3 passed', d.toString()]);
					return;
				}
				if (resjson.accepted) {
					customLog(['Test 3 failed', resjson.message]);
				} else {
					customLog(['Test 3 failed', resjson.message]);
				}
			});
		},
		(err) => {
			customLog(['Test 3 failed', err.message]);
		}
	);
	status(
		{
			hostname: 'xlocalhost',
			functions: {
				Status: '/tests/0',
			},
		},
		null,
		(rres) => {
			rres.on('data', (d) => {
				var resjson = {};
				try {
					resjson = JSON.parse(d.toString());
				} catch (error) {
					customLog(['Test 4 failed', d.toString()]);
					return;
				}
				if (resjson.accepted) {
					customLog(['Test 4 failed', resjson.message]);
				} else {
					customLog(['Test 4 failed', resjson.message]);
				}
			});
		},
		(err) => {
			customLog(['Test 4 passed', err.message]);
		}
	);

	res.render('index', { middle: 'tests', text: 'Testy interfejsu' });
});

app.post('/tests/:n', (req, res) => {
	const responses = [
		{ accepted: true, message: 'Żądanie zaaceptowane' },
		{ accepted: false, message: 'Żądanie niezaaceptowane' },
		'Odpowiedź nieprawodłowa',
	];
	res.send(responses[req.params.n]);
});

app
	.route('/login')
	.get((req, res) => {
		res.render('index', {
			middle: 'login',
			text: 'Panel logowania',
			username: req.session.username,
		});
	})
	.post((req, res) => {
		if (!req.body.username) {
			res.render('index', {
				middle: 'login',
				text: 'Niekompletny formularz!',
				username: req.session.username,
			});
			return;
		}
		if (
			!typeof req.body.username === 'string' ||
			!req.body.username.trim().match(/^([^\s<>]+ )*[^\s<>]+$/)
		) {
			res.render('index', {
				middle: 'login',
				text: 'Nieprawidłowe dane formularza!',
				username: req.session.username,
			});
			return;
		}
		req.session.username = req.body.username;
		res.render('index', {
			middle: 'login',
			text: 'Nazwa użytkownika nadana prawidłowo',
			username: req.session.username,
		});
	});

app.use((req, res, next) => {
	res.status(404);
	res.render('index', { text: '404', middle: 'error404' });
});

/**
 * Function to format log messages
 * @param {any} toLog - Value to print to console
 */
function customLog(toLog) {
	console.log('--------------------------------');
	console.log('Main server:');
	console.log(toLog);
}

/**
 * Middleware function for logging URL
 * @param {express.Request} req - Incoming message
 * @param {express.Response} res - Response
 * @param {express.NextFunction} next - Next function to call
 */
function logger(req, res, next) {
	console.log('\nURL: ' + req.originalUrl);
	next();
}

// HTTPS version -> SSL cert works only on localhost
const https = require('https');
const fs = require('fs');
const options = {
	pfx: fs.readFileSync('server/CertLocalhost.pfx'),
	passphrase: 'Cookie#1',
};
var server = https.createServer(options, app);
server.listen(443, function () {
	console.log('HTTPS Express server is up!');
	console.log(server.address());
});

server.on('upgrade', (request, socket, head) => {
	rooms.wsServer.handleUpgrade(request, socket, head, (socket) => {
		rooms.wsServer.emit('connection', socket, request);
	});
});
