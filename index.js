var http = require('http');

var PROTOS = {request: http.IncomingMessage.prototype, response: http.ServerResponse.prototype};
var NAMES = Object.keys(PROTOS);

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
var onerror = function(err, req, res) {
	if (err) {
		console.error(err.stack);
		res.writeHead(500, {'Content-Type': 'text/plain'});
		res.end(err.stack+'\n');
		return;
	}
	res.writeHead(404);
	res.end();
};
var protein = function(parent) {
	parent = parent || {};

	var stack = [];
	var reduce = function(req, res, callback) {
		var i = 0;
		var url = req.url;
		var loop = function(err) {
			var next = stack[i++];
			var route = next && next.route;

			req.url = url;

			if (!next) return (callback || onerror)(err, req, res);
			if (route && req.url.substr(0, route.length) === route) {
				req.url = req.url.substr(route.length);
			}

			try {
				if (err && next.length < 4) return loop(err);
				if (next.length >= 4) return next(err, req, res, loop);
				next(req, res, loop);
			} catch (err) {
				loop(err);
			}
		};

		// set request prototype
		req.response = res;
		req.__proto__ = reduce.request;

		// set response prototype
		res.request = req;
		res.__proto__ = reduce.response;

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
	reduce.use = function(route, fn, options) {
		if (typeof route !== 'string') {
			options = fn;
			fn = route;
			route = null;
		}
		if (!fn) return reduce;
		if (Array.isArray(fn)) {
			fn.forEach(reduce.use);
			return reduce;
		}
		if (typeof fn === 'function') {
			fn.route = route && route.replace(/\/$/, '')+'/';
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

module.exports = protein;
