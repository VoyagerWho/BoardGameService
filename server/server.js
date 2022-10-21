const express = require('express');
const gameAPI = require('./api/game');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const dbusersRouter = require('./routes/dbusers');
const rooms = require('./routes/rooms');

const sessionParser = session({
	store: MongoStore.create({
		mongoUrl: process.env.mongoApiKey,
	}),
	secret: process.env.sessionSecret,
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: false,
	},
});

var app = express();
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
	res.render('index', { text: ' Strona Domowa' });
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
			!req.body.username.match(/^([^\s<>]+ )*[^\s<>]+$/)
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

server.on('upgrade', (request, socket, head) => {
	rooms.wsServer.handleUpgrade(request, socket, head, (socket) => {
		rooms.wsServer.emit('connection', socket, request);
	});
});
