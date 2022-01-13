
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

@import "modules/files.js"
@import "classes/file.js"


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
		window.find(".easel .fl-3").append(STUDIO.canvas);
		let cvsEl = window.find(".sidebar .picker canvas");
		STUDIO.picker = new ColorPicker(cvsEl, STUDIO.painter, STUDIO.wgl);

		// auto init
		Files.init();

		// init all sub-objects
		Object.keys(this)
			.filter(i => typeof this[i].init === "function")
			.map(i => this[i].init());

		/*
		setTimeout(() => {
			this.dispatch({ type: "load-image", src: "~/sample-files/blue-rose.jpg" });
		// 	STUDIO.painter.resize({ width: 540, height: 380 });
		// 	STUDIO.painter.simulator.resize(540, 380);
		}, 500);
		*/
	},
	dispatch(event) {
		let Self = goya,
			Paint = STUDIO.painter,
			file = Files.activeFile,
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
					sim = Paint.simulator,
					texture = wgl.buildTexture(wgl.RGBA, wgl.UNSIGNED_BYTE, 0, 0, null, wgl.CLAMP_TO_EDGE, wgl.CLAMP_TO_EDGE, wgl.NEAREST, wgl.NEAREST);
				
				img.onload = () => {
					wgl.texImage2D(wgl.TEXTURE_2D, texture, 0, wgl.RGBA, wgl.RGBA, wgl.UNSIGNED_BYTE, img);

					// console.log( sim.resolutionWidth, sim.resolutionHeight );
					let dim = {
							bottom: 40,
							left: 40,
							width: img.width,
							height: img.height,
						};

					sim.applyPaintTexture(texture, dim);
					Paint.needsRedraw = true;
					Paint.update();
				};
				img.src = event.src;
				break;
			case "open.file":
				event.open({ responseType: "blob" })
					.then(file => Files.open(file));
				break;
			case "save-file-as":
				// pass on available file types
				window.dialog.saveAs(file._file, {
					png: () => file.toBlob("image/png"),
					jpg: () => file.toBlob("image/jpeg", .95),
					webp: () => file.toBlob("image/webp"),
				});
				break;
			case "history-undo": Paint.undo(); break;
			case "history-redo": Paint.redo(); break;
			case "clear": Paint.clear(); break;
			case "save": Paint.save(); break;
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
