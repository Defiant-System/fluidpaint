
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
@import "modules/ui.js"



const STUDIO = {
		canvas: document.createElement('canvas'),
	};
STUDIO.canvas.width = 640;
STUDIO.canvas.height = 480;
STUDIO.wgl = WrappedGL.create(STUDIO.canvas);
STUDIO.painter = new Painter(STUDIO.canvas, STUDIO.wgl);


const goya = {
	init() {
		// insert main canvas to workarea
		window.find(".easel").append(STUDIO.canvas);
		let cvsEl = window.find(".sidebar .picker canvas");
		STUDIO.picker = new ColorPicker(cvsEl, STUDIO.painter, STUDIO.wgl);

		// init all sub-objects
		Object.keys(this)
			.filter(i => typeof this[i].init === "function")
			.map(i => this[i].init());

		setTimeout(() => {
			this.dispatch({ type: "load-image" });
		}, 100);
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
			case "load-image":
				
				let img = new Image(),
					wgl = STUDIO.wgl,
					gl = wgl.gl,
					painter = STUDIO.painter;

				let texture = wgl.buildTexture(wgl.RGBA, wgl.UNSIGNED_BYTE, 1, 1, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.NEAREST, wgl.NEAREST);

				// let texture = gl.createTexture();
				// gl.bindTexture(gl.TEXTURE_2D, texture);
				// gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));

				img.onload = () => {
					gl.bindTexture(gl.TEXTURE_2D, texture);
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

					painter.simulator.applyPaintTexture(texture);
					painter.needsRedraw = true;
					painter.update();
				};
				img.src = "~/img/lotus.jpg";

				break;
			case "history-undo": STUDIO.painter.undo(); break;
			case "history-redo": STUDIO.painter.redo(); break;
			case "clear": STUDIO.painter.clear(); break;
			case "save": STUDIO.painter.save(); break;
			// forwards events
			case "select-tool":
				return Self.tools.dispatch(event);
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
	sidebar: @import "sidebar/sidebar.js",
	tools: @import "tools/tools.js"
};

window.exports = goya;
