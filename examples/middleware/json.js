var protos = {response: {}};

protos.response.json = function(data) {
	this.setHeader('Content-Type', 'application/json');
	this.end(JSON.stringify(data));
};

module.exports = protos;
