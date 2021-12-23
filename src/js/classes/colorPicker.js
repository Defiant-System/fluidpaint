
var WIDTH = 240,
	HEIGHT = 200,
	//coordinates are all relative to [left, bottom]
	ALPHA_SLIDER_X = 220,
	ALPHA_SLIDER_Y = 10,
	ALPHA_SLIDER_WIDTH = 20,
	ALPHA_SLIDER_HEIGHT = 180,
	//center of the hue circle
	CIRCLE_X = 100,
	CIRCLE_Y = 100,
	INNER_RADIUS = 75,
	OUTER_RADIUS = 90,
	//dimensions of the inner saturation brightness square
	SQUARE_WIDTH = (INNER_RADIUS - 5) * Math.sqrt(2);


class ColorPicker {
	constructor(el, painter, wgl) {

		this.pickerProgram = wgl.createProgram(Shaders.Vertex.picker, Shaders.Fragment.picker, { 'a_position': 0 });
		this.pickerProgramRGB = wgl.createProgram(Shaders.Vertex.picker, '#define RGB \n '+Shaders.Fragment.picker, { 'a_position': 0 });
		this.quadVertexBuffer = wgl.createBuffer();
		
		wgl.bufferData(this.quadVertexBuffer, wgl.ARRAY_BUFFER, new Float32Array([-1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0]), wgl.STATIC_DRAW);

		//we first render the painting to a WebGL texture
		var saveTexture = wgl.buildTexture(wgl.RGBA, wgl.UNSIGNED_BYTE, WIDTH, HEIGHT, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.NEAREST, wgl.NEAREST);
		var saveFramebuffer = wgl.createFramebuffer();
		wgl.framebufferTexture2D(saveFramebuffer, wgl.FRAMEBUFFER, wgl.COLOR_ATTACHMENT0, wgl.TEXTURE_2D, saveTexture, 0);
		
		var hsva = painter.brushColorHSVA;
		var pickerDrawState = wgl.createDrawState()
			.bindFramebuffer(saveFramebuffer)
			.viewport(0, 0, WIDTH, HEIGHT)
			.vertexAttribPointer(this.quadVertexBuffer, 0, 2, wgl.FLOAT, wgl.FALSE, 0, 0)
			.useProgram(this.pickerProgram)
			.uniform2f('u_resolution', WIDTH, HEIGHT)
			.uniform1f('u_innerRadius', INNER_RADIUS)
			.uniform1f('u_outerRadius', OUTER_RADIUS)
			.uniform1f('u_squareWidth', SQUARE_WIDTH)
			.uniform2f('u_circlePosition', CIRCLE_X, CIRCLE_Y)
			.uniform2f('u_alphaSliderPosition', ALPHA_SLIDER_X, ALPHA_SLIDER_Y)
			.uniform2f('u_alphaSliderDimensions', ALPHA_SLIDER_WIDTH, ALPHA_SLIDER_HEIGHT)
			.uniform4f('u_currentHSVA', hsva[0], hsva[1], hsva[2], hsva[3])
			.uniform2f('u_screenResolution', WIDTH, HEIGHT)
			.uniform2f('u_position', 0, 0)
			.uniform2f('u_dimensions', WIDTH, HEIGHT)
			.enable(wgl.BLEND)
			.blendFunc(wgl.ONE, wgl.ONE_MINUS_SRC_ALPHA); //premultiplied alpha

		wgl.drawArrays(pickerDrawState, wgl.TRIANGLE_STRIP, 0, 4);



		//then we read back this texture
		var savePixels = new Uint8Array(WIDTH * HEIGHT * 4);
		wgl.readPixels(wgl.createReadState().bindFramebuffer(saveFramebuffer),
						0, 0, WIDTH, HEIGHT, wgl.RGBA, wgl.UNSIGNED_BYTE, savePixels);

		wgl.deleteTexture(saveTexture);
		wgl.deleteFramebuffer(saveFramebuffer);

		// then we draw the pixels to a 2D canvas and then save from the canvas
		// is there a better way?
		var saveCanvas = document.createElement("canvas");
		saveCanvas.width = WIDTH;
		saveCanvas.height = HEIGHT;
		var saveContext = saveCanvas.getContext("2d");
		var imageData = saveContext.createImageData(WIDTH, HEIGHT);
		imageData.data.set(savePixels);
		saveContext.putImageData(imageData, 0, 0);

		el.append(saveCanvas);
	}
}
