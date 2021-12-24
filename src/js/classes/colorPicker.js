
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
		this._debug = false;
		// bind event handlers
		this._el.parent().on("mousedown", this.move);
		// prepare shader program
		this.pickerProgram = wgl.createProgram(Shaders.Vertex.picker, Shaders.Fragment.picker, { "a_position": 0 });
		// this.pickerProgram = wgl.createProgram(Shaders.Vertex.picker, "#define RGB \n "+ Shaders.Fragment.picker, { "a_position": 0 });
		this.quadVertexBuffer = wgl.createBuffer();
		wgl.bufferData(this.quadVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), wgl.STATIC_DRAW);
		// initial paint
		this.draw();
		// for dev / debug purposes
		if (this._debug) {
			el.parent().addClass("debug");
		}
	}

	draw() {
		//we first render the painting to a WebGL texture
		let pickerTexture = wgl.buildTexture(wgl.RGBA, wgl.UNSIGNED_BYTE, WIDTH, HEIGHT, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.NEAREST, wgl.NEAREST);
		let pickerFramebuffer = wgl.createFramebuffer();
		wgl.framebufferTexture2D(pickerFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, pickerTexture, 0);
		
		let hsva = painter.brushColorHSVA;
		let pickerDrawState = wgl.createDrawState()
			.bindFramebuffer(pickerFramebuffer)
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
		let pixels = new Uint8Array(WIDTH * HEIGHT * 4);
		wgl.readPixels(wgl.createReadState().bindFramebuffer(pickerFramebuffer), 0, 0, WIDTH, HEIGHT, wgl.RGBA, wgl.UNSIGNED_BYTE, pixels);
		wgl.deleteTexture(pickerTexture);
		wgl.deleteFramebuffer(pickerFramebuffer);

		// dim of canvas
		this._el.prop({ width: WIDTH, height: HEIGHT });
		// draw canvas element
		let ctx = this._el[0].getContext("2d"),
			imgData = ctx.createImageData(WIDTH, HEIGHT);
		imgData.data.set(pixels);
		ctx.putImageData(imgData, 0, 0);
	}

	move(event) {
		let Self = picker,
			Drag = Self.drag,
			mY,
			mX;
		switch (event.type) {
			case "mousedown":
				// prepare drag event
				let el = $(event.target),
					type = el.prop("className"),
					rect = el[0].parentNode.getBoundingClientRect(),
					hsva = painter.brushColorHSVA,
					_PI = 180 / Math.PI,
					min = { x: 0, y: 0 },
					max = { x: 0, y: 0 },
					click = {
						y: event.clientY,
						x: event.clientX,
					};
				// operate on parent (root) element
				el = el.parent();
				switch (type) {
					case "picker-ring":
						mY = event.offsetY - 96;
						mX = event.offsetX - 96;
						click.deg = Math.round(Math.atan2(mY, mX) * _PI) + 90;
						if (click.deg < 0) click.deg += 360;
						click.y = rect.top + 111;
						click.x = rect.left + 111;
						break;
					case "picker-box":
						max.x = 82;
						max.y = 82;
						click.y -= event.offsetY;
						click.x -= event.offsetX;
						mY = Math.min(Math.max(event.offsetY - 10, min.y), max.y);
						mX = Math.min(Math.max(event.offsetX - 10, min.x), max.x);
						break;
					case "picker-alpha":
						max.y = 170;
						click.y -= event.offsetY;
						mY = Math.min(Math.max(event.offsetY - 10, min.y), max.y);
						break;
					default: return;
				}

				Self.drag = {
					el,
					min,
					max,
					_PI,
					type,
					hsva,
					click,
					painter,
					_min: Math.min,
					_max: Math.max,
					_round: Math.round,
					_atan2: Math.atan2,
				};
				// fake trigger event to update interface
				Self.move({
					type: "mousemove",
					clientX: event.clientX,
					clientY: event.clientY,
				});
				// bind event handler
				Self._doc.on("mousemove mouseup", Self.move);
				break;
			case "mousemove":
				let data = {},
					deg;
				switch (Drag.type) {
					case "picker-ring":
						mY = event.clientY - Drag.click.y;
						mX = event.clientX - Drag.click.x;
						deg = Drag._round(Drag._atan2(mY, mX) * Drag._PI) + 90;
						data["--cp-hue"] = `${deg}deg`;
						// update hue value of HSVA
						Drag.hsva[0] = ((deg + 270) % 360) / 360;
						// console.log( Drag.hsva );
						break;
					case "picker-box":
						mY = Drag._min(Drag._max(event.clientY - Drag.click.y - 10, Drag.min.y), Drag.max.y);
						mX = Drag._min(Drag._max(event.clientX - Drag.click.x - 10, Drag.min.x), Drag.max.x);
						data["--cp-slY"] = `${mY}px`;
						data["--cp-slX"] = `${mX}px`;
						// update saturation / lightness values of HSVA
						Drag.hsva[1] = mX / Drag.max.x;
						Drag.hsva[2] = mY / Drag.max.y;
						break;
					case "picker-alpha":
						mY = Drag._min(Drag._max(event.clientY - Drag.click.y - 10, Drag.min.y), Drag.max.y);
						data["--cp-alpha"] = `${mY}px`;
						// update alpha value of HSVA
						Drag.hsva[3] = mY / Drag.max.y;
						break;
				}
				if (Self._debug) Drag.el.css(data);
				Drag.painter.brushColorHSVA = Drag.hsva;
				Self.draw();
				break;
			case "mouseup":
				// unbind event handler
				Self._doc.off("mousemove mouseup", Self.move);
				break;
		}
	}
}
