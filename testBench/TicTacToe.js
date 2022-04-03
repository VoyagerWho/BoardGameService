var board = [0, 0, 0, 0, 0, 0, 0, 0, 0];
var player = 1;

function onBodyLoad()
{
    updateBoardGUI();
    document.getElementById("btnRuch").onclick = function()
    {
        var move = document.getElementById("textRuch").value;
        if(move != '')
        {
            console.log(move);
            board[4] = player;
            player = player%2 + 1;
            updateBoardGUI();
        }
    };
}

function updateBoardGUI()
{
    for(var i=0; i<3; ++i)
    {
        var row = document.getElementById("brow" + i);
        for(var j=0; j<3; ++j)
        {
            cell = row.getElementsByTagName("td")[j];
            switch(board[3*i+j])
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
}