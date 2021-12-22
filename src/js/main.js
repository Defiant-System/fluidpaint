
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


@import "modules/variables.js"
@import "classes/snapshot.js"
@import "classes/painter.js"


@import "modules/color.js"
@import "modules/wrappedgl.js"
@import "modules/utilities.js"
@import "modules/rectangle.js"
@import "modules/brush.js"
@import "modules/simulator.js"
@import "modules/paint.js"


let canvas = document.createElement('canvas');
canvas.width = 640;
canvas.height = 480;

let wgl = WrappedGL.create(canvas),
	painter = new Painter(canvas, wgl);


const fluidpaint = {
	init() {
		// fast references
		this.wrapper = window.find(".wrapper");
		this.doc = $(document);
		this.cvs = this.wrapper.append(canvas);

		// bind event handlers
		this.cvs.on("mousedown", this.cvsDnD);
		this.doc.on("mousemove mouseup", this.cvsDnD);
	},
	dispatch(event) {
		let Self = fluidpaint,
			value,
			index,
			el;
		switch (event.type) {
			// system events
			case "window.open":
				break;
			case "window.focus":
				painter._update = true;
				break;
			case "window.blur":
				painter._update = false;
				break;
			// custom events
			case "open-help":
				defiant.shell("fs -u '~/help/index.md'");
				break;
		}
	},
	cvsDnD(event) {
		let Self = fluidpaint,
			Drag = Self.drag,
			position,
			mouseX,
			mouseY;
		switch (event.type) {
			case "mousedown":
				// create drag object
				Self.drag = {
					offset: {
						x: event.clientX - event.offsetX,
						y: event.clientY - event.offsetY,
					}
				};
				painter.interactionState = InteractionMode.PAINTING;
				painter.saveSnapshot();

				painter.brushX =
				painter.mouseX = event.offsetX;
				painter.brushY =
				painter.mouseY = event.offsetY;

				// bind event
				// Self.doc.on("mousemove mouseup", Self.cvsDnD);
				break;
			case "mousemove":
				position = Utilities.getMousePosition(event, Self.cvs[0]);
				mouseX = position.x;
				mouseY = Self.cvs[0].height - position.y;
				
				painter.brushX =
				painter.mouseX = mouseX;
				painter.brushY =
				painter.mouseY = mouseY;

				if (!painter.brushInitialized) {
					painter.brush.initialize(painter.brushX, painter.brushY, BRUSH_HEIGHT * painter.brushScale, painter.brushScale);
					painter.brushInitialized = true;
				}
				break;
			case "mouseup":
				painter.interactionState = InteractionMode.NONE;
				
				// bind event
				// Self.doc.off("mousemove mouseup", Self.cvsDnD);
				break;
		}
	}
};

window.exports = fluidpaint;
