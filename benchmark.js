var protein = require('protein');
var url = require('url');

var m = 30;

var server = protein() // the protein server
	.getter('query', function() {
		return this._query || (this._query = url.parse(this.url, true).query);
	})
	.use(function(req, res) {
		res.end('hello world');
	});

for (var i =0 ; i < m; i++) {
	server.fn('response.time'+i, function() {
		this.end(''+Date.now());
	})
}

server.listen(8888);

var http = require('http');

http.createServer(function(req, res) { // baseline
	res.end('hello world');
}).listen(8889);

http.createServer(function(req, res) { // old-fashioned connect method populating
	for ( var i = 0; i < m; i++) {
		res['time'+i] = function() {
			this.end(''+Date.now());
		};
	}
	req.query = url.parse(req.url, true).query;
	res.end('hello world');
}).listen(8890);
