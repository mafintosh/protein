# Protein

Protein is [Connect](https://github.com/senchalabs/connect) compatible middleware with support for prototype methods, getters and setters.

It's available through npm:

	npm install protein

# Example

``` js
var protein = require('protein');
var url = require('url');

var fn = protein()
	.getter('request.query', function() {
		return this._query || (this._query = url.parse(request.url, true).query);
	})
	.fn('response.sendQuery', functoin() {
		this.end(JSON.stringify(request.query));
	})
	.use(function() {
		// this method is the only one which is run on every request
		response.end('hello world');
	});

require('http').createServer(fn).listen(8080);
```

# Wat?

If we rewrite the above example using [Connect](https://github.com/senchalabs/connect) it would look like.

``` js
var connect = require('connect');
var url = require('url');

var fn = connect()
	.use(function(request, response, next) {
		request.query = url.parse(request.url, true).query;
		next();
	})
	.use(function(request, response, next) {
		response.sendQuery = function() {
			response.end(JSON.stringify(request.query));
		};
		next();
	})
	.use(function() {
		response.end('hello world');
	});

require('http').createServer(fn).listen(8080);
```

But if we look closer at the above example we are actually parsing the query on every request even though we never use it.  
Wouldn't it be nicer to just parse when we access it?

Using Protein we can just define a getter on the middleware prototype:

``` js
var fn = protein()
	.getter('request.query', function() {
		return this._query || (this._query = url.parse(request.url, true).query);
	})
	.use( ... )
```

Now when we access request.query the first time the query will be parsed and in all other cases no parsing happens.  
Notice Protein is actually defining the getter on the middleware prototype for us so the is actually only defined once - *NOT* every request.

Similary we could just define `sendQuery` on the middleware prototype instead of defining it on every request:

``` js
var fn = protein()
	.getter('request.query', function() {
		return this._query || (this._query = url.parse(request.url, true).query);
	})
	.fn('response.sendQuery', functoin() {
		this.end(JSON.stringify(request.query));
	})
	.use( ... )
```

Note that we are only expanding the middleware prototype and not the prototype from the `http` module so their should be zero side effects.
The final program just looks like this:

``` js
var protein = require('protein');
var url = require('url');

var fn = protein()
	.getter('request.query', function() {
		return this._query || (this._query = url.parse(request.url, true).query);
	})
	.fn('response.sendQuery', functoin() {
		this.end(JSON.stringify(request.query));
	})
	.use(function() {
		// this method is the only one which is run on every request
		response.end('hello world');
	});

require('http').createServer(fn).listen(8080);
```

# Reusing middleware

If you want to create middleware that can be reused in other places and which expands the middleware prototype you can use the following format:

``` js
var random = function(request, response, next) {
	request.random = Math.random();
};

random.response = {}; // the collection of middleware response prototype methods
random.response.random = function() {
	this.end(''+this.request.random); // we can access the request from the response using this.request	
};

protein().use(random).use(function(request, response) {
	response.random(); // should return a random number
});
```

If we dont want to run a function on every request but instead want to just expand the prototypes we can just declare a map:

``` js
var random = {request: {}, response: {}};

random.request.__defineGetter__('random', function() {
	return Math.random();
});
random.response.random = function() {
	this.end(''+this.request.random);
};

protein().use(random).use(function(request, response) {
	response.random(); // should return a random number
});
```

For more examples on how to create your own reusable middleware see the [included middleware](https://github.com/mafintosh/Protein/tree/master/middleware).
To use the included middleware simply do:

``` js
protein().use(protein.query).use(function(request, response) {
	response.end(JSON.stringify(request.query));
});
```

The others include `protein.json`, `protein.log` and `protein.form`

# Connect compatability

All Connect modules should be compatable with Protein. To make a Protein module compatible with Connect you first need wrap it:

``` js
var connectable = protein().use(myProteinMiddleware);

connect.use(connectable);
```

# License

(The MIT License)

Copyright (c) 2012 Mathias Buus Madsen <mathiasbuus@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.