var bcrypt = require("bcryptjs");
var mongoose = require("mongoose");
var AutoIncrement = require('mongoose-sequence')(mongoose);
var UserSchema = mongoose.Schema({
	username: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	cards: Array,
});

UserSchema.plugin(AutoIncrement, {
	inc_field: 'id'
});

UserSchema.pre("save", function(done) {
	var user = this;
	if(!user.isModified("password")) {
		return done();
	} else {
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user.password, salt, (err, hash) => {
				if(err) {
					return res.status(400).send({
						message: err
					});
				}
				user.password = hash;
				done();
			});
		});
	}
});

UserSchema.methods.checkPassword = function(guess, pwd, callback) {
	bcrypt.compare(guess, pwd, function(err, isMatch) {
		callback(err, isMatch);
	});
};

module.exports = mongoose.model('User', UserSchema);