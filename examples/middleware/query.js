var url = require('url');

var protos = {request: {}};

protos.request.__defineGetter__('query', function() {
	return this._query || (this._query = url.parse(this.url, true).query);
});

module.exports = protos;