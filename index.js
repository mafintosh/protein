var clone = function(from, to) {
	if (!from) return;

	to = to || {};
	Object.keys(from).forEach(function(key) {
		var getter = from.__lookupGetter__(key);
		var setter = from.__lookupSetter__(key);

		if (getter) return to.__defineGetter__(key, getter);
		if (setter) return to.__defineSetter__(key, setter);

		to[key] = from[key];
	});
	return to;
};
var injector = function() {
	var hash = [];
	var protos = [];
	var empty;
	var inject = function(obj) {
		if (empty === undefined) {
			empty = !Object.keys(inject.proto).length;
		}
		if (empty) return;

		var i = hash.indexOf(obj.__proto__);

		if (i === -1) {
			i = protos.indexOf(obj.__proto__);
		}
		if (i === -1) {
			protos[protos.push(clone(inject.proto))-1].__proto__ = obj.__proto__;
			i = hash.push(obj.__proto__)-1;
		}
		obj.__proto__ = protos[i];
	};

	inject.proto = {};
	return inject;
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
var protein = function() {
	var stack = [];
	var onrequest = injector();
	var onresponse = injector();

	var shorthand = function(define) {
		return function(name, fn) {
			define(reduce[name.split('.')[0]], name.split('.').pop(), fn);
			return reduce;
		};
	};
	var reduce = function(req, res, callback) {
		var i = 0;
		var url = req.url;
		var loop = function(err) {
			var next = stack[i++];
			var route = next && next.route;

			req.url = url;
			if (!next) return (callback || onerror)(err, req, res);
			if (route) {
				if (url.substr(0, route.length) !== route) return loop(err);
				req.url = url.substr(route.length) || '/';
				if (req.url[0] === '?') req.url = '/'+req.url;
				if (req.url[0] !== '/') return loop(err);
			}
			try {
				if (err && next.length < 4) return loop(err);
				if (next.length >= 4) return next(err, req, res, loop);
				next(req, res, loop);
			} catch (err) {
				loop(err);
			}
		};

		// set the callback
		req.next = res.next = loop;

		// set request prototype
		req.response = res;
		onrequest(req);

		// set response prototype
		res.request = req;
		onresponse(res);

		// bootstrap the loop
		loop();
	};

	reduce.request = onrequest.proto;
	reduce.response = onresponse.proto;

	reduce.getter = shorthand(function(proto, name, fn) {
		proto.__defineGetter__(name, fn);
	});
	reduce.setter = shorthand(function(proto, name, fn) {
		proto.__defineSetter__(name, fn);
	});
	reduce.fn = shorthand(function(proto, name, fn) {
		proto[name] = fn;
	});

	reduce.using = function(fn) {
		return stack.indexOf(fn) > -1;
	};
	reduce.use = function(route, fn) {
		if (!fn) {
			fn = route;
			route = null;
		}
		if (!fn) return reduce;
		if (Array.isArray(fn)) {
			fn.forEach(reduce.use.bind(reduce, route));
			return reduce;
		}
		if (typeof fn === 'function') {
			fn.route = route && route.replace(/\/$/, ''); // FIXME: bug here if fn is reused :(
			stack.push(fn);
		}
		clone(fn.request, reduce.request);
		clone(fn.response, reduce.response);
		return reduce;
	};
	return reduce;
};

module.exports = protein;