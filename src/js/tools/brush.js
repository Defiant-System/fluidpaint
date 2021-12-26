
// goya.tools.brush

{
	init() {
		// references to elements
		this.els = {
			doc: $(document),
			body: window.find(".workarea"),
		};
	},
	dispatch(event) {
		let APP = goya,
			Self = APP.tools.brush,
			el;
		// console.log(event);
		switch (event.type) {
			case "focus-tool":
				// bind event handlers
				Self.els.body.on("mousedown mousemove", Self.move);
				Self.els.doc.on("mouseup", Self.move);
				break;
			case "blur-tool":
				// unbind event handlers
				Self.els.body.off("mousedown mousemove", Self.move);
				Self.els.doc.off("mouseup", Self.move);
				break;
		}
	},
	move(event) {
		let Self = goya.tools.brush,
			canvas = STUDIO.canvas,
			painter = STUDIO.painter;
		switch (event.type) {
			case "mousedown":
				painter.interactionState = InteractionMode.PAINTING;
				painter.saveSnapshot();
				break;
			case "mousemove":
				let pos = Utilities.getMousePosition(event, canvas);
				painter.brushX = pos.x;
				painter.brushY = canvas.height - pos.y;

				if (!painter.brushInitialized) {
					painter.brush.initialize(painter.brushX, painter.brushY, painter.brushHeight * painter.brushScale, painter.brushScale);
					painter.brushInitialized = true;
				}
				break;
			case "mouseup":
				painter.interactionState = InteractionMode.NONE;
				break;
		}
	}
}