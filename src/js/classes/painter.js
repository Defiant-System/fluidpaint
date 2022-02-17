
class Painter {
	constructor(canvas, wgl) {
		this.canvas = canvas;
		this.wgl = wgl;

		wgl.getExtension("OES_texture_float");
		wgl.getExtension("OES_texture_float_linear");
		// let maxTextureSize = wgl.getParameter(wgl.MAX_TEXTURE_SIZE);

		this.framebuffer = wgl.createFramebuffer();
		this.paintingProgram = wgl.createProgram(Shaders.Vertex.painting, Shaders.Fragment.painting);
		this.resizingPaintingProgram = wgl.createProgram(Shaders.Vertex.painting, "#define RESIZING \n "+ Shaders.Fragment.painting);
		this.brushProgram = wgl.createProgram(Shaders.Vertex.brush, Shaders.Fragment.brush, { "a_position": 0 });
		this.outputProgram = wgl.createProgram(Shaders.Vertex.fullscreen, "#define OUTPUT \n"+ Shaders.Fragment.output, { "a_position": 0 });

		this.quadVertexBuffer = wgl.createBuffer();
		wgl.bufferData(this.quadVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), wgl.STATIC_DRAW);

		// this is updated during resizing according to the new mouse position
		// when we finish resizing, we then resize the simulator to match
		this.newPaintingRectangle = {};
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
		
		this.initalBrisleCount = 20;
		this.splatVelocityScale = 0.14;
		this.splatRadius = 0.05;
		this.brushScale = 20;
		this.brushHeight = 1.0;
		// this.brushColorHSVA = [Math.random(), 1, 1, 0.8];
		this.brushColorHSVA = [.75, 1, 1, 0.8];
		// this.brushColorHSVA = [.175, 1, 1, 0.8];
		this.brush = new Brush(wgl, 30, MAX_BRISTLE_COUNT);
		// this.resize();
		this.mainProjectionMatrix = makeOrthographicMatrix(new Float32Array(16), 0.0, canvas.width, 0, canvas.height, -5000.0, 5000.0);
		this.canvasTexture = wgl.buildTexture(wgl.RGBA, wgl.UNSIGNED_BYTE, canvas.width, canvas.height, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);
		this.needsRedraw = true;

		this.interactionState = InteractionMode.NONE;

		var update = () => {
				this.update();
				requestAnimationFrame(update);
			};

		update();
	}

	get paintingResolutionWidth() {
		return Math.ceil(this.paintingRectangle.width * this.resolutionScale);
	}

	get paintingResolutionHeight() {
		return Math.ceil(this.paintingRectangle.height * this.resolutionScale);
	}

	resize(dim={}) {
		let wgl = this.wgl,
			canvas = this.canvas,
			left = this.paintingRectangle.left || 0,
			bottom = this.paintingRectangle.bottom || 0;
		canvas.width = dim.width || canvas.width;
		canvas.height = dim.height || canvas.height;

		this.paintingRectangle = new Rectangle(left, bottom, dim.width, dim.height);
		this.mainProjectionMatrix = makeOrthographicMatrix(new Float32Array(16), 0.0, canvas.width, 0, canvas.height, -5000.0, 5000.0);
		this.canvasTexture = wgl.buildTexture(wgl.RGBA, wgl.UNSIGNED_BYTE, canvas.width, canvas.height, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);

		// notify application sidebar layers
		goya.sidebar.layers.dispatch({ type: "set-canvas", ...dim });

		this.needsRedraw = true;
	}

	update() {
		let wgl = this.wgl,
			canvas = this.canvas,
			cvsWidth = canvas.width,
			cvsHeight = canvas.height;

		//update brush
		if (this.brushInitialized) {
			this.brush.update(this.brushX, this.brushY, this.brushHeight * this.brushScale, this.brushScale);
		}

		//splat into paint and velocity textures
		if (this.interactionState === InteractionMode.PAINTING) {
			var splatRadius = this.splatRadius * this.brushScale;
			var splatColor = hsvToRyb(this.brushColorHSVA[0], this.brushColorHSVA[1], this.brushColorHSVA[2]);
			var alphaT = this.brushColorHSVA[3];
			//we scale alpha based on the number of bristles
			var bristleT = (this.brush.bristleCount - MIN_BRISTLE_COUNT) / (MAX_BRISTLE_COUNT - MIN_BRISTLE_COUNT);
			var minAlpha = mix(THIN_MIN_ALPHA, THICK_MIN_ALPHA, bristleT);
			var maxAlpha = mix(THIN_MAX_ALPHA, THICK_MAX_ALPHA, bristleT);
			var alpha = mix(minAlpha, maxAlpha, alphaT);
			splatColor[3] = alpha;
			var splatVelocityScale = this.splatVelocityScale * splatColor[3] * this.resolutionScale;
			//splat paint
			this.simulator.splat(this.brush, Z_THRESHOLD * this.brushScale, this.paintingRectangle, splatColor, splatRadius, splatVelocityScale);
		}

		if (this.simulator.simulate()) this.needsRedraw = true;

		if (this.needsRedraw) {
			//draw painting into texture
			wgl.framebufferTexture2D(this.framebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.canvasTexture, 0);
			let clearState = wgl.createClearState().bindFramebuffer(this.framebuffer);
			wgl.clear(clearState, wgl.COLOR_BUFFER_BIT | wgl.DEPTH_BUFFER_BIT);

			var paintingProgram = this.interactionState === InteractionMode.RESIZING ? this.resizingPaintingProgram : this.paintingProgram;
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
				.uniform2f("u_paintingSize", this.simulator.resolutionWidth, this.simulator.resolutionHeight)
				.uniform2f("u_screenResolution", this.paintingRectangle.width, this.paintingRectangle.height)
				.uniformTexture("u_paintTexture", 0, wgl.TEXTURE_2D, this.simulator.paintTexture)
				.viewport(0, 0, cvsWidth, cvsHeight);

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
		if (this.interactionState === InteractionMode.NONE) {
			var hsva = hsvToRyb(this.brushColorHSVA[0], this.brushColorHSVA[1], this.brushColorHSVA[2]);
			var brushDrawState = wgl.createDrawState()
				.bindFramebuffer(null)
				.vertexAttribPointer(this.brush.brushTextureCoordinatesBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)
				.useProgram(this.brushProgram)
				.bindIndexBuffer(this.brush.brushIndexBuffer)
				.uniform4f("u_color", hsva[0], hsva[1], hsva[2], 1.0)
				.uniformMatrix4fv("u_projectionViewMatrix", false, this.mainProjectionMatrix)
				.uniformTexture("u_positionsTexture", 0, wgl.TEXTURE_2D, this.brush.positionsTexture)
				.viewport(0, 0, cvsWidth, cvsHeight);

			wgl.drawElements(brushDrawState, wgl.LINES, this.brush.indexCount * this.brush.bristleCount / this.brush.maxBristleCount, wgl.UNSIGNED_SHORT, 0);
		}
		
		this.needsRedraw = false;
	}

	clear(hsl) {
		// hsl = hsl || [1, 1, 1];
		// this.wgl.gl.clearColor(...hsl, 0);
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
		var wgl = this.wgl;
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
		this.refreshDoButtons();
	}

	applySnapshot(snapshot) {
		this.paintingRectangle.width = snapshot.paintingWidth;
		this.paintingRectangle.height = snapshot.paintingHeight;
		if (this.resolutionScale !== snapshot.resolutionScale) {
			this.resolutionScale = snapshot.resolutionScale;
		}
		this.simulator.applyPaintTexture(snapshot.texture);
	}

	canUndo() {
		return this.snapshotIndex >= 1;
	}

	canRedo() {
		return this.undoing && this.snapshotIndex <= this.maxRedoIndex - 1;
	}

	undo() {
		if (!this.undoing) {
			this.saveSnapshot();
			this.undoing = true;
			this.snapshotIndex -= 1;
			this.maxRedoIndex = this.snapshotIndex;
		}
		if (this.canUndo()) {
			this.applySnapshot(this.snapshots[this.snapshotIndex - 1]);
			this.snapshotIndex -= 1;
		}
		this.refreshDoButtons();
		this.needsRedraw = true;
		this.update();
	}

	redo() {
		if (this.canRedo()) {
			this.applySnapshot(this.snapshots[this.snapshotIndex + 1]);
			this.snapshotIndex += 1;
		}
		this.refreshDoButtons();
		this.needsRedraw = true;
		this.update();
	}

	refreshDoButtons() {
		window.find(`.toolbar-tool_[data-click="history-undo"]`)
			.toggleClass("tool-disabled_", this.canUndo());
		window.find(`.toolbar-tool_[data-click="history-redo"]`)
			.toggleClass("tool-disabled_", this.canRedo());
	}

	toBlob(fnDone, mime, quality) {
		//we first render the painting to a WebGL texture
		var wgl = this.wgl,
			width = this.canvas.width,
			height = this.canvas.height,
			saveTexture = wgl.buildTexture(wgl.RGBA, wgl.UNSIGNED_BYTE, width, height, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.NEAREST, wgl.NEAREST),
			saveFramebuffer = wgl.createFramebuffer();
		
		wgl.framebufferTexture2D(saveFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, saveTexture, 0);
		
		var paintingProgram = this.paintingProgram;
		var saveDrawState = wgl.createDrawState()
			.bindFramebuffer(saveFramebuffer)
			.viewport(0, 0, width, height)
			.vertexAttribPointer(this.quadVertexBuffer, paintingProgram.getAttribLocation("a_position"), 2, wgl.FLOAT, false, 0, 0)
			.useProgram(paintingProgram)
			.uniform2f("u_paintingSize", this.paintingRectangle.width, this.paintingRectangle.height)
			.uniform2f("u_paintingResolution", this.simulator.resolutionWidth, this.simulator.resolutionHeight)
			.uniform2f("u_screenResolution", this.paintingRectangle.width, this.paintingRectangle.height)
			.uniform2f("u_paintingPosition", 0, 0)
			.uniformTexture("u_paintTexture", 0, wgl.TEXTURE_2D, this.simulator.paintTexture)
			.uniform1f("u_normalScale", NORMAL_SCALE / this.resolutionScale)
			.uniform1f("u_roughness", ROUGHNESS)
			.uniform1f("u_diffuseScale", DIFFUSE_SCALE)
			.uniform1f("u_specularScale", SPECULAR_SCALE)
			.uniform1f("u_F0", F0)
			.uniform3f("u_lightDirection", LIGHT_DIRECTION[0], LIGHT_DIRECTION[1], LIGHT_DIRECTION[2]);

		wgl.drawArrays(saveDrawState, wgl.TRIANGLE_STRIP, 0, 4);

		// then we read back this texture
		var savePixels = new Uint8Array(width * height * 4),
			buffer = wgl.createReadState().bindFramebuffer(saveFramebuffer);
		wgl.readPixels(buffer, 0, 0, width, height, wgl.RGBA, wgl.UNSIGNED_BYTE, savePixels);

		wgl.deleteTexture(saveTexture);
		wgl.deleteFramebuffer(saveFramebuffer);

		// then we draw the pixels to a 2D canvas and then save from the canvas
		// is there a better way?
		let { cvs, ctx } = Utilities.createCanvas(width, height),
			imgData = ctx.createImageData(width, height);
		imgData.data.set(savePixels);
		ctx.putImageData(imgData, 0, 0);
		ctx.translate(0, height);
		ctx.scale(1, -1);
		ctx.drawImage(cvs[0], 0, 0);

		return cvs[0].toBlob(fnDone, mime, quality);
	}

}
