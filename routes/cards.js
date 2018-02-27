var express = require('express');
var router = express.Router();
var Card = require('../models/card');

router.get('/', function(req, res, next) {
	Card.find(function(err, cards) {
		if(err) {
			next(err);
		} else {
			res.json(cards);
		}
	});
});

/*router.get('/', function(req, res, next) {
	Card.find({},"phone",function(err, cards) {
		if(err) {
			next(err);
		} else {
			res.json(cards);
		}
	});
});*/

router.get('/:id', function(req, res, next) {
	Card.findById(req.params.id, function(err, card) {
		if(err) {
			next(err);
		} else {
			res.json(card);
		}
	});
});

router.delete('/:id', function(req, res, next) {
	Card.findByIdAndRemove(req.params.id, function(err, card) {
		if (err) {
			next(new Error('找不到该名片'));
		} else {
			res.json(card);
		}
	});
});

router.put('/', function(req, res, next) {
	var data = req.body;
	Card.updateCard(data, function(err) {
		if(err) {
			next(err);
		} else {
			res.send("保存成功");
		}
	});
});

router.post('/', function(req, res, next) {
	var newCard = new Card({
		cardName: req.body.cardName,
		name: req.body.name,
		companyName: req.body.companyName,
		personInfos: req.body.personInfos,
		companyInfos: req.body.companyInfos,
		otherInfos: req.body.otherInfos,
		bgColor: req.body.bgColor,
		menuColor: req.body.menuColor,
		baiduAddress: req.body.baiduAddress,
		wCode: req.body.wCode,
		qCode: req.body.qCode,
		music: req.body.music,
		pImage: req.body.pImage
	});
	// Create Card
	newCard.save(function(err) {
		if(err) {
			next(err);
		} else {
			res.send("创建成功");
		}
	});
});

module.exports = router;
