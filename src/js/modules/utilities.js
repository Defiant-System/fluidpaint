
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
	}
};

function pascalRow(n) {
	var line = [1];
	for (var k = 0; k < n; ++k) {
		line.push(line[k] * (n - k) / (k + 1));
	}
	return line;
}

//width should be an odd number
function makeBlurShader(width) {
	var coefficients = pascalRow(width - 1 + 2);

	//take the 1s off the ends
	coefficients.shift();
	coefficients.pop();
	
	var normalizationFactor = 0;
	for (var i = 0; i < coefficients.length; ++i) {
		normalizationFactor += coefficients[i]; 
	}

	var shader = [
		"precision highp float;",
		"uniform sampler2D u_input;",
		"uniform vec2 u_step;",
		"uniform vec2 u_resolution;",
		"void main () {",
			"vec4 total = vec4(0.0);",
			"vec2 coordinates = gl_FragCoord.xy / u_resolution;",
			"vec2 delta = u_step / u_resolution;",
	].join("\n");

	shader += "\n";

	for (var i = 0; i < width; ++i) {
		var offset = i - (width - 1) / 2;
		shader += "total += texture2D(u_input, coordinates + delta * " + offset.toFixed(1) + ") * " + coefficients[i].toFixed(1) + "; \n";
	}

	shader += "gl_FragColor = total / " + normalizationFactor.toFixed(1) + ";\n }";

	return shader;
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
