// Required Modules
require('dotenv').load();
var express    = require("express");
var morgan     = require("morgan");
var bodyParser = require("body-parser");
var jwt        = require("jsonwebtoken");
var fs = require("fs");
var qiniu = require('qiniu');

var app        = express();
var port = process.env.PORT || 80;

var User = require('./models/user');
var Card = require('./models/card');

// mongo 
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var db = mongoose.connect('mongodb://root:1215225624@127.0.0.1:27017/card?authSource=admin', {
    useMongoClient:true
});

app.use(express.static("./public"));
app.get("/", function(req, res) {
    res.sendFile("./public/index.html");
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var accessLog = fs.createWriteStream('./log/access.log', {flags : 'a'});   
app.use(morgan('dev'));     //打印到控制台  
//app.use(morgan('tiny', {stream : accessLog}));      //打印到log日志  

// let browser get the results，支持跨域请求。
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST','PUT','DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.post('/login', function(req, res) {
    User.findOne({username: req.body.username}, function(err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {

            if (user) {
                user.checkPassword(req.body.password, user.password, function(err, isMatch) {
                    if (isMatch) {
                        res.json({
                            type: true,
                            data: user,
                            token: user.token
                        }); 
                    } 
                });       
            } else {
                res.json({
                    type: false,
                    data: "用户名或者密码错误"
                });    
            }
        }
    });
});

app.get('/user', ensureAuthorized, function(req, res) {
    User.findOne({token: req.token}, function(err, user) {
        if (user) {
            res.json({
                type: true,
                data: user,
            });
        } else {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        }
    });
});


app.post('/signin', function(req, res) {
    User.findOne({username: req.body.username, password: req.body.password}, function(err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            if (user) {
                res.json({
                    type: false,
                    data: "User already exists!"
                });
            } else {
                var userModel = new User();
                userModel.username = req.body.username;
                userModel.password = req.body.password;
                userModel.cards = new Array();
                userModel.save(function(err, user) {
                    user.token = jwt.sign(user, process.env.JWT_SECRET);
                    user.save(function(err, user1) {
                        res.json({
                            type: true,
                            data: user1,
                            token: user1.token
                        });
                    });
                })
            }
        }
    });
});

app.post('/card', ensureAuthorized, function(req, res) {
    User.findOne({token: req.token}, function(err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            var newCard = new Card(req.body);
            newCard.password = req.token;
            newCard.save(function(err) {
                if(err) {
                    res.json({
                        type: false,
                        data: "Error occured: " + err
                    });
                } else {
                    user.cards.push(newCard.cardPath);
                    user.save(function(err, user1) {
                        res.json({
                            type: true,
                            data: user1,
                        });
                    });
                }
            });

        }
    });
});

app.put('/card', ensureAuthorized, function(req, res) {
    User.findOne({token: req.token}, function(err, user) {
        if (err || req.token != req.body.password) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            Card.findOne({cardPath: req.body.cardPath}, function(err, card) {
                if(err) {
                    res.json({
                        type: false,
                        data: "Error occured: " + err
                    });
                } else {
                    var newCard = new Card(req.body);
                    var upsertData = newCard.toObject();
                    delete upsertData._id;
                    Card.update({_id: card._id}, upsertData, {upsert:true}, function(err){
                        if(err) {
                            res.json({
                                type: false,
                                data: "Error occured: " + err
                            });
                        } else {
                            res.json({
                                type: true,
                                data: "保存成功",
                            });
                        }
                    });
                }
            });
        }
    });
});

app.get('/card/:cardName', ensureAuthorized, function(req, res) {
    User.findOne({token: req.token}, function(err, user) {
        if (err || !user) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            var cardPath = user.id + '/' + req.params.cardName;
            Card.findOne({cardPath: cardPath}, function(err, card) {
                if(err || !card) {
                    next(err);
                } else {
                    if (card.password != req.token) {
                        res.json({
                            type: false,
                            data: "非法操作"
                        });
                    }
                    res.json({
                        type: true,
                        card: card,
                        user: user
                    });
                }
            });
        }
    });
});

app.post('/finish', ensureAuthorized, function(req, res, next) {
    User.findOne({token: req.token}, function(err, user) {
        if (err || !user) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            console.log(1);
            var owner = user.id;
            var cardName = req.body.cardName;
            var personName = req.body.personName;
            var content = req.body.content;
            var head = "<html>" +
            "<head>" +
            "<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">" +
            "<meta name=\"viewport\", initial-scale=1.0, maximum-scale=1.0, user-scalable=no\">" +
            "<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">" +
            "<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black\">" +
            "<meta name=\"viewport\" content=\"width=device-width, minimum-scale=1, maximum-scale=2,user-scalable=no\">"+
            "<meta name=\"format-detection\" content=\"telephone=no\">" + 
            "<title>" + personName + "的微名片</title>" +
            "<link href=\"/stylesheets/main.css\" rel=\"stylesheet\">" +
            "</head>" +
            "<body>" + 
            "<div>";
            var tail = "</div>" +
            "<script src=\"/javascripts/main.js\"></script>" + 
            "</body>" +
            "</html>";
            var out = head + content + tail;
            var path = "./public/uploads/" + owner + "/" + cardName + ".html";
            var buffer = new Buffer(out);
            if(fs.existsSync(path)) {
                fs.unlinkSync(path);
            }
            fs.open(path, 'w+', function(err, fd) {
                if(err) {

                    next(err);
                } else {
                    fs.write(fd, buffer, 0, buffer.length, null, function(err) {
                        if(err) {
                            res.json({
                                type: true,
                                data: "Error occured: " + err
                            });
                        } else {
                            fs.close(fd, function() {
                                res.json({
                                    type: true,
                                    data: "创建成功"
                                });
                            });
                        }
                    });
                }
            });
        }
    });
});



/* qiniu*/
var accessKey = process.env.ACCESS_KEY;
var secretKey = process.env.SECRET_KEY;
var bucket = process.env.Bucket_Name;

var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
var putPolicy = new qiniu.rs.PutPolicy({
    scope: bucket
});

var config = new qiniu.conf.Config();
//config.useHttpsDomain = true;
config.zone = qiniu.zone.Zone_z0;
var bucketManager = new qiniu.rs.BucketManager(mac, config);


app.get('/uptoken', function(req, res, next) {
    var uptoken = putPolicy.uploadToken(mac);
    res.header("Cache-Control", "max-age=0, private, must-revalidate");
    res.header("Pragma", "no-cache");
    res.header("Expires", 0);
    if (uptoken) {
        res.json({
            uptoken: uptoken
        });
    }
});

/*删除七牛云上面没有使用的图片*/
app.post('/delete/files', ensureAuthorized, function(req, res, next) {
    User.findOne({token: req.token}, function(err, user) {
        if (err || !user) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            var pre = user.id + '/' + req.body.cardName;
            var options = {
                limit: 50,
                prefix: pre
            };
            bucketManager.listPrefix(bucket, options, function(err, respBody, respInfo) {
                if (err) {
                    res.json({
                        type: false,
                        data: "Error occured: " + err
                    });
                } else {
                    var temp = new Array();
                    var items = respBody.items;
                    var keys = new Array();
                    items.forEach(function(item) {
                        keys.push(item.key);
                    });
                    var imgs = req.body.upImages;
                    for (var i=0;i < imgs.length; i++) {
                        imgs[i] = pre + '/' + imgs[i];
                    }
                    for (var i=0; i<keys.length; i++) {
                        if (imgs.indexOf(keys[i]) == -1) {
                            temp.push(keys[i]);
                        }
                    }
                    var deleteOperations = new Array();
                    temp.forEach(function(item) {
                        deleteOperations.push(qiniu.rs.deleteOp(bucket, item));
                    });
                    bucketManager.batch(deleteOperations, function(err, respBody, respInfo) {
                        if (err) {
                            console.log(err);
                        } else {
                            if (parseInt(respInfo.statusCode / 100) == 2) {
                                respBody.forEach(function(item) {
                                    if (item.code == 200) {
                                        console.log(item.code + "\tsuccess");
                                    } else {
                                        console.log(item.code + "\t" + item.data.error);
                                    }
                                });
                            } else {
                                res.json({
                                    type: true,
                                    data: respBody
                                });
                            }
                        }
                    });
                }
            });
        }
    });
});

/*七牛*/



/*get token from header*/
function ensureAuthorized(req, res, next) {
    var token;
    var tokenHeader = req.headers["authorization"];
    if (typeof tokenHeader !== 'undefined') {
        var tokenName = tokenHeader.split(" ");
        token = tokenName[1];
        req.token = token;
        next();
    } else {
        res.send(403);
    }
}

process.on('uncaughtException', function(err) {
    console.log(err);
});




// Start Server
app.listen(port, function () {
    console.log( "Express server listening on port " + port);
});
