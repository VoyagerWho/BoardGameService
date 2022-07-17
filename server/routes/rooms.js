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

function customLog(toLog)
{
    console.log("--------------------------------"); 
    console.log("Room router:");
    console.log(toLog);
}
const hostname = "boardgameservice-argen.herokuapp.com";

const games = [
    {
        name: "TicTacToe",
        hostname: hostname,
        port: 443,
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
    }
];

const rooms = [
    {
        game: games[0],
        noPlayers: 0,
        maxNoPlayers: 2,
        noObservers: 0,
        players: [],
        observers: []
    }
];

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
            customLog("Unknow action: " + messjson.action);
            socket.send(JSON.stringify({accepted: false, response: "Unknow action: " + messjson.action}));
        }break;
    }    
}
wsServer.on("connection", (socket, req) =>
{
    // sessionParser(socket.upgradeReq, {}, function(){
    //     customLog("New websocket connection:");
    //     const sess = req.upgradeReq.session;
    //     customLog("working = " + sess.working);
    // });
    sessionParser(req, {}, ()=>
    {
        customLog("New websocket connection:");
        req.session.websocketdata = {mess: "I am listening!"};
        req.session.payload = {mess: "Oncomming storm"};
        //req.session.save((err)=>customLog(err));
        customLog(req.session);
        customLog("working = " + req.session.working);
    });
    
    customLog("Socket conneted!");
    socket.mapKey = lastSocketId;
    sockets.set(lastSocketId, socket);
    ++lastSocketId;
    sockets.forEach((v, k)=>{customLog(k + " -> " + v.mapKey)});
    socket.on("message", message => 
    {
        req.session.payload = {mess: "Oncomming storm"};
        customLog(req.session);
        req.session.save();
        var messjson = {};
        try {
            messjson = JSON.parse(message.toString());
        } catch (error) {
            messjson = {message: message.toString()};
        }
        customLog(messjson);
        handleMessage(socket, messjson);
    });

    socket.on("close",(code, reason)=>
    {
        customLog("Socket disconneted!");
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
    openRoom(games[req.body.gameId]);
    customLog(["Room opened", rooms]);
    res.redirect("/rooms");
}); 


router.post("/games/register", (req, res) =>
{
    customLog(req.body);
    const gameUrl = req.body.url;
    var resjson = {};
    gameAPI.httpsRequest(gameUrl, null, httpsres=>
    {
        httpsres.on("data", d =>
        {
            try {
                resjson = JSON.parse(d.toString());
            } catch (error) {
                customLog(["Received Error:", d.toString()]);
                resjson.accepted = false;
                res.redirect("/games");
                return;
            }
            
            customLog(["Received:", resjson]);
            // game parsing
            games.push(resjson);
            res.redirect("/games");
        });
    }, 
    err=>
    {
        customLog(err);
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
    customLog("Sending request...");
    gameAPI.httpsRequest(gameUrl, null, httpsres=>
    {
        httpsres.on("data", d =>
        {
            try {
                resjson = JSON.parse(d.toString());
            } catch (error) {
                customLog(["Received Error:", d.toString()]);
                resjson.accepted = false;
                res.json(resjson);
                res.end();
                return;
            }
            
            customLog(["Received and sent:", resjson]);
            resjson.accepted = true;
            res.json(resjson);
            res.end();
        });
    }, 
    err=>
    {
        customLog(err);
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
    gameAPI.startNewGame(rooms[req.params.id].game, null, httpsres =>
    {
        httpsres.on("data", d =>
        {
            const resjson = JSON.parse(d.toString());
            customLog(resjson);
            res.json(resjson);
        })
    });
    gameAPI.updateAll(rooms[req.params.id]);
});

router.post("/:id/NewRound", (req, res) =>
{
    gameAPI.startNewRound(rooms[req.params.id].game, null, httpsres =>
    {
        httpsres.on("data", d =>
        {
            const resjson = JSON.parse(d.toString());
            customLog(resjson);
            res.json(resjson);
        })
    });
    gameAPI.updateAll(rooms[req.params.id]);
});

router.post("/:id/Move", (req, res) =>
{
    customLog("Recived:");
    customLog(req.body);
    gameAPI.makeMove(rooms[req.params.id].game, req.body, httpsres =>
    {
        httpsres.on("data", d =>
        {
            const resjson = JSON.parse(d.toString());
            customLog("Sent:");
            customLog(resjson);
            res.json(resjson);
        });
    });
    gameAPI.updateAll(rooms[req.params.id]);
});

router.post("/:id/Update", (req, res) =>
{
    customLog(["Recived:",req.body]);
    //gameAPI.updateAll(rooms[req.params.id]);
    gameAPI.update(rooms[req.params.id].game, req.body, httpsres =>
    {
        httpsres.on("data", d =>
        {
            const resjson = JSON.parse(d.toString());
            customLog(["Sent:",resjson]);
            res.json(resjson);
        })
    });
});

// runs every time on param
router.param("name", (req, res, next, param) =>
{
    customLog(param);
    next();
});

module.exports.router = router;
module.exports.wsServer = wsServer;
module.exports.passSessionParser = passSessionParser;