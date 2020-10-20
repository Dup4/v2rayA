
/*
   Copyright 2011 Lazar Laszlo (lazarsoft@gmail.com, www.lazarsoft.info)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/


var qrcode = {};
qrcode.imagedata = null;
qrcode.width = 0;
qrcode.height = 0;
qrcode.qrCodeSymbol = null;
qrcode.debug = false;
qrcode.maxImgSize = 1024*1024;

qrcode.callback = null;

qrcode.vidSuccess = function (stream)
{
	qrcode.localstream = stream;
	if(qrcode.webkit)
		qrcode.video.src = window.webkitURL.createObjectURL(stream);
	else
	if(qrcode.moz)
	{
		qrcode.video.mozSrcObject = stream;
		qrcode.video.play();
	}
	else
		qrcode.video.src = stream;

	qrcode.gUM=true;

	qrcode.canvas_qr2 = document.createElement('canvas');
	qrcode.canvas_qr2.id = "qr-canvas";
	qrcode.qrcontext2 = qrcode.canvas_qr2.getContext('2d');
	qrcode.canvas_qr2.width = qrcode.video.videoWidth;
	qrcode.canvas_qr2.height = qrcode.video.videoHeight;
	setTimeout(qrcode.captureToCanvas, 500);
}

qrcode.vidError = function(error)
{
	qrcode.gUM=false;
	return;
}

qrcode.captureToCanvas = function()
{
	if(qrcode.gUM)
	{
		try{
			if(qrcode.video.videoWidth == 0)
			{
				setTimeout(qrcode.captureToCanvas, 500);
				return;
			}
			else
			{
				qrcode.canvas_qr2.width = qrcode.video.videoWidth;
				qrcode.canvas_qr2.height = qrcode.video.videoHeight;
			}
			qrcode.qrcontext2.drawImage(qrcode.video,0,0);
			try{
				qrcode.decode();
			}
			catch(e){
				console.log(e);
				setTimeout(qrcode.captureToCanvas, 500);
			};
		}
		catch(e){
			console.log(e);
			setTimeout(qrcode.captureToCanvas, 500);
		};
	}
}

qrcode.setWebcam = function(videoId)
{
	var n=navigator;
	qrcode.video=document.getElementById(videoId);

	var options = true;
	if(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices)
	{
		try{
			navigator.mediaDevices.enumerateDevices()
				.then(function(devices) {
					devices.forEach(function(device) {
						console.log("deb1");
						if (device.kind === 'videoinput') {
							if(device.label.toLowerCase().search("back") >-1)
								options=[{'sourceId': device.deviceId}] ;
						}
						console.log(device.kind + ": " + device.label +
							" id = " + device.deviceId);
					});
				})

		}
		catch(e)
		{
			console.log(e);
		}
	}
	else{
		console.log("no navigator.mediaDevices.enumerateDevices" );
	}

	if(n.getUserMedia)
		n.getUserMedia({video: options, audio: false}, qrcode.vidSuccess, qrcode.vidError);
	else
	if(n.webkitGetUserMedia)
	{
		qrcode.webkit=true;
		n.webkitGetUserMedia({video:options, audio: false}, qrcode.vidSuccess, qrcode.vidError);
	}
	else
	if(n.mozGetUserMedia)
	{
		qrcode.moz=true;
		n.mozGetUserMedia({video: options, audio: false}, qrcode.vidSuccess, qrcode.vidError);
	}
}

qrcode.decode = function(src){

	if(arguments.length==0)
	{
		if(qrcode.canvas_qr2)
		{
			var canvas_qr = qrcode.canvas_qr2;
			var context = qrcode.qrcontext2;
		}
		else
		{
			var canvas_qr = document.getElementById("qr-canvas");
			var context = canvas_qr.getContext('2d');
		}
		qrcode.width = canvas_qr.width;
		qrcode.height = canvas_qr.height;
		qrcode.imagedata = context.getImageData(0, 0, qrcode.width, qrcode.height);
		qrcode.result = qrcode.process(context);
		if(qrcode.callback!=null)
			qrcode.callback(qrcode.result);
		return qrcode.result;
	}
	else
	{
		var image = new Image();
		image.crossOrigin = "Anonymous";
		image.onload=function(){
			//var canvas_qr = document.getElementById("qr-canvas");
			var canvas_out = document.getElementById("out-canvas");
			if(canvas_out!=null)
			{
				var outctx = canvas_out.getContext('2d');
				outctx.clearRect(0, 0, 320, 240);
				outctx.drawImage(image, 0, 0, 320, 240);
			}

			var canvas_qr = document.createElement('canvas');
			var context = canvas_qr.getContext('2d');
			var nheight = image.height;
			var nwidth = image.width;
			if(image.width*image.height>qrcode.maxImgSize)
			{
				var ir = image.width / image.height;
				nheight = Math.sqrt(qrcode.maxImgSize/ir);
				nwidth=ir*nheight;
			}

			canvas_qr.width = nwidth;
			canvas_qr.height = nheight;

			context.drawImage(image, 0, 0, canvas_qr.width, canvas_qr.height );
			qrcode.width = canvas_qr.width;
			qrcode.height = canvas_qr.height;
			try{
				qrcode.imagedata = context.getImageData(0, 0, canvas_qr.width, canvas_qr.height);
			}catch(e){
				qrcode.result = "Cross domain image reading not supported in your browser! Save it to your computer then drag and drop the file!";
				if(qrcode.callback!=null)
					qrcode.callback(qrcode.result);
				return;
			}

			try
			{
				qrcode.result = qrcode.process(context);
			}
			catch(e)
			{
				console.log(e);
				qrcode.result = "error decoding QR Code";
			}
			if(qrcode.callback!=null)
				qrcode.callback(qrcode.result);
		}
		image.onerror = function ()
		{
			if(qrcode.callback!=null)
				qrcode.callback("Failed to load the image");
		}
		image.src = src;
	}
}

qrcode.isUrl = function(s)
{
	var regexp = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
	return regexp.test(s);
}

qrcode.decode_url = function (s)
{
	var escaped = "";
	try{
		escaped = escape( s );
	}
	catch(e)
	{
		console.log(e);
		escaped = s;
	}
	var ret = "";
	try{
		ret = decodeURIComponent( escaped );
	}
	catch(e)
	{
		console.log(e);
		ret = escaped;
	}
	return ret;
}

qrcode.decode_utf8 = function ( s )
{
	if(qrcode.isUrl(s))
		return qrcode.decode_url(s);
	else
		return s;
}

qrcode.process = function(ctx){

	var start = new Date().getTime();

	var image = qrcode.grayScaleToBitmap(qrcode.grayscale());
	//var image = qrcode.binarize(128);

	if(qrcode.debug)
	{
		for (var y = 0; y < qrcode.height; y++)
		{
			for (var x = 0; x < qrcode.width; x++)
			{
				var point = (x * 4) + (y * qrcode.width * 4);
				qrcode.imagedata.data[point] = image[x+y*qrcode.width]?0:0;
				qrcode.imagedata.data[point+1] = image[x+y*qrcode.width]?0:0;
				qrcode.imagedata.data[point+2] = image[x+y*qrcode.width]?255:0;
			}
		}
		ctx.putImageData(qrcode.imagedata, 0, 0);
	}

	//var finderPatternInfo = new FinderPatternFinder().findFinderPattern(image);

	var detector = new Detector(image);

	var qRCodeMatrix = detector.detect();

	if(qrcode.debug)
	{
		for (var y = 0; y < qRCodeMatrix.bits.Height; y++)
		{
			for (var x = 0; x < qRCodeMatrix.bits.Width; x++)
			{
				var point = (x * 4*2) + (y*2 * qrcode.width * 4);
				qrcode.imagedata.data[point] = qRCodeMatrix.bits.get_Renamed(x,y)?0:0;
				qrcode.imagedata.data[point+1] = qRCodeMatrix.bits.get_Renamed(x,y)?0:0;
				qrcode.imagedata.data[point+2] = qRCodeMatrix.bits.get_Renamed(x,y)?255:0;
			}
		}
		ctx.putImageData(qrcode.imagedata, 0, 0);
	}


	var reader = Decoder.decode(qRCodeMatrix.bits);
	var data = reader.DataByte;
	return data
	var str="";
	for(var i=0;i<data.length;i++)
	{
		for(var j=0;j<data[i].length;j++)
			str+=String.fromCharCode(data[i][j]);
	}

	var end = new Date().getTime();
	var time = end - start;
	// console.log(time);

	alert("Time:" + time + " Code: "+str);
	return qrcode.decode_utf8(str);
}

qrcode.getPixel = function(x,y){
	if (qrcode.width < x) {
		throw "point error";
	}
	if (qrcode.height < y) {
		throw "point error";
	}
	var point = (x * 4) + (y * qrcode.width * 4);
	var p = (qrcode.imagedata.data[point]*33 + qrcode.imagedata.data[point + 1]*34 + qrcode.imagedata.data[point + 2]*33)/100;
	return p;
}

qrcode.binarize = function(th){
	var ret = new Array(qrcode.width*qrcode.height);
	for (var y = 0; y < qrcode.height; y++)
	{
		for (var x = 0; x < qrcode.width; x++)
		{
			var gray = qrcode.getPixel(x, y);

			ret[x+y*qrcode.width] = gray<=th?true:false;
		}
	}
	return ret;
}

qrcode.getMiddleBrightnessPerArea=function(image)
{
	var numSqrtArea = 4;
	//obtain middle brightness((min + max) / 2) per area
	var areaWidth = Math.floor(qrcode.width / numSqrtArea);
	var areaHeight = Math.floor(qrcode.height / numSqrtArea);
	var minmax = new Array(numSqrtArea);
	for (var i = 0; i < numSqrtArea; i++)
	{
		minmax[i] = new Array(numSqrtArea);
		for (var i2 = 0; i2 < numSqrtArea; i2++)
		{
			minmax[i][i2] = new Array(0,0);
		}
	}
	for (var ay = 0; ay < numSqrtArea; ay++)
	{
		for (var ax = 0; ax < numSqrtArea; ax++)
		{
			minmax[ax][ay][0] = 0xFF;
			for (var dy = 0; dy < areaHeight; dy++)
			{
				for (var dx = 0; dx < areaWidth; dx++)
				{
					var target = image[areaWidth * ax + dx+(areaHeight * ay + dy)*qrcode.width];
					if (target < minmax[ax][ay][0])
						minmax[ax][ay][0] = target;
					if (target > minmax[ax][ay][1])
						minmax[ax][ay][1] = target;
				}
			}
			//minmax[ax][ay][0] = (minmax[ax][ay][0] + minmax[ax][ay][1]) / 2;
		}
	}
	var middle = new Array(numSqrtArea);
	for (var i3 = 0; i3 < numSqrtArea; i3++)
	{
		middle[i3] = new Array(numSqrtArea);
	}
	for (var ay = 0; ay < numSqrtArea; ay++)
	{
		for (var ax = 0; ax < numSqrtArea; ax++)
		{
			middle[ax][ay] = Math.floor((minmax[ax][ay][0] + minmax[ax][ay][1]) / 2);
			//Console.out.print(middle[ax][ay] + ",");
		}
		//Console.out.println("");
	}
	//Console.out.println("");

	return middle;
}

qrcode.grayScaleToBitmap=function(grayScale)
{
	var middle = qrcode.getMiddleBrightnessPerArea(grayScale);
	var sqrtNumArea = middle.length;
	var areaWidth = Math.floor(qrcode.width / sqrtNumArea);
	var areaHeight = Math.floor(qrcode.height / sqrtNumArea);

	var buff = new ArrayBuffer(qrcode.width*qrcode.height);
	var bitmap = new Uint8Array(buff);

	//var bitmap = new Array(qrcode.height*qrcode.width);

	for (var ay = 0; ay < sqrtNumArea; ay++)
	{
		for (var ax = 0; ax < sqrtNumArea; ax++)
		{
			for (var dy = 0; dy < areaHeight; dy++)
			{
				for (var dx = 0; dx < areaWidth; dx++)
				{
					bitmap[areaWidth * ax + dx+ (areaHeight * ay + dy)*qrcode.width] = (grayScale[areaWidth * ax + dx+ (areaHeight * ay + dy)*qrcode.width] < middle[ax][ay])?true:false;
				}
			}
		}
	}
	return bitmap;
}

qrcode.grayscale = function()
{
	var buff = new ArrayBuffer(qrcode.width*qrcode.height);
	var ret = new Uint8Array(buff);
	//var ret = new Array(qrcode.width*qrcode.height);

	for (var y = 0; y < qrcode.height; y++)
	{
		for (var x = 0; x < qrcode.width; x++)
		{
			var gray = qrcode.getPixel(x, y);

			ret[x+y*qrcode.width] = gray;
		}
	}
	return ret;
}




function URShift( number,  bits)
{
	if (number >= 0)
		return number >> bits;
	else
		return (number >> bits) + (2 << ~bits);
}

/*
  Ported to JavaScript by Lazar Laszlo 2011 
  
  lazarsoft@gmail.com, www.lazarsoft.info
  
*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


function ReedSolomonDecoder(field)
{
	this.field = field;
	this.decode=function(received,  twoS)
	{
			var poly = new GF256Poly(this.field, received);
			var syndromeCoefficients = new Array(twoS);
			syndromeCoefficients.fill(0);
			var dataMatrix = false;//this.field.Equals(GF256.DATA_MATRIX_FIELD);
			var noError = true;
			for (var i = 0; i < twoS; ++i)
			{
				// Thanks to sanfordsquires for this fix:
				var evalu = poly.evaluateAt(this.field.exp(dataMatrix?i + 1:i));
				syndromeCoefficients[syndromeCoefficients.length - 1 - i] = evalu;
				if (evalu != 0)
				{
					noError = false;
				}
			}
			if (noError)
			{
				return ;
			}
			var syndrome = new GF256Poly(this.field, syndromeCoefficients);
			var sigmaOmega = this.runEuclideanAlgorithm(this.field.buildMonomial(twoS, 1), syndrome, twoS);
			var sigma = sigmaOmega[0];
			var omega = sigmaOmega[1];
			var errorLocations = this.findErrorLocations(sigma);
			var errorMagnitudes = this.findErrorMagnitudes(omega, errorLocations, dataMatrix);
			for (var i = 0; i < errorLocations.length; ++i)
			{
				var position = received.length - 1 - this.field.log(errorLocations[i]);
				if (position < 0)
				{
					throw "ReedSolomonException Bad error location";
				}
				received[position] = GF256.addOrSubtract(received[position], errorMagnitudes[i]);
			}
	}
	
	this.runEuclideanAlgorithm=function( a,  b,  R)
		{
			// Assume a's degree is >= b's
			if (a.Degree < b.Degree)
			{
				var temp = a;
				a = b;
				b = temp;
			}
			
			var rLast = a;
			var r = b;
			var sLast = this.field.One;
			var s = this.field.Zero;
			var tLast = this.field.Zero;
			var t = this.field.One;
			
			// Run Euclidean algorithm until r's degree is less than R/2
			while (r.Degree >= Math.floor(R / 2))
			{
				var rLastLast = rLast;
				var sLastLast = sLast;
				var tLastLast = tLast;
				rLast = r;
				sLast = s;
				tLast = t;
				
				// Divide rLastLast by rLast, with quotient in q and remainder in r
				if (rLast.Zero)
				{
					// Oops, Euclidean algorithm already terminated?
					throw "r_{i-1} was zero";
				}
				r = rLastLast;
				var q = this.field.Zero;
				var denominatorLeadingTerm = rLast.getCoefficient(rLast.Degree);
				var dltInverse = this.field.inverse(denominatorLeadingTerm);
				while (r.Degree >= rLast.Degree && !r.Zero)
				{
					var degreeDiff = r.Degree - rLast.Degree;
					var scale = this.field.multiply(r.getCoefficient(r.Degree), dltInverse);
					q = q.addOrSubtract(this.field.buildMonomial(degreeDiff, scale));
					r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
					//r.EXE();
				}
				
				s = q.multiply1(sLast).addOrSubtract(sLastLast);
				t = q.multiply1(tLast).addOrSubtract(tLastLast);
			}
			
			var sigmaTildeAtZero = t.getCoefficient(0);
			if (sigmaTildeAtZero == 0)
			{
				throw "ReedSolomonException sigmaTilde(0) was zero";
			}
			
			var inverse = this.field.inverse(sigmaTildeAtZero);
			var sigma = t.multiply2(inverse);
			var omega = r.multiply2(inverse);
			return new Array(sigma, omega);
		}
	this.findErrorLocations=function( errorLocator)
		{
			// This is a direct application of Chien's search
			var numErrors = errorLocator.Degree;
			if (numErrors == 1)
			{
				// shortcut
				return [errorLocator.getCoefficient(1)];
			}
			var result = new Array(numErrors);
			var e = 0;
			for (var i = 1; i < 256 && e < numErrors; ++i)
			{
				if (errorLocator.evaluateAt(i) == 0)
				{
					result[e] = this.field.inverse(i);
					++e;
				}
			}
			if (e != numErrors)
			{
				throw "Error locator degree does not match number of roots";
			}
			return result;
		}
	this.findErrorMagnitudes=function( errorEvaluator,  errorLocations,  dataMatrix)
		{
			// This is directly applying Forney's Formula
			var s = errorLocations.length;
			var result = new Array(s);
			for (var i = 0; i < s; ++i)
			{
				var xiInverse = this.field.inverse(errorLocations[i]);
				var denominator = 1;
				for (var j = 0; j < s; ++j)
				{
					if (i != j)
					{
						denominator = this.field.multiply(denominator, GF256.addOrSubtract(1, this.field.multiply(errorLocations[j], xiInverse)));
					}
				}
				result[i] = this.field.multiply(errorEvaluator.evaluateAt(xiInverse), this.field.inverse(denominator));
				// Thanks to sanfordsquires for this fix:
				if (dataMatrix)
				{
					result[i] = this.field.multiply(result[i], xiInverse);
				}
			}
			return result;
		}
}
/*
  Ported to JavaScript by Lazar Laszlo 2011 
  
  lazarsoft@gmail.com, www.lazarsoft.info
  
*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


function GF256Poly(field,  coefficients)
{
	if (coefficients == null || coefficients.length == 0)
	{
		throw "System.ArgumentException";
	}
	this.field = field;
	var coefficientsLength = coefficients.length;
	if (coefficientsLength > 1 && coefficients[0] == 0)
	{
		// Leading term must be non-zero for anything except the constant polynomial "0"
		var firstNonZero = 1;
		while (firstNonZero < coefficientsLength && coefficients[firstNonZero] == 0)
		{
			++firstNonZero;
		}
		if (firstNonZero == coefficientsLength)
		{
			this.coefficients = field.Zero.coefficients;
		}
		else
		{
			this.coefficients = new Array(coefficientsLength - firstNonZero);
			this.coefficients.fill(0);
			for(var ci=0;ci<this.coefficients.length;++ci)
				this.coefficients[ci]=coefficients[firstNonZero+ci];
		}
	}
	else
	{
		this.coefficients = coefficients;
	}
	
	this.__defineGetter__("Zero", function()
	{
		return this.coefficients[0] == 0;
	});
	this.__defineGetter__("Degree", function()
	{
		return this.coefficients.length - 1;
	});
	this.__defineGetter__("Coefficients", function()
	{
		return this.coefficients;
	});
	
	this.getCoefficient=function( degree)
	{
		return this.coefficients[this.coefficients.length - 1 - degree];
	}
	
	this.evaluateAt=function( a)
	{
		if (a == 0)
		{
			// Just return the x^0 coefficient
			return this.getCoefficient(0);
		}
		var size = this.coefficients.length;
		if (a == 1)
		{
			// Just the sum of the coefficients
			var result = 0;
			for (var i = 0; i < size; ++i)
			{
				result = GF256.addOrSubtract(result, this.coefficients[i]);
			}
			return result;
		}
		var result2 = this.coefficients[0];
		for (var i = 1; i < size; ++i)
		{
			result2 = GF256.addOrSubtract(this.field.multiply(a, result2), this.coefficients[i]);
		}
		return result2;
	}
	
	this.addOrSubtract=function( other)
		{
			if (this.field != other.field)
			{
				throw "GF256Polys do not have same GF256 field";
			}
			if (this.Zero)
			{
				return other;
			}
			if (other.Zero)
			{
				return this;
			}
			
			var smallerCoefficients = this.coefficients;
			var largerCoefficients = other.coefficients;
			if (smallerCoefficients.length > largerCoefficients.length)
			{
				var temp = smallerCoefficients;
				smallerCoefficients = largerCoefficients;
				largerCoefficients = temp;
			}
			var sumDiff = new Array(largerCoefficients.length);
			var lengthDiff = largerCoefficients.length - smallerCoefficients.length;
			// Copy high-order terms only found in higher-degree polynomial's coefficients
			//Array.Copy(largerCoefficients, 0, sumDiff, 0, lengthDiff);
			for(var ci=0;ci<lengthDiff;++ci)sumDiff[ci]=largerCoefficients[ci];
			
			for (var i = lengthDiff; i < largerCoefficients.length; ++i)
			{
				sumDiff[i] = GF256.addOrSubtract(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
			}
			
			return new GF256Poly(field, sumDiff);
	}
	this.multiply1=function( other)
		{
			if (this.field!=other.field)
			{
				throw "GF256Polys do not have same GF256 field";
			}
			if (this.Zero || other.Zero)
			{
				return this.field.Zero;
			}
			var aCoefficients = this.coefficients;
			var aLength = aCoefficients.length;
			var bCoefficients = other.coefficients;
			var bLength = bCoefficients.length;
			var product = new Array(aLength + bLength - 1);
			for (var i = 0; i < aLength; ++i)
			{
				var aCoeff = aCoefficients[i];
				for (var j = 0; j < bLength; ++j)
				{
					product[i + j] = GF256.addOrSubtract(product[i + j], this.field.multiply(aCoeff, bCoefficients[j]));
				}
			}
			return new GF256Poly(this.field, product);
		}
	this.multiply2=function( scalar)
		{
			if (scalar == 0)
			{
				return this.field.Zero;
			}
			if (scalar == 1)
			{
				return this;
			}
			var size = this.coefficients.length;
			var product = new Array(size);
			for (var i = 0; i < size; ++i)
			{
				product[i] = this.field.multiply(this.coefficients[i], scalar);
			}
			return new GF256Poly(this.field, product);
		}
	this.multiplyByMonomial=function( degree,  coefficient)
		{
			if (degree < 0)
			{
				throw "System.ArgumentException";
			}
			if (coefficient == 0)
			{
				return this.field.Zero;
			}
			var size = this.coefficients.length;
			var product = new Array(size + degree);
			product.fill(0);
			for (var i = 0; i < size; ++i)
			{
				product[i] = this.field.multiply(this.coefficients[i], coefficient);
			}
			return new GF256Poly(this.field, product);
		}
	this.divide=function( other)
		{
			if (this.field!=other.field)
			{
				throw "GF256Polys do not have same GF256 field";
			}
			if (other.Zero)
			{
				throw "Divide by 0";
			}
			
			var quotient = this.field.Zero;
			var remainder = this;
			
			var denominatorLeadingTerm = other.getCoefficient(other.Degree);
			var inverseDenominatorLeadingTerm = this.field.inverse(denominatorLeadingTerm);
			
			while (remainder.Degree >= other.Degree && !remainder.Zero)
			{
				var degreeDifference = remainder.Degree - other.Degree;
				var scale = this.field.multiply(remainder.getCoefficient(remainder.Degree), inverseDenominatorLeadingTerm);
				var term = other.multiplyByMonomial(degreeDifference, scale);
				var iterationQuotient = this.field.buildMonomial(degreeDifference, scale);
				quotient = quotient.addOrSubtract(iterationQuotient);
				remainder = remainder.addOrSubtract(term);
			}
			
			return [quotient, remainder];
		}
}
/*
  Ported to JavaScript by Lazar Laszlo 2011 
  
  lazarsoft@gmail.com, www.lazarsoft.info
  
*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


function DataBlock(numDataCodewords,  codewords)
{
	this.numDataCodewords = numDataCodewords;
	this.codewords = codewords;
	
	this.__defineGetter__("NumDataCodewords", function()
	{
		return this.numDataCodewords;
	});
	this.__defineGetter__("Codewords", function()
	{
		return this.codewords;
	});
}	
	
DataBlock.getDataBlocks=function(rawCodewords,  version,  ecLevel)
{
	
	if (rawCodewords.length != version.TotalCodewords)
	{
		throw "ArgumentException";
	}
	
	// Figure out the number and size of data blocks used by this version and
	// error correction level
	var ecBlocks = version.getECBlocksForLevel(ecLevel);
	
	// First count the total number of data blocks
	var totalBlocks = 0;
	var ecBlockArray = ecBlocks.getECBlocks();
	for (var i = 0; i < ecBlockArray.length; ++i)
	{
		totalBlocks += ecBlockArray[i].Count;
	}
	
	// Now establish DataBlocks of the appropriate size and number of data codewords
	var result = new Array(totalBlocks);
	var numResultBlocks = 0;
	for (var j = 0; j < ecBlockArray.length; ++j)
	{
		var ecBlock = ecBlockArray[j];
		for (var i = 0; i < ecBlock.Count; ++i)
		{
			var numDataCodewords = ecBlock.DataCodewords;
			var numBlockCodewords = ecBlocks.ECCodewordsPerBlock + numDataCodewords;
			result[numResultBlocks++] = new DataBlock(numDataCodewords, new Array(numBlockCodewords));
		}
	}
	
	// All blocks have the same amount of data, except that the last n
	// (where n may be 0) have 1 more byte. Figure out where these start.
	var shorterBlocksTotalCodewords = result[0].codewords.length;
	var longerBlocksStartAt = result.length - 1;
	while (longerBlocksStartAt >= 0)
	{
		var numCodewords = result[longerBlocksStartAt].codewords.length;
		if (numCodewords == shorterBlocksTotalCodewords)
		{
			break;
		}
		--longerBlocksStartAt;
	}
	++longerBlocksStartAt;
	
	var shorterBlocksNumDataCodewords = shorterBlocksTotalCodewords - ecBlocks.ECCodewordsPerBlock;
	// The last elements of result may be 1 element longer;
	// first fill out as many elements as all of them have
	var rawCodewordsOffset = 0;
	for (var i = 0; i < shorterBlocksNumDataCodewords; ++i)
	{
		for (var j = 0; j < numResultBlocks; ++j)
		{
			result[j].codewords[i] = rawCodewords[rawCodewordsOffset++];
		}
	}
	// Fill out the last data block in the longer ones
	for (var j = longerBlocksStartAt; j < numResultBlocks; ++j)
	{
		result[j].codewords[shorterBlocksNumDataCodewords] = rawCodewords[rawCodewordsOffset++];
	}
	// Now add in error correction blocks
	var max = result[0].codewords.length;
	for (var i = shorterBlocksNumDataCodewords; i < max; ++i)
	{
		for (var j = 0; j < numResultBlocks; ++j)
		{
			var iOffset = j < longerBlocksStartAt?i:i + 1;
			result[j].codewords[iOffset] = rawCodewords[rawCodewordsOffset++];
		}
	}
	return result;
}

/*
  Ported to JavaScript by Lazar Laszlo 2011 
  
  lazarsoft@gmail.com, www.lazarsoft.info
  
*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


function GF256( primitive)
{
	this.expTable = new Array(256);
	this.logTable = new Array(256);
	var x = 1;
	for (var i = 0; i < 256; ++i)
	{
		this.expTable[i] = x;
		x <<= 1; // x = x * 2; we're assuming the generator alpha is 2
		if (x >= 0x100)
		{
			x ^= primitive;
		}
	}
	for (var i = 0; i < 255; ++i)
	{
		this.logTable[this.expTable[i]] = i;
	}
	// logTable[0] == 0 but this should never be used
	this.zero = new GF256Poly(this, [[0]]);
	this.one = new GF256Poly(this, [[1]]);
	
	this.__defineGetter__("Zero", function()
	{
		return this.zero;
	});
	this.__defineGetter__("One", function()
	{
		return this.one;
	});
	this.buildMonomial=function( degree,  coefficient)
		{
			if (degree < 0)
			{
				throw "System.ArgumentException";
			}
			if (coefficient == 0)
			{
				return this.zero;
			}
			var coefficients = new Array(degree + 1);
			coefficients.fill(0);
			coefficients[0] = coefficient;
			return new GF256Poly(this, coefficients);
		}
	this.exp=function( a)
		{
			return this.expTable[a];
		}
	this.log=function( a)
		{
			if (a == 0)
			{
				throw "System.ArgumentException";
			}
			return this.logTable[a];
		}
	this.inverse=function( a)
		{
			if (a == 0)
			{
				throw "System.ArithmeticException";
			}
			return this.expTable[255 - this.logTable[a]];
		}
	this.multiply=function( a,  b)
		{
			if (a == 0 || b == 0)
			{
				return 0;
			}
			if (a == 1)
			{
				return b;
			}
			if (b == 1)
			{
				return a;
			}
			return this.expTable[(this.logTable[a] + this.logTable[b]) % 255];
		}		
}

GF256.QR_CODE_FIELD = new GF256(0x011D);
GF256.DATA_MATRIX_FIELD = new GF256(0x012D);

GF256.addOrSubtract=function( a,  b)
{
	return a ^ b;
}
/*
  Ported to JavaScript by Lazar Laszlo 2011 
  
  lazarsoft@gmail.com, www.lazarsoft.info
  
*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


var MIN_SKIP = 3;
var MAX_MODULES = 57;
var INTEGER_MATH_SHIFT = 8;
var CENTER_QUORUM = 2;

qrcode.orderBestPatterns=function(patterns)
		{
			
			function distance( pattern1,  pattern2)
			{
				var xDiff = pattern1.X - pattern2.X;
				var yDiff = pattern1.Y - pattern2.Y;
				return  Math.sqrt( (xDiff * xDiff + yDiff * yDiff));
			}
			
			/// <summary> Returns the z component of the cross product between vectors BC and BA.</summary>
			function crossProductZ( pointA,  pointB,  pointC)
			{
				var bX = pointB.x;
				var bY = pointB.y;
				return ((pointC.x - bX) * (pointA.y - bY)) - ((pointC.y - bY) * (pointA.x - bX));
			}

			
			// Find distances between pattern centers
			var zeroOneDistance = distance(patterns[0], patterns[1]);
			var oneTwoDistance = distance(patterns[1], patterns[2]);
			var zeroTwoDistance = distance(patterns[0], patterns[2]);
			
			var pointA, pointB, pointC;
			// Assume one closest to other two is B; A and C will just be guesses at first
			if (oneTwoDistance >= zeroOneDistance && oneTwoDistance >= zeroTwoDistance)
			{
				pointB = patterns[0];
				pointA = patterns[1];
				pointC = patterns[2];
			}
			else if (zeroTwoDistance >= oneTwoDistance && zeroTwoDistance >= zeroOneDistance)
			{
				pointB = patterns[1];
				pointA = patterns[0];
				pointC = patterns[2];
			}
			else
			{
				pointB = patterns[2];
				pointA = patterns[0];
				pointC = patterns[1];
			}
			
			// Use cross product to figure out whether A and C are correct or flipped.
			// This asks whether BC x BA has a positive z component, which is the arrangement
			// we want for A, B, C. If it's negative, then we've got it flipped around and
			// should swap A and C.
			if (crossProductZ(pointA, pointB, pointC) < 0.0)
			{
				var temp = pointA;
				pointA = pointC;
				pointC = temp;
			}
			
			patterns[0] = pointA;
			patterns[1] = pointB;
			patterns[2] = pointC;
		}


function FinderPattern(posX, posY,  estimatedModuleSize)
{
	this.x=posX;
	this.y=posY;
	this.count = 1;
	this.estimatedModuleSize = estimatedModuleSize;
	
	this.__defineGetter__("EstimatedModuleSize", function()
	{
		return this.estimatedModuleSize;
	}); 
	this.__defineGetter__("Count", function()
	{
		return this.count;
	});
	this.__defineGetter__("X", function()
	{
		return this.x;
	});
	this.__defineGetter__("Y", function()
	{
		return this.y;
	});
	this.incrementCount = function()
	{
		++this.count;
	}
	this.aboutEquals=function( moduleSize,  i,  j)
		{
			if (Math.abs(i - this.y) <= moduleSize && Math.abs(j - this.x) <= moduleSize)
			{
				var moduleSizeDiff = Math.abs(moduleSize - this.estimatedModuleSize);
				return moduleSizeDiff <= 1.0 || moduleSizeDiff / this.estimatedModuleSize <= 1.0;
			}
			return false;
		}
	
}

function FinderPatternInfo(patternCenters)
{
	this.bottomLeft = patternCenters[0];
	this.topLeft = patternCenters[1];
	this.topRight = patternCenters[2];
	this.__defineGetter__("BottomLeft", function()
	{
		return this.bottomLeft;
	}); 
	this.__defineGetter__("TopLeft", function()
	{
		return this.topLeft;
	}); 
	this.__defineGetter__("TopRight", function()
	{
		return this.topRight;
	}); 
}

function FinderPatternFinder()
{
	this.possibleCenters = [];
	this.hasSkipped = false;
	this.crossCheckStateCount = [0,0,0,0,0];
	this.resultPointCallback = null;
	
	this.__defineGetter__("CrossCheckStateCount", function()
	{
		this.crossCheckStateCount[0] = 0;
		this.crossCheckStateCount[1] = 0;
		this.crossCheckStateCount[2] = 0;
		this.crossCheckStateCount[3] = 0;
		this.crossCheckStateCount[4] = 0;
		return this.crossCheckStateCount;
	}); 
	
	this.foundPatternCross=function( stateCount)
		{
			var totalModuleSize = 0;
			for (var i = 0; i < 5; ++i)
			{
				var count = stateCount[i];
				if (count == 0)
				{
					return false;
				}
				totalModuleSize += count;
			}
			if (totalModuleSize < 7)
			{
				return false;
			}
			var moduleSize = Math.floor((totalModuleSize << INTEGER_MATH_SHIFT) / 7);
			var maxVariance = Math.floor(moduleSize / 2);
			// Allow less than 50% variance from 1-1-3-1-1 proportions
			return Math.abs(moduleSize - (stateCount[0] << INTEGER_MATH_SHIFT)) < maxVariance && Math.abs(moduleSize - (stateCount[1] << INTEGER_MATH_SHIFT)) < maxVariance && Math.abs(3 * moduleSize - (stateCount[2] << INTEGER_MATH_SHIFT)) < 3 * maxVariance && Math.abs(moduleSize - (stateCount[3] << INTEGER_MATH_SHIFT)) < maxVariance && Math.abs(moduleSize - (stateCount[4] << INTEGER_MATH_SHIFT)) < maxVariance;
		}
	this.centerFromEnd=function( stateCount,  end)
		{
			return  (end - stateCount[4] - stateCount[3]) - stateCount[2] / 2.0;
		}
	this.crossCheckVertical=function( startI,  centerJ,  maxCount,  originalStateCountTotal, img)
		{
			var maxI = qrcode.height;
			var stateCount = this.CrossCheckStateCount;
			
			// Start counting up from center
			var i = startI;
			while (i >= 0 && img[centerJ + i*qrcode.width])
			{
				++stateCount[2];
				--i;
			}
			if (i < 0)
			{
				return NaN;
			}
			while (i >= 0 && !img[centerJ +i*qrcode.width] && stateCount[1] <= maxCount)
			{
				++stateCount[1];
				--i;
			}
			// If already too many modules in this state or ran off the edge:
			if (i < 0 || stateCount[1] > maxCount)
			{
				return NaN;
			}
			while (i >= 0 && img[centerJ + i*qrcode.width] && stateCount[0] <= maxCount)
			{
				++stateCount[0];
				--i;
			}
			if (stateCount[0] > maxCount)
			{
				return NaN;
			}
			
			// Now also count down from center
			i = startI + 1;
			while (i < maxI && img[centerJ +i*qrcode.width])
			{
				++stateCount[2];
				++i;
			}
			if (i == maxI)
			{
				return NaN;
			}
			while (i < maxI && !img[centerJ + i*qrcode.width] && stateCount[3] < maxCount)
			{
				++stateCount[3];
				++i;
			}
			if (i == maxI || stateCount[3] >= maxCount)
			{
				return NaN;
			}
			while (i < maxI && img[centerJ + i*qrcode.width] && stateCount[4] < maxCount)
			{
				++stateCount[4];
				++i;
			}
			if (stateCount[4] >= maxCount)
			{
				return NaN;
			}
			
			// If we found a finder-pattern-like section, but its size is more than 40% different than
			// the original, assume it's a false positive
			var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
			if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= 2 * originalStateCountTotal)
			{
				return NaN;
			}
			
			return this.foundPatternCross(stateCount)?this.centerFromEnd(stateCount, i):NaN;
		}
	this.crossCheckHorizontal=function( startJ,  centerI,  maxCount, originalStateCountTotal, img)
		{			
			var maxJ = qrcode.width;
			var stateCount = this.CrossCheckStateCount;
			
			var j = startJ;
			while (j >= 0 && img[j+ centerI*qrcode.width])
			{
				++stateCount[2];
				--j;
			}
			if (j < 0)
			{
				return NaN;
			}
			while (j >= 0 && !img[j+ centerI*qrcode.width] && stateCount[1] <= maxCount)
			{
				++stateCount[1];
				--j;
			}
			if (j < 0 || stateCount[1] > maxCount)
			{
				return NaN;
			}
			while (j >= 0 && img[j+ centerI*qrcode.width] && stateCount[0] <= maxCount)
			{
				++stateCount[0];
				--j;
			}
			if (stateCount[0] > maxCount)
			{
				return NaN;
			}
			
			j = startJ + 1;
			while (j < maxJ && img[j+ centerI*qrcode.width])
			{
				++stateCount[2];
				++j;
			}
			if (j == maxJ)
			{
				return NaN;
			}
			while (j < maxJ && !img[j+ centerI*qrcode.width] && stateCount[3] < maxCount)
			{
				++stateCount[3];
				++j;
			}
			if (j == maxJ || stateCount[3] >= maxCount)
			{
				return NaN;
			}
			while (j < maxJ && img[j+ centerI*qrcode.width] && stateCount[4] < maxCount)
			{
				++stateCount[4];
				++j;
			}
			if (stateCount[4] >= maxCount)
			{
				return NaN;
			}
			
			// If we found a finder-pattern-like section, but its size is significantly different than
			// the original, assume it's a false positive
			var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
			if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= originalStateCountTotal)
			{
				return NaN;
			}
			
			return this.foundPatternCross(stateCount)?this.centerFromEnd(stateCount, j):NaN;
		}
	this.handlePossibleCenter=function( stateCount,  i,  j, img)
		{
			var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2] + stateCount[3] + stateCount[4];
			var centerJ = this.centerFromEnd(stateCount, j); //float
			var centerI = this.crossCheckVertical(i, Math.floor( centerJ), stateCount[2], stateCountTotal, img); //float
			if (!isNaN(centerI))
			{
				// Re-cross check
				centerJ = this.crossCheckHorizontal(Math.floor( centerJ), Math.floor( centerI), stateCount[2], stateCountTotal, img);
				if (!isNaN(centerJ))
				{
					var estimatedModuleSize =   stateCountTotal / 7.0;
					var found = false;
					var max = this.possibleCenters.length;
					for (var index = 0; index < max; ++index)
					{
						var center = this.possibleCenters[index];
						// Look for about the same center and module size:
						if (center.aboutEquals(estimatedModuleSize, centerI, centerJ))
						{
							center.incrementCount();
							found = true;
							break;
						}
					}
					if (!found)
					{
						var point = new FinderPattern(centerJ, centerI, estimatedModuleSize);
						this.possibleCenters.push(point);
						if (this.resultPointCallback != null)
						{
							this.resultPointCallback.foundPossibleResultPoint(point);
						}
					}
					return true;
				}
			}
			return false;
		}
		
	this.selectBestPatterns=function()
		{
			
			var startSize = this.possibleCenters.length;
			if (startSize < 3)
			{
				// Couldn't find enough finder patterns
				throw "Couldn't find enough finder patterns (found " + startSize + ")"
			}
			
			// Filter outlier possibilities whose module size is too different
			if (startSize > 3)
			{
				// But we can only afford to do so if we have at least 4 possibilities to choose from
				var totalModuleSize = 0.0;
                var square = 0.0;
				for (var i = 0; i < startSize; ++i)
				{
					//totalModuleSize +=  this.possibleCenters[i].EstimatedModuleSize;
                    var	centerValue=this.possibleCenters[i].EstimatedModuleSize;
					totalModuleSize += centerValue;
					square += (centerValue * centerValue);
				}
				var average = totalModuleSize /  startSize;
                this.possibleCenters.sort(function(center1,center2) {
				      var dA=Math.abs(center2.EstimatedModuleSize - average);
				      var dB=Math.abs(center1.EstimatedModuleSize - average);
				      if (dA < dB) {
				    	  return (-1);
				      } else if (dA == dB) {
				    	  return 0;
				      } else {
				    	  return 1;
				      }
					});

				var stdDev = Math.sqrt(square / startSize - average * average);
				var limit = Math.max(0.01 * average, stdDev);
				for (var i = 0; i < this.possibleCenters.length && this.possibleCenters.length > 3; )
				{
					var pattern =  this.possibleCenters[i];
                    if (Math.abs(pattern.EstimatedModuleSize - average) > limit)
					{
						this.possibleCenters.splice(i,1);
					}
					else
					{
						++i;
					}
				}
			}
			
			if (this.possibleCenters.length > 3)
			{
				// Throw away all but those first size candidate points we found.
				this.possibleCenters.sort(function(a, b){
					if (a.count > b.count){return -1;}
					if (a.count < b.count){return 1;}
					return 0;
				});
			}
			
			return [this.possibleCenters[0],  this.possibleCenters[1],  this.possibleCenters[2]];
		}
		
	this.findRowSkip=function()
		{
			var max = this.possibleCenters.length;
			if (max <= 1)
			{
				return 0;
			}
			var firstConfirmedCenter = null;
			for (var i = 0; i < max; ++i)
			{
				var center =  this.possibleCenters[i];
				if (center.Count >= CENTER_QUORUM)
				{
					if (firstConfirmedCenter == null)
					{
						firstConfirmedCenter = center;
					}
					else
					{
						// We have two confirmed centers
						// How far down can we skip before resuming looking for the next
						// pattern? In the worst case, only the difference between the
						// difference in the x / y coordinates of the two centers.
						// This is the case where you find top left last.
						this.hasSkipped = true;
						return Math.floor ((Math.abs(firstConfirmedCenter.X - center.X) - Math.abs(firstConfirmedCenter.Y - center.Y)) / 2);
					}
				}
			}
			return 0;
		}
	
	this.haveMultiplyConfirmedCenters=function()
		{
			var confirmedCount = 0;
			var totalModuleSize = 0.0;
			var max = this.possibleCenters.length;
			for (var i = 0; i < max; ++i)
			{
				var pattern =  this.possibleCenters[i];
				if (pattern.Count >= CENTER_QUORUM)
				{
					++confirmedCount;
					totalModuleSize += pattern.EstimatedModuleSize;
				}
			}
			if (confirmedCount < 3)
			{
				return false;
			}
			// OK, we have at least 3 confirmed centers, but, it's possible that one is a "false positive"
			// and that we need to keep looking. We detect this by asking if the estimated module sizes
			// vary too much. We arbitrarily say that when the total deviation from average exceeds
			// 5‰ of the total module size estimates, it's too much.
			var average = totalModuleSize / max;
			var totalDeviation = 0.0;
			for (var i = 0; i < max; ++i)
			{
				pattern = this.possibleCenters[i];
				totalDeviation += Math.abs(pattern.EstimatedModuleSize - average);
			}
			return totalDeviation <= 0.005 * totalModuleSize;
		}
		
	this.findFinderPattern = function(img){
		var tryHarder = false;
		var maxI = qrcode.height;
		var maxJ = qrcode.width;
		var iSkip = Math.floor((3 * maxI) / (4 * MAX_MODULES));
		if (iSkip < MIN_SKIP || tryHarder)
		{
				iSkip = MIN_SKIP;
		}
		
		var done = false;
		var stateCount = [0,0,0,0,0];
		for (var i = iSkip - 1; i < maxI && !done; i += iSkip)
		{
			// Get a row of black/white values
			stateCount[0] = 0;
			stateCount[1] = 0;
			stateCount[2] = 0;
			stateCount[3] = 0;
			stateCount[4] = 0;
			var currentState = 0;
			for (var j = 0; j < maxJ; ++j)
			{
				if (img[j+i*qrcode.width] )
				{
					// Black pixel
					if ((currentState & 1) == 1)
					{
						// Counting white pixels
						++currentState;
					}
					++stateCount[currentState];
				}
				else
				{
					// White pixel
					if ((currentState & 1) == 0)
					{
						// Counting black pixels
						if (currentState == 4)
						{
							// A winner?
							if (this.foundPatternCross(stateCount))
							{
								// Yes
								var confirmed = this.handlePossibleCenter(stateCount, i, j, img);
								if (confirmed)
								{
									// Start examining every other line. Checking each line turned out to be too
									// expensive and didn't improve performance.
									iSkip = 2;
									if (this.hasSkipped)
									{
										done = this.haveMultiplyConfirmedCenters();
									}
									else
									{
										var rowSkip = this.findRowSkip();
										if (rowSkip > stateCount[2])
										{
											// Skip rows between row of lower confirmed center
											// and top of presumed third confirmed center
											// but back up a bit to get a full chance of detecting
											// it, entire width of center of finder pattern
											
											// Skip by rowSkip, but back off by stateCount[2] (size of last center
											// of pattern we saw) to be conservative, and also back off by iSkip which
											// is about to be re-added
											i += rowSkip - stateCount[2] - iSkip;
											j = maxJ - 1;
										}
									}
								}
								else
								{
									// Advance to next black pixel
									while (++j < maxJ && !img[j + i*qrcode.width]);
									--j; // back up to that last white pixel
								}
								// Clear state to start looking again
								currentState = 0;
								stateCount[0] = 0;
								stateCount[1] = 0;
								stateCount[2] = 0;
								stateCount[3] = 0;
								stateCount[4] = 0;
							}
							else
							{
								// No, shift counts back by two
								stateCount[0] = stateCount[2];
								stateCount[1] = stateCount[3];
								stateCount[2] = stateCount[4];
								stateCount[3] = 1;
								stateCount[4] = 0;
								currentState = 3;
							}
						}
						else
						{
							++stateCount[++currentState];
						}
					}
					else
					{
						// Counting white pixels
						++stateCount[currentState];
					}
				}
			}
			if (this.foundPatternCross(stateCount))
			{
				var confirmed = this.handlePossibleCenter(stateCount, i, maxJ, img);
				if (confirmed)
				{
					iSkip = stateCount[0];
					if (this.hasSkipped)
					{
						// Found a third one
						done = this.haveMultiplyConfirmedCenters();
					}
				}
			}
		}
		
		var patternInfo = this.selectBestPatterns();
		qrcode.orderBestPatterns(patternInfo);
		
		return new FinderPatternInfo(patternInfo);
	};
}

var shift_jis_table = {
    jisx0208_2uni_page21 : [0x3000, 0x3001, 0x3002, 0xff0c, 0xff0e, 0x30fb, 0xff1a, 0xff1b, 0xff1f, 0xff01, 0x309b, 0x309c, 0xb4, 0xff40, 0xa8, 0xff3e, 0xffe3, 0xff3f, 0x30fd, 0x30fe, 0x309d, 0x309e, 0x3003, 0x4edd, 0x3005, 0x3006, 0x3007, 0x30fc, 0x2015, 0x2010, 0xff0f, 0xff3c, 0x301c, 0x2016, 0xff5c, 0x2026, 0x2025, 0x2018, 0x2019, 0x201c, 0x201d, 0xff08, 0xff09, 0x3014, 0x3015, 0xff3b, 0xff3d, 0xff5b, 0xff5d, 0x3008, 0x3009, 0x300a, 0x300b, 0x300c, 0x300d, 0x300e, 0x300f, 0x3010, 0x3011, 0xff0b, 0x2212, 0xb1, 0xd7, 0xf7, 0xff1d, 0x2260, 0xff1c, 0xff1e, 0x2266, 0x2267, 0x221e, 0x2234, 0x2642, 0x2640, 0xb0, 0x2032, 0x2033, 0x2103, 0xffe5, 0xff04, 0xa2, 0xa3, 0xff05, 0xff03, 0xff06, 0xff0a, 0xff20, 0xa7, 0x2606, 0x2605, 0x25cb, 0x25cf, 0x25ce, 0x25c7, 0x25c6, 0x25a1, 0x25a0, 0x25b3, 0x25b2, 0x25bd, 0x25bc, 0x203b, 0x3012, 0x2192, 0x2190, 0x2191, 0x2193, 0x3013, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0x2208, 0x220b, 0x2286, 0x2287, 0x2282, 0x2283, 0x222a, 0x2229, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0x2227, 0x2228, 0xac, 0x21d2, 0x21d4, 0x2200, 0x2203, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0x2220, 0x22a5, 0x2312, 0x2202, 0x2207, 0x2261, 0x2252, 0x226a, 0x226b, 0x221a, 0x223d, 0x221d, 0x2235, 0x222b, 0x222c, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0x212b, 0x2030, 0x266f, 0x266d, 0x266a, 0x2020, 0x2021, 0xb6, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0x25ef, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xff10, 0xff11, 0xff12, 0xff13, 0xff14, 0xff15, 0xff16, 0xff17, 0xff18, 0xff19, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xff21, 0xff22, 0xff23, 0xff24, 0xff25, 0xff26, 0xff27, 0xff28, 0xff29, 0xff2a, 0xff2b, 0xff2c, 0xff2d, 0xff2e, 0xff2f, 0xff30, 0xff31, 0xff32, 0xff33, 0xff34, 0xff35, 0xff36, 0xff37, 0xff38, 0xff39, 0xff3a, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xff41, 0xff42, 0xff43, 0xff44, 0xff45, 0xff46, 0xff47, 0xff48, 0xff49, 0xff4a, 0xff4b, 0xff4c, 0xff4d, 0xff4e, 0xff4f, 0xff50, 0xff51, 0xff52, 0xff53, 0xff54, 0xff55, 0xff56, 0xff57, 0xff58, 0xff59, 0xff5a, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0x3041, 0x3042, 0x3043, 0x3044, 0x3045, 0x3046, 0x3047, 0x3048, 0x3049, 0x304a, 0x304b, 0x304c, 0x304d, 0x304e, 0x304f, 0x3050, 0x3051, 0x3052, 0x3053, 0x3054, 0x3055, 0x3056, 0x3057, 0x3058, 0x3059, 0x305a, 0x305b, 0x305c, 0x305d, 0x305e, 0x305f, 0x3060, 0x3061, 0x3062, 0x3063, 0x3064, 0x3065, 0x3066, 0x3067, 0x3068, 0x3069, 0x306a, 0x306b, 0x306c, 0x306d, 0x306e, 0x306f, 0x3070, 0x3071, 0x3072, 0x3073, 0x3074, 0x3075, 0x3076, 0x3077, 0x3078, 0x3079, 0x307a, 0x307b, 0x307c, 0x307d, 0x307e, 0x307f, 0x3080, 0x3081, 0x3082, 0x3083, 0x3084, 0x3085, 0x3086, 0x3087, 0x3088, 0x3089, 0x308a, 0x308b, 0x308c, 0x308d, 0x308e, 0x308f, 0x3090, 0x3091, 0x3092, 0x3093, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0x30a1, 0x30a2, 0x30a3, 0x30a4, 0x30a5, 0x30a6, 0x30a7, 0x30a8, 0x30a9, 0x30aa, 0x30ab, 0x30ac, 0x30ad, 0x30ae, 0x30af, 0x30b0, 0x30b1, 0x30b2, 0x30b3, 0x30b4, 0x30b5, 0x30b6, 0x30b7, 0x30b8, 0x30b9, 0x30ba, 0x30bb, 0x30bc, 0x30bd, 0x30be, 0x30bf, 0x30c0, 0x30c1, 0x30c2, 0x30c3, 0x30c4, 0x30c5, 0x30c6, 0x30c7, 0x30c8, 0x30c9, 0x30ca, 0x30cb, 0x30cc, 0x30cd, 0x30ce, 0x30cf, 0x30d0, 0x30d1, 0x30d2, 0x30d3, 0x30d4, 0x30d5, 0x30d6, 0x30d7, 0x30d8, 0x30d9, 0x30da, 0x30db, 0x30dc, 0x30dd, 0x30de, 0x30df, 0x30e0, 0x30e1, 0x30e2, 0x30e3, 0x30e4, 0x30e5, 0x30e6, 0x30e7, 0x30e8, 0x30e9, 0x30ea, 0x30eb, 0x30ec, 0x30ed, 0x30ee, 0x30ef, 0x30f0, 0x30f1, 0x30f2, 0x30f3, 0x30f4, 0x30f5, 0x30f6, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0x391, 0x392, 0x393, 0x394, 0x395, 0x396, 0x397, 0x398, 0x399, 0x39a, 0x39b, 0x39c, 0x39d, 0x39e, 0x39f, 0x3a0, 0x3a1, 0x3a3, 0x3a4, 0x3a5, 0x3a6, 0x3a7, 0x3a8, 0x3a9, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0x3b1, 0x3b2, 0x3b3, 0x3b4, 0x3b5, 0x3b6, 0x3b7, 0x3b8, 0x3b9, 0x3ba, 0x3bb, 0x3bc, 0x3bd, 0x3be, 0x3bf, 0x3c0, 0x3c1, 0x3c3, 0x3c4, 0x3c5, 0x3c6, 0x3c7, 0x3c8, 0x3c9, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0x410, 0x411, 0x412, 0x413, 0x414, 0x415, 0x401, 0x416, 0x417, 0x418, 0x419, 0x41a, 0x41b, 0x41c, 0x41d, 0x41e, 0x41f, 0x420, 0x421, 0x422, 0x423, 0x424, 0x425, 0x426, 0x427, 0x428, 0x429, 0x42a, 0x42b, 0x42c, 0x42d, 0x42e, 0x42f, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0x430, 0x431, 0x432, 0x433, 0x434, 0x435, 0x451, 0x436, 0x437, 0x438, 0x439, 0x43a, 0x43b, 0x43c, 0x43d, 0x43e, 0x43f, 0x440, 0x441, 0x442, 0x443, 0x444, 0x445, 0x446, 0x447, 0x448, 0x449, 0x44a, 0x44b, 0x44c, 0x44d, 0x44e, 0x44f, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0x2500, 0x2502, 0x250c, 0x2510, 0x2518, 0x2514, 0x251c, 0x252c, 0x2524, 0x2534, 0x253c, 0x2501, 0x2503, 0x250f, 0x2513, 0x251b, 0x2517, 0x2523, 0x2533, 0x252b, 0x253b, 0x254b, 0x2520, 0x252f, 0x2528, 0x2537, 0x253f, 0x251d, 0x2530, 0x2525, 0x2538, 0x2542, ],
    jisx0208_2uni_page30 : [0x4e9c, 0x5516, 0x5a03, 0x963f, 0x54c0, 0x611b, 0x6328, 0x59f6, 0x9022, 0x8475, 0x831c, 0x7a50, 0x60aa, 0x63e1, 0x6e25, 0x65ed, 0x8466, 0x82a6, 0x9bf5, 0x6893, 0x5727, 0x65a1, 0x6271, 0x5b9b, 0x59d0, 0x867b, 0x98f4, 0x7d62, 0x7dbe, 0x9b8e, 0x6216, 0x7c9f, 0x88b7, 0x5b89, 0x5eb5, 0x6309, 0x6697, 0x6848, 0x95c7, 0x978d, 0x674f, 0x4ee5, 0x4f0a, 0x4f4d, 0x4f9d, 0x5049, 0x56f2, 0x5937, 0x59d4, 0x5a01, 0x5c09, 0x60df, 0x610f, 0x6170, 0x6613, 0x6905, 0x70ba, 0x754f, 0x7570, 0x79fb, 0x7dad, 0x7def, 0x80c3, 0x840e, 0x8863, 0x8b02, 0x9055, 0x907a, 0x533b, 0x4e95, 0x4ea5, 0x57df, 0x80b2, 0x90c1, 0x78ef, 0x4e00, 0x58f1, 0x6ea2, 0x9038, 0x7a32, 0x8328, 0x828b, 0x9c2f, 0x5141, 0x5370, 0x54bd, 0x54e1, 0x56e0, 0x59fb, 0x5f15, 0x98f2, 0x6deb, 0x80e4, 0x852d, 0x9662, 0x9670, 0x96a0, 0x97fb, 0x540b, 0x53f3, 0x5b87, 0x70cf, 0x7fbd, 0x8fc2, 0x96e8, 0x536f, 0x9d5c, 0x7aba, 0x4e11, 0x7893, 0x81fc, 0x6e26, 0x5618, 0x5504, 0x6b1d, 0x851a, 0x9c3b, 0x59e5, 0x53a9, 0x6d66, 0x74dc, 0x958f, 0x5642, 0x4e91, 0x904b, 0x96f2, 0x834f, 0x990c, 0x53e1, 0x55b6, 0x5b30, 0x5f71, 0x6620, 0x66f3, 0x6804, 0x6c38, 0x6cf3, 0x6d29, 0x745b, 0x76c8, 0x7a4e, 0x9834, 0x82f1, 0x885b, 0x8a60, 0x92ed, 0x6db2, 0x75ab, 0x76ca, 0x99c5, 0x60a6, 0x8b01, 0x8d8a, 0x95b2, 0x698e, 0x53ad, 0x5186, 0x5712, 0x5830, 0x5944, 0x5bb4, 0x5ef6, 0x6028, 0x63a9, 0x63f4, 0x6cbf, 0x6f14, 0x708e, 0x7114, 0x7159, 0x71d5, 0x733f, 0x7e01, 0x8276, 0x82d1, 0x8597, 0x9060, 0x925b, 0x9d1b, 0x5869, 0x65bc, 0x6c5a, 0x7525, 0x51f9, 0x592e, 0x5965, 0x5f80, 0x5fdc, 0x62bc, 0x65fa, 0x6a2a, 0x6b27, 0x6bb4, 0x738b, 0x7fc1, 0x8956, 0x9d2c, 0x9d0e, 0x9ec4, 0x5ca1, 0x6c96, 0x837b, 0x5104, 0x5c4b, 0x61b6, 0x81c6, 0x6876, 0x7261, 0x4e59, 0x4ffa, 0x5378, 0x6069, 0x6e29, 0x7a4f, 0x97f3, 0x4e0b, 0x5316, 0x4eee, 0x4f55, 0x4f3d, 0x4fa1, 0x4f73, 0x52a0, 0x53ef, 0x5609, 0x590f, 0x5ac1, 0x5bb6, 0x5be1, 0x79d1, 0x6687, 0x679c, 0x67b6, 0x6b4c, 0x6cb3, 0x706b, 0x73c2, 0x798d, 0x79be, 0x7a3c, 0x7b87, 0x82b1, 0x82db, 0x8304, 0x8377, 0x83ef, 0x83d3, 0x8766, 0x8ab2, 0x5629, 0x8ca8, 0x8fe6, 0x904e, 0x971e, 0x868a, 0x4fc4, 0x5ce8, 0x6211, 0x7259, 0x753b, 0x81e5, 0x82bd, 0x86fe, 0x8cc0, 0x96c5, 0x9913, 0x99d5, 0x4ecb, 0x4f1a, 0x89e3, 0x56de, 0x584a, 0x58ca, 0x5efb, 0x5feb, 0x602a, 0x6094, 0x6062, 0x61d0, 0x6212, 0x62d0, 0x6539, 0x9b41, 0x6666, 0x68b0, 0x6d77, 0x7070, 0x754c, 0x7686, 0x7d75, 0x82a5, 0x87f9, 0x958b, 0x968e, 0x8c9d, 0x51f1, 0x52be, 0x5916, 0x54b3, 0x5bb3, 0x5d16, 0x6168, 0x6982, 0x6daf, 0x788d, 0x84cb, 0x8857, 0x8a72, 0x93a7, 0x9ab8, 0x6d6c, 0x99a8, 0x86d9, 0x57a3, 0x67ff, 0x86ce, 0x920e, 0x5283, 0x5687, 0x5404, 0x5ed3, 0x62e1, 0x64b9, 0x683c, 0x6838, 0x6bbb, 0x7372, 0x78ba, 0x7a6b, 0x899a, 0x89d2, 0x8d6b, 0x8f03, 0x90ed, 0x95a3, 0x9694, 0x9769, 0x5b66, 0x5cb3, 0x697d, 0x984d, 0x984e, 0x639b, 0x7b20, 0x6a2b, 0x6a7f, 0x68b6, 0x9c0d, 0x6f5f, 0x5272, 0x559d, 0x6070, 0x62ec, 0x6d3b, 0x6e07, 0x6ed1, 0x845b, 0x8910, 0x8f44, 0x4e14, 0x9c39, 0x53f6, 0x691b, 0x6a3a, 0x9784, 0x682a, 0x515c, 0x7ac3, 0x84b2, 0x91dc, 0x938c, 0x565b, 0x9d28, 0x6822, 0x8305, 0x8431, 0x7ca5, 0x5208, 0x82c5, 0x74e6, 0x4e7e, 0x4f83, 0x51a0, 0x5bd2, 0x520a, 0x52d8, 0x52e7, 0x5dfb, 0x559a, 0x582a, 0x59e6, 0x5b8c, 0x5b98, 0x5bdb, 0x5e72, 0x5e79, 0x60a3, 0x611f, 0x6163, 0x61be, 0x63db, 0x6562, 0x67d1, 0x6853, 0x68fa, 0x6b3e, 0x6b53, 0x6c57, 0x6f22, 0x6f97, 0x6f45, 0x74b0, 0x7518, 0x76e3, 0x770b, 0x7aff, 0x7ba1, 0x7c21, 0x7de9, 0x7f36, 0x7ff0, 0x809d, 0x8266, 0x839e, 0x89b3, 0x8acc, 0x8cab, 0x9084, 0x9451, 0x9593, 0x9591, 0x95a2, 0x9665, 0x97d3, 0x9928, 0x8218, 0x4e38, 0x542b, 0x5cb8, 0x5dcc, 0x73a9, 0x764c, 0x773c, 0x5ca9, 0x7feb, 0x8d0b, 0x96c1, 0x9811, 0x9854, 0x9858, 0x4f01, 0x4f0e, 0x5371, 0x559c, 0x5668, 0x57fa, 0x5947, 0x5b09, 0x5bc4, 0x5c90, 0x5e0c, 0x5e7e, 0x5fcc, 0x63ee, 0x673a, 0x65d7, 0x65e2, 0x671f, 0x68cb, 0x68c4, 0x6a5f, 0x5e30, 0x6bc5, 0x6c17, 0x6c7d, 0x757f, 0x7948, 0x5b63, 0x7a00, 0x7d00, 0x5fbd, 0x898f, 0x8a18, 0x8cb4, 0x8d77, 0x8ecc, 0x8f1d, 0x98e2, 0x9a0e, 0x9b3c, 0x4e80, 0x507d, 0x5100, 0x5993, 0x5b9c, 0x622f, 0x6280, 0x64ec, 0x6b3a, 0x72a0, 0x7591, 0x7947, 0x7fa9, 0x87fb, 0x8abc, 0x8b70, 0x63ac, 0x83ca, 0x97a0, 0x5409, 0x5403, 0x55ab, 0x6854, 0x6a58, 0x8a70, 0x7827, 0x6775, 0x9ecd, 0x5374, 0x5ba2, 0x811a, 0x8650, 0x9006, 0x4e18, 0x4e45, 0x4ec7, 0x4f11, 0x53ca, 0x5438, 0x5bae, 0x5f13, 0x6025, 0x6551, 0x673d, 0x6c42, 0x6c72, 0x6ce3, 0x7078, 0x7403, 0x7a76, 0x7aae, 0x7b08, 0x7d1a, 0x7cfe, 0x7d66, 0x65e7, 0x725b, 0x53bb, 0x5c45, 0x5de8, 0x62d2, 0x62e0, 0x6319, 0x6e20, 0x865a, 0x8a31, 0x8ddd, 0x92f8, 0x6f01, 0x79a6, 0x9b5a, 0x4ea8, 0x4eab, 0x4eac, 0x4f9b, 0x4fa0, 0x50d1, 0x5147, 0x7af6, 0x5171, 0x51f6, 0x5354, 0x5321, 0x537f, 0x53eb, 0x55ac, 0x5883, 0x5ce1, 0x5f37, 0x5f4a, 0x602f, 0x6050, 0x606d, 0x631f, 0x6559, 0x6a4b, 0x6cc1, 0x72c2, 0x72ed, 0x77ef, 0x80f8, 0x8105, 0x8208, 0x854e, 0x90f7, 0x93e1, 0x97ff, 0x9957, 0x9a5a, 0x4ef0, 0x51dd, 0x5c2d, 0x6681, 0x696d, 0x5c40, 0x66f2, 0x6975, 0x7389, 0x6850, 0x7c81, 0x50c5, 0x52e4, 0x5747, 0x5dfe, 0x9326, 0x65a4, 0x6b23, 0x6b3d, 0x7434, 0x7981, 0x79bd, 0x7b4b, 0x7dca, 0x82b9, 0x83cc, 0x887f, 0x895f, 0x8b39, 0x8fd1, 0x91d1, 0x541f, 0x9280, 0x4e5d, 0x5036, 0x53e5, 0x533a, 0x72d7, 0x7396, 0x77e9, 0x82e6, 0x8eaf, 0x99c6, 0x99c8, 0x99d2, 0x5177, 0x611a, 0x865e, 0x55b0, 0x7a7a, 0x5076, 0x5bd3, 0x9047, 0x9685, 0x4e32, 0x6adb, 0x91e7, 0x5c51, 0x5c48, 0x6398, 0x7a9f, 0x6c93, 0x9774, 0x8f61, 0x7aaa, 0x718a, 0x9688, 0x7c82, 0x6817, 0x7e70, 0x6851, 0x936c, 0x52f2, 0x541b, 0x85ab, 0x8a13, 0x7fa4, 0x8ecd, 0x90e1, 0x5366, 0x8888, 0x7941, 0x4fc2, 0x50be, 0x5211, 0x5144, 0x5553, 0x572d, 0x73ea, 0x578b, 0x5951, 0x5f62, 0x5f84, 0x6075, 0x6176, 0x6167, 0x61a9, 0x63b2, 0x643a, 0x656c, 0x666f, 0x6842, 0x6e13, 0x7566, 0x7a3d, 0x7cfb, 0x7d4c, 0x7d99, 0x7e4b, 0x7f6b, 0x830e, 0x834a, 0x86cd, 0x8a08, 0x8a63, 0x8b66, 0x8efd, 0x981a, 0x9d8f, 0x82b8, 0x8fce, 0x9be8, 0x5287, 0x621f, 0x6483, 0x6fc0, 0x9699, 0x6841, 0x5091, 0x6b20, 0x6c7a, 0x6f54, 0x7a74, 0x7d50, 0x8840, 0x8a23, 0x6708, 0x4ef6, 0x5039, 0x5026, 0x5065, 0x517c, 0x5238, 0x5263, 0x55a7, 0x570f, 0x5805, 0x5acc, 0x5efa, 0x61b2, 0x61f8, 0x62f3, 0x6372, 0x691c, 0x6a29, 0x727d, 0x72ac, 0x732e, 0x7814, 0x786f, 0x7d79, 0x770c, 0x80a9, 0x898b, 0x8b19, 0x8ce2, 0x8ed2, 0x9063, 0x9375, 0x967a, 0x9855, 0x9a13, 0x9e78, 0x5143, 0x539f, 0x53b3, 0x5e7b, 0x5f26, 0x6e1b, 0x6e90, 0x7384, 0x73fe, 0x7d43, 0x8237, 0x8a00, 0x8afa, 0x9650, 0x4e4e, 0x500b, 0x53e4, 0x547c, 0x56fa, 0x59d1, 0x5b64, 0x5df1, 0x5eab, 0x5f27, 0x6238, 0x6545, 0x67af, 0x6e56, 0x72d0, 0x7cca, 0x88b4, 0x80a1, 0x80e1, 0x83f0, 0x864e, 0x8a87, 0x8de8, 0x9237, 0x96c7, 0x9867, 0x9f13, 0x4e94, 0x4e92, 0x4f0d, 0x5348, 0x5449, 0x543e, 0x5a2f, 0x5f8c, 0x5fa1, 0x609f, 0x68a7, 0x6a8e, 0x745a, 0x7881, 0x8a9e, 0x8aa4, 0x8b77, 0x9190, 0x4e5e, 0x9bc9, 0x4ea4, 0x4f7c, 0x4faf, 0x5019, 0x5016, 0x5149, 0x516c, 0x529f, 0x52b9, 0x52fe, 0x539a, 0x53e3, 0x5411, 0x540e, 0x5589, 0x5751, 0x57a2, 0x597d, 0x5b54, 0x5b5d, 0x5b8f, 0x5de5, 0x5de7, 0x5df7, 0x5e78, 0x5e83, 0x5e9a, 0x5eb7, 0x5f18, 0x6052, 0x614c, 0x6297, 0x62d8, 0x63a7, 0x653b, 0x6602, 0x6643, 0x66f4, 0x676d, 0x6821, 0x6897, 0x69cb, 0x6c5f, 0x6d2a, 0x6d69, 0x6e2f, 0x6e9d, 0x7532, 0x7687, 0x786c, 0x7a3f, 0x7ce0, 0x7d05, 0x7d18, 0x7d5e, 0x7db1, 0x8015, 0x8003, 0x80af, 0x80b1, 0x8154, 0x818f, 0x822a, 0x8352, 0x884c, 0x8861, 0x8b1b, 0x8ca2, 0x8cfc, 0x90ca, 0x9175, 0x9271, 0x783f, 0x92fc, 0x95a4, 0x964d, 0x9805, 0x9999, 0x9ad8, 0x9d3b, 0x525b, 0x52ab, 0x53f7, 0x5408, 0x58d5, 0x62f7, 0x6fe0, 0x8c6a, 0x8f5f, 0x9eb9, 0x514b, 0x523b, 0x544a, 0x56fd, 0x7a40, 0x9177, 0x9d60, 0x9ed2, 0x7344, 0x6f09, 0x8170, 0x7511, 0x5ffd, 0x60da, 0x9aa8, 0x72db, 0x8fbc, 0x6b64, 0x9803, 0x4eca, 0x56f0, 0x5764, 0x58be, 0x5a5a, 0x6068, 0x61c7, 0x660f, 0x6606, 0x6839, 0x68b1, 0x6df7, 0x75d5, 0x7d3a, 0x826e, 0x9b42, 0x4e9b, 0x4f50, 0x53c9, 0x5506, 0x5d6f, 0x5de6, 0x5dee, 0x67fb, 0x6c99, 0x7473, 0x7802, 0x8a50, 0x9396, 0x88df, 0x5750, 0x5ea7, 0x632b, 0x50b5, 0x50ac, 0x518d, 0x6700, 0x54c9, 0x585e, 0x59bb, 0x5bb0, 0x5f69, 0x624d, 0x63a1, 0x683d, 0x6b73, 0x6e08, 0x707d, 0x91c7, 0x7280, 0x7815, 0x7826, 0x796d, 0x658e, 0x7d30, 0x83dc, 0x88c1, 0x8f09, 0x969b, 0x5264, 0x5728, 0x6750, 0x7f6a, 0x8ca1, 0x51b4, 0x5742, 0x962a, 0x583a, 0x698a, 0x80b4, 0x54b2, 0x5d0e, 0x57fc, 0x7895, 0x9dfa, 0x4f5c, 0x524a, 0x548b, 0x643e, 0x6628, 0x6714, 0x67f5, 0x7a84, 0x7b56, 0x7d22, 0x932f, 0x685c, 0x9bad, 0x7b39, 0x5319, 0x518a, 0x5237, 0x5bdf, 0x62f6, 0x64ae, 0x64e6, 0x672d, 0x6bba, 0x85a9, 0x96d1, 0x7690, 0x9bd6, 0x634c, 0x9306, 0x9bab, 0x76bf, 0x6652, 0x4e09, 0x5098, 0x53c2, 0x5c71, 0x60e8, 0x6492, 0x6563, 0x685f, 0x71e6, 0x73ca, 0x7523, 0x7b97, 0x7e82, 0x8695, 0x8b83, 0x8cdb, 0x9178, 0x9910, 0x65ac, 0x66ab, 0x6b8b, 0x4ed5, 0x4ed4, 0x4f3a, 0x4f7f, 0x523a, 0x53f8, 0x53f2, 0x55e3, 0x56db, 0x58eb, 0x59cb, 0x59c9, 0x59ff, 0x5b50, 0x5c4d, 0x5e02, 0x5e2b, 0x5fd7, 0x601d, 0x6307, 0x652f, 0x5b5c, 0x65af, 0x65bd, 0x65e8, 0x679d, 0x6b62, 0x6b7b, 0x6c0f, 0x7345, 0x7949, 0x79c1, 0x7cf8, 0x7d19, 0x7d2b, 0x80a2, 0x8102, 0x81f3, 0x8996, 0x8a5e, 0x8a69, 0x8a66, 0x8a8c, 0x8aee, 0x8cc7, 0x8cdc, 0x96cc, 0x98fc, 0x6b6f, 0x4e8b, 0x4f3c, 0x4f8d, 0x5150, 0x5b57, 0x5bfa, 0x6148, 0x6301, 0x6642, 0x6b21, 0x6ecb, 0x6cbb, 0x723e, 0x74bd, 0x75d4, 0x78c1, 0x793a, 0x800c, 0x8033, 0x81ea, 0x8494, 0x8f9e, 0x6c50, 0x9e7f, 0x5f0f, 0x8b58, 0x9d2b, 0x7afa, 0x8ef8, 0x5b8d, 0x96eb, 0x4e03, 0x53f1, 0x57f7, 0x5931, 0x5ac9, 0x5ba4, 0x6089, 0x6e7f, 0x6f06, 0x75be, 0x8cea, 0x5b9f, 0x8500, 0x7be0, 0x5072, 0x67f4, 0x829d, 0x5c61, 0x854a, 0x7e1e, 0x820e, 0x5199, 0x5c04, 0x6368, 0x8d66, 0x659c, 0x716e, 0x793e, 0x7d17, 0x8005, 0x8b1d, 0x8eca, 0x906e, 0x86c7, 0x90aa, 0x501f, 0x52fa, 0x5c3a, 0x6753, 0x707c, 0x7235, 0x914c, 0x91c8, 0x932b, 0x82e5, 0x5bc2, 0x5f31, 0x60f9, 0x4e3b, 0x53d6, 0x5b88, 0x624b, 0x6731, 0x6b8a, 0x72e9, 0x73e0, 0x7a2e, 0x816b, 0x8da3, 0x9152, 0x9996, 0x5112, 0x53d7, 0x546a, 0x5bff, 0x6388, 0x6a39, 0x7dac, 0x9700, 0x56da, 0x53ce, 0x5468, 0x5b97, 0x5c31, 0x5dde, 0x4fee, 0x6101, 0x62fe, 0x6d32, 0x79c0, 0x79cb, 0x7d42, 0x7e4d, 0x7fd2, 0x81ed, 0x821f, 0x8490, 0x8846, 0x8972, 0x8b90, 0x8e74, 0x8f2f, 0x9031, 0x914b, 0x916c, 0x96c6, 0x919c, 0x4ec0, 0x4f4f, 0x5145, 0x5341, 0x5f93, 0x620e, 0x67d4, 0x6c41, 0x6e0b, 0x7363, 0x7e26, 0x91cd, 0x9283, 0x53d4, 0x5919, 0x5bbf, 0x6dd1, 0x795d, 0x7e2e, 0x7c9b, 0x587e, 0x719f, 0x51fa, 0x8853, 0x8ff0, 0x4fca, 0x5cfb, 0x6625, 0x77ac, 0x7ae3, 0x821c, 0x99ff, 0x51c6, 0x5faa, 0x65ec, 0x696f, 0x6b89, 0x6df3, 0x6e96, 0x6f64, 0x76fe, 0x7d14, 0x5de1, 0x9075, 0x9187, 0x9806, 0x51e6, 0x521d, 0x6240, 0x6691, 0x66d9, 0x6e1a, 0x5eb6, 0x7dd2, 0x7f72, 0x66f8, 0x85af, 0x85f7, 0x8af8, 0x52a9, 0x53d9, 0x5973, 0x5e8f, 0x5f90, 0x6055, 0x92e4, 0x9664, 0x50b7, 0x511f, 0x52dd, 0x5320, 0x5347, 0x53ec, 0x54e8, 0x5546, 0x5531, 0x5617, 0x5968, 0x59be, 0x5a3c, 0x5bb5, 0x5c06, 0x5c0f, 0x5c11, 0x5c1a, 0x5e84, 0x5e8a, 0x5ee0, 0x5f70, 0x627f, 0x6284, 0x62db, 0x638c, 0x6377, 0x6607, 0x660c, 0x662d, 0x6676, 0x677e, 0x68a2, 0x6a1f, 0x6a35, 0x6cbc, 0x6d88, 0x6e09, 0x6e58, 0x713c, 0x7126, 0x7167, 0x75c7, 0x7701, 0x785d, 0x7901, 0x7965, 0x79f0, 0x7ae0, 0x7b11, 0x7ca7, 0x7d39, 0x8096, 0x83d6, 0x848b, 0x8549, 0x885d, 0x88f3, 0x8a1f, 0x8a3c, 0x8a54, 0x8a73, 0x8c61, 0x8cde, 0x91a4, 0x9266, 0x937e, 0x9418, 0x969c, 0x9798, 0x4e0a, 0x4e08, 0x4e1e, 0x4e57, 0x5197, 0x5270, 0x57ce, 0x5834, 0x58cc, 0x5b22, 0x5e38, 0x60c5, 0x64fe, 0x6761, 0x6756, 0x6d44, 0x72b6, 0x7573, 0x7a63, 0x84b8, 0x8b72, 0x91b8, 0x9320, 0x5631, 0x57f4, 0x98fe, 0x62ed, 0x690d, 0x6b96, 0x71ed, 0x7e54, 0x8077, 0x8272, 0x89e6, 0x98df, 0x8755, 0x8fb1, 0x5c3b, 0x4f38, 0x4fe1, 0x4fb5, 0x5507, 0x5a20, 0x5bdd, 0x5be9, 0x5fc3, 0x614e, 0x632f, 0x65b0, 0x664b, 0x68ee, 0x699b, 0x6d78, 0x6df1, 0x7533, 0x75b9, 0x771f, 0x795e, 0x79e6, 0x7d33, 0x81e3, 0x82af, 0x85aa, 0x89aa, 0x8a3a, 0x8eab, 0x8f9b, 0x9032, 0x91dd, 0x9707, 0x4eba, 0x4ec1, 0x5203, 0x5875, 0x58ec, 0x5c0b, 0x751a, 0x5c3d, 0x814e, 0x8a0a, 0x8fc5, 0x9663, 0x976d, 0x7b25, 0x8acf, 0x9808, 0x9162, 0x56f3, 0x53a8, 0x9017, 0x5439, 0x5782, 0x5e25, 0x63a8, 0x6c34, 0x708a, 0x7761, 0x7c8b, 0x7fe0, 0x8870, 0x9042, 0x9154, 0x9310, 0x9318, 0x968f, 0x745e, 0x9ac4, 0x5d07, 0x5d69, 0x6570, 0x67a2, 0x8da8, 0x96db, 0x636e, 0x6749, 0x6919, 0x83c5, 0x9817, 0x96c0, 0x88fe, 0x6f84, 0x647a, 0x5bf8, 0x4e16, 0x702c, 0x755d, 0x662f, 0x51c4, 0x5236, 0x52e2, 0x59d3, 0x5f81, 0x6027, 0x6210, 0x653f, 0x6574, 0x661f, 0x6674, 0x68f2, 0x6816, 0x6b63, 0x6e05, 0x7272, 0x751f, 0x76db, 0x7cbe, 0x8056, 0x58f0, 0x88fd, 0x897f, 0x8aa0, 0x8a93, 0x8acb, 0x901d, 0x9192, 0x9752, 0x9759, 0x6589, 0x7a0e, 0x8106, 0x96bb, 0x5e2d, 0x60dc, 0x621a, 0x65a5, 0x6614, 0x6790, 0x77f3, 0x7a4d, 0x7c4d, 0x7e3e, 0x810a, 0x8cac, 0x8d64, 0x8de1, 0x8e5f, 0x78a9, 0x5207, 0x62d9, 0x63a5, 0x6442, 0x6298, 0x8a2d, 0x7a83, 0x7bc0, 0x8aac, 0x96ea, 0x7d76, 0x820c, 0x8749, 0x4ed9, 0x5148, 0x5343, 0x5360, 0x5ba3, 0x5c02, 0x5c16, 0x5ddd, 0x6226, 0x6247, 0x64b0, 0x6813, 0x6834, 0x6cc9, 0x6d45, 0x6d17, 0x67d3, 0x6f5c, 0x714e, 0x717d, 0x65cb, 0x7a7f, 0x7bad, 0x7dda, 0x7e4a, 0x7fa8, 0x817a, 0x821b, 0x8239, 0x85a6, 0x8a6e, 0x8cce, 0x8df5, 0x9078, 0x9077, 0x92ad, 0x9291, 0x9583, 0x9bae, 0x524d, 0x5584, 0x6f38, 0x7136, 0x5168, 0x7985, 0x7e55, 0x81b3, 0x7cce, 0x564c, 0x5851, 0x5ca8, 0x63aa, 0x66fe, 0x66fd, 0x695a, 0x72d9, 0x758f, 0x758e, 0x790e, 0x7956, 0x79df, 0x7c97, 0x7d20, 0x7d44, 0x8607, 0x8a34, 0x963b, 0x9061, 0x9f20, 0x50e7, 0x5275, 0x53cc, 0x53e2, 0x5009, 0x55aa, 0x58ee, 0x594f, 0x723d, 0x5b8b, 0x5c64, 0x531d, 0x60e3, 0x60f3, 0x635c, 0x6383, 0x633f, 0x63bb, 0x64cd, 0x65e9, 0x66f9, 0x5de3, 0x69cd, 0x69fd, 0x6f15, 0x71e5, 0x4e89, 0x75e9, 0x76f8, 0x7a93, 0x7cdf, 0x7dcf, 0x7d9c, 0x8061, 0x8349, 0x8358, 0x846c, 0x84bc, 0x85fb, 0x88c5, 0x8d70, 0x9001, 0x906d, 0x9397, 0x971c, 0x9a12, 0x50cf, 0x5897, 0x618e, 0x81d3, 0x8535, 0x8d08, 0x9020, 0x4fc3, 0x5074, 0x5247, 0x5373, 0x606f, 0x6349, 0x675f, 0x6e2c, 0x8db3, 0x901f, 0x4fd7, 0x5c5e, 0x8cca, 0x65cf, 0x7d9a, 0x5352, 0x8896, 0x5176, 0x63c3, 0x5b58, 0x5b6b, 0x5c0a, 0x640d, 0x6751, 0x905c, 0x4ed6, 0x591a, 0x592a, 0x6c70, 0x8a51, 0x553e, 0x5815, 0x59a5, 0x60f0, 0x6253, 0x67c1, 0x8235, 0x6955, 0x9640, 0x99c4, 0x9a28, 0x4f53, 0x5806, 0x5bfe, 0x8010, 0x5cb1, 0x5e2f, 0x5f85, 0x6020, 0x614b, 0x6234, 0x66ff, 0x6cf0, 0x6ede, 0x80ce, 0x817f, 0x82d4, 0x888b, 0x8cb8, 0x9000, 0x902e, 0x968a, 0x9edb, 0x9bdb, 0x4ee3, 0x53f0, 0x5927, 0x7b2c, 0x918d, 0x984c, 0x9df9, 0x6edd, 0x7027, 0x5353, 0x5544, 0x5b85, 0x6258, 0x629e, 0x62d3, 0x6ca2, 0x6fef, 0x7422, 0x8a17, 0x9438, 0x6fc1, 0x8afe, 0x8338, 0x51e7, 0x86f8, 0x53ea, 0x53e9, 0x4f46, 0x9054, 0x8fb0, 0x596a, 0x8131, 0x5dfd, 0x7aea, 0x8fbf, 0x68da, 0x8c37, 0x72f8, 0x9c48, 0x6a3d, 0x8ab0, 0x4e39, 0x5358, 0x5606, 0x5766, 0x62c5, 0x63a2, 0x65e6, 0x6b4e, 0x6de1, 0x6e5b, 0x70ad, 0x77ed, 0x7aef, 0x7baa, 0x7dbb, 0x803d, 0x80c6, 0x86cb, 0x8a95, 0x935b, 0x56e3, 0x58c7, 0x5f3e, 0x65ad, 0x6696, 0x6a80, 0x6bb5, 0x7537, 0x8ac7, 0x5024, 0x77e5, 0x5730, 0x5f1b, 0x6065, 0x667a, 0x6c60, 0x75f4, 0x7a1a, 0x7f6e, 0x81f4, 0x8718, 0x9045, 0x99b3, 0x7bc9, 0x755c, 0x7af9, 0x7b51, 0x84c4, 0x9010, 0x79e9, 0x7a92, 0x8336, 0x5ae1, 0x7740, 0x4e2d, 0x4ef2, 0x5b99, 0x5fe0, 0x62bd, 0x663c, 0x67f1, 0x6ce8, 0x866b, 0x8877, 0x8a3b, 0x914e, 0x92f3, 0x99d0, 0x6a17, 0x7026, 0x732a, 0x82e7, 0x8457, 0x8caf, 0x4e01, 0x5146, 0x51cb, 0x558b, 0x5bf5, 0x5e16, 0x5e33, 0x5e81, 0x5f14, 0x5f35, 0x5f6b, 0x5fb4, 0x61f2, 0x6311, 0x66a2, 0x671d, 0x6f6e, 0x7252, 0x753a, 0x773a, 0x8074, 0x8139, 0x8178, 0x8776, 0x8abf, 0x8adc, 0x8d85, 0x8df3, 0x929a, 0x9577, 0x9802, 0x9ce5, 0x52c5, 0x6357, 0x76f4, 0x6715, 0x6c88, 0x73cd, 0x8cc3, 0x93ae, 0x9673, 0x6d25, 0x589c, 0x690e, 0x69cc, 0x8ffd, 0x939a, 0x75db, 0x901a, 0x585a, 0x6802, 0x63b4, 0x69fb, 0x4f43, 0x6f2c, 0x67d8, 0x8fbb, 0x8526, 0x7db4, 0x9354, 0x693f, 0x6f70, 0x576a, 0x58f7, 0x5b2c, 0x7d2c, 0x722a, 0x540a, 0x91e3, 0x9db4, 0x4ead, 0x4f4e, 0x505c, 0x5075, 0x5243, 0x8c9e, 0x5448, 0x5824, 0x5b9a, 0x5e1d, 0x5e95, 0x5ead, 0x5ef7, 0x5f1f, 0x608c, 0x62b5, 0x633a, 0x63d0, 0x68af, 0x6c40, 0x7887, 0x798e, 0x7a0b, 0x7de0, 0x8247, 0x8a02, 0x8ae6, 0x8e44, 0x9013, 0x90b8, 0x912d, 0x91d8, 0x9f0e, 0x6ce5, 0x6458, 0x64e2, 0x6575, 0x6ef4, 0x7684, 0x7b1b, 0x9069, 0x93d1, 0x6eba, 0x54f2, 0x5fb9, 0x64a4, 0x8f4d, 0x8fed, 0x9244, 0x5178, 0x586b, 0x5929, 0x5c55, 0x5e97, 0x6dfb, 0x7e8f, 0x751c, 0x8cbc, 0x8ee2, 0x985b, 0x70b9, 0x4f1d, 0x6bbf, 0x6fb1, 0x7530, 0x96fb, 0x514e, 0x5410, 0x5835, 0x5857, 0x59ac, 0x5c60, 0x5f92, 0x6597, 0x675c, 0x6e21, 0x767b, 0x83df, 0x8ced, 0x9014, 0x90fd, 0x934d, 0x7825, 0x783a, 0x52aa, 0x5ea6, 0x571f, 0x5974, 0x6012, 0x5012, 0x515a, 0x51ac, 0x51cd, 0x5200, 0x5510, 0x5854, 0x5858, 0x5957, 0x5b95, 0x5cf6, 0x5d8b, 0x60bc, 0x6295, 0x642d, 0x6771, 0x6843, 0x68bc, 0x68df, 0x76d7, 0x6dd8, 0x6e6f, 0x6d9b, 0x706f, 0x71c8, 0x5f53, 0x75d8, 0x7977, 0x7b49, 0x7b54, 0x7b52, 0x7cd6, 0x7d71, 0x5230, 0x8463, 0x8569, 0x85e4, 0x8a0e, 0x8b04, 0x8c46, 0x8e0f, 0x9003, 0x900f, 0x9419, 0x9676, 0x982d, 0x9a30, 0x95d8, 0x50cd, 0x52d5, 0x540c, 0x5802, 0x5c0e, 0x61a7, 0x649e, 0x6d1e, 0x77b3, 0x7ae5, 0x80f4, 0x8404, 0x9053, 0x9285, 0x5ce0, 0x9d07, 0x533f, 0x5f97, 0x5fb3, 0x6d9c, 0x7279, 0x7763, 0x79bf, 0x7be4, 0x6bd2, 0x72ec, 0x8aad, 0x6803, 0x6a61, 0x51f8, 0x7a81, 0x6934, 0x5c4a, 0x9cf6, 0x82eb, 0x5bc5, 0x9149, 0x701e, 0x5678, 0x5c6f, 0x60c7, 0x6566, 0x6c8c, 0x8c5a, 0x9041, 0x9813, 0x5451, 0x66c7, 0x920d, 0x5948, 0x90a3, 0x5185, 0x4e4d, 0x51ea, 0x8599, 0x8b0e, 0x7058, 0x637a, 0x934b, 0x6962, 0x99b4, 0x7e04, 0x7577, 0x5357, 0x6960, 0x8edf, 0x96e3, 0x6c5d, 0x4e8c, 0x5c3c, 0x5f10, 0x8fe9, 0x5302, 0x8cd1, 0x8089, 0x8679, 0x5eff, 0x65e5, 0x4e73, 0x5165, 0x5982, 0x5c3f, 0x97ee, 0x4efb, 0x598a, 0x5fcd, 0x8a8d, 0x6fe1, 0x79b0, 0x7962, 0x5be7, 0x8471, 0x732b, 0x71b1, 0x5e74, 0x5ff5, 0x637b, 0x649a, 0x71c3, 0x7c98, 0x4e43, 0x5efc, 0x4e4b, 0x57dc, 0x56a2, 0x60a9, 0x6fc3, 0x7d0d, 0x80fd, 0x8133, 0x81bf, 0x8fb2, 0x8997, 0x86a4, 0x5df4, 0x628a, 0x64ad, 0x8987, 0x6777, 0x6ce2, 0x6d3e, 0x7436, 0x7834, 0x5a46, 0x7f75, 0x82ad, 0x99ac, 0x4ff3, 0x5ec3, 0x62dd, 0x6392, 0x6557, 0x676f, 0x76c3, 0x724c, 0x80cc, 0x80ba, 0x8f29, 0x914d, 0x500d, 0x57f9, 0x5a92, 0x6885, 0x6973, 0x7164, 0x72fd, 0x8cb7, 0x58f2, 0x8ce0, 0x966a, 0x9019, 0x877f, 0x79e4, 0x77e7, 0x8429, 0x4f2f, 0x5265, 0x535a, 0x62cd, 0x67cf, 0x6cca, 0x767d, 0x7b94, 0x7c95, 0x8236, 0x8584, 0x8feb, 0x66dd, 0x6f20, 0x7206, 0x7e1b, 0x83ab, 0x99c1, 0x9ea6, 0x51fd, 0x7bb1, 0x7872, 0x7bb8, 0x8087, 0x7b48, 0x6ae8, 0x5e61, 0x808c, 0x7551, 0x7560, 0x516b, 0x9262, 0x6e8c, 0x767a, 0x9197, 0x9aea, 0x4f10, 0x7f70, 0x629c, 0x7b4f, 0x95a5, 0x9ce9, 0x567a, 0x5859, 0x86e4, 0x96bc, 0x4f34, 0x5224, 0x534a, 0x53cd, 0x53db, 0x5e06, 0x642c, 0x6591, 0x677f, 0x6c3e, 0x6c4e, 0x7248, 0x72af, 0x73ed, 0x7554, 0x7e41, 0x822c, 0x85e9, 0x8ca9, 0x7bc4, 0x91c6, 0x7169, 0x9812, 0x98ef, 0x633d, 0x6669, 0x756a, 0x76e4, 0x78d0, 0x8543, 0x86ee, 0x532a, 0x5351, 0x5426, 0x5983, 0x5e87, 0x5f7c, 0x60b2, 0x6249, 0x6279, 0x62ab, 0x6590, 0x6bd4, 0x6ccc, 0x75b2, 0x76ae, 0x7891, 0x79d8, 0x7dcb, 0x7f77, 0x80a5, 0x88ab, 0x8ab9, 0x8cbb, 0x907f, 0x975e, 0x98db, 0x6a0b, 0x7c38, 0x5099, 0x5c3e, 0x5fae, 0x6787, 0x6bd8, 0x7435, 0x7709, 0x7f8e, 0x9f3b, 0x67ca, 0x7a17, 0x5339, 0x758b, 0x9aed, 0x5f66, 0x819d, 0x83f1, 0x8098, 0x5f3c, 0x5fc5, 0x7562, 0x7b46, 0x903c, 0x6867, 0x59eb, 0x5a9b, 0x7d10, 0x767e, 0x8b2c, 0x4ff5, 0x5f6a, 0x6a19, 0x6c37, 0x6f02, 0x74e2, 0x7968, 0x8868, 0x8a55, 0x8c79, 0x5edf, 0x63cf, 0x75c5, 0x79d2, 0x82d7, 0x9328, 0x92f2, 0x849c, 0x86ed, 0x9c2d, 0x54c1, 0x5f6c, 0x658c, 0x6d5c, 0x7015, 0x8ca7, 0x8cd3, 0x983b, 0x654f, 0x74f6, 0x4e0d, 0x4ed8, 0x57e0, 0x592b, 0x5a66, 0x5bcc, 0x51a8, 0x5e03, 0x5e9c, 0x6016, 0x6276, 0x6577, 0x65a7, 0x666e, 0x6d6e, 0x7236, 0x7b26, 0x8150, 0x819a, 0x8299, 0x8b5c, 0x8ca0, 0x8ce6, 0x8d74, 0x961c, 0x9644, 0x4fae, 0x64ab, 0x6b66, 0x821e, 0x8461, 0x856a, 0x90e8, 0x5c01, 0x6953, 0x98a8, 0x847a, 0x8557, 0x4f0f, 0x526f, 0x5fa9, 0x5e45, 0x670d, 0x798f, 0x8179, 0x8907, 0x8986, 0x6df5, 0x5f17, 0x6255, 0x6cb8, 0x4ecf, 0x7269, 0x9b92, 0x5206, 0x543b, 0x5674, 0x58b3, 0x61a4, 0x626e, 0x711a, 0x596e, 0x7c89, 0x7cde, 0x7d1b, 0x96f0, 0x6587, 0x805e, 0x4e19, 0x4f75, 0x5175, 0x5840, 0x5e63, 0x5e73, 0x5f0a, 0x67c4, 0x4e26, 0x853d, 0x9589, 0x965b, 0x7c73, 0x9801, 0x50fb, 0x58c1, 0x7656, 0x78a7, 0x5225, 0x77a5, 0x8511, 0x7b86, 0x504f, 0x5909, 0x7247, 0x7bc7, 0x7de8, 0x8fba, 0x8fd4, 0x904d, 0x4fbf, 0x52c9, 0x5a29, 0x5f01, 0x97ad, 0x4fdd, 0x8217, 0x92ea, 0x5703, 0x6355, 0x6b69, 0x752b, 0x88dc, 0x8f14, 0x7a42, 0x52df, 0x5893, 0x6155, 0x620a, 0x66ae, 0x6bcd, 0x7c3f, 0x83e9, 0x5023, 0x4ff8, 0x5305, 0x5446, 0x5831, 0x5949, 0x5b9d, 0x5cf0, 0x5cef, 0x5d29, 0x5e96, 0x62b1, 0x6367, 0x653e, 0x65b9, 0x670b, 0x6cd5, 0x6ce1, 0x70f9, 0x7832, 0x7e2b, 0x80de, 0x82b3, 0x840c, 0x84ec, 0x8702, 0x8912, 0x8a2a, 0x8c4a, 0x90a6, 0x92d2, 0x98fd, 0x9cf3, 0x9d6c, 0x4e4f, 0x4ea1, 0x508d, 0x5256, 0x574a, 0x59a8, 0x5e3d, 0x5fd8, 0x5fd9, 0x623f, 0x66b4, 0x671b, 0x67d0, 0x68d2, 0x5192, 0x7d21, 0x80aa, 0x81a8, 0x8b00, 0x8c8c, 0x8cbf, 0x927e, 0x9632, 0x5420, 0x982c, 0x5317, 0x50d5, 0x535c, 0x58a8, 0x64b2, 0x6734, 0x7267, 0x7766, 0x7a46, 0x91e6, 0x52c3, 0x6ca1, 0x6b86, 0x5800, 0x5e4c, 0x5954, 0x672c, 0x7ffb, 0x51e1, 0x76c6, 0x6469, 0x78e8, 0x9b54, 0x9ebb, 0x57cb, 0x59b9, 0x6627, 0x679a, 0x6bce, 0x54e9, 0x69d9, 0x5e55, 0x819c, 0x6795, 0x9baa, 0x67fe, 0x9c52, 0x685d, 0x4ea6, 0x4fe3, 0x53c8, 0x62b9, 0x672b, 0x6cab, 0x8fc4, 0x4fad, 0x7e6d, 0x9ebf, 0x4e07, 0x6162, 0x6e80, 0x6f2b, 0x8513, 0x5473, 0x672a, 0x9b45, 0x5df3, 0x7b95, 0x5cac, 0x5bc6, 0x871c, 0x6e4a, 0x84d1, 0x7a14, 0x8108, 0x5999, 0x7c8d, 0x6c11, 0x7720, 0x52d9, 0x5922, 0x7121, 0x725f, 0x77db, 0x9727, 0x9d61, 0x690b, 0x5a7f, 0x5a18, 0x51a5, 0x540d, 0x547d, 0x660e, 0x76df, 0x8ff7, 0x9298, 0x9cf4, 0x59ea, 0x725d, 0x6ec5, 0x514d, 0x68c9, 0x7dbf, 0x7dec, 0x9762, 0x9eba, 0x6478, 0x6a21, 0x8302, 0x5984, 0x5b5f, 0x6bdb, 0x731b, 0x76f2, 0x7db2, 0x8017, 0x8499, 0x5132, 0x6728, 0x9ed9, 0x76ee, 0x6762, 0x52ff, 0x9905, 0x5c24, 0x623b, 0x7c7e, 0x8cb0, 0x554f, 0x60b6, 0x7d0b, 0x9580, 0x5301, 0x4e5f, 0x51b6, 0x591c, 0x723a, 0x8036, 0x91ce, 0x5f25, 0x77e2, 0x5384, 0x5f79, 0x7d04, 0x85ac, 0x8a33, 0x8e8d, 0x9756, 0x67f3, 0x85ae, 0x9453, 0x6109, 0x6108, 0x6cb9, 0x7652, 0x8aed, 0x8f38, 0x552f, 0x4f51, 0x512a, 0x52c7, 0x53cb, 0x5ba5, 0x5e7d, 0x60a0, 0x6182, 0x63d6, 0x6709, 0x67da, 0x6e67, 0x6d8c, 0x7336, 0x7337, 0x7531, 0x7950, 0x88d5, 0x8a98, 0x904a, 0x9091, 0x90f5, 0x96c4, 0x878d, 0x5915, 0x4e88, 0x4f59, 0x4e0e, 0x8a89, 0x8f3f, 0x9810, 0x50ad, 0x5e7c, 0x5996, 0x5bb9, 0x5eb8, 0x63da, 0x63fa, 0x64c1, 0x66dc, 0x694a, 0x69d8, 0x6d0b, 0x6eb6, 0x7194, 0x7528, 0x7aaf, 0x7f8a, 0x8000, 0x8449, 0x84c9, 0x8981, 0x8b21, 0x8e0a, 0x9065, 0x967d, 0x990a, 0x617e, 0x6291, 0x6b32, 0x6c83, 0x6d74, 0x7fcc, 0x7ffc, 0x6dc0, 0x7f85, 0x87ba, 0x88f8, 0x6765, 0x83b1, 0x983c, 0x96f7, 0x6d1b, 0x7d61, 0x843d, 0x916a, 0x4e71, 0x5375, 0x5d50, 0x6b04, 0x6feb, 0x85cd, 0x862d, 0x89a7, 0x5229, 0x540f, 0x5c65, 0x674e, 0x68a8, 0x7406, 0x7483, 0x75e2, 0x88cf, 0x88e1, 0x91cc, 0x96e2, 0x9678, 0x5f8b, 0x7387, 0x7acb, 0x844e, 0x63a0, 0x7565, 0x5289, 0x6d41, 0x6e9c, 0x7409, 0x7559, 0x786b, 0x7c92, 0x9686, 0x7adc, 0x9f8d, 0x4fb6, 0x616e, 0x65c5, 0x865c, 0x4e86, 0x4eae, 0x50da, 0x4e21, 0x51cc, 0x5bee, 0x6599, 0x6881, 0x6dbc, 0x731f, 0x7642, 0x77ad, 0x7a1c, 0x7ce7, 0x826f, 0x8ad2, 0x907c, 0x91cf, 0x9675, 0x9818, 0x529b, 0x7dd1, 0x502b, 0x5398, 0x6797, 0x6dcb, 0x71d0, 0x7433, 0x81e8, 0x8f2a, 0x96a3, 0x9c57, 0x9e9f, 0x7460, 0x5841, 0x6d99, 0x7d2f, 0x985e, 0x4ee4, 0x4f36, 0x4f8b, 0x51b7, 0x52b1, 0x5dba, 0x601c, 0x73b2, 0x793c, 0x82d3, 0x9234, 0x96b7, 0x96f6, 0x970a, 0x9e97, 0x9f62, 0x66a6, 0x6b74, 0x5217, 0x52a3, 0x70c8, 0x88c2, 0x5ec9, 0x604b, 0x6190, 0x6f23, 0x7149, 0x7c3e, 0x7df4, 0x806f, 0x84ee, 0x9023, 0x932c, 0x5442, 0x9b6f, 0x6ad3, 0x7089, 0x8cc2, 0x8def, 0x9732, 0x52b4, 0x5a41, 0x5eca, 0x5f04, 0x6717, 0x697c, 0x6994, 0x6d6a, 0x6f0f, 0x7262, 0x72fc, 0x7bed, 0x8001, 0x807e, 0x874b, 0x90ce, 0x516d, 0x9e93, 0x7984, 0x808b, 0x9332, 0x8ad6, 0x502d, 0x548c, 0x8a71, 0x6b6a, 0x8cc4, 0x8107, 0x60d1, 0x67a0, 0x9df2, 0x4e99, 0x4e98, 0x9c10, 0x8a6b, 0x85c1, 0x8568, 0x6900, 0x6e7e, 0x7897, 0x8155, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0xfffd, 0x5f0c, 0x4e10, 0x4e15, 0x4e2a, 0x4e31, 0x4e36, 0x4e3c, 0x4e3f, 0x4e42, 0x4e56, 0x4e58, 0x4e82, 0x4e85, 0x8c6b, 0x4e8a, 0x8212, 0x5f0d, 0x4e8e, 0x4e9e, 0x4e9f, 0x4ea0, 0x4ea2, 0x4eb0, 0x4eb3, 0x4eb6, 0x4ece, 0x4ecd, 0x4ec4, 0x4ec6, 0x4ec2, 0x4ed7, 0x4ede, 0x4eed, 0x4edf, 0x4ef7, 0x4f09, 0x4f5a, 0x4f30, 0x4f5b, 0x4f5d, 0x4f57, 0x4f47, 0x4f76, 0x4f88, 0x4f8f, 0x4f98, 0x4f7b, 0x4f69, 0x4f70, 0x4f91, 0x4f6f, 0x4f86, 0x4f96, 0x5118, 0x4fd4, 0x4fdf, 0x4fce, 0x4fd8, 0x4fdb, 0x4fd1, 0x4fda, 0x4fd0, 0x4fe4, 0x4fe5, 0x501a, 0x5028, 0x5014, 0x502a, 0x5025, 0x5005, 0x4f1c, 0x4ff6, 0x5021, 0x5029, 0x502c, 0x4ffe, 0x4fef, 0x5011, 0x5006, 0x5043, 0x5047, 0x6703, 0x5055, 0x5050, 0x5048, 0x505a, 0x5056, 0x506c, 0x5078, 0x5080, 0x509a, 0x5085, 0x50b4, 0x50b2, 0x50c9, 0x50ca, 0x50b3, 0x50c2, 0x50d6, 0x50de, 0x50e5, 0x50ed, 0x50e3, 0x50ee, 0x50f9, 0x50f5, 0x5109, 0x5101, 0x5102, 0x5116, 0x5115, 0x5114, 0x511a, 0x5121, 0x513a, 0x5137, 0x513c, 0x513b, 0x513f, 0x5140, 0x5152, 0x514c, 0x5154, 0x5162, 0x7af8, 0x5169, 0x516a, 0x516e, 0x5180, 0x5182, 0x56d8, 0x518c, 0x5189, 0x518f, 0x5191, 0x5193, 0x5195, 0x5196, 0x51a4, 0x51a6, 0x51a2, 0x51a9, 0x51aa, 0x51ab, 0x51b3, 0x51b1, 0x51b2, 0x51b0, 0x51b5, 0x51bd, 0x51c5, 0x51c9, 0x51db, 0x51e0, 0x8655, 0x51e9, 0x51ed, 0x51f0, 0x51f5, 0x51fe, 0x5204, 0x520b, 0x5214, 0x520e, 0x5227, 0x522a, 0x522e, 0x5233, 0x5239, 0x524f, 0x5244, 0x524b, 0x524c, 0x525e, 0x5254, 0x526a, 0x5274, 0x5269, 0x5273, 0x527f, 0x527d, 0x528d, 0x5294, 0x5292, 0x5271, 0x5288, 0x5291, 0x8fa8, 0x8fa7, 0x52ac, 0x52ad, 0x52bc, 0x52b5, 0x52c1, 0x52cd, 0x52d7, 0x52de, 0x52e3, 0x52e6, 0x98ed, 0x52e0, 0x52f3, 0x52f5, 0x52f8, 0x52f9, 0x5306, 0x5308, 0x7538, 0x530d, 0x5310, 0x530f, 0x5315, 0x531a, 0x5323, 0x532f, 0x5331, 0x5333, 0x5338, 0x5340, 0x5346, 0x5345, 0x4e17, 0x5349, 0x534d, 0x51d6, 0x535e, 0x5369, 0x536e, 0x5918, 0x537b, 0x5377, 0x5382, 0x5396, 0x53a0, 0x53a6, 0x53a5, 0x53ae, 0x53b0, 0x53b6, 0x53c3, 0x7c12, 0x96d9, 0x53df, 0x66fc, 0x71ee, 0x53ee, 0x53e8, 0x53ed, 0x53fa, 0x5401, 0x543d, 0x5440, 0x542c, 0x542d, 0x543c, 0x542e, 0x5436, 0x5429, 0x541d, 0x544e, 0x548f, 0x5475, 0x548e, 0x545f, 0x5471, 0x5477, 0x5470, 0x5492, 0x547b, 0x5480, 0x5476, 0x5484, 0x5490, 0x5486, 0x54c7, 0x54a2, 0x54b8, 0x54a5, 0x54ac, 0x54c4, 0x54c8, 0x54a8, 0x54ab, 0x54c2, 0x54a4, 0x54be, 0x54bc, 0x54d8, 0x54e5, 0x54e6, 0x550f, 0x5514, 0x54fd, 0x54ee, 0x54ed, 0x54fa, 0x54e2, 0x5539, 0x5540, 0x5563, 0x554c, 0x552e, 0x555c, 0x5545, 0x5556, 0x5557, 0x5538, 0x5533, 0x555d, 0x5599, 0x5580, 0x54af, 0x558a, 0x559f, 0x557b, 0x557e, 0x5598, 0x559e, 0x55ae, 0x557c, 0x5583, 0x55a9, 0x5587, 0x55a8, 0x55da, 0x55c5, 0x55df, 0x55c4, 0x55dc, 0x55e4, 0x55d4, 0x5614, 0x55f7, 0x5616, 0x55fe, 0x55fd, 0x561b, 0x55f9, 0x564e, 0x5650, 0x71df, 0x5634, 0x5636, 0x5632, 0x5638, 0x566b, 0x5664, 0x562f, 0x566c, 0x566a, 0x5686, 0x5680, 0x568a, 0x56a0, 0x5694, 0x568f, 0x56a5, 0x56ae, 0x56b6, 0x56b4, 0x56c2, 0x56bc, 0x56c1, 0x56c3, 0x56c0, 0x56c8, 0x56ce, 0x56d1, 0x56d3, 0x56d7, 0x56ee, 0x56f9, 0x5700, 0x56ff, 0x5704, 0x5709, 0x5708, 0x570b, 0x570d, 0x5713, 0x5718, 0x5716, 0x55c7, 0x571c, 0x5726, 0x5737, 0x5738, 0x574e, 0x573b, 0x5740, 0x574f, 0x5769, 0x57c0, 0x5788, 0x5761, 0x577f, 0x5789, 0x5793, 0x57a0, 0x57b3, 0x57a4, 0x57aa, 0x57b0, 0x57c3, 0x57c6, 0x57d4, 0x57d2, 0x57d3, 0x580a, 0x57d6, 0x57e3, 0x580b, 0x5819, 0x581d, 0x5872, 0x5821, 0x5862, 0x584b, 0x5870, 0x6bc0, 0x5852, 0x583d, 0x5879, 0x5885, 0x58b9, 0x589f, 0x58ab, 0x58ba, 0x58de, 0x58bb, 0x58b8, 0x58ae, 0x58c5, 0x58d3, 0x58d1, 0x58d7, 0x58d9, 0x58d8, 0x58e5, 0x58dc, 0x58e4, 0x58df, 0x58ef, 0x58fa, 0x58f9, 0x58fb, 0x58fc, 0x58fd, 0x5902, 0x590a, 0x5910, 0x591b, 0x68a6, 0x5925, 0x592c, 0x592d, 0x5932, 0x5938, 0x593e, 0x7ad2, 0x5955, 0x5950, 0x594e, 0x595a, 0x5958, 0x5962, 0x5960, 0x5967, 0x596c, 0x5969, 0x5978, 0x5981, 0x599d, 0x4f5e, 0x4fab, 0x59a3, 0x59b2, 0x59c6, 0x59e8, 0x59dc, 0x598d, 0x59d9, 0x59da, 0x5a25, 0x5a1f, 0x5a11, 0x5a1c, 0x5a09, 0x5a1a, 0x5a40, 0x5a6c, 0x5a49, 0x5a35, 0x5a36, 0x5a62, 0x5a6a, 0x5a9a, 0x5abc, 0x5abe, 0x5acb, 0x5ac2, 0x5abd, 0x5ae3, 0x5ad7, 0x5ae6, 0x5ae9, 0x5ad6, 0x5afa, 0x5afb, 0x5b0c, 0x5b0b, 0x5b16, 0x5b32, 0x5ad0, 0x5b2a, 0x5b36, 0x5b3e, 0x5b43, 0x5b45, 0x5b40, 0x5b51, 0x5b55, 0x5b5a, 0x5b5b, 0x5b65, 0x5b69, 0x5b70, 0x5b73, 0x5b75, 0x5b78, 0x6588, 0x5b7a, 0x5b80, 0x5b83, 0x5ba6, 0x5bb8, 0x5bc3, 0x5bc7, 0x5bc9, 0x5bd4, 0x5bd0, 0x5be4, 0x5be6, 0x5be2, 0x5bde, 0x5be5, 0x5beb, 0x5bf0, 0x5bf6, 0x5bf3, 0x5c05, 0x5c07, 0x5c08, 0x5c0d, 0x5c13, 0x5c20, 0x5c22, 0x5c28, 0x5c38, 0x5c39, 0x5c41, 0x5c46, 0x5c4e, 0x5c53, 0x5c50, 0x5c4f, 0x5b71, 0x5c6c, 0x5c6e, 0x4e62, 0x5c76, 0x5c79, 0x5c8c, 0x5c91, 0x5c94, 0x599b, 0x5cab, 0x5cbb, 0x5cb6, 0x5cbc, 0x5cb7, 0x5cc5, 0x5cbe, 0x5cc7, 0x5cd9, 0x5ce9, 0x5cfd, 0x5cfa, 0x5ced, 0x5d8c, 0x5cea, 0x5d0b, 0x5d15, 0x5d17, 0x5d5c, 0x5d1f, 0x5d1b, 0x5d11, 0x5d14, 0x5d22, 0x5d1a, 0x5d19, 0x5d18, 0x5d4c, 0x5d52, 0x5d4e, 0x5d4b, 0x5d6c, 0x5d73, 0x5d76, 0x5d87, 0x5d84, 0x5d82, 0x5da2, 0x5d9d, 0x5dac, 0x5dae, 0x5dbd, 0x5d90, 0x5db7, 0x5dbc, 0x5dc9, 0x5dcd, 0x5dd3, 0x5dd2, 0x5dd6, 0x5ddb, 0x5deb, 0x5df2, 0x5df5, 0x5e0b, 0x5e1a, 0x5e19, 0x5e11, 0x5e1b, 0x5e36, 0x5e37, 0x5e44, 0x5e43, 0x5e40, 0x5e4e, 0x5e57, 0x5e54, 0x5e5f, 0x5e62, 0x5e64, 0x5e47, 0x5e75, 0x5e76, 0x5e7a, 0x9ebc, 0x5e7f, 0x5ea0, 0x5ec1, 0x5ec2, 0x5ec8, 0x5ed0, 0x5ecf, 0x5ed6, 0x5ee3, 0x5edd, 0x5eda, 0x5edb, 0x5ee2, 0x5ee1, 0x5ee8, 0x5ee9, 0x5eec, 0x5ef1, 0x5ef3, 0x5ef0, 0x5ef4, 0x5ef8, 0x5efe, 0x5f03, 0x5f09, 0x5f5d, 0x5f5c, 0x5f0b, 0x5f11, 0x5f16, 0x5f29, 0x5f2d, 0x5f38, 0x5f41, 0x5f48, 0x5f4c, 0x5f4e, 0x5f2f, 0x5f51, 0x5f56, 0x5f57, 0x5f59, 0x5f61, 0x5f6d, 0x5f73, 0x5f77, 0x5f83, 0x5f82, 0x5f7f, 0x5f8a, 0x5f88, 0x5f91, 0x5f87, 0x5f9e, 0x5f99, 0x5f98, 0x5fa0, 0x5fa8, 0x5fad, 0x5fbc, 0x5fd6, 0x5ffb, 0x5fe4, 0x5ff8, 0x5ff1, 0x5fdd, 0x60b3, 0x5fff, 0x6021, 0x6060, 0x6019, 0x6010, 0x6029, 0x600e, 0x6031, 0x601b, 0x6015, 0x602b, 0x6026, 0x600f, 0x603a, 0x605a, 0x6041, 0x606a, 0x6077, 0x605f, 0x604a, 0x6046, 0x604d, 0x6063, 0x6043, 0x6064, 0x6042, 0x606c, 0x606b, 0x6059, 0x6081, 0x608d, 0x60e7, 0x6083, 0x609a, 0x6084, 0x609b, 0x6096, 0x6097, 0x6092, 0x60a7, 0x608b, 0x60e1, 0x60b8, 0x60e0, 0x60d3, 0x60b4, 0x5ff0, 0x60bd, 0x60c6, 0x60b5, 0x60d8, 0x614d, 0x6115, 0x6106, 0x60f6, 0x60f7, 0x6100, 0x60f4, 0x60fa, 0x6103, 0x6121, 0x60fb, 0x60f1, 0x610d, 0x610e, 0x6147, 0x613e, 0x6128, 0x6127, 0x614a, 0x613f, 0x613c, 0x612c, 0x6134, 0x613d, 0x6142, 0x6144, 0x6173, 0x6177, 0x6158, 0x6159, 0x615a, 0x616b, 0x6174, 0x616f, 0x6165, 0x6171, 0x615f, 0x615d, 0x6153, 0x6175, 0x6199, 0x6196, 0x6187, 0x61ac, 0x6194, 0x619a, 0x618a, 0x6191, 0x61ab, 0x61ae, 0x61cc, 0x61ca, 0x61c9, 0x61f7, 0x61c8, 0x61c3, 0x61c6, 0x61ba, 0x61cb, 0x7f79, 0x61cd, 0x61e6, 0x61e3, 0x61f6, 0x61fa, 0x61f4, 0x61ff, 0x61fd, 0x61fc, 0x61fe, 0x6200, 0x6208, 0x6209, 0x620d, 0x620c, 0x6214, 0x621b, 0x621e, 0x6221, 0x622a, 0x622e, 0x6230, 0x6232, 0x6233, 0x6241, 0x624e, 0x625e, 0x6263, 0x625b, 0x6260, 0x6268, 0x627c, 0x6282, 0x6289, 0x627e, 0x6292, 0x6293, 0x6296, 0x62d4, 0x6283, 0x6294, 0x62d7, 0x62d1, 0x62bb, 0x62cf, 0x62ff, 0x62c6, 0x64d4, 0x62c8, 0x62dc, 0x62cc, 0x62ca, 0x62c2, 0x62c7, 0x629b, 0x62c9, 0x630c, 0x62ee, 0x62f1, 0x6327, 0x6302, 0x6308, 0x62ef, 0x62f5, 0x6350, 0x633e, 0x634d, 0x641c, 0x634f, 0x6396, 0x638e, 0x6380, 0x63ab, 0x6376, 0x63a3, 0x638f, 0x6389, 0x639f, 0x63b5, 0x636b, 0x6369, 0x63be, 0x63e9, 0x63c0, 0x63c6, 0x63e3, 0x63c9, 0x63d2, 0x63f6, 0x63c4, 0x6416, 0x6434, 0x6406, 0x6413, 0x6426, 0x6436, 0x651d, 0x6417, 0x6428, 0x640f, 0x6467, 0x646f, 0x6476, 0x644e, 0x652a, 0x6495, 0x6493, 0x64a5, 0x64a9, 0x6488, 0x64bc, 0x64da, 0x64d2, 0x64c5, 0x64c7, 0x64bb, 0x64d8, 0x64c2, 0x64f1, 0x64e7, 0x8209, 0x64e0, 0x64e1, 0x62ac, 0x64e3, 0x64ef, 0x652c, 0x64f6, 0x64f4, 0x64f2, 0x64fa, 0x6500, 0x64fd, 0x6518, 0x651c, 0x6505, 0x6524, 0x6523, 0x652b, 0x6534, 0x6535, 0x6537, 0x6536, 0x6538, 0x754b, 0x6548, 0x6556, 0x6555, 0x654d, 0x6558, 0x655e, 0x655d, 0x6572, 0x6578, 0x6582, 0x6583, 0x8b8a, 0x659b, 0x659f, 0x65ab, 0x65b7, 0x65c3, 0x65c6, 0x65c1, 0x65c4, 0x65cc, 0x65d2, 0x65db, 0x65d9, 0x65e0, 0x65e1, 0x65f1, 0x6772, 0x660a, 0x6603, 0x65fb, 0x6773, 0x6635, 0x6636, 0x6634, 0x661c, 0x664f, 0x6644, 0x6649, 0x6641, 0x665e, 0x665d, 0x6664, 0x6667, 0x6668, 0x665f, 0x6662, 0x6670, 0x6683, 0x6688, 0x668e, 0x6689, 0x6684, 0x6698, 0x669d, 0x66c1, 0x66b9, 0x66c9, 0x66be, 0x66bc, 0x66c4, 0x66b8, 0x66d6, 0x66da, 0x66e0, 0x663f, 0x66e6, 0x66e9, 0x66f0, 0x66f5, 0x66f7, 0x670f, 0x6716, 0x671e, 0x6726, 0x6727, 0x9738, 0x672e, 0x673f, 0x6736, 0x6741, 0x6738, 0x6737, 0x6746, 0x675e, 0x6760, 0x6759, 0x6763, 0x6764, 0x6789, 0x6770, 0x67a9, 0x677c, 0x676a, 0x678c, 0x678b, 0x67a6, 0x67a1, 0x6785, 0x67b7, 0x67ef, 0x67b4, 0x67ec, 0x67b3, 0x67e9, 0x67b8, 0x67e4, 0x67de, 0x67dd, 0x67e2, 0x67ee, 0x67b9, 0x67ce, 0x67c6, 0x67e7, 0x6a9c, 0x681e, 0x6846, 0x6829, 0x6840, 0x684d, 0x6832, 0x684e, 0x68b3, 0x682b, 0x6859, 0x6863, 0x6877, 0x687f, 0x689f, 0x688f, 0x68ad, 0x6894, 0x689d, 0x689b, 0x6883, 0x6aae, 0x68b9, 0x6874, 0x68b5, 0x68a0, 0x68ba, 0x690f, 0x688d, 0x687e, 0x6901, 0x68ca, 0x6908, 0x68d8, 0x6922, 0x6926, 0x68e1, 0x690c, 0x68cd, 0x68d4, 0x68e7, 0x68d5, 0x6936, 0x6912, 0x6904, 0x68d7, 0x68e3, 0x6925, 0x68f9, 0x68e0, 0x68ef, 0x6928, 0x692a, 0x691a, 0x6923, 0x6921, 0x68c6, 0x6979, 0x6977, 0x695c, 0x6978, 0x696b, 0x6954, 0x697e, 0x696e, 0x6939, 0x6974, 0x693d, 0x6959, 0x6930, 0x6961, 0x695e, 0x695d, 0x6981, 0x696a, 0x69b2, 0x69ae, 0x69d0, 0x69bf, 0x69c1, 0x69d3, 0x69be, 0x69ce, 0x5be8, 0x69ca, 0x69dd, 0x69bb, 0x69c3, 0x69a7, 0x6a2e, 0x6991, 0x69a0, 0x699c, 0x6995, 0x69b4, 0x69de, 0x69e8, 0x6a02, 0x6a1b, 0x69ff, 0x6b0a, 0x69f9, 0x69f2, 0x69e7, 0x6a05, 0x69b1, 0x6a1e, 0x69ed, 0x6a14, 0x69eb, 0x6a0a, 0x6a12, 0x6ac1, 0x6a23, 0x6a13, 0x6a44, 0x6a0c, 0x6a72, 0x6a36, 0x6a78, 0x6a47, 0x6a62, 0x6a59, 0x6a66, 0x6a48, 0x6a38, 0x6a22, 0x6a90, 0x6a8d, 0x6aa0, 0x6a84, 0x6aa2, 0x6aa3, 0x6a97, 0x8617, 0x6abb, 0x6ac3, 0x6ac2, 0x6ab8, 0x6ab3, 0x6aac, 0x6ade, 0x6ad1, 0x6adf, 0x6aaa, 0x6ada, 0x6aea, 0x6afb, 0x6b05, 0x8616, 0x6afa, 0x6b12, 0x6b16, 0x9b31, 0x6b1f, 0x6b38, 0x6b37, 0x76dc, 0x6b39, 0x98ee, 0x6b47, 0x6b43, 0x6b49, 0x6b50, 0x6b59, 0x6b54, 0x6b5b, 0x6b5f, 0x6b61, 0x6b78, 0x6b79, 0x6b7f, 0x6b80, 0x6b84, 0x6b83, 0x6b8d, 0x6b98, 0x6b95, 0x6b9e, 0x6ba4, 0x6baa, 0x6bab, 0x6baf, 0x6bb2, 0x6bb1, 0x6bb3, 0x6bb7, 0x6bbc, 0x6bc6, 0x6bcb, 0x6bd3, 0x6bdf, 0x6bec, 0x6beb, 0x6bf3, 0x6bef, 0x9ebe, 0x6c08, 0x6c13, 0x6c14, 0x6c1b, 0x6c24, 0x6c23, 0x6c5e, 0x6c55, 0x6c62, 0x6c6a, 0x6c82, 0x6c8d, 0x6c9a, 0x6c81, 0x6c9b, 0x6c7e, 0x6c68, 0x6c73, 0x6c92, 0x6c90, 0x6cc4, 0x6cf1, 0x6cd3, 0x6cbd, 0x6cd7, 0x6cc5, 0x6cdd, 0x6cae, 0x6cb1, 0x6cbe, 0x6cba, 0x6cdb, 0x6cef, 0x6cd9, 0x6cea, 0x6d1f, 0x884d, 0x6d36, 0x6d2b, 0x6d3d, 0x6d38, 0x6d19, 0x6d35, 0x6d33, 0x6d12, 0x6d0c, 0x6d63, 0x6d93, 0x6d64, 0x6d5a, 0x6d79, 0x6d59, 0x6d8e, 0x6d95, 0x6fe4, 0x6d85, 0x6df9, 0x6e15, 0x6e0a, 0x6db5, 0x6dc7, 0x6de6, 0x6db8, 0x6dc6, 0x6dec, 0x6dde, 0x6dcc, 0x6de8, 0x6dd2, 0x6dc5, 0x6dfa, 0x6dd9, 0x6de4, 0x6dd5, 0x6dea, 0x6dee, 0x6e2d, 0x6e6e, 0x6e2e, 0x6e19, 0x6e72, 0x6e5f, 0x6e3e, 0x6e23, 0x6e6b, 0x6e2b, 0x6e76, 0x6e4d, 0x6e1f, 0x6e43, 0x6e3a, 0x6e4e, 0x6e24, 0x6eff, 0x6e1d, 0x6e38, 0x6e82, 0x6eaa, 0x6e98, 0x6ec9, 0x6eb7, 0x6ed3, 0x6ebd, 0x6eaf, 0x6ec4, 0x6eb2, 0x6ed4, 0x6ed5, 0x6e8f, 0x6ea5, 0x6ec2, 0x6e9f, 0x6f41, 0x6f11, 0x704c, 0x6eec, 0x6ef8, 0x6efe, 0x6f3f, 0x6ef2, 0x6f31, 0x6eef, 0x6f32, 0x6ecc, 0x6f3e, 0x6f13, 0x6ef7, 0x6f86, 0x6f7a, 0x6f78, 0x6f81, 0x6f80, 0x6f6f, 0x6f5b, 0x6ff3, 0x6f6d, 0x6f82, 0x6f7c, 0x6f58, 0x6f8e, 0x6f91, 0x6fc2, 0x6f66, 0x6fb3, 0x6fa3, 0x6fa1, 0x6fa4, 0x6fb9, 0x6fc6, 0x6faa, 0x6fdf, 0x6fd5, 0x6fec, 0x6fd4, 0x6fd8, 0x6ff1, 0x6fee, 0x6fdb, 0x7009, 0x700b, 0x6ffa, 0x7011, 0x7001, 0x700f, 0x6ffe, 0x701b, 0x701a, 0x6f74, 0x701d, 0x7018, 0x701f, 0x7030, 0x703e, 0x7032, 0x7051, 0x7063, 0x7099, 0x7092, 0x70af, 0x70f1, 0x70ac, 0x70b8, 0x70b3, 0x70ae, 0x70df, 0x70cb, 0x70dd, 0x70d9, 0x7109, 0x70fd, 0x711c, 0x7119, 0x7165, 0x7155, 0x7188, 0x7166, 0x7162, 0x714c, 0x7156, 0x716c, 0x718f, 0x71fb, 0x7184, 0x7195, 0x71a8, 0x71ac, 0x71d7, 0x71b9, 0x71be, 0x71d2, 0x71c9, 0x71d4, 0x71ce, 0x71e0, 0x71ec, 0x71e7, 0x71f5, 0x71fc, 0x71f9, 0x71ff, 0x720d, 0x7210, 0x721b, 0x7228, 0x722d, 0x722c, 0x7230, 0x7232, 0x723b, 0x723c, 0x723f, 0x7240, 0x7246, 0x724b, 0x7258, 0x7274, 0x727e, 0x7282, 0x7281, 0x7287, 0x7292, 0x7296, 0x72a2, 0x72a7, 0x72b9, 0x72b2, 0x72c3, 0x72c6, 0x72c4, 0x72ce, 0x72d2, 0x72e2, 0x72e0, 0x72e1, 0x72f9, 0x72f7, 0x500f, 0x7317, 0x730a, 0x731c, 0x7316, 0x731d, 0x7334, 0x732f, 0x7329, 0x7325, 0x733e, 0x734e, 0x734f, 0x9ed8, 0x7357, 0x736a, 0x7368, 0x7370, 0x7378, 0x7375, 0x737b, 0x737a, 0x73c8, 0x73b3, 0x73ce, 0x73bb, 0x73c0, 0x73e5, 0x73ee, 0x73de, 0x74a2, 0x7405, 0x746f, 0x7425, 0x73f8, 0x7432, 0x743a, 0x7455, 0x743f, 0x745f, 0x7459, 0x7441, 0x745c, 0x7469, 0x7470, 0x7463, 0x746a, 0x7476, 0x747e, 0x748b, 0x749e, 0x74a7, 0x74ca, 0x74cf, 0x74d4, 0x73f1, 0x74e0, 0x74e3, 0x74e7, 0x74e9, 0x74ee, 0x74f2, 0x74f0, 0x74f1, 0x74f8, 0x74f7, 0x7504, 0x7503, 0x7505, 0x750c, 0x750e, 0x750d, 0x7515, 0x7513, 0x751e, 0x7526, 0x752c, 0x753c, 0x7544, 0x754d, 0x754a, 0x7549, 0x755b, 0x7546, 0x755a, 0x7569, 0x7564, 0x7567, 0x756b, 0x756d, 0x7578, 0x7576, 0x7586, 0x7587, 0x7574, 0x758a, 0x7589, 0x7582, 0x7594, 0x759a, 0x759d, 0x75a5, 0x75a3, 0x75c2, 0x75b3, 0x75c3, 0x75b5, 0x75bd, 0x75b8, 0x75bc, 0x75b1, 0x75cd, 0x75ca, 0x75d2, 0x75d9, 0x75e3, 0x75de, 0x75fe, 0x75ff, 0x75fc, 0x7601, 0x75f0, 0x75fa, 0x75f2, 0x75f3, 0x760b, 0x760d, 0x7609, 0x761f, 0x7627, 0x7620, 0x7621, 0x7622, 0x7624, 0x7634, 0x7630, 0x763b, 0x7647, 0x7648, 0x7646, 0x765c, 0x7658, 0x7661, 0x7662, 0x7668, 0x7669, 0x766a, 0x7667, 0x766c, 0x7670, 0x7672, 0x7676, 0x7678, 0x767c, 0x7680, 0x7683, 0x7688, 0x768b, 0x768e, 0x7696, 0x7693, 0x7699, 0x769a, 0x76b0, 0x76b4, 0x76b8, 0x76b9, 0x76ba, 0x76c2, 0x76cd, 0x76d6, 0x76d2, 0x76de, 0x76e1, 0x76e5, 0x76e7, 0x76ea, 0x862f, 0x76fb, 0x7708, 0x7707, 0x7704, 0x7729, 0x7724, 0x771e, 0x7725, 0x7726, 0x771b, 0x7737, 0x7738, 0x7747, 0x775a, 0x7768, 0x776b, 0x775b, 0x7765, 0x777f, 0x777e, 0x7779, 0x778e, 0x778b, 0x7791, 0x77a0, 0x779e, 0x77b0, 0x77b6, 0x77b9, 0x77bf, 0x77bc, 0x77bd, 0x77bb, 0x77c7, 0x77cd, 0x77d7, 0x77da, 0x77dc, 0x77e3, 0x77ee, 0x77fc, 0x780c, 0x7812, 0x7926, 0x7820, 0x792a, 0x7845, 0x788e, 0x7874, 0x7886, 0x787c, 0x789a, 0x788c, 0x78a3, 0x78b5, 0x78aa, 0x78af, 0x78d1, 0x78c6, 0x78cb, 0x78d4, 0x78be, 0x78bc, 0x78c5, 0x78ca, 0x78ec, 0x78e7, 0x78da, 0x78fd, 0x78f4, 0x7907, 0x7912, 0x7911, 0x7919, 0x792c, 0x792b, 0x7940, 0x7960, 0x7957, 0x795f, 0x795a, 0x7955, 0x7953, 0x797a, 0x797f, 0x798a, 0x799d, 0x79a7, 0x9f4b, 0x79aa, 0x79ae, 0x79b3, 0x79b9, 0x79ba, 0x79c9, 0x79d5, 0x79e7, 0x79ec, 0x79e1, 0x79e3, 0x7a08, 0x7a0d, 0x7a18, 0x7a19, 0x7a20, 0x7a1f, 0x7980, 0x7a31, 0x7a3b, 0x7a3e, 0x7a37, 0x7a43, 0x7a57, 0x7a49, 0x7a61, 0x7a62, 0x7a69, 0x9f9d, 0x7a70, 0x7a79, 0x7a7d, 0x7a88, 0x7a97, 0x7a95, 0x7a98, 0x7a96, 0x7aa9, 0x7ac8, 0x7ab0, 0x7ab6, 0x7ac5, 0x7ac4, 0x7abf, 0x9083, 0x7ac7, 0x7aca, 0x7acd, 0x7acf, 0x7ad5, 0x7ad3, 0x7ad9, 0x7ada, 0x7add, 0x7ae1, 0x7ae2, 0x7ae6, 0x7aed, 0x7af0, 0x7b02, 0x7b0f, 0x7b0a, 0x7b06, 0x7b33, 0x7b18, 0x7b19, 0x7b1e, 0x7b35, 0x7b28, 0x7b36, 0x7b50, 0x7b7a, 0x7b04, 0x7b4d, 0x7b0b, 0x7b4c, 0x7b45, 0x7b75, 0x7b65, 0x7b74, 0x7b67, 0x7b70, 0x7b71, 0x7b6c, 0x7b6e, 0x7b9d, 0x7b98, 0x7b9f, 0x7b8d, 0x7b9c, 0x7b9a, 0x7b8b, 0x7b92, 0x7b8f, 0x7b5d, 0x7b99, 0x7bcb, 0x7bc1, 0x7bcc, 0x7bcf, 0x7bb4, 0x7bc6, 0x7bdd, 0x7be9, 0x7c11, 0x7c14, 0x7be6, 0x7be5, 0x7c60, 0x7c00, 0x7c07, 0x7c13, 0x7bf3, 0x7bf7, 0x7c17, 0x7c0d, 0x7bf6, 0x7c23, 0x7c27, 0x7c2a, 0x7c1f, 0x7c37, 0x7c2b, 0x7c3d, 0x7c4c, 0x7c43, 0x7c54, 0x7c4f, 0x7c40, 0x7c50, 0x7c58, 0x7c5f, 0x7c64, 0x7c56, 0x7c65, 0x7c6c, 0x7c75, 0x7c83, 0x7c90, 0x7ca4, 0x7cad, 0x7ca2, 0x7cab, 0x7ca1, 0x7ca8, 0x7cb3, 0x7cb2, 0x7cb1, 0x7cae, 0x7cb9, 0x7cbd, 0x7cc0, 0x7cc5, 0x7cc2, 0x7cd8, 0x7cd2, 0x7cdc, 0x7ce2, 0x9b3b, 0x7cef, 0x7cf2, 0x7cf4, 0x7cf6, 0x7cfa, 0x7d06, 0x7d02, 0x7d1c, 0x7d15, 0x7d0a, 0x7d45, 0x7d4b, 0x7d2e, 0x7d32, 0x7d3f, 0x7d35, 0x7d46, 0x7d73, 0x7d56, 0x7d4e, 0x7d72, 0x7d68, 0x7d6e, 0x7d4f, 0x7d63, 0x7d93, 0x7d89, 0x7d5b, 0x7d8f, 0x7d7d, 0x7d9b, 0x7dba, 0x7dae, 0x7da3, 0x7db5, 0x7dc7, 0x7dbd, 0x7dab, 0x7e3d, 0x7da2, 0x7daf, 0x7ddc, 0x7db8, 0x7d9f, 0x7db0, 0x7dd8, 0x7ddd, 0x7de4, 0x7dde, 0x7dfb, 0x7df2, 0x7de1, 0x7e05, 0x7e0a, 0x7e23, 0x7e21, 0x7e12, 0x7e31, 0x7e1f, 0x7e09, 0x7e0b, 0x7e22, 0x7e46, 0x7e66, 0x7e3b, 0x7e35, 0x7e39, 0x7e43, 0x7e37, 0x7e32, 0x7e3a, 0x7e67, 0x7e5d, 0x7e56, 0x7e5e, 0x7e59, 0x7e5a, 0x7e79, 0x7e6a, 0x7e69, 0x7e7c, 0x7e7b, 0x7e83, 0x7dd5, 0x7e7d, 0x8fae, 0x7e7f, 0x7e88, 0x7e89, 0x7e8c, 0x7e92, 0x7e90, 0x7e93, 0x7e94, 0x7e96, 0x7e8e, 0x7e9b, 0x7e9c, 0x7f38, 0x7f3a, 0x7f45, 0x7f4c, 0x7f4d, 0x7f4e, 0x7f50, 0x7f51, 0x7f55, 0x7f54, 0x7f58, 0x7f5f, 0x7f60, 0x7f68, 0x7f69, 0x7f67, 0x7f78, 0x7f82, 0x7f86, 0x7f83, 0x7f88, 0x7f87, 0x7f8c, 0x7f94, 0x7f9e, 0x7f9d, 0x7f9a, 0x7fa3, 0x7faf, 0x7fb2, 0x7fb9, 0x7fae, 0x7fb6, 0x7fb8, 0x8b71, 0x7fc5, 0x7fc6, 0x7fca, 0x7fd5, 0x7fd4, 0x7fe1, 0x7fe6, 0x7fe9, 0x7ff3, 0x7ff9, 0x98dc, 0x8006, 0x8004, 0x800b, 0x8012, 0x8018, 0x8019, 0x801c, 0x8021, 0x8028, 0x803f, 0x803b, 0x804a, 0x8046, 0x8052, 0x8058, 0x805a, 0x805f, 0x8062, 0x8068, 0x8073, 0x8072, 0x8070, 0x8076, 0x8079, 0x807d, 0x807f, 0x8084, 0x8086, 0x8085, 0x809b, 0x8093, 0x809a, 0x80ad, 0x5190, 0x80ac, 0x80db, 0x80e5, 0x80d9, 0x80dd, 0x80c4, 0x80da, 0x80d6, 0x8109, 0x80ef, 0x80f1, 0x811b, 0x8129, 0x8123, 0x812f, 0x814b, 0x968b, 0x8146, 0x813e, 0x8153, 0x8151, 0x80fc, 0x8171, 0x816e, 0x8165, 0x8166, 0x8174, 0x8183, 0x8188, 0x818a, 0x8180, 0x8182, 0x81a0, 0x8195, 0x81a4, 0x81a3, 0x815f, 0x8193, 0x81a9, 0x81b0, 0x81b5, 0x81be, 0x81b8, 0x81bd, 0x81c0, 0x81c2, 0x81ba, 0x81c9, 0x81cd, 0x81d1, 0x81d9, 0x81d8, 0x81c8, 0x81da, 0x81df, 0x81e0, 0x81e7, 0x81fa, 0x81fb, 0x81fe, 0x8201, 0x8202, 0x8205, 0x8207, 0x820a, 0x820d, 0x8210, 0x8216, 0x8229, 0x822b, 0x8238, 0x8233, 0x8240, 0x8259, 0x8258, 0x825d, 0x825a, 0x825f, 0x8264, 0x8262, 0x8268, 0x826a, 0x826b, 0x822e, 0x8271, 0x8277, 0x8278, 0x827e, 0x828d, 0x8292, 0x82ab, 0x829f, 0x82bb, 0x82ac, 0x82e1, 0x82e3, 0x82df, 0x82d2, 0x82f4, 0x82f3, 0x82fa, 0x8393, 0x8303, 0x82fb, 0x82f9, 0x82de, 0x8306, 0x82dc, 0x8309, 0x82d9, 0x8335, 0x8334, 0x8316, 0x8332, 0x8331, 0x8340, 0x8339, 0x8350, 0x8345, 0x832f, 0x832b, 0x8317, 0x8318, 0x8385, 0x839a, 0x83aa, 0x839f, 0x83a2, 0x8396, 0x8323, 0x838e, 0x8387, 0x838a, 0x837c, 0x83b5, 0x8373, 0x8375, 0x83a0, 0x8389, 0x83a8, 0x83f4, 0x8413, 0x83eb, 0x83ce, 0x83fd, 0x8403, 0x83d8, 0x840b, 0x83c1, 0x83f7, 0x8407, 0x83e0, 0x83f2, 0x840d, 0x8422, 0x8420, 0x83bd, 0x8438, 0x8506, 0x83fb, 0x846d, 0x842a, 0x843c, 0x855a, 0x8484, 0x8477, 0x846b, 0x84ad, 0x846e, 0x8482, 0x8469, 0x8446, 0x842c, 0x846f, 0x8479, 0x8435, 0x84ca, 0x8462, 0x84b9, 0x84bf, 0x849f, 0x84d9, 0x84cd, 0x84bb, 0x84da, 0x84d0, 0x84c1, 0x84c6, 0x84d6, 0x84a1, 0x8521, 0x84ff, 0x84f4, 0x8517, 0x8518, 0x852c, 0x851f, 0x8515, 0x8514, 0x84fc, 0x8540, 0x8563, 0x8558, 0x8548, 0x8541, 0x8602, 0x854b, 0x8555, 0x8580, 0x85a4, 0x8588, 0x8591, 0x858a, 0x85a8, 0x856d, 0x8594, 0x859b, 0x85ea, 0x8587, 0x859c, 0x8577, 0x857e, 0x8590, 0x85c9, 0x85ba, 0x85cf, 0x85b9, 0x85d0, 0x85d5, 0x85dd, 0x85e5, 0x85dc, 0x85f9, 0x860a, 0x8613, 0x860b, 0x85fe, 0x85fa, 0x8606, 0x8622, 0x861a, 0x8630, 0x863f, 0x864d, 0x4e55, 0x8654, 0x865f, 0x8667, 0x8671, 0x8693, 0x86a3, 0x86a9, 0x86aa, 0x868b, 0x868c, 0x86b6, 0x86af, 0x86c4, 0x86c6, 0x86b0, 0x86c9, 0x8823, 0x86ab, 0x86d4, 0x86de, 0x86e9, 0x86ec, 0x86df, 0x86db, 0x86ef, 0x8712, 0x8706, 0x8708, 0x8700, 0x8703, 0x86fb, 0x8711, 0x8709, 0x870d, 0x86f9, 0x870a, 0x8734, 0x873f, 0x8737, 0x873b, 0x8725, 0x8729, 0x871a, 0x8760, 0x875f, 0x8778, 0x874c, 0x874e, 0x8774, 0x8757, 0x8768, 0x876e, 0x8759, 0x8753, 0x8763, 0x876a, 0x8805, 0x87a2, 0x879f, 0x8782, 0x87af, 0x87cb, 0x87bd, 0x87c0, 0x87d0, 0x96d6, 0x87ab, 0x87c4, 0x87b3, 0x87c7, 0x87c6, 0x87bb, 0x87ef, 0x87f2, 0x87e0, 0x880f, 0x880d, 0x87fe, 0x87f6, 0x87f7, 0x880e, 0x87d2, 0x8811, 0x8816, 0x8815, 0x8822, 0x8821, 0x8831, 0x8836, 0x8839, 0x8827, 0x883b, 0x8844, 0x8842, 0x8852, 0x8859, 0x885e, 0x8862, 0x886b, 0x8881, 0x887e, 0x889e, 0x8875, 0x887d, 0x88b5, 0x8872, 0x8882, 0x8897, 0x8892, 0x88ae, 0x8899, 0x88a2, 0x888d, 0x88a4, 0x88b0, 0x88bf, 0x88b1, 0x88c3, 0x88c4, 0x88d4, 0x88d8, 0x88d9, 0x88dd, 0x88f9, 0x8902, 0x88fc, 0x88f4, 0x88e8, 0x88f2, 0x8904, 0x890c, 0x890a, 0x8913, 0x8943, 0x891e, 0x8925, 0x892a, 0x892b, 0x8941, 0x8944, 0x893b, 0x8936, 0x8938, 0x894c, 0x891d, 0x8960, 0x895e, 0x8966, 0x8964, 0x896d, 0x896a, 0x896f, 0x8974, 0x8977, 0x897e, 0x8983, 0x8988, 0x898a, 0x8993, 0x8998, 0x89a1, 0x89a9, 0x89a6, 0x89ac, 0x89af, 0x89b2, 0x89ba, 0x89bd, 0x89bf, 0x89c0, 0x89da, 0x89dc, 0x89dd, 0x89e7, 0x89f4, 0x89f8, 0x8a03, 0x8a16, 0x8a10, 0x8a0c, 0x8a1b, 0x8a1d, 0x8a25, 0x8a36, 0x8a41, 0x8a5b, 0x8a52, 0x8a46, 0x8a48, 0x8a7c, 0x8a6d, 0x8a6c, 0x8a62, 0x8a85, 0x8a82, 0x8a84, 0x8aa8, 0x8aa1, 0x8a91, 0x8aa5, 0x8aa6, 0x8a9a, 0x8aa3, 0x8ac4, 0x8acd, 0x8ac2, 0x8ada, 0x8aeb, 0x8af3, 0x8ae7, 0x8ae4, 0x8af1, 0x8b14, 0x8ae0, 0x8ae2, 0x8af7, 0x8ade, 0x8adb, 0x8b0c, 0x8b07, 0x8b1a, 0x8ae1, 0x8b16, 0x8b10, 0x8b17, 0x8b20, 0x8b33, 0x97ab, 0x8b26, 0x8b2b, 0x8b3e, 0x8b28, 0x8b41, 0x8b4c, 0x8b4f, 0x8b4e, 0x8b49, 0x8b56, 0x8b5b, 0x8b5a, 0x8b6b, 0x8b5f, 0x8b6c, 0x8b6f, 0x8b74, 0x8b7d, 0x8b80, 0x8b8c, 0x8b8e, 0x8b92, 0x8b93, 0x8b96, 0x8b99, 0x8b9a, 0x8c3a, 0x8c41, 0x8c3f, 0x8c48, 0x8c4c, 0x8c4e, 0x8c50, 0x8c55, 0x8c62, 0x8c6c, 0x8c78, 0x8c7a, 0x8c82, 0x8c89, 0x8c85, 0x8c8a, 0x8c8d, 0x8c8e, 0x8c94, 0x8c7c, 0x8c98, 0x621d, 0x8cad, 0x8caa, 0x8cbd, 0x8cb2, 0x8cb3, 0x8cae, 0x8cb6, 0x8cc8, 0x8cc1, 0x8ce4, 0x8ce3, 0x8cda, 0x8cfd, 0x8cfa, 0x8cfb, 0x8d04, 0x8d05, 0x8d0a, 0x8d07, 0x8d0f, 0x8d0d, 0x8d10, 0x9f4e, 0x8d13, 0x8ccd, 0x8d14, 0x8d16, 0x8d67, 0x8d6d, 0x8d71, 0x8d73, 0x8d81, 0x8d99, 0x8dc2, 0x8dbe, 0x8dba, 0x8dcf, 0x8dda, 0x8dd6, 0x8dcc, 0x8ddb, 0x8dcb, 0x8dea, 0x8deb, 0x8ddf, 0x8de3, 0x8dfc, 0x8e08, 0x8e09, 0x8dff, 0x8e1d, 0x8e1e, 0x8e10, 0x8e1f, 0x8e42, 0x8e35, 0x8e30, 0x8e34, 0x8e4a, 0x8e47, 0x8e49, 0x8e4c, 0x8e50, 0x8e48, 0x8e59, 0x8e64, 0x8e60, 0x8e2a, 0x8e63, 0x8e55, 0x8e76, 0x8e72, 0x8e7c, 0x8e81, 0x8e87, 0x8e85, 0x8e84, 0x8e8b, 0x8e8a, 0x8e93, 0x8e91, 0x8e94, 0x8e99, 0x8eaa, 0x8ea1, 0x8eac, 0x8eb0, 0x8ec6, 0x8eb1, 0x8ebe, 0x8ec5, 0x8ec8, 0x8ecb, 0x8edb, 0x8ee3, 0x8efc, 0x8efb, 0x8eeb, 0x8efe, 0x8f0a, 0x8f05, 0x8f15, 0x8f12, 0x8f19, 0x8f13, 0x8f1c, 0x8f1f, 0x8f1b, 0x8f0c, 0x8f26, 0x8f33, 0x8f3b, 0x8f39, 0x8f45, 0x8f42, 0x8f3e, 0x8f4c, 0x8f49, 0x8f46, 0x8f4e, 0x8f57, 0x8f5c, 0x8f62, 0x8f63, 0x8f64, 0x8f9c, 0x8f9f, 0x8fa3, 0x8fad, 0x8faf, 0x8fb7, 0x8fda, 0x8fe5, 0x8fe2, 0x8fea, 0x8fef, 0x9087, 0x8ff4, 0x9005, 0x8ff9, 0x8ffa, 0x9011, 0x9015, 0x9021, 0x900d, 0x901e, 0x9016, 0x900b, 0x9027, 0x9036, 0x9035, 0x9039, 0x8ff8, 0x904f, 0x9050, 0x9051, 0x9052, 0x900e, 0x9049, 0x903e, 0x9056, 0x9058, 0x905e, 0x9068, 0x906f, 0x9076, 0x96a8, 0x9072, 0x9082, 0x907d, 0x9081, 0x9080, 0x908a, 0x9089, 0x908f, 0x90a8, 0x90af, 0x90b1, 0x90b5, 0x90e2, 0x90e4, 0x6248, 0x90db, 0x9102, 0x9112, 0x9119, 0x9132, 0x9130, 0x914a, 0x9156, 0x9158, 0x9163, 0x9165, 0x9169, 0x9173, 0x9172, 0x918b, 0x9189, 0x9182, 0x91a2, 0x91ab, 0x91af, 0x91aa, 0x91b5, 0x91b4, 0x91ba, 0x91c0, 0x91c1, 0x91c9, 0x91cb, 0x91d0, 0x91d6, 0x91df, 0x91e1, 0x91db, 0x91fc, 0x91f5, 0x91f6, 0x921e, 0x91ff, 0x9214, 0x922c, 0x9215, 0x9211, 0x925e, 0x9257, 0x9245, 0x9249, 0x9264, 0x9248, 0x9295, 0x923f, 0x924b, 0x9250, 0x929c, 0x9296, 0x9293, 0x929b, 0x925a, 0x92cf, 0x92b9, 0x92b7, 0x92e9, 0x930f, 0x92fa, 0x9344, 0x932e, 0x9319, 0x9322, 0x931a, 0x9323, 0x933a, 0x9335, 0x933b, 0x935c, 0x9360, 0x937c, 0x936e, 0x9356, 0x93b0, 0x93ac, 0x93ad, 0x9394, 0x93b9, 0x93d6, 0x93d7, 0x93e8, 0x93e5, 0x93d8, 0x93c3, 0x93dd, 0x93d0, 0x93c8, 0x93e4, 0x941a, 0x9414, 0x9413, 0x9403, 0x9407, 0x9410, 0x9436, 0x942b, 0x9435, 0x9421, 0x943a, 0x9441, 0x9452, 0x9444, 0x945b, 0x9460, 0x9462, 0x945e, 0x946a, 0x9229, 0x9470, 0x9475, 0x9477, 0x947d, 0x945a, 0x947c, 0x947e, 0x9481, 0x947f, 0x9582, 0x9587, 0x958a, 0x9594, 0x9596, 0x9598, 0x9599, 0x95a0, 0x95a8, 0x95a7, 0x95ad, 0x95bc, 0x95bb, 0x95b9, 0x95be, 0x95ca, 0x6ff6, 0x95c3, 0x95cd, 0x95cc, 0x95d5, 0x95d4, 0x95d6, 0x95dc, 0x95e1, 0x95e5, 0x95e2, 0x9621, 0x9628, 0x962e, 0x962f, 0x9642, 0x964c, 0x964f, 0x964b, 0x9677, 0x965c, 0x965e, 0x965d, 0x965f, 0x9666, 0x9672, 0x966c, 0x968d, 0x9698, 0x9695, 0x9697, 0x96aa, 0x96a7, 0x96b1, 0x96b2, 0x96b0, 0x96b4, 0x96b6, 0x96b8, 0x96b9, 0x96ce, 0x96cb, 0x96c9, 0x96cd, 0x894d, 0x96dc, 0x970d, 0x96d5, 0x96f9, 0x9704, 0x9706, 0x9708, 0x9713, 0x970e, 0x9711, 0x970f, 0x9716, 0x9719, 0x9724, 0x972a, 0x9730, 0x9739, 0x973d, 0x973e, 0x9744, 0x9746, 0x9748, 0x9742, 0x9749, 0x975c, 0x9760, 0x9764, 0x9766, 0x9768, 0x52d2, 0x976b, 0x9771, 0x9779, 0x9785, 0x977c, 0x9781, 0x977a, 0x9786, 0x978b, 0x978f, 0x9790, 0x979c, 0x97a8, 0x97a6, 0x97a3, 0x97b3, 0x97b4, 0x97c3, 0x97c6, 0x97c8, 0x97cb, 0x97dc, 0x97ed, 0x9f4f, 0x97f2, 0x7adf, 0x97f6, 0x97f5, 0x980f, 0x980c, 0x9838, 0x9824, 0x9821, 0x9837, 0x983d, 0x9846, 0x984f, 0x984b, 0x986b, 0x986f, 0x9870, 0x9871, 0x9874, 0x9873, 0x98aa, 0x98af, 0x98b1, 0x98b6, 0x98c4, 0x98c3, 0x98c6, 0x98e9, 0x98eb, 0x9903, 0x9909, 0x9912, 0x9914, 0x9918, 0x9921, 0x991d, 0x991e, 0x9924, 0x9920, 0x992c, 0x992e, 0x993d, 0x993e, 0x9942, 0x9949, 0x9945, 0x9950, 0x994b, 0x9951, 0x9952, 0x994c, 0x9955, 0x9997, 0x9998, 0x99a5, 0x99ad, 0x99ae, 0x99bc, 0x99df, 0x99db, 0x99dd, 0x99d8, 0x99d1, 0x99ed, 0x99ee, 0x99f1, 0x99f2, 0x99fb, 0x99f8, 0x9a01, 0x9a0f, 0x9a05, 0x99e2, 0x9a19, 0x9a2b, 0x9a37, 0x9a45, 0x9a42, 0x9a40, 0x9a43, 0x9a3e, 0x9a55, 0x9a4d, 0x9a5b, 0x9a57, 0x9a5f, 0x9a62, 0x9a65, 0x9a64, 0x9a69, 0x9a6b, 0x9a6a, 0x9aad, 0x9ab0, 0x9abc, 0x9ac0, 0x9acf, 0x9ad1, 0x9ad3, 0x9ad4, 0x9ade, 0x9adf, 0x9ae2, 0x9ae3, 0x9ae6, 0x9aef, 0x9aeb, 0x9aee, 0x9af4, 0x9af1, 0x9af7, 0x9afb, 0x9b06, 0x9b18, 0x9b1a, 0x9b1f, 0x9b22, 0x9b23, 0x9b25, 0x9b27, 0x9b28, 0x9b29, 0x9b2a, 0x9b2e, 0x9b2f, 0x9b32, 0x9b44, 0x9b43, 0x9b4f, 0x9b4d, 0x9b4e, 0x9b51, 0x9b58, 0x9b74, 0x9b93, 0x9b83, 0x9b91, 0x9b96, 0x9b97, 0x9b9f, 0x9ba0, 0x9ba8, 0x9bb4, 0x9bc0, 0x9bca, 0x9bb9, 0x9bc6, 0x9bcf, 0x9bd1, 0x9bd2, 0x9be3, 0x9be2, 0x9be4, 0x9bd4, 0x9be1, 0x9c3a, 0x9bf2, 0x9bf1, 0x9bf0, 0x9c15, 0x9c14, 0x9c09, 0x9c13, 0x9c0c, 0x9c06, 0x9c08, 0x9c12, 0x9c0a, 0x9c04, 0x9c2e, 0x9c1b, 0x9c25, 0x9c24, 0x9c21, 0x9c30, 0x9c47, 0x9c32, 0x9c46, 0x9c3e, 0x9c5a, 0x9c60, 0x9c67, 0x9c76, 0x9c78, 0x9ce7, 0x9cec, 0x9cf0, 0x9d09, 0x9d08, 0x9ceb, 0x9d03, 0x9d06, 0x9d2a, 0x9d26, 0x9daf, 0x9d23, 0x9d1f, 0x9d44, 0x9d15, 0x9d12, 0x9d41, 0x9d3f, 0x9d3e, 0x9d46, 0x9d48, 0x9d5d, 0x9d5e, 0x9d64, 0x9d51, 0x9d50, 0x9d59, 0x9d72, 0x9d89, 0x9d87, 0x9dab, 0x9d6f, 0x9d7a, 0x9d9a, 0x9da4, 0x9da9, 0x9db2, 0x9dc4, 0x9dc1, 0x9dbb, 0x9db8, 0x9dba, 0x9dc6, 0x9dcf, 0x9dc2, 0x9dd9, 0x9dd3, 0x9df8, 0x9de6, 0x9ded, 0x9def, 0x9dfd, 0x9e1a, 0x9e1b, 0x9e1e, 0x9e75, 0x9e79, 0x9e7d, 0x9e81, 0x9e88, 0x9e8b, 0x9e8c, 0x9e92, 0x9e95, 0x9e91, 0x9e9d, 0x9ea5, 0x9ea9, 0x9eb8, 0x9eaa, 0x9ead, 0x9761, 0x9ecc, 0x9ece, 0x9ecf, 0x9ed0, 0x9ed4, 0x9edc, 0x9ede, 0x9edd, 0x9ee0, 0x9ee5, 0x9ee8, 0x9eef, 0x9ef4, 0x9ef6, 0x9ef7, 0x9ef9, 0x9efb, 0x9efc, 0x9efd, 0x9f07, 0x9f08, 0x76b7, 0x9f15, 0x9f21, 0x9f2c, 0x9f3e, 0x9f4a, 0x9f52, 0x9f54, 0x9f63, 0x9f5f, 0x9f60, 0x9f61, 0x9f66, 0x9f67, 0x9f6c, 0x9f6a, 0x9f77, 0x9f72, 0x9f76, 0x9f95, 0x9f9c, 0x9fa0, 0x582f, 0x69c7, 0x9059, 0x7464, 0x51dc, 0x7199, ]
};

/*
  Ported to JavaScript by Lazar Laszlo 2011 
  
  lazarsoft@gmail.com, www.lazarsoft.info
  
*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


function PerspectiveTransform( a11,  a21,  a31,  a12,  a22,  a32,  a13,  a23,  a33)
{
	this.a11 = a11;
	this.a12 = a12;
	this.a13 = a13;
	this.a21 = a21;
	this.a22 = a22;
	this.a23 = a23;
	this.a31 = a31;
	this.a32 = a32;
	this.a33 = a33;
	this.transformPoints1=function( points)
		{
			var max = points.length;
			var a11 = this.a11;
			var a12 = this.a12;
			var a13 = this.a13;
			var a21 = this.a21;
			var a22 = this.a22;
			var a23 = this.a23;
			var a31 = this.a31;
			var a32 = this.a32;
			var a33 = this.a33;
			for (var i = 0; i < max; i += 2)
			{
				var x = points[i];
				var y = points[i + 1];
				var denominator = a13 * x + a23 * y + a33;
				points[i] = (a11 * x + a21 * y + a31) / denominator;
				points[i + 1] = (a12 * x + a22 * y + a32) / denominator;
			}
		}
	this. transformPoints2=function(xValues, yValues)
		{
			var n = xValues.length;
			for (var i = 0; i < n; ++i)
			{
				var x = xValues[i];
				var y = yValues[i];
				var denominator = this.a13 * x + this.a23 * y + this.a33;
				xValues[i] = (this.a11 * x + this.a21 * y + this.a31) / denominator;
				yValues[i] = (this.a12 * x + this.a22 * y + this.a32) / denominator;
			}
		}

	this.buildAdjoint=function()
		{
			// Adjoint is the transpose of the cofactor matrix:
			return new PerspectiveTransform(this.a22 * this.a33 - this.a23 * this.a32, this.a23 * this.a31 - this.a21 * this.a33, this.a21 * this.a32 - this.a22 * this.a31, this.a13 * this.a32 - this.a12 * this.a33, this.a11 * this.a33 - this.a13 * this.a31, this.a12 * this.a31 - this.a11 * this.a32, this.a12 * this.a23 - this.a13 * this.a22, this.a13 * this.a21 - this.a11 * this.a23, this.a11 * this.a22 - this.a12 * this.a21);
		}
	this.times=function( other)
		{
			return new PerspectiveTransform(this.a11 * other.a11 + this.a21 * other.a12 + this.a31 * other.a13, this.a11 * other.a21 + this.a21 * other.a22 + this.a31 * other.a23, this.a11 * other.a31 + this.a21 * other.a32 + this.a31 * other.a33, this.a12 * other.a11 + this.a22 * other.a12 + this.a32 * other.a13, this.a12 * other.a21 + this.a22 * other.a22 + this.a32 * other.a23, this.a12 * other.a31 + this.a22 * other.a32 + this.a32 * other.a33, this.a13 * other.a11 + this.a23 * other.a12 +this.a33 * other.a13, this.a13 * other.a21 + this.a23 * other.a22 + this.a33 * other.a23, this.a13 * other.a31 + this.a23 * other.a32 + this.a33 * other.a33);
		}

}

PerspectiveTransform.quadrilateralToQuadrilateral=function( x0,  y0,  x1,  y1,  x2,  y2,  x3,  y3,  x0p,  y0p,  x1p,  y1p,  x2p,  y2p,  x3p,  y3p)
{
	
	var qToS = this.quadrilateralToSquare(x0, y0, x1, y1, x2, y2, x3, y3);
	var sToQ = this.squareToQuadrilateral(x0p, y0p, x1p, y1p, x2p, y2p, x3p, y3p);
	return sToQ.times(qToS);
}

PerspectiveTransform.squareToQuadrilateral=function( x0,  y0,  x1,  y1,  x2,  y2,  x3,  y3)
{
	var dy2 = y3 - y2;
	var dy3 = y0 - y1 + y2 - y3;
	if (dy2 == 0.0 && dy3 == 0.0)
	{
		return new PerspectiveTransform(x1 - x0, x2 - x1, x0, y1 - y0, y2 - y1, y0, 0.0, 0.0, 1.0);
	}
	else
	{
		var dx1 = x1 - x2;
		var dx2 = x3 - x2;
		var dx3 = x0 - x1 + x2 - x3;
		var dy1 = y1 - y2;
		var denominator = dx1 * dy2 - dx2 * dy1;
		var a13 = (dx3 * dy2 - dx2 * dy3) / denominator;
		var a23 = (dx1 * dy3 - dx3 * dy1) / denominator;
		return new PerspectiveTransform(x1 - x0 + a13 * x1, x3 - x0 + a23 * x3, x0, y1 - y0 + a13 * y1, y3 - y0 + a23 * y3, y0, a13, a23, 1.0);
	}
}

PerspectiveTransform.quadrilateralToSquare=function( x0,  y0,  x1,  y1,  x2,  y2,  x3,  y3)
{
	// Here, the adjoint serves as the inverse:
	return this.squareToQuadrilateral(x0, y0, x1, y1, x2, y2, x3, y3).buildAdjoint();
}

function DetectorResult(bits,  points)
{
	this.bits = bits;
	this.points = points;
}


function Detector(image)
{
	this.image=image;
	this.resultPointCallback = null;
	
	this.sizeOfBlackWhiteBlackRun=function( fromX,  fromY,  toX,  toY)
		{
			// Mild variant of Bresenham's algorithm;
			// see http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
			var steep = Math.abs(toY - fromY) > Math.abs(toX - fromX);
			if (steep)
			{
				var temp = fromX;
				fromX = fromY;
				fromY = temp;
				temp = toX;
				toX = toY;
				toY = temp;
			}
			
			var dx = Math.abs(toX - fromX);
			var dy = Math.abs(toY - fromY);
			var error = - dx >> 1;
			var ystep = fromY < toY?1:- 1;
			var xstep = fromX < toX?1:- 1;
			var state = 0; // In black pixels, looking for white, first or second time
			for (var x = fromX, y = fromY; x != toX; x += xstep)
			{
				
				var realX = steep?y:x;
				var realY = steep?x:y;
				if (state == 1)
				{
					// In white pixels, looking for black
					if (this.image[realX + realY*qrcode.width])
					{
						++state;
					}
				}
				else
				{
					if (!this.image[realX + realY*qrcode.width])
					{
						++state;
					}
				}
				
				if (state == 3)
				{
					// Found black, white, black, and stumbled back onto white; done
					var diffX = x - fromX;
					var diffY = y - fromY;
					return  Math.sqrt( (diffX * diffX + diffY * diffY));
				}
				error += dy;
				if (error > 0)
				{
					if (y == toY)
					{
						break;
					}
					y += ystep;
					error -= dx;
				}
			}
			var diffX2 = toX - fromX;
			var diffY2 = toY - fromY;
			return  Math.sqrt( (diffX2 * diffX2 + diffY2 * diffY2));
		}

	
	this.sizeOfBlackWhiteBlackRunBothWays=function( fromX,  fromY,  toX,  toY)
		{
			
			var result = this.sizeOfBlackWhiteBlackRun(fromX, fromY, toX, toY);
			
			// Now count other way -- don't run off image though of course
			var scale = 1.0;
			var otherToX = fromX - (toX - fromX);
			if (otherToX < 0)
			{
				scale =  fromX /  (fromX - otherToX);
				otherToX = 0;
			}
			else if (otherToX >= qrcode.width)
			{
				scale =  (qrcode.width - 1 - fromX) /  (otherToX - fromX);
				otherToX = qrcode.width - 1;
			}
			var otherToY = Math.floor (fromY - (toY - fromY) * scale);
			
			scale = 1.0;
			if (otherToY < 0)
			{
				scale =  fromY /  (fromY - otherToY);
				otherToY = 0;
			}
			else if (otherToY >= qrcode.height)
			{
				scale =  (qrcode.height - 1 - fromY) /  (otherToY - fromY);
				otherToY = qrcode.height - 1;
			}
			otherToX = Math.floor (fromX + (otherToX - fromX) * scale);
			
			result += this.sizeOfBlackWhiteBlackRun(fromX, fromY, otherToX, otherToY);
			return result - 1.0; // -1 because we counted the middle pixel twice
		}
		

	
	this.calculateModuleSizeOneWay=function( pattern,  otherPattern)
		{
			var moduleSizeEst1 = this.sizeOfBlackWhiteBlackRunBothWays(Math.floor( pattern.X), Math.floor( pattern.Y), Math.floor( otherPattern.X), Math.floor(otherPattern.Y));
			var moduleSizeEst2 = this.sizeOfBlackWhiteBlackRunBothWays(Math.floor(otherPattern.X), Math.floor(otherPattern.Y), Math.floor( pattern.X), Math.floor(pattern.Y));
			if (isNaN(moduleSizeEst1))
			{
				return moduleSizeEst2 / 7.0;
			}
			if (isNaN(moduleSizeEst2))
			{
				return moduleSizeEst1 / 7.0;
			}
			// Average them, and divide by 7 since we've counted the width of 3 black modules,
			// and 1 white and 1 black module on either side. Ergo, divide sum by 14.
			return (moduleSizeEst1 + moduleSizeEst2) / 14.0;
		}

	
	this.calculateModuleSize=function( topLeft,  topRight,  bottomLeft)
		{
			// Take the average
			return (this.calculateModuleSizeOneWay(topLeft, topRight) + this.calculateModuleSizeOneWay(topLeft, bottomLeft)) / 2.0;
		}

	this.distance=function( pattern1,  pattern2)
	{
		var xDiff = pattern1.X - pattern2.X;
		var yDiff = pattern1.Y - pattern2.Y;
		return  Math.sqrt( (xDiff * xDiff + yDiff * yDiff));
	}
	this.computeDimension=function( topLeft,  topRight,  bottomLeft,  moduleSize)
		{
			
			var tltrCentersDimension = Math.round(this.distance(topLeft, topRight) / moduleSize);
			var tlblCentersDimension = Math.round(this.distance(topLeft, bottomLeft) / moduleSize);
			var dimension = ((tltrCentersDimension + tlblCentersDimension) >> 1) + 7;
			switch (dimension & 0x03)
			{
				
				// mod 4
				case 0: 
					++dimension;
					break;
					// 1? do nothing
				
				case 2: 
					--dimension;
					break;
				
				case 3: 
					throw "Error";
				}
			return dimension;
		}

	this.findAlignmentInRegion=function( overallEstModuleSize,  estAlignmentX,  estAlignmentY,  allowanceFactor)
		{
			// Look for an alignment pattern (3 modules in size) around where it
			// should be
			var allowance = Math.floor (allowanceFactor * overallEstModuleSize);
			var alignmentAreaLeftX = Math.max(0, estAlignmentX - allowance);
			var alignmentAreaRightX = Math.min(qrcode.width - 1, estAlignmentX + allowance);
			if (alignmentAreaRightX - alignmentAreaLeftX < overallEstModuleSize * 3)
			{
				throw "Error";
			}
			
			var alignmentAreaTopY = Math.max(0, estAlignmentY - allowance);
			var alignmentAreaBottomY = Math.min(qrcode.height - 1, estAlignmentY + allowance);
			
			var alignmentFinder = new AlignmentPatternFinder(this.image, alignmentAreaLeftX, alignmentAreaTopY, alignmentAreaRightX - alignmentAreaLeftX, alignmentAreaBottomY - alignmentAreaTopY, overallEstModuleSize, this.resultPointCallback);
			return alignmentFinder.find();
		}
		
	this.createTransform=function( topLeft,  topRight,  bottomLeft, alignmentPattern, dimension)
		{
			var dimMinusThree =  dimension - 3.5;
			var bottomRightX;
			var bottomRightY;
			var sourceBottomRightX;
			var sourceBottomRightY;
			if (alignmentPattern != null)
			{
				bottomRightX = alignmentPattern.X;
				bottomRightY = alignmentPattern.Y;
				sourceBottomRightX = sourceBottomRightY = dimMinusThree - 3.0;
			}
			else
			{
				// Don't have an alignment pattern, just make up the bottom-right point
				bottomRightX = (topRight.X - topLeft.X) + bottomLeft.X;
				bottomRightY = (topRight.Y - topLeft.Y) + bottomLeft.Y;
				sourceBottomRightX = sourceBottomRightY = dimMinusThree;
			}
			
			var transform = PerspectiveTransform.quadrilateralToQuadrilateral(3.5, 3.5, dimMinusThree, 3.5, sourceBottomRightX, sourceBottomRightY, 3.5, dimMinusThree, topLeft.X, topLeft.Y, topRight.X, topRight.Y, bottomRightX, bottomRightY, bottomLeft.X, bottomLeft.Y);
			
			return transform;
		}		
	
	this.sampleGrid=function( image,  transform,  dimension)
		{
			
			var sampler = GridSampler;
			return sampler.sampleGrid3(image, dimension, transform);
		}
	
	this.processFinderPatternInfo = function( info)
		{
			
			var topLeft = info.TopLeft;
			var topRight = info.TopRight;
			var bottomLeft = info.BottomLeft;
			
			var moduleSize = this.calculateModuleSize(topLeft, topRight, bottomLeft);
			if (moduleSize < 1.0)
			{
				throw "Error";
			}
			var dimension = this.computeDimension(topLeft, topRight, bottomLeft, moduleSize);
			var provisionalVersion = Version.getProvisionalVersionForDimension(dimension);
			var modulesBetweenFPCenters = provisionalVersion.DimensionForVersion - 7;
			
			var alignmentPattern = null;
			// Anything above version 1 has an alignment pattern
			if (provisionalVersion.AlignmentPatternCenters.length > 0)
			{
				
				// Guess where a "bottom right" finder pattern would have been
				var bottomRightX = topRight.X - topLeft.X + bottomLeft.X;
				var bottomRightY = topRight.Y - topLeft.Y + bottomLeft.Y;
				
				// Estimate that alignment pattern is closer by 3 modules
				// from "bottom right" to known top left location
				var correctionToTopLeft = 1.0 - 3.0 /  modulesBetweenFPCenters;
				var estAlignmentX = Math.floor (topLeft.X + correctionToTopLeft * (bottomRightX - topLeft.X));
				var estAlignmentY = Math.floor (topLeft.Y + correctionToTopLeft * (bottomRightY - topLeft.Y));
				
				// Kind of arbitrary -- expand search radius before giving up
				for (var i = 4; i <= 16; i <<= 1)
				{
					//try
					//{
						alignmentPattern = this.findAlignmentInRegion(moduleSize, estAlignmentX, estAlignmentY,  i);
						break;
					//}
					//catch (re)
					//{
						// try next round
					//}
				}
				// If we didn't find alignment pattern... well try anyway without it
			}
			
			var transform = this.createTransform(topLeft, topRight, bottomLeft, alignmentPattern, dimension);
			
			var bits = this.sampleGrid(this.image, transform, dimension);
			
			var points;
			if (alignmentPattern == null)
			{
				points = new Array(bottomLeft, topLeft, topRight);
			}
			else
			{
				points = new Array(bottomLeft, topLeft, topRight, alignmentPattern);
			}
			return new DetectorResult(bits, points);
		}
		

	
	this.detect=function()
	{
		var info =  new FinderPatternFinder().findFinderPattern(this.image);
			
		return this.processFinderPatternInfo(info); 
	}
}
/*
  Ported to JavaScript by Lazar Laszlo 2011 
  
  lazarsoft@gmail.com, www.lazarsoft.info
  
*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


var GridSampler = {};

GridSampler.checkAndNudgePoints=function( image,  points)
		{
			var width = qrcode.width;
			var height = qrcode.height;
			// Check and nudge points from start until we see some that are OK:
			var nudged = true;
			for (var offset = 0; offset < points.length && nudged; offset += 2)
			{
				var x = Math.floor (points[offset]);
				var y = Math.floor( points[offset + 1]);
				if (x < - 1 || x > width || y < - 1 || y > height)
				{
					throw "Error.checkAndNudgePoints ";
				}
				nudged = false;
				if (x == - 1)
				{
					points[offset] = 0.0;
					nudged = true;
				}
				else if (x == width)
				{
					points[offset] = width - 1;
					nudged = true;
				}
				if (y == - 1)
				{
					points[offset + 1] = 0.0;
					nudged = true;
				}
				else if (y == height)
				{
					points[offset + 1] = height - 1;
					nudged = true;
				}
			}
			// Check and nudge points from end:
			nudged = true;
			for (var offset = points.length - 2; offset >= 0 && nudged; offset -= 2)
			{
				var x = Math.floor( points[offset]);
				var y = Math.floor( points[offset + 1]);
				if (x < - 1 || x > width || y < - 1 || y > height)
				{
					throw "Error.checkAndNudgePoints ";
				}
				nudged = false;
				if (x == - 1)
				{
					points[offset] = 0.0;
					nudged = true;
				}
				else if (x == width)
				{
					points[offset] = width - 1;
					nudged = true;
				}
				if (y == - 1)
				{
					points[offset + 1] = 0.0;
					nudged = true;
				}
				else if (y == height)
				{
					points[offset + 1] = height - 1;
					nudged = true;
				}
			}
		}
	


GridSampler.sampleGrid3=function( image,  dimension,  transform)
		{
			var bits = new BitMatrix(dimension);
			var points = new Array(dimension << 1);
			for (var y = 0; y < dimension; ++y)
			{
				var max = points.length;
				var iValue =  y + 0.5;
				for (var x = 0; x < max; x += 2)
				{
					points[x] =  (x >> 1) + 0.5;
					points[x + 1] = iValue;
				}
				transform.transformPoints1(points);
				// Quick check to see if points transformed to something inside the image;
				// sufficient to check the endpoints
				GridSampler.checkAndNudgePoints(image, points);
				try
				{
					for (var x = 0; x < max; x += 2)
					{
						//var xpoint = (Math.floor( points[x]) * 4) + (Math.floor( points[x + 1]) * qrcode.width * 4);
                        var bit = image[Math.floor( points[x])+ qrcode.width* Math.floor( points[x + 1])];
						//qrcode.imagedata.data[xpoint] = bit?255:0;
						//qrcode.imagedata.data[xpoint+1] = bit?255:0;
						//qrcode.imagedata.data[xpoint+2] = 0;
						//qrcode.imagedata.data[xpoint+3] = 255;
						//bits[x >> 1][ y]=bit;
						if(bit)
							bits.set_Renamed(x >> 1, y);
					}
				}
				catch ( aioobe)
				{
					// This feels wrong, but, sometimes if the finder patterns are misidentified, the resulting
					// transform gets "twisted" such that it maps a straight line of points to a set of points
					// whose endpoints are in bounds, but others are not. There is probably some mathematical
					// way to detect this about the transformation that I don't know yet.
					// This results in an ugly runtime exception despite our clever checks above -- can't have
					// that. We could check each point's coordinates but that feels duplicative. We settle for
					// catching and wrapping ArrayIndexOutOfBoundsException.
					throw "Error.checkAndNudgePoints";
				}
			}
			return bits;
		}

GridSampler.sampleGridx=function( image,  dimension,  p1ToX,  p1ToY,  p2ToX,  p2ToY,  p3ToX,  p3ToY,  p4ToX,  p4ToY,  p1FromX,  p1FromY,  p2FromX,  p2FromY,  p3FromX,  p3FromY,  p4FromX,  p4FromY)
{
	var transform = PerspectiveTransform.quadrilateralToQuadrilateral(p1ToX, p1ToY, p2ToX, p2ToY, p3ToX, p3ToY, p4ToX, p4ToY, p1FromX, p1FromY, p2FromX, p2FromY, p3FromX, p3FromY, p4FromX, p4FromY);
			
	return GridSampler.sampleGrid3(image, dimension, transform);
}
/*
  Ported to JavaScript by Lazar Laszlo 2011 
  
  lazarsoft@gmail.com, www.lazarsoft.info
  
*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


var FORMAT_INFO_MASK_QR = 0x5412;
var FORMAT_INFO_DECODE_LOOKUP = [[0x5412, 0x00], [0x5125, 0x01], [0x5E7C, 0x02], [0x5B4B, 0x03], [0x45F9, 0x04], [0x40CE, 0x05], [0x4F97, 0x06], [0x4AA0, 0x07], [0x77C4, 0x08], [0x72F3, 0x09], [0x7DAA, 0x0A], [0x789D, 0x0B], [0x662F, 0x0C], [0x6318, 0x0D], [0x6C41, 0x0E], [0x6976, 0x0F], [0x1689, 0x10], [0x13BE, 0x11], [0x1CE7, 0x12], [0x19D0, 0x13], [0x0762, 0x14], [0x0255, 0x15], [0x0D0C, 0x16], [0x083B, 0x17], [0x355F, 0x18], [0x3068, 0x19], [0x3F31, 0x1A], [0x3A06, 0x1B], [0x24B4, 0x1C], [0x2183, 0x1D], [0x2EDA, 0x1E], [0x2BED, 0x1F]];
var BITS_SET_IN_HALF_BYTE = [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4];


function FormatInformation(formatInfo)
{
	this.errorCorrectionLevel = ErrorCorrectionLevel.forBits((formatInfo >> 3) & 0x03);
	this.dataMask =  (formatInfo & 0x07);

	this.__defineGetter__("ErrorCorrectionLevel", function()
	{
		return this.errorCorrectionLevel;
	});
	this.__defineGetter__("DataMask", function()
	{
		return this.dataMask;
	});
	this.GetHashCode=function()
	{
		return (this.errorCorrectionLevel.ordinal() << 3) |  this.dataMask;
	}
	this.Equals=function( o)
	{
		var other =  o;
		return this.errorCorrectionLevel == other.errorCorrectionLevel && this.dataMask == other.dataMask;
	}
}

FormatInformation.numBitsDiffering=function( a,  b)
{
	a ^= b; // a now has a 1 bit exactly where its bit differs with b's
	// Count bits set quickly with a series of lookups:
	return BITS_SET_IN_HALF_BYTE[a & 0x0F] + BITS_SET_IN_HALF_BYTE[(URShift(a, 4) & 0x0F)] + BITS_SET_IN_HALF_BYTE[(URShift(a, 8) & 0x0F)] + BITS_SET_IN_HALF_BYTE[(URShift(a, 12) & 0x0F)] + BITS_SET_IN_HALF_BYTE[(URShift(a, 16) & 0x0F)] + BITS_SET_IN_HALF_BYTE[(URShift(a, 20) & 0x0F)] + BITS_SET_IN_HALF_BYTE[(URShift(a, 24) & 0x0F)] + BITS_SET_IN_HALF_BYTE[(URShift(a, 28) & 0x0F)];
}

FormatInformation.decodeFormatInformation=function( maskedFormatInfo)
{
	var formatInfo = FormatInformation.doDecodeFormatInformation(maskedFormatInfo);
	if (formatInfo != null)
	{
		return formatInfo;
	}
	// Should return null, but, some QR codes apparently
	// do not mask this info. Try again by actually masking the pattern
	// first
	return FormatInformation.doDecodeFormatInformation(maskedFormatInfo ^ FORMAT_INFO_MASK_QR);
}
FormatInformation.doDecodeFormatInformation=function( maskedFormatInfo)
{
	// Find the int in FORMAT_INFO_DECODE_LOOKUP with fewest bits differing
	var bestDifference = 0xffffffff;
	var bestFormatInfo = 0;
	for (var i = 0; i < FORMAT_INFO_DECODE_LOOKUP.length; ++i)
	{
		var decodeInfo = FORMAT_INFO_DECODE_LOOKUP[i];
		var targetInfo = decodeInfo[0];
		if (targetInfo == maskedFormatInfo)
		{
			// Found an exact match
			return new FormatInformation(decodeInfo[1]);
		}
		var bitsDifference = this.numBitsDiffering(maskedFormatInfo, targetInfo);
		if (bitsDifference < bestDifference)
		{
			bestFormatInfo = decodeInfo[1];
			bestDifference = bitsDifference;
		}
	}
	// Hamming distance of the 32 masked codes is 7, by construction, so <= 3 bits
	// differing means we found a match
	if (bestDifference <= 3)
	{
		return new FormatInformation(bestFormatInfo);
	}
	return null;
}

		
/*
  Ported to JavaScript by Lazar Laszlo 2011 
  
  lazarsoft@gmail.com, www.lazarsoft.info
  
*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

var shift_jis_table;

function QRCodeDataBlockReader(blocks, version, numErrorCorrectionCode) {
    this.blockPointer = 0;
    this.bitOffset = 0;
    this.dataLength = 0;
    this.blocks = blocks;
    this.numErrorCorrectionCode = numErrorCorrectionCode;
    if (version <= 9)
        this.dataLengthMode = 0;
    else if (version >= 10 && version <= 26)
        this.dataLengthMode = 1;
    else if (version >= 27 && version <= 40)
        this.dataLengthMode = 2;
    this.require = function (url) {
        var xhr = null;
        if (window.ActiveXObject) { //IE
            try {
                // lte IE6
                xhr = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                // lte IE5.5
                xhr = new ActiveXObject("Microsoft.XMLHTTP");
            }
        } else if (window.XMLHttpRequest) {
            //Firefox，Opera 8.0+，Safari，Chrome
            xhr = new XMLHttpRequest();
        }
        xhr.open("GET", url, false);
        xhr.send();
        if (xhr.readyState == 4) {
            if ((xhr.status / 100 == 2) || xhr.status == 0 || xhr.status == 304) {
                var doc = document;
                var myBody = doc.getElementsByTagName("BODY")[0];
                var myScript = doc.createElement("script");
                myScript.language = "javascript";
                myScript.type = "text/javascript";
                try {
                    myScript.appendChild(doc.createTextNode(xhr.responseText));
                } catch (ex) {
                    // lte IE8
                    myScript.text = xhr.responseText;
                }
                myBody.appendChild(myScript);
            }
        }
    }

    this.getNextBits = function (numBits) {
        var result = 0;

        // First, read remainder from current byte
        if (this.bitOffset > 0) {
            var bitsLeft = 8 - this.bitOffset;
            var toRead = numBits < bitsLeft ? numBits : bitsLeft;
            var bitsToNotRead = bitsLeft - toRead;
            var mask = (0xFF >> (8 - toRead)) << bitsToNotRead;
            result = (this.blocks[this.blockPointer] & mask) >> bitsToNotRead;
            numBits -= toRead;
            this.bitOffset += toRead;
            if (this.bitOffset == 8) {
                this.bitOffset = 0;
                ++this.blockPointer;
            }
        }

        // Next read whole bytes
        if (numBits > 0) {
            while (numBits >= 8) {
                result = (result << 8) | (this.blocks[this.blockPointer] & 0xFF);
                ++this.blockPointer;
                numBits -= 8;
            }

            // Finally read a partial byte
            if (numBits > 0) {
                var bitsToNotRead = 8 - numBits;
                var mask = (0xFF >> bitsToNotRead) << bitsToNotRead;
                result = (result << numBits) | ((this.blocks[this.blockPointer] & mask) >> bitsToNotRead);
                this.bitOffset += numBits;
            }
        }
        return result;
    }
    this.NextMode = function () {
        if ((this.blockPointer > this.blocks.length - this.numErrorCorrectionCode - 2))
            return 0;
        else
            return this.getNextBits(4);
    }
    this.sizeOfDataLengthInfo = [
        [0, 0, 0],
        [10, 12, 14], // NUMERIC
        [9, 11, 13], // ALPHANUMERIC
        [0, 0, 0], // STRUCTURED_APPEND
        [8, 16, 16], // BYTE
        [0, 0, 0], // FNC1_FIRST_POSITION
        [0, 0, 0],
        [0, 0, 0], // ECI
        [8, 10, 12], // KANJI
        [0, 0, 0], // FNC1_SECOND_POSITION
        [8, 10, 12]// HANZI
    ];
    this.tableAplhaNumeric = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:".split('');
    this.getDataLength = function (modeIndicator) {
        return this.getNextBits(this.sizeOfDataLengthInfo[modeIndicator][this.dataLengthMode]);
    }
    this.getAlphaNumericString = function (dataLength) {
        var strData = "";
        do {
            if (dataLength > 1) {
                var intData = this.getNextBits(11);
                var firstLetter = Math.floor(intData / 45);
                var secondLetter = intData % 45;
                strData += this.tableAplhaNumeric[firstLetter];
                strData += this.tableAplhaNumeric[secondLetter];
                dataLength -= 2;
            } else if (dataLength == 1) {
                strData += this.tableAplhaNumeric[this.getNextBits(6)];
                dataLength -= 1;
            }
        } while (dataLength > 0);

        return strData;
    }
    this.getNumericString = function (dataLength) {
        var intData = 0;
        var strData = "";
        do {
            if (dataLength >= 3) {
                intData = this.getNextBits(10);
                if (intData < 100)
                    strData += "0";
                if (intData < 10)
                    strData += "0";
                dataLength -= 3;
            } else if (dataLength == 2) {
                intData = this.getNextBits(7);
                if (intData < 10)
                    strData += "0";
                dataLength -= 2;
            } else if (dataLength == 1) {
                intData = this.getNextBits(4);
                dataLength -= 1;
            }
            strData += intData;
        } while (dataLength > 0);

        return strData;
    }
    this.defaultEncoding = this.ISO88591Encoding;
    this.ISO88591Encoding = function (data) {
        var output = "";
        for (var i = 0; i < data.length; ++i) {
            output += String.fromCharCode(data[i]);
        }
        return output;
    }
    this.ShiftJISEncoding = function (data) {
        var output = "";
        var tail = 0;
        var character = 0;

        for (var i = 0; i < data.length; ++i) {
            if (data[i] < 0x80) {
                if (data[i] == 0x5C)
                    character = 0x00A5;
                else if (data[i] == 0x7E)
                    character = 0x203E;
                else
                    character = data[i];
            } else if ((data[i] >= 0xA1 && data[i] <= 0xDF)) {
                character = data[i] + 0xFEC0;
            } else if ((data[i] >= 0x81 && data[i] <= 0x9F) || (data[i] >= 0xE0 && data[i] <= 0xEA)) {
                if (i == data.length - 1)
                    throw "Too few bytes."
                    var s1 = data[i];
                var s2 = data[++i];
                if ((s2 >= 0x40 && s2 <= 0x7E) || (s2 >= 0x80 && s2 <= 0xFC)) {
                    var t1 = (s1 < 0xE0 ? s1 - 0x81 : s1 - 0xC1);
                    var t2 = (s2 < 0x80 ? s2 - 0x40 : s2 - 0x41);
                    var c1 = 2 * t1 + (t2 < 0x5E ? 0 : 1);
                    var c2 = (t2 < 0x5E ? t2 : t2 - 0x5E);
                    if ((c1 <= 0x07) || (c1 >= 0x0F && c1 <= 0x53)) {
                        if (c2 < 0x7F) {
                            var tmp = 94 * c1 + c2;
                            character = 0xFFFD;
                            if (tmp < 1410) {
                                if (tmp < 690) {
                                    if (!shift_jis_table)
                                        this.require('shift_jis_table.js');
                                    character = shift_jis_table.jisx0208_2uni_page21[tmp];
                                }
                            } else {
                                if (tmp < 7808) {
                                    if (!shift_jis_table)
                                        this.require('shift_jis_table.js');
                                    character = shift_jis_table.jisx0208_2uni_page30[tmp - 1410];
                                }
                            }
                        }
                    }
                }
            } else if (data[i] >= 0xF0 && data[i] <= 0xF9) {
                /* User-defined range. See
                 * Ken Lunde's "CJKV Information Processing", table 4-66, p. 206. */
                if (i == data.length - 1)
                    throw "Too few bytes."
                    var s1 = data[i];
                var s2 = data[++i];
                if ((s2 >= 0x40 && s2 <= 0x7E) || (s2 >= 0x80 && s2 <= 0xFC)) {
                    character = 0xE000 + 188 * (s1 - 0xF0) + (s2 < 0x80 ? s2 - 0x40 : s2 - 0x41);
                }
            }
            output += String.fromCharCode(character);
        }
        return output;
    }
    this.UTF8Encoding = function (data) {
        var output = "";
        var tail = 0;
        var character = 0;

        for (var i = 0; i < data.length; ++i) {
            if (tail-- > 0) {
                if (data[i] >= 128 && data[i] <= 191) { //10XX XXXX
                    character = (character << 6) + (data[i] & 0x3F);
                } else {
                    // TODO: malformed warning
                }
            } else {
                if (data[i] <= 127) { //0XXX XXXX
                    tail = -1;
                } else if (data[i] >= 192 && data[i] <= 223) { //110X XXXX
                    tail = 1;
                } else if (data[i] >= 224 && data[i] <= 239) { //1110 XXXX
                    tail = 2;
                } else if (data[i] >= 240 && data[i] <= 247) { //1111 0XXX
                    tail = 3;
                } else if (data[i] >= 248 && data[i] <= 251) { //1111 10XX
                    tail = 4;
                } else if (data[i] >= 252 && data[i] <= 253) { //1111 110X
                    tail = 5;
                } else {
                    // TODO: malformed warning
                }
                character = data[i] & (0xFF >> (tail + 2));
            }
            if (tail <= 0) {
                output += String.fromCharCode(character);
            }
        }
        return output;
    }
    this.guessEncoding = function (data) {
        // For now, merely tries to distinguish ISO-8859-1, UTF-8 and Shift_JIS,
        // which should be by far the most common encodings.
        var length = data.length;
        var canBeISO88591 = true;
        var canBeShiftJIS = true;
        var canBeUTF8 = true;
        var utf8BytesLeft = 0;
        //var utf8LowChars = 0;
        var utf2BytesChars = 0;
        var utf3BytesChars = 0;
        var utf4BytesChars = 0;
        var sjisBytesLeft = 0;
        //var sjisLowChars = 0;
        var sjisKatakanaChars = 0;
        //var sjisDoubleBytesChars = 0;
        var sjisCurKatakanaWordLength = 0;
        var sjisCurDoubleBytesWordLength = 0;
        var sjisMaxKatakanaWordLength = 0;
        var sjisMaxDoubleBytesWordLength = 0;
        //var isoLowChars = 0;
        //var isoHighChars = 0;
        var isoHighOther = 0;

        var utf8bom = data.length > 3 &&
            data[0] == 0xEF &&
            data[1] == 0xBB &&
            data[2] == 0xBF;

        for (var i = 0;
            i < length && (canBeISO88591 || canBeShiftJIS || canBeUTF8);
            ++i) {

            var value = data[i] & 0xFF;

            // UTF-8 stuff
            if (canBeUTF8) {
                if (utf8BytesLeft > 0) {
                    if ((value & 0x80) == 0) {
                        canBeUTF8 = false;
                    } else {
                        --utf8BytesLeft;
                    }
                } else if ((value & 0x80) != 0) {
                    if ((value & 0x40) == 0) {
                        canBeUTF8 = false;
                    } else {
                        ++utf8BytesLeft;
                        if ((value & 0x20) == 0) {
                            ++utf2BytesChars;
                        } else {
                            ++utf8BytesLeft;
                            if ((value & 0x10) == 0) {
                                ++utf3BytesChars;
                            } else {
                                ++utf8BytesLeft;
                                if ((value & 0x08) == 0) {
                                    ++utf4BytesChars;
                                } else {
                                    canBeUTF8 = false;
                                }
                            }
                        }
                    }
                } //else {
                //++utf8LowChars;
                //}
            }

            // ISO-8859-1 stuff
            if (canBeISO88591) {
                if (value > 0x7F && value < 0xA0) {
                    canBeISO88591 = false;
                } else if (value > 0x9F) {
                    if (value < 0xC0 || value == 0xD7 || value == 0xF7) {
                        ++isoHighOther;
                    } //else {
                    //++isoHighChars;
                    //}
                } //else {
                //++isoLowChars;
                //}
            }

            // Shift_JIS stuff
            if (canBeShiftJIS) {
                if (sjisBytesLeft > 0) {
                    if (value < 0x40 || value == 0x7F || value > 0xFC) {
                        canBeShiftJIS = false;
                    } else {
                        --sjisBytesLeft;
                    }
                } else if (value == 0x80 || value == 0xA0 || value > 0xEF) {
                    canBeShiftJIS = false;
                } else if (value > 0xA0 && value < 0xE0) {
                    ++sjisKatakanaChars;
                    sjisCurDoubleBytesWordLength = 0;
                    ++sjisCurKatakanaWordLength;
                    if (sjisCurKatakanaWordLength > sjisMaxKatakanaWordLength) {
                        sjisMaxKatakanaWordLength = sjisCurKatakanaWordLength;
                    }
                } else if (value > 0x7F) {
                    ++sjisBytesLeft;
                    //+sjisDoubleBytesChars+;
                    sjisCurKatakanaWordLength = 0;
                    ++sjisCurDoubleBytesWordLength;
                    if (sjisCurDoubleBytesWordLength > sjisMaxDoubleBytesWordLength) {
                        sjisMaxDoubleBytesWordLength = sjisCurDoubleBytesWordLength;
                    }
                } else {
                    //++sjisLowChars;
                    sjisCurKatakanaWordLength = 0;
                    sjisCurDoubleBytesWordLength = 0;
                }
            }
        }

        if (canBeUTF8 && utf8BytesLeft > 0) {
            canBeUTF8 = false;
        }
        if (canBeShiftJIS && sjisBytesLeft > 0) {
            canBeShiftJIS = false;
        }

        // Easy -- if there is BOM or at least 1 valid not-single byte character (and no evidence it can't be UTF-8), done
        if (canBeUTF8 && (utf8bom || utf2BytesChars + utf3BytesChars + utf4BytesChars > 0)) {
            return this.UTF8Encoding(data);
        }
        // Easy -- if assuming Shift_JIS or at least 3 valid consecutive not-ascii characters (and no evidence it can't be), done
        if (canBeShiftJIS && (/*ASSUME_SHIFT_JIS || */
                sjisMaxKatakanaWordLength >= 3 || sjisMaxDoubleBytesWordLength >= 3)) {
            return this.ShiftJISEncoding(data);
        }
        // Distinguishing Shift_JIS and ISO-8859-1 can be a little tough for short words. The crude heuristic is:
        // - If we saw
        //   - only two consecutive katakana chars in the whole text, or
        //   - at least 10% of bytes that could be "upper" not-alphanumeric Latin1,
        // - then we conclude Shift_JIS, else ISO-8859-1
        if (canBeISO88591 && canBeShiftJIS) {
            return (sjisMaxKatakanaWordLength == 2 && sjisKatakanaChars == 2) || isoHighOther * 10 >= length
             ? this.ShiftJISEncoding(data) : this.ISO88591Encoding(data);
        }

        // Otherwise, try in order ISO-8859-1, Shift JIS, UTF-8 and fall back to default platform encoding
        if (canBeISO88591) {
            return this.ISO88591Encoding(data);
        }
        if (canBeShiftJIS) {
            return this.ShiftJISEncoding(data);
        }
        if (canBeUTF8) {
            return this.UTF8Encoding(data);
        }
        // Otherwise, we take a wild guess with platform encoding
        return this.defaultEncoding(data);
    }
    this.get8bitByteArray = function (dataLength) {
        var output = [];
        do {
            output.push(this.getNextBits(8));
        } while (--dataLength > 0);
        return this.guessEncoding(output);
    }
    this.getKanjiString = function (dataLength) {
        var unicodeString = "";
        do {
            var intData = this.getNextBits(13);
            var tempWord = ((intData / 0xC0) << 8) + intData % 0xC0;
            // between 8140 - 9FFC on Shift_JIS character set
            // between E040 - EBBF on Shift_JIS character set
            tempWord += tempWord < 0x01F00 ? 0x08140 : 0x0C140;
            unicodeString += this.ShiftJISEncoding([tempWord >> 8, tempWord & 0xFF]);
        } while (--dataLength > 0);

        return unicodeString;
    }
    this.getHanziString = function (dataLength) {
        var unicodeString = "";
        do {
            var intData = this.getNextBits(13);
            var tempWord = ((intData / 0x060) << 8) + (intData % 0x060);
            unicodeString += String.fromCharCode(tempWord + (tempWord < 0x003BF ? 0x0A1A1 : 0x0A6A1));
        } while (--dataLength > 0);

        return unicodeString;
    }
    this.__defineGetter__("DataByte", function () {
        var output = "";
        const MODE_NUMBERIC = 1;
        const MODE_ALPHA_NUMBERIC = 2;
        const MODE_STRUCTURED_APPEND = 3;
        const MODE_8BIT_BYTE = 4;
        const MODE_FNC1_FIRST_POSITION = 5;
        const MODE_ECI = 7;
        const MODE_KANJI = 8;
        const MODE_FNC1_SECOND_POSITION = 9;
        const MODE_HANZI = 10; // defined in GBT 18284-2000, may not be supported in foreign country

        const GB2312_SUBSET = 1;
        var fc1InEffect = false;
        var encoding;
        do {
            var mode = this.NextMode();
            if (mode == 0) {
                if (output.length > 0)
                    break;
                else
                    throw "Empty data block";
            }
            if (mode == MODE_FNC1_FIRST_POSITION || mode == MODE_FNC1_SECOND_POSITION) {
                // We do little with FNC1 except alter the parsed result a bit according to the spec
                fc1InEffect = true;
            } else if (mode == MODE_STRUCTURED_APPEND) {
                // sequence number and parity is added later to the result metadata
                // Read next 8 bits (symbol sequence #) and 8 bits (parity data), then continue
                // TODO: store the metadata
                var symbolSequence = this.getNextBits(8);
                var parityData = this.getNextBits(8);
            } else if (mode == MODE_ECI) {
                // Count doesn't apply to ECI
                var firstByte = this.getNextBits(8);
                if ((firstByte & 0x80) == 0) {
                    // just one byte
                    encoding = firstByte & 0x7F;
                } else if ((firstByte & 0xC0) == 0x80) {
                    // two bytes
                    var secondByte = this.getNextBits(8);
                    encoding = ((firstByte & 0x3F) << 8) | secondByte;
                } else if ((firstByte & 0xE0) == 0xC0) {
                    // three bytes
                    var secondThirdBytes = this.getNextBits(16);
                    encoding = ((firstByte & 0x1F) << 16) | secondThirdBytes;
                } else
                    throw "Invalid ECI Byte: " + firstByte;
                // TODO: ECI encoding for MODE_8BIT_BYTE
            } else {
                // First handle Hanzi mode which does not start with character count
                if (mode == MODE_HANZI) {
                    //chinese mode contains a sub set indicator right after mode indicator
                    var subset = this.getNextBits(4);
                    var countHanzi = this.getNextBits(this.getDataLength(mode));
                    if (subset == GB2312_SUBSET) {
                        output += getHanziString(countHanzi);
                    }
                } else {
                    let dataLength = this.getDataLength(mode);
                    if (dataLength < 1)
                        throw "Invalid data length: " + dataLength;
                    switch (mode) {
                    case MODE_NUMBERIC:
                        output += this.getNumericString(dataLength);
                        break;

                    case MODE_ALPHA_NUMBERIC:
                        var temp_str = this.getAlphaNumericString(dataLength);
                        if (fc1InEffect) {
                            for (var i = 0; i < temp_str.length; ++i) {
                                if (temp_str.charCodeAt(i) == '%') {
                                    if (i < temp_str.length - 1 && temp_str.charCodeAt(i + 1) == '%') {
                                        // %% is rendered as %
                                        temp_str = temp_str.substring(0, i + 1) + temp_str.substring(i + 2);
                                    } else {
                                        // In alpha mode, % should be converted to FNC1 separator 0x1D
                                        temp_str = temp_str.substring(0, i) + String.fromCharCode(0x1D) + temp_str.substring(i + 1);
                                    }
                                }
                            }
                        }
                        output += temp_str;
                        break;

                    case MODE_8BIT_BYTE:
                        output += this.get8bitByteArray(dataLength);
                        break;

                    case MODE_KANJI:
                        output += this.getKanjiString(dataLength);
                        break;
                    default:
                        throw "Invalid mode: " + mode + " in (block:" + this.blockPointer + " bit:" + this.bitOffset + ")";
                    }
                }
            }
        } while (true);
        return output;
    });
}

/*
  Ported to JavaScript by Lazar Laszlo 2011 
  
  lazarsoft@gmail.com, www.lazarsoft.info
  
*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


function BitMatrixParser(bitMatrix)
{
	var dimension = bitMatrix.Dimension;
	if (dimension < 21 || (dimension & 0x03) != 1)
	{
		throw "Error BitMatrixParser";
	}
	this.bitMatrix = bitMatrix;
	this.parsedVersion = null;
	this.parsedFormatInfo = null;
	
	this.copyBit=function( i,  j,  versionBits)
	{
		return this.bitMatrix.get_Renamed(i, j)?(versionBits << 1) | 0x1:versionBits << 1;
	}
	
	this.readFormatInformation=function()
	{
			if (this.parsedFormatInfo != null)
			{
				return this.parsedFormatInfo;
			}
			
			// Read top-left format info bits
			var formatInfoBits = 0;
			for (var i = 0; i < 6; ++i)
			{
				formatInfoBits = this.copyBit(i, 8, formatInfoBits);
			}
			// .. and skip a bit in the timing pattern ...
			formatInfoBits = this.copyBit(7, 8, formatInfoBits);
			formatInfoBits = this.copyBit(8, 8, formatInfoBits);
			formatInfoBits = this.copyBit(8, 7, formatInfoBits);
			// .. and skip a bit in the timing pattern ...
			for (var j = 5; j >= 0; --j)
			{
				formatInfoBits = this.copyBit(8, j, formatInfoBits);
			}
			
			this.parsedFormatInfo = FormatInformation.decodeFormatInformation(formatInfoBits);
			if (this.parsedFormatInfo != null)
			{
				return this.parsedFormatInfo;
			}
			
			// Hmm, failed. Try the top-right/bottom-left pattern
			var dimension = this.bitMatrix.Dimension;
			formatInfoBits = 0;
			var iMin = dimension - 8;
			for (var i = dimension - 1; i >= iMin; --i)
			{
				formatInfoBits = this.copyBit(i, 8, formatInfoBits);
			}
			for (var j = dimension - 7; j < dimension; ++j)
			{
				formatInfoBits = this.copyBit(8, j, formatInfoBits);
			}
			
			this.parsedFormatInfo = FormatInformation.decodeFormatInformation(formatInfoBits);
			if (this.parsedFormatInfo != null)
			{
				return this.parsedFormatInfo;
			}
			throw "Error readFormatInformation";	
	}
	this.readVersion=function()
		{
			
			if (this.parsedVersion != null)
			{
				return this.parsedVersion;
			}
			
			var dimension = this.bitMatrix.Dimension;
			
			var provisionalVersion = (dimension - 17) >> 2;
			if (provisionalVersion <= 6)
			{
				return Version.getVersionForNumber(provisionalVersion);
			}
			
			// Read top-right version info: 3 wide by 6 tall
			var versionBits = 0;
			var ijMin = dimension - 11;
			for (var j = 5; j >= 0; --j)
			{
				for (var i = dimension - 9; i >= ijMin; --i)
				{
					versionBits = this.copyBit(i, j, versionBits);
				}
			}
			
			this.parsedVersion = Version.decodeVersionInformation(versionBits);
			if (this.parsedVersion != null && this.parsedVersion.DimensionForVersion == dimension)
			{
				return this.parsedVersion;
			}
			
			// Hmm, failed. Try bottom left: 6 wide by 3 tall
			versionBits = 0;
			for (var i = 5; i >= 0; --i)
			{
				for (var j = dimension - 9; j >= ijMin; --j)
				{
					versionBits = this.copyBit(i, j, versionBits);
				}
			}
			
			this.parsedVersion = Version.decodeVersionInformation(versionBits);
			if (this.parsedVersion != null && this.parsedVersion.DimensionForVersion == dimension)
			{
				return this.parsedVersion;
			}
			throw "Error readVersion";
		}
	this.readCodewords=function()
		{
			
			var formatInfo = this.readFormatInformation();
			var version = this.readVersion();
			
			// Get the data mask for the format used in this QR Code. This will exclude
			// some bits from reading as we wind through the bit matrix.
			var dataMask = DataMask.forReference( formatInfo.DataMask);
			var dimension = this.bitMatrix.Dimension;
			dataMask.unmaskBitMatrix(this.bitMatrix, dimension);
			
			var functionPattern = version.buildFunctionPattern();
			
			var readingUp = true;
			var result = new Array(version.TotalCodewords);
			var resultOffset = 0;
			var currentByte = 0;
			var bitsRead = 0;
			// Read columns in pairs, from right to left
			for (var j = dimension - 1; j > 0; j -= 2)
			{
				if (j == 6)
				{
					// Skip whole column with vertical alignment pattern;
					// saves time and makes the other code proceed more cleanly
					--j;
				}
				// Read alternatingly from bottom to top then top to bottom
				for (var count = 0; count < dimension; ++count)
				{
					var i = readingUp?dimension - 1 - count:count;
					for (var col = 0; col < 2; ++col)
					{
						// Ignore bits covered by the function pattern
						if (!functionPattern.get_Renamed(j - col, i))
						{
							// Read a bit
							++bitsRead;
							currentByte <<= 1;
							if (this.bitMatrix.get_Renamed(j - col, i))
							{
								currentByte |= 1;
							}
							// If we've made a whole byte, save it off
							if (bitsRead == 8)
							{
								result[resultOffset++] =  currentByte;
								bitsRead = 0;
								currentByte = 0;
							}
						}
					}
				}
				readingUp ^= true; // readingUp = !readingUp; // switch directions
			}
			if (resultOffset != version.TotalCodewords)
			{
				throw "Error readCodewords";
			}
			return result;
		}
}
/*
  Ported to JavaScript by Lazar Laszlo 2011 
  
  lazarsoft@gmail.com, www.lazarsoft.info
  
*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


function ErrorCorrectionLevel(ordinal,  bits, name)
{
	this.ordinal_Renamed_Field = ordinal;
	this.bits = bits;
	this.name = name;
	this.__defineGetter__("Bits", function()
	{
		return this.bits;
	});
	this.__defineGetter__("Name", function()
	{
		return this.name;
	});
	this.ordinal=function()
	{
		return this.ordinal_Renamed_Field;
	}
}

ErrorCorrectionLevel.forBits=function( bits)
{
	if (bits < 0 || bits >= FOR_BITS.length)
	{
		throw "ArgumentException";
	}
	return FOR_BITS[bits];
}

var L = new ErrorCorrectionLevel(0, 0x01, "L");
var M = new ErrorCorrectionLevel(1, 0x00, "M");
var Q = new ErrorCorrectionLevel(2, 0x03, "Q");
var H = new ErrorCorrectionLevel(3, 0x02, "H");
var FOR_BITS = [M, L, H, Q];
/*
  Ported to JavaScript by Lazar Laszlo 2011 
  
  lazarsoft@gmail.com, www.lazarsoft.info
  
*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


var DataMask = {};

DataMask.forReference = function(reference)
{
	if (reference < 0 || reference > 7)
	{
		throw "System.ArgumentException";
	}
	return DataMask.DATA_MASKS[reference];
}

function DataMask000()
{
	this.unmaskBitMatrix=function(bits,  dimension)
	{
		for (var i = 0; i < dimension; ++i)
		{
			for (var j = 0; j < dimension; ++j)
			{
				if (this.isMasked(i, j))
				{
					bits.flip(j, i);
				}
			}
		}
	}
	this.isMasked=function( i,  j)
	{
		return ((i + j) & 0x01) == 0;
	}
}

function DataMask001()
{
	this.unmaskBitMatrix=function(bits,  dimension)
	{
		for (var i = 0; i < dimension; ++i)
		{
			for (var j = 0; j < dimension; ++j)
			{
				if (this.isMasked(i, j))
				{
					bits.flip(j, i);
				}
			}
		}
	}
	this.isMasked=function( i,  j)
	{
		return (i & 0x01) == 0;
	}
}

function DataMask010()
{
	this.unmaskBitMatrix=function(bits,  dimension)
	{
		for (var i = 0; i < dimension; ++i)
		{
			for (var j = 0; j < dimension; ++j)
			{
				if (this.isMasked(i, j))
				{
					bits.flip(j, i);
				}
			}
		}
	}
	this.isMasked=function( i,  j)
	{
		return j % 3 == 0;
	}
}

function DataMask011()
{
	this.unmaskBitMatrix=function(bits,  dimension)
	{
		for (var i = 0; i < dimension; ++i)
		{
			for (var j = 0; j < dimension; ++j)
			{
				if (this.isMasked(i, j))
				{
					bits.flip(j, i);
				}
			}
		}
	}
	this.isMasked=function( i,  j)
	{
		return (i + j) % 3 == 0;
	}
}

function DataMask100()
{
	this.unmaskBitMatrix=function(bits,  dimension)
	{
		for (var i = 0; i < dimension; ++i)
		{
			for (var j = 0; j < dimension; ++j)
			{
				if (this.isMasked(i, j))
				{
					bits.flip(j, i);
				}
			}
		}
	}
	this.isMasked=function( i,  j)
	{
		return (((URShift(i, 1)) + (j / 3)) & 0x01) == 0;
	}
}

function DataMask101()
{
	this.unmaskBitMatrix=function(bits,  dimension)
	{
		for (var i = 0; i < dimension; ++i)
		{
			for (var j = 0; j < dimension; ++j)
			{
				if (this.isMasked(i, j))
				{
					bits.flip(j, i);
				}
			}
		}
	}
	this.isMasked=function( i,  j)
	{
		var temp = i * j;
		return (temp & 0x01) + (temp % 3) == 0;
	}
}

function DataMask110()
{
	this.unmaskBitMatrix=function(bits,  dimension)
	{
		for (var i = 0; i < dimension; ++i)
		{
			for (var j = 0; j < dimension; ++j)
			{
				if (this.isMasked(i, j))
				{
					bits.flip(j, i);
				}
			}
		}
	}
	this.isMasked=function( i,  j)
	{
		var temp = i * j;
		return (((temp & 0x01) + (temp % 3)) & 0x01) == 0;
	}
}
function DataMask111()
{
	this.unmaskBitMatrix=function(bits,  dimension)
	{
		for (var i = 0; i < dimension; ++i)
		{
			for (var j = 0; j < dimension; ++j)
			{
				if (this.isMasked(i, j))
				{
					bits.flip(j, i);
				}
			}
		}
	}
	this.isMasked=function( i,  j)
	{
		return ((((i + j) & 0x01) + ((i * j) % 3)) & 0x01) == 0;
	}
}

DataMask.DATA_MASKS = [new DataMask000(), new DataMask001(), new DataMask010(), new DataMask011(), new DataMask100(), new DataMask101(), new DataMask110(), new DataMask111()];



/*
  Ported to JavaScript by Lazar Laszlo 2011

  lazarsoft@gmail.com, www.lazarsoft.info

*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/



function ECB(count,  dataCodewords)
{
	this.count = count;
	this.dataCodewords = dataCodewords;

	this.__defineGetter__("Count", function()
	{
		return this.count;
	});
	this.__defineGetter__("DataCodewords", function()
	{
		return this.dataCodewords;
	});
}

function ECBlocks( ecCodewordsPerBlock,  ecBlocks1,  ecBlocks2)
{
	this.ecCodewordsPerBlock = ecCodewordsPerBlock;
	if(ecBlocks2)
		this.ecBlocks = [ecBlocks1, ecBlocks2];
	else
		this.ecBlocks = [ecBlocks1];

	this.__defineGetter__("ECCodewordsPerBlock", function()
	{
		return this.ecCodewordsPerBlock;
	});

	this.__defineGetter__("TotalECCodewords", function()
	{
		return  this.ecCodewordsPerBlock * this.NumBlocks;
	});

	this.__defineGetter__("NumBlocks", function()
	{
		var total = 0;
		for (var i = 0; i < this.ecBlocks.length; ++i)
		{
			total += this.ecBlocks[i].length;
		}
		return total;
	});

	this.getECBlocks=function()
			{
				return this.ecBlocks;
			}
}

function Version( versionNumber,  alignmentPatternCenters,  ecBlocks1,  ecBlocks2,  ecBlocks3,  ecBlocks4)
{
	this.versionNumber = versionNumber;
	this.alignmentPatternCenters = alignmentPatternCenters;
	this.ecBlocks = [ecBlocks1, ecBlocks2, ecBlocks3, ecBlocks4];

	var total = 0;
	var ecCodewords = ecBlocks1.ECCodewordsPerBlock;
	var ecbArray = ecBlocks1.getECBlocks();
	for (var i = 0; i < ecbArray.length; ++i)
	{
		var ecBlock = ecbArray[i];
		total += ecBlock.Count * (ecBlock.DataCodewords + ecCodewords);
	}
	this.totalCodewords = total;

	this.__defineGetter__("VersionNumber", function()
	{
		return  this.versionNumber;
	});

	this.__defineGetter__("AlignmentPatternCenters", function()
	{
		return  this.alignmentPatternCenters;
	});
	this.__defineGetter__("TotalCodewords", function()
	{
		return  this.totalCodewords;
	});
	this.__defineGetter__("DimensionForVersion", function()
	{
		return  17 + 4 * this.versionNumber;
	});

	this.buildFunctionPattern=function()
		{
			var dimension = this.DimensionForVersion;
			var bitMatrix = new BitMatrix(dimension);

			// Top left finder pattern + separator + format
			bitMatrix.setRegion(0, 0, 9, 9);
			// Top right finder pattern + separator + format
			bitMatrix.setRegion(dimension - 8, 0, 8, 9);
			// Bottom left finder pattern + separator + format
			bitMatrix.setRegion(0, dimension - 8, 9, 8);

			// Alignment patterns
			var max = this.alignmentPatternCenters.length;
			for (var x = 0; x < max; ++x)
			{
				var i = this.alignmentPatternCenters[x] - 2;
				for (var y = 0; y < max; ++y)
				{
					if ((x == 0 && (y == 0 || y == max - 1)) || (x == max - 1 && y == 0))
					{
						// No alignment patterns near the three finder paterns
						continue;
					}
					bitMatrix.setRegion(this.alignmentPatternCenters[y] - 2, i, 5, 5);
				}
			}

			// Vertical timing pattern
			bitMatrix.setRegion(6, 9, 1, dimension - 17);
			// Horizontal timing pattern
			bitMatrix.setRegion(9, 6, dimension - 17, 1);

			if (this.versionNumber > 6)
			{
				// Version info, top right
				bitMatrix.setRegion(dimension - 11, 0, 3, 6);
				// Version info, bottom left
				bitMatrix.setRegion(0, dimension - 11, 6, 3);
			}

			return bitMatrix;
		}
	this.getECBlocksForLevel=function( ecLevel)
	{
		return this.ecBlocks[ecLevel.ordinal()];
	}
}

Version.VERSION_DECODE_INFO = [0x07C94, 0x085BC, 0x09A99, 0x0A4D3, 0x0BBF6, 0x0C762, 0x0D847, 0x0E60D, 0x0F928, 0x10B78, 0x1145D, 0x12A17, 0x13532, 0x149A6, 0x15683, 0x168C9, 0x177EC, 0x18EC4, 0x191E1, 0x1AFAB, 0x1B08E, 0x1CC1A, 0x1D33F, 0x1ED75, 0x1F250, 0x209D5, 0x216F0, 0x228BA, 0x2379F, 0x24B0B, 0x2542E, 0x26A64, 0x27541, 0x28C69];

Version.VERSIONS = buildVersions();

Version.getVersionForNumber=function( versionNumber)
{
	if (versionNumber < 1 || versionNumber > 40)
	{
		throw "ArgumentException";
	}
	return Version.VERSIONS[versionNumber - 1];
}

Version.getProvisionalVersionForDimension=function(dimension)
{
	if (dimension % 4 != 1)
	{
		throw "Error getProvisionalVersionForDimension";
	}
	try
	{
		return Version.getVersionForNumber((dimension - 17) >> 2);
	}
	catch ( iae)
	{
		throw "Error getVersionForNumber";
	}
}

Version.decodeVersionInformation=function( versionBits)
{
	var bestDifference = 0xffffffff;
	var bestVersion = 0;
	for (var i = 0; i < Version.VERSION_DECODE_INFO.length; ++i)
	{
		var targetVersion = Version.VERSION_DECODE_INFO[i];
		// Do the version info bits match exactly? done.
		if (targetVersion == versionBits)
		{
			return this.getVersionForNumber(i + 7);
		}
		// Otherwise see if this is the closest to a real version info bit string
		// we have seen so far
		var bitsDifference = FormatInformation.numBitsDiffering(versionBits, targetVersion);
		if (bitsDifference < bestDifference)
		{
			bestVersion = i + 7;
			bestDifference = bitsDifference;
		}
	}
	// We can tolerate up to 3 bits of error since no two version info codewords will
	// differ in less than 4 bits.
	if (bestDifference <= 3)
	{
		return this.getVersionForNumber(bestVersion);
	}
	// If we didn't find a close enough match, fail
	return null;
}

function buildVersions()
{
	return [new Version(1, [], new ECBlocks(7, new ECB(1, 19)), new ECBlocks(10, new ECB(1, 16)), new ECBlocks(13, new ECB(1, 13)), new ECBlocks(17, new ECB(1, 9))),
	new Version(2, [6, 18], new ECBlocks(10, new ECB(1, 34)), new ECBlocks(16, new ECB(1, 28)), new ECBlocks(22, new ECB(1, 22)), new ECBlocks(28, new ECB(1, 16))),
	new Version(3, [6, 22], new ECBlocks(15, new ECB(1, 55)), new ECBlocks(26, new ECB(1, 44)), new ECBlocks(18, new ECB(2, 17)), new ECBlocks(22, new ECB(2, 13))),
	new Version(4, [6, 26], new ECBlocks(20, new ECB(1, 80)), new ECBlocks(18, new ECB(2, 32)), new ECBlocks(26, new ECB(2, 24)), new ECBlocks(16, new ECB(4, 9))),
	new Version(5, [6, 30], new ECBlocks(26, new ECB(1, 108)), new ECBlocks(24, new ECB(2, 43)), new ECBlocks(18, new ECB(2, 15), new ECB(2, 16)), new ECBlocks(22, new ECB(2, 11), new ECB(2, 12))),
	new Version(6, [6, 34], new ECBlocks(18, new ECB(2, 68)), new ECBlocks(16, new ECB(4, 27)), new ECBlocks(24, new ECB(4, 19)), new ECBlocks(28, new ECB(4, 15))),
	new Version(7, [6, 22, 38], new ECBlocks(20, new ECB(2, 78)), new ECBlocks(18, new ECB(4, 31)), new ECBlocks(18, new ECB(2, 14), new ECB(4, 15)), new ECBlocks(26, new ECB(4, 13), new ECB(1, 14))),
	new Version(8, [6, 24, 42], new ECBlocks(24, new ECB(2, 97)), new ECBlocks(22, new ECB(2, 38), new ECB(2, 39)), new ECBlocks(22, new ECB(4, 18), new ECB(2, 19)), new ECBlocks(26, new ECB(4, 14), new ECB(2, 15))),
	new Version(9, [6, 26, 46], new ECBlocks(30, new ECB(2, 116)), new ECBlocks(22, new ECB(3, 36), new ECB(2, 37)), new ECBlocks(20, new ECB(4, 16), new ECB(4, 17)), new ECBlocks(24, new ECB(4, 12), new ECB(4, 13))),
	new Version(10, [6, 28, 50], new ECBlocks(18, new ECB(2, 68), new ECB(2, 69)), new ECBlocks(26, new ECB(4, 43), new ECB(1, 44)), new ECBlocks(24, new ECB(6, 19), new ECB(2, 20)), new ECBlocks(28, new ECB(6, 15), new ECB(2, 16))),
	new Version(11, [6, 30, 54], new ECBlocks(20, new ECB(4, 81)), new ECBlocks(30, new ECB(1, 50), new ECB(4, 51)), new ECBlocks(28, new ECB(4, 22), new ECB(4, 23)), new ECBlocks(24, new ECB(3, 12), new ECB(8, 13))),
	new Version(12, [6, 32, 58], new ECBlocks(24, new ECB(2, 92), new ECB(2, 93)), new ECBlocks(22, new ECB(6, 36), new ECB(2, 37)), new ECBlocks(26, new ECB(4, 20), new ECB(6, 21)), new ECBlocks(28, new ECB(7, 14), new ECB(4, 15))),
	new Version(13, [6, 34, 62], new ECBlocks(26, new ECB(4, 107)), new ECBlocks(22, new ECB(8, 37), new ECB(1, 38)), new ECBlocks(24, new ECB(8, 20), new ECB(4, 21)), new ECBlocks(22, new ECB(12, 11), new ECB(4, 12))),
	new Version(14, [6, 26, 46, 66], new ECBlocks(30, new ECB(3, 115), new ECB(1, 116)), new ECBlocks(24, new ECB(4, 40), new ECB(5, 41)), new ECBlocks(20, new ECB(11, 16), new ECB(5, 17)), new ECBlocks(24, new ECB(11, 12), new ECB(5, 13))),
	new Version(15, [6, 26, 48, 70], new ECBlocks(22, new ECB(5, 87), new ECB(1, 88)), new ECBlocks(24, new ECB(5, 41), new ECB(5, 42)), new ECBlocks(30, new ECB(5, 24), new ECB(7, 25)), new ECBlocks(24, new ECB(11, 12), new ECB(7, 13))),
	new Version(16, [6, 26, 50, 74], new ECBlocks(24, new ECB(5, 98), new ECB(1, 99)), new ECBlocks(28, new ECB(7, 45), new ECB(3, 46)), new ECBlocks(24, new ECB(15, 19), new ECB(2, 20)), new ECBlocks(30, new ECB(3, 15), new ECB(13, 16))),
	new Version(17, [6, 30, 54, 78], new ECBlocks(28, new ECB(1, 107), new ECB(5, 108)), new ECBlocks(28, new ECB(10, 46), new ECB(1, 47)), new ECBlocks(28, new ECB(1, 22), new ECB(15, 23)), new ECBlocks(28, new ECB(2, 14), new ECB(17, 15))),
	new Version(18, [6, 30, 56, 82], new ECBlocks(30, new ECB(5, 120), new ECB(1, 121)), new ECBlocks(26, new ECB(9, 43), new ECB(4, 44)), new ECBlocks(28, new ECB(17, 22), new ECB(1, 23)), new ECBlocks(28, new ECB(2, 14), new ECB(19, 15))),
	new Version(19, [6, 30, 58, 86], new ECBlocks(28, new ECB(3, 113), new ECB(4, 114)), new ECBlocks(26, new ECB(3, 44), new ECB(11, 45)), new ECBlocks(26, new ECB(17, 21), new ECB(4, 22)), new ECBlocks(26, new ECB(9, 13), new ECB(16, 14))),
	new Version(20, [6, 34, 62, 90], new ECBlocks(28, new ECB(3, 107), new ECB(5, 108)), new ECBlocks(26, new ECB(3, 41), new ECB(13, 42)), new ECBlocks(30, new ECB(15, 24), new ECB(5, 25)), new ECBlocks(28, new ECB(15, 15), new ECB(10, 16))),
	new Version(21, [6, 28, 50, 72, 94], new ECBlocks(28, new ECB(4, 116), new ECB(4, 117)), new ECBlocks(26, new ECB(17, 42)), new ECBlocks(28, new ECB(17, 22), new ECB(6, 23)), new ECBlocks(30, new ECB(19, 16), new ECB(6, 17))),
	new Version(22, [6, 26, 50, 74, 98], new ECBlocks(28, new ECB(2, 111), new ECB(7, 112)), new ECBlocks(28, new ECB(17, 46)), new ECBlocks(30, new ECB(7, 24), new ECB(16, 25)), new ECBlocks(24, new ECB(34, 13))),
	new Version(23, [6, 30, 54, 74, 102], new ECBlocks(30, new ECB(4, 121), new ECB(5, 122)), new ECBlocks(28, new ECB(4, 47), new ECB(14, 48)), new ECBlocks(30, new ECB(11, 24), new ECB(14, 25)), new ECBlocks(30, new ECB(16, 15), new ECB(14, 16))),
	new Version(24, [6, 28, 54, 80, 106], new ECBlocks(30, new ECB(6, 117), new ECB(4, 118)), new ECBlocks(28, new ECB(6, 45), new ECB(14, 46)), new ECBlocks(30, new ECB(11, 24), new ECB(16, 25)), new ECBlocks(30, new ECB(30, 16), new ECB(2, 17))),
	new Version(25, [6, 32, 58, 84, 110], new ECBlocks(26, new ECB(8, 106), new ECB(4, 107)), new ECBlocks(28, new ECB(8, 47), new ECB(13, 48)), new ECBlocks(30, new ECB(7, 24), new ECB(22, 25)), new ECBlocks(30, new ECB(22, 15), new ECB(13, 16))),
	new Version(26, [6, 30, 58, 86, 114], new ECBlocks(28, new ECB(10, 114), new ECB(2, 115)), new ECBlocks(28, new ECB(19, 46), new ECB(4, 47)), new ECBlocks(28, new ECB(28, 22), new ECB(6, 23)), new ECBlocks(30, new ECB(33, 16), new ECB(4, 17))),
	new Version(27, [6, 34, 62, 90, 118], new ECBlocks(30, new ECB(8, 122), new ECB(4, 123)), new ECBlocks(28, new ECB(22, 45), new ECB(3, 46)), new ECBlocks(30, new ECB(8, 23), new ECB(26, 24)), new ECBlocks(30, new ECB(12, 15), 		new ECB(28, 16))),
	new Version(28, [6, 26, 50, 74, 98, 122], new ECBlocks(30, new ECB(3, 117), new ECB(10, 118)), new ECBlocks(28, new ECB(3, 45), new ECB(23, 46)), new ECBlocks(30, new ECB(4, 24), new ECB(31, 25)), new ECBlocks(30, new ECB(11, 15), new ECB(31, 16))),
	new Version(29, [6, 30, 54, 78, 102, 126], new ECBlocks(30, new ECB(7, 116), new ECB(7, 117)), new ECBlocks(28, new ECB(21, 45), new ECB(7, 46)), new ECBlocks(30, new ECB(1, 23), new ECB(37, 24)), new ECBlocks(30, new ECB(19, 15), new ECB(26, 16))),
	new Version(30, [6, 26, 52, 78, 104, 130], new ECBlocks(30, new ECB(5, 115), new ECB(10, 116)), new ECBlocks(28, new ECB(19, 47), new ECB(10, 48)), new ECBlocks(30, new ECB(15, 24), new ECB(25, 25)), new ECBlocks(30, new ECB(23, 15), new ECB(25, 16))),
	new Version(31, [6, 30, 56, 82, 108, 134], new ECBlocks(30, new ECB(13, 115), new ECB(3, 116)), new ECBlocks(28, new ECB(2, 46), new ECB(29, 47)), new ECBlocks(30, new ECB(42, 24), new ECB(1, 25)), new ECBlocks(30, new ECB(23, 15), new ECB(28, 16))),
	new Version(32, [6, 34, 60, 86, 112, 138], new ECBlocks(30, new ECB(17, 115)), new ECBlocks(28, new ECB(10, 46), new ECB(23, 47)), new ECBlocks(30, new ECB(10, 24), new ECB(35, 25)), new ECBlocks(30, new ECB(19, 15), new ECB(35, 16))),
	new Version(33, [6, 30, 58, 86, 114, 142], new ECBlocks(30, new ECB(17, 115), new ECB(1, 116)), new ECBlocks(28, new ECB(14, 46), new ECB(21, 47)), new ECBlocks(30, new ECB(29, 24), new ECB(19, 25)), new ECBlocks(30, new ECB(11, 15), new ECB(46, 16))),
	new Version(34, [6, 34, 62, 90, 118, 146], new ECBlocks(30, new ECB(13, 115), new ECB(6, 116)), new ECBlocks(28, new ECB(14, 46), new ECB(23, 47)), new ECBlocks(30, new ECB(44, 24), new ECB(7, 25)), new ECBlocks(30, new ECB(59, 16), new ECB(1, 17))),
	new Version(35, [6, 30, 54, 78, 102, 126, 150], new ECBlocks(30, new ECB(12, 121), new ECB(7, 122)), new ECBlocks(28, new ECB(12, 47), new ECB(26, 48)), new ECBlocks(30, new ECB(39, 24), new ECB(14, 25)),new ECBlocks(30, new ECB(22, 15), new ECB(41, 16))),
	new Version(36, [6, 24, 50, 76, 102, 128, 154], new ECBlocks(30, new ECB(6, 121), new ECB(14, 122)), new ECBlocks(28, new ECB(6, 47), new ECB(34, 48)), new ECBlocks(30, new ECB(46, 24), new ECB(10, 25)), new ECBlocks(30, new ECB(2, 15), new ECB(64, 16))),
	new Version(37, [6, 28, 54, 80, 106, 132, 158], new ECBlocks(30, new ECB(17, 122), new ECB(4, 123)), new ECBlocks(28, new ECB(29, 46), new ECB(14, 47)), new ECBlocks(30, new ECB(49, 24), new ECB(10, 25)), new ECBlocks(30, new ECB(24, 15), new ECB(46, 16))),
	new Version(38, [6, 32, 58, 84, 110, 136, 162], new ECBlocks(30, new ECB(4, 122), new ECB(18, 123)), new ECBlocks(28, new ECB(13, 46), new ECB(32, 47)), new ECBlocks(30, new ECB(48, 24), new ECB(14, 25)), new ECBlocks(30, new ECB(42, 15), new ECB(32, 16))),
	new Version(39, [6, 26, 54, 82, 110, 138, 166], new ECBlocks(30, new ECB(20, 117), new ECB(4, 118)), new ECBlocks(28, new ECB(40, 47), new ECB(7, 48)), new ECBlocks(30, new ECB(43, 24), new ECB(22, 25)), new ECBlocks(30, new ECB(10, 15), new ECB(67, 16))),
	new Version(40, [6, 30, 58, 86, 114, 142, 170], new ECBlocks(30, new ECB(19, 118), new ECB(6, 119)), new ECBlocks(28, new ECB(18, 47), new ECB(31, 48)), new ECBlocks(30, new ECB(34, 24), new ECB(34, 25)), new ECBlocks(30, new ECB(20, 15), new ECB(61, 16)))];
}
/*
  Ported to JavaScript by Lazar Laszlo 2011

  lazarsoft@gmail.com, www.lazarsoft.info

*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


function AlignmentPattern(posX, posY,  estimatedModuleSize)
{
	this.x=posX;
	this.y=posY;
	this.count = 1;
	this.estimatedModuleSize = estimatedModuleSize;

	this.__defineGetter__("EstimatedModuleSize", function()
	{
		return this.estimatedModuleSize;
	});
	this.__defineGetter__("Count", function()
	{
		return this.count;
	});
	this.__defineGetter__("X", function()
	{
		return Math.floor(this.x);
	});
	this.__defineGetter__("Y", function()
	{
		return Math.floor(this.y);
	});
	this.incrementCount = function()
	{
		++this.count;
	}
	this.aboutEquals=function( moduleSize,  i,  j)
		{
			if (Math.abs(i - this.y) <= moduleSize && Math.abs(j - this.x) <= moduleSize)
			{
				var moduleSizeDiff = Math.abs(moduleSize - this.estimatedModuleSize);
				return moduleSizeDiff <= 1.0 || moduleSizeDiff / this.estimatedModuleSize <= 1.0;
			}
			return false;
		}

}

function AlignmentPatternFinder( image,  startX,  startY,  width,  height,  moduleSize,  resultPointCallback)
{
	this.image = image;
	this.possibleCenters = [];
	this.startX = startX;
	this.startY = startY;
	this.width = width;
	this.height = height;
	this.moduleSize = moduleSize;
	this.crossCheckStateCount = [0,0,0];
	this.resultPointCallback = resultPointCallback;

	this.centerFromEnd=function(stateCount,  end)
		{
			return  (end - stateCount[2]) - stateCount[1] / 2.0;
		}
	this.foundPatternCross = function(stateCount)
		{
			var moduleSize = this.moduleSize;
			var maxVariance = moduleSize / 2.0;
			for (var i = 0; i < 3; ++i)
			{
				if (Math.abs(moduleSize - stateCount[i]) >= maxVariance)
				{
					return false;
				}
			}
			return true;
		}

	this.crossCheckVertical=function( startI,  centerJ,  maxCount,  originalStateCountTotal)
		{
			var image = this.image;

			var maxI = qrcode.height;
			var stateCount = this.crossCheckStateCount;
			stateCount[0] = 0;
			stateCount[1] = 0;
			stateCount[2] = 0;

			// Start counting up from center
			var i = startI;
			while (i >= 0 && image[centerJ + i*qrcode.width] && stateCount[1] <= maxCount)
			{
				++stateCount[1];
				--i;
			}
			// If already too many modules in this state or ran off the edge:
			if (i < 0 || stateCount[1] > maxCount)
			{
				return NaN;
			}
			while (i >= 0 && !image[centerJ + i*qrcode.width] && stateCount[0] <= maxCount)
			{
				++stateCount[0];
				--i;
			}
			if (stateCount[0] > maxCount)
			{
				return NaN;
			}

			// Now also count down from center
			i = startI + 1;
			while (i < maxI && image[centerJ + i*qrcode.width] && stateCount[1] <= maxCount)
			{
				++stateCount[1];
				++i;
			}
			if (i == maxI || stateCount[1] > maxCount)
			{
				return NaN;
			}
			while (i < maxI && !image[centerJ + i*qrcode.width] && stateCount[2] <= maxCount)
			{
				++stateCount[2];
				++i;
			}
			if (stateCount[2] > maxCount)
			{
				return NaN;
			}

			var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
			if (5 * Math.abs(stateCountTotal - originalStateCountTotal) >= 2 * originalStateCountTotal)
			{
				return NaN;
			}

			return this.foundPatternCross(stateCount)?this.centerFromEnd(stateCount, i):NaN;
		}

	this.handlePossibleCenter=function( stateCount,  i,  j)
		{
			var stateCountTotal = stateCount[0] + stateCount[1] + stateCount[2];
			var centerJ = this.centerFromEnd(stateCount, j);
			var centerI = this.crossCheckVertical(i, Math.floor (centerJ), 2 * stateCount[1], stateCountTotal);
			if (!isNaN(centerI))
			{
				var estimatedModuleSize = (stateCount[0] + stateCount[1] + stateCount[2]) / 3.0;
				var max = this.possibleCenters.length;
				for (var index = 0; index < max; ++index)
				{
					var center =  this.possibleCenters[index];
					// Look for about the same center and module size:
					if (center.aboutEquals(estimatedModuleSize, centerI, centerJ))
					{
						return new AlignmentPattern(centerJ, centerI, estimatedModuleSize);
					}
				}
				// Hadn't found this before; save it
				var point = new AlignmentPattern(centerJ, centerI, estimatedModuleSize);
				this.possibleCenters.push(point);
				if (this.resultPointCallback != null)
				{
					this.resultPointCallback.foundPossibleResultPoint(point);
				}
			}
			return null;
		}

	this.find = function()
	{
			var startX = this.startX;
			var height = this.height;
			var maxJ = startX + width;
			var middleI = startY + (height >> 1);
			// We are looking for black/white/black modules in 1:1:1 ratio;
			// this tracks the number of black/white/black modules seen so far
			var stateCount = [0,0,0];
			for (var iGen = 0; iGen < height; ++iGen)
			{
				// Search from middle outwards
				var i = middleI + ((iGen & 0x01) == 0?((iGen + 1) >> 1):- ((iGen + 1) >> 1));
				stateCount[0] = 0;
				stateCount[1] = 0;
				stateCount[2] = 0;
				var j = startX;
				// Burn off leading white pixels before anything else; if we start in the middle of
				// a white run, it doesn't make sense to count its length, since we don't know if the
				// white run continued to the left of the start point
				while (j < maxJ && !image[j + qrcode.width* i])
				{
					++j;
				}
				var currentState = 0;
				while (j < maxJ)
				{
					if (image[j + i*qrcode.width])
					{
						// Black pixel
						if (currentState == 1)
						{
							// Counting black pixels
							++stateCount[currentState];
						}
						else
						{
							// Counting white pixels
							if (currentState == 2)
							{
								// A winner?
								if (this.foundPatternCross(stateCount))
								{
									// Yes
									var confirmed = this.handlePossibleCenter(stateCount, i, j);
									if (confirmed != null)
									{
										return confirmed;
									}
								}
								stateCount[0] = stateCount[2];
								stateCount[1] = 1;
								stateCount[2] = 0;
								currentState = 1;
							}
							else
							{
								++stateCount[++currentState];
							}
						}
					}
					else
					{
						// White pixel
						if (currentState == 1)
						{
							// Counting black pixels
							++currentState;
						}
						++stateCount[currentState];
					}
					++j;
				}
				if (this.foundPatternCross(stateCount))
				{
					var confirmed = this.handlePossibleCenter(stateCount, i, maxJ);
					if (confirmed != null)
					{
						return confirmed;
					}
				}
			}

			// Hmm, nothing we saw was observed and confirmed twice. If we had
			// any guess at all, return it.
			if (!(this.possibleCenters.length == 0))
			{
				return  this.possibleCenters[0];
			}

			throw "Couldn't find enough alignment patterns";
		}

}
/*
  Ported to JavaScript by Lazar Laszlo 2011

  lazarsoft@gmail.com, www.lazarsoft.info

*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


function BitMatrix( width,  height)
{
	if(!height)
		height=width;
	if (width < 1 || height < 1)
	{
		throw "Both dimensions must be greater than 0";
	}
	this.width = width;
	this.height = height;
	var rowSize = width >> 5;
	if ((width & 0x1f) != 0)
	{
		++rowSize;
	}
	this.rowSize = rowSize;
	this.bits = new Array(rowSize * height);
	this.bits.fill(0);

	this.__defineGetter__("Width", function()
	{
		return this.width;
	});
	this.__defineGetter__("Height", function()
	{
		return this.height;
	});
	this.__defineGetter__("Dimension", function()
	{
		if (this.width != this.height)
		{
			throw "Can't call getDimension() on a non-square matrix";
		}
		return this.width;
	});

	this.get_Renamed=function( x,  y)
		{
			var offset = y * this.rowSize + (x >> 5);
			return ((URShift(this.bits[offset], (x & 0x1f))) & 1) != 0;
		}
	this.set_Renamed=function( x,  y)
		{
			var offset = y * this.rowSize + (x >> 5);
			this.bits[offset] |= 1 << (x & 0x1f);
		}
	this.flip=function( x,  y)
		{
			var offset = y * this.rowSize + (x >> 5);
			this.bits[offset] ^= 1 << (x & 0x1f);
		}
	this.clear=function()
		{
			this.bits.fill(0);
		}
	this.setRegion=function( left,  top,  width,  height)
		{
			if (top < 0 || left < 0)
			{
				throw "Left and top must be nonnegative";
			}
			if (height < 1 || width < 1)
			{
				throw "Height and width must be at least 1";
			}
			var right = left + width;
			var bottom = top + height;
			if (bottom > this.height || right > this.width)
			{
				throw "The region must fit inside the matrix";
			}
			for (var y = top; y < bottom; ++y)
			{
				var offset = y * this.rowSize;
				for (var x = left; x < right; ++x)
				{
					this.bits[offset + (x >> 5)] |= 1 << (x & 0x1f);
				}
			}
		}
}
/*
  Ported to JavaScript by Lazar Laszlo 2011

  lazarsoft@gmail.com, www.lazarsoft.info

*/

/*
*
* Copyright 2007 ZXing authors
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


var Decoder={};
Decoder.rsDecoder = new ReedSolomonDecoder(GF256.QR_CODE_FIELD);

Decoder.correctErrors=function( codewordBytes,  numDataCodewords)
{
	var numCodewords = codewordBytes.length;
	// First read into an array of ints
	var codewordsInts = new Array(numCodewords);
	for (var i = 0; i < numCodewords; ++i)
	{
		codewordsInts[i] = codewordBytes[i] & 0xFF;
	}
	var numECCodewords = codewordBytes.length - numDataCodewords;
	try
	{
		Decoder.rsDecoder.decode(codewordsInts, numECCodewords);
		//var corrector = new ReedSolomon(codewordsInts, numECCodewords);
		//corrector.correct();
	}
	catch ( rse)
	{
		throw rse;
	}
	// Copy back into array of bytes -- only need to worry about the bytes that were data
	// We don't care about errors in the error-correction codewords
	for (var i = 0; i < numDataCodewords; ++i)
	{
		codewordBytes[i] =  codewordsInts[i];
	}
}

Decoder.decode=function(bits)
{
	var parser = new BitMatrixParser(bits);
	var version = parser.readVersion();
	var ecLevel = parser.readFormatInformation().ErrorCorrectionLevel;

	// Read codewords
	var codewords = parser.readCodewords();

	// Separate into data blocks
	var dataBlocks = DataBlock.getDataBlocks(codewords, version, ecLevel);

	// Count total number of data bytes
	var totalBytes = 0;
	for (var i = 0; i < dataBlocks.length; ++i)
	{
		totalBytes += dataBlocks[i].NumDataCodewords;
	}
	var resultBytes = new Array(totalBytes);
	var resultOffset = 0;

	// Error-correct and copy data blocks together into a stream of bytes
	for (var j = 0; j < dataBlocks.length; ++j)
	{
		var dataBlock = dataBlocks[j];
		var codewordBytes = dataBlock.Codewords;
		var numDataCodewords = dataBlock.NumDataCodewords;
		Decoder.correctErrors(codewordBytes, numDataCodewords);
		for (var i = 0; i < numDataCodewords; ++i)
		{
			resultBytes[resultOffset++] = codewordBytes[i];
		}
	}

	// Decode the contents of that stream of bytes
	var reader = new QRCodeDataBlockReader(resultBytes, version.VersionNumber, ecLevel.Bits);
	return reader;
	//return DecodedBitStreamParser.decode(resultBytes, version, ecLevel);
}

export default qrcode;
