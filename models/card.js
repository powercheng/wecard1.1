var mongoose = require('mongoose');
var CardSchema = mongoose.Schema({
	cardPath: {type: String, required: true, unique: true},
	password: {type: String, required: true},
	createdAt: {type: Date, default: Date.now},
	personName: Object,
	personPhone: Object,
	personTitle: Object,
	personImage: Object,
	companyName: Object,
	companyPhone: Object,
	companyAddress: Object,
	wechat: Object,
	QQ: Object,
	template: String,
	bgColor: String,
	menuColor: String,
	music: String,
	topHtml: String,
	botHtml: String,
	other: Array,
});

var Card = mongoose.model('Card', CardSchema);


module.exports = Card;