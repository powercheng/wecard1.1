var bcrypt = require("bcryptjs");
var mongoose = require("mongoose");

var UserSchema = mongoose.Schema({
	username: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	createdAt: { type: Date, default: Date.now},
});

UserSchema.pre("save", function(done) {
	var user = this;
	if (!user.isModified("password")) {
		return done();
	}

	bcrypt.genSalt(10, (err, salt) => {
		bcrypt.hash(user.password, salt, (err, hash) => {
			if(err){
				return done(err);
			}
			user.password = hash;
			done();
		});
	});
});

UserSchema.methods.checkPassword = function(guess, pwd, done) {
	bcrypt.compare(guess, pwd, function(err, isMatch) {
		done(err, isMatch);
	});
};

/*UserSchema.methods.name = function() {
	return this.displayName || this.username;
};*/

var User = mongoose.model('User', UserSchema);
module.exports = User;

