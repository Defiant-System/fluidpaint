
var Paint = (function() {

	function Paint(canvas, wgl) {
		this.canvas = canvas;
		this.wgl = wgl;

		wgl.getExtension("OES_texture_float");
		wgl.getExtension("OES_texture_float_linear");
		var maxTextureSize = wgl.getParameter(wgl.MAX_TEXTURE_SIZE);

		this.maxPaintingWidth = Math.min(MAX_PAINTING_WIDTH, maxTextureSize / QUALITIES[QUALITIES.length - 1].resolutionScale);
		this.framebuffer = wgl.createFramebuffer();
		this.paintingProgram = wgl.createProgram(Shaders.Vertex.painting, Shaders.Fragment.painting);
		this.paintingProgramRGB = wgl.createProgram(Shaders.Vertex.painting, "#define RGB \n "+ Shaders.Fragment.painting);
		this.resizingPaintingProgram = wgl.createProgram(Shaders.Vertex.painting, "#define RESIZING \n "+ Shaders.Fragment.painting);
		this.resizingPaintingProgramRGB = wgl.createProgram(Shaders.Vertex.painting, "#define RESIZING \n #define RGB \n "+ Shaders.Fragment.painting);
		this.savePaintingProgram = wgl.createProgram(Shaders.Vertex.painting, "#define SAVE \n "+ Shaders.Fragment.painting);
		this.savePaintingProgramRGB = wgl.createProgram(Shaders.Vertex.painting, "#define SAVE \n #define RGB \n "+ Shaders.Fragment.painting);
		this.brushProgram = wgl.createProgram(Shaders.Vertex.brush, Shaders.Fragment.brush, { "a_position": 0 });
		this.panelProgram = wgl.createProgram(Shaders.Vertex.fullscreen, Shaders.Fragment.panel, { "a_position": 0 });
		this.blurProgram = wgl.createProgram(Shaders.Vertex.fullscreen, makeBlurShader(PANEL_BLUR_SAMPLES), { "a_position": 0 });
		this.outputProgram = wgl.createProgram(Shaders.Vertex.fullscreen, Shaders.Fragment.output, { "a_position": 0 });
		this.shadowProgram = wgl.createProgram(Shaders.Vertex.fullscreen, Shaders.Fragment.shadow, { "a_position": 0 });

		this.quadVertexBuffer = wgl.createBuffer();
		wgl.bufferData(this.quadVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), wgl.STATIC_DRAW);

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;

		// position of painting on screen, and its dimensions units are pixels
		let width = Utilities.clamp(INITIAL_WIDTH, MIN_PAINTING_WIDTH, this.maxPaintingWidth),
			height = Utilities.clamp(INITIAL_HEIGHT, MIN_PAINTING_WIDTH, this.maxPaintingWidth),
			left = Math.round((canvas.width - width) / 2),
			bottom = Math.round((canvas.height - height) / 2);
		this.paintingRectangle = new Rectangle(left, bottom, width, height);

		//simulation resolution = painting resolution * resolution scale
		this.resolutionScale = QUALITIES[INITIAL_QUALITY].resolutionScale;
		this.simulator = new Simulator(wgl, this.getPaintingResolutionWidth(), this.getPaintingResolutionHeight());
		this.snapshots = [];
		for (var i = 0; i < HISTORY_SIZE; ++i) { //we always keep around HISTORY_SIZE snapshots to avoid reallocating textures
			var texture = wgl.buildTexture(wgl.RGBA, wgl.FLOAT, this.getPaintingResolutionWidth(), this.getPaintingResolutionHeight(), null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);
			wgl.framebufferTexture2D(this.framebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, texture, 0);
			wgl.clear(wgl.createClearState().bindFramebuffer(this.framebuffer), wgl.COLOR_BUFFER_BIT);
			this.snapshots.push(new Snapshot(texture, this.paintingRectangle.width, this.paintingRectangle.height, this.resolutionScale));
		}

		this.snapshotIndex = 0; //while not undoing, the next snapshot index we"d save into; when undoing, our current position in the snapshots - undo to snapshotIndex - 1, redo to snapshotIndex + 1
		this.undoing = false;
		this.maxRedoIndex = 0; //while undoing, the maximum snapshot index that can be applied
		this.brushInitialized = false; //whether the user has moved their mouse at least once and we thus have a valid brush position
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

		/**/
		canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
		canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
		document.addEventListener("mouseup", this.onMouseUp.bind(this));
		

		//these are used while we"re resizing
		this.resizingSide = ResizingSide.NONE; //which side we"re currently resizing

		//this is updated during resizing according to the new mouse position
		//when we finish resizing, we then resize the simulator to match
		this.newPaintingRectangle = null;
		this.interactionState = InteractionMode.NONE;

		this._clearState = wgl.createClearState().bindFramebuffer(this.framebuffer);

		// var update = (function() {
		// 	this.update();
		// 	requestAnimationFrame(update);
		// }).bind(this);
		// update();

		this.update();
	}

	Paint.prototype.update = function() {
		var wgl = this.wgl;
		var canvas = this.canvas;

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
		var clippedPaintingRectangle = this.paintingRectangle.clone().intersectRectangle(new Rectangle(0, 0, canvas.width, canvas.height));

		if (this.needsRedraw) {
			//draw painting into texture
			wgl.framebufferTexture2D(this.framebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, this.canvasTexture, 0);
			// wgl.clear(this._clearState, wgl.COLOR_BUFFER_BIT | wgl.DEPTH_BUFFER_BIT);

			var paintingProgram;
			if (this.colorModel === ColorModel.RYB) {
				paintingProgram = this.interactionState === InteractionMode.RESIZING ? this.resizingPaintingProgram : this.paintingProgram;
			} else if (this.colorModel === ColorModel.RGB) {
				paintingProgram = this.interactionState === InteractionMode.RESIZING ? this.resizingPaintingProgramRGB : this.paintingProgramRGB;
			}

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
				.uniform2f("u_screenResolution", canvas.width, canvas.height)
				.uniformTexture("u_paintTexture", 0, wgl.TEXTURE_2D, this.simulator.paintTexture)
				.viewport(clippedPaintingRectangle.left, clippedPaintingRectangle.bottom, clippedPaintingRectangle.width, clippedPaintingRectangle.height);
			wgl.drawArrays(paintingDrawState, wgl.TRIANGLE_STRIP, 0, 4);
		}

		//output painting to screen
		var outputDrawState = wgl.createDrawState()
		  .viewport(0, 0, canvas.width, canvas.height)
		  .useProgram(this.outputProgram)
		  .uniformTexture("u_input", 0, wgl.TEXTURE_2D, this.canvasTexture)
		  .vertexAttribPointer(this.quadVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0);

		wgl.drawArrays(outputDrawState, wgl.TRIANGLE_STRIP, 0, 4);

		this.drawShadow(PAINTING_SHADOW_ALPHA, clippedPaintingRectangle); //draw painting shadow

		//draw brush to screen
		if (this.interactionState !== InteractionMode.PAINTING) {
			var brushDrawState = wgl.createDrawState()
				.bindFramebuffer(null)
				.viewport(0, 0, canvas.width, canvas.height)
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
	};

	Paint.prototype.getPaintingResolutionWidth = function() {
		return Math.ceil(this.paintingRectangle.width * this.resolutionScale);
	};

	Paint.prototype.getPaintingResolutionHeight = function() {
		return Math.ceil(this.paintingRectangle.height * this.resolutionScale);
	};

	Paint.prototype.drawShadow = function(alpha, rectangle) {
		var wgl = this.wgl;
		var shadowDrawState = wgl.createDrawState()
		  .uniform2f("u_bottomLeft", rectangle.left, rectangle.bottom)
		  .uniform2f("u_topRight", rectangle.right, rectangle.top)
		  .uniform1f("u_sigma", BOX_SHADOW_SIGMA) 
		  .uniform1f("u_alpha", alpha) 
		  .enable(wgl.BLEND)
		  .blendFunc(wgl.ONE, wgl.ONE_MINUS_SRC_ALPHA)
		  .useProgram(this.shadowProgram)
		  .vertexAttribPointer(this.quadVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0);

		var rectangles = [
			new Rectangle(rectangle.left - BOX_SHADOW_WIDTH, rectangle.bottom - BOX_SHADOW_WIDTH, rectangle.width + 2 * BOX_SHADOW_WIDTH, BOX_SHADOW_WIDTH), //bottom
			new Rectangle(rectangle.left - BOX_SHADOW_WIDTH, rectangle.top, rectangle.width + 2 * BOX_SHADOW_WIDTH, BOX_SHADOW_WIDTH), //top
			new Rectangle(rectangle.left - BOX_SHADOW_WIDTH, rectangle.bottom, BOX_SHADOW_WIDTH, rectangle.height), //left
			new Rectangle(rectangle.right, rectangle.bottom, BOX_SHADOW_WIDTH, rectangle.height) // right
		];

		var screenRectangle = new Rectangle(0, 0, this.canvas.width, this.canvas.height);
		for (var i = 0; i < rectangles.length; ++i) {
			var rect = rectangles[i];
			rect.intersectRectangle(screenRectangle);

			if (rect.getArea() > 0) {
				shadowDrawState.viewport(rect.left, rect.bottom, rect.width, rect.height);
				wgl.drawArrays(shadowDrawState, wgl.TRIANGLE_STRIP, 0, 4);
			}
		}
	};


	Paint.prototype.clear = function() {
		this.simulator.clear();
		this.needsRedraw = true;
		this.update();
	};


	Paint.prototype.saveSnapshot = function() {
		if (this.snapshotIndex === HISTORY_SIZE) { //no more room in the snapshots
			//the last shall be first and the first shall be last...
			var front = this.snapshots.shift();
			this.snapshots.push(front);
			this.snapshotIndex -= 1;
		}

		this.undoing = false;
		var snapshot = this.snapshots[this.snapshotIndex]; //the snapshot to save into
		if (snapshot.textureWidth !== this.simulator.resolutionWidth || snapshot.textureHeight !== this.simulator.resolutionHeight) { //if we need to resize the snapshot"s texture
			wgl.rebuildTexture(snapshot.texture, wgl.RGBA, wgl.FLOAT, this.simulator.resolutionWidth, this.simulator.resolutionHeight, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.LINEAR, wgl.LINEAR);
		}

		this.simulator.copyPaintTexture(snapshot.texture);

		snapshot.paintingWidth = this.paintingRectangle.width;
		snapshot.paintingHeight = this.paintingRectangle.height;
		snapshot.resolutionScale = this.resolutionScale;

		this.snapshotIndex += 1;
		this.refreshDoButtons();
	};

	Paint.prototype.applySnapshot = function(snapshot) {
		this.paintingRectangle.width = snapshot.paintingWidth;
		this.paintingRectangle.height = snapshot.paintingHeight;

		if (this.resolutionScale !== snapshot.resolutionScale) {
			for (var i = 0; i < QUALITIES.length; ++i) {
				if (QUALITIES[i].resolutionScale === snapshot.resolutionScale) {
					this.qualityButtons.setIndex(i);
				}
			}

			this.resolutionScale = snapshot.resolutionScale;
		}

		if (this.simulator.width !== this.getPaintingResolutionWidth() || this.simulator.height !== this.getPaintingResolutionHeight()) {
			this.simulator.changeResolution(this.getPaintingResolutionWidth(), this.getPaintingResolutionHeight());
		}

		this.simulator.applyPaintTexture(snapshot.texture);
	};

	Paint.prototype.canUndo = function() {
		return this.snapshotIndex >= 1;
	};

	Paint.prototype.canRedo = function() {
		return this.undoing && this.snapshotIndex <= this.maxRedoIndex - 1;
	};

	Paint.prototype.undo = function() {
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
	};

	Paint.prototype.redo = function() {
		if (this.canRedo()) {
			this.applySnapshot(this.snapshots[this.snapshotIndex + 1]);
			this.snapshotIndex += 1;
		}

		this.refreshDoButtons();
		this.needsRedraw = true;
		this.update();
	};

	Paint.prototype.refreshDoButtons = function() {
		if (this.canUndo()) {
			// this.undoButton.className = "button do-button-active";
		} else {
			// this.undoButton.className = "button do-button-inactive";
		}

		if (this.canRedo()) {
			// this.redoButton.className = "button do-button-active";
		} else {
			// this.redoButton.className = "button do-button-inactive";
		}
	};

	Paint.prototype.save = function() {
		//we first render the painting to a WebGL texture
		var wgl = this.wgl;
		var saveWidth = this.paintingRectangle.width;
		var saveHeight = this.paintingRectangle.height;
		var saveTexture = wgl.buildTexture(wgl.RGBA, wgl.UNSIGNED_BYTE, saveWidth, saveHeight, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.NEAREST, wgl.NEAREST);
		var saveFramebuffer = wgl.createFramebuffer();
		wgl.framebufferTexture2D(saveFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, saveTexture, 0);
		var paintingProgram = this.colorModel === ColorModel.RYB ? this.savePaintingProgram : this.savePaintingProgramRGB;
		var saveDrawState = wgl.createDrawState()
			.bindFramebuffer(saveFramebuffer)
			.viewport(0, 0, saveWidth, saveHeight)
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

		//then we read back this texture
		var savePixels = new Uint8Array(saveWidth * saveHeight * 4);
		wgl.readPixels(wgl.createReadState().bindFramebuffer(saveFramebuffer),
						0, 0, saveWidth, saveHeight, wgl.RGBA, wgl.UNSIGNED_BYTE, savePixels);

		wgl.deleteTexture(saveTexture);
		wgl.deleteFramebuffer(saveFramebuffer);

		// then we draw the pixels to a 2D canvas and then save from the canvas
		// is there a better way?
		var saveCanvas = document.createElement("canvas");
		saveCanvas.width = saveWidth;
		saveCanvas.height = saveHeight;
		var saveContext = saveCanvas.getContext("2d");
		var imageData = saveContext.createImageData(saveWidth, saveHeight);
		imageData.data.set(savePixels);
		saveContext.putImageData(imageData, 0, 0);

		window.open(saveCanvas.toDataURL());
	};

	Paint.prototype.onMouseMove = function(event) {
		if (event.preventDefault) event.preventDefault();

		var position = Utilities.getMousePosition(event, this.canvas);
		var mouseX = position.x;
		var mouseY = this.canvas.height - position.y;

		this.brushX = mouseX;
		this.brushY = mouseY;

		if (!this.brushInitialized) {
			this.brush.initialize(this.brushX, this.brushY, BRUSH_HEIGHT * this.brushScale, this.brushScale);
			this.brushInitialized = true;
		}

		this.mouseX = mouseX;
		this.mouseY = mouseY;
		
		this.update();
	};

	Paint.prototype.onMouseDown = function(event) {
		if (event.preventDefault) event.preventDefault();
		if ("button" in event && event.button !== 0) return; //only handle left clicks

		var position = Utilities.getMousePosition(event, this.canvas);
		var mouseX = position.x;
		var mouseY = this.canvas.height - position.y;

		this.mouseX = mouseX;
		this.mouseY = mouseY;
		this.brushX = mouseX;
		this.brushY = mouseY;

		this.interactionState = InteractionMode.PAINTING;
		this.saveSnapshot();
	};

	Paint.prototype.onMouseUp = function(event) {
		if (event.preventDefault) event.preventDefault();

		this.interactionState = InteractionMode.NONE;
	};

	return Paint;
}());
