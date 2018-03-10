// Required Modules
var express    = require("express");
var morgan     = require("morgan");
var fs = require("fs");
var app        = express();

var port = 80;

var staticLog = fs.createWriteStream('./log/static.log', {flags : 'a'});   
//app.use(morgan('dev'));     //打印到控制台  
app.use(morgan('tiny', {stream : staticLog}));
app.use(express.static("./public"));

app.get("/", function(req, res) {
    res.sendFile("./public/index.html");
});

// Start Server
app.listen(port, function () {
    console.log( "Express server listening on port " + port);
});