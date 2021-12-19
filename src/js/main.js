
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
		this.cvs = this.content.append(canvas);

		this.dispatch({ type: "window.resize" });
	},
	dispatch(event) {
		let Self = fluidpaint,
			el;
		switch (event.type) {
			case "window.open":
				break;
			case "window.resize":
				// canvas
				Self.cvs.prop({ width: window.innerWidth, height: window.innerHeight });
				break;
			case "open-help":
				defiant.shell("fs -u '~/help/index.md'");
				break;
		}
	}
};

window.exports = fluidpaint;
