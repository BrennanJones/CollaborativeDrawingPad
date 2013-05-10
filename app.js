/**
 *
 * app.js
 * Main server-side JavaScript/NodeJS code
 *
 * Written by Brennan Jones
 * Based off code by Martin Angelov (http://tutorialzine.com/2012/08/nodejs-drawing-game/)
 *
 * Last modified: 10 May 2013
 *
 */


var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
	static = require('node-static');

var fileServer = new static.Server('./');

app.listen(8080);

// If the URL of the server is opened in a browser.
function handler(request, response) {
	request.addListener('end', function() {
		fileServer.serve(request, response);
	});
}

io.set('log level', 1);

var drawnPaths = {};
var numPaths = 0;

io.sockets.on('connection', function(socket) {
	// Send all previously drawn paths to new client.
	for (var i = 0; i < numPaths; i++) {
		socket.emit('moving', drawnPaths[i]);
	}
	
	// Start listening for mouse move events.
	socket.on('mousemove', function(data) {
		// Broadcast message to all except originating client.
		socket.broadcast.emit('moving', data);
		
		// Save drawn path.
		drawnPaths[numPaths] = data;
		numPaths++;
	});
	
	socket.on('clear', function(data) {
		// Broadcast message to all except originating client.
		socket.broadcast.emit('clear', data);
		
		// Delete all drawn paths.
		drawnPaths = {};
		numPaths = 0;
	});
});
