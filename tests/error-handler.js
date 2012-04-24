var protein = require('../index');
var assert = require('assert');

var complete = false;
var fn = protein()
	.use(function(req, res, next) {
		throw new Error('lol');
	})
	.use(function(req, res, next) {
		assert.ok(false);
	});

fn({}, {}, function(err) {
	assert.equal(err && err.message, 'lol');
	complete = true;
});
assert.ok(complete);