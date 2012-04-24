var protein = require('../index');
var assert = require('assert');

var complete = 0;
var fn = protein()
	.use(function(req, res, next) {
		complete++;
		assert.equal(complete, 1);
		next();
	})
	.use(function(req, res, next) {
		complete++;
		assert.equal(complete, 2);
		process.nextTick(function() {
			next();
		});
	})
	.use(function(err, req, res, next) {
		complete++;
		assert.equal(err, null);
		next();
	})
	.use(function(req, res) {
		assert.equal(complete++, 3);
	});

fn({}, {}, function(err) {
	throw err;
});

process.nextTick(function() {
	assert.equal(complete, 4);
});