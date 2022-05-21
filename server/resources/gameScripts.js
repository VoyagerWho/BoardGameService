/**
 * Temporar holder of player id
 * @type {number}
 */
var player = 1;
/**
 * Temporar holder of room data
 * @type {JSON}
 */
var room = {id: 0};

var socket = new WebSocket("ws://"+document.location.host);

socket.onopen = function(e) {
    alert("[open] Connection established");
    socket.send(JSON.stringify({action: "GetRole", roomsId: 0}))
};

socket.onmessage = function(event) {
    var resjson = JSON.parse(event.data.toString());
    console.log(resjson);
    if(resjson.accepted)
    {
        switch (resjson.action)
        {
            case "GetRole":
            {
                player = resjson.uid;
                alert(resjson.response);
            }break;
            case "Update":
            {
                updateGUI(resjson.state);
            }break;
        
            default:
            {

            }break;
        }
    }
    else
    {
        alert("Request not accepted");
    }
};

socket.onclose = function(event) {
    if (event.wasClean) 
    {
        alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } 
    else
    {
        alert('[close] Connection died');
    }
};

socket.onerror = function(error) {
    alert(`[error] ${error.message}`);
};

function makeMove(move)
{
    var reqjson = {};
    reqjson.player = player;
    reqjson.move = move;
    xmlhttpPost("/rooms/"+room.id+"/Move", reqjson, function (response){
        var resjson = JSON.parse(response);
        console.log(resjson);
        if (resjson.accepted)
        {
            //update();
            //player = player%2+1;
        }
        
    });
}

function onBodyLoad()
{
    update();
    document.getElementById("btnGame").onclick = function()
    {
        xmlhttpPost("/rooms/"+room.id+"/NewGame", {}, function (response){
            var resjson = JSON.parse(response);
            console.log(resjson);
            //update();
        });
    };
    document.getElementById("btnRound").onclick = function()
    {
        xmlhttpPost("/rooms/"+room.id+"/NewRound", {}, function (response){
            var resjson = JSON.parse(response);
            console.log(resjson);
            //update();
        });
    };
    document.getElementById("canvas").onclick = function(e)
    {
        console.log("offx: " + e.offsetX + "; offy: " + e.offsetY);
    };
}

function update()
{
    var mess = {uid: player};
    xmlhttpPost("/rooms/"+room.id+"/Update", mess, function (response){
        var resjson = JSON.parse(response);
        console.log(resjson);
        updateGUI(resjson);
    });
}

function updateGUI(state)
{
    for(var i=0; i<3; ++i)
    {
        var row = document.getElementById("brow" + i);
        for(var j=0; j<3; ++j)
        {
            cell = row.getElementsByTagName("td")[j];
            switch(state.board[3*i+j])
            {
                case 0:
                    cell.innerText = " ";
                break;
                case 1:
                    cell.innerText = "O";
                break;
                case 2:
                    cell.innerText = "X";
                break;
            }
        }
    }
    document.getElementById("score").innerHTML=state.score.toString();
}