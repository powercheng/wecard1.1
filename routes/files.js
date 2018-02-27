var express = require('express');
var router = express.Router();
var fs = require("fs");
var multer = require('multer');
var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		var path = './public/uploads/' + req.body.phone;
		console.log(path);
		if(!fs.existsSync(path)) {
			fs.mkdirSync(path);
		}
		cb(null, path); // 保存的路径，备注：需要自己创建
	},
	filename: function(req, file, cb) {
		cb(null, file.originalname);
	}
});
var upload = multer({
	storage: storage
});


router.post('/', upload.array("uploadFiles", 12), function(req, res, next) {
	res.send({
		message: 'File uploaded successfully',
		filename: req.files[0].originalname
	});
});

router.get('/:phone', function(req, res, next) {
	var phone = req.params.phone;
	if(typeof phone != "undefined") {
		var path = "./public/uploads/" + phone;
		if(!fs.existsSync(path)) {
			res.send({
				status: "0",
				data: '没有文件',
			});
		} else {
			var files = fs.readdirSync(path);
			res.send({
				status: "1",
				data: files
			});
		}
	} else {
		res.send({
			status: "0",
			data: "请输入电话号码",
		});
	}
});

router.delete('/:phone', function(req, res, next) {
	var phone = req.params.phone;
	var fileName = req.query.fileName;
	if(phone != null) {
		try {
			path = "./public/uploads/" + phone + "/" + fileName;
			console.log(path);
			fs.unlinkSync(path);
			res.send({
				status: "success",
				message: "成功删除"
			});
		} catch(err) {
			res.send({
				status: 'error',
				message: "删除失败"
			});
		}
	} else {
		res.send({
			status: 'error',
			message: "请输入电话号码"
		});
	}
});

router.post('/finish', function(req, res, next) {
	console.log("post card/finsh");
	var name = req.body.name;
	var cardName = req.body.cardName;
	var content = req.body.content;
	var head = "<html>" +
	"<head>" +
	"<meta http-equiv=\"Content-Type\" content=\"text/html; charset=UTF-8\">" +
	"<meta name=\"viewport\", initial-scale=1.0, maximum-scale=1.0, user-scalable=no\">" +
	"<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">" +
	"<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black\">" +
	"<meta name=\"viewport\" content=\"width=device-width, minimum-scale=1, maximum-scale=2,user-scalable=no\">"+
	"<meta name=\"format-detection\" content=\"telephone=no\">" + 
	"<title>" + name + "的微名片</title>" +
	"<link href=\"/stylesheets/main.css\" rel=\"stylesheet\">" +
	"</head>" +
	"<body>" + 
	"<div>";
	var tail = "</div>" +
	"<script src=\"/javascripts/main.js\"></script>" + 
	"</body>" +
	"</html>";
	var out = head + content + tail;
	var path = "./public/uploads/" + cardName + ".html";
	var buffer = new Buffer(out);
	if(fs.existsSync(path)) {
		fs.unlinkSync(path);
	}
	fs.open(path, 'w+', function(err, fd) {
		if(err) {
			next(error);
		} else {
			fs.write(fd, buffer, 0, buffer.length, null, function(err) {
				if(err) {
					res.send({
						status: "error"
					});
				} else {
					fs.close(fd, function() {
						res.send({
							status: "success"
						});
						console.log('file written');
					});
				}
			});
		}
	});
});

module.exports = router;