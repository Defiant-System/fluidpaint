
@import "../../public/js/bundle.min.js"

@import "classes/painter.js"
@import "classes/simulator.js"
@import "classes/wrappedgl.js"

@import "modules/ui.js"
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
			content: window.find("content"),
			blankView: window.find(".blank-view"),
			easel: window.find(".easel"),
			pickerCvs: window.find(".sidebar .picker canvas"),
		};
		// insert main canvas to workarea
		this.els.easel.find(".fl-2").append(STUDIO.canvas);
		// init sidebar color picker
		STUDIO.picker = new ColorPicker(this.els.pickerCvs, STUDIO.painter, STUDIO.wgl);
		// auto init
		Files.init();
		// init all sub-objects
		Object.keys(this)
			.filter(i => typeof this[i].init === "function")
			.map(i => this[i].init());

		setTimeout(() => {
			// window.find(`.toolbar-tool_[data-arg="resize"]`).trigger("click");
			window.find(".preset:nth(3)").trigger("click");
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
			case "window.init":
				// reset app by default - show initial view
				Self.dispatch({ type: "reset-app" });
				break;
			case "open.file":
				// open file
				event.open({ responseType: "blob" })
					.then(file => {
						Self.dispatch({ type: "setup-workspace" });
						Files.open(file);
					});
				break;
			// custom events
			case "reset-app":
				// render blank view
				window.render({
					template: "blank-view",
					match: `//Data`,
					target: this.els.blankView
				});
				// show blank view
				Self.els.content.addClass("show-blank-view");
				break;
			case "setup-workspace":
				// hide blank view
				Self.els.content.removeClass("show-blank-view");
				// fix toolbar
				Self.dispatch({ type: "enable-toolbar-tools", tools: ["select-tool", "toggle-sidebar"] });
				window.find(`.toolbar-tool_[data-arg="brush"]`).trigger("click");
				if (!Self.els.content.hasClass("show-sidebar")) {
					window.find(`.toolbar-tool_[data-click="toggle-sidebar"]`).trigger("click");
				}
				break;
			case "open-filesystem":
				window.dialog.open({
					jpg: item => Self.dispatch(item),
					jpeg: item => Self.dispatch(item),
					png: item => Self.dispatch(item),
				});
				break;
			case "from-clipboard":
				// TODO
				break;
			case "select-preset":
				el = $(event.target);
				if (!el.hasClass("preset")) return;

				// window.tabs.add("test");

				value = {
					bg: el.data("bg"),
					width: +el.data("width"),
					height: +el.data("height"),
				};
				Self.dispatch({ type: "new-file", value });
				break;
			case "select-recent-file":
				el = $(event.target);
				if (!el.hasClass("recent-file")) return;
				
				defiant.shell(`fs -o '${el.data("file")}' null`)
					.then(exec => Self.dispatch(exec.result));
				break;
			case "new-file":
				value = event.value || { width: 600, height: 400, bg: "#f1f1f1" };
				Self.els.easel.find(".file-layers").css(value);

				// set-canvas background color
				Self.els.easel.find(".fl-1").css({ background: value.bg });
				Self.dispatch({ type: "setup-workspace" });
				
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
			// toolbar related
			case "enable-toolbar-tools":
				window.find(".toolbar-tool_").map(tool => {
					let el = $(tool),
						isDisabled = el.data("disabled") || true;
					if (isDisabled && !event.tools.includes(el.data("click"))) el.addClass("tool-disabled_");
					else el.removeClass("tool-disabled_");
				});
				break;
			case "diable-toolbar-tools":
				window.find(".toolbar-tool_").map(tool => {
					let el = $(tool);
					el.data({ disabled: el.hasClass("tool-disabled_") })
						.addClass("tool-disabled_");
				});
				break;
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
