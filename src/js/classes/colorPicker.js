
var WIDTH = 240,
	HEIGHT = 200,
	//coordinates are all relative to [left, bottom]
	ALPHA_SLIDER_X = 210,
	ALPHA_SLIDER_Y = 5,
	ALPHA_SLIDER_WIDTH = 20,
	ALPHA_SLIDER_HEIGHT = 190,
	//center of the hue circle
	CIRCLE_X = 100,
	CIRCLE_Y = 100,
	INNER_RADIUS = 77,
	OUTER_RADIUS = 95,
	//dimensions of the inner saturation brightness square
	SQUARE_WIDTH = (INNER_RADIUS - 5) * Math.sqrt(2);


class ColorPicker {
	constructor(el, painter, wgl) {
		// references to elements
		this._el = el;
		this._doc = $(document);
		// bind event handlers
		this._el.on("mousedown", this.move.bind(this));
		// prepare shader program
		this.pickerProgram = wgl.createProgram(Shaders.Vertex.picker, Shaders.Fragment.picker, { "a_position": 0 });
		this.quadVertexBuffer = wgl.createBuffer();
		wgl.bufferData(this.quadVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), wgl.STATIC_DRAW);
		// initial paint
		this.draw();
	}

	draw() {
		//we first render the painting to a WebGL texture
		let saveTexture = wgl.buildTexture(wgl.RGBA, wgl.UNSIGNED_BYTE, WIDTH, HEIGHT, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.NEAREST, wgl.NEAREST);
		let saveFramebuffer = wgl.createFramebuffer();
		wgl.framebufferTexture2D(saveFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, saveTexture, 0);
		
		let hsva = [0, 1, 1, 1];
		// let hsva = painter.brushColorHSVA;
		let pickerDrawState = wgl.createDrawState()
			.bindFramebuffer(saveFramebuffer)
			.viewport(0, 0, WIDTH, HEIGHT)
			.vertexAttribPointer(this.quadVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)
			.useProgram(this.pickerProgram)
			.uniform2f("u_resolution", WIDTH, HEIGHT)
			.uniform1f("u_innerRadius", INNER_RADIUS)
			.uniform1f("u_outerRadius", OUTER_RADIUS)
			.uniform1f("u_squareWidth", SQUARE_WIDTH)
			.uniform2f("u_circlePosition", CIRCLE_X, CIRCLE_Y)
			.uniform2f("u_alphaSliderPosition", ALPHA_SLIDER_X, ALPHA_SLIDER_Y)
			.uniform2f("u_alphaSliderDimensions", ALPHA_SLIDER_WIDTH, ALPHA_SLIDER_HEIGHT)
			.uniform4f("u_currentHSVA", hsva[0], hsva[1], hsva[2], hsva[3])
			.uniform2f("u_screenResolution", WIDTH, HEIGHT)
			.uniform2f("u_position", 0, 0)
			.uniform2f("u_dimensions", WIDTH, HEIGHT)
			.enable(wgl.BLEND)
			.blendFunc(wgl.ONE, wgl.ONE_MINUS_SRC_ALPHA); //premultiplied alpha

		wgl.drawArrays(pickerDrawState, wgl.TRIANGLE_STRIP, 0, 4);

		//then we read back this texture
		let savePixels = new Uint8Array(WIDTH * HEIGHT * 4);
		wgl.readPixels(wgl.createReadState().bindFramebuffer(saveFramebuffer), 0, 0, WIDTH, HEIGHT, wgl.RGBA, wgl.UNSIGNED_BYTE, savePixels);
		wgl.deleteTexture(saveTexture);
		wgl.deleteFramebuffer(saveFramebuffer);

		// dim of canvas
		this._el.prop({ width: WIDTH, height: HEIGHT });
		// draw canvas element
		let ctx = this._el[0].getContext("2d"),
			imgData = ctx.createImageData(WIDTH, HEIGHT);
		imgData.data.set(savePixels);
		ctx.putImageData(imgData, 0, 0);
	}

	move(event) {
		let Self = this,
			Drag = Self.drag;
		switch (event.type) {
			case "mousedown":
				// prepare drag event
				let el = $(event.target),
					click = {
						y: event.clientY,
						x: event.clientX,
					};

				Self.drag = {
					el,
					click,
				};
				// bind event handler
				Self._el.on("mousemove mouseup", Self.move.bind(Self));
				break;
			case "mousemove":
				break;
			case "mouseup":
				// unbind event handler
				Self._el.off("mousemove mouseup", Self.move.bind(Self));
				break;
		}
	}
}
