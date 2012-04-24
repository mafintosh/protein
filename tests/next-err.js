var protein = require('../index');
var assert = require('assert');

var complete = false;
var fn = protein()
	.use(function(req, res, next) {
		next(new Error('lol'));
	})
	.use(function(err, req, res, next) {
		assert.equal(err.message, 'lol');
		complete = true;
	});

fn({}, {}, function(err) {
	throw err;
});
assert.ok(complete);