var protein = require('../index');
var assert = require('assert');

var protos1 = {request: {}};
var protos2 = {request: {}, response: {}};

protos1.request.hello = function() {};
protos2.response.world = function() {};

var complete = false;
var fn = protein()
	.use(function(req, res) {
		complete = true;
		assert.ok(req.hello === protos1.request.hello);
		assert.ok(res.world === protos2.response.world);
	})
	.use(protos1)
	.use(protos2);

fn({}, {});
assert.ok(complete);