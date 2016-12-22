var User=require('../models/user');
var Chat=require('../models/chat');
var config = require('../../config');
var secretKey = config.secretKey;
var jsonwebtoken = require('jsonwebtoken');

function createToken(user) {
	var token = jsonwebtoken.sign({
		id: user._id,
		name: user.name,
		username: user.username
	}, secretKey, {
		expiresIn:60*60*24
	});
	return token;
}


module.exports=function(app, express){

	var api=express.Router();

	api.post('/signup', function(req, res) {

		var user = new User({
			name: req.body.name,
			username: req.body.username,
			password: req.body.password
		});
		var token = createToken(user);
		user.save(function(err) {
			if(err) {
				res.send(err);
				return;
			}
			res.json({ 
				success: true,
				message: 'User has been created!',
				token: token
			});
		});
	});

	api.post('/login', function(req, res) {

		User.findOne({ username: req.body.username },'name username password',function(err, user) {

			if(err) throw err;

			if(!user) {

				res.send({ message: "User doenst exist"});
			} else if(user){ 

				var validPassword = user.comparePassword(req.body.password);

				if(!validPassword) {
					res.send({ message: "Invalid Password"});
				} else {
					var token = createToken(user);
					res.json({
						success: true,
						message: "Successfuly login!",
						token: token
					});
				}
			}
		});
	});

	api.use(function(req, res, next) {

		console.log("Somebody just came to our app!");

		var token = req.body.token || req.param('token') || req.headers['x-access-token'];
		if(token) {

			jsonwebtoken.verify(token, secretKey, function(err, decoded) {

				if(err) {
					res.status(403).send({ success: false, message: "Failed to authenticate user"});

				} else {
					//
					req.decoded = decoded;
					next();
				}
			});
		} else {
			res.status(403).send({ success: false, message: "No Token Provided"});
		}
	});
	api.get('/allchat',function(req,res) {
			Chat.find({}, function(err,chats) {
				if(err) {
					res.send(err);
					return;
				}
				res.send(chats);
			});
	});
	
	api.get('/me', function(req, res) {
		res.send(req.decoded);
	});

	return api
}