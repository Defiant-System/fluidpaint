
const Shaders = {
	Fragment: {
		advect: `@import "shaders/advect.frag"`,
		splat: `@import "shaders/splat.frag"`,
		divergence: `@import "shaders/divergence.frag"`,
		jacobi: `@import "shaders/jacobi.frag"`,
		subtract: `@import "shaders/subtract.frag"`,
		resize: `@import "shaders/resize.frag"`,
		project: `@import "shaders/project.frag"`,
		brush: `@import "shaders/brush.frag"`,
		painting: `@import "shaders/painting.frag"`,
		panel: `@import "shaders/panel.frag"`,
		output: `@import "shaders/output.frag"`,
		shadow: `@import "shaders/shadow.frag"`,
		setbristles: `@import "shaders/setbristles.frag"`,
		updatevelocity: `@import "shaders/updatevelocity.frag"`,
		planeconstraint: `@import "shaders/planeconstraint.frag"`,
		bendingconstraint: `@import "shaders/bendingconstraint.frag"`,
		distanceconstraint: `@import "shaders/distanceconstraint.frag"`,
	},
	Vertex: {
		splat: `@import "shaders/splat.vert"`,
		brush: `@import "shaders/brush.vert"`,
		painting: `@import "shaders/painting.vert"`,
		fullscreen: `@import "shaders/fullscreen.vert"`,
	}
};


@import "modules/wrappedgl.js"
@import "modules/utilities.js"
@import "modules/rectangle.js"
@import "modules/brush.js"
@import "modules/simulator.js"
@import "modules/paint.js"


let canvas = document.createElement('canvas'),
	wgl = WrappedGL.create(canvas),
	painter = new Paint(canvas, wgl);


const fluidpaint = {
	init() {
		// fast references
		this.content = window.find("content");
		this.doc = $(document);
		this.cvs = this.content.append(canvas);

		this.dispatch({ type: "window.resize" });

		// bind event handlers
		this.cvs.on("mousedown", this.cvsDnD);
	},
	cvsDnD(event) {
		let Self = fluidpaint,
			Drag = Self.drag;
		switch (event.type) {
			case "mousedown":
				// create drag object
				Self.drag = {
					offset: {
						x: event.clientX - event.offsetX,
						y: event.clientY - event.offsetY,
					}
				};
				painter.interactionState === InteractionMode.PAINTING;
				painter.saveSnapshot();
				// bind event
				Self.doc.on("mousemove mouseup", Self.cvsDnD);
				break;
			case "mousemove":
				let mouseX = event.clientX - Drag.offset.x,
					mouseY = window.innerHeight - (event.clientY - Drag.offset.y);
				
				painter.mouseX =
				painter.brushX = mouseX;
				painter.mouseY =
				painter.brushY = mouseY;

				if (!painter.brushInitialized) {
					painter.brush.initialize(painter.brushX, painter.brushY, BRUSH_HEIGHT * painter.brushScale, painter.brushScale);
				}
				painter.update();
				break;
			case "mouseup":
				painter.interactionState === InteractionMode.NONE;
				// bind event
				Self.doc.off("mousemove mouseup", Self.cvsDnD);
				break;
		}
	},
	dispatch(event) {
		let Self = fluidpaint,
			el;
		switch (event.type) {
			// system events
			case "window.open":
				break;
			case "window.resize":
				// canvas
				Self.cvs.prop({ width: window.innerWidth, height: window.innerHeight });
				break;
			// custom events
			case "open-help":
				defiant.shell("fs -u '~/help/index.md'");
				break;
			case "clear":
				painter.clear();
				break;
			case "history-undo":
				painter.undo();
				break;
			case "history-redo":
				painter.redo();
				break;
			case "set-color":
				painter.brushColorHSVA = [.5, 1, 1, 0.8];
				break;
			case "color-mode":
				painter.colorModel = +event.arg;
				painter.update();
				break;
			case "quality":
				let index = +event.arg;
				painter.saveSnapshot();
				painter.resolutionScale = QUALITIES[index].resolutionScale;
				painter.simulator.changeResolution(painter.getPaintingResolutionWidth(), painter.getPaintingResolutionHeight());
				painter.update();

				console.log( painter.getPaintingResolutionWidth() );
				break;
			case "save":
			case "toggle-sidebar":
				console.log(event);
				break;
		}
	}
};

window.exports = fluidpaint;
