var http = require('http');

var PROTOS = {
	request: http.IncomingMessage.prototype,
	response: http.ServerResponse.prototype
};
var NAMES = Object.keys(PROTOS);

var noop = function() {};
var extend = function(to, from) {
	if (!from) return to;

	Object.keys(from).forEach(function(key) {
		if (key in to) return;

		var getter = from.__lookupGetter__(key);
		var setter = from.__lookupSetter__(key);

		if (getter) return to.__defineGetter__(key, getter);
		if (setter) return to.__defineSetter__(key, setter);

		to[key] = from[key];
	});

	return to;
};
var shorthand = function(proto, name, fn) {
	name = name.split('.');

	if (name.length !== 2) return proto;
	if (!PROTOS[name[0]]) return proto;

	fn(proto[name[0]], name[1]);
	return proto;
};
var protein = function(parent) {
	parent = parent || {};

	var stack = [];
	var reduce = function(request, response, callback) {
		var i = 0;
		var loop = function(err) {
			var next = stack[i++];

			if (!next) return (callback || noop)(err);
			if (err && next.length < 4) return loop(err);
			if (next.length >= 4) return next(err, request, response, loop);

			next(request, response, loop);
		};

		// set request prototype
		request.response = response;
		request.__proto__ = reduce.request;

		// set response prototype
		response.request = request;
		response.__proto__ = reduce.response;

		// bootstrap the loop
		loop();
	};

	NAMES.forEach(function(name) {
		reduce[name] = {};
		reduce[name].__proto__ = parent[name] || PROTOS[name];
	});

	reduce.using = function(fn) {
		return stack.indexOf(fn) > -1;
	};
	reduce.use = function(fn, options) {
		if (!fn) return reduce;
		if (Array.isArray(fn)) {
			fn.forEach(reduce.use);
			return reduce;
		}
		if (typeof fn === 'function') {
			stack.push(fn);
		}
		if (!options || options.extend !== false) {
			extend(reduce.request, fn.request);
			extend(reduce.response, fn.response);
		};
		return reduce;
	};
	reduce.fn = function(name, fn) {
		return shorthand(reduce, name, function(proto, method) {
			proto[method] = fn;
		});
	};
	reduce.getter = function(name, fn) {
		return shorthand(reduce, name, function(proto, getter) {
			proto.__defineGetter__(getter, fn);
		});
	};
	reduce.setter = function(name, fn) {
		return shorthand(reduce, name, function(proto, setter) {
			proto.__defineSetter__(setter, fn);
		});
	};
	reduce.listen = function() {
		var server = http.createServer(reduce);

		return server.listen.apply(server, arguments);
	};
	return reduce;
};

require('fs').readdirSync(__dirname+'/middleware').forEach(function(name) {
	protein[name.replace(/\.js$/i, '')] = require('./middleware/'+name);
});

module.exports = protein;
