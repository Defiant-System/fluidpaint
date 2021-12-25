
@import "classes/splatArea.js"
@import "classes/snapshot.js"
@import "classes/painter.js"
@import "classes/brush.js"
@import "classes/colorPicker.js"
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
	painter = new Painter(canvas, wgl),
	picker;


const goya = {
	init() {
		// fast references
		window.find(".wrapper").append(canvas);
		let cvsEl = window.find(".sidebar .picker canvas");
		picker = new ColorPicker(cvsEl, painter, wgl);

		// init all sub-objects
		Object.keys(this)
			.filter(i => typeof this[i].init === "function")
			.map(i => this[i].init());
	},
	dispatch(event) {
		let Self = goya,
			name,
			value,
			pEl,
			el;
		// console.log(event);
		switch (event.type) {
			// system events
			case "window.open":
				break;
			// custom events
			case "open-help":
				defiant.shell("fs -u '~/help/index.md'");
				break;
			case "history-undo": painter.undo(); break;
			case "history-redo": painter.redo(); break;
			case "clear": painter.clear(); break;
			case "save": painter.save(); break;
			// forwards events
			case "toggle-sidebar":
				return Self.sidebar.dispatch(event);
			default:
				el = event.el || (event.origin && event.origin.el);
				if (el) {
					pEl = el.data("area") ? el : el.parents("[data-area]");
					name = pEl.data("area");
					if (pEl.length) {
						if (Self[name] && Self[name].dispatch) {
							return Self[name].dispatch(event);
						}
						if (Self.tools[name].dispatch) {
							return Self.tools[name].dispatch(event);
						}
					}
				}
		}
	},
	sidebar: @import "sidebar/sidebar.js"
};

window.exports = goya;
