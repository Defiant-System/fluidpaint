
class DrawState extends State {
	constructor(wgl) {
		super(wgl, wgl);

		// we always set uniforms
		this.uniforms = {}; // eg: {type: "3f", value: [x, y, z]}
	}

	bindFramebuffer(framebuffer) {
		this.setParameter("framebuffer", [framebuffer]);
		return this;
	}
	
	viewport(x, y, width, height) {
		this.setParameter("viewport", [x, y, width, height]);
		return this;
	}
	
	enable(cap) {
		if (cap === this.wgl.DEPTH_TEST) {
			this.setParameter("depthTest", [true]);
		} else if (cap === this.wgl.BLEND) {
			this.setParameter("blend", [true]);
		} else if (cap === this.wgl.CULL_FACE) {
			this.setParameter("cullFace", [true]);
		} else if (cap === this.wgl.POLYGON_OFFSET_FILL) {
			this.setParameter("polygonOffsetFill", [true]);   
		} else if (cap === this.wgl.SCISSOR_TEST) {
			this.setParameter("scissorTest", [true]);
		}
		return this;
	}
	
	disable(cap) {
		if (cap === this.wgl.DEPTH_TEST) {
			this.setParameter("depthTest", [false]);
		} else if (cap === this.wgl.BLEND) {
			this.setParameter("blend", [false]);
		} else if (cap === this.wgl.CULL_FACE) {
			this.setParameter("cullFace", [false]);
		} else if (cap === this.wgl.POLYGON_OFFSET_FILL) {
			this.setParameter("polygonOffsetFill", [false]);   
		} else if (cap === this.wgl.SCISSOR_TEST) {
			this.setParameter("scissorTest", [false]);
		}
		return this;
	}
	
	vertexAttribPointer(buffer, index, size, type, normalized, stride, offset) {
		this.setParameter("attributeArray" + index.toString(), [buffer, size, type, normalized, stride, offset]);

		if (this.instancedExt && this.changedParameters.hasOwnProperty("attributeDivisor" + index.toString())) {
			// we need to have divisor information for any attribute location that has a bound buffer
			this.setParameter("attributeDivisor" + index.toString(), [0]);
		}
		return this;
	}
	
	bindIndexBuffer(buffer) {
		this.setParameter("indexBuffer", [buffer]);
		return this;
	}
	
	depthFunc(func) {
		this.setParameter("depthFunc", [func]);
		return this;
	}
	
	frontFace(mode) {
		this.setParameter("frontFace", [mode]);
		return this;
	}
	
	blendEquation(mode) {
		this.blendEquationSeparate(mode, mode);
		return this;
	}
	
	blendEquationSeparate(modeRGB, modeAlpha) {
		this.setParameter("blendEquation", [modeRGB, modeAlpha]);
		return this;
	}
	
	blendFunc(sFactor, dFactor) {
		this.blendFuncSeparate(sFactor, dFactor, sFactor, dFactor);
		return this;
	}
	
	blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha) {
		this.setParameter("blendFunc", [srcRGB, dstRGB, srcAlpha, dstAlpha]);
		return this;
	}
	
	scissor(x, y, width, height) {
		this.setParameter("scissor", [x, y, width, height]);
		return this;
	}
	
	useProgram(program) {
		this.setParameter("program", [program]);
		return this;
	}
	
	bindTexture(unit, target, texture) {
		this.setParameter("texture" + unit.toString(), [target, texture]);
		return this;
	}
	
	colorMask(r, g, b, a) {
		this.setParameter("colorMask", [r, g, b, a]);
		return this;
	}
	
	depthMask(enabled) {
		this.setParameter("depthMask", [enabled]);
		return this;
	}
	
	polygonOffset(factor, units) {
		this.setParameter("polygonOffset", [factor, units]);
		return this;
	}
	
	uniformTexture(uniformName, unit, target, texture) {
		this.uniform1i(uniformName, unit);
		this.bindTexture(unit, target, texture);
		return this;
	}
	
	uniform1i(uniformName, value) {
		this.uniforms[uniformName] = {type: "1i", value: [value]};
		return this;
	}
	
	uniform2i(uniformName, x, y) {
		this.uniforms[uniformName] = {type: "2i", value: [x, y]};
		return this;
	}
	
	uniform3i(uniformName, x, y, z) {
		this.uniforms[uniformName] = {type: "3i", value: [x, y, z]};
		return this;
	}
	
	uniform4i(uniformName, x, y, z ,w) {
		this.uniforms[uniformName] = {type: "4i", value: [x, y, z, w]};
		return this;
	}
	
	uniform1f(uniformName, value) {
		this.uniforms[uniformName] = {type: "1f", value: value};
		return this;
	}
	
	uniform2f(uniformName, x, y) {
		this.uniforms[uniformName] = {type: "2f", value: [x, y]};
		return this;
	}
	
	uniform3f(uniformName, x, y, z) {
		this.uniforms[uniformName] = {type: "3f", value: [x, y, z]};
		return this;
	}
	
	uniform4f(uniformName, x, y, z ,w) {
		this.uniforms[uniformName] = {type: "4f", value: [x, y, z, w]};
		return this;
	}
	
	uniform1fv(uniformName, value) {
		this.uniforms[uniformName] = {type: "1fv", value: [value]};
		return this;
	}
	
	uniform2fv(uniformName, value) {
		this.uniforms[uniformName] = {type: "2fv", value: [value]};
		return this;
	}
	
	uniform3fv(uniformName, value) {
		this.uniforms[uniformName] = {type: "3fv", value: [value]};
		return this;
	}
	
	uniform4fv(uniformName, value) {
		this.uniforms[uniformName] = {type: "4fv", value: [value]};
		return this;
	}
	
	uniformMatrix2fv(uniformName, transpose, matrix) {
		this.uniforms[uniformName] = {type: "matrix2fv", value: [transpose, matrix]};
		return this;
	}
	
	uniformMatrix3fv(uniformName, transpose, matrix) {
		this.uniforms[uniformName] = {type: "matrix3fv", value: [transpose, matrix]};
		return this;
	}
	
	uniformMatrix4fv(uniformName, transpose, matrix) {
		this.uniforms[uniformName] = {type: "matrix4fv", value: [transpose, matrix]};
		return this;
	}
	
}
