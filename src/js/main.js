
@import "modules/bundle.min.js"

@import "modules/utilities.js"
@import "modules/color.js"
@import "modules/ui.js"
@import "modules/files.js"
@import "classes/file.js"


const STUDIO = {
		canvas: document.createElement('canvas'),
	};
// STUDIO.canvas.width = 100;
// STUDIO.canvas.height = 100;
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

		/**/
		setTimeout(() => {
			this.dispatch({ type: "new-file" });
		// 	STUDIO.painter.resize({ width: 540, height: 380 });
		// 	STUDIO.painter.simulator.resize(540, 380);
		}, 500);
		
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
			case "open.file":
				event.open({ responseType: "blob" })
					.then(file => Files.open(file));
				break;
			// custom events
			case "new-file":
				value = { width: 600, height: 400 };
				window.find(".file-layers").css(value);
				STUDIO.painter.resize({ ...value, simulatorResize: true });
				break;
			case "save-file":
				// create blob and save file
				file.toBlob(file._file.blob.type, .95)
					.then(blob => window.dialog.save(file._file, blob));
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
