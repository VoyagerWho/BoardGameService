const https = require("https");

const exampleOptions = {
    hostname: 'localhost',
    port: 1107,
    path: '/example',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': 0
    }
};

/**
 * Function to send https request
 * @param {string | URL | https.RequestOptions} options
 * @param {*} data
 * @param {(res: https.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler 
 */
function httpsRequest(options, data, responseHandler, errorHandler)
{
    if(!errorHandler)
        errorHandler = function(err){console.error(err);};
    var httpsreq = https.request(options, responseHandler);
    httpsreq.on("error", errorHandler);
    if(data)
        httpsreq.write(data);
    httpsreq.end();
}

/**
 * Helper function to generate default request options for given game
 * 
 * Example of returned JSON object:
 * @example
 * {
 *   hostname: 'localhost',
 *   port: 1107,
 *   path: '/example',
 *   method: 'POST',
 *   headers: {
 *       'Content-Type': 'application/json',
 *       'Content-Length': 0
 * }
 * 
 * @param {JSON} game - game api description
 * @returns {https.RequestOptions} 
 */
function getHttpsOptionsForGame(game)
{
    var options = {
        path: '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': 0
        }
    };
    options.hostname = game.hostname;
    options.port = game.port;
    return options;
}

/**
 * Function handling command `NewGame`
 * @param {JSON} game - game api description
 * @param {JSON} data - data to send
 * @param {(res: https.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler 
 */
const startNewGame = (data, responseHandler, errorHandler) => sendCommand("NewGame", data, responseHandler, errorHandler);

/**
 * Function handling command `NewRound`
 * @param {JSON} game - game api description
 * @param {JSON} data - data to send
 * @param {(res: https.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler 
 */
const startNewRound = (data, responseHandler, errorHandler) => sendCommand("NewRound", data, responseHandler, errorHandler);

/**
 * Function handling command `Move`
 * @param {JSON} game - game api description
 * @param {JSON} data - data to send
 * @param {(res: https.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler 
 */
const makeMove = (data, responseHandler, errorHandler) => sendCommand("Move", data, responseHandler, errorHandler);

/**
 * Function handling command `Update`
 * @param {JSON} game - game api description
 * @param {JSON} data - data to send
 * @param {(res: https.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler 
 */
const update = (data, responseHandler, errorHandler) => sendCommand("Update", data, responseHandler, errorHandler)

function sendCommand(command, game, data, responseHandler, errorHandler)
{
    var options = getHttpsOptionsForGame(game);
    options.path=game.api[command];
    if(data)
    {
        console.log(data);
        data = JSON.stringify(data);
        options.headers["Content-Length"]=data.length;
    }
    httpsRequest(options, data, responseHandler, errorHandler);
}

/**
 * Function handling update of GUI for every room member
 * @param {JSON} room - room instance to update
 */
function updateAll(room)
{
    var options = getHttpsOptionsForGame(room.game);
    options.path=room.game.api["Update"];
    var data;
    room.players.forEach((player, index) => 
    {
        data = JSON.stringify({uid: index+1});
        options.headers["Content-Length"]=data.length;
        httpsRequest(options, data, res=>
            {
                res.on("data", d =>
                {
                    const httpsres = JSON.parse(d.toString());
                    const resjson = {
                        accepted: true,
                        action: "Update",
                        state: httpsres
                    };
                    player.socket.send(JSON.stringify(resjson));
                });
            });
    });
    if (room.observers.length)
    {
        data = JSON.stringify({uid: 0});
        httpsRequest(options, data, res=>
            {
                res.on("data", d =>
                {
                    const httpsres = JSON.parse(d.toString());
                    const resjson = {
                        accepted: true,
                        action: "Update",
                        state: httpsres
                    };
                    room.observers.forEach((observer)=>
                    {
                        observer.socket.send(JSON.stringify(resjson));
                    });
                });
                
            });
    }
    
}

module.exports.httpsRequest = httpsRequest;
module.exports.startNewGame = startNewGame;
module.exports.startNewRound = startNewRound;
module.exports.makeMove = makeMove;
module.exports.update = update;
module.exports.updateAll = updateAll;
module.exports.exampleOptions = exampleOptions;
