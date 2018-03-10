var express = require('express');
var User = require('../models/user.js');
var Card = require('../models/card.js');
var passport = require("passport");
var LocalStrategy = require('passport-local').Strategy;
var router = express.Router();
var fs = require("fs");
var multer = require('multer');
var storage = multer.diskStorage({
	destination: function(req, file, cb) {
		var path = './public/uploads/';
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
var server = 'localhost';
var port = 80;

router.post('/upload', upload.single('wangEditorH5File'), function(req, res, next) {
	res.writeHead(200, {
		'Content-type': 'text/html'
	});
	res.end(req.file.path);
});


router.use(function(req, res, next) {
	console.log("i am the first one use");
	res.locals.currentUser = req.user;
	res.locals.errors = req.flash("error");
	res.locals.infos = req.flash("info");
	next();
});

/*测试用*/
/*router.get('/users', function(req,res,next) {
	User.find(function(err, users) {
		if(err) {
			next(err);
		} else {
			res.json(users);
		}
	});
})

router.post('/users', function(req, res, next) {
	var newUser = new User({
		username: req.body.username,
		password: req.body.password,
		cards: req.body.cards
	});
	// Create Card
	newUser.save(function(err) {
		if(err) {
			next(err);
		} else {
			res.send("创建成功");
		}
	});
});*/
/*测试用*/

router.get("/", ensureAuthenticated, function(req, res, next) {
	res.locals.cards = JSON.parse(res.locals.currentUser.cards);
	res.render("cards");
});

router.get("/update", ensureAuthenticated, function(req, res, next) {
	if (req.query.name != req.user.username) {
		res.redirect('/login');
	} else {
		
		res.redirect('/signup');
	}
});



router.get("/signup", function(req, res) {
	res.render("signup");
});

router.post("/signup", function(req, res, next) {
	var username = req.body.username;
	var password = req.body.password;
	User.findOne({ username: username }, function(err, user) {
		if (err) { return next(err); }
		if (user) {
			req.flash("error", "User already exists");
			return res.redirect("/signup");
		}
		var newUser = new User({
			username: username,
			password: password
		});
		console.log(newUser);
		newUser.save(next);
	});
}, passport.authenticate("login", {
	successRedirect: "/",
	failureRedirect: "/signup",
	failureFlash: true
}));

router.get("/login", function(req, res) {
	console.log("router get /login");
	res.render("login");
});

router.post("/login", passport.authenticate("login", {
	successRedirect: "/",
	failureRedirect: "/login",
	failureFlash: true
}));

/*router.get("/users", ensureAuthenticated, function(req,res) {
	console.log(req.user);
	User.findOne({username: req.user.username}, function(err, user) {
		if (err) { return next(err); }
		if (!user) { return next(404); }
		console.log(user);
		res.render("profile", { user: user });
	});
	res.render('index');
});*/

router.get("/logout", function(req, res) {
	req.logout();
	res.redirect("/login");
});

/*router.get("/users/:username", function(req, res, next) {
	User.findOne({ username: req.params.username }, function(err, user) {
		if (err) { return next(err); }
		if (!user) { return next(404); }
		res.render("profile", { user: user });
	});
});*/

/*router.get("/edit", ensureAuthenticated, function(req, res) {
	res.render("edit");
});*/

/*router.post("/edit", ensureAuthenticated, function(req, res, next) {
	req.user.displayName = req.body.displayname;
	req.user.bio = req.body.bio;
	req.user.save(function(err) {
		if (err) {
			next(err);
			return;
		}
		req.flash("info", "Profile updated!");
		res.redirect("/edit");
	});
});*/

passport.use("login", new LocalStrategy(
	function(username, password, done) {
		User.findOne({ username: username }, function(err, user) {
			if (err) { return done(err); }
			if (!user) {
				return done(null, false,
					{ message: "该用户不存在" });
			}
			user.checkPassword(password, user.password, function(err, isMatch) {
				if (err) { return done(err); }
				if (isMatch) {
					return done(null, user);
				} else {
					return done(null, false,{ message: "密码错误" });
				}
			});
		});
	}));

passport.serializeUser((user, done) => {
	console.log("passport serializeUser");
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
		done(err, user);
	});
});

function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		console.log("ensureAuthenticated")
		next();
	} else {
		req.flash("info", "请先登录");
		res.redirect("/login");
	}
}

module.exports = router;