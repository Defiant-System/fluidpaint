
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

@import "modules/variables.js"
@import "modules/utilities.js"
@import "modules/color.js"


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
			case "history-undo":
				painter.undo();
				break;
			case "history-redo":
				painter.redo();
				break;
			case "clear":
				painter.clear();
				break;
			case "save":
				painter.save();
				break;
		}
	}
};

window.exports = fluidpaint;
