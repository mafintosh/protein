var protein = require('protein');

protein()
	.use(protein.log)
	.use(protein.json)
	.fn('response.time', function() {
		this.json({time:Date.now()});
	})
	.use(function(req, res) {
		res.time();
	})
	.listen(8888);