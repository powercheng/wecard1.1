var mongoose = require('mongoose');
var CustomerSchema = mongoose.Schema({
	phone: String
	lottos: Array
	timestamps: true
});

var Customer = mongoose.model('Customer', CustomerSchema);
module.exports = Customer;