const express = require("express");
const gameAPI = require("./api/game");
const path = require("path");
const bodyParser = require('body-parser');
const dbusersRouter = require("./routes/dbusers");
const roomsRouter = require('./routes/rooms');

var app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use("/static", express.static(path.join(__dirname, "resources")));
app.use(logger);
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use("/users", dbusersRouter);
app.use("/rooms", roomsRouter);

app.get("/", middleware, (req, res) =>
{
    res.render("index", {text: " EJS render!"});
    //res.redirect("new/url");
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

var server = app.listen(80, function () {
        var host = server.address().address;
        var port = server.address().port;
        console.log("Example app listening at http://%s:%s", host, port);
});

server.on("close", () => {
    client.close();
    console.log('DB Disconnetced!');
});