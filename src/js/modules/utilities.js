
var Utilities = {
	swap: function(object, a, b) {
		var temp = object[a];
		object[a] = object[b];
		object[b] = temp;
	},
	clamp: function(x, min, max) {
		return Math.max(min, Math.min(max, x));
	},
	getMousePosition: function(event, element) {
		var boundingRect = element.getBoundingClientRect();
		return {
			x: event.clientX - boundingRect.left,
			y: event.clientY - boundingRect.top
		};
	},
	createCanvas(width, height) {
		let cvs = $(document.createElement("canvas")),
			ctx = cvs[0].getContext("2d");
		cvs.prop({ width, height });
		return { cvs, ctx }
	},
};

function keysInObject(object) {
	var count = 0;
	for (var key in object) {
		if (object.hasOwnProperty(key)) {
			count += 1;
		}
	}
	return count;
}

function buildShader(gl, type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	//log any errors
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.log(gl.getShaderInfoLog(shader));
	}
	return shader;
}

//assumes a and b are equal length
function arraysEqual(a, b) {
	for (var i = 0; i < a.length; ++i) {
		if (a[i] !== b[i]) return false;
	}
	return true;
}

function pascalRow(n) {
	var line = [1];
	for (var k = 0; k < n; ++k) {
		line.push(line[k] * (n - k) / (k + 1));
	}
	return line;
}

function hsvToRyb(h, s, v) {
	h = h % 1;
	var c = v * s,
		hDash = h * 6,
		x = c * (1 - Math.abs(hDash % 2 - 1)),
		mod = Math.floor(hDash),
		r = [c, x, 0, 0, x, c][mod],
		g = [x, c, c, x, 0, 0][mod],
		b = [0, 0, x, c, c, x][mod],
		m = v - c;
	r += m;
	g += m;
	b += m;
	return [r, g, b];
}

function makeOrthographicMatrix(matrix, left, right, bottom, top, near, far) {
	matrix[0] = 2 / (right - left);
	matrix[1] = 0;
	matrix[2] = 0;
	matrix[3] = 0;
	matrix[4] = 0;
	matrix[5] = 2 / (top - bottom);
	matrix[6] = 0;
	matrix[7] = 0;
	matrix[8] = 0;
	matrix[9] = 0;
	matrix[10] = -2 / (far - near);
	matrix[11] = 0;
	matrix[12] = -(right + left) / (right - left);
	matrix[13] = -(top + bottom) / (top - bottom);
	matrix[14] = -(far + near) / (far - near);
	matrix[15] = 1;

	return matrix;
}

function mix(a, b, t) {
	return (1.0 - t) * a + t * b;
}
