var mongoose = require('mongoose');
var CardSchema = mongoose.Schema({
	cardPath: {type: String, required: true, unique: true},
	password: {type: String, required: true},
	createdAt: {type: Date, default: Date.now},
	personName: String,
	personPhone: String,
	personTitle: String,
	personImage: String,
	companyName: String,
	companyPhone: String,
	companyAddress: String,
	wechat: String,
	QQ: String,
	bgColor: String,
	menuColor: String,
	music: String,
	topHtml: String,
	botHtml: String,
	other: String,
});

var Card = mongoose.model('Card', CardSchema);


module.exports = Card;