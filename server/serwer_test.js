const express = require("express");
const gameAPI = require("./api/game");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const dbusersRouter = require("./routes/dbusers");
const rooms = require("./routes/rooms");
const tictactoe = require("../games/TicTacToe-server");
const sessionParser = session({
    secret: "argen",
    resave: false,
    saveUninitialized: false
});
var app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use("/static", express.static(path.join(__dirname, "resources")));
app.use(logger);
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());
app.use(sessionParser);
rooms.passSessionParser(sessionParser)

app.use("/users", dbusersRouter);
app.use("/rooms", rooms.router);
app.use("/tictactoe", tictactoe.router);
app.use("/games", (req, res)=>
{
    res.redirect(307, "/rooms/games" + req.url);
});

app.get("/", middleware, (req, res) =>
{
    res.render("index", {text: " EJS render!"});
    //res.redirect("new/url");
});

app.get("/session", (req, res)=>
{
    res.end(req.session.working);
});

app.get("/ttt", (req, res) =>
{
    const data = JSON.stringify({
        uid: 1,
        message: "Extra payload"
    });
    var options = gameAPI.exampleOptions;
    options.path = "/Update";
    options.headers["Content-Length"]=data.length;
    gameAPI.httpRequest(options, data, httpres =>
    {
        console.log(`Server status code: ${httpres.statusCode}`);
        httpres.on("data", d =>
        {
            const resjson = JSON.parse(d.toString());
            console.log(resjson);
            res.json(resjson);
        });
    });
});

app.use((req, res, next)=>
{
    res.status(404);
    res.render("index", {text: "404", middle: "error404"})    
});


function logger(req, res, next)
{
    console.log("URL: " + req.originalUrl);
    next();   
}

function middleware(req, res, next)
{
    console.log("Middleware example");
    next();   
}
// 192.168.25.12
// 192.168.25.15
const port = process.env.PORT || process.argv[2] || 80;
var server = app.listen(port, "192.168.25.12", () => 
{
    var host = server.address().address;
    console.log("Example app listening at http://%s:%s", host, port);
});

server.on("close", () => 
{
    client.close();
    console.log('DB Disconnetced!');
});

server.on('upgrade', (request, socket, head) => 
{
    rooms.wsServer.handleUpgrade(request, socket, head, socket => 
    {
        rooms.wsServer.emit('connection', socket, request);
    });
});