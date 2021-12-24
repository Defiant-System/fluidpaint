
// we don"t have to specify any or all attribute location bindings
// any unspecified bindings will be assigned automatically and can be
// queried with program.getAttribLocation(attributeName)
	
class WrappedProgram {
	constructor(wgl, vertexShaderSource, fragmentShaderSource, requestedAttributeLocations) {
		this.uniformLocations = {};
		this.uniforms = {}; // TODO: if we want to cache uniform values in the future

		let gl = wgl.gl;

		// build shaders from source
		let vertexShader = buildShader(gl, gl.VERTEX_SHADER, vertexShaderSource),
			fragmentShader = buildShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

		// create program and attach shaders
		let program = this.program = gl.createProgram();
		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		
		// bind the attribute locations that have been specified in attributeLocations
		if (requestedAttributeLocations !== undefined) {
			for (let attributeName in requestedAttributeLocations) {
				gl.bindAttribLocation(program, requestedAttributeLocations[attributeName], attributeName);
			}
		}
		gl.linkProgram(program);

		// construct this.attributeLocations (maps attribute names to locations)
		this.attributeLocations = {};
		let numberOfAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
		for (let i = 0; i < numberOfAttributes; ++i) {
			let activeAttrib = gl.getActiveAttrib(program, i);
			let attributeName = activeAttrib.name;
			this.attributeLocations[attributeName] = gl.getAttribLocation(program, attributeName);
		}

		// cache uniform locations
		let uniformLocations = this.uniformLocations = {};
		let numberOfUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
		for (let i = 0; i < numberOfUniforms; i += 1) {
			let activeUniform = gl.getActiveUniform(program, i),
				uniformLocation = gl.getUniformLocation(program, activeUniform.name);
			uniformLocations[activeUniform.name] = uniformLocation;
		}
	}

	// TODO: maybe this should be on WrappedGL?
	getAttribLocation(name) {
		return this.attributeLocations[name];
	}
}
