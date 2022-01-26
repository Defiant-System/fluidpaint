
@import "../../public/js/bundle.min.js"

@import "classes/painter.js"
@import "classes/simulator.js"
@import "classes/wrappedgl.js"
@import "modules/utilities.js"

@import "modules/files.js"
@import "classes/file.js"


let canvas = document.createElement('canvas'),
	STUDIO = { canvas };
STUDIO.wgl = WrappedGL.create(canvas);
STUDIO.painter = new Painter(canvas, STUDIO.wgl);



const goya = {
	init() {
		// fast references
		this.els = {
			easel: window.find(".easel"),
			pickerCvs: window.find(".sidebar .picker canvas"),
		};
		// insert main canvas to workarea
		this.els.easel.find(".fl-3").append(STUDIO.canvas);
		// init sidebar color picker
		STUDIO.picker = new ColorPicker(this.els.pickerCvs, STUDIO.painter, STUDIO.wgl);
		// auto init
		Files.init();
		// init all sub-objects
		Object.keys(this)
			.filter(i => typeof this[i].init === "function")
			.map(i => this[i].init());

		// new file by default
		// this.dispatch({ type: "new-file" });

		// setTimeout(() => {
		// 	window.find(`.toolbar-tool_[data-arg="resize"]`).trigger("click");
		// }, 500);
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
			case "open.file":
				return this.dispatch({ type: "new-file" });
				
				event.open({ responseType: "blob" })
					.then(file => Files.open(file));
				break;
			// custom events
			case "new-file":
				value = { width: 600, height: 400 };
				Self.els.easel.find(".file-layers").css(value);

				// Self.els.easel.find(".fl-1").css({ background: "#f1f1f1" });
				
				STUDIO.painter.simulator.resize(value.width, value.height);
				STUDIO.painter.resize(value);
				STUDIO.painter.needsRedraw = true;
				STUDIO.painter.update();
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
