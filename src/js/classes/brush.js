
class Brush {
	constructor(wgl, maxBristleCount) {
		this.wgl = wgl;
		this.stiffnessVariation = 0.3;
		this.brushDamping = 0.15;
		this.gravity = 30;

		this.maxBristleCount = maxBristleCount;
		this._bristleCount = maxBristleCount; // number of bristles currently being used
		this.projectProgram = wgl.createProgram(Shaders.Vertex.fullscreen, Shaders.Fragment.project);
		this.distanceConstraintProgram = wgl.createProgram(Shaders.Vertex.fullscreen, Shaders.Fragment.distanceconstraint);
		this.planeConstraintProgram = wgl.createProgram(Shaders.Vertex.fullscreen, Shaders.Fragment.planeconstraint);
		this.bendingConstraintProgram = wgl.createProgram(Shaders.Vertex.fullscreen, Shaders.Fragment.bendingconstraint);
		this.setBristlesProgram = wgl.createProgram(Shaders.Vertex.fullscreen, Shaders.Fragment.setbristles);
		this.updateVelocityProgram = wgl.createProgram(Shaders.Vertex.fullscreen, Shaders.Fragment.updatevelocity);

		// contains bristle vertex positions
		// we index bristle along x axis
		// we index vertices of bristles along y axis
		this.positionsTexture = wgl.buildTexture(wgl.RGBA, wgl.FLOAT, maxBristleCount, VERTICES_PER_BRISTLE, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);
		this.previousPositionsTexture = wgl.buildTexture(wgl.RGBA, wgl.FLOAT, maxBristleCount, VERTICES_PER_BRISTLE, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);
		this.velocitiesTexture = wgl.buildTexture(wgl.RGBA, wgl.FLOAT, maxBristleCount, VERTICES_PER_BRISTLE, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);
		this.previousVelocitiesTexture = wgl.buildTexture(wgl.RGBA, wgl.FLOAT, maxBristleCount, VERTICES_PER_BRISTLE, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);
		this.projectedPositionsTexture = wgl.buildTexture(wgl.RGBA, wgl.FLOAT, maxBristleCount, VERTICES_PER_BRISTLE, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);
		this.projectedPositionsTextureTemp = wgl.buildTexture(wgl.RGBA, wgl.FLOAT, maxBristleCount, VERTICES_PER_BRISTLE, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);

		let brushTextureCoordinates = [];
		for (let bristle = 0; bristle < maxBristleCount; ++bristle) {
			for (let vertex = 0; vertex < VERTICES_PER_BRISTLE; ++vertex) {
				let textureX = (bristle + 0.5) / maxBristleCount,
					textureY = (vertex + 0.5) / VERTICES_PER_BRISTLE;
				brushTextureCoordinates.push(textureX);
				brushTextureCoordinates.push(textureY);
			}
		}

		this.brushTextureCoordinatesBuffer = wgl.createBuffer();
		wgl.bufferData(this.brushTextureCoordinatesBuffer, wgl.ARRAY_BUFFER, new Float32Array(brushTextureCoordinates), wgl.STATIC_DRAW);

		let randoms = [];
		for (let i = 0; i < maxBristleCount * VERTICES_PER_BRISTLE * 4; ++i) {
			randoms.push(Math.random());
		}
		this.randomsTexture = wgl.buildTexture(wgl.RGBA, wgl.FLOAT, maxBristleCount, VERTICES_PER_BRISTLE, new Float32Array(randoms), wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR); // contains projected positions

		let splatsPerSegment = 8,
			splatCoordinates = [],
			splatIndices = [],
			splatIndex = 0;
		for (let bristle = 0; bristle < maxBristleCount; ++bristle) {
			for (let vertex = 0; vertex < VERTICES_PER_BRISTLE - 1; ++vertex) {
				// we create a quad for each bristle vertex
				for (let i = 0; i < splatsPerSegment; ++i) {
					let t = (i + 0.5) / splatsPerSegment,
						textureX = (bristle + 0.5) / maxBristleCount,
						textureY = (vertex + 0.5 + t) / VERTICES_PER_BRISTLE;
					// bottom left
					splatCoordinates.push(textureX);
					splatCoordinates.push(textureY);
					splatCoordinates.push(-1);
					splatCoordinates.push(-1);
					// bottom right
					splatCoordinates.push(textureX);
					splatCoordinates.push(textureY);
					splatCoordinates.push(1);
					splatCoordinates.push(-1);
					// top right
					splatCoordinates.push(textureX);
					splatCoordinates.push(textureY);
					splatCoordinates.push(1);
					splatCoordinates.push(1);
					// top left
					splatCoordinates.push(textureX);
					splatCoordinates.push(textureY);
					splatCoordinates.push(-1);
					splatCoordinates.push(1);

					splatIndices.push(splatIndex + 0);
					splatIndices.push(splatIndex + 1);
					splatIndices.push(splatIndex + 2);

					splatIndices.push(splatIndex + 2);
					splatIndices.push(splatIndex + 3);
					splatIndices.push(splatIndex + 0);

					splatIndex += 4;
				}
			}
		}

		this.splatCoordinatesBuffer = wgl.createBuffer();
		wgl.bufferData(this.splatCoordinatesBuffer, wgl.ARRAY_BUFFER, new Float32Array(splatCoordinates), wgl.STATIC_DRAW);

		this.splatIndexBuffer = wgl.createBuffer();
		wgl.bufferData(this.splatIndexBuffer, wgl.ELEMENT_ARRAY_BUFFER, new Uint16Array(splatIndices), wgl.STATIC_DRAW);

		this.splatIndexCount = splatIndices.length;

		let brushIndices = [];
		this.indexCount = 0;
		for (let bristle = 0; bristle < maxBristleCount; ++bristle) {
			for (let vertex = 0; vertex < VERTICES_PER_BRISTLE - 1; ++vertex) {
				let left = bristle * VERTICES_PER_BRISTLE + vertex,
					right = bristle * VERTICES_PER_BRISTLE + vertex + 1;

				brushIndices.push(left);
				brushIndices.push(right);

				this.indexCount += 2;
			}
		}

		this.brushIndexBuffer = wgl.createBuffer();
		wgl.bufferData(this.brushIndexBuffer, wgl.ELEMENT_ARRAY_BUFFER, new Uint16Array(brushIndices), wgl.STATIC_DRAW);

		this.simulationFramebuffer = wgl.createFramebuffer();

		this.quadVertexBuffer = wgl.createBuffer();
		wgl.bufferData(this.quadVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), wgl.STATIC_DRAW);
	}

	initialize(x, y, z, scale) {
		// sets all the bristle vertices
		this.positionX = x;
		this.positionY = y;
		this.positionZ = z;
		this.scale = scale;
		this.speeds = []; // most recent speed is stored at the highest index
		for (var i = 0; i < N_PREVIOUS_SPEEDS; ++i) {
			this.speeds.push(0);
		}

		var wgl = this.wgl;
		var setBristlesDrawState = wgl.createDrawState()
			.bindFramebuffer(this.simulationFramebuffer)
			.viewport(0, 0, this._bristleCount, VERTICES_PER_BRISTLE)
			.useProgram(this.setBristlesProgram)
			.uniform3f("u_brushPosition", this.positionX, this.positionY, this.positionZ)
			.uniform1f("u_brushScale", this.scale)
			.uniform1f("u_bristleCount", this._bristleCount)
			.uniform1f("u_bristleLength", BRISTLE_LENGTH)
			.uniform1f("u_verticesPerBristle", VERTICES_PER_BRISTLE)
			.uniform1f("u_jitter", BRISTLE_JITTER)
			.uniform2f("u_resolution", this.maxBristleCount, VERTICES_PER_BRISTLE)
			.uniformTexture("u_randomsTexture", 2, wgl.TEXTURE_2D, this.randomsTexture)
			.vertexAttribPointer(this.quadVertexBuffer, this.setBristlesProgram.getAttribLocation("a_position"), 2, wgl.FLOAT, false, 0, 0);

		wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.positionsTexture, 0);
		wgl.drawArrays(setBristlesDrawState, wgl.TRIANGLE_STRIP, 0, 4);
	}

	get bristleCount() {
		return this._bristleCount;
	}

	set bristleCount(newBristleCount) {
		var wgl = this.wgl;

		// we set all the bristle vertices that weren"t previously being simulated
		if (newBristleCount > this._bristleCount) {
			var setBristlesDrawState = wgl.createDrawState()
				.bindFramebuffer(this.simulationFramebuffer)
				.viewport(this._bristleCount, 0, (newBristleCount - this._bristleCount), VERTICES_PER_BRISTLE)
				.useProgram(this.setBristlesProgram)
				.uniform3f("u_brushPosition", this.positionX, this.positionY, this.positionZ)
				.uniform1f("u_brushScale", this.scale)
				.uniform1f("u_bristleCount", this._bristleCount)
				.uniform1f("u_bristleLength", BRISTLE_LENGTH)
				.uniform1f("u_verticesPerBristle", VERTICES_PER_BRISTLE)
				.uniform1f("u_jitter", BRISTLE_JITTER)
				.uniform2f("u_resolution", this.maxBristleCount, VERTICES_PER_BRISTLE)
				.uniformTexture("u_randomsTexture", 2, wgl.TEXTURE_2D, this.randomsTexture)
				.vertexAttribPointer(this.quadVertexBuffer, this.setBristlesProgram.getAttribLocation("a_position"), 2, wgl.FLOAT, false, 0, 0);

			wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.positionsTexture, 0);
			wgl.drawArrays(setBristlesDrawState, wgl.TRIANGLE_STRIP, 0, 4);
		}

		this._bristleCount = newBristleCount;
	}

	// max of last N_PREVIOUS_SPEEDS speeds
	get filteredSpeed() {
		return this.speeds.reduce((a, b) => Math.max(a, b));
	}

	update(x, y, z, scale) {
		var dx = x - this.positionX,
			dy = y - this.positionY,
			dz = z - this.positionZ,
			speed = Math.sqrt(dx * dx + dy * dy + dz * dz);

		this.speeds.shift();
		this.speeds.push(speed);
		this.positionX = x;
		this.positionY = y;
		this.positionZ = z;
		this.scale = scale;

		var wgl = this.wgl;
		var projectDrawState = wgl.createDrawState()
			.bindFramebuffer(this.simulationFramebuffer)
			.viewport(0, 0, this._bristleCount, VERTICES_PER_BRISTLE)
			.useProgram(this.projectProgram)
			.uniformTexture("u_positionsTexture", 0, wgl.TEXTURE_2D, this.positionsTexture)
			.uniformTexture("u_velocitiesTexture", 1, wgl.TEXTURE_2D, this.velocitiesTexture)
			.uniformTexture("u_randomsTexture", 2, wgl.TEXTURE_2D, this.randomsTexture)
			.uniform1f("u_gravity", this.gravity)
			.uniform1f("u_damping", this.brushDamping)
			.uniform1f("u_verticesPerBristle", VERTICES_PER_BRISTLE)
			.uniform2f("u_resolution", this.maxBristleCount, VERTICES_PER_BRISTLE)
			.vertexAttribPointer(this.quadVertexBuffer, this.projectProgram.getAttribLocation("a_position"), 2, wgl.FLOAT, false, 0, 0);

		wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.projectedPositionsTexture, 0);
		wgl.drawArrays(projectDrawState, wgl.TRIANGLE_STRIP, 0, 4);

		var setBristlesDrawState = wgl.createDrawState()
			.bindFramebuffer(this.simulationFramebuffer)
			.viewport(0, 0, this._bristleCount, 1)
			.useProgram(this.setBristlesProgram)
			.uniform3f("u_brushPosition", this.positionX, this.positionY, this.positionZ)
			.uniform1f("u_brushScale", this.scale)
			.uniform1f("u_bristleCount", this._bristleCount)
			.uniform1f("u_bristleLength", BRISTLE_LENGTH)
			.uniform1f("u_jitter", BRISTLE_JITTER)
			.uniform1f("u_verticesPerBristle", VERTICES_PER_BRISTLE)
			.uniform2f("u_resolution", this.maxBristleCount, VERTICES_PER_BRISTLE)
			.uniformTexture("u_randomsTexture", 2, wgl.TEXTURE_2D, this.randomsTexture)
			.vertexAttribPointer(this.quadVertexBuffer, this.setBristlesProgram.getAttribLocation("a_position"), 2, wgl.FLOAT, false, 0, 0);

		wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.projectedPositionsTexture, 0);
		wgl.drawArrays(setBristlesDrawState, wgl.TRIANGLE_STRIP, 0, 4);

		for (var i = 0; i < ITERATIONS; ++i) {
			// sets the base position of each bristle by setting first vertex (first row)
			wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.projectedPositionsTexture, 0);
			wgl.drawArrays(setBristlesDrawState, wgl.TRIANGLE_STRIP, 0, 4);

			for (var pass = 0; pass < 2; ++pass) {
				var constraintDrawState = wgl.createDrawState()
					.bindFramebuffer(this.simulationFramebuffer)
					.viewport(0, 0, this._bristleCount, VERTICES_PER_BRISTLE)
					.useProgram(this.distanceConstraintProgram)
					.uniformTexture("u_positionsTexture", 0, wgl.TEXTURE_2D, this.projectedPositionsTexture)
					.uniform1f("u_pointCount", VERTICES_PER_BRISTLE)
					.uniform1f("u_targetDistance", this.scale * BRISTLE_LENGTH / (VERTICES_PER_BRISTLE - 1))
					.uniform1i("u_pass", pass)
					.uniform2f("u_resolution", this.maxBristleCount, VERTICES_PER_BRISTLE)
					.vertexAttribPointer(this.quadVertexBuffer, this.distanceConstraintProgram.getAttribLocation("a_position"), 2, wgl.FLOAT, false, 0, 0);

				wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.projectedPositionsTextureTemp, 0);
				wgl.drawArrays(constraintDrawState, wgl.TRIANGLE_STRIP, 0, 4);

				Utilities.swap(this, "projectedPositionsTexture", "projectedPositionsTextureTemp");
			}

			for (var pass = 0; pass < 3; ++pass) {
				var constraintDrawState = wgl.createDrawState()
					.bindFramebuffer(this.simulationFramebuffer)
					.viewport(0, 0, this._bristleCount, VERTICES_PER_BRISTLE)
					.useProgram(this.bendingConstraintProgram)
					.uniformTexture("u_positionsTexture", 0, wgl.TEXTURE_2D, this.projectedPositionsTexture)
					.uniformTexture("u_randomsTexture", 1, wgl.TEXTURE_2D, this.randomsTexture)
					.uniform1f("u_pointCount", VERTICES_PER_BRISTLE)
					.uniform1f("u_stiffnessVariation", this.stiffnessVariation)
					.uniform1i("u_pass", pass)
					.uniform2f("u_resolution", this.maxBristleCount, VERTICES_PER_BRISTLE)
					.vertexAttribPointer(this.quadVertexBuffer, this.bendingConstraintProgram.getAttribLocation("a_position"), 2, wgl.FLOAT, false, 0, 0);

				wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.projectedPositionsTextureTemp, 0);
				wgl.drawArrays(constraintDrawState, wgl.TRIANGLE_STRIP, 0, 4);

				Utilities.swap(this, "projectedPositionsTexture", "projectedPositionsTextureTemp");
			}

			var constraintDrawState = wgl.createDrawState()
				.bindFramebuffer(this.simulationFramebuffer)
				.viewport(0, 0, this._bristleCount, VERTICES_PER_BRISTLE)
				.useProgram(this.planeConstraintProgram)
				.uniformTexture("u_positionsTexture", 0, wgl.TEXTURE_2D, this.projectedPositionsTexture)
				.uniform2f("u_resolution", this.maxBristleCount, VERTICES_PER_BRISTLE)
				.vertexAttribPointer(this.quadVertexBuffer, this.planeConstraintProgram.getAttribLocation("a_position"), 2, wgl.FLOAT, false, 0, 0);

			wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.projectedPositionsTextureTemp, 0);
			wgl.drawArrays(constraintDrawState, wgl.TRIANGLE_STRIP, 0, 4);

			Utilities.swap(this, "projectedPositionsTexture", "projectedPositionsTextureTemp");
		}

		var updateVelocityDrawState = wgl.createDrawState()
			.bindFramebuffer(this.simulationFramebuffer)
			.viewport(0, 0, this._bristleCount, VERTICES_PER_BRISTLE)
			.useProgram(this.updateVelocityProgram)
			.uniformTexture("u_positionsTexture", 0, wgl.TEXTURE_2D, this.positionsTexture)
			.uniformTexture("u_projectedPositionsTexture", 1, wgl.TEXTURE_2D, this.projectedPositionsTexture)
			.uniform2f("u_resolution", this.maxBristleCount, VERTICES_PER_BRISTLE)
			.vertexAttribPointer(this.quadVertexBuffer, this.distanceConstraintProgram.getAttribLocation("a_position"), 2, wgl.FLOAT, false, 0, 0);

		wgl.framebufferTexture2D(this.simulationFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.previousVelocitiesTexture, 0);
		wgl.drawArrays(updateVelocityDrawState, wgl.TRIANGLE_STRIP, 0, 4);

		Utilities.swap(this, "velocitiesTexture", "previousVelocitiesTexture");
		Utilities.swap(this, "previousPositionsTexture", "positionsTexture");
		Utilities.swap(this, "positionsTexture", "projectedPositionsTexture");
	}

}
