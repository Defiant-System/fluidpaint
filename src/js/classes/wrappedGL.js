
class WrappedGL {
	static create(canvas, options) {
		var gl = null;

		try {
			gl = canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options);
		} catch (e) {
			// no webgl support
			return null;
		}

		if (gl === null) return null;

		return new WrappedGL(gl);
	}

	constructor(gl) {
		this.gl = gl;
		for (var i = 0; i < CONSTANT_NAMES.length; i += 1) {
			this[CONSTANT_NAMES[i]] = gl[CONSTANT_NAMES[i]];
		};
		// parameters that aren"t default
		this.changedParameters = {};

		// each parameter is an object like
		/*
		{
			defaults: [values],
			setter: function(called with this set to gl)

			// undefined flag means not used
			usedInDraw: whether this state matters for drawing
			usedInClear: whether this state matters for clearing
			usedInRead: wheter this state matters for reading
		}

		// the number of parameters in each defaults array corresponds to the arity of the corresponding setter
		*/

		this.parameters = {
			framebuffer: {
				defaults: [null],
				setter: function(framebuffer) {
					gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
				},
				usedInDraw: true,
				usedInClear: true,
				usedInRead: true
			},
			program: {
				defaults: [ {program: null} ],
				setter: function(wrappedProgram) {
					gl.useProgram(wrappedProgram.program);
				},
				usedInDraw: true
			},
			viewport: {
				defaults: [0, 0, 0, 0],
				setter: gl.viewport,
				usedInDraw: true,
				usedInClear: true
			},
			indexBuffer: {
				defaults: [null],
				setter: function(buffer) {
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
				},
				usedInDraw: true
			},
			depthTest: {
				defaults: [false],
				setter: function(enabled) {
					if (enabled) {
						gl.enable(gl.DEPTH_TEST);
					} else {
						gl.disable(gl.DEPTH_TEST);
					}
				},
				usedInDraw: true
			},
			depthFunc: {
				defaults: [gl.LESS],
				setter: gl.depthFunc,
				usedInDraw: true
			},
			cullFace: {
				defaults: [false],
				setter: function(enabled) {
					if (enabled) {
						gl.enable(gl.CULL_FACE);
					} else {
						gl.disable(gl.CULL_FACE);
					}
				},
				usedInDraw: true
			},
			frontFace: {
				defaults: [gl.CCW],
				setter: gl.frontFace
			},
			blend: {
				defaults: [false],
				setter: function(enabled) {
					if (enabled) {
						gl.enable(gl.BLEND);
					} else {
						gl.disable(gl.BLEND);
					}
				},
				usedInDraw: true
			},
			blendEquation: {
				defaults: [gl.FUNC_ADD, gl.FUNC_ADD],
				setter: gl.blendEquationSeparate,
				usedInDraw: true
			},
			blendFunc: {
				defaults: [gl.ONE, gl.ZERO, gl.ONE, gl.ZERO],
				setter: gl.blendFuncSeparate,
				usedInDraw: true
			},
			polygonOffsetFill: {
				defaults: [false],
				setter: function(enabled) {
					if (enabled) {
						gl.enable(gl.POLYGON_OFFSET_FILL);
					} else {
						gl.disable(gl.POLYGON_OFFSET_FILL);
					}
				},
				usedInDraw: true
			},
			polygonOffset: {
				defaults: [0, 0],
				setter: gl.polygonOffset,
				usedInDraw: true
			},
			scissorTest: {
				defaults: [false],
				setter: function(enabled) {
					if (enabled) {
						gl.enable(gl.SCISSOR_TEST);
					} else {
						gl.disable(gl.SCISSOR_TEST);
					}
				},
				usedInDraw: true,
				usedInClear: true
			},
			scissor: {
				defaults: [0, 0, 0, 0],
				setter: gl.scissor,
				usedInDraw: true,
				usedInClear: true
			},
			colorMask: {
				defaults: [true, true, true, true],
				setter: gl.colorMask,
				usedInDraw: true,
				usedInClear: true
			},
			depthMask: {
				defaults: [true],
				setter: gl.depthMask,
				usedInDraw: true,
				usedInClear: true
			},
			clearColor: {
				defaults: [0, 0, 0, 0],
				setter: gl.clearColor,
				usedInClear: true
			},
			clearDepth: {
				defaults: [1],
				setter: gl.clearDepth,
				usedInClear: true
			}
		};
	}
}
