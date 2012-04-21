var protein = require('../index');
var assert = require('assert');

var hello = function() {};
var world = function() {};

var complete = false;
var fn = protein()
	.fn('request.hello', hello)
	.fn('response.world', world)
	.use(function(req, res) {
		complete = true;
		assert.ok(req.hello === hello);
		assert.ok(res.world === world);
	});

fn({}, {});
assert.ok(complete);