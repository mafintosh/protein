var protos = {request: {}};

protos.request.__defineGetter__('query', function() {
	return this._query || (this._query = require('url').parse(this.url, true).query);
});

module.exports = protos;