const express = require('express');
const gameAPI = require('./api/game');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dbusersRouter = require('./routes/dbusers');
const rooms = require('./routes/rooms');
const tictactoe = require('../games/TicTacToe-server');
const sessionParser = session({
	store: MongoStore.create({
		mongoUrl: process.env.mongoApiKey,
		autoRemove: 'disabled',
	}),
	secret: process.env.sessionSecret,
	resave: false,
	saveUninitialized: false,
	unset: 'destroy',
	cookie: {
		sameSite: 'Lax',
		maxAge: 60000,
		secure: true,
	},
});

var app = express();
//app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
app.use('/static', express.static(path.join(__dirname, 'resources')));
app.use(logger);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(sessionParser);
rooms.passSessionParser(sessionParser);

app.use('/users', dbusersRouter);
app.use('/rooms', rooms.router);
app.use('/tictactoe', tictactoe.router);
app.use('/games', (req, res) => {
	res.redirect(307, '/rooms/games' + req.url);
});

app.get('/', (req, res) => {
	res.render('index', { text: ' EJS render!' });
	//res.redirect("new/url");
});

app.get('/session', (req, res) => {
	res.end(req.session.working);
});

app.get('/ttt', (req, res) => {
	const data = JSON.stringify({
		uid: 1,
		message: 'Extra payload',
	});
	var options = gameAPI.exampleOptions;
	options.path = '/Update';
	options.headers['Content-Length'] = data.length;
	gameAPI.httpsRequest(options, data, (httpres) => {
		customLog(`Server status code: ${httpres.statusCode}`);
		httpres.on('data', (d) => {
			const resjson = JSON.parse(d.toString());
			customLog(resjson);
			res.json(resjson);
		});
	});
});

app.use((req, res, next) => {
	res.status(404);
	res.render('index', { text: '404', middle: 'error404' });
});

function customLog(toLog) {
	console.log('--------------------------------');
	console.log('Main server:');
	console.log(toLog);
}

function logger(req, res, next) {
	console.log('\nURL: ' + req.originalUrl);
	next();
}

const port = process.env.PORT || process.argv[2] || 80;
var server = app.listen(port, () => {
	customLog('App listening');
});

server.on('close', () => {
	client.close();
	customLog('DB Disconnetced!');
});

server.on('upgrade', (request, socket, head) => {
	rooms.wsServer.handleUpgrade(request, socket, head, (socket) => {
		rooms.wsServer.emit('connection', socket, request);
	});
});
