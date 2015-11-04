//     	MMP Video Uebung 2.3
// 		Leonie Wismeth, Betty van Aken

var greyscale = function (r, g, b){
		return 0.3 * r + 0.6 * g + 0.1 * b;
};

// from http://stackoverflow.com/questions/21264648/javascript-convert-yuv-to-rgb
var rgbYuV = function (r, g, b){
		var yuv = {y: 0,u: 0, v:0};
		
		//Luminance
		yuv.y = r * 0.299 + g * 0.587 + b * 0.114;
		
		//Chrominance
		yuv.u = (b - yuv.y) * 0.564;
        yuv.v = (r - yuv.y) * 0.713;
        
        return yuv;
};

var processor = {
            
    // computeFrame
    // do the image processing for one frame
    // reads frame data from rgb picture ctx
    // writes chroma key pictures to ctx1..3
    
    computeFrame: function () {

        // get the context of the canvas 1
        var ctx = this.ctx1;

        // draw current video frame to ctx
        ctx.drawImage(this.video, 0, 0, this.width - 1, this.height);

        // get frame RGB data bytes from context ctx 
        var frame = {};
        var length = 0;
        try {
            frame = ctx.getImageData(0, 0, this.width, this.height);
            length = (frame.data.length) / 4;
        } catch (e) {
            // catch and display error of getImageData fails
            this.browserError(e);
        }


        // do the color key:
        // do the image processing
        // read in pixel data to r,g,b, key, write back
		for (var i = 0; i < indices.length; i++) {
			var r = frame.data[i * 4 + 0];
            var g = frame.data[i * 4 + 1];
            var b = frame.data[i * 4 + 2];
            
            //das stimmt noch nicht..
            r = r * 0.299 + g * 0.587 + b * 0.114;
			//Chrominance
			g = (b - r) * 0.564;
			b = (r - r) * 0.713;
            
            frame.data[i * 4 + 0] = r;
            frame.data[i * 4 + 1] = g;
            frame.data[i * 4 + 2] = b;  

         }  
        // write back to 3 canvas objects
        this.ctx1.putImageData(frame, 0, 0);
        return; 
    },

    timerCallback: function () {
        if (this.error) {
            alert("Error happened - processor stopped.");
            return;
        }

        // call the computeFrame function to do the image processing
        this.computeFrame();

        // call this function again after a certain time
        // (40 ms = 1/25 s)
        var timeoutMilliseconds = 40;
        var self = this;
        setTimeout(function () {
            self.timerCallback();
        }, timeoutMilliseconds);
    },


    // doLoad: needs to be called on load
    doLoad: function () {

        this.error = 0;

        // check for a compatible browser
        if (!this.browserChecked)
            this.browserCheck();

        try {

            // get the html <video> and <canvas> elements 
            this.video = document.getElementById("video");

            this.c1 = document.getElementById("difference-canvas");
            // get the 2d drawing context of the canvas
            this.ctx1 = this.c1.getContext("2d");


            // show video width and height to log
            this.log("Found video: size " + this.video.videoWidth + "x" + this.video.videoHeight);

            // scale the video display 
            this.video.width = this.video.videoWidth / 2;
            this.video.height = this.video.videoWidth / 2;

            // scaling factor for resulting canvas
            var factor = 2;
            w = this.video.videoWidth / factor;
            h = this.video.videoHeight / factor;

            if (!w || !this.video) {
                alert("No Video Object Found?");
            }
            this.ctx1.width = w;
            this.ctx1.height = h;
            this.c1.width = w ;
            this.c1.height = h;
            this.width = w;
            this.height = h;

        } catch (e) {
            // catch and display error
            alert("Erro: " + e);
            return;
        }

        // start the timer callback to draw frames
        this.timerCallback();

    },

    // helper function: isCanvasSupported()
    // check if HTML5 canvas is available
    isCanvasSupported: function () {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    },

    // log(text)
    // display text in log area or console
    log: function (text) {
        var logArea = document.getElementById("log");
        if (logArea) {
            logArea.innerHTML += text + "<br>";
        }
        if (typeof console != "undefined") {
            console.log(text);
        }
    },

    // helper function: browserError()
    // displays an error message for incorrect browser settings
    browserError: function (e) {

        this.error = 1;

        //chrome security for local file operations
        if (isChrome)
            alert("Security Error\r\n - Call chrome with --allow-file-access-from-files\r\n\r\n" + e);
        else if (isFirefox)
            alert("Security Error\r\n - Open Firefox config (about: config) and set the value\r\nsecurity.fileuri.strict_origin_policy = false ");
        else
            alert("Error in getImageData " + e);
    },

    //helper function to check for browser compatibility
    browserCheck: function () {
        if (!this.isCanvasSupported()) {
            alert("No HTML5 canvas - use a newer browser please.");
            return false;
        }
        // check for local file access
        //if(location.host.length>1)
        //    return;
        this.browserChecked = true;
        return true;
    },
    browserChecked: false,
    error: 0
};

// Returns an array with length == 64.
// Contains indices at which pixeldata should be
// fetched from imagedata of the whole canvas.
var calculateIndices = function (xInput, yInput, videoWidth, blockSize) {
	var indices = [];
	for (var i = 1; i <= blockSize; i++) {
		var line = ((yInput + i - 1) * videoWidth) + 1;
		for (var j = 0; j < blockSize; j++) {
			var index = line + xInput + j;
			indices.push(index);
		}
	}
	return indices;
};

// returns luminance from 'imageData' for all desired 'indices'.
// 'indices' contains the indices of the desired pixels
// 'imageData' contains the data of a whole image
var getLuminanceFromOrig = function (indices, imageData) {
	var result;
	if (imageData.length > indices.length) {
		result = [];

		for (var i = 0; i < indices.length; i++) {
			var newR = imageData[indices[i] * 4 + 0];
			var newG = imageData[indices[i] * 4 + 1];
			var newB = imageData[indices[i] * 4 + 2];
			var yuv = rgbToYuv(newR, newG, newB);

			result.push(yuv.y);
		}

	} else {
		console.error('"getLuminanceFromOrig": Fehler!');
	}
	return result;
};
// imageA contains the data of the previous image
// imageB contains the data of the current image
var diffImage = function (imageA, imageB, depth, same, diff) {
	var length = imageB.data.length / 4;
	var result = {
		image: imageB,
		cut: false
	};
	var checkSameDiff = (same && diff) ? true : false;

	for (var i = 0; i < length; i++) {
		var r = imageB.data[i * 4 + 0];
		var g = imageB.data[i * 4 + 1];
		var b = imageB.data[i * 4 + 2];

		var prevR = imageA.data[i * 4 + 0];
		var prevG = imageA.data[i * 4 + 1];
		var prevB = imageA.data[i * 4 + 2];

		// Math.abs() returns the absolute value of a number.
		var diffR = Math.abs(r - prevR);
		var diffG = Math.abs(g - prevG);
		var diffB = Math.abs(b - prevB);

		// 'diffAll' contains the absolute sum of each colorchannel.
		var diffAll = Math.abs(greyscale(diffR, diffG, diffB));

		if (diffAll < depth) {
			result.image.data[i * 4 + 0] = 128;
			result.image.data[i * 4 + 1] = 128;
			result.image.data[i * 4 + 2] = 128;
			if (checkSameDiff) {
				same++;
			}
		} else {
			// 'diffAll' might also be replaced with zeros to get
			// a black Pixel for each difference.
			result.image.data[i * 4 + 0] = diffAll;
			result.image.data[i * 4 + 1] = diffAll;
			result.image.data[i * 4 + 2] = diffAll;
			if (checkSameDiff) {
				diff++;
			}
		}
	}

	if (checkSameDiff && diff > same) {
		result.cut = true;
	}

	return result;
};  