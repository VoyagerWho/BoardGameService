const http = require("http");

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
 * Function to send http request
 * @param {string | URL | http.RequestOptions} options
 * @param {*} data
 * @param {(res: http.IncomingMessage) => void} responseHandler
 * @param {(err: Error) => void} errorHandler 
 */
function httpRequest(options, data, responseHandler, errorHandler)
{
    if(!errorHandler)
        errorHandler = function(err){console.error(err);};
    var httpsreq = http.request(options, responseHandler);
    httpsreq.on("error", errorHandler);
    if(data)
        httpsreq.write(data);
    httpsreq.end();
}

function getHttpOptionsForGame(game)
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

}

function startNewGame(game, data, responseHandler, errorHandler)
{
    var options = getHttpOptionsForGame(game);
    if(data)
    {
        data = JSON.stringify(data);
        options.headers["Content-Length"]=data.lenght;
    }
    httpRequest(options, data, responseHandler, errorHandler);
}



module.exports.httpRequest = httpRequest;
module.exports.startNewGame = startNewGame;
module.exports.exampleOptions = exampleOptions;
