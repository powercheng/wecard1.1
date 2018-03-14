var mongoose = require('mongoose');
var LotterySchema = mongoose.Schema({
	path: {type: String, required: true, unique: true},
	lottos: Array,
	lottoMark: String,
	customers: Array
});

var Lottery = mongoose.model('Lottery', LotterySchema);
module.exports = Lottery;