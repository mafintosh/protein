var protein = require('../index');
var assert = require('assert');

var URL = '/myurl/more';
var complete = false;

var fn = protein()
	.use(function(req, res, next) {
		assert.equal(req.url, URL);
		next();
	})
	.use('/', function(req, res, next) {
		assert.equal(req.url, URL);
		next();
	})
	.use('/myurl', function(req, res, next) {
		assert.equal(req.url, '/more');
		next();
	})
	.use(function(req, res, next) {
		assert.equal(req.url, URL);
		next();
	})
	.use('/myurl', function(req, res, next) {
		assert.equal(req.url, '/more');
		process.nextTick(function() {
			next();
		});
	})
	.use(function(req, res, next) {
		assert.equal(req.url, URL);
		next();
	})
	.use('/notmyurl', function(req, res, next) {
		assert.ok(false);
	})
	.use(function(req, res, next) {
		assert.equal(req.url, URL);
		next();
	})
	.use('/myurl/', function(req, res, next) {
		assert.equal(req.url, '/more');
		next();
	})
	.use('/myurl/more', function(req, res, next) {
		assert.equal(req.url, '/');
		next();
	})
	.use(function(req, res) {
		complete = true;
		assert.equal(req.url, URL);
	});

fn({url:URL}, {}, function(err) {
	throw err;
});

process.nextTick(function() {
	assert.ok(complete);
});