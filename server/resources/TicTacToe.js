/**
 * XHR request
 * @type {XMLHttpRequest}
 */
var request;

/**
 * Function to create new XHR object
 * @returns {XMLHttpRequest}
 */
function getRequestObject()
{
	if ( window.ActiveXObject)
	{
		return ( new ActiveXObject("Microsoft.XMLHTTP"));
	}
	else if (window.XMLHttpRequest)
	{
		return (new XMLHttpRequest());
	}
	else
	{
		return (null);
	}
}

/**
 * Function to send AJAX request via post method
 * @param {string} strURL 
 * @param {string} mess 
 * @param {Function} respFunc 
 */
function xmlhttpPost(strURL, mess, respFunc) {
    var xhr = getRequestObject();
    if (xhr !== null)
    {
        xhr.onreadystatechange = function() {
            if(xhr.readyState == 4)
            {
                if(xhr.status == 200)
                {    
                   respFunc(xhr.responseText);
                }
                else if(xhr.status == 401)
                {
                   window.location.reload();
                } 
            }
        };
        xhr.open("POST", strURL);
        xhr.setRequestHeader("X-Requested-With","XMLHttpRequest");
        xhr.setRequestHeader("Content-Type","application/json; charset=UTF-8");
        xhr.send(JSON.stringify(mess));  
    }
    else
    {
      console.error("XHR not available!");  
    }       
}
/**
 * Temporar holder of player id
 * @type {number}
 */
var player = 1;

function onBodyLoad()
{
    update();
    document.getElementById("btnMove").onclick = function()
    {
        var move = document.getElementById("textMove").value;
        if (move !== "")
        {
            document.getElementById("textMove").value="";
            var reqjson = {};
            reqjson.player = player;
            reqjson.move = move;
            xmlhttpPost("/Move", reqjson, function (response){
                var resjson = JSON.parse(response);
                console.log(resjson);
                if (resjson.accepted)
                {
                    update();
                    player = player%2+1;
                }
                
            });
        }
    };
    document.getElementById("btnGame").onclick = function()
    {
        xmlhttpPost("/NewGame", {}, function (response){
            var resjson = JSON.parse(response);
            console.log(resjson);
            update();
        });
    };
    document.getElementById("btnRound").onclick = function()
    {
        xmlhttpPost("/NewRound", {}, function (response){
            var resjson = JSON.parse(response);
            console.log(resjson);
            update();
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
    xmlhttpPost("/Update", mess, function (response){
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