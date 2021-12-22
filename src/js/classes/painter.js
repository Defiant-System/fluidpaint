
class Painter {
	constructor(canvas, wgl) {
		this.canvas = canvas;
		this.wgl = wgl;

		wgl.getExtension("OES_texture_float");
		wgl.getExtension("OES_texture_float_linear");
		let maxTextureSize = wgl.getParameter(wgl.MAX_TEXTURE_SIZE);

		this.maxPaintingWidth = Math.min(MAX_PAINTING_WIDTH, maxTextureSize / QUALITIES[QUALITIES.length - 1].resolutionScale);
		this.framebuffer = wgl.createFramebuffer();
		this.paintingProgram = wgl.createProgram(Shaders.Vertex.painting, Shaders.Fragment.painting);
		this.paintingProgramRGB = wgl.createProgram(Shaders.Vertex.painting, "#define RGB \n "+ Shaders.Fragment.painting);
		this.brushProgram = wgl.createProgram(Shaders.Vertex.brush, Shaders.Fragment.brush, { "a_position": 0 });
		this.outputProgram = wgl.createProgram(Shaders.Vertex.fullscreen, Shaders.Fragment.output, { "a_position": 0 });

		this.quadVertexBuffer = wgl.createBuffer();
		wgl.bufferData(this.quadVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), wgl.STATIC_DRAW);


		this.paintingRectangle = new Rectangle(0, 0, canvas.width, canvas.height);
		//simulation resolution = painting resolution * resolution scale
		this.resolutionScale = QUALITIES[INITIAL_QUALITY].resolutionScale;
		this.simulator = new Simulator(wgl, this.paintingResolutionWidth, this.paintingResolutionHeight);
		this.snapshots = [];
		for (let i = 0; i < HISTORY_SIZE; ++i) { //we always keep around HISTORY_SIZE snapshots to avoid reallocating textures
			let texture = wgl.buildTexture(wgl.RGBA, wgl.FLOAT, this.paintingResolutionWidth, this.paintingResolutionHeight, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);
			wgl.framebufferTexture2D(this.framebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, texture, 0);
			wgl.clear(wgl.createClearState().bindFramebuffer(this.framebuffer), wgl.COLOR_BUFFER_BIT);
			this.snapshots.push(new Snapshot(texture, this.paintingRectangle.width, this.paintingRectangle.height, this.resolutionScale));
		}

		// while not undoing, the next snapshot index we"d save into; when undoing,
		// our current position in the snapshots - undo to snapshotIndex - 1,
		// redo to snapshotIndex + 1
		this.snapshotIndex = 0;
		this.undoing = false;
		// while undoing, the maximum snapshot index that can be applied
		this.maxRedoIndex = 0;
		// whether the user has moved their mouse at least once and we thus have a valid brush position
		this.brushInitialized = false;
		this.brushX = 0;
		this.brushY = 0;
		this.brushScale = 30;
		this.brushColorHSVA = [.75, 1, 1, 0.8];
		this.colorModel = ColorModel.RGB;
		this.brush = new Brush(wgl, MAX_BRISTLE_COUNT);

		this.paintingRectangle.left = Utilities.clamp(this.paintingRectangle.left, -this.paintingRectangle.width, canvas.width);
		this.paintingRectangle.bottom = Utilities.clamp(this.paintingRectangle.bottom, -this.paintingRectangle.height, canvas.height);
		this.mainProjectionMatrix = makeOrthographicMatrix(new Float32Array(16), 0.0, canvas.width, 0, canvas.height, -5000.0, 5000.0);
		this.canvasTexture = wgl.buildTexture(wgl.RGBA, wgl.UNSIGNED_BYTE, canvas.width, canvas.height, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);
		this.needsRedraw = true;
		
		this.mouseX = 0;
		this.mouseY = 0;
		this.spaceDown = false;

		//this is updated during resizing according to the new mouse position
		//when we finish resizing, we then resize the simulator to match
		this.newPaintingRectangle = null;
		this.interactionState = InteractionMode.NONE;

		this._clearState = wgl.createClearState().bindFramebuffer(this.framebuffer);

		var update = (function() {
			this.update();
			requestAnimationFrame(update);
		}).bind(this);
		update();
	}

	get paintingResolutionWidth() {
		return Math.ceil(this.paintingRectangle.width * this.resolutionScale);
	}

	get paintingResolutionHeight() {
		return Math.ceil(this.paintingRectangle.height * this.resolutionScale);
	}

	update() {
		let wgl = this.wgl,
			canvas = this.canvas,
			cvsWidth = canvas.width,
			cvsHeight = canvas.height;

		//update brush
		if (this.brushInitialized) {
			this.brush.update(this.brushX, this.brushY, BRUSH_HEIGHT * this.brushScale, this.brushScale);
		}

		//splat into paint and velocity textures
		if (this.interactionState === InteractionMode.PAINTING) {
			var splatRadius = SPLAT_RADIUS * this.brushScale;
			var splatColor = hsvToRyb(this.brushColorHSVA[0], this.brushColorHSVA[1], this.brushColorHSVA[2]);
			var alphaT = this.brushColorHSVA[3];
			//we scale alpha based on the number of bristles
			var bristleT = (this.brush.bristleCount - MIN_BRISTLE_COUNT) / (MAX_BRISTLE_COUNT - MIN_BRISTLE_COUNT);
			var minAlpha = mix(THIN_MIN_ALPHA, THICK_MIN_ALPHA, bristleT);
			var maxAlpha = mix(THIN_MAX_ALPHA, THICK_MAX_ALPHA, bristleT);
			var alpha = mix(minAlpha, maxAlpha, alphaT);
			splatColor[3] = alpha;
			var splatVelocityScale = SPLAT_VELOCITY_SCALE * splatColor[3] * this.resolutionScale;
			//splat paint
			this.simulator.splat(this.brush, Z_THRESHOLD * this.brushScale, this.paintingRectangle, splatColor, splatRadius, splatVelocityScale);
		}

		if (this.simulator.simulate()) this.needsRedraw = true;

		//the rectangle we end up drawing the painting into
		var clippedPaintingRectangle = this.paintingRectangle.clone().intersectRectangle(new Rectangle(0, 0, cvsWidth, cvsHeight));

		if (this.needsRedraw) {
			//draw painting into texture
			wgl.framebufferTexture2D(this.framebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.canvasTexture, 0);
			wgl.clear(this._clearState, wgl.COLOR_BUFFER_BIT | wgl.DEPTH_BUFFER_BIT);

			var paintingProgram = this.colorModel === ColorModel.RYB
								? this.paintingProgram
								: this.paintingProgramRGB;

			var paintingDrawState = wgl.createDrawState()
				.bindFramebuffer(this.framebuffer)
				.vertexAttribPointer(this.quadVertexBuffer, paintingProgram.getAttribLocation("a_position"), 2, wgl.FLOAT, false, 0, 0)
				.useProgram(paintingProgram)
				.uniform1f("u_featherSize", RESIZING_FEATHER_SIZE)
				.uniform1f("u_normalScale", NORMAL_SCALE / this.resolutionScale)
				.uniform1f("u_roughness", ROUGHNESS)
				.uniform1f("u_diffuseScale", DIFFUSE_SCALE)
				.uniform1f("u_specularScale", SPECULAR_SCALE)
				.uniform1f("u_F0", F0)
				.uniform3f("u_lightDirection", LIGHT_DIRECTION[0], LIGHT_DIRECTION[1], LIGHT_DIRECTION[2])
				.uniform2f("u_paintingPosition", this.paintingRectangle.left, this.paintingRectangle.bottom)
				.uniform2f("u_paintingResolution", this.simulator.resolutionWidth, this.simulator.resolutionHeight)
				.uniform2f("u_paintingSize", this.paintingRectangle.width, this.paintingRectangle.height)
				.uniform2f("u_screenResolution", cvsWidth, cvsHeight)
				.uniformTexture("u_paintTexture", 0, wgl.TEXTURE_2D, this.simulator.paintTexture)
				.viewport(clippedPaintingRectangle.left, clippedPaintingRectangle.bottom, clippedPaintingRectangle.width, clippedPaintingRectangle.height);
			wgl.drawArrays(paintingDrawState, wgl.TRIANGLE_STRIP, 0, 4);
		}

		//output painting to screen
		var outputDrawState = wgl.createDrawState()
		  .viewport(0, 0, cvsWidth, cvsHeight)
		  .useProgram(this.outputProgram)
		  .uniformTexture("u_input", 0, wgl.TEXTURE_2D, this.canvasTexture)
		  .vertexAttribPointer(this.quadVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0);

		wgl.drawArrays(outputDrawState, wgl.TRIANGLE_STRIP, 0, 4);

		//draw brush to screen
		if (this.interactionState !== InteractionMode.PAINTING) {
			var brushDrawState = wgl.createDrawState()
				.bindFramebuffer(null)
				.viewport(0, 0, cvsWidth, cvsHeight)
				.vertexAttribPointer(this.brush.brushTextureCoordinatesBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)
				.useProgram(this.brushProgram)
				.bindIndexBuffer(this.brush.brushIndexBuffer)
				.uniform4f("u_color", 0.6, 0.6, 0.6, 1.0)
				.uniformMatrix4fv("u_projectionViewMatrix", false, this.mainProjectionMatrix)
				.enable(wgl.DEPTH_TEST)
				.enable(wgl.BLEND)
				.blendFunc(wgl.DST_COLOR, wgl.ZERO)
				.uniformTexture("u_positionsTexture", 0, wgl.TEXTURE_2D, this.brush.positionsTexture);

			wgl.drawElements(brushDrawState, wgl.LINES, this.brush.indexCount * this.brush.bristleCount / this.brush.maxBristleCount, wgl.UNSIGNED_SHORT, 0);
		}
		
		this.needsRedraw = false;
	}

	clear() {
		this.simulator.clear();
		this.needsRedraw = true;
	}

	saveSnapshot() {
		if (this.snapshotIndex === HISTORY_SIZE) { //no more room in the snapshots
			//the last shall be first and the first shall be last...
			var front = this.snapshots.shift();
			this.snapshots.push(front);
			this.snapshotIndex -= 1;
		}

		this.undoing = false;
		var snapshot = this.snapshots[this.snapshotIndex]; //the snapshot to save into
		// if we need to resize the snapshot"s texture
		if (snapshot.textureWidth !== this.simulator.resolutionWidth || snapshot.textureHeight !== this.simulator.resolutionHeight) {
			wgl.rebuildTexture(snapshot.texture, wgl.RGBA, wgl.FLOAT, this.simulator.resolutionWidth, this.simulator.resolutionHeight, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);
		}

		this.simulator.copyPaintTexture(snapshot.texture);

		snapshot.paintingWidth = this.paintingRectangle.width;
		snapshot.paintingHeight = this.paintingRectangle.height;
		snapshot.resolutionScale = this.resolutionScale;

		this.snapshotIndex += 1;
	}

	applySnapshot() {}

	canUndo() {}

	canRedo() {}

	undo() {}

	redo() {}

	refreshDoButtons() {}

	save() {}

}
