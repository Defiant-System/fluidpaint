
// goya.tools.brush

{
	init() {
		// references to elements
		this.els = {
			doc: $(document),
			body: window.find(".workarea"),
		};

		// temp
		// let painter = STUDIO.painter;
		// setTimeout(() => {
		// 	this.dispatch({ type: "mousedown" });
		// 	painter.brush.initialize(100, 100, painter.brushHeight * painter.brushScale, painter.brushScale);

		// 	setTimeout(() => {
		// 		this.dispatch({ type: "mousemove", clientY: 400, clientX: 400 });

		// 		setTimeout(() => {
		// 			this.dispatch({ type: "mousemove", clientY: 540, clientX: 540 });

		// 			setTimeout(() => {
		// 				this.dispatch({ type: "mouseup" });
		// 			}, 500);
		// 		}, 500);

		// 	}, 700);
		// }, 100);
	},
	dispatch(event) {
		let APP = goya,
			Self = APP.tools.brush,
			canvas = STUDIO.canvas,
			painter = STUDIO.painter,
			pos,
			el;
		// console.log(event.type);
		switch (event.type) {
			// native events
			case "mousedown":
				painter.interactionState = InteractionMode.PAINTING;
				painter.saveSnapshot();
				break;
			case "mousemove":
				pos = Utilities.getMousePosition(event, canvas);
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
			// custom events
			case "focus-tool":
				// bind event handlers
				Self.els.body.on("mousedown mousemove", Self.dispatch);
				Self.els.doc.on("mouseup", Self.dispatch);
				// update interaction state
				painter.interactionState = InteractionMode.NONE;
				break;
			case "blur-tool":
				// unbind event handlers
				Self.els.body.off("mousedown mousemove", Self.dispatch);
				Self.els.doc.off("mouseup", Self.dispatch);
				break;
		}
	}
}