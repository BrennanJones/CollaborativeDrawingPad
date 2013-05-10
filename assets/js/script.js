/**
 *
 * script.js
 * Main client-side JavaScript code
 *
 * Written by Brennan Jones
 * Based off code by Martin Angelov (http://tutorialzine.com/2012/08/nodejs-drawing-game/)
 *
 * Last modified: 10 May 2013
 *
 */


$(function() {
	if (!('getContext' in document.createElement('canvas'))) {
		alert("Your browser does not support this app.");
		return false;
	}
	
	/* NOTE: Change this to the server's IP address / domain name and any port number you'd like. */
	// var url = "http://10.11.78.44:8080";
	var url = "localhost:8080";
	
	var canvasWidth = 1024;
	var canvasHeight = 768;
	
	var doc = $(document),
	    win = $(window),
		canvas = $('#drawingPad'),
		ctx = canvas[0].getContext('2d');
	
	var thicknessSlider = $('#thicknessSlider'),
	    clearButton = $('#clearButton'),
		blackPalette = $('#blackPalette'),
		yellowPalette = $('#yellowPalette'),
		brownPalette = $('#brownPalette'),
		redPalette = $('#redPalette'),
		violetPalette = $('#violetPalette'),
		bluePalette = $('#bluePalette'),
		greenPalette = $('#greenPalette'),
		currentColourIndicator = $('#currentColourIndicator');
	
	var id = Math.round($.now()*Math.random());
	
	var drawing = false;
	
	var colour = 'black';
	
	var clients = {};
	var cursors = {};
	
	var socket = io.connect(url);
	
	socket.on('moving', function(data) {
		if (!(data.id in clients)) {
			// A new user is online. Create a cursor for the new user.
			cursors[data.id] = $('<div class="cursor">').appendTo('#cursors');
		}
		
		var pageCoords = canvasCoordsToPageCoords(data.x, data.y);
		
		// Move the mouse pointer.
		cursors[data.id].css({
			'left' : pageCoords.x,
			'top' : pageCoords.y
		});
		
		// Is the user drawing?
		if (data.drawing && clients[data.id]) {
			
			// Draw a line on the canvas. clients[data.id] holds
			// the previous position of this user's mouse pointer.
			
			drawLine(clients[data.id].x, clients[data.id].y, data.x, data.y, data.colour, data.thickness);
		}
		
		// Save the current client state.
		clients[data.id] = data;
		clients[data.id].updated = $.now();
	});
	
	socket.on('clear', function(data) {
		// Clear canvas.
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
	});
	
	var prev = {};
	
	canvas.on('mousedown', function(e) {
		e.preventDefault();
		drawing = true;
		var canvasCoords = pageCoordsToCanvasCoords(e.pageX, e.pageY);
		prev.x = canvasCoords.x;
		prev.y = canvasCoords.y;
	});
	
	doc.bind('mouseup mouseleave touchend', function() {
		drawing = false;
	});
	
	var lastEmit = $.now();
	
	canvas.on('mousemove', function(e) {
		thickness = thicknessSlider.val();
		var canvasCoords = pageCoordsToCanvasCoords(e.pageX, e.pageY);
				
		if($.now() - lastEmit > 30) {
			socket.emit('mousemove', {
				'x': canvasCoords.x,
				'y': canvasCoords.y,
				'drawing': drawing,
				'id': id,
				'colour': colour,
				'thickness': thickness
			});
			lastEmit = $.now();
		}
		
		// Draw a line for the current user's movement, as it is
		// not received in the socket.on('moving') event above.
		
		if (drawing) {
			drawLine(prev.x, prev.y, canvasCoords.x, canvasCoords.y, colour, thickness);
			
			prev.x = canvasCoords.x;
			prev.y = canvasCoords.y;
		}
	});
	
	clearButton.on('click', function() {		
		// Clear canvas.
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);
		
		// Send clear message to server.
		socket.emit('clear', {});
	});
	
	blackPalette.on('click', function() {
		changeColour('black');
	});
	
	yellowPalette.on('click', function() {
		changeColour('yellow');
	});
	
	brownPalette.on('click', function() {
		changeColour('brown');
	});
	
	redPalette.on('click', function() {
		changeColour('red');
	});
	
	violetPalette.on('click', function() {
		changeColour('violet');
	});
	
	bluePalette.on('click', function() {
		changeColour('blue');
	});
	
	greenPalette.on('click', function() {
		changeColour('green');
	});
	
	// Remove inactive clients after 5 minutes of inactivity.
	setInterval(function() {
		for (ident in clients) {
			if ($.now() - clients[ident].updated > 300000) {
				cursors[ident].remove();
				delete clients[ident];
				delete cursors[ident];
			}
		}
	}, 300000);
	
	function drawLine(fromX, fromY, toX, toY, colour, thickness) {
		ctx.beginPath();
		ctx.lineWidth = thickness;
		ctx.moveTo(fromX, fromY);
		ctx.lineTo(toX, toY);
		ctx.strokeStyle = colour;
		ctx.stroke();
	}
	
	function pageCoordsToCanvasCoords(pageX, pageY) {
		return {
			x: pageX * ( canvasWidth / win.width() ),
			y: pageY * ( canvasHeight / (win.height() * 0.94) )
		};
	}
	
	function canvasCoordsToPageCoords(canvasX, canvasY) {
		return {
			x: canvasX * ( win.width() / canvasWidth ),
			y: canvasY * ( (win.height() * 0.94) / canvasHeight )
		};
	}
	
	function changeColour(newColour) {
		colour = newColour;
		var indicatorCtx = currentColourIndicator[0].getContext('2d');
		indicatorCtx.fillStyle = newColour;
		indicatorCtx.fillRect(0,0,25,25);
	}
});