var mongoose = require('mongoose');
var CardSchema = mongoose.Schema({
	cardName: String,
	createdAt: {type: Date, default: Date.now},
	name: String,
	companyName: String,
	personInfos: String,
	companyInfos: String,
	otherInfos: String,
	bgColor: String,
	menuColor: String,
	baiduAddress: String,
	wCode: String,
	qCode: String,
	music: String,
	pImage: String
});

var Card = mongoose.model('Card', CardSchema);

Card.updateCard = function(data, callback) {
	var cardName = data.cardName;
	var query = {
		cardName: cardName
	};
	Card.findOne(query, function(err, card) {
		if(err) {
			return next(err);
		} else {
			card.cardName = cardName;
			card.name = data.name;
			card.companyName = data.companyName;
			card.personInfos = data.personInfos;
			card.companyInfos = data.companyInfos;
			card.otherInfos = data.otherInfos;
			card.bgColor = data.bgColor;
			card.menuColor = data.menuColor;
			card.baiduAddress = data.baiduAddress;
			card.wCode = data.wCode;
			card.qCode = data.qCode;
			card.music = data.music;
			card.pImage = data.pImage;			
			card.save(callback);
		}
	});
}

module.exports = Card;