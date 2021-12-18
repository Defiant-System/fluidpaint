
@import "modules/wrappedgl.js"
@import "modules/utilities.js"
@import "modules/rectangle.js"
@import "modules/brush.js"
@import "modules/simulator.js"
@import "modules/colorpicker.js"
@import "modules/slider.js"
@import "modules/buttons.js"
@import "modules/paint.js"


const fluidpaint = {
	init() {
		// fast references
		this.content = window.find("content");
	},
	dispatch(event) {
		switch (event.type) {
			case "window.open":
				break;
			case "open-help":
				defiant.shell("fs -u '~/help/index.md'");
				break;
		}
	}
};

window.exports = fluidpaint;
