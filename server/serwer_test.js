var express = require("express");
var app = express();
//var fs = require("fs");

app.get("/", function (req, res) {
    res.sendFile("index.html", {root: __dirname });
});

app.get("/basicStyles.css", function (req, res) {
    res.sendFile("basicStyles.css", {root: __dirname });
});

var server = app.listen(1107, function () {
        var host = server.address().address;
        var port = server.address().port;
        console.log("Example app listening at http://%s:%s", host, port);
});
