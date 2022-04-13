const express = require("express");
const bodyParser = require('body-parser');
const router = express.Router();
const gameAPI = require("../api/game");

const games = [
    {
        name: "TicTacToe",
        hostname: "localhost",
        port: 1107,
        description: "Dwuosobowa gra  planszowa w kółko i krzyżyk"
    }
];

const rooms = [0];

router.use(bodyParser.urlencoded({extended:true}));
router.use(bodyParser.json());

router.get("/", (req, res) =>
{
    res.render("index", {text: " Rooms Router!"});
});

router.get("/:id", (req, res) =>
{
    res.render("index", {text: games[rooms[req.params.id]].name, middle:"board", game: games[rooms[req.params.id]]});
});

router.post("/:id/NewGame", (req, res) =>
{
    gameAPI.startNewGame(games[rooms[req.params.id]], null, httpres =>
    {
        httpres.on("data", d =>
        {
            const resjson = JSON.parse(d.toString());
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

module.exports = router;