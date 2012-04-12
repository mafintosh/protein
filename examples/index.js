var protein = require('protein');

protein()
	.use(require('./middleware/json'))
	.use(require('./middleware/query'))
	.fn('response.echo', function() {
		this.json({time: Date.now(), query: this.request.query});
	})
	.use(function(req, res) {
		res.echo();
	})
	.listen(8888);

console.log('visit http://localhost:8888/?foo=bar');