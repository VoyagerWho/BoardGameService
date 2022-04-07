var express = require("express");
var app = express();
var bodyParser = require('body-parser');
//var fs = require("fs");

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.get("/", function (req, res) {
    res.sendFile("TicTacToeFiles/TicTacToe.html", {root: __dirname });
});

app.get("/basicStyles.css", function (req, res) {
    res.sendFile("TicTacToeFiles/basicStyles.css", {root: __dirname });
});

app.get("/TicTacToe.js", function (req, res) {
    res.sendFile("TicTacToeFiles/TicTacToe.js", {root: __dirname });
});

//-----------------------------------------------------------------------------
// Game engine
//-----------------------------------------------------------------------------

/**
 * Array representing game board
 * @type {Array<number>}
 */
 var board = [0, 0, 0, 0, 0, 0, 0, 0, 0];

 /**
  * Number representing last player
  * @type {number}
  */
 var player = 1;
 
 /**
  * Number representing player who started last round
  * @type {number}
  */
  var playerBegin = 1;
 
  /**
  * Array representing game score as 
  * [wins of player 1, ties, wins of player 2]
  * @type {Array<number>}
  */
 var score = [0, 0, 0];

 // TicTacToe game engine logic - serwer side
/**
 * Function to initialize new game
 * clearing previous' game status
 */
function startNewGame()
{
    board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    player = 1;
    playerBegin = 1;
    score = [0, 0, 0];
}

/**
 * Function to initialize new round
 * clearing previous' round status
 */
function startNewRound()
{
    board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    playerBegin = playerBegin%2+1;
    player = playerBegin;
}

/**
 * Function to check if last move score victory
 * @returns {boolean} true if player won, false otherwise  
 */
function checkIfWon()
{
    const previous = player%2+1;
    // 3 in row
    for(var i=0; i<3; ++i)
    {
        var line = true;
        for(var j=0; j<3; ++j)
        {
            if(board[3*i+j] != player)
            {
                line = false;
                break;
            }
        }
        if(line)
            return true;
    }

    // 3 in column
    for(var i=0; i<3; ++i)
    {
        var line = true;
        for(var j=0; j<3; ++j)
        {
            if(board[3*j+i] != player)
            {
                line = false;
                break;
            }
        }
        if(line)
            return true;
    }

    // check if middle
    if(board[4]==player)
    {
        // 3 in \
        if(board[0] == player && board[8] == player)
            return true;
        // 3 in /
        if(board[2] == player && board[6] == player)
            return true;
    }
    
    return false;
}

/**
 * Function to check if last move lead to draw
 * @returns {boolean} true if draw, false otherwise  
 */
 function checkIfDraw()
 {
    if(board.indexOf(0) >= 0)
        return false;
    return true;
 }

/**
 * Function to make next move by player
 * @param {number} playerId - Player id number 1 or 2
 * @param {string} position - Move position example a1
 * @returns {boolean} true if move is legal, false otherwise
 */
function makeMove(playerId, position)
{
    try 
    {
        if(typeof(position) !="string" || typeof(playerId) != "number")
            throw "Incorrect parameter type!";
        
        if(playerId != player || (playerId != 1 && playerId != 2))
            throw "Wrong player id: " + playerId;
        
        var nocolumn = position.charCodeAt(0) - 'a'.charCodeAt(0);
        
        if(nocolumn == NaN)
            throw "Invalid position: " + position;
        if(nocolumn < 0 || nocolumn > 2)
            throw "Column index out of range: " + nocolumn;
        
        var norow = position.charCodeAt(1) - '1'.charCodeAt(0);
        
        if(norow == NaN)
            throw "Invalid position: " + position;
        if(norow < 0 || norow > 2)
            throw "Row index out of range: " + norow;
        
        if(board[3*norow + nocolumn] != 0)
            throw "Invalid position: " + position;
        
        board[3*norow + nocolumn] = playerId;
        return true;
    } 
    catch (error)
    {
        console.error(error); 
    }      
}

/**
 * Function to update game state
 * @param {number} playerId - Player id number 1 or 2
 * @param {string} position - Move position example a1
 */
function updateGame(playerId, position)
{
    if(makeMove(playerId, position))
    {
        if(checkIfWon())
        {
            console.log("Player " + player + " won!");
            if(player == 1)
                ++score[0];
            else
                ++score[2];
            startNewRound();
        }
            
        if(checkIfDraw())
        {
            console.log("Draw!");
                ++score[1];
            startNewRound();
        }
        player = playerId%2+1;   
        updateGUI();

    } 
}

//-----------------------------------------------------------------------------
// Game engine API
//-----------------------------------------------------------------------------

app.post("/NewGame", function(req, res){
    startNewGame();
    res.send("New game started!");
});

app.post("/NewRound", function(req, res){
    startNewRound();
    res.send("New round started!");
});

app.post("/Move", function(req, res){
    console.log(req.body);
    res.send("WIP");
});

app.post("/Update", function(req, res){
    res.send("WIP");
});

//-----------------------------------------------------------------------------

var server = app.listen(1107, function () {
        var host = server.address().address;
        var port = server.address().port;
        console.log("Example app listening at http://%s:%s", host, port);
});

//-----------------------------------------------------------------------------
// Unit tests
//-----------------------------------------------------------------------------

function testCheckIfDraw()
{
    var tests = 0;
    const total = 3;
    board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    if(checkIfDraw())
        console.error("Failed Test Draw 1");
    else
        ++tests;

    board = [1, 1, 1, 2, 2, 1, 2, 1, 0];
    if(checkIfDraw())
        console.error("Failed Test Draw 2");
    else
        ++tests;

    board = [1, 1, 1, 2, 2, 1, 2, 1, 1];
    if(!checkIfDraw())
        console.error("Failed Test Draw 3");
    else
        ++tests;

    console.log("testCheckIfDraw: " +(tests/total));
        
}

function testCheckIfWon()
{
    var tests = 0;
    const total = 10;
    player = 1;
    board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    if(checkIfWon())
        console.error("Failed Test Won 1");
    else
        ++tests;
    
    board = [1, 1, 1, 0, 0, 0, 0, 0, 0];
    if(!checkIfWon())
        console.error("Failed Test Won 2");
    else
        ++tests;

    board = [0, 0, 0, 1, 1, 1, 0, 0, 0];
    if(!checkIfWon())
        console.error("Failed Test Won 3");
    else
        ++tests;

    board = [0, 0, 0, 0, 0, 0, 1, 1, 1];
    if(!checkIfWon())
        console.error("Failed Test Won 4");
    else
        ++tests;

    board = [1, 0, 0, 1, 0, 0, 1, 0, 0];
    if(!checkIfWon())
        console.error("Failed Test Won 5");
    else
        ++tests;

    board = [0, 1, 0, 0, 1, 0, 0, 1, 0];
    if(!checkIfWon())
        console.error("Failed Test Won 6");
    else
        ++tests;

    board = [0, 0, 1, 0, 0, 1, 0, 0, 1];
    if(!checkIfWon())
        console.error("Failed Test Won 7");
    else
        ++tests;
    
    board = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    if(!checkIfWon())
        console.error("Failed Test Won 8");
    else
        ++tests;

    board = [0, 0, 1, 0, 1, 0, 1, 0, 0];
    if(!checkIfWon())
        console.error("Failed Test Won 9");
    else
        ++tests;

    board = [1, 1, 0, 1, 1, 0, 0, 0, 0];
    if(checkIfWon())
        console.error("Failed Test Won 10");
    else
        ++tests;

    console.log("testCheckIfWon: " +(tests/total));
}

function testMakeMove()
{
    var tests = 0;
    const total = 9;
    startNewGame();
    if(makeMove(null, null))
        console.error("Failed Test Move 1");
    else
        ++tests;
    
    if(makeMove(NaN, ""))
        console.error("Failed Test Move 2");
    else
        ++tests;

    if(makeMove(1, ""))
        console.error("Failed Test Move 3");
    else
        ++tests;
    
    if(makeMove(1, " a1"))
        console.error("Failed Test Move 4");
    else
        ++tests;

    if(makeMove(1, "1a"))
        console.error("Failed Test Move 5");
    else
        ++tests;
    
    if(!makeMove(1, "a1"))
        console.error("Failed Test Move 6");
    else
        ++tests;

    player = 2;    
    if(makeMove(2, "b"))
        console.error("Failed Test Move 7");
    else
        ++tests;
    
    if(makeMove(2, "z2"))
        console.error("Failed Test Move 8");
    else
        ++tests;

    if(makeMove(2, "a9"))
        console.error("Failed Test Move 9");
    else
        ++tests;

    console.log("testMakeMove: " +(tests/total));

}

function runTests()
{
    testCheckIfDraw();
    testCheckIfWon();
    testMakeMove();
    startNewGame();
}

app.get("/Tests", function(req, res){
    runTests();
    res.send("Done!");
});

//-----------------------------------------------------------------------------

