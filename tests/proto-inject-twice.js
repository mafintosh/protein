var protein = require('../index');
var assert = require('assert');

var fn1 = protein().fn('response.hello', function() {
	return 'hello'
});
var fn2 = protein().fn('response.world', function() {
	return 'world';
});

var req = {};
var res = {};
var complete = false;

fn1(req, res, function() {
	fn2(req, res, function() {
		assert.equal(res.hello(), 'hello');
		assert.equal(res.world(), 'world');
		complete = true;
	});
});
assert.ok(complete);