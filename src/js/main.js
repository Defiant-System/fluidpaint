
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

		let cvsEl = window.find(".sidebar .picker canvas");
		picker = new ColorPicker(cvsEl, painter, wgl);

		// let tmp = "#ff0000";
		// console.log( Color.hexToHsv(tmp) );

		// temp
		this.els.content.find(".palette span:nth-child(1)").trigger("click");
	},
	dispatch(event) {
		let Self = fluidpaint,
			value,
			index,
			pEl,
			el;
		switch (event.type) {
			// system events
			case "window.open":
				break;
			// custom events
			case "open-help":
				defiant.shell("fs -u '~/help/index.md'");
				break;
			case "select-tab":
				event.el.find(".active").removeClass("active");
				el = $(event.target).addClass("active");
				
				pEl = event.el.parent();
				pEl.find(".sidebar-body.active").removeClass("active");
				pEl.find(".sidebar-body").get(el.index()).addClass("active");
				break;
			case "select-color":
				if (event.el[0] === event.target) return;

				event.el.find(".active").removeClass("active");
				el = $(event.target).addClass("active");
				value = "#"+ el.attr("style").split("#")[1].slice(0,6);
				value = Color.hexToHsv(value);
				// value[0] = 1-value[0];

				painter.brushColorHSVA = value;
				picker.draw();
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
