
// goya.tools

{
	init() {
		// init all sub-objects
		Object.keys(this)
			.filter(i => typeof this[i].init === "function")
			.map(i => this[i].init());
		// initial tool
		this.dispatch({ type: "select-tool", arg: "brush" });

		setTimeout(() => {
			window.find(`.toolbar-tool_[data-arg="resize"]`).trigger("click");
		}, 2000);
	},
	dispatch(event) {
		let APP = goya,
			Self = APP.tools,
			el;
		// console.log(event);
		switch (event.type) {
			case "select-tool":
				if (Self._active) {
					Self[Self._active].dispatch({ type: "blur-tool" });
				}
				Self[event.arg].dispatch({ type: "focus-tool" });
				Self._active = event.arg;
				return true;
			default:
				return Self[Self._active].dispatch(event);
		}
	},
	pan: @import "./pan.js",
	brush: @import "./brush.js",
	resize: @import "./resize.js",
}