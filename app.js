var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require("express-session");
var flash = require("connect-flash");
var passport = require("passport");
var qiniu = require('qiniu');
var config = require('./config.js');

// mongo 
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var db = mongoose.connect('mongodb://root:1215225624@127.0.0.1:27017/card?authSource=admin', {
	useMongoClient:true
});

var users = require('./routes/users');
var cards = require('./routes/cards');
var files = require('./routes/files');

var app = express();


// view engine setup
app.set('views',path.join(__dirname , 'views') );
app.engine('.html', require('ejs').__express);  
app.set('view engine', 'html'); 

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());
app.use(session({
	secret: 'Cp@1215225624518',
	saveUninitialized: true,
	resave: true,
	cookie: {
		maxAge: 60000*120	// 60mins 
	}
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/', users);
app.use('/cards', cards);

/*get token for qiniu*/
qiniu.conf.ACCESS_KEY = config.ACCESS_KEY;
qiniu.conf.SECRET_KEY = config.SECRET_KEY;

var uptoken = new qiniu.rs.PutPolicy(config.Bucket_Name);
app.get('/uptoken', function(req, res, next) {
    var token = uptoken.token();
    res.header("Cache-Control", "max-age=0, private, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
    if (token) {
        res.json({
            uptoken: token
        });
    }
});
/*get token for qiniu*/

app.use('/files', files);
module.exports = app;
