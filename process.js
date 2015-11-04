// MMP Uebung 2.1
// Betty van Aken, Leonie Wismeth
// Based on:
// HTML5 Example: Color Filter
// (c) 2011-13
// Jgen Lohr, lohr@beuth-hochschule.de
// Oliver Lietz, lietz@nanocosmos.de
// v1.4, May.2013

var isFirefox = /Firefox/.test(navigator.userAgent);
var isChrome = /Chrome/.test(navigator.userAgent);

var config = {
    prevFrame: []
};


var processor = {
    
    // imageA contains the data of the previous image
    // imageB contains the data of the current image
    compareFrames: function(imageA, imageB) {
   	 
    	var length = imageB.data.length / 4;
   	 
    	var result = {
    	diffY: 255,
    	cut: false
    	};

    	for (var i = 0; i < length; i++) {

        	var r = imageB.data[i * 4 + 0];
        	var g = imageB.data[i * 4 + 1];
        	var b = imageB.data[i * 4 + 2];
       	 
        	//var yValue = this.getYValue(r,g,b);
    
        	var prevR = imageA.data[i * 4 + 0];
        	var prevG = imageA.data[i * 4 + 1];
        	var prevB = imageA.data[i * 4 + 2];
       	 
        	var diffR = Math.abs(r - prevR);
        	var diffG = Math.abs(g - prevG);
        	var diffB = Math.abs(b - prevB);
       	 
        	//var prevYValue = this.getYValue(prevR,prevG,prevB);
    
        	var totalY = this.getYValue(diffR,diffG,diffB);
       	 
        	// Math.abs() returns the absolute value of a number.
        	result.diffY = Math.abs(totalY);
      	 
    
        	if (result.diffY > 255) {
            	result.diffY = 255;
        	}
       	 
    	}

    	return result;
    
	},
    
    test: function(test) {
   	 
   	 var result = {
   	 diffY: 100,
   	 cut: false
   	 };
   	 
   	 return result;
    },
    
    getYValue: function(r,g,b) {
   	 	var y = 0.3 * r + 0.59 * g + 0.11 * b;
   	 	return y;
   	 },

	// computeFrame
	// do the image processing for one frame
	// reads frame data from rgb picture ctx
	// writes chroma key pictures to ctx1..3
	computeFrame: function() {

    // get the context of the canvas 1
    	var ctx = this.ctx1;

    // draw current video frame to ctx
    	ctx.drawImage(this.video, 0, 0, this.width - 1, this.height);
   	 
    // get frame RGB data bytes from context ctx
    	var frame={};

    var length=0;
    
    	try {
   		 frame = ctx.getImageData(0, 0, this.width, this.height);
   	 length = (frame.data.length) / 4;
    	} catch(e) {
   		 // catch and display error of getImageData fails
   		 this.browserError(e);
    	}
   	 
    	// do the image processing
		 // read in pixel data to r,g,b, key, write back
		 
		 if(config.prevFrame.data){

		 var diff = this.compareFrames(config.prevFrame,frame).diffY;

			 
    	for (var i = 0; i < length; i++) {
   					 
   	 	frame.data[i * 4 + 0] = diff;
   	 	frame.data[i * 4 + 1] = diff;
   	 	frame.data[i * 4 + 2] = diff;
   		 
    	}
   	}

    // write frame back to context of canvas object
    	this.ctx1.putImageData(frame, 0, 0);
   	 
    	config.prevFrame = frame;
   	 
    	return;
	},

    getTimestamp: function() { return new Date().getTime(); },

    // timerCallback function - is called every couple of milliseconds to do the calculation
	timerCallback: function() {
        	if(this.error) {
            	alert("Error happened - processor stopped.");
            	return;
        	}

   		 // call the computeFrame function to do the image processing
        	this.computeFrame();
   		 
   		 // call this function again after a certain time
   		 // (40 ms = 1/25 s)
   		 var timeoutMilliseconds = 40;
   		 var self = this;
        	setTimeout(function() {
            	self.timerCallback();
        	}, timeoutMilliseconds);
	},

    
	// doLoad: needs to be called on load
	doLoad: function() {

    	this.error = 0;
    
   	 // init high precision timer if available
   	 if (window.performance.now) {
   		 console.log("Using high performance timer");
   		 getTimestamp = function() { return window.performance.now(); };
   	 } else {
   		 if (window.performance.webkitNow) {
   			 console.log("Using webkit high performance timer");
   			 getTimestamp = function() { return window.performance.webkitNow(); };
   		 }
   	 }

   	 // check for a compatible browser
    	if(!this.browserChecked)
        	this.browserCheck();
   		 
   	 try {
   	 
   		 // get the html <video> and <canvas> elements
   		 this.video = document.getElementById("video");
   		 this.c1 = document.getElementById("c1");
   		 // get the 2d drawing context of the canvas
   		 this.ctx1 = this.c1.getContext("2d");

   		 // show video width and height to log
   		 this.log("Found video: size "+this.video.videoWidth+"x"+this.video.videoHeight);
   					 
   		 // scale the video display
   		 this.video.width = this.video.videoWidth/2;
   		 this.video.height = this.video.videoWidth/2;
   		 
   		 // scaling factor for resulting canvas
   		 var factor = 1;
   		 
   		 // set width and height of canvas object
   		 this.width = this.video.width / factor;
   		 this.height = this.video.height / factor;

   		 this.ctx1.width = this.width;
   		 this.ctx1.height = this.height;
   		 this.c1.width = this.width + 1;
   		 this.c1.height = this.height;
   		 
   	 } catch(e) {
   		 // catch and display error
   		 alert("Erro: " + e);
   		 return;
   	 }
   	 
   	 // start the timer callback to draw frames
    	this.timerCallback();
   			 
	},
    
    // helper function: isCanvasSupported()
    // check if HTML5 canvas is available
	isCanvasSupported: function(){
    	var elem = document.createElement('canvas');
    	return !!(elem.getContext && elem.getContext('2d'));
	},
    
    // log(text)
    // display text in log area or console
    log: function(text) {
   	 var logArea = document.getElementById("log");
   	 if(logArea) {
   		 logArea.innerHTML += text + "<br>";
   	 }
   	 if(typeof console != "undefined") {
   		 console.log(text);
   	 }
    },

    // helper function: browserError()
    // displays an error message for incorrect browser settings
	browserError: function(e) {
    
    	this.error = 1;
   	 
    	//chrome security for local file operations
    	if(isChrome)
        	alert("Security Error\r\n - Call chrome with --allow-file-access-from-files\r\n\r\n"+e);
    	else if(isFirefox)
        	alert("Security Error\r\n - Open Firefox config (about: config) and set the value\r\nsecurity.fileuri.strict_origin_policy = false ");
    	else
        	alert("Error in getImageData "+ e);    
	},
    
	//helper function to check for browser compatibility
	browserCheck: function() {
   	 if(!this.isCanvasSupported()) {
   		 alert("No HTML5 canvas - use a newer browser please.");
   		 return false;
   	 }   	 
    	// check for local file access
    	//if(location.host.length>1)
    	//	return;      	 
    	this.browserChecked = true;
    	return true;
	},
	browserChecked: false,
	error: 0
};



