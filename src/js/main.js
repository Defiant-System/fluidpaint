
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
@import "classes/splatArea.js"
@import "classes/snapshot.js"
@import "classes/painter.js"
@import "classes/brush.js"
@import "classes/rectangle.js"
@import "classes/simulator.js"

@import "classes/state.js"
@import "classes/drawState.js"
@import "classes/clearState.js"
@import "classes/readState.js"
@import "classes/wrappedProgram.js"
@import "classes/wrappedgl.js"


@import "modules/color.js"
@import "modules/utilities.js"


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
	}
};

window.exports = fluidpaint;
