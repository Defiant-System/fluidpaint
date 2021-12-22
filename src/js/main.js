
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
@import "classes/brush.js"


@import "modules/color.js"
@import "modules/wrappedgl.js"
@import "modules/utilities.js"
@import "modules/rectangle.js"
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
		this.els = {
			doc: $(document),
			content: window.find("content"),
			wrapper: window.find(".wrapper"),
		};
		// append canvas to workarea
		this.els.cvs = this.els.wrapper.append(canvas);

		// bind event handlers
		this.els.content.on("mousedown mousemove", this.cvsDnD);
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
			// custom events
			case "open-help":
				defiant.shell("fs -u '~/help/index.md'");
				break;
		}
	},
	cvsDnD(event) {
		let Self = fluidpaint,
			Drag = Self.drag;
		switch (event.type) {
			case "mousedown":
				painter.interactionState = InteractionMode.PAINTING;
				painter.saveSnapshot();
				// bind event
				Self.els.doc.on("mouseup", Self.cvsDnD);
				break;
			case "mousemove":
				let pos = Utilities.getMousePosition(event, Self.els.cvs[0]),
					mX = pos.x,
					mY = Self.els.cvs[0].height - pos.y;
				
				painter.brushX = mX;
				painter.brushY = mY;

				if (!painter.brushInitialized) {
					painter.brush.initialize(mX, mY, BRUSH_HEIGHT * painter.brushScale, painter.brushScale);
					painter.brushInitialized = true;
				}
				break;
			case "mouseup":
				painter.interactionState = InteractionMode.NONE;
				// unbind event
				Self.els.doc.off("mouseup", Self.cvsDnD);
				break;
		}
	}
};

window.exports = fluidpaint;
