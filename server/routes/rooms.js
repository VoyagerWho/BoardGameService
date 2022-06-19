const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const gameAPI = require("../api/game");
const ws = require('ws');

/**
 * App session instance
 * @type {express.RequestHandler}
 */
var sessionParser;

/**
 * Function to pass main express session instance to router
 * @param {express.RequestHandler} sp 
 */
function passSessionParser(sp)
{
    sessionParser = sp;
    router.use(sessionParser);
}

const games = [];

const rooms = [];

//---------------------------------------------------------------------
const debugMode = true;
if(debugMode)
{
    games.push({
        name: "TicTacToe",
        hostname: '::',
        port: 8080,
        description: "Dwuosobowa gra  planszowa w kółko i krzyżyk",
        maxNoPlayers: 2,
        board: {
            type: "table",
            rowCount: 3,
            rowLabels: "d",
            columnCount: 3,
            columnLabels: "l"
        },
        api: {
            "NewGame": "/tictactoe/NewGame",
            "NewRound": "/tictactoe/NewRound",
            "Move": "/tictactoe/Move",
            "Update": "/tictactoe/Update"
        }
    });

    rooms.push({
        game: games[0],
        noPlayers: 0,
        maxNoPlayers: games[0].maxNoPlayers,
        noObservers: 0,
        players: [],
        observers: []
    });
}
//---------------------------------------------------------------------
var sockets = new Map();
var lastSocketId = 0;
const wsServer = new ws.Server({ noServer: true });

function handleMessage(socket, messjson)
{
    var roomStats = {};
    var resjson = {action: messjson.action};
    if(messjson.roomsId === undefined || messjson.roomsId === null)
        roomStats.roomsId = -1
    else if(typeof(messjson.roomsId) !== "number")
        roomStats.roomsId = -1 
    else
        roomStats.roomsId = messjson.roomsId;
    switch (messjson.action)
    {
        case "GetRole":
        {
            if(roomStats.roomsId >= 0 && roomStats.roomsId < rooms.length)
            {
                const room = rooms[roomStats.roomsId];
                const game = room.game;
                resjson.accepted = true;
                resjson.response = "Role assigned successfully";
                if(room.noPlayers < game.maxNoPlayers)
                {
                    var id = 0;
                    while (room.players[id])
                    {
                        ++id;    
                    }
                    roomStats.uid = id+1;
                    room.players[id] = {socket: socket};
                    ++room.noPlayers;
                    resjson.description = "Player"+roomStats.uid;
                }
                else
                {
                    var id = 0;
                    while (room.observers[id])
                    {
                        ++id;    
                    }
                    roomStats.uid = 0;
                    roomStats.oid = id;
                    room.observers[id] = {socket: socket};
                    ++room.noObservers; 
                    resjson.description = "Observer";
                    
                }
                resjson.uid = roomStats.uid;
            }
            else
            {
                resjson.accepted = false;
                resjson.response = "Failed to assign the role";
                resjson.resone = "Incorrect room id: " + roomStats.roomsId;
            }
            socket.roomStats = roomStats;
            socket.send(JSON.stringify(resjson));
        }break;
        case "_dCP":
        {
            if(roomStats.roomsId >= 0 && roomStats.roomsId < rooms.length)
            {
                const room = rooms[roomStats.roomsId];
                room.noPlayers = 0;
                room.players = [];
            }
            socket.send(JSON.stringify({accepted: true, action: messjson}));
        }break;
        default:
        {
            console.log("Unknow action: " + messjson.action);
            socket.send(JSON.stringify({accepted: false, response: "Unknow action: " + messjson.action}));
        }break;
    }    
}
wsServer.on("connection", (socket, req) =>
{
    // sessionParser(socket.upgradeReq, {}, function(){
    //     console.log("New websocket connection:");
    //     const sess = req.upgradeReq.session;
    //     console.log("working = " + sess.working);
    // });
    sessionParser(req, {}, ()=>
    {
        console.log("New websocket connection:");
        req.session.websocketdata = {mess: "I am listening!"};
        req.session.payload = {mess: "Oncomming storm"};
        //req.session.save((err)=>console.log(err));
        console.log(req.session);
        console.log("working = " + req.session.working);
    });
    
    console.log("Socket conneted!");
    socket.mapKey = lastSocketId;
    sockets.set(lastSocketId, socket);
    ++lastSocketId;
    sockets.forEach((v, k)=>{console.log(k + " -> " + v.mapKey)});
    socket.on("message", message => 
    {
        req.session.payload = {mess: "Oncomming storm"};
        console.log(req.session);
        req.session.save();
        var messjson = {};
        try {
            messjson = JSON.parse(message.toString());
        } catch (error) {
            messjson = {message: message.toString()};
        }
        console.log(messjson);
        handleMessage(socket, messjson);
    });

    socket.on("close",(code, reason)=>
    {
        console.log("Socket disconneted!");
        const rid = socket.roomStats.roomsId;
        const uid = socket.roomStats.uid;
        if(uid === 0)
        {
            rooms[rid].observers[socket.roomStats.oid]=undefined;
            --rooms[rid].noObservers;
        }
        else
        {
            rooms[rid].players[uid-1]=undefined;
            --rooms[rid].noPlayers;
        }
        sockets.delete(socket.mapKey);
    });
});

router.use(bodyParser.urlencoded({extended:false}));
router.use(bodyParser.json());
router.get("/", (req, res) =>
{
    req.session.working = "yes!";
    req.session.save();
    res.render("index", {text: "List of open rooms" , middle: "rooms", rooms: rooms, games: games});
});

router.get("/games", (req, res)=>
{
    res.render("index", {text: "List of games", middle: "games", games: games});
});

router.get("/session", (req, res)=>
{
    res.json(req.session);
});

function openRoom(game)
{
    var room = {
        game: game,
        noPlayers: 0,
        maxNoPlayers: game.maxNoPlayers,
        noObservers: 0,
        players: [],
        observers: []
    }
    rooms.push(room);    
}

router.post("/open", (req, res) =>
{
    const gameId = Number(req.body.gameId);

    if(gameId === undefined || gameId === null || typeof(gameId) !== "number")
    {
        console.error("Incorrect type " + typeof(gameId));
        res.redirect("/rooms");
        return;
    }
    if(gameId < 0 || gameId >= games.length)
    {
        console.error("Out of range " + gameId);
        res.redirect("/rooms");
        return;
    }
    console.log("Room opened");
    openRoom(games[req.body.gameId]);
    console.log(rooms);
    res.redirect("/rooms");
}); 


router.post("/games/register", (req, res) =>
{
    console.log(req.body);
    const gameUrl = req.body.url;
    var resjson = {};
    gameAPI.httpRequest(gameUrl, null, httpres=>
    {
        httpres.on("data", d =>
        {
            try {
                resjson = JSON.parse(d.toString());
            } catch (error) {
                console.log("Received:");
                console.log(d.toString());
                resjson.accepted = false;
                res.redirect("/games");
                return;
            }
            
            console.log("Received:");
            console.log(resjson);
            // game parsing
            games.push(resjson);
            res.redirect("/games");
        });
    }, 
    err=>
    {
        console.log(err);
        resjson = {
            accepted: false
        };
        res.redirect("/games");
    });
}); 

router.post("/games/check", (req, res) =>
{
    const gameUrl = req.body.url;
    var resjson = {};
    console.log("Sending request...");
    gameAPI.httpRequest(gameUrl, null, httpres=>
    {
        httpres.on("data", d =>
        {
            try {
                resjson = JSON.parse(d.toString());
            } catch (error) {
                console.log("Received:");
                console.log(d.toString());
                resjson.accepted = false;
                res.json(resjson);
                res.end();
                return;
            }
            
            console.log("Received and sent:");
            console.log(resjson);
            resjson.accepted = true;
            res.json(resjson);
            res.end();
        });
    }, 
    err=>
    {
        console.log(err);
        resjson = {
            accepted: false
        };
        res.json(resjson);
        res.end();
    });
}); 

router.get("/games/check/:id", (req, res) =>
{
    res.redirect("/games");
}); 

router.get("/:id", (req, res) =>
{
    if(rooms[req.params.id])
        res.render("index", {text: rooms[req.params.id].game.name, middle:"board", game: rooms[req.params.id].game});
    else
        res.redirect("/rooms");
});

router.get("/:id/Observe", (req, res) =>
{
    if(rooms[req.params.id])
    {
        req.session.uid = 0;
        res.redirect("/rooms/"+ req.params.id);
    }
    else
        res.redirect("/rooms");
});

router.post("/:id/NewGame", (req, res) =>
{
    gameAPI.startNewGame(rooms[req.params.id].game, null, httpres =>
    {
        httpres.on("data", d =>
        {
            const resjson = JSON.parse(d.toString());
            console.log(resjson);
            res.json(resjson);
        })
    });
    gameAPI.updateAll(rooms[req.params.id]);
});

router.post("/:id/NewRound", (req, res) =>
{
    gameAPI.startNewRound(rooms[req.params.id].game, null, httpres =>
    {
        httpres.on("data", d =>
        {
            const resjson = JSON.parse(d.toString());
            console.log(resjson);
            res.json(resjson);
        })
    });
    gameAPI.updateAll(rooms[req.params.id]);
});

router.post("/:id/Move", (req, res) =>
{
    console.log("Recived:");
    console.log(req.body);
    gameAPI.makeMove(rooms[req.params.id].game, req.body, httpres =>
    {
        httpres.on("data", d =>
        {
            const resjson = JSON.parse(d.toString());
            console.log("Sent:");
            console.log(resjson);
            res.json(resjson);
        });
    });
    gameAPI.updateAll(rooms[req.params.id]);
});

router.post("/:id/Update", (req, res) =>
{
    console.log("Recived:");
    console.log(req.body);
    //gameAPI.updateAll(rooms[req.params.id]);
    gameAPI.update(rooms[req.params.id].game, req.body, httpres =>
    {
        httpres.on("data", d =>
        {
            const resjson = JSON.parse(d.toString());
            console.log("Sent:");
            console.log(resjson);
            res.json(resjson);
        })
    });
});

// runs every time on param
router.param("name", (req, res, next, param) =>
{
    console.log(param);
    next();
});

module.exports.router = router;
module.exports.wsServer = wsServer;
module.exports.passSessionParser = passSessionParser;