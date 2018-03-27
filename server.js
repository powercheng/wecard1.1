// Required Modules
require('dotenv').load();
var express = require("express");
var morgan = require("morgan");
var bodyParser = require("body-parser");
var jwt = require("jsonwebtoken");
var fs = require("fs");
var qiniu = require('qiniu');

var app = express();
var port = process.env.PORT || 80;

var User = require('./models/user');
var Card = require('./models/card');
var Lottery = require('./models/lottery');
// mongo 
var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
var db = mongoose.connect(process.env.mongodb, {
	useMongoClient: true
});

app.use(express.static("./public"));
//  '/' 就直接返回文档
app.get("/", function(req, res) {
	res.sendFile("./public/index.html");
});

app.use(bodyParser.urlencoded({
	extended: true,
}));
// parse application/json
app.use(bodyParser.json());

var accessLog = fs.createWriteStream('./log/access.log', {
	flags: 'a'
});
//app.use(morgan('dev')); //打印到控制台  
app.use(morgan('short', {stream : accessLog}));      //打印到log日志  

// let browser get the results，支持跨域请求。
app.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST', 'PUT', 'DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
	res.header("Content-Type", "application/json; charset=utf-8");
	next();
});

/*登录*/
app.post('/login', function(req, res) {
	if(!req.body.username) {
		res.status(400).json({
			message: '用户名为空'
		});
		return;
	}
	if(!req.body.password) {
		res.status(400).json({
			message: '密码为空'
		});
		return;
	}

	User.findOne({
		username: req.body.username
	}, function(err, user) {
		if(err) {
			res.status(400).json({
				message: "Error occured: " + err
			});
		} else {
			if(user) {
				user.checkPassword(req.body.password, user.password, function(err, isMatch) {
					if(isMatch) {
						user.password = "";
						res.status(200).json({
							user: user,
							token: jwt.sign({
								id: user._id,
								userId: user.id
							}, process.env.JWT_SECRET)
						});
					} else {
						res.status(400).json({
							message: '密码错误'
						});
					}
				});
			} else {
				res.status(400).json({
					message: '用户名错误'
				});
			}
		}
	});
});

/*注册*/
app.post('/signup', function(req, res) {
	if(!req.body.username) {
		res.status(400).json({
			message: '用户名为空'
		});
		return;
	}
	if(!req.body.password) {
		res.status(400).json({
			message: '密码为空'
		});
		return;
	}

	User.findOne({
		username: req.body.username
	}, function(err, user) {
		if(err) {
			res.status(400).json({
				message: "错误: " + err
			});
		} else {
			if(user) {
				res.status(400).json({
					message: "用户名已经存在"
				});
			} else {
				var userModel = new User();
				userModel.username = req.body.username;
				userModel.password = req.body.password;
				userModel.cards = new Array();
				userModel.save(function(err, user) {
					user.save(function(err, user1) {
						res.status(200).json({
							message: "注册成功"
						});
					});
				})
			}
		}
	});
});


/*获取user信息*/
app.get('/user', parseToken, function(req, res) {
	jwt.verify(req.token, process.env.JWT_SECRET, function(err, decoded) {
		if(err) {
			res.status(400).json({
				message: "错误token"
			});
		} else {
			User.findById(decoded.id, function(err, user) {
				if(user) {
					user.password = "";
					res.status(200).json({
						user: user,
					});
				} else {
					res.status(400).json({
						message: "错误: " + err
					});
				}
			});
		}

	});
});

/*创建,保存 card*/
app.route('/card')
	.post(parseToken, function(req, res) {
		jwt.verify(req.token, process.env.JWT_SECRET, function(err, decoded) {
			if(err) {
				res.status(400).json({
					message: "错误token"
				});
			} else {
				User.findById(decoded.id, function(err, user) {
					if(user) {
						var newCard = new Card(req.body);
						newCard.password = user.password;
						newCard.save(function(err) {
							if(err) {
								res.status(400).json({
									message: "Error occured: " + err
								});
							} else {
								user.cards.push(newCard.cardPath);
								user.save(function(err, user) {
									user.password = '';
									res.status(200).json({
										user: user,
									});
								});
							}
						});
					} else {
						res.status(400).json({
							message: "Error occured: " + err
						});
					}
				});
			}
		});
	})
	.delete(parseToken, function(req, res) {
		jwt.verify(req.token, process.env.JWT_SECRET, function(err, decoded) {
			if(err || decoded.userId != req.query.cardPath.split('/')[0]) {
				res.status(400).json({
					message: "错误token"
				});
			} else {
				User.findById(decoded.id, function(err, user) {
					if(user) {
						Card.findOneAndRemove({
							cardPath: req.query.cardPath
						}, function(err, card) {
							if(err) {
								res.status(400).json({
									message: "没有该文档"
								});
							} else {
								var path = "./public/uploads/" + req.query.cardPath + ".html";
								if(fs.existsSync(path)) {
									fs.unlinkSync(path);
								}
								for(var i = 0; i < user.cards.length; i++) {
									if(user.cards[i] == req.query.cardPath) {
										user.cards.splice(i, 1);
									}
								}
								Lottery.findOneAndRemove({
									path: req.query.cardPath
								}, function(err, lottery) {});
								user.save(function(err, user) {
									user.password = '';
									res.status(200).json({
										user: user,
									});
								});
							}
						});
					} else {
						res.status(400).json({
							message: "Error occured: " + err
						});
					}
				});
			}
		});
	})
	.put(parseToken, function(req, res) {
		jwt.verify(req.token, process.env.JWT_SECRET, function(err, decoded) {
			if(err || decoded.userId != req.body.cardPath.split('/')[0]) {
				res.status(400).json({
					message: "错误token"
				});
			} else {
				Card.findOne({
					cardPath: req.body.cardPath
				}, function(err, card) {
					if(err) {
						res.status(400).json({
							message: "Error occured: " + err
						});
					} else {
						var newCard = new Card(req.body);
						var upsertData = newCard.toObject();
						delete upsertData._id;
						Card.update({
							_id: card._id
						}, upsertData, {
							upsert: true
						}, function(err) {
							if(err) {
								res.status(400).json({
									message: "Error occured: " + err
								});
							} else {
								res.status(200).json({
									data: "保存成功",
								});
							}
						});
					}
				});
			}
		});
	});

app.get('/card/:cardName', parseToken, function(req, res) {
	jwt.verify(req.token, process.env.JWT_SECRET, function(err, decoded) {
		if(err) {
			res.status(400).json({
				message: "错误token"
			});
		} else {
			var cardPath = decoded.userId + '/' + req.params.cardName;
			Card.findOne({
				cardPath: cardPath
			}, function(err, card) {
				if(err || !card) {
					res.status(400).json({
						message: "错误文件名"
					});
				} else {
					res.status(200).json({
						card: card
					});
				}
			});
		}
	});
});

app.get('/lottery', function(req, res) {
	Lottery.findOne({
		path: req.query.path
	}, function(err, lottery) {
		if(err || !lottery) {
			res.status(200).json({
				type: false,
				message: "错误请求"
			});
		} else {
			for(var i = 0; i < lottery.customers.length; i++) {
				if(req.query.phone == lottery.customers[i].phone) {
					if((Date.now() - lottery.customers[i].time) < 1000 * 60 * 60 * 24) {
						res.status(200).json({
							type: false,
							message: "该活动一个手机号24小时内只能抽奖一次"
						});
						return;
					} else {
						lottery.customers.splice(i, 1);
					}
					break;
				}
			}
			var lottos = lottery.lottos;
			var ranNum = Math.random() * 100;
			var temp = 100;
			var i = lottos.length-1;
			for(; i >= 0; i--) {
				temp -= lottos[i].percent;
				if(ranNum > temp) {
					break;
				}
			}
			if (i < 0) {
				i = lottos.length-1;
			}
			lottery.customers.push({
				phone: req.query.phone,
				lotto: lottos[i].name,
				time: Date.now()
			});
			lottery.save(function(err, lottery) {
				if(err || !lottery) {
					res.status(200).json({
						type: false,
						message: "网络不佳，请稍后重试"
					});
				} else {
					res.status(200).json({
						type: true,
						lotto: lottos[lottos.length - 1],
						mark: lottery.lottoMark
					});
				}
			});
		}
	});
});

app.post('/lottery', parseToken, function(req, res) {
	jwt.verify(req.token, process.env.JWT_SECRET, function(err, decoded) {
		if(err) {
			res.status(400).json({
				message: "错误token"
			});
			return;
		} else {
			var path = decoded.userId + '/' + req.body.path;
			req.body.path = path;
			Lottery.findOne({
				path: path
			}, function(err, lottery) {
				if(err) {
					res.status(400).json({
						message: "错误token"
					});
					return;
				} else {
					if(lottery) {
						var newLottery = new Lottery(req.body);
						var upsertData = newLottery.toObject();
						delete upsertData._id;
						Lottery.update({
							_id: lottery._id
						}, upsertData, {
							upsert: true
						}, function(err) {
							if(err) {
								res.status(400).json({
									message: "Error occured: " + err
								});
								return;
							} else {
								res.status(200).json({
									message: "保存成功",
								});
								return;
							}
						});
					} else {
						var lottery = new Lottery(req.body);
						lottery.save(function(err, lottery) {
							res.status(200).json({
								message: "保存成功"
							});
							return;
						});
					}
				}
			});
		}
	});
});

app.post('/finish2', parseToken, function(req, res, next) {
	jwt.verify(req.token, process.env.JWT_SECRET, function(err, decoded) {
		if(err) {
			res.status(400).json({
				message: "错误token"
			});
		} else {
			var owner = decoded.userId;
			var cardName = req.body.cardName;
			var out = "<html>" +
				"<head>" +
				"<meta http-equiv=\"refresh\" content=\"0, url=http://www.mymicrocard.com/uploads/" + owner + "/1.html\"" + 
				"</head>" +
				"<body>" +
				"</body>" +
				"</html>";
			var path = "./public/uploads/" + owner + "/" + cardName + ".html";
			var buffer = new Buffer(out);
			if(fs.existsSync(path)) {
				fs.unlinkSync(path);
			}
			fs.open(path, 'w+', function(err, fd) {
				if(err) {
					res.status(400).json({
						data: "Error occured: " + err
					});
				} else {
					fs.write(fd, buffer, 0, buffer.length, null, function(err) {
						if(err) {
							res.status(400).json({
								data: "Error occured: " + err
							});
						} else {
							fs.close(fd, function() {
								res.status(200).json({
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

app.post('/finish1', parseToken, function(req, res, next) {
	jwt.verify(req.token, process.env.JWT_SECRET, function(err, decoded) {
		if(err) {
			res.status(400).json({
				message: "错误token"
			});
		} else {
			var owner = decoded.userId;
			var cardName = req.body.cardName;
			var personName = req.body.personName;
			var content = req.body.content;
			var head = "<html>" +
				"<head>" +
				"<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">" +
				"<meta name=\"viewport\", initial-scale=1.0, maximum-scale=1.0, user-scalable=no\">" +
				"<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">" +
				"<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black\">" +
				"<meta name=\"viewport\" content=\"width=device-width, minimum-scale=1, maximum-scale=1,user-scalable=no\">" +
				"<meta name=\"format-detection\" content=\"telephone=no\">" +
				"<title>" + personName + "的微名片</title>" +
				"<link href=\"/stylesheets/main.css\" rel=\"stylesheet\">" +
				"</head>" +
				"<body>" +
				"<div>";
			var tail = "</div>" +
				"<script src=\"http://apps.bdimg.com/libs/jquery/2.1.4/jquery.min.js\"></script>" +
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
					res.status(400).json({
						data: "Error occured: " + err
					});
				} else {
					fs.write(fd, buffer, 0, buffer.length, null, function(err) {
						if(err) {
							res.status(400).json({
								data: "Error occured: " + err
							});
						} else {
							fs.close(fd, function() {
								res.status(200).json({
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
	if(uptoken) {
		res.json({
			uptoken: uptoken
		});
	}
});

/*删除七牛云上面没有使用的图片*/
app.post('/delete/files', parseToken, function(req, res, next) {
	jwt.verify(req.token, process.env.JWT_SECRET, function(err, decoded) {
		if(err) {
			res.status(400).json({
				message: "错误token"
			});
		} else {
			var pre = decoded.userId + '/' + req.body.cardName;
			var options = {
				limit: 50,
				prefix: pre
			};
			bucketManager.listPrefix(bucket, options, function(err, respBody, respInfo) {
				if(err) {
					res.status(400).json({
						message: "Error occured: " + err
					});
				} else {
					var temp = new Array();
					var items = respBody.items;
					var keys = new Array();
					items.forEach(function(item) {
						keys.push(item.key);
					});
					var imgs = req.body.upImages;
					for(var i = 0; i < imgs.length; i++) {
						imgs[i] = pre + '/' + imgs[i];
					}
					for(var i = 0; i < keys.length; i++) {
						if(imgs.indexOf(keys[i]) == -1) {
							temp.push(keys[i]);
						}
					}
					var deleteOperations = new Array();
					temp.forEach(function(item) {
						deleteOperations.push(qiniu.rs.deleteOp(bucket, item));
					});
					bucketManager.batch(deleteOperations, function(err, respBody, respInfo) {
						if(err) {
							res.status(400).json({
								message: "Error occured: " + err
							});
						} else {
							if(parseInt(respInfo.statusCode / 100) == 2) {
								respBody.forEach(function(item) {
									if(item.code == 200) {
									} else {
									}
								});
								res.status(200).json({
									data: respBody
								});
							} else {
								res.status(400).json({
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
function parseToken(req, res, next) {
	var token;
	var tokenHeader = req.headers["authorization"];
	if(typeof tokenHeader !== 'undefined') {
		var tokenName = tokenHeader.split(" ");
		token = tokenName[1];
		req.token = token;
		next();
	} else {
		res.status(403).json({
			message: '获取token错误'
		});
	}
}

process.on('uncaughtException', function(err) {
	console.log(err);
});

// Start Server
app.listen(port, function() {
	console.log("Express server listening on port " + port);
});